import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { stationService } from '../modules/stations/station.service';
import { vehicleService, VehicleService } from '../modules/vehicles/vehicle.service';
import { energyService } from '../modules/energy/energy.service';
import { eventService } from '../modules/events/event.service';
import { aiService } from '../modules/ai/ai.service';
import { simulationEngine } from '../modules/simulation/simulation.engine';
import { trafficController } from '../modules/simulation/traffic.controller';
import { rescueService } from '../modules/rescue/rescue.service';
import { LiveEvent } from '../types';

export class WebSocketGateway {
  private io: SocketIOServer;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEvents();
    this.setupSimulationBridge();
  }

  private setupEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 [WebSocket] Client connected: ${socket.id}`);

      socket.emit('snapshot', this.getFullSnapshot());

      socket.on('simulation:spawn', () => {
        const v = vehicleService.spawnVehicle();
        this.broadcastVehicleUpdate(v);
      });

      socket.on('simulation:fault', (payload?: { stationCode?: string; chargerCode?: string }) => {
        const res = simulationEngine.triggerFault(payload?.stationCode, payload?.chargerCode);
        if (res?.station) {
          this.broadcastStationUpdate(res.station);
        }
      });

      socket.on('simulation:ev-fault', (payload?: { vehicleCode?: string }) => {
        const v = simulationEngine.triggerEVFault(payload?.vehicleCode || 'EV-024');
        if (v) this.broadcastVehicleUpdate(v);
      });

      socket.on('simulation:low-battery', (payload?: { vehicleCode?: string; pct?: number }) => {
        const v = simulationEngine.triggerLowBattery(payload?.vehicleCode || 'EV-024', payload?.pct || 18);
        if (v) this.broadcastVehicleUpdate(v);
      });

      socket.on('vehicle:set-battery', (payload?: { id?: string; vehicleCode?: string; batteryPct?: number; pct?: number }) => {
        const target = payload?.id || payload?.vehicleCode;
        const pct = payload?.batteryPct !== undefined ? payload.batteryPct : payload?.pct;
        if (!target || pct === undefined) return;
        const v = simulationEngine.setVehicleBattery(target, pct);
        if (v) {
          this.broadcastVehicleUpdate(v);
          this.io.emit('vehicles:all', vehicleService.getAllVehicles());
        }
      });

      socket.on('simulation:surge', (payload?: { active?: boolean }) => {
        const pg = simulationEngine.triggerEnergySurge(payload?.active ?? true);
        this.io.emit('grid:update', pg);
      });

      socket.on('simulation:repair', (payload?: { chargerCode?: string }) => {
        const res = simulationEngine.repairFault(payload?.chargerCode);
        if (res?.station) {
          this.broadcastStationUpdate(res.station);
        }
      });

      socket.on('simulation:service-route', (payload?: { vehicleId?: string }) => {
        const id = payload?.vehicleId || 'veh-ev-024';
        const ok = vehicleService.sendToService(id);
        if (ok) {
          const v = vehicleService.getVehicleById(id);
          if (v) {
            this.broadcastVehicleUpdate(v);
            this.io.emit('stations:all', stationService.getAllStations());
            this.io.emit('service:update', stationService.getServiceCenter());
          }
        }
      });

      socket.on('simulation:finish-repair', (payload?: { vehicleCode?: string }) => {
        const v = simulationEngine.completeActiveRepair(payload?.vehicleCode || 'EV-024');
        if (v) this.broadcastVehicleUpdate(v);
        this.io.emit('service:update', stationService.getServiceCenter());
      });

      socket.on('vehicle:update', (payload?: { id: string; speed?: number; status?: any; position?: { x: number; y: number; z: number }; heading?: number; batteryPct?: number; estimatedRangeKm?: number; driveMode?: 'ECO' | 'CITY' | 'SPORT' }) => {
        if (!payload?.id) return;
        const v = vehicleService.getVehicleById(payload.id);
        if (v) {
          if (payload.driveMode) v.driveMode = payload.driveMode;
          if (typeof payload.speed === 'number') v.speed = payload.speed;
          if (typeof payload.heading === 'number') v.heading = payload.heading;
          if (payload.position && typeof payload.position.x === 'number' && typeof payload.position.z === 'number') {
            v.position = { x: payload.position.x, y: 0.04, z: payload.position.z };
          }
          const bPct = typeof payload.batteryPct === 'number' ? payload.batteryPct : (typeof (payload as any)?.currentBatteryPct === 'number' ? (payload as any).currentBatteryPct : undefined);
          if (typeof bPct === 'number') {
            v.currentBatteryPct = bPct;
            v.estimatedRangeKm = payload.estimatedRangeKm ?? Math.round((v.currentBatteryPct / 100) * 380);
          }
          if (payload.status) {
            v.status = payload.status;
            if (payload.status === 'EN_ROUTE') {
              v.trafficState = 'CRUISING';
              if (typeof payload.speed === 'number' && payload.speed > 0) {
                v.speed = payload.speed;
              } else if (v.speed <= 0) {
                v.speed = v.driveMode === 'SPORT' ? 95 : v.driveMode === 'CITY' ? 60 : 42;
              }
              if (v.assignedChargerId) {
                stationService.releaseChargerByVehicle(v.id);
                v.assignedChargerId = null;
                v.currentStationId = null;
                this.io.emit('stations:all', stationService.getAllStations());
              }
              if (v.serviceCenterId) {
                stationService.releaseServiceBay(v.id);
                v.serviceCenterId = null;
                this.io.emit('service:update', stationService.getServiceCenter());
              }
              if (!v.routeWaypoints || v.routeWaypoints.length < 2) {
                const target = stationService.getAllStations()[0];
                v.routeWaypoints = VehicleService.getRouteForStation(target.code, v.position, v.heading);
                v.currentWaypointIndex = 0;
              }
            } else if (payload.status === 'PAUSED') {
              v.speed = 0;
              v.trafficState = 'STOPPED';
            }
          } else if (payload.speed === 0) {
            v.status = 'PAUSED';
            v.trafficState = 'STOPPED';
          }
          this.broadcastVehicleUpdate(v);
        }
      });

      socket.on('vehicle:dock', (payload?: { vehicleId: string; stationId: string; chargerId: string }) => {
        if (!payload?.stationId || !payload?.chargerId) return;
        const station = stationService.getStationById(payload.stationId);
        if (station) {
          const charger = station.chargers.find(c => c.id === payload.chargerId);
          if (charger) {
            charger.status = 'CHARGING';
            charger.currentEvId = payload.vehicleId;
            charger.currentPowerKw = charger.powerKw === 350 ? 220 : 120;
            stationService.recomputeStationMetrics(station);
            this.broadcastStationUpdate(station);

            if (payload.vehicleId) {
              const v = vehicleService.getVehicleById(payload.vehicleId);
              if (v) {
                v.status = 'CHARGING';
                v.currentStationId = payload.stationId;
                v.assignedChargerId = payload.chargerId;
                v.chargingRateKw = charger.currentPowerKw;
                v.speed = 0;
                this.broadcastVehicleUpdate(v);
              }
            }
          }
        }
      });

      socket.on('vehicle:undock', (payload?: { vehicleId: string; stationId: string; chargerId?: string }) => {
        if (!payload?.stationId) return;
        const station = stationService.getStationById(payload.stationId);
        if (station) {
          const charger = station.chargers.find(c => c.id === payload.chargerId || c.currentEvId === payload.vehicleId);
          if (charger) {
            charger.status = 'AVAILABLE';
            charger.currentEvId = null;
            charger.currentPowerKw = 0;
            stationService.recomputeStationMetrics(station);
            this.broadcastStationUpdate(station);

            if (payload.vehicleId) {
              const v = vehicleService.getVehicleById(payload.vehicleId);
              if (v) {
                v.status = 'EN_ROUTE';
                v.assignedChargerId = null;
                v.currentStationId = null;
                v.chargingRateKw = 0;
                v.speed = 20;
                this.broadcastVehicleUpdate(v);
              }
            }
          }
        }
      });

      socket.on('simulation:return-to-road', (payload?: { vehicleCode?: string; vehicleId?: string }) => {
        const identifier = payload?.vehicleId || payload?.vehicleCode || 'EV-024';
        const v = simulationEngine.returnToRoad(identifier);
        if (v) {
          this.broadcastVehicleUpdate(v);
          this.io.emit('stations:all', stationService.getAllStations());
          this.io.emit('service:update', stationService.getServiceCenter());
        }
      });

      socket.on('vehicle:tow', (payload?: { vehicleId: string }) => {
        if (!payload?.vehicleId) return;
        const res = simulationEngine.towVehicleToNearestStation(payload.vehicleId);
        if (res) {
          this.broadcastVehicleUpdate(res.strandedVehicle);
          this.broadcastVehicleUpdate(res.towVehicle);
          this.io.emit('stations:all', stationService.getAllStations());
        }
      });

      socket.on('simulation:reroute', (payload: { vehicleId: string; targetStationId: string; customWaypoints?: any[] }) => {
        const ok = vehicleService.redirectVehicle(payload.vehicleId, payload.targetStationId, payload.customWaypoints);
        if (ok) {
          const v = vehicleService.getVehicleById(payload.vehicleId);
          if (v) {
            this.broadcastVehicleUpdate(v);
            this.io.emit('stations:all', stationService.getAllStations());
          }
        }
      });

      socket.on('simulation:load', (payload?: { stationCode?: string }) => {
        simulationEngine.triggerFault(payload?.stationCode);
        this.io.emit('stations:all', stationService.getAllStations());
      });

      socket.on('simulation:speed', (multiplier: number) => {
        simulationEngine.setSpeed(multiplier);
        this.io.emit('simulation:speed', multiplier);
      });

      socket.on('simulation:reset', () => {
        simulationEngine.resetSimulation();
        this.io.emit('snapshot', this.getFullSnapshot());
      });

      socket.on('recommendation:resolve', (data: { id: string; accept: boolean }) => {
        aiService.resolveRecommendation(data.id, data.accept);
        this.io.emit('recommendations', aiService.getPendingRecommendations());
      });

      socket.on('rescue:create', (payload: any) => {
        try {
          const req = rescueService.createRequest(payload);
          this.broadcastRescueUpdate(req);
          this.broadcastRescueQueue(rescueService.getAllRequests());
        } catch (err: any) {
          socket.emit('rescue:error', { message: err.message });
        }
      });

      socket.on('rescue:dispatch', () => {
        rescueService.evaluateAndDispatchQueue();
        this.broadcastRescueQueue(rescueService.getAllRequests());
      });

      socket.on('rescue:complete', (payload: { requestId: string }) => {
        const req = rescueService.completeRescue(payload.requestId);
        if (req) {
          this.broadcastRescueUpdate(req);
          this.broadcastRescueQueue(rescueService.getAllRequests());
        }
      });

      socket.on('rescue:simulate-two-stranded', () => {
        rescueService.triggerTwoStrandedEvScenario();
        this.broadcastRescueQueue(rescueService.getAllRequests());
      });

      socket.on('disconnect', () => {
        console.log(`❌ [WebSocket] Client disconnected: ${socket.id}`);
      });
    });

    eventService.onNewEvent((event: LiveEvent) => {
      this.io.emit('event.created', event);
    });
  }

  private setupSimulationBridge() {
    simulationEngine.onTick((tickData) => {
      const stations = stationService.getAllStations();
      const vehicles = vehicleService.getAllVehicles();

      this.io.emit('state.tick', {
        tick: tickData.tick,
        stations,
        vehicles,
        trafficSignals: tickData.trafficSignals || trafficController.getAllSignals(),
        kpis: tickData.kpis,
        energy: tickData.energy,
        powerGrid: tickData.powerGrid,
        serviceCenter: tickData.serviceCenter,
        homeChargers: tickData.homeChargers,
        recommendation: tickData.recommendation,
        scenarioStep: tickData.scenarioStep,
      });
    });
  }

  public getFullSnapshot() {
    return {
      stations: stationService.getAllStations(),
      vehicles: vehicleService.getAllVehicles(),
      trafficSignals: trafficController.getAllSignals(),
      kpis: energyService.getKPIs(),
      energy: energyService.getEnergyMetrics(),
      powerGrid: energyService.getPowerGrid(),
      serviceCenter: stationService.getServiceCenter(),
      homeChargers: stationService.getAllHomeChargers(),
      events: eventService.getEvents(25),
      recommendations: aiService.getPendingRecommendations(),
      rescueRequests: rescueService.getAllRequests(),
      simulation: {
        isRunning: simulationEngine.isEngineRunning(),
        speed: simulationEngine.getSpeed(),
      },
    };
  }

  public broadcastStationUpdate(station: any) {
    this.io.emit('station.updated', station);
  }

  public broadcastVehicleUpdate(vehicle: any) {
    this.io.emit('vehicle.updated', vehicle);
  }

  public broadcastRescueUpdate(rescueRequest: any) {
    this.io.emit('rescue.updated', rescueRequest);
  }

  public broadcastRescueQueue(requests: any[]) {
    this.io.emit('rescue.queue', requests);
  }
}
