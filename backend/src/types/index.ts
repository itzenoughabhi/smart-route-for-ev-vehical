export type StationStatus = 'ONLINE' | 'DEGRADED' | 'OVERLOADED' | 'OFFLINE';

export type TrafficSignalColor = 'RED' | 'YELLOW' | 'GREEN';

export interface TrafficSignal {
  id: string;
  name: string;
  intersection: string;
  position: Position3D;
  stopLine: Position3D;
  heading: number;
  state: TrafficSignalColor;
  timeRemainingSec: number;
}

export type ChargerStatus = 
  | 'AVAILABLE' 
  | 'CHARGING' 
  | 'OCCUPIED' 
  | 'FAULT' 
  | 'MAINTENANCE' 
  | 'OFFLINE';

export type VehicleStatus = 
  | 'EN_ROUTE' 
  | 'PAUSED'
  | 'ARRIVING' 
  | 'ENTERING_STATION'
  | 'REVERSE_PARKING'
  | 'QUEUE' 
  | 'CHARGER_ASSIGNED' 
  | 'CHARGING' 
  | 'COMPLETED' 
  | 'DEPARTING' 
  | 'LEAVING_STATION'
  | 'LOW_BATTERY' 
  | 'STRANDED'
  | 'BEING_TOWED'
  | 'FAULT' 
  | 'SERVICE_REQUIRED' 
  | 'UNDER_REPAIR' 
  | 'READY' 
  | 'MANUAL_DRIVE'
  | 'LEFT_NETWORK';

export type TrafficState = 
  | 'CRUISING'
  | 'APPROACHING_INTERSECTION'
  | 'WAITING_INTERSECTION'
  | 'TURNING'
  | 'FOLLOWING'
  | 'OVERTAKING'
  | 'STOPPED'
  | 'QUEUING'
  | 'ENTERING_STATION'
  | 'REVERSE_PARKING'
  | 'CHARGING'
  | 'LEAVING_STATION'
  | 'FAULT'
  | 'REROUTING'
  | 'SERVICE_ROUTE'
  | 'TOWING'
  | 'BEING_TOWED'
  | 'RETURNING';

export type VehicleModel = 
  | 'Tata Nexon EV'
  | 'Mahindra XUV400'
  | 'MG ZS EV'
  | 'Tata Tiago EV'
  | 'Hyundai Ioniq 5'
  | 'Commercial EV Van'
  | 'Heavy Electric Hauler'
  | 'Electric Pickup Truck'
  | 'Tesla Model Y'
  | 'Porsche Taycan'
  | 'Mercedes EQS'
  | 'Lucid Air EV'
  | 'Highway Patrol EV'
  | 'Electric City Bus'
  | 'CyberSedan'
  | 'Apex SUV'
  | 'BYD Atto 3'
  | 'Kia EV6';

export type IncidentSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type IncidentStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Charger {
  id: string;
  code: string;
  stationId: string;
  status: ChargerStatus;
  powerKw: number;
  currentPowerKw: number;
  currentEvId: string | null;
  failureCount: number;
  faultReason?: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  district: string;
  status: StationStatus;
  position: Position3D;
  maxCapacityKw: number;
  currentLoadKw: number;
  dailyEnergyKwh: number;
  utilizationRate: number;
  avgChargingTimeMin: number;
  estimatedWaitMinutes: number;
  todaySessionsCount: number;
  chargers: Charger[];
  queue: string[];
  activeIncidentsCount: number;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  code: string;
  model: VehicleModel;
  batteryCapacityKwh: number;
  currentBatteryPct: number;
  targetBatteryPct: number;
  estimatedRangeKm: number;
  status: VehicleStatus;
  trafficState?: TrafficState;
  driveMode?: 'ECO' | 'CITY' | 'SPORT';
  speed: number;
  position: Position3D;
  heading: number;
  destinationStationId: string | null;
  assignedChargerId: string | null;
  currentStationId: string | null;
  currentLocationName: string;
  etaMinutes: number;
  routeProgress: number;
  routeWaypoints: Position3D[];
  currentWaypointIndex: number;
  chargingRateKw: number;
  energyConsumedKwh: number;
  tripDistanceKm: number;
  motorTemperatureC: number;
  batteryTemperatureC: number;
  brakeSystemHealth: 'NORMAL' | 'WARNING';
  tyreHealth: 'NORMAL' | 'WARNING';
  vehicleHealth: 'GOOD' | 'WARNING' | 'CRITICAL';
  faultReason: string | null;
  serviceCenterId: string | null;
  repairProgressPct: number;
  repairStage?: 'DIAGNOSIS' | 'REPAIR_IN_PROGRESS' | 'REPAIR_COMPLETE';
  towedByVehicleId?: string | null;
  towingVehicleId?: string | null;
  updatedAt: string;
}

export interface HomeCharger {
  homeId: string;
  chargerId: string;
  locationName: string;
  position: Position3D;
  connectedEvId: string | null;
  connectedEvModel?: string;
  chargingPowerKw: number;
  batteryPct: number;
  status: 'CHARGING' | 'STANDBY' | 'AVAILABLE';
  estimatedCompletionTime: string;
  updatedAt: string;
}

export interface ServiceCenterBay {
  bayIndex: number;
  vehicleId: string | null;
  vehicleCode: string | null;
  status: 'AVAILABLE' | 'OCCUPIED';
  problem?: string;
  progressPct?: number;
  estimatedTimeMin?: number;
}

export interface ServiceCenter {
  id: string;
  code: string;
  name: string;
  locationName: string;
  position: Position3D;
  totalBays: number;
  occupiedBays: number;
  availableBays: number;
  techniciansCount: number;
  batteryDiagnostics: 'AVAILABLE' | 'ACTIVE';
  bays: ServiceCenterBay[];
  updatedAt: string;
}

export interface PowerGridFeeder {
  id: string;
  name: string;
  targetType: 'PUBLIC_STATIONS' | 'INDUSTRIAL_MIDC' | 'RESIDENTIAL_BETEGAON' | 'RESIDENTIAL_SARAVALI';
  loadMw: number;
  capacityMw: number;
  status: 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface PowerGrid {
  substationId: string;
  substationName: string;
  position: Position3D;
  capacityMw: number;
  currentLoadMw: number;
  loadPercentage: number;
  status: 'NORMAL' | 'OVERLOAD_RISK';
  feeders: PowerGridFeeder[];
  isSurgeActive: boolean;
  updatedAt: string;
}

export interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'STATUS_CHANGE' | 'FAULT' | 'ARRIVAL' | 'CHARGING_START' | 'COMPLETED' | 'REDIRECT' | 'OVERLOAD' | 'SERVICE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  message: string;
  stationId?: string;
  chargerId?: string;
  vehicleId?: string;
  metadata?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  currentStationId: string;
  currentStationCode: string;
  recommendedStationId: string;
  recommendedStationCode: string;
  currentWaitMinutes: number;
  recommendedWaitMinutes: number;
  potentialSavingMinutes: number;
  reason: string;
  timestamp: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface EnergyMetrics {
  networkLoadKw: number;
  peakDemandKw: number;
  averageDemandKw: number;
  totalEnergyDeliveredKwh: number;
  chargingEfficiencyPct: number;
  history: Array<{
    time: string;
    loadKw: number;
    solarGenerationKw: number;
  }>;
}

export interface NetworkKPIs {
  activeStations: number;
  availableChargers: number;
  vehiclesCharging: number;
  waitingVehicles: number;
  activeFaults: number;
  networkLoadMw: number;
  totalDailyEnergyMwh: number;
  serviceVehicles: number;
  homeChargingVehicles: number;
}
