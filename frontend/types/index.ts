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

export type CameraMode = 'CITY' | 'STATION' | 'VEHICLE' | 'GRID' | 'SERVICE';

export type MapMode = 
  | 'REAL_MAP' 
  | '3D_TWIN' 
  | 'VEHICLE_FOLLOW' 
  | 'CHARGING_NETWORK' 
  | 'POWER_GRID' 
  | 'SERVICE_NETWORK';

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

export type UserRole = 
  | 'EV_OWNER'
  | 'EV_MANUFACTURER'
  | 'STATION_OWNER'
  | 'RESCUE_OPERATOR'
  | 'PLATFORM_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  assignedVehicleIds?: string[];
  assignedStationIds?: string[];
  manufacturerBrand?: string;
  rescueProviderId?: string;
}

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
  location: { x: number; y: number; z: number };
  locationName: string;
  roadName: string;
  batterySoc: number;
  laneBlocked: boolean;
  shoulderAvailable: boolean;
  hazardLightsOn: boolean;
  passengerCount: number;
  vulnerablePassengers: boolean;
  weatherRisk: boolean;
  trafficSpeedKmh: number;
  priorityScore: number;
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityFactors: string[];
  status: RescueStatus;
  assignedProviderId?: string;
  assignedProviderName?: string;
  assignedVehicleId?: string;
  assignedVehicleCode?: string;
  assignedAt?: string;
  targetStationId?: string;
  targetStationName?: string;
  queuePosition?: number;
  estimatedArrivalMinutes?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  auditLog: Array<{
    timestamp: string;
    status: RescueStatus;
    note: string;
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

export interface StationFinancialMetric {
  stationId: string;
  stationCode: string;
  stationName: string;
  district: string;
  totalBays: number;
  availableBays: number;
  occupancyPct: number;
  queueLength: number;
  uptimePct: number;
  avgChargingDurationMin: number;
  avgWaitTimeMin: number;
  peakHour: string;
  dailyEnergyDeliveredKwh: number;
  monthlyEnergyDeliveredKwh: number;
  grossRevenueMonthly: number;
  wholesaleElectricityCostMonthly: number;
  grossMarginMonthly: number;
  grossMarginPct: number;
  opexBreakdown: {
    electricityCost: number;
    demandCharges: number;
    maintenance: number;
    rentAndLease: number;
    staffing: number;
    networkFees: number;
  };
  totalOpexMonthly: number;
  netOperatingProfitMonthly: number;
  operatingMarginPct: number;
  revenuePerBayMonthly: number;
  profitPerBayMonthly: number;
  estimatedCapitalInvested: number;
  estimatedPaybackPeriodMonths: number;
  annualizedRoiPct: number;
  profitabilityRank: number;
}

export interface ExpansionCandidate {
  id: string;
  name: string;
  locationArea: string;
  zoneType: 'INDUSTRIAL_TRANSIT' | 'HIGHWAY_INTERCHANGE' | 'URBAN_RAILWAY' | 'COASTAL_TOURISM';
  targetBaysCount: number;
  transformerCapacityKva: number;
  estimatedDailyTrafficEVs: number;
  projectedDailySessions: number;
  projectedMonthlyEnergyKwh: number;
  initialCapex: number;
  capexBreakdown: {
    chargers: number;
    transformerAndGrid: number;
    civilAndCanopy: number;
    licensingAndApprovals: number;
  };
  projectedMonthlyRevenue: number;
  projectedMonthlyOpex: number;
  projectedMonthlyNetProfit: number;
  estimatedPaybackMonths: number;
  gridReadinessScore: number;
  competitionDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendationRank: number;
  recommendationReason: string;
}

export interface StationOwnerAlert {
  id: string;
  stationCode: string;
  type: 'QUEUE_SPIKE' | 'CHARGER_FAULT' | 'LOW_UTILIZATION' | 'EXPANSION_OPPORTUNITY' | 'COST_SURGE';
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
}

export interface ManufacturerFleetAnalytics {
  brand: string;
  anonymizedFleetCount: number;
  regionalAdoption: Array<{
    region: string;
    totalRegisteredEVs: number;
    growthRateYoY: number;
    brandMarketSharePct: Record<string, number>;
    topModels: Array<{ model: string; count: number; sharePct: number }>;
  }>;
  batteryHealthByModel: Array<{
    model: string;
    sampleSize: number;
    avgSOHPct: number;
    avgRangeRetentionPct: number;
    degradationPer10kKmPct: number;
    fastChargeExposurePct: number;
    avgBatteryTempCelsius: number;
  }>;
  incidentHotspots: Array<{
    corridorName: string;
    region: string;
    incidentCount: number;
    primaryCause: string;
    avgResponseTimeMin: number;
    severityDistribution: { critical: number; warning: number; info: number };
  }>;
  chargingPatterns: Array<{
    hourOfDay: number;
    avgSessionDurationMin: number;
    avgEnergyDeliveredKwh: number;
    preferredChargerType: '150kW_DC' | '350kW_DC' | 'AC_SLOW';
    avgStartingSocPct: number;
    avgEndingSocPct: number;
  }>;
  underservedZones: Array<{ zone: string; evDensity: string; chargerGap: string; priority: string }>;
  privacyNotice: string;
}

