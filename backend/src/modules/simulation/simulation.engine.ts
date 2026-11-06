import { stationService } from '../stations/station.service';
import { vehicleService, VehicleService, REGIONAL_CORRIDORS } from '../vehicles/vehicle.service';
import { energyService } from '../energy/energy.service';
import { eventService } from '../events/event.service';
import { aiService } from '../ai/ai.service';
import { trafficController } from './traffic.controller';
import { Vehicle, Station } from '../../types';

export function getBayOffset(idx: number, totalChargers: number = 4): number {
  if (totalChargers <= 4) {
    const offsets = [-3.6, -1.2, 1.2, 3.6];
    return offsets[idx] ?? (idx * 2.4 - (totalChargers - 1) * 1.2);
  }
  const offsets = [-5.2, -3.1, -1.0, 1.0, 3.1, 5.2];
  return offsets[idx] ?? (idx * 2.1 - (totalChargers - 1) * 1.05);
}

export class SimulationEngine {
  private static instance: SimulationEngine;
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = true;
  private speedMultiplier: number = 1.0;
  private tickCount: number = 0;
  private onTickCallbacks: ((data: any) => void)[] = [];
  private vehicleStationaryTicks: Map<string, number> = new Map();
  private vehicleWaypointProgressTicks: Map<string, { index: number; ticks: number }> = new Map();
  private vehicleOvertakeStates: Map<string, {
    targetVehicleId: string;
    phase: 'PULL_OUT' | 'PASSING' | 'MERGE_BACK';
    lateralOffset: number;
    ticksInPhase: number;
  }> = new Map();

  public static readonly TICK_INTERVAL_MS = 100;
  public static readonly DT = 0.1;

  private scenarioStep: number = 0;

  private constructor() { }

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  public start() {
    if (this.intervalTimer) return;
    console.log('🚀 [Simulation Engine] Starting EVNEXUS Boisar Real-Time Digital Twin tick cycle (10Hz high-resolution)...');
    this.intervalTimer = setInterval(() => {
      if (this.isRunning) {
        this.step();
      }
    }, SimulationEngine.TICK_INTERVAL_MS);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier = Math.max(0, Math.min(10, multiplier));
    this.isRunning = multiplier > 0;
    eventService.addEvent({
      type: 'STATUS_CHANGE',
      severity: 'INFO',
      message: `Simulation speed set to ${this.speedMultiplier}x ${this.isRunning ? '' : '(PAUSED)'}`,
    });
  }

  public getSpeed(): number {
    return this.speedMultiplier;
  }

  public isEngineRunning(): boolean {
    return this.isRunning;
  }

  public onTick(cb: (data: any) => void) {
    this.onTickCallbacks.push(cb);
  }

  public step() {
    this.tickCount++;
    const stations = stationService.getAllStations();
    const vehicles = vehicleService.getAllVehicles();
    const sc = stationService.getServiceCenter();

    trafficController.update(SimulationEngine.DT * this.speedMultiplier);

    for (const vehicle of vehicles) {
      // Unfreeze any active EN_ROUTE vehicle with valid battery that was stalled at speed 0
      if (vehicle.status === 'EN_ROUTE' && vehicle.currentBatteryPct > 0 && vehicle.speed <= 0.1 && vehicle.trafficState !== 'STOPPED') {
        vehicle.speed = Math.floor(36 + Math.random() * 8);
        vehicle.trafficState = 'CRUISING';
      }
      this.processVehicleTick(vehicle, stations, sc);
    }

    if (this.tickCount % 10 === 0) {
      energyService.recordTick();
    }

    let newRecommendation = null;
    if (this.tickCount % 10 === 0) {
      newRecommendation = aiService.evaluateNetworkOptimization();
    }

    for (const bay of sc.bays) {
      if (bay.status === 'OCCUPIED' && bay.progressPct !== undefined && bay.progressPct < 100) {
        bay.progressPct = Math.min(100, Math.round(bay.progressPct + 4 * this.speedMultiplier * SimulationEngine.DT));
        if (bay.progressPct >= 100) {
          const v = vehicleService.getVehicleById(bay.vehicleId || '');
          if (v) {
            v.status = 'READY';
            v.vehicleHealth = 'GOOD';
            v.motorTemperatureC = 55;
            v.batteryTemperatureC = 29;
            v.faultReason = null;
            v.repairProgressPct = 100;
            v.repairStage = 'REPAIR_COMPLETE';
            eventService.addEvent({
              type: 'SERVICE',
              severity: 'SUCCESS',
              message: `✅ Repair completed on ${v.code} (${v.model}) in Bay #${bay.bayIndex + 1} — Ready to return to road`,
              vehicleId: v.id,
            });
          }
        }
      }
    }

    const payload = {
      tick: this.tickCount,
      trafficSignals: trafficController.getAllSignals(),
      kpis: energyService.getKPIs(),
      energy: energyService.getEnergyMetrics(),
      powerGrid: energyService.getPowerGrid(),
      serviceCenter: sc,
      homeChargers: stationService.getAllHomeChargers(),
      recommendation: newRecommendation,
      scenarioStep: this.scenarioStep,
    };

    this.onTickCallbacks.forEach(cb => cb(payload));
  }

  private processVehicleTick(vehicle: Vehicle, stations: Station[], serviceCenter: any) {
    const destinationStation = stations.find(s => s.id === vehicle.destinationStationId);

    switch (vehicle.status) {
      case 'PAUSED': {
        vehicle.speed = 0;
        vehicle.trafficState = 'STOPPED';
        break;
      }

      case 'MANUAL_DRIVE': {
        if (vehicle.speed > 0) {
          const drain = (vehicle.speed * 0.0018) * this.speedMultiplier * SimulationEngine.DT;
          vehicle.currentBatteryPct = Math.max(0, vehicle.currentBatteryPct - drain);
          const maxRange = vehicle.batteryCapacityKwh ? vehicle.batteryCapacityKwh * 7.0 : 380;
          vehicle.estimatedRangeKm = vehicle.currentBatteryPct <= 0 ? 0 : Math.max(1, Math.round((vehicle.currentBatteryPct / 100) * maxRange));
        }
        if (vehicle.currentBatteryPct <= 0) {
          vehicle.currentBatteryPct = 0;
          vehicle.estimatedRangeKm = 0;
          vehicle.speed = 0;
          vehicle.status = 'STRANDED';
          vehicle.trafficState = 'STOPPED';
          vehicle.vehicleHealth = 'CRITICAL';
          if (!(vehicle as any)._isPulledOver) {
            const shoulderAngle = (vehicle.heading || 0) + Math.PI / 2;
            vehicle.position.x += Math.sin(shoulderAngle) * 4.8;
            vehicle.position.z += Math.cos(shoulderAngle) * 4.8;
            (vehicle as any)._isPulledOver = true;
          }
          vehicle.currentLocationName = `Roadside Shoulder (0% Battery Depleted — Pulled Over)`;
        }
        break;
      }

      case 'STRANDED': {
        vehicle.speed = 0;
        vehicle.trafficState = 'STOPPED';
        vehicle.currentBatteryPct = 0;
        vehicle.estimatedRangeKm = 0;
        vehicle.vehicleHealth = 'CRITICAL';
        if (!(vehicle as any)._isPulledOver) {
          const shoulderAngle = (vehicle.heading || 0) + Math.PI / 2;
          vehicle.position.x += Math.sin(shoulderAngle) * 4.8;
          vehicle.position.z += Math.cos(shoulderAngle) * 4.8;
          (vehicle as any)._isPulledOver = true;
          vehicle.currentLocationName = `Roadside Shoulder (0% Battery Depleted — Pulled Over)`;
        }
        break;
      }

      case 'BEING_TOWED': {
        if (vehicle.towedByVehicleId) {
          const towVehicle = vehicleService.getVehicleById(vehicle.towedByVehicleId);
          if (towVehicle) {
            const towingState = (towVehicle as any)._towingState;
            if (towingState && towingState.phase === 'TOWING_TO_STATION') {
              // Hitched behind tow truck
              vehicle.speed = towVehicle.speed;
              vehicle.heading = towVehicle.heading;
              vehicle.position.x = Number((towVehicle.position.x - Math.sin(towVehicle.heading) * 4.6).toFixed(2));
              vehicle.position.z = Number((towVehicle.position.z - Math.cos(towVehicle.heading) * 4.6).toFixed(2));
              vehicle.position.y = towVehicle.position.y || 0.04;
              vehicle.currentLocationName = `Towed by ${towVehicle.code} to ${destinationStation?.name || 'Nearest Charging Station'}`;
            } else {
              vehicle.speed = 0;
              vehicle.trafficState = 'STOPPED';
            }
          }
        }
        break;
      }

      case 'EN_ROUTE': {
        // If trafficState was marked STOPPED from a temporary halt, allow it to resume if battery > 0
        if (vehicle.trafficState === 'STOPPED' && vehicle.currentBatteryPct > 0) {
          vehicle.trafficState = 'CRUISING';
        }

        const waypoints = vehicle.routeWaypoints;
        if (!waypoints || waypoints.length === 0) break;

        while (vehicle.currentWaypointIndex < waypoints.length - 1) {
          const wp = waypoints[vehicle.currentWaypointIndex];
          const nextWp = waypoints[vehicle.currentWaypointIndex + 1];
          const wdx = wp.x - vehicle.position.x;
          const wdz = wp.z - vehicle.position.z;
          const wdist = Math.hypot(wdx, wdz);
          const fX = Math.sin(vehicle.heading || 0);
          const fZ = Math.cos(vehicle.heading || 0);
          const dot = wdx * fX + wdz * fZ; // positive = waypoint is ahead, negative = waypoint is behind

          const nextDx = nextWp.x - vehicle.position.x;
          const nextDz = nextWp.z - vehicle.position.z;
          const nextDist = Math.hypot(nextDx, nextDz);
          const nextDot = nextDx * fX + nextDz * fZ;

          const segX = nextWp.x - wp.x;
          const segZ = nextWp.z - wp.z;
          const segLenSq = segX * segX + segZ * segZ;
          let projT = 0;
          if (segLenSq > 0.01) {
            projT = ((vehicle.position.x - wp.x) * segX + (vehicle.position.z - wp.z) * segZ) / segLenSq;
          }

          // Advance if:
          // 1. Within arrival radius of waypoint
          // 2. Waypoint is behind vehicle's heading (dot < -0.1)
          // 3. Vehicle has progressed past wp along the segment (projT > 0.70)
          // 4. Next waypoint is closer than current waypoint AND next waypoint is not behind vehicle
          if (
            wdist < 2.2 ||
            dot < -0.1 ||
            projT > 0.70 ||
            (nextDist < wdist && nextDot > -0.6)
          ) {
            vehicle.currentWaypointIndex++;
          } else {
            break;
          }
        }

        // Proactive forward scan: If vehicle has overshot or drifted, advance to closest forward waypoint
        let bestAheadIdx = vehicle.currentWaypointIndex;
        let bestAheadDist = Math.hypot(waypoints[vehicle.currentWaypointIndex].x - vehicle.position.x, waypoints[vehicle.currentWaypointIndex].z - vehicle.position.z);
        const maxScan = Math.min(waypoints.length - 1, vehicle.currentWaypointIndex + 8);
        for (let sIdx = vehicle.currentWaypointIndex + 1; sIdx <= maxScan; sIdx++) {
          const sWp = waypoints[sIdx];
          const sDx = sWp.x - vehicle.position.x;
          const sDz = sWp.z - vehicle.position.z;
          const sDist = Math.hypot(sDx, sDz);
          const sDot = sDx * Math.sin(vehicle.heading || 0) + sDz * Math.cos(vehicle.heading || 0);
          if (sDist < bestAheadDist - 0.4 && sDot > -0.4) {
            bestAheadDist = sDist;
            bestAheadIdx = sIdx;
          }
        }
        if (bestAheadIdx > vehicle.currentWaypointIndex) {
          vehicle.currentWaypointIndex = bestAheadIdx;
        }

        const targetWp = waypoints[vehicle.currentWaypointIndex];
        if (!targetWp) {
          if (vehicle.serviceCenterId) {
            this.handleServiceCenterArrival(vehicle);
          } else {
            vehicle.status = 'ARRIVING';
          }
          break;
        }

        const dx = targetWp.x - vehicle.position.x;
        const dz = targetWp.z - vehicle.position.z;
        const dist = Math.hypot(dx, dz);

        const baseTargetSpeed = vehicle.driveMode === 'SPORT'
          ? 95
          : vehicle.driveMode === 'CITY'
          ? 60
          : vehicle.driveMode === 'ECO'
          ? 40
          : (vehicle.speed > 10 ? vehicle.speed : Math.floor(36 + Math.random() * 8));

        let effectiveSpeed = baseTargetSpeed;

        const allVehicles = vehicleService.getAllVehicles();
        const fX = Math.sin(vehicle.heading || 0);
        const fZ = Math.cos(vehicle.heading || 0);

        const getVehicleHalfLength = (model: string) => {
          if (model === 'Electric City Bus' || model === 'Heavy Electric Hauler') return 4.8;
          if (model === 'Commercial EV Van' || model === 'Electric Pickup Truck') return 3.2;
          if (model === 'CyberSedan' || model === 'Tesla Model Y') return 2.6;
          return 2.4;
        };

        const myHalfLength = getVehicleHalfLength(vehicle.model);
        let hasObstacleAhead = false;

        let overtakeState = this.vehicleOvertakeStates.get(vehicle.id);

        for (const other of allVehicles) {
          if (other.id === vehicle.id) continue;

          // Ignore vehicles that are pulled over on the shoulder or docked inside charging bays
          if (
            other.status === 'STRANDED' ||
            (other as any)._isPulledOver ||
            other.status === 'BEING_TOWED' ||
            other.status === 'CHARGING' ||
            other.status === 'QUEUE' ||
            other.status === 'UNDER_REPAIR'
          ) {
            continue;
          }

          const toOtherX = other.position.x - vehicle.position.x;
          const toOtherZ = other.position.z - vehicle.position.z;
          const distToOther = Math.hypot(toOtherX, toOtherZ);

          const otherHalfLength = getVehicleHalfLength(other.model);

          // Longitudinal distance along our heading vector (positive = ahead, negative = behind)
          const longDist = fX * toOtherX + fZ * toOtherZ;
          // Lateral distance perpendicular to our heading vector
          const latDist = Math.abs(-fZ * toOtherX + fX * toOtherZ);

          // Physical vehicle body half-widths are ~1.1m (total combined half-widths ~2.2m).
          // On a divided or 2-lane road (separation ~4.3m), vehicles with latDist > 2.2m are in separate lanes!
          const isInOurLane = latDist < 2.2;
          const isOvertakingThisLead = Boolean(overtakeState && overtakeState.targetVehicleId === other.id);

          // 1. HARD ANTI-OVERLAP: ONLY applies if vehicles are physically colliding
          if (isInOurLane && Math.abs(longDist) < (myHalfLength + otherHalfLength + 0.4)) {
            if (!isOvertakingThisLead || Math.abs(overtakeState?.lateralOffset || 0) < 1.4) {
              effectiveSpeed = Math.min(effectiveSpeed, 12);
              hasObstacleAhead = true;
              if (longDist > 0 && longDist < (myHalfLength + otherHalfLength + 0.2)) {
                effectiveSpeed = 0;
              }
              continue;
            }
          }

          const otherFx = Math.sin(other.heading || 0);
          const otherFz = Math.cos(other.heading || 0);
          const headingAlignment = fX * otherFx + fZ * otherFz;

          // 2. SAME DIRECTION FOLLOWING & OVERTAKING OPPORTUNITY
          if (headingAlignment > 0.35 && isInOurLane && longDist > 0.2) {
            const minStoppingGap = myHalfLength + otherHalfLength + 2.5;
            const slowDownGap = minStoppingGap + 15.0;

            // Check if our vehicle should initiate an OVERTAKE maneuver:
            // Requirements:
            // 1. Not already overtaking
            // 2. Faster vehicle behind slower vehicle (e.g. car behind heavy truck or slower traffic)
            // 3. Normal driving status, safe battery, not ECO mode
            // 4. Road ahead is straight enough (headingDiff < 0.25)
            // 5. CRITICAL: NO VEHICLE IS COMING FROM OPPOSITE DIRECTION on this road stretch within safe distance!
            const canOvertakeType = vehicle.model !== 'Heavy Electric Hauler' && vehicle.model !== 'Electric City Bus';
            const isLeadSlower = other.speed < (baseTargetSpeed - 6) || other.model === 'Heavy Electric Hauler' || other.model === 'Electric City Bus';
            const isNotNearEnd = vehicle.currentWaypointIndex < waypoints.length - 10;
            const isBatteryHealthy = vehicle.currentBatteryPct > 22;
            const isSportOrCity = vehicle.driveMode !== 'ECO';

            if (
              !overtakeState &&
              canOvertakeType &&
              isLeadSlower &&
              isNotNearEnd &&
              isBatteryHealthy &&
              isSportOrCity &&
              longDist > minStoppingGap &&
              longDist < (slowDownGap + 12.0)
            ) {
              // SCAN FOR ONCOMING VEHICLES in opposite direction
              let hasOncomingTrafficAhead = false;
              for (const cand of allVehicles) {
                if (cand.id === vehicle.id || cand.id === other.id) continue;
                if (cand.status === 'STRANDED' || cand.status === 'CHARGING' || cand.status === 'QUEUE' || cand.status === 'UNDER_REPAIR') continue;

                const candFx = Math.sin(cand.heading || 0);
                const candFz = Math.cos(cand.heading || 0);
                const candAlignment = fX * candFx + fZ * candFz;

                // Opposing direction: vector dot product is negative (< -0.35)
                if (candAlignment < -0.35) {
                  const cDx = cand.position.x - vehicle.position.x;
                  const cDz = cand.position.z - vehicle.position.z;
                  const cLongDist = fX * cDx + fZ * cDz;
                  const cLatDist = Math.abs(-fZ * cDx + fX * cDz);

                  // Oncoming vehicle is ahead on our road within 65m overtaking sight distance and within road corridor
                  if (cLongDist > 0 && cLongDist < 65.0 && cLatDist < 6.5) {
                    hasOncomingTrafficAhead = true;
                    break;
                  }
                }
              }

              // Verify no other vehicle is already overtaking this same lead
              const isLeadAlreadyBeingOvertaken = Array.from(this.vehicleOvertakeStates.values()).some(
                st => st.targetVehicleId === other.id
              );

              if (!hasOncomingTrafficAhead && !isLeadAlreadyBeingOvertaken) {
                // CLEAR TO OVERTAKE!
                overtakeState = {
                  targetVehicleId: other.id,
                  phase: 'PULL_OUT',
                  lateralOffset: 0.0,
                  ticksInPhase: 0,
                };
                this.vehicleOvertakeStates.set(vehicle.id, overtakeState);
                vehicle.trafficState = 'OVERTAKING';
                vehicle.currentLocationName = `Overtaking ${other.code} (${other.model})`;
              }
            }

            // Normal follow-gap moderation ONLY if NOT actively passing in the passing lane
            if (!isOvertakingThisLead || (overtakeState && Math.abs(overtakeState.lateralOffset) < 1.8)) {
              if (longDist < slowDownGap) {
                hasObstacleAhead = true;
                const gap = longDist - minStoppingGap;

                if (gap <= 0.25) {
                  if (other.speed < 2) {
                    effectiveSpeed = Math.max(0, Math.min(effectiveSpeed, 10));
                  } else {
                    effectiveSpeed = Math.min(effectiveSpeed, Math.max(12, other.speed));
                  }
                } else {
                  const ratio = Math.max(0.15, Math.min(1.0, gap / (slowDownGap - minStoppingGap)));
                  const approachSpeed = Math.max(14, baseTargetSpeed * ratio);
                  effectiveSpeed = Math.min(effectiveSpeed, approachSpeed);
                }
              }
            }
          } else if (Math.abs(headingAlignment) <= 0.3 && distToOther < 7.0 && longDist > 0.5) {
            // 3. INTERSECTION CROSSING YIELD
            if (other.speed > 8) {
              const myPrio = (vehicle.model === 'Highway Patrol EV' ? 10 : (vehicle.model === 'Electric City Bus' || vehicle.model === 'Heavy Electric Hauler') ? 8 : 1);
              const otherPrio = (other.model === 'Highway Patrol EV' ? 10 : (other.model === 'Electric City Bus' || other.model === 'Heavy Electric Hauler') ? 8 : 1);
              if (myPrio < otherPrio || (myPrio === otherPrio && vehicle.id > other.id)) {
                effectiveSpeed = Math.min(effectiveSpeed, 12);
              }
            }
          }
        }

        // 4. OVERTAKING LIFECYCLE & SPEED MANAGEMENT
        if (overtakeState) {
          overtakeState.ticksInPhase++;
          const leadVeh = vehicleService.getVehicleById(overtakeState.targetVehicleId);

          if (!leadVeh || leadVeh.status === 'CHARGING' || leadVeh.status === 'QUEUE' || leadVeh.status === 'UNDER_REPAIR') {
            overtakeState.phase = 'MERGE_BACK';
          }

          if (overtakeState.phase === 'PULL_OUT') {
            vehicle.trafficState = 'OVERTAKING';
            // Smoothly shift to left passing lane (-3.7 meters lateral offset)
            const shiftRate = 2.4 * SimulationEngine.DT * this.speedMultiplier;
            overtakeState.lateralOffset = Math.max(-3.7, overtakeState.lateralOffset - shiftRate);
            effectiveSpeed = Math.max(effectiveSpeed, Math.min(82, baseTargetSpeed * 1.15));

            // Safety check: Did an oncoming vehicle unexpectedly appear ahead?
            let oncomingDanger = false;
            for (const cand of allVehicles) {
              if (cand.id === vehicle.id || cand.id === overtakeState.targetVehicleId) continue;
              if (cand.status === 'STRANDED' || cand.status === 'CHARGING') continue;
              const candAlign = fX * Math.sin(cand.heading || 0) + fZ * Math.cos(cand.heading || 0);
              if (candAlign < -0.35) {
                const cDx = cand.position.x - vehicle.position.x;
                const cDz = cand.position.z - vehicle.position.z;
                const cLong = fX * cDx + fZ * cDz;
                const cLat = Math.abs(-fZ * cDx + fX * cDz);
                if (cLong > 0 && cLong < 45.0 && cLat < 6.5) {
                  oncomingDanger = true;
                  break;
                }
              }
            }

            if (oncomingDanger) {
              // Abort overtake and merge back safely
              overtakeState.phase = 'MERGE_BACK';
            } else if (overtakeState.lateralOffset <= -3.2) {
              overtakeState.phase = 'PASSING';
              overtakeState.ticksInPhase = 0;
            }
          } else if (overtakeState.phase === 'PASSING') {
            vehicle.trafficState = 'OVERTAKING';
            overtakeState.lateralOffset = -3.7;
            const leadSpeed = leadVeh ? leadVeh.speed : 36;
            effectiveSpeed = Math.min(88, Math.max(vehicle.speed, leadSpeed + 16, baseTargetSpeed * 1.22));

            if (leadVeh) {
              const toLeadX = leadVeh.position.x - vehicle.position.x;
              const toLeadZ = leadVeh.position.z - vehicle.position.z;
              const leadLongDist = fX * toLeadX + fZ * toLeadZ;
              const leadHalf = getVehicleHalfLength(leadVeh.model);

              // When lead vehicle is safely behind us by more than (myHalf + leadHalf + 4.5m)
              if (leadLongDist < -(myHalfLength + leadHalf + 4.5) || overtakeState.ticksInPhase > 75) {
                overtakeState.phase = 'MERGE_BACK';
                overtakeState.ticksInPhase = 0;
              }
            } else {
              overtakeState.phase = 'MERGE_BACK';
              overtakeState.ticksInPhase = 0;
            }
          } else if (overtakeState.phase === 'MERGE_BACK') {
            vehicle.trafficState = 'OVERTAKING';
            // Smoothly glide back into original right lane (0.0 meters lateral offset)
            const returnRate = 2.2 * SimulationEngine.DT * this.speedMultiplier;
            overtakeState.lateralOffset = Math.min(0.0, overtakeState.lateralOffset + returnRate);
            effectiveSpeed = Math.min(effectiveSpeed, baseTargetSpeed);

            if (overtakeState.lateralOffset >= -0.15) {
              overtakeState.lateralOffset = 0.0;
              this.vehicleOvertakeStates.delete(vehicle.id);
              vehicle.trafficState = 'CRUISING';
            }
          }
        }

        // Unstick & Circling Watchdogs
        const currentStationary = this.vehicleStationaryTicks.get(vehicle.id) || 0;
        if (effectiveSpeed <= 2) {
          const stationaryTicks = currentStationary + 1;
          this.vehicleStationaryTicks.set(vehicle.id, stationaryTicks);

          if (stationaryTicks > 20) {
            // Unstick! Advance waypoint and restore normal cruising speed
            vehicle.currentWaypointIndex = Math.min(waypoints.length - 1, vehicle.currentWaypointIndex + 2);
            effectiveSpeed = Math.max(28, baseTargetSpeed);
            this.vehicleStationaryTicks.set(vehicle.id, 0);
          }
        } else {
          this.vehicleStationaryTicks.set(vehicle.id, Math.max(0, currentStationary - 1));
        }

        // Anti-Donut / Orbiting Watchdog: Detect if a vehicle is circling or stuck on the same waypoint
        const wpTracker = this.vehicleWaypointProgressTicks.get(vehicle.id) || { index: vehicle.currentWaypointIndex, ticks: 0 };
        if (wpTracker.index === vehicle.currentWaypointIndex) {
          wpTracker.ticks++;
          if (wpTracker.ticks > 22) {
            // Force-advance waypoint and align heading down the road
            vehicle.currentWaypointIndex = Math.min(waypoints.length - 1, vehicle.currentWaypointIndex + 3);
            wpTracker.index = vehicle.currentWaypointIndex;
            wpTracker.ticks = 0;
            const newTarget = waypoints[vehicle.currentWaypointIndex];
            if (newTarget) {
              vehicle.heading = Math.atan2(newTarget.x - vehicle.position.x, newTarget.z - vehicle.position.z);
            }
            effectiveSpeed = Math.max(28, baseTargetSpeed);
          }
        } else {
          wpTracker.index = vehicle.currentWaypointIndex;
          wpTracker.ticks = 0;
        }
        this.vehicleWaypointProgressTicks.set(vehicle.id, wpTracker);

        const moveStep = (effectiveSpeed / 3.6) * 0.42 * this.speedMultiplier * SimulationEngine.DT;
        const isNearFinalWp = vehicle.currentWaypointIndex >= waypoints.length - 1 && (dist <= Math.max(4.5, moveStep * 2.5) || (dx * fX + dz * fZ) <= 0.1);

        if (isNearFinalWp) {
          vehicle.position = { ...targetWp };
          if (vehicle.serviceCenterId) {
            this.handleServiceCenterArrival(vehicle);
          } else if (vehicle.destinationStationId && vehicle.currentBatteryPct < 40) {
            this.handleStationEntranceArrival(vehicle, stations);
          } else if (vehicle.currentBatteryPct < 22) {
            const nearestStation = stations.reduce((acc, st) => {
              const d = Math.hypot(st.position.x - vehicle.position.x, st.position.z - vehicle.position.z);
              const dAcc = Math.hypot(acc.position.x - vehicle.position.x, acc.position.z - vehicle.position.z);
              return d < dAcc ? st : acc;
            }, stations[0]);
            
            (vehicle as any)._preChargeCorridorId = (vehicle as any)._corridorId || VehicleService.getNearestCorridorId(vehicle.position);
            (vehicle as any)._preChargeWaypointIndex = vehicle.currentWaypointIndex;
            (vehicle as any)._preChargeRoute = vehicle.routeWaypoints;
            (vehicle as any)._preChargeHeading = vehicle.heading;

            const stationRoute = VehicleService.getRouteForStation(nearestStation.code, vehicle.position, vehicle.heading);
            vehicle.destinationStationId = nearestStation.id;
            vehicle.routeWaypoints = stationRoute;
            vehicle.currentWaypointIndex = 0;
            vehicle.routeProgress = 0.05;
            vehicle.currentLocationName = `Approaching ${nearestStation.name} [${nearestStation.code}] for recharge`;
          } else {
            // Vehicle completed current route/circuit!
            // Check if waypoints form a continuous circuit loop (start and end within 16m AND headings align)
            const firstWp = waypoints[0];
            const secondWp = waypoints[1] || waypoints[0];
            const lastWp = waypoints[waypoints.length - 1];
            const prevWp = waypoints[waypoints.length - 2] || lastWp;

            const loopDist = firstWp && lastWp ? Math.hypot(firstWp.x - lastWp.x, firstWp.z - lastWp.z) : 999;
            const startDirX = secondWp.x - firstWp.x;
            const startDirZ = secondWp.z - firstWp.z;
            const startLen = Math.hypot(startDirX, startDirZ) || 1;

            const endDirX = lastWp.x - prevWp.x;
            const endDirZ = lastWp.z - prevWp.z;
            const endLen = Math.hypot(endDirX, endDirZ) || 1;

            const dirAlignment = (startDirX * endDirX + startDirZ * endDirZ) / (startLen * endLen);
            const isContinuousRing = loopDist < 16.0 && dirAlignment > 0.35;

            if (isContinuousRing) {
              // Seamless circuit continuation: loop index without ANY teleport or position jump
              vehicle.currentWaypointIndex = 0;
              vehicle.routeProgress = 0.0;
            } else {
              // Corridor reached terminus or completed spur — seamlessly fetch next continuous route forward
              const currentCorridorId = (vehicle as any)._corridorId || VehicleService.getNearestCorridorId(vehicle.position);
              const nextRouteData = VehicleService.getNextContinuousRoute(vehicle.position, currentCorridorId, vehicle.heading);

              (vehicle as any)._corridorId = nextRouteData.corridorId;
              vehicle.routeWaypoints = nextRouteData.route;
              vehicle.currentWaypointIndex = 0;
              vehicle.routeProgress = 0.0;
              vehicle.destinationStationId = null;
              vehicle.currentLocationName = `Patrolling ${nextRouteData.corridorName}`;
            }
            vehicle.speed = baseTargetSpeed;
          }
        } else {
          // Lookahead along upcoming waypoints for smooth curved cornering (Pure Pursuit)
          const isHeavy = vehicle.model === 'Heavy Electric Hauler' || vehicle.model === 'Electric City Bus';
          const lookaheadTargetDist = isHeavy ? 8.5 : (vehicle.speed > 40 ? 6.8 : 5.0);

          let lookaheadIdx = vehicle.currentWaypointIndex;
          let accumulatedDist = 0;
          while (lookaheadIdx < waypoints.length - 1 && accumulatedDist < lookaheadTargetDist) {
            const pA = waypoints[lookaheadIdx];
            const pB = waypoints[lookaheadIdx + 1];
            accumulatedDist += Math.hypot(pB.x - pA.x, pB.z - pA.z);
            lookaheadIdx++;
          }
          const pursuitWp = waypoints[lookaheadIdx] || targetWp;
          const normX = -Math.cos(vehicle.heading);
          const normZ = Math.sin(vehicle.heading);

          const currentOvertake = this.vehicleOvertakeStates.get(vehicle.id);
          const latOffset = currentOvertake ? currentOvertake.lateralOffset : 0.0;
          const shiftWpX = pursuitWp.x + normX * latOffset;
          const shiftWpZ = pursuitWp.z + normZ * latOffset;

          const pdx = shiftWpX - vehicle.position.x;
          const pdz = shiftWpZ - vehicle.position.z;
          const targetHeading = Math.atan2(pdx, pdz);

          let headingDiff = targetHeading - (vehicle.heading || 0);
          headingDiff = ((headingDiff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

          // If pursuit waypoint is severely behind the vehicle (> 110°), search further down the route to recover forward alignment
          if (Math.abs(headingDiff) > 1.9 && lookaheadIdx < waypoints.length - 1) {
            const recoverIdx = Math.min(waypoints.length - 1, lookaheadIdx + 5);
            const recWp = waypoints[recoverIdx];
            const recShiftX = recWp.x + normX * latOffset;
            const recShiftZ = recWp.z + normZ * latOffset;
            const recDx = recShiftX - vehicle.position.x;
            const recDz = recShiftZ - vehicle.position.z;
            const recHeading = Math.atan2(recDx, recDz);
            let recDiff = recHeading - (vehicle.heading || 0);
            recDiff = ((recDiff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
            if (Math.abs(recDiff) < Math.abs(headingDiff)) {
              headingDiff = recDiff;
            }
          }

          const maxTurnRate = isHeavy ? 3.8 : 5.4;
          const maxTurn = maxTurnRate * SimulationEngine.DT * this.speedMultiplier;
          const clampedTurn = Math.max(-maxTurn, Math.min(maxTurn, headingDiff));
          vehicle.heading = (vehicle.heading || 0) + clampedTurn;
          vehicle.heading = ((vehicle.heading + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

          // Cornering speed moderation (naturally slow down during sharp turns)
          if (Math.abs(headingDiff) > 0.35) {
            const turnFactor = Math.min(1.0, (Math.abs(headingDiff) - 0.35) / 0.85);
            const minCornerSpeed = vehicle.driveMode === 'SPORT' ? 45 : 24;
            effectiveSpeed = Math.max(minCornerSpeed, effectiveSpeed * (1 - turnFactor * 0.32));
          }

          const actualMoveStep = (effectiveSpeed / 3.6) * 0.42 * this.speedMultiplier * SimulationEngine.DT;
          const forwardStep = Math.min(dist, actualMoveStep);
          vehicle.position.x += Math.sin(vehicle.heading) * forwardStep;
          vehicle.position.z += Math.cos(vehicle.heading) * forwardStep;

          // Perpendicular lane centering with overtaking lateral shift support
          const desiredShiftX = targetWp.x + normX * latOffset;
          const desiredShiftZ = targetWp.z + normZ * latOffset;
          const lateralErr = (desiredShiftX - vehicle.position.x) * normX + (desiredShiftZ - vehicle.position.z) * normZ;
          const lateralPull = Math.max(-0.08, Math.min(0.08, lateralErr * 0.18));
          vehicle.position.x += normX * lateralPull;
          vehicle.position.z += normZ * lateralPull;

          vehicle.routeProgress = waypoints.length > 1 ? vehicle.currentWaypointIndex / waypoints.length : 0;
        }

        // Check if this vehicle is currently acting as a Tow Vehicle
        const towingState = (vehicle as any)._towingState;
        if (towingState) {
          const stranded = vehicleService.getVehicleById(towingState.strandedVehicleId);
          if (stranded) {
            if (towingState.phase === 'EN_ROUTE_TO_STRANDED') {
              const distToStranded = Math.hypot(vehicle.position.x - stranded.position.x, vehicle.position.z - stranded.position.z);
              if (distToStranded < 6.0 || vehicle.currentWaypointIndex >= waypoints.length - 1) {
                // Connected tow line
                towingState.phase = 'TOWING_TO_STATION';
                vehicle.routeWaypoints = towingState.routeToStation;
                vehicle.currentWaypointIndex = 0;
                vehicle.speed = 34;
                const destSt = stations.find(s => s.id === towingState.targetStationId);
                vehicle.currentLocationName = `Towing ${stranded.code} to ${destSt?.name || 'Charging Station'}`;
                stranded.currentLocationName = `Being towed by ${vehicle.code} to ${destSt?.name || 'Charging Station'}`;
                eventService.addEvent({
                  type: 'SERVICE',
                  severity: 'INFO',
                  message: `🔗 Tow cable hitched! ${vehicle.code} (${vehicle.model}) is towing ${stranded.code} to ${destSt?.name || 'Charging Station'}.`,
                  vehicleId: stranded.id,
                });
              }
            } else if (towingState.phase === 'TOWING_TO_STATION') {
              const destSt = stations.find(s => s.id === towingState.targetStationId);
              const distToStation = destSt ? Math.hypot(vehicle.position.x - destSt.position.x, vehicle.position.z - destSt.position.z) : 999;
              if (distToStation < 12.0 || (vehicle.currentWaypointIndex >= waypoints.length - 1 && dist < 3.0)) {
                // Safely arrived at station
                (vehicle as any)._towingState = null;
                vehicle.trafficState = 'CRUISING';
                vehicle.destinationStationId = null;
                vehicle.currentLocationName = `Tow mission complete for ${stranded.code} — Resuming patrol`;
                vehicle.routeWaypoints = VehicleService.getRandomRoute(vehicle.position, vehicle.heading);
                vehicle.currentWaypointIndex = 0;
                vehicle.speed = 40;

                // Deliver stranded vehicle into station for charging
                stranded.status = 'ENTERING_STATION';
                stranded.trafficState = 'ENTERING_STATION';
                stranded.destinationStationId = destSt?.id || stations[0].id;
                stranded.towedByVehicleId = null;
                (stranded as any)._isPulledOver = false;
                stranded.currentBatteryPct = 2.0; // starts recovery
                stranded.estimatedRangeKm = 8;
                stranded.vehicleHealth = 'GOOD';
                stranded.speed = 12;
                stranded.currentLocationName = `Delivered to ${destSt?.name || 'Charging Station'} — Entering bay for fast charge`;

                eventService.addEvent({
                  type: 'SERVICE',
                  severity: 'SUCCESS',
                  message: `✅ Tow Delivery Complete: ${stranded.code} safely delivered to ${destSt?.name || 'Charging Station'} [${destSt?.code || ''}] for immediate DC Fast Charge!`,
                  vehicleId: stranded.id,
                  stationId: destSt?.id,
                });
              }
            }
          }
        }

        if (effectiveSpeed > 0) {
          const drain = (effectiveSpeed * 0.0022) * this.speedMultiplier * SimulationEngine.DT;
          vehicle.currentBatteryPct = Math.max(0, vehicle.currentBatteryPct - drain);
          const maxRange = vehicle.batteryCapacityKwh ? vehicle.batteryCapacityKwh * 5.0 : 380;
          vehicle.estimatedRangeKm = vehicle.currentBatteryPct <= 0 ? 0 : Math.max(1, Math.round((vehicle.currentBatteryPct / 100) * maxRange));
          vehicle.tripDistanceKm += (moveStep * 0.001);
        }

        if (vehicle.currentBatteryPct <= 0) {
          vehicle.currentBatteryPct = 0;
          vehicle.estimatedRangeKm = 0;
          effectiveSpeed = 0;
          vehicle.speed = 0;
          vehicle.status = 'STRANDED';
          vehicle.trafficState = 'STOPPED';
          vehicle.vehicleHealth = 'CRITICAL';
          if (!(vehicle as any)._isPulledOver) {
            const shoulderAngle = (vehicle.heading || 0) + Math.PI / 2;
            vehicle.position.x += Math.sin(shoulderAngle) * 4.8;
            vehicle.position.z += Math.cos(shoulderAngle) * 4.8;
            (vehicle as any)._isPulledOver = true;
          }
          vehicle.currentLocationName = `Roadside Shoulder (0% Battery Depleted — Pulled Over)`;
          eventService.addEvent({
            type: 'FAULT',
            severity: 'CRITICAL',
            message: `🚨 VEHICLE STRANDED: ${vehicle.code} (${vehicle.model}) reached 0% battery and pulled off the road! Option to tow available.`,
            vehicleId: vehicle.id,
          });
        } else if (vehicle.currentBatteryPct <= 10) {
          vehicle.vehicleHealth = 'CRITICAL';
        } else if (vehicle.currentBatteryPct <= 20) {
          if (vehicle.vehicleHealth !== 'CRITICAL') {
            vehicle.vehicleHealth = 'WARNING';
          }
        }

        if (
          vehicle.currentBatteryPct < 22 &&
          vehicle.currentBatteryPct > 0 &&
          !vehicle.destinationStationId &&
          vehicle.status === 'EN_ROUTE' &&
          !vehicle.serviceCenterId &&
          !(vehicle as any)._towingState
        ) {
          const nearestStation = stations.reduce((acc, st) => {
            const d = Math.hypot(st.position.x - vehicle.position.x, st.position.z - vehicle.position.z);
            const dAcc = Math.hypot(acc.position.x - vehicle.position.x, acc.position.z - vehicle.position.z);
            return d < dAcc ? st : acc;
          }, stations[0]);

          (vehicle as any)._preChargeCorridorId = (vehicle as any)._corridorId || VehicleService.getNearestCorridorId(vehicle.position);
          (vehicle as any)._preChargeWaypointIndex = vehicle.currentWaypointIndex;
          (vehicle as any)._preChargeRoute = vehicle.routeWaypoints;

          const stationRoute = VehicleService.getRouteForStation(nearestStation.code, vehicle.position);
          vehicle.destinationStationId = nearestStation.id;
          vehicle.routeWaypoints = stationRoute;
          vehicle.currentWaypointIndex = 0;
          vehicle.routeProgress = 0.05;
          vehicle.currentLocationName = `Low Battery (${Math.round(vehicle.currentBatteryPct)}%) — Diverting to ${nearestStation.name} [${nearestStation.code}]`;

          eventService.addEvent({
            type: 'STATUS_CHANGE',
            severity: 'WARNING',
            message: `⚡ ${vehicle.code} (${vehicle.model}) battery low (${Math.round(vehicle.currentBatteryPct)}%) — safely turning into ${nearestStation.name} [${nearestStation.code}] to recharge`,
            vehicleId: vehicle.id,
            stationId: nearestStation.id,
          });
        }

        vehicle.speed = effectiveSpeed;
        break;
      }

      case 'ENTERING_STATION': {
        if (!destinationStation) {
          vehicle.status = 'EN_ROUTE';
          break;
        }

        const totalCh = destinationStation.chargers.length;
        let selectedChargerIndex = -1;

        if (vehicle.assignedChargerId) {
          selectedChargerIndex = destinationStation.chargers.findIndex(c => c.id === vehicle.assignedChargerId);
        } else {
          const allVehicles = vehicleService.getAllVehicles();
          const availableCharger = destinationStation.chargers.find((c, idx) => {
            if (c.status !== 'AVAILABLE') return false;
            const bayOffset = getBayOffset(idx, totalCh);
            const bayPos = {
              x: destinationStation.position.x + bayOffset,
              z: destinationStation.position.z + 3.0,
            };
            const isPhysicallyBlocked = allVehicles.some(v =>
              v.id !== vehicle.id &&
              Math.hypot(v.position.x - bayPos.x, v.position.z - bayPos.z) < 2.5
            );
            if (!isPhysicallyBlocked) {
              selectedChargerIndex = idx;
              return true;
            }
            return false;
          });

          if (availableCharger && selectedChargerIndex !== -1) {
            vehicle.assignedChargerId = availableCharger.id;
            vehicle.currentStationId = destinationStation.id;
          }
        }

        if (selectedChargerIndex === -1) {
          if (!destinationStation.queue.includes(vehicle.id)) {
            destinationStation.queue.push(vehicle.id);
            vehicle.status = 'QUEUE';
            vehicle.trafficState = 'QUEUING';
            vehicle.currentStationId = destinationStation.id;
            vehicle.speed = 0;
            const qIdx = destinationStation.queue.indexOf(vehicle.id);
            vehicle.position = {
              x: destinationStation.position.x + 5.5 + qIdx * 2.8,
              y: 0,
              z: destinationStation.position.z + 9.5,
            };
            vehicle.currentLocationName = `${destinationStation.name}, Queue Position #${qIdx + 1}`;
            eventService.addEvent({
              type: 'STATUS_CHANGE',
              severity: 'WARNING',
              message: `⏳ ${vehicle.code} queued outside bays at Station ${destinationStation.code} (Position #${qIdx + 1})`,
              vehicleId: vehicle.id,
              stationId: destinationStation.id,
            });
            stationService.recomputeStationMetrics(destinationStation);
          }
          break;
        }

        const bayOffset = getBayOffset(selectedChargerIndex, totalCh);
        const apronStagingPos = {
          x: destinationStation.position.x + bayOffset,
          y: 0,
          z: destinationStation.position.z + 6.8,
        };

        const dx = apronStagingPos.x - vehicle.position.x;
        const dz = apronStagingPos.z - vehicle.position.z;
        const dist = Math.hypot(dx, dz);
        const apronSpeed = 14;
        const moveStep = (apronSpeed / 3.6) * 0.42 * this.speedMultiplier * SimulationEngine.DT;

        if (dist <= moveStep || dist < 0.5) {
          vehicle.position = { ...apronStagingPos };
          vehicle.heading = 0;
          vehicle.speed = 6;
          vehicle.status = 'REVERSE_PARKING';
          vehicle.trafficState = 'REVERSE_PARKING';
          vehicle.currentLocationName = `${destinationStation.name}, Reversing into Bay #${selectedChargerIndex + 1}`;
          eventService.addEvent({
            type: 'STATUS_CHANGE',
            severity: 'INFO',
            message: `🅿️ ${vehicle.code} taking turn and commencing reverse-parking into Bay #${selectedChargerIndex + 1}`,
            vehicleId: vehicle.id,
            stationId: destinationStation.id,
          });
        } else {
          vehicle.position.x += (dx / dist) * moveStep;
          vehicle.position.z += (dz / dist) * moveStep;
          vehicle.heading = Math.atan2(dx, dz);
          vehicle.speed = apronSpeed;
          vehicle.trafficState = 'ENTERING_STATION';
        }
        break;
      }

      case 'REVERSE_PARKING': {
        if (!destinationStation || !vehicle.assignedChargerId) {
          vehicle.status = 'EN_ROUTE';
          break;
        }

        const totalCh = destinationStation.chargers.length;
        const selectedChargerIndex = destinationStation.chargers.findIndex(c => c.id === vehicle.assignedChargerId);
        const bayOffset = getBayOffset(selectedChargerIndex >= 0 ? selectedChargerIndex : 0, totalCh);
        const targetBayZ = destinationStation.position.z + 3.0;
        const targetBayX = destinationStation.position.x + bayOffset;

        const revSpeed = 6;
        const revStep = (revSpeed / 3.6) * 0.42 * this.speedMultiplier * SimulationEngine.DT;

        vehicle.position.z = Math.max(targetBayZ, vehicle.position.z - revStep);
        vehicle.position.x += (targetBayX - vehicle.position.x) * (1 - Math.exp(-8 * SimulationEngine.DT));
        vehicle.heading = 0;
        vehicle.speed = revSpeed;

        if (vehicle.position.z <= targetBayZ + 0.1) {
          vehicle.position.x = targetBayX;
          vehicle.position.z = targetBayZ;
          vehicle.speed = 0;
          vehicle.status = 'CHARGING';
          vehicle.trafficState = 'CHARGING';

          const ch = destinationStation.chargers.find(c => c.id === vehicle.assignedChargerId);
          if (ch) {
            ch.status = 'CHARGING';
            ch.currentPowerKw = ch.powerKw === 350 ? 220 : 120;
            ch.currentEvId = vehicle.code;
            vehicle.chargingRateKw = ch.currentPowerKw;
          }

          vehicle.currentLocationName = `${destinationStation.name}, Bay #${selectedChargerIndex + 1}`;
          eventService.addEvent({
            type: 'CHARGING_START',
            severity: 'INFO',
            message: `⚡ ${vehicle.code} (${vehicle.model}) parked in Bay #${selectedChargerIndex + 1} — DC Fast Charging cable connected (${vehicle.chargingRateKw} kW)`,
            vehicleId: vehicle.id,
            stationId: destinationStation.id,
            chargerId: ch?.id,
          });

          stationService.recomputeStationMetrics(destinationStation);
        }
        break;
      }

      case 'QUEUE': {
        if (!destinationStation) break;
        if (destinationStation.queue[0] === vehicle.id) {
          const allVehicles = vehicleService.getAllVehicles();
          const totalCh = destinationStation.chargers.length;
          let selectedChargerIndex = -1;
          const availableCharger = destinationStation.chargers.find((c, idx) => {
            if (c.status !== 'AVAILABLE') return false;
            const bayOffset = getBayOffset(idx, totalCh);
            const bayPos = {
              x: destinationStation.position.x + bayOffset,
              z: destinationStation.position.z + 3.0,
            };
            const isPhysicallyBlocked = allVehicles.some(v =>
              v.id !== vehicle.id &&
              Math.hypot(v.position.x - bayPos.x, v.position.z - bayPos.z) < 2.5
            );
            if (!isPhysicallyBlocked) {
              selectedChargerIndex = idx;
              return true;
            }
            return false;
          });

          if (availableCharger && selectedChargerIndex !== -1) {
            destinationStation.queue.shift();
            vehicle.assignedChargerId = availableCharger.id;
            vehicle.currentStationId = destinationStation.id;
            vehicle.status = 'ENTERING_STATION';
            vehicle.trafficState = 'ENTERING_STATION';
            vehicle.speed = 12;
            eventService.addEvent({
              type: 'STATUS_CHANGE',
              severity: 'INFO',
              message: `🚗 ${vehicle.code} called from queue into Bay #${selectedChargerIndex + 1}`,
              vehicleId: vehicle.id,
              stationId: destinationStation.id,
            });
            stationService.recomputeStationMetrics(destinationStation);
          }
        }
        break;
      }

      case 'CHARGING': {
        const chargeInc = (1.5 * this.speedMultiplier) * SimulationEngine.DT;
        vehicle.currentBatteryPct = Math.min(100, vehicle.currentBatteryPct + chargeInc);
        const maxRange = vehicle.batteryCapacityKwh ? vehicle.batteryCapacityKwh * 5.0 : 380;
        vehicle.estimatedRangeKm = Math.min(maxRange, Math.round((vehicle.currentBatteryPct / 100) * maxRange));
        vehicle.energyConsumedKwh += 0.4 * this.speedMultiplier * SimulationEngine.DT;
        vehicle.speed = 0;
        vehicle.trafficState = 'CHARGING';

        if (vehicle.currentBatteryPct >= vehicle.targetBatteryPct) {
          vehicle.status = 'COMPLETED';

          if (destinationStation && vehicle.assignedChargerId) {
            const charger = destinationStation.chargers.find(c => c.id === vehicle.assignedChargerId);
            if (charger) {
              charger.status = 'AVAILABLE';
              charger.currentPowerKw = 0;
              charger.currentEvId = null;
            }
            destinationStation.dailyEnergyKwh += vehicle.energyConsumedKwh;
            stationService.recomputeStationMetrics(destinationStation);
          }

          eventService.addEvent({
            type: 'COMPLETED',
            severity: 'SUCCESS',
            message: `🎉 ${vehicle.code} (${vehicle.model}) completed charge at ${vehicle.currentBatteryPct}% — disconnecting cable`,
            vehicleId: vehicle.id,
            stationId: destinationStation?.id,
          });
        }
        break;
      }

      case 'COMPLETED': {
        const st = destinationStation || stations.find(s => s.id === vehicle.currentStationId);
        if (st) {
          vehicle.status = 'LEAVING_STATION';
          vehicle.trafficState = 'LEAVING_STATION';
          vehicle.speed = 12;
          vehicle.heading = 0;
          vehicle.assignedChargerId = null;
        }
        break;
      }

      case 'LEAVING_STATION': {
        const st = destinationStation || stations.find(s => s.id === vehicle.currentStationId);
        if (!st) {
          vehicle.status = 'EN_ROUTE';
          break;
        }

        const prevCorridorId = (vehicle as any)._preChargeCorridorId || (vehicle as any)._corridorId || 'palghar_sh40';
        const departureRoute = VehicleService.getDepartureRouteForCorridor(
          st.code,
          prevCorridorId,
          vehicle.position,
          (vehicle as any)._preChargeHeading
        );

        if (departureRoute && departureRoute.length > 1) {
          vehicle.routeWaypoints = departureRoute;
          vehicle.currentWaypointIndex = 0;
          vehicle.status = 'EN_ROUTE';
          vehicle.trafficState = 'CRUISING';
          vehicle.currentStationId = null;
          vehicle.destinationStationId = null;
          (vehicle as any)._corridorId = prevCorridorId;
          (vehicle as any)._preChargeCorridorId = null;
          (vehicle as any)._preChargeRoute = null;
          (vehicle as any)._preChargeHeading = null;
          vehicle.speed = 36;
          vehicle.currentLocationName = `Patrolling ${REGIONAL_CORRIDORS[prevCorridorId]?.name || 'Regional Highway'}`;

          eventService.addEvent({
            type: 'STATUS_CHANGE',
            severity: 'INFO',
            message: `🚗 ${vehicle.code} finished charging (${vehicle.currentBatteryPct}%) and seamlessly merged onto ${REGIONAL_CORRIDORS[prevCorridorId]?.name || 'corridor'}`,
            vehicleId: vehicle.id,
            stationId: st.id,
          });
        } else {
          const nextRouteData = VehicleService.getNextContinuousRoute(vehicle.position, prevCorridorId, vehicle.heading);
          vehicle.routeWaypoints = nextRouteData.route;
          vehicle.currentWaypointIndex = 0;
          vehicle.status = 'EN_ROUTE';
          vehicle.trafficState = 'CRUISING';
          vehicle.currentStationId = null;
          vehicle.destinationStationId = null;
          (vehicle as any)._corridorId = nextRouteData.corridorId;
          (vehicle as any)._preChargeCorridorId = null;
          (vehicle as any)._preChargeRoute = null;
          (vehicle as any)._preChargeHeading = null;
          vehicle.speed = 36;
          vehicle.currentLocationName = `Patrolling ${nextRouteData.corridorName}`;
        }
        break;
      }

      case 'DEPARTING': {
        const waypoints = vehicle.routeWaypoints;
        if (!waypoints || waypoints.length === 0) {
          vehicle.status = 'LEFT_NETWORK';
          break;
        }

        while (vehicle.currentWaypointIndex < waypoints.length - 1) {
          const wp = waypoints[vehicle.currentWaypointIndex];
          const wdx = wp.x - vehicle.position.x;
          const wdz = wp.z - vehicle.position.z;
          const wdist = Math.hypot(wdx, wdz);
          const fX = Math.sin(vehicle.heading || 0);
          const fZ = Math.cos(vehicle.heading || 0);
          const dot = wdx * fX + wdz * fZ;

          if (wdist < 1.8 || (dot < -0.35 && wdist < 2.5)) {
            vehicle.currentWaypointIndex++;
          } else {
            break;
          }
        }

        const targetWp = waypoints[vehicle.currentWaypointIndex];
        if (!targetWp) {
          vehicle.status = 'LEFT_NETWORK';
          break;
        }

        const dx = targetWp.x - vehicle.position.x;
        const dz = targetWp.z - vehicle.position.z;
        const dist = Math.hypot(dx, dz);

        let effectiveSpeed = vehicle.speed > 0 ? vehicle.speed : 36;

        const allVehicles = vehicleService.getAllVehicles();
        const fX = Math.sin(vehicle.heading || 0);
        const fZ = Math.cos(vehicle.heading || 0);

        for (const other of allVehicles) {
          if (other.id === vehicle.id) continue;
          const toOtherX = other.position.x - vehicle.position.x;
          const toOtherZ = other.position.z - vehicle.position.z;
          const distToOther = Math.hypot(toOtherX, toOtherZ);

          if (distToOther < 14.0) {
            const otherFx = Math.sin(other.heading || 0);
            const otherFz = Math.cos(other.heading || 0);
            const headingAlignment = fX * otherFx + fZ * otherFz;

            if (headingAlignment < 0.2) continue;

            const longDist = fX * toOtherX + fZ * toOtherZ;
            const latDist = Math.abs(fX * toOtherZ - fZ * toOtherX);

            if (latDist < 1.8 && longDist > 0.2) {
              if (longDist < 4.2) {
                effectiveSpeed = Math.max(20, other.speed > 0 ? other.speed * 0.9 : 20);
              } else if (longDist < 10.0) {
                const leadSpeed = other.speed > 0 ? other.speed : 24;
                effectiveSpeed = Math.min(effectiveSpeed, Math.max(22, leadSpeed * 0.9));
              }
            } else if (distToOther < 3.2 && (other.status === 'EN_ROUTE' || other.status === 'DEPARTING')) {
              effectiveSpeed = Math.max(18, effectiveSpeed * 0.9);
            }
          }
        }

        const moveStep = (effectiveSpeed / 3.6) * 0.42 * this.speedMultiplier * SimulationEngine.DT;

        if (vehicle.currentWaypointIndex >= waypoints.length - 1 && (dist <= moveStep || dist < 2.0)) {
          vehicle.position = { ...targetWp };
          vehicle.status = 'LEFT_NETWORK';
        } else {
          const targetHeading = Math.atan2(dx, dz);
          let headingDiff = targetHeading - (vehicle.heading || 0);
          headingDiff = ((headingDiff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

          const isHeavy = vehicle.model === 'Heavy Electric Hauler' || vehicle.model === 'Electric City Bus';
          const maxTurnRate = isHeavy ? 2.8 : 4.0;
          const maxTurn = maxTurnRate * SimulationEngine.DT * this.speedMultiplier;
          const clampedTurn = Math.max(-maxTurn, Math.min(maxTurn, headingDiff));
          vehicle.heading = (vehicle.heading || 0) + clampedTurn;
          vehicle.heading = ((vehicle.heading + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

          if (Math.abs(headingDiff) > 0.4) {
            const turnFactor = Math.min(1.0, (Math.abs(headingDiff) - 0.4) / 1.2);
            effectiveSpeed = Math.max(18, effectiveSpeed * (1 - turnFactor * 0.35));
          }

          const actualMoveStep = (effectiveSpeed / 3.6) * 0.42 * this.speedMultiplier * SimulationEngine.DT;
          const forwardStep = Math.min(dist, actualMoveStep);
          vehicle.position.x += Math.sin(vehicle.heading) * forwardStep;
          vehicle.position.z += Math.cos(vehicle.heading) * forwardStep;
        }

        if (effectiveSpeed > 0) {
          const drain = (effectiveSpeed * 0.0022) * this.speedMultiplier * SimulationEngine.DT;
          vehicle.currentBatteryPct = Math.max(5, vehicle.currentBatteryPct - drain);
          const maxRange = vehicle.batteryCapacityKwh ? vehicle.batteryCapacityKwh * 5.0 : 380;
          vehicle.estimatedRangeKm = Math.max(8, Math.round((vehicle.currentBatteryPct / 100) * maxRange));
          vehicle.tripDistanceKm += (moveStep * 0.001);
        }
        vehicle.speed = effectiveSpeed;
        break;
      }

      case 'LEFT_NETWORK': {
        const currentCorridorId = (vehicle as any)._corridorId || VehicleService.getNearestCorridorId(vehicle.position);
        const nextRouteData = VehicleService.getNextContinuousRoute(vehicle.position, currentCorridorId, vehicle.heading);
        (vehicle as any)._corridorId = nextRouteData.corridorId;
        vehicle.destinationStationId = null;
        vehicle.routeWaypoints = nextRouteData.route;
        vehicle.currentWaypointIndex = 0;
        const nextWp = nextRouteData.route[0] || nextRouteData.route[1];
        if (nextWp) {
          vehicle.heading = Math.atan2(nextWp.x - vehicle.position.x, nextWp.z - vehicle.position.z);
        }

        vehicle.currentBatteryPct = Math.floor(75 + Math.random() * 20);
        vehicle.estimatedRangeKm = Math.round((vehicle.currentBatteryPct / 100) * 380);
        vehicle.energyConsumedKwh = 0;
        vehicle.status = 'EN_ROUTE';
        vehicle.trafficState = 'CRUISING';
        vehicle.speed = Math.floor(36 + Math.random() * 10);
        vehicle.routeProgress = 0;
        vehicle.currentLocationName = `Patrolling ${nextRouteData.corridorName}`;
        vehicle.etaMinutes = 4;
        break;
      }

      case 'UNDER_REPAIR': {
        vehicle.speed = 0;
        if (vehicle.motorTemperatureC > 55) {
          vehicle.motorTemperatureC = Math.max(55, Math.round(vehicle.motorTemperatureC - (1.5 * this.speedMultiplier * SimulationEngine.DT)));
        }
        if (vehicle.batteryTemperatureC > 30) {
          vehicle.batteryTemperatureC = Math.max(30, Math.round(vehicle.batteryTemperatureC - 0.8 * this.speedMultiplier));
        }
        break;
      }
    }
  }

  private handleStationEntranceArrival(vehicle: Vehicle, stations: Station[]) {
    const station = stations.find(s => s.id === vehicle.destinationStationId);
    if (!station) {
      vehicle.status = 'EN_ROUTE';
      return;
    }

    vehicle.status = 'ENTERING_STATION';
    vehicle.trafficState = 'ENTERING_STATION';
    vehicle.currentStationId = station.id;
    vehicle.speed = 14;
    vehicle.currentLocationName = `Entering ${station.name} (${station.code}) apron`;

    eventService.addEvent({
      type: 'STATUS_CHANGE',
      severity: 'INFO',
      message: `🅿️ ${vehicle.code} arrived at ${station.name} entrance and transitioned into internal apron`,
      vehicleId: vehicle.id,
      stationId: station.id,
    });
  }

  private handleServiceCenterArrival(vehicle: Vehicle) {
    const sc = stationService.getServiceCenter();
    const bayResult = stationService.occupyServiceBay(
      vehicle.id,
      vehicle.code,
      vehicle.faultReason || 'Motor Overheating & Inverter Fault'
    );

    if (bayResult !== null) {
      vehicle.status = 'UNDER_REPAIR';
      vehicle.repairProgressPct = 10;
      vehicle.repairStage = 'DIAGNOSIS';
      vehicle.speed = 0;
      const bayPos = sc.position;
      vehicle.position = {
        x: bayPos.x + (bayResult.bayIndex - 1.5) * 3.0,
        y: 0,
        z: bayPos.z - 2.0,
      };
      vehicle.heading = 0;
      vehicle.currentLocationName = `S03 Service Center, Bay #${bayResult.bayIndex + 1}`;
    }
  }

  public triggerEVFault(vehicleCode: string = 'EV-024', faultReason: string = 'Motor Overheating (92°C)'): Vehicle | undefined {
    const v = vehicleService.getVehicleById(vehicleCode);
    if (!v) return undefined;

    v.status = 'SERVICE_REQUIRED';
    v.trafficState = 'SERVICE_ROUTE';
    v.vehicleHealth = 'CRITICAL';
    v.motorTemperatureC = 92;
    v.batteryTemperatureC = 42;
    v.faultReason = faultReason;
    v.speed = 0;
    v.updatedAt = new Date().toISOString();

    const sc = stationService.getServiceCenter();
    const scRoute = VehicleService.getRouteForServiceCenter(v.position);
    v.serviceCenterId = sc.id;
    v.destinationStationId = null;
    v.routeWaypoints = scRoute;
    v.currentWaypointIndex = 0;
    v.status = 'EN_ROUTE';
    v.speed = 28;
    v.currentLocationName = 'In transit to S03 Diagnostics Service Hub';

    eventService.addEvent({
      type: 'FAULT',
      severity: 'CRITICAL',
      message: `🚨 MOTOR OVERHEATING ALERT: ${v.code} (${v.model}) motor temp hit 92°C — Safe stop executed, routed to S03 Service Center via road network`,
      vehicleId: v.id,
    });

    return v;
  }

  public setVehicleBattery(vehicleIdOrCode: string = 'EV-024', pct: number = 50): Vehicle | undefined {
    let v = vehicleService.getVehicleById(vehicleIdOrCode);
    if (!v) {
      v = vehicleService.getAllVehicles().find(veh => 
        veh.code.toLowerCase() === vehicleIdOrCode.toLowerCase() ||
        veh.id.toLowerCase() === vehicleIdOrCode.toLowerCase()
      );
    }
    if (!v) return undefined;

    const clampedPct = Math.max(0, Math.min(100, Math.round(pct)));
    v.currentBatteryPct = clampedPct;
    v.estimatedRangeKm = clampedPct <= 0 ? 0 : Math.max(1, Math.round((clampedPct / 100) * 380));

    if (clampedPct <= 0) {
      v.status = 'STRANDED';
      v.trafficState = 'STOPPED';
      v.speed = 0;
      v.vehicleHealth = 'CRITICAL';
      if (!(v as any)._isPulledOver) {
        const shoulderAngle = (v.heading || 0) + Math.PI / 2;
        v.position.x += Math.sin(shoulderAngle) * 4.8;
        v.position.z += Math.cos(shoulderAngle) * 4.8;
        (v as any)._isPulledOver = true;
      }
      v.currentLocationName = `Roadside Shoulder (0% Battery Depleted — Pulled Over)`;
      eventService.addEvent({
        type: 'FAULT',
        severity: 'CRITICAL',
        message: `🚨 VEHICLE STRANDED: ${v.code} (${v.model}) battery set to 0%! Vehicle pulled over on shoulder with rescue tow option available.`,
        vehicleId: v.id,
      });
    } else if (clampedPct <= 20) {
      if ((v as any)._isPulledOver) {
        const shoulderAngle = (v.heading || 0) + Math.PI / 2;
        v.position.x -= Math.sin(shoulderAngle) * 4.8;
        v.position.z -= Math.cos(shoulderAngle) * 4.8;
        (v as any)._isPulledOver = false;
      }
      v.status = 'LOW_BATTERY';
      v.trafficState = 'CRUISING';
      if (v.speed === 0) v.speed = 36;
      eventService.addEvent({
        type: 'STATUS_CHANGE',
        severity: 'WARNING',
        message: `⚠️ LOW BATTERY: ${v.code} battery set to ${clampedPct}% (Range: ${v.estimatedRangeKm} km) — diversion recommended`,
        vehicleId: v.id,
      });
    } else {
      if ((v as any)._isPulledOver) {
        const shoulderAngle = (v.heading || 0) + Math.PI / 2;
        v.position.x -= Math.sin(shoulderAngle) * 4.8;
        v.position.z -= Math.cos(shoulderAngle) * 4.8;
        (v as any)._isPulledOver = false;
      }
      if (v.status === 'STRANDED' || v.status === 'LOW_BATTERY') {
        v.status = 'EN_ROUTE';
        v.trafficState = 'CRUISING';
        v.speed = 42;
      }
      v.vehicleHealth = 'GOOD';
      eventService.addEvent({
        type: 'STATUS_CHANGE',
        severity: 'INFO',
        message: `🔋 BATTERY UPDATED: ${v.code} battery set to ${clampedPct}% (Range: ${v.estimatedRangeKm} km)`,
        vehicleId: v.id,
      });
    }

    v.updatedAt = new Date().toISOString();
    return v;
  }

  public triggerLowBattery(vehicleCode: string = 'EV-024', pct: number = 18): Vehicle | undefined {
    return this.setVehicleBattery(vehicleCode, pct);
  }

  public triggerEnergySurge(active: boolean = true) {
    return energyService.triggerEnergySurge(active);
  }

  public triggerFault(stationCode?: string, chargerCode?: string) {
    const stations = stationService.getAllStations();
    const targetStation = stationCode
      ? stations.find(s => s.code.toLowerCase() === stationCode.toLowerCase())
      : stations[0];
    if (!targetStation) return null;

    const targetCharger = chargerCode
      ? targetStation.chargers.find(c => c.code.toLowerCase() === chargerCode.toLowerCase())
      : targetStation.chargers.find(c => c.status === 'CHARGING') || targetStation.chargers.find(c => c.status !== 'FAULT') || targetStation.chargers[0];

    if (targetCharger) {
      stationService.setChargerStatus(
        targetStation.id,
        targetCharger.id,
        'FAULT',
        null,
        0,
        'Silicon Carbide Inverter Thermal Trip'
      );

      const vehicles = vehicleService.getAllVehicles();
      const affectedEv = vehicles.find(v => v.assignedChargerId === targetCharger.id && (v.status === 'CHARGING' || v.status === 'REVERSE_PARKING'));
      if (affectedEv) {
        affectedEv.chargingRateKw = 0;
        eventService.addEvent({
          type: 'FAULT',
          severity: 'CRITICAL',
          message: `🚨 CHARGER FAULT: Charger ${targetCharger.code} communication failed during active session with ${affectedEv.code} — Rerouting EV`,
          vehicleId: affectedEv.id,
          stationId: targetStation.id,
          chargerId: targetCharger.id,
        });

        const altStation = stations.find(s => s.id !== targetStation.id && s.status === 'ONLINE' && s.chargers.some(c => c.status === 'AVAILABLE')) || stations[1] || stations[0];
        const newRoute = VehicleService.getRouteFromCurrentPositionTo(affectedEv.position, altStation.position, affectedEv.heading);

        affectedEv.destinationStationId = altStation.id;
        affectedEv.assignedChargerId = null;
        affectedEv.routeWaypoints = newRoute;
        affectedEv.currentWaypointIndex = 0;
        affectedEv.status = 'LEAVING_STATION';
        affectedEv.trafficState = 'REROUTING';
        affectedEv.speed = 12;
        affectedEv.currentLocationName = `Rerouting to ${altStation.name} [${altStation.code}]`;

        eventService.addEvent({
          type: 'REDIRECT',
          severity: 'WARNING',
          message: `🔄 ${affectedEv.code} disconnected from faulted Charger ${targetCharger.code} and rerouted to ${altStation.name} via road network`,
          vehicleId: affectedEv.id,
          stationId: altStation.id,
        });
      }
    }
    return { station: targetStation, charger: targetCharger };
  }

  public repairFault(chargerCode?: string) {
    const stations = stationService.getAllStations();
    for (const st of stations) {
      for (const ch of st.chargers) {
        if (ch.status === 'FAULT' && (!chargerCode || ch.code.toLowerCase() === chargerCode.toLowerCase())) {
          stationService.setChargerStatus(st.id, ch.id, 'AVAILABLE', null, 0);
          return { station: st, charger: ch };
        }
      }
    }
    return null;
  }

  public completeActiveRepair(vehicleCode: string = 'EV-024'): Vehicle | undefined {
    const v = vehicleService.getVehicleById(vehicleCode);
    if (!v) return undefined;

    stationService.releaseServiceBay(v.id);
    v.status = 'READY';
    v.vehicleHealth = 'GOOD';
    v.motorTemperatureC = 55;
    v.batteryTemperatureC = 30;
    v.faultReason = null;
    v.repairProgressPct = 100;
    v.repairStage = 'REPAIR_COMPLETE';
    v.updatedAt = new Date().toISOString();

    eventService.addEvent({
      type: 'SERVICE',
      severity: 'SUCCESS',
      message: `✅ Repair completed on ${v.code} — Systems nominal, certified healthy`,
      vehicleId: v.id,
    });

    return v;
  }

  public returnToRoad(vehicleIdentifier: string = 'EV-024'): Vehicle | undefined {
    let v = vehicleService.getVehicleById(vehicleIdentifier);
    if (!v) {
      v = vehicleService.getAllVehicles().find(
        (veh) =>
          veh.code.toLowerCase() === vehicleIdentifier.toLowerCase() ||
          veh.id.toLowerCase() === vehicleIdentifier.toLowerCase()
      );
    }
    if (!v) return undefined;

    stationService.releaseChargerByVehicle(v.id);
    stationService.releaseServiceBay(v.id);

    v.assignedChargerId = null;
    v.currentStationId = null;
    v.serviceCenterId = null;
    v.faultReason = null;

    const stations = stationService.getAllStations();
    const targetStation = stations[1] || stations[0];
    const newRoute = VehicleService.getRouteFromCurrentPositionTo(v.position, targetStation.position, v.heading);

    v.status = 'EN_ROUTE';
    v.trafficState = 'CRUISING';
    v.destinationStationId = targetStation.id;
    v.routeWaypoints = newRoute;
    v.currentWaypointIndex = 0;
    if (newRoute.length > 1) {
      v.heading = Math.atan2(newRoute[1].x - v.position.x, newRoute[1].z - v.position.z);
    }
    v.speed = 42;
    v.currentLocationName = `Boisar–Palghar Regional Corridor`;
    v.updatedAt = new Date().toISOString();

    eventService.addEvent({
      type: 'STATUS_CHANGE',
      severity: 'INFO',
      message: `🚗 ${v.code} returned to the regional road network on Boisar–Palghar Highway`,
      vehicleId: v.id,
    });

    return v;
  }

  public towVehicleToNearestStation(vehicleIdentifier: string): { strandedVehicle: Vehicle; towVehicle: Vehicle } | null {
    let stranded = vehicleService.getVehicleById(vehicleIdentifier);
    if (!stranded) {
      stranded = vehicleService.getAllVehicles().find(
        (v) =>
          v.code.toLowerCase() === vehicleIdentifier.toLowerCase() ||
          v.id.toLowerCase() === vehicleIdentifier.toLowerCase()
      );
    }
    if (!stranded) return null;

    const stations = stationService.getAllStations();
    const nearestStation = stations.reduce((acc, st) => {
      const d = Math.hypot(st.position.x - stranded.position.x, st.position.z - stranded.position.z);
      const dAcc = Math.hypot(acc.position.x - stranded.position.x, acc.position.z - stranded.position.z);
      return d < dAcc ? st : acc;
    }, stations[0]);

    // Pick a random available vehicle from the fleet to perform towing
    const candidates = vehicleService.getAllVehicles().filter(
      (v) =>
        v.id !== stranded.id &&
        v.status !== 'CHARGING' &&
        v.status !== 'STRANDED' &&
        v.status !== 'BEING_TOWED' &&
        v.currentBatteryPct > 20
    );

    if (candidates.length === 0) return null;

    const preferred = candidates.find(
      (v) =>
        v.model === 'Heavy Electric Hauler' ||
        v.model === 'Electric Pickup Truck' ||
        v.model === 'Commercial EV Van' ||
        v.model === 'Highway Patrol EV'
    );
    const towVehicle = preferred || candidates[Math.floor(Math.random() * candidates.length)];

    const routeToStranded = VehicleService.getRouteFromCurrentPositionTo(towVehicle.position, stranded.position);
    const routeToStation = VehicleService.getRouteForStation(nearestStation.code, stranded.position);

    (towVehicle as any)._towingState = {
      phase: 'EN_ROUTE_TO_STRANDED',
      strandedVehicleId: stranded.id,
      targetStationId: nearestStation.id,
      routeToStation: routeToStation.length > 1 ? routeToStation : [stranded.position, nearestStation.position],
    };

    towVehicle.destinationStationId = nearestStation.id;
    towVehicle.trafficState = 'SERVICE_ROUTE';
    towVehicle.routeWaypoints = routeToStranded.length > 1 ? routeToStranded : [towVehicle.position, stranded.position];
    towVehicle.currentWaypointIndex = 0;
    towVehicle.speed = 46;
    towVehicle.currentLocationName = `Dispatched to tow ${stranded.code} to ${nearestStation.name}`;

    stranded.status = 'BEING_TOWED';
    stranded.trafficState = 'BEING_TOWED';
    stranded.speed = 0;
    stranded.towedByVehicleId = towVehicle.id;
    stranded.destinationStationId = nearestStation.id;
    stranded.currentLocationName = `Awaiting tow truck (${towVehicle.code} [${towVehicle.model}] dispatched)`;

    eventService.addEvent({
      type: 'SERVICE',
      severity: 'WARNING',
      message: `🛻 Tow Service Dispatched: ${towVehicle.code} (${towVehicle.model}) is responding to tow stranded ${stranded.code} (0% SOC) to ${nearestStation.name} [${nearestStation.code}]!`,
      vehicleId: stranded.id,
      stationId: nearestStation.id,
    });

    return { strandedVehicle: stranded, towVehicle };
  }

  public resetSimulation() {
    this.scenarioStep = 0;
    energyService.triggerEnergySurge(false);
    vehicleService.reseedVehicles();
    const stations = stationService.getAllStations();
    for (const st of stations) {
      for (const ch of st.chargers) {
        ch.status = 'AVAILABLE';
        ch.currentPowerKw = 0;
        ch.currentEvId = null;
      }
      st.queue = [];
      stationService.recomputeStationMetrics(st);
    }
    eventService.addEvent({
      type: 'STATUS_CHANGE',
      severity: 'INFO',
      message: '🔄 EVNEXUS Boisar Digital Twin state reset to nominal baseline with vehicles on road network',
    });
  }
}

export const simulationEngine = SimulationEngine.getInstance();
