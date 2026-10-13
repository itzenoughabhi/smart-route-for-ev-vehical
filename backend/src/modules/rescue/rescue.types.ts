export type RescueStatus =
  | 'REQUESTED'
  | 'PRIORITY_ASSESSED'
  | 'ASSIGNED'
  | 'PROVIDER_EN_ROUTE'
  | 'ARRIVED'
  | 'RESCUE_IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'UNAVAILABLE';

export interface RescueRequest {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  vehicleModel: string;
  ownerId?: string;
  ownerName: string;
  ownerContact?: string;
  
  // Incident Location & Safety Data
  location: { x: number; y: number; z: number };
  locationName: string;
  roadName: string;
  batterySoc: number; // %
  
  // Safety & Hazard Criteria
  laneBlocked: boolean;        // Blocking active traffic lane
  shoulderAvailable: boolean;  // Pulled over safely
  hazardLightsOn: boolean;
  passengerCount: number;
  vulnerablePassengers: boolean; // Elderly, children, medical
  weatherRisk: boolean;
  trafficSpeedKmh: number;

  // Priority Assessment
  priorityScore: number;       // 0 - 100
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityFactors: string[];

  // Assignment details
  status: RescueStatus;
  assignedProviderId?: string;
  assignedProviderName?: string;
  assignedVehicleId?: string;
  assignedVehicleCode?: string;
  assignedAt?: string;
  targetStationId?: string;
  targetStationName?: string;
  
  // Queue & Timing
  queuePosition?: number;
  estimatedArrivalMinutes?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  auditLog: Array<{
    timestamp: string;
    status: RescueStatus;
    note: string;
    operator?: string;
  }>;
}

export interface RescueProvider {
  id: string;
  name: string;
  contactNumber: string;
  coverageRegion: string[];
  vehicleTypesSupported: string[];
  activeTowVehicles: Array<{
    vehicleId: string;
    code: string;
    model: string;
    status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE' | 'OFFLINE';
    currentIncidentId?: string;
    capacityTon: number;
  }>;
}
