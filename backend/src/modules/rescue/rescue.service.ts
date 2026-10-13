import { RescueRequest, RescueProvider, RescueStatus } from './rescue.types';
import { vehicleService, VehicleService } from '../vehicles/vehicle.service';
import { stationService } from '../stations/station.service';
import { eventService } from '../events/event.service';
import { simulationEngine } from '../simulation/simulation.engine';

export class RescueService {
  private static instance: RescueService;
  private requests: Map<string, RescueRequest> = new Map();
  private providers: Map<string, RescueProvider> = new Map();
  private dispatchLock: boolean = false;

  private constructor() {
    this.seedProviders();
    this.seedInitialIncidents();
  }

  public static getInstance(): RescueService {
    if (!RescueService.instance) {
      RescueService.instance = new RescueService();
    }
    return RescueService.instance;
  }

  private seedProviders() {
    const defaultProvider: RescueProvider = {
      id: 'prov-rapid-tow-01',
      name: 'Palghar District Rapid Highway Rescue & Towing Co.',
      contactNumber: '+91 2525 240108 / 112 Emergency',
      coverageRegion: ['Boisar', 'Palghar', 'Tarapur', 'Shirgaon', 'Betegaon'],
      vehicleTypesSupported: ['Sedan', 'SUV', 'Bus', 'Commercial Hauler'],
      activeTowVehicles: [
        {
          vehicleId: 'veh-ev-patrol-03',
          code: 'EV-PATROL-03',
          model: 'Highway Patrol EV',
          status: 'AVAILABLE',
          capacityTon: 3.5,
        },
      ],
    };
    this.providers.set(defaultProvider.id, defaultProvider);
  }

  private seedInitialIncidents() {
    // We will initialize cleanly; requests will be triggered dynamically or on demand
  }

  /**
   * Evaluates rescue priority score (0 - 100) based on real safety criteria:
   * 1. Road Danger: active lane blocked (+40 pts)
   * 2. Shoulder unavailable (+20 pts)
   * 3. Passenger vulnerability: elderly, kids, medical (+20 pts)
   * 4. Severe battery depletion with high-speed highway exposure (+10 pts)
   * 5. Waiting duration (up to +15 pts)
   */
  public evaluatePriority(data: {
    laneBlocked: boolean;
    shoulderAvailable: boolean;
    passengerCount: number;
    vulnerablePassengers: boolean;
    batterySoc: number;
    trafficSpeedKmh?: number;
    createdAt?: string;
  }): { score: number; level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; factors: string[] } {
    let score = 10;
    const factors: string[] = [];

    if (data.laneBlocked) {
      score += 40;
      factors.push('🚨 Blocking active traffic lane (Severe Collision Hazard)');
    } else if (!data.shoulderAvailable) {
      score += 20;
      factors.push('⚠️ Insufficient road shoulder clearance');
    } else {
      factors.push('✅ Pulled onto safe emergency shoulder');
    }

    if (data.vulnerablePassengers) {
      score += 20;
      factors.push('👶 Vulnerable passengers on board (Elderly/Minors)');
    } else if (data.passengerCount > 2) {
      score += 10;
      factors.push(`👥 ${data.passengerCount} passengers stranded roadside`);
    }

    if (data.batterySoc <= 0) {
      score += 15;
      factors.push('⚡ 0% Battery — Zero hazard steering/telemetry buffer');
    }

    if (data.createdAt) {
      const waitMinutes = (Date.now() - new Date(data.createdAt).getTime()) / 60000;
      if (waitMinutes > 15) {
        score += 15;
        factors.push(`⏱️ Waiting over ${Math.floor(waitMinutes)} minutes`);
      } else if (waitMinutes > 5) {
        score += 5;
        factors.push(`⏱️ Waiting ${Math.floor(waitMinutes)} minutes`);
      }
    }

    score = Math.min(100, Math.max(10, score));

    let level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score >= 30) level = 'MEDIUM';

    return { score, level, factors };
  }

  /**
   * Creates a new rescue request for a stranded EV
   */
  public createRequest(params: {
    vehicleId: string;
    ownerId?: string;
    ownerName?: string;
    laneBlocked?: boolean;
    shoulderAvailable?: boolean;
    passengerCount?: number;
    vulnerablePassengers?: boolean;
    note?: string;
  }): RescueRequest {
    const vehicle = vehicleService.getVehicleById(params.vehicleId) ||
      vehicleService.getAllVehicles().find(v => v.code === params.vehicleId);

    if (!vehicle) {
      throw new Error(`Vehicle ${params.vehicleId} not found in digital twin`);
    }

    // Check if an active request already exists for this vehicle
    const existing = Array.from(this.requests.values()).find(
      r => (r.vehicleId === vehicle.id || r.vehicleCode === vehicle.code) &&
           !['COMPLETED', 'CANCELLED'].includes(r.status)
    );
    if (existing) {
      return existing;
    }

    const laneBlocked = params.laneBlocked ?? true;
    const shoulderAvailable = params.shoulderAvailable ?? false;
    const passengerCount = params.passengerCount ?? 1;
    const vulnerablePassengers = params.vulnerablePassengers ?? false;

    const priority = this.evaluatePriority({
      laneBlocked,
      shoulderAvailable,
      passengerCount,
      vulnerablePassengers,
      batterySoc: vehicle.currentBatteryPct,
    });

    const now = new Date().toISOString();
    const requestId = `rq-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Set stranded vehicle state
    vehicle.status = 'STRANDED';
    vehicle.trafficState = 'STOPPED';
    vehicle.speed = 0;
    vehicle.currentBatteryPct = 0;
    vehicle.estimatedRangeKm = 0;
    vehicle.currentLocationName = `${laneBlocked ? 'Active Lane Blocking (Hazard)' : 'Roadside Shoulder'} — Awaiting Tow Assistance`;

    const request: RescueRequest = {
      id: requestId,
      vehicleId: vehicle.id,
      vehicleCode: vehicle.code,
      vehicleModel: vehicle.model,
      ownerId: params.ownerId || 'usr-owner-01',
      ownerName: params.ownerName || 'EV Owner',
      location: { ...vehicle.position },
      locationName: vehicle.currentLocationName,
      roadName: vehicle.currentLocationName || 'Boisar–Palghar Corridor (SH-40)',
      batterySoc: 0,
      laneBlocked,
      shoulderAvailable,
      hazardLightsOn: true,
      passengerCount,
      vulnerablePassengers,
      weatherRisk: false,
      trafficSpeedKmh: 45,
      priorityScore: priority.score,
      priorityLevel: priority.level,
      priorityFactors: priority.factors,
      status: 'REQUESTED',
      createdAt: now,
      updatedAt: now,
      auditLog: [
        {
          timestamp: now,
          status: 'REQUESTED',
          note: params.note || `Emergency roadside towing requested for ${vehicle.code} (0% SOC)`,
        },
      ],
    };

    this.requests.set(request.id, request);

    eventService.addEvent({
      type: 'SERVICE',
      severity: priority.level === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      message: `🚨 Emergency Rescue Requested: ${vehicle.code} (${vehicle.model}) stranded with 0% battery. Priority: ${priority.level} (${priority.score}/100).`,
      vehicleId: vehicle.id,
    });

    // Run atomic queue dispatch
    this.evaluateAndDispatchQueue();

    return this.requests.get(request.id)!;
  }

  /**
   * Concurrency-safe, atomic queue dispatch algorithm.
   * Solves the critical scenario: 2 stranded EVs, 1 available towing van.
   */
  public evaluateAndDispatchQueue(): void {
    if (this.dispatchLock) return;
    this.dispatchLock = true;

    try {
      const provider = this.providers.get('prov-rapid-tow-01');
      if (!provider) return;

      // Find available towing van
      const availableVan = provider.activeTowVehicles.find(v => v.status === 'AVAILABLE');

      // Get all pending requests sorted by priorityScore descending, then createdAt ascending
      const pendingRequests = Array.from(this.requests.values())
        .filter(r => ['REQUESTED', 'PRIORITY_ASSESSED'].includes(r.status))
        .sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) {
            return b.priorityScore - a.priorityScore;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      if (pendingRequests.length === 0) return;

      if (!availableVan) {
        // All vans are currently occupied: update queue position and ETA for pending requests
        pendingRequests.forEach((req, idx) => {
          req.queuePosition = idx + 1;
          req.status = 'PRIORITY_ASSESSED';
          // Estimated wait: ~12 mins for first in queue, ~24 mins for second
          req.estimatedArrivalMinutes = 12 * (idx + 1);
          req.updatedAt = new Date().toISOString();
        });
        return;
      }

      // We have an available van! Assign it to the top-priority request
      const highestPriorityRequest = pendingRequests[0];

      // Mark the van as BUSY immediately inside atomic section
      availableVan.status = 'BUSY';
      availableVan.currentIncidentId = highestPriorityRequest.id;

      // Find nearest station for towing target
      const stations = stationService.getAllStations();
      const nearestStation = stations.reduce((acc, st) => {
        const d = Math.hypot(st.position.x - highestPriorityRequest.location.x, st.position.z - highestPriorityRequest.location.z);
        const dAcc = Math.hypot(acc.position.x - highestPriorityRequest.location.x, acc.position.z - highestPriorityRequest.location.z);
        return d < dAcc ? st : acc;
      }, stations[0]);

      highestPriorityRequest.status = 'ASSIGNED';
      highestPriorityRequest.assignedProviderId = provider.id;
      highestPriorityRequest.assignedProviderName = provider.name;
      highestPriorityRequest.assignedVehicleId = availableVan.vehicleId;
      highestPriorityRequest.assignedVehicleCode = availableVan.code;
      highestPriorityRequest.assignedAt = new Date().toISOString();
      highestPriorityRequest.targetStationId = nearestStation.id;
      highestPriorityRequest.targetStationName = nearestStation.name;
      highestPriorityRequest.queuePosition = 0;
      highestPriorityRequest.estimatedArrivalMinutes = 5;
      highestPriorityRequest.updatedAt = new Date().toISOString();
      highestPriorityRequest.auditLog.push({
        timestamp: new Date().toISOString(),
        status: 'ASSIGNED',
        note: `Assigned towing van ${availableVan.code} (${availableVan.model}) to highest-priority incident. Destination: ${nearestStation.name}.`,
      });

      // Update simulation engine movement for towing vehicle
      simulationEngine.towVehicleToNearestStation(highestPriorityRequest.vehicleId);

      // Now update remaining pending requests in the waiting queue
      const remainingPending = pendingRequests.slice(1);
      remainingPending.forEach((req, idx) => {
        req.queuePosition = idx + 1;
        req.status = 'PRIORITY_ASSESSED';
        req.estimatedArrivalMinutes = 14 * (idx + 1);
        req.updatedAt = new Date().toISOString();
      });

      eventService.addEvent({
        type: 'SERVICE',
        severity: 'INFO',
        message: `🛻 Dispatched ${availableVan.code} to ${highestPriorityRequest.vehicleCode}. Second incident (${remainingPending[0]?.vehicleCode || 'queue'}) waiting at Queue Position #1.`,
        vehicleId: highestPriorityRequest.vehicleId,
        stationId: nearestStation.id,
      });

    } finally {
      this.dispatchLock = false;
    }
  }

  /**
   * Completes a rescue mission, releases the towing vehicle,
   * and automatically triggers evaluateAndDispatchQueue() to serve the next stranded EV!
   */
  public completeRescue(requestId: string): RescueRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    request.status = 'COMPLETED';
    request.completedAt = new Date().toISOString();
    request.updatedAt = request.completedAt;
    request.queuePosition = 0;
    request.estimatedArrivalMinutes = 0;
    request.auditLog.push({
      timestamp: request.completedAt,
      status: 'COMPLETED',
      note: `Rescue successfully completed. Vehicle towed to ${request.targetStationName || 'Charging Hub'}. Towing van released.`,
    });

    // Release towing vehicle
    const provider = this.providers.get('prov-rapid-tow-01');
    if (provider && request.assignedVehicleCode) {
      const van = provider.activeTowVehicles.find(v => v.code === request.assignedVehicleCode);
      if (van) {
        van.status = 'AVAILABLE';
        van.currentIncidentId = undefined;
      }
    }

    eventService.addEvent({
      type: 'SERVICE',
      severity: 'SUCCESS',
      message: `✅ Rescue mission complete for ${request.vehicleCode}! Tow van released to queue for next stranded vehicle.`,
      vehicleId: request.vehicleId,
    });

    // Check if another stranded vehicle is waiting in queue!
    this.evaluateAndDispatchQueue();

    return request;
  }

  public updateRequestStatus(requestId: string, status: RescueStatus, note?: string): RescueRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    request.status = status;
    request.updatedAt = new Date().toISOString();
    request.auditLog.push({
      timestamp: request.updatedAt,
      status,
      note: note || `Status updated to ${status}`,
    });

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      const provider = this.providers.get('prov-rapid-tow-01');
      if (provider && request.assignedVehicleCode) {
        const van = provider.activeTowVehicles.find(v => v.code === request.assignedVehicleCode);
        if (van) {
          van.status = 'AVAILABLE';
          van.currentIncidentId = undefined;
        }
      }
      this.evaluateAndDispatchQueue();
    }

    return request;
  }

  public getAllRequests(): RescueRequest[] {
    return Array.from(this.requests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getRequestById(id: string): RescueRequest | undefined {
    return this.requests.get(id);
  }

  public getRequestsByOwner(ownerId: string): RescueRequest[] {
    return Array.from(this.requests.values()).filter(r => r.ownerId === ownerId);
  }

  public getProviders(): RescueProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Helper to trigger the classic prompt scenario:
   * Two stranded EVs (EV-024 and EV-057) near a charging station, 1 towing van available.
   */
  public triggerTwoStrandedEvScenario(): { incident1: RescueRequest; incident2: RescueRequest } {
    // 1. Drain EV-024 on SH-40 Highway (Blocking active lane - Higher Danger)
    const ev1 = vehicleService.getAllVehicles().find(v => v.code === 'EV-024') || vehicleService.getAllVehicles()[0];
    simulationEngine.triggerLowBattery(ev1.code, 0);

    const req1 = this.createRequest({
      vehicleId: ev1.id,
      ownerId: 'usr-owner-01',
      ownerName: 'Rahul Sharma',
      laneBlocked: true,
      shoulderAvailable: false,
      passengerCount: 2,
      vulnerablePassengers: true,
      note: 'Critical breakdown: Stopped dead in fast lane on Boisar-Palghar SH-40 with elderly passenger.',
    });

    // 2. Drain EV-057 near Boisar Town Hub (Pulled onto shoulder - Lower Danger)
    const ev2 = vehicleService.getAllVehicles().find(v => v.code === 'EV-057') || vehicleService.getAllVehicles()[1];
    simulationEngine.triggerLowBattery(ev2.code, 0);

    const req2 = this.createRequest({
      vehicleId: ev2.id,
      ownerId: 'usr-owner-01',
      ownerName: 'Rahul Sharma',
      laneBlocked: false,
      shoulderAvailable: true,
      passengerCount: 1,
      vulnerablePassengers: false,
      note: 'Battery depleted near Boisar Town corridor. Safely parked on shoulder with hazard lights.',
    });

    return { incident1: req1, incident2: req2 };
  }
}

export const rescueService = RescueService.getInstance();
