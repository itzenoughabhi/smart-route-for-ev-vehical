import { io, Socket } from 'socket.io-client';
import { useDigitalTwinStore } from '../store/useDigitalTwinStore';

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== 'undefined') {
    if (window.location.port === '3000') return 'http://localhost:4000';
    return window.location.origin;
  }
  return 'http://localhost:4000';
};

const BACKEND_URL = getBackendUrl();

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  public connect() {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;

    console.log(`🔌 [SocketService] Connecting to EVNEXUS Boisar backend at ${BACKEND_URL}...`);

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ [SocketService] Connected to EVNEXUS live digital twin stream');
      useDigitalTwinStore.getState().setConnectionStatus(true);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ [SocketService] Disconnected from digital twin stream');
      useDigitalTwinStore.getState().setConnectionStatus(false);
    });

    this.socket.on('snapshot', (snapshot) => {
      useDigitalTwinStore.getState().setSnapshot(snapshot);
    });

    this.socket.on('state.tick', (tickData) => {
      useDigitalTwinStore.getState().updateTick(tickData);
    });

    this.socket.on('event.created', (event) => {
      useDigitalTwinStore.getState().addEvent(event);
    });

    this.socket.on('station.updated', (station) => {
      const { stations } = useDigitalTwinStore.getState();
      const updated = stations.map((s) => (s.id === station.id ? station : s));
      useDigitalTwinStore.setState({ stations: updated });
    });

    this.socket.on('vehicle.updated', (vehicle) => {
      const { vehicles } = useDigitalTwinStore.getState();
      const exists = vehicles.some((v) => v.id === vehicle.id);
      const updated = exists ? vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)) : [...vehicles, vehicle];
      useDigitalTwinStore.setState({ vehicles: updated });
    });

    this.socket.on('grid:update', (powerGrid) => {
      useDigitalTwinStore.setState({ powerGrid });
    });

    this.socket.on('rescue.updated', (rescueRequest) => {
      useDigitalTwinStore.getState().updateRescueRequest(rescueRequest);
    });

    this.socket.on('rescue.queue', (requests) => {
      useDigitalTwinStore.getState().setRescueRequests(requests);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[SocketService] Connection error:', err.message);
      this.isConnecting = false;
    });
  }

  public emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn(`[SocketService] Cannot emit "${event}": socket not connected`);
      return;
    }
    this.socket.emit(event, data);
  }

  public spawnVehicle() {
    this.emit('simulation:spawn');
  }

  public triggerFault(stationCode?: string, chargerCode?: string) {
    this.emit('simulation:fault', { stationCode, chargerCode });
  }

  public triggerEVFault(vehicleCode: string = 'EV-024') {
    this.emit('simulation:ev-fault', { vehicleCode });
  }

  public triggerLowBattery(vehicleCode: string = 'EV-024', pct: number = 18) {
    this.emit('simulation:low-battery', { vehicleCode, pct });
  }

  public setVehicleBattery(vehicleIdOrCode: string, batteryPct: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(batteryPct)));
    this.emit('vehicle:set-battery', { id: vehicleIdOrCode, vehicleCode: vehicleIdOrCode, batteryPct: clamped });
    // Also dispatch fallback REST call for robust dual-channel sync
    try {
      fetch('http://localhost:4000/api/simulation/vehicle-battery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicleIdOrCode, batteryPct: clamped }),
      }).catch(() => {});
    } catch {}
  }

  public triggerEnergySurge(active: boolean = true) {
    this.emit('simulation:surge', { active });
  }

  public sendToService(vehicleId: string = 'veh-ev-024') {
    this.emit('simulation:service-route', { vehicleId });
  }

  public completeRepair(vehicleCode: string = 'EV-024') {
    this.emit('simulation:finish-repair', { vehicleCode });
  }

  public returnToRoad(vehicleCode: string = 'EV-024') {
    this.emit('simulation:return-to-road', { vehicleCode });
  }

  public towVehicle(vehicleId: string) {
    this.emit('vehicle:tow', { vehicleId });
  }

  public rerouteVehicle(vehicleId: string, targetStationId: string, customWaypoints?: any[]) {
    this.emit('simulation:reroute', { vehicleId, targetStationId, customWaypoints });
  }

  public repairFault(chargerCode?: string) {
    this.emit('simulation:repair', { chargerCode });
  }

  public createQueue(stationCode: string = 'A102') {
    this.emit('simulation:queue', { stationCode });
  }

  public completeCharging() {
    this.emit('simulation:complete');
  }

  public increaseLoad(stationCode: string = 'A102') {
    this.emit('simulation:load', { stationCode });
  }

  public resetSimulation() {
    this.emit('simulation:reset');
  }

  public setSpeed(multiplier: number) {
    this.emit('simulation:speed', multiplier);
    useDigitalTwinStore.getState().setSimulationSpeed(multiplier);
  }

  public resolveRecommendation(id: string, accept: boolean) {
    this.emit('recommendation:resolve', { id, accept });
    useDigitalTwinStore.getState().resolveRecommendationLocally(id, accept);
  }

  public async queryAiAssistant(query: string): Promise<any> {
    try {
      const primaryEndpoint = BACKEND_URL.startsWith('http') && !BACKEND_URL.includes(window?.location?.host || '')
        ? `${BACKEND_URL}/api/ai/query`
        : '/api/ai/query';

      let res = await fetch(primaryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('http://localhost:4000/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        }).catch(() => null);
      }

      if (res && res.ok) {
        return await res.json();
      }
      throw new Error(res ? `HTTP ${res.status}` : 'Fetch failed');
    } catch (err: any) {
      return {
        answer: `Offline AI Response: System is monitoring active grid telemetry. (Backend query error: ${err.message})`,
        confidence: 0.85,
      };
    }
  }

  public createRescueRequest(payload: any) {
    this.emit('rescue:create', payload);
  }

  public dispatchRescue() {
    this.emit('rescue:dispatch');
  }

  public completeRescue(requestId: string) {
    this.emit('rescue:complete', { requestId });
  }

  public simulateTwoStranded() {
    this.emit('rescue:simulate-two-stranded');
  }
}

export const socketService = new SocketService();
