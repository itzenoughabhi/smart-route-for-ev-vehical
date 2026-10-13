import { create } from 'zustand';
import { 
  Station, 
  Vehicle, 
  TrafficSignal,
  NetworkKPIs, 
  EnergyMetrics, 
  LiveEvent, 
  Recommendation, 
  PowerGrid, 
  ServiceCenter, 
  HomeCharger,
  CameraMode,
  MapMode,
  User,
  UserRole,
  RescueRequest,
  StationFinancialMetric,
  ExpansionCandidate,
  StationOwnerAlert,
  ManufacturerFleetAnalytics
} from '../types';

export interface SelectedObject {
  type: 'station' | 'charger' | 'vehicle' | 'grid' | 'service' | 'homeCharger';
  id: string;
  stationId?: string;
  data?: any;
}

interface DigitalTwinState {
  stations: Station[];
  vehicles: Vehicle[];
  trafficSignals: TrafficSignal[];
  powerGrid: PowerGrid | null;
  serviceCenter: ServiceCenter | null;
  homeChargers: HomeCharger[];
  kpis: NetworkKPIs;
  energy: EnergyMetrics;
  events: LiveEvent[];
  recommendations: Recommendation[];
  isConnected: boolean;
  simulationSpeed: number;
  scenarioStep: number;

  selectedObject: SelectedObject | null;
  cameraMode: CameraMode;
  mapMode: MapMode;
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  trackingVehicleId: string | null;
  isGridOverlayActive: boolean;
  isPanMode: boolean;
  activeSector: 'overview' | 'boisar' | 'tarapur' | 'dahanu' | 'palghar' | 'manor' | 'shirgaon';

  activeNav: 'overview' | 'stations' | 'vehicles' | 'grid' | 'service' | 'analytics' | 'incidents';
  isSimDrawerOpen: boolean;
  isEventsOpen: boolean;
  is2dMapOpen: boolean;
  isScenarioDrawerOpen: boolean;
  isAuditModalOpen: boolean;
  toggleAuditModal: (open?: boolean) => void;

  currentUser: User | null;
  activeStakeholderRole: UserRole;
  isStakeholderModalOpen: boolean;
  activeStakeholderDashboard: UserRole | null;
  rescueRequests: RescueRequest[];
  stationFinancials: StationFinancialMetric[];
  expansionCandidates: ExpansionCandidate[];
  stationAlerts: StationOwnerAlert[];
  manufacturerAnalytics: ManufacturerFleetAnalytics | null;

  setUser: (user: User | null) => void;
  setActiveStakeholderRole: (role: UserRole) => void;
  openStakeholderDashboard: (role: UserRole) => void;
  closeStakeholderDashboard: () => void;
  setRescueRequests: (requests: RescueRequest[]) => void;
  updateRescueRequest: (req: RescueRequest) => void;
  setStationFinancials: (metrics: StationFinancialMetric[]) => void;
  setExpansionCandidates: (candidates: ExpansionCandidate[]) => void;
  setStationAlerts: (alerts: StationOwnerAlert[]) => void;
  setManufacturerAnalytics: (analytics: ManufacturerFleetAnalytics) => void;
  assignVehicleToUser: (vehicleIdOrCode: string, email?: string, name?: string) => void;

  isManualDrive: boolean;
  manualDriveVehicleId: string | null;
  manualDriveSpeed: number;
  manualDriveGear: 'D' | 'R' | 'P';

  isDebugMode: boolean;
  debugGraph: boolean;
  debugStations: boolean;
  debugCollisions: boolean;
  toggleDebugMode: (active?: boolean) => void;
  toggleDebugOption: (option: 'debugGraph' | 'debugStations' | 'debugCollisions') => void;

  setSnapshot: (snapshot: any) => void;
  updateTick: (data: any) => void;
  addEvent: (event: LiveEvent) => void;
  setConnectionStatus: (status: boolean) => void;

  selectStation: (stationId: string) => void;
  selectVehicle: (vehicleId: string) => void;
  selectCharger: (stationId: string, chargerId: string) => void;
  selectGrid: () => void;
  selectServiceCenter: () => void;
  selectHomeCharger: (homeId: string) => void;
  clearSelection: () => void;
  setCameraMode: (mode: CameraMode) => void;
  setMapMode: (mode: MapMode) => void;
  recenterCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  togglePanMode: (active?: boolean) => void;
  panToSector: (sector: 'overview' | 'boisar' | 'tarapur' | 'dahanu' | 'palghar' | 'manor' | 'shirgaon') => void;
  toggleTrackVehicle: (vehicleId: string) => void;
  toggleGridOverlay: (active?: boolean) => void;
  setScenarioStep: (step: number) => void;

  setActiveNav: (nav: 'overview' | 'stations' | 'vehicles' | 'grid' | 'service' | 'analytics' | 'incidents') => void;
  toggleSimDrawer: (open?: boolean) => void;
  toggleEvents: (open?: boolean) => void;
  toggle2dMap: (open?: boolean) => void;
  toggleScenarioDrawer: (open?: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  resolveRecommendationLocally: (id: string, accept: boolean) => void;

  setManualDrive: (enabled: boolean, vehicleId?: string) => void;
  updateManualDriveSpeed: (speed: number, gear?: 'D' | 'R' | 'P') => void;
  updateManualVehiclePose: (x: number, z: number, heading: number, speed: number, gear?: 'D' | 'R' | 'P', batteryPct?: number, estimatedRangeKm?: number) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  setVehicleBattery: (id: string, pct: number) => void;
  returnToRoad: (vehicleId?: string) => void;
}

const DEFAULT_KPIS: NetworkKPIs = {
  activeStations: 4,
  availableChargers: 12,
  vehiclesCharging: 4,
  waitingVehicles: 2,
  activeFaults: 0,
  networkLoadMw: 3.4,
  totalDailyEnergyMwh: 24.5,
  serviceVehicles: 1,
  homeChargingVehicles: 2,
};

const DEFAULT_ENERGY: EnergyMetrics = {
  networkLoadKw: 3400,
  peakDemandKw: 4200,
  averageDemandKw: 3200,
  totalEnergyDeliveredKwh: 24500,
  chargingEfficiencyPct: 95.2,
  history: [],
};

const CITY_CAMERA_POS: [number, number, number] = [130, 140, 150];
const CITY_CAMERA_TARGET: [number, number, number] = [10, 2, 10];

function haveStationsChanged(prev: Station[], next?: Station[]): boolean {
  if (!next) return false;
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const n = next[i];
    if (p.id !== n.id || p.status !== n.status || p.currentLoadKw !== n.currentLoadKw) {
      return true;
    }
    const pQueueLen = p.queue ? p.queue.length : 0;
    const nQueueLen = n.queue ? n.queue.length : 0;
    if (pQueueLen !== nQueueLen) return true;
    if (p.chargers?.length !== n.chargers?.length) return true;
    for (let j = 0; j < p.chargers.length; j++) {
      if (
        p.chargers[j].status !== n.chargers[j].status ||
        p.chargers[j].currentEvId !== n.chargers[j].currentEvId ||
        p.chargers[j].currentPowerKw !== n.chargers[j].currentPowerKw
      ) {
        return true;
      }
    }
  }
  return false;
}

function haveHomeChargersChanged(prev: HomeCharger[], next?: HomeCharger[]): boolean {
  if (!next) return false;
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].status !== next[i].status || prev[i].chargingPowerKw !== next[i].chargingPowerKw) return true;
  }
  return false;
}

function haveKpisChanged(prev: NetworkKPIs, next?: NetworkKPIs): boolean {
  if (!next) return false;
  return (
    prev.activeStations !== next.activeStations ||
    prev.vehiclesCharging !== next.vehiclesCharging ||
    prev.waitingVehicles !== next.waitingVehicles ||
    prev.totalDailyEnergyMwh !== next.totalDailyEnergyMwh ||
    prev.networkLoadMw !== next.networkLoadMw
  );
}

function hasPowerGridChanged(prev: PowerGrid | null, next?: PowerGrid | null): boolean {
  if (!next && !prev) return false;
  if (!next || !prev) return true;
  return (
    prev.loadPercentage !== next.loadPercentage ||
    prev.currentLoadMw !== next.currentLoadMw ||
    prev.feeders?.length !== next.feeders?.length
  );
}

function hasServiceCenterChanged(prev: ServiceCenter | null, next?: ServiceCenter | null): boolean {
  if (!next && !prev) return false;
  if (!next || !prev) return true;
  if (prev.bays?.length !== next.bays?.length) return true;
  for (let i = 0; i < prev.bays.length; i++) {
    if (prev.bays[i].status !== next.bays[i].status || prev.bays[i].progressPct !== next.bays[i].progressPct) return true;
  }
  return false;
}

function haveTrafficSignalsChanged(prev: TrafficSignal[], next?: TrafficSignal[]): boolean {
  if (!next) return false;
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id || prev[i].state !== next[i].state) return true;
  }
  return false;
}

function haveEnergyMetricsChanged(prev: EnergyMetrics, next?: EnergyMetrics): boolean {
  if (!next) return false;
  return (
    Math.abs(prev.networkLoadKw - next.networkLoadKw) > 5 ||
    Math.abs(prev.totalEnergyDeliveredKwh - next.totalEnergyDeliveredKwh) > 2
  );
}

export const useDigitalTwinStore = create<DigitalTwinState>((set, get) => ({
  stations: [],
  vehicles: [],
  trafficSignals: [],
  powerGrid: null,
  serviceCenter: null,
  homeChargers: [],
  kpis: DEFAULT_KPIS,
  energy: DEFAULT_ENERGY,
  events: [],
  recommendations: [],
  isConnected: false,
  simulationSpeed: 1.0,
  scenarioStep: 0,

  selectedObject: null,
  cameraMode: 'CITY',
  mapMode: '3D_TWIN',
  cameraTarget: CITY_CAMERA_TARGET,
  cameraPosition: CITY_CAMERA_POS,
  trackingVehicleId: null,
  isGridOverlayActive: false,
  isPanMode: false,
  activeSector: 'overview',

  activeNav: 'overview',
  isSimDrawerOpen: false,
  isEventsOpen: false,
  is2dMapOpen: false,
  isScenarioDrawerOpen: false,
  isAuditModalOpen: false,
  toggleAuditModal: (open) => set((s) => ({ isAuditModalOpen: open ?? !s.isAuditModalOpen })),

  currentUser: {
    id: 'usr-owner-01',
    email: 'owner@evnexus.io',
    name: 'Rahul Sharma',
    role: 'EV_OWNER',
    organization: 'Private Vehicle Owner',
    assignedVehicleIds: ['veh-ev-024', 'veh-ev-057'],
  },
  activeStakeholderRole: 'EV_OWNER',
  isStakeholderModalOpen: false,
  activeStakeholderDashboard: null,
  rescueRequests: [],
  stationFinancials: [],
  expansionCandidates: [],
  stationAlerts: [],
  manufacturerAnalytics: null,

  setUser: (user) => set({ currentUser: user }),
  setActiveStakeholderRole: (role) => set({ activeStakeholderRole: role }),
  openStakeholderDashboard: (role) => set({ activeStakeholderDashboard: role, isStakeholderModalOpen: true }),
  closeStakeholderDashboard: () => set({ isStakeholderModalOpen: false, activeStakeholderDashboard: null }),
  setRescueRequests: (requests) => set({ rescueRequests: requests }),
  updateRescueRequest: (req) => set((s) => ({
    rescueRequests: s.rescueRequests.some(r => r.id === req.id)
      ? s.rescueRequests.map(r => r.id === req.id ? req : r)
      : [req, ...s.rescueRequests]
  })),
  setStationFinancials: (stationFinancials) => set({ stationFinancials }),
  setExpansionCandidates: (expansionCandidates) => set({ expansionCandidates }),
  setStationAlerts: (stationAlerts) => set({ stationAlerts }),
  setManufacturerAnalytics: (manufacturerAnalytics) => set({ manufacturerAnalytics }),
  assignVehicleToUser: (vehicleIdOrCode, email, name) => {
    set((state) => {
      const targetVeh = state.vehicles.find(
        (v) => v.id === vehicleIdOrCode || v.code.toLowerCase() === vehicleIdOrCode.toLowerCase()
      );
      const vehicleKey = targetVeh ? targetVeh.id : vehicleIdOrCode;
      const userEmail = email || state.currentUser?.email || 'owner@evnexus.io';
      const userName = name || (email ? email.split('@')[0] : state.currentUser?.name) || 'EV Driver';

      const updatedUser = {
        ...(state.currentUser || {
          id: `usr-${Date.now()}`,
          role: 'EV_OWNER' as const,
          organization: 'Private EV Owner',
          createdAt: new Date().toISOString(),
        }),
        email: userEmail,
        name: userName,
        role: 'EV_OWNER' as const,
        assignedVehicleIds: [vehicleKey, ...(state.currentUser?.assignedVehicleIds || [])],
      };

      return {
        currentUser: updatedUser,
        trackingVehicleId: vehicleKey,
        selectedObject: targetVeh ? { type: 'vehicle', id: targetVeh.id, data: targetVeh } : state.selectedObject,
        cameraMode: 'VEHICLE',
        cameraTarget: targetVeh ? [targetVeh.position.x, 1, targetVeh.position.z] : state.cameraTarget,
        cameraPosition: targetVeh ? [targetVeh.position.x, 14, targetVeh.position.z + 18] : state.cameraPosition,
      };
    });
  },

  isManualDrive: false,
  manualDriveVehicleId: null,
  manualDriveSpeed: 0,
  manualDriveGear: 'P',

  isDebugMode: false,
  debugGraph: true,
  debugStations: true,
  debugCollisions: true,
  toggleDebugMode: (active) => set((s) => ({ isDebugMode: active ?? !s.isDebugMode })),
  toggleDebugOption: (option) => set((s) => ({ [option]: !s[option] } as any)),

  setSnapshot: (snapshot) => {
    set({
      stations: snapshot.stations || [],
      vehicles: snapshot.vehicles || [],
      trafficSignals: snapshot.trafficSignals || [],
      powerGrid: snapshot.powerGrid || null,
      serviceCenter: snapshot.serviceCenter || null,
      homeChargers: snapshot.homeChargers || [],
      kpis: snapshot.kpis || DEFAULT_KPIS,
      energy: snapshot.energy || DEFAULT_ENERGY,
      events: snapshot.events || [],
      recommendations: snapshot.recommendations || [],
      rescueRequests: snapshot.rescueRequests || [],
      simulationSpeed: snapshot.simulation?.speed ?? 1.0,
      isConnected: true,
    });
  },

  updateTick: (data) => {
    set((state) => {
      const updatedRecs = data.recommendation 
        ? [data.recommendation, ...state.recommendations.filter(r => r.id !== data.recommendation.id)]
        : state.recommendations;

      const stationsToSet = haveStationsChanged(state.stations, data.stations) ? (data.stations || state.stations) : state.stations;
      const homeChargersToSet = haveHomeChargersChanged(state.homeChargers, data.homeChargers) ? (data.homeChargers || state.homeChargers) : state.homeChargers;
      const kpisToSet = haveKpisChanged(state.kpis, data.kpis) ? (data.kpis || state.kpis) : state.kpis;
      const powerGridToSet = hasPowerGridChanged(state.powerGrid, data.powerGrid) ? (data.powerGrid || state.powerGrid) : state.powerGrid;
      const serviceCenterToSet = hasServiceCenterChanged(state.serviceCenter, data.serviceCenter) ? (data.serviceCenter || state.serviceCenter) : state.serviceCenter;

      const trafficSignalsToSet = haveTrafficSignalsChanged(state.trafficSignals, data.trafficSignals) ? (data.trafficSignals || state.trafficSignals) : state.trafficSignals;
      const energyToSet = haveEnergyMetricsChanged(state.energy, data.energy) ? (data.energy || state.energy) : state.energy;

      return {
        stations: stationsToSet,
        vehicles: data.vehicles || state.vehicles,
        trafficSignals: trafficSignalsToSet,
        powerGrid: powerGridToSet,
        serviceCenter: serviceCenterToSet,
        homeChargers: homeChargersToSet,
        kpis: kpisToSet,
        energy: energyToSet,
        recommendations: updatedRecs,
      };
    });
  },

  addEvent: (event) => {
    set((state) => ({
      events: [event, ...state.events.slice(0, 39)],
    }));
  },

  setConnectionStatus: (status) => set({ isConnected: status }),

  selectStation: (stationId) => {
    const { stations } = get();
    const st = stations.find((s) => s.id === stationId || s.code.toLowerCase() === stationId.toLowerCase());
    if (!st) return;

    set({
      selectedObject: { type: 'station', id: st.id, data: st },
      cameraMode: 'STATION',
      cameraTarget: [st.position.x, 1.5, st.position.z],
      cameraPosition: [st.position.x, 18, st.position.z + 24],
      trackingVehicleId: null,
    });
  },

  selectVehicle: (vehicleId) => {
    const { vehicles } = get();
    const veh = vehicles.find((v) => v.id === vehicleId || v.code.toLowerCase() === vehicleId.toLowerCase());
    if (!veh) return;

    set({
      selectedObject: { type: 'vehicle', id: veh.id, data: veh },
      cameraMode: 'VEHICLE',
      trackingVehicleId: veh.id,
      cameraTarget: [veh.position.x, 1, veh.position.z],
      cameraPosition: [veh.position.x, 14, veh.position.z + 18],
    });
  },

  selectCharger: (stationId, chargerId) => {
    const { stations } = get();
    const st = stations.find((s) => s.id === stationId);
    if (!st) return;
    const ch = st.chargers.find((c) => c.id === chargerId || c.code === chargerId);
    if (!ch) return;

    set({
      selectedObject: { type: 'charger', id: ch.id, stationId: st.id, data: { ...ch, station: st } },
      cameraMode: 'STATION',
      cameraTarget: [st.position.x, 1.5, st.position.z],
      cameraPosition: [st.position.x, 14, st.position.z + 18],
      trackingVehicleId: null,
    });
  },

  selectGrid: () => {
    const { powerGrid } = get();
    const pos = powerGrid?.position || { x: -26, y: 0, z: -38 };
    set({
      selectedObject: { type: 'grid', id: 'grid-s01', data: powerGrid },
      cameraMode: 'GRID',
      isGridOverlayActive: true,
      trackingVehicleId: null,
      cameraTarget: [pos.x, 2, pos.z],
      cameraPosition: [pos.x + 12, 28, pos.z + 32],
    });
  },

  selectServiceCenter: () => {
    const { serviceCenter } = get();
    const pos = serviceCenter?.position || { x: -14, y: 0, z: 24 };
    set({
      selectedObject: { type: 'service', id: 's03', data: serviceCenter },
      cameraMode: 'SERVICE',
      trackingVehicleId: null,
      cameraTarget: [pos.x, 1.8, pos.z],
      cameraPosition: [pos.x + 10, 20, pos.z + 24],
    });
  },

  selectHomeCharger: (homeId) => {
    const { homeChargers } = get();
    const hc = homeChargers.find(h => h.homeId === homeId);
    if (!hc) return;

    set({
      selectedObject: { type: 'homeCharger', id: hc.homeId, data: hc },
      trackingVehicleId: null,
      cameraTarget: [hc.position.x, 1.5, hc.position.z],
      cameraPosition: [hc.position.x + 8, 14, hc.position.z + 14],
    });
  },

  clearSelection: () => set({ selectedObject: null, trackingVehicleId: null }),

  setCameraMode: (mode) => {
    const { stations, vehicles, powerGrid, serviceCenter } = get();
    set({ cameraMode: mode });

    switch (mode) {
      case 'CITY':
        set({
          selectedObject: null,
          trackingVehicleId: null,
          cameraTarget: CITY_CAMERA_TARGET,
          cameraPosition: CITY_CAMERA_POS,
        });
        break;
      case 'STATION':
        if (stations.length > 0) {
          get().selectStation(stations[0].id);
        }
        break;
      case 'VEHICLE':
        if (vehicles.length > 0) {
          get().selectVehicle(vehicles[0].id);
        }
        break;
      case 'GRID':
        get().selectGrid();
        break;
      case 'SERVICE':
        get().selectServiceCenter();
        break;
    }
  },

  setMapMode: (mode) => {
    set({ mapMode: mode });

    switch (mode) {
      case 'REAL_MAP':
        break;
      case '3D_TWIN':
        set({ cameraMode: 'CITY' });
        break;
      case 'VEHICLE_FOLLOW': {
        const { vehicles, selectedObject, selectVehicle } = get();
        const vehId = (selectedObject?.type === 'vehicle' && selectedObject.id) || vehicles[0]?.id;
        if (vehId) {
          selectVehicle(vehId);
        }
        break;
      }
      case 'CHARGING_NETWORK': {
        const { stations, selectStation } = get();
        if (stations.length > 0) {
          selectStation(stations[0].id);
        }
        break;
      }
      case 'POWER_GRID': {
        const { selectGrid, toggleGridOverlay } = get();
        selectGrid();
        toggleGridOverlay(true);
        break;
      }
      case 'SERVICE_NETWORK': {
        const { selectServiceCenter } = get();
        selectServiceCenter();
        break;
      }
    }
  },

  recenterCamera: () => {
    set({
      selectedObject: null,
      trackingVehicleId: null,
      cameraMode: 'CITY',
      activeSector: 'overview',
      cameraTarget: CITY_CAMERA_TARGET,
      cameraPosition: CITY_CAMERA_POS,
    });
  },

  togglePanMode: (active) => set((s) => ({ isPanMode: active ?? !s.isPanMode })),

  panToSector: (sector) => {
    set({ selectedObject: null, trackingVehicleId: null, cameraMode: 'CITY', activeSector: sector });
    switch (sector) {
      case 'overview':
        set({ cameraTarget: [10, 2, 10], cameraPosition: [130, 140, 150] });
        break;
      case 'boisar':
        set({ cameraTarget: [6, 1, -18], cameraPosition: [24, 28, 6] });
        break;
      case 'tarapur':
        set({ cameraTarget: [-180, 1, -40], cameraPosition: [-160, 32, -14] });
        break;
      case 'dahanu':
        set({ cameraTarget: [36, 1, -220], cameraPosition: [56, 36, -194] });
        break;
      case 'palghar':
        set({ cameraTarget: [48, 1, 200], cameraPosition: [68, 36, 226] });
        break;
      case 'manor':
        set({ cameraTarget: [210, 1, -20], cameraPosition: [230, 36, 4] });
        break;
      case 'shirgaon':
        set({ cameraTarget: [-65, 1, 210], cameraPosition: [-45, 32, 236] });
        break;
    }
  },

  zoomIn: () => {
    set((s) => {
      const [px, py, pz] = s.cameraPosition;
      const [tx, ty, tz] = s.cameraTarget;
      return {
        cameraPosition: [
          tx + (px - tx) * 0.8,
          Math.max(6, ty + (py - ty) * 0.8),
          tz + (pz - tz) * 0.8,
        ],
      };
    });
  },

  zoomOut: () => {
    set((s) => {
      const [px, py, pz] = s.cameraPosition;
      const [tx, ty, tz] = s.cameraTarget;
      return {
        cameraPosition: [
          tx + (px - tx) * 1.25,
          Math.min(100, ty + (py - ty) * 1.25),
          tz + (pz - tz) * 1.25,
        ],
      };
    });
  },

  toggleTrackVehicle: (vehicleId) => {
    set((s) => ({
      trackingVehicleId: s.trackingVehicleId === vehicleId ? null : vehicleId,
      cameraMode: s.trackingVehicleId === vehicleId ? 'CITY' : 'VEHICLE',
    }));
  },

  toggleGridOverlay: (active) => set((s) => ({ isGridOverlayActive: active ?? !s.isGridOverlayActive })),
  setScenarioStep: (step) => set({ scenarioStep: step }),

  setActiveNav: (nav) => set({ activeNav: nav }),
  toggleSimDrawer: (open) => set((s) => ({ isSimDrawerOpen: open ?? !s.isSimDrawerOpen })),
  toggleEvents: (open) => set((s) => ({ isEventsOpen: open ?? !s.isEventsOpen })),
  toggle2dMap: (open) => set((s) => ({ is2dMapOpen: open ?? !s.is2dMapOpen })),
  toggleScenarioDrawer: (open) => set((s) => ({ isScenarioDrawerOpen: open ?? !s.isScenarioDrawerOpen })),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  resolveRecommendationLocally: (id, accept) => {
    set((state) => ({
      recommendations: state.recommendations.filter((r) => r.id !== id),
    }));
  },

  setManualDrive: (enabled, vehicleId) => {
    set((state) => {
      const targetVehicleId = vehicleId || state.manualDriveVehicleId || (state.selectedObject?.type === 'vehicle' ? state.selectedObject.id : null) || state.vehicles[0]?.id || 'veh-ev-024';

      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === targetVehicleId) {
          const isOffRoad = Math.abs(v.position.z) > 55 || Math.abs(v.position.x) > 75;
          const roadPos = isOffRoad ? { x: 26, y: 0.04, z: 42 } : { ...v.position, y: 0.04 };
          const roadHeading = isOffRoad ? 3.3 : (v.heading || 0);

          return {
            ...v,
            position: roadPos,
            heading: roadHeading,
            status: (enabled ? 'MANUAL_DRIVE' : 'EN_ROUTE') as any,
          };
        }
        return v;
      });

      return {
        isManualDrive: enabled,
        manualDriveVehicleId: enabled ? targetVehicleId : null,
        manualDriveSpeed: 0,
        manualDriveGear: enabled ? 'D' : 'P',
        mapMode: enabled ? '3D_TWIN' : state.mapMode,
        cameraMode: enabled ? 'VEHICLE' : state.cameraMode,
        trackingVehicleId: enabled ? targetVehicleId : state.trackingVehicleId,
        selectedObject: enabled && targetVehicleId ? { type: 'vehicle', id: targetVehicleId } : state.selectedObject,
        vehicles: updatedVehicles,
      };
    });
  },

  updateManualDriveSpeed: (speed, gear) => {
    set((state) => ({
      manualDriveSpeed: speed,
      manualDriveGear: gear ?? state.manualDriveGear,
    }));
  },

  updateManualVehiclePose: (x, z, heading, speed, gear, batteryPct, estimatedRangeKm) => {
    set((state) => {
      if (!state.manualDriveVehicleId) return state;
      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === state.manualDriveVehicleId) {
          return {
            ...v,
            position: { x, y: 0.04, z },
            heading,
            speed,
            currentBatteryPct: batteryPct !== undefined ? batteryPct : v.currentBatteryPct,
            estimatedRangeKm: estimatedRangeKm !== undefined ? estimatedRangeKm : v.estimatedRangeKm,
          };
        }
        return v;
      });
      return {
        vehicles: updatedVehicles,
        manualDriveSpeed: speed,
        manualDriveGear: gear ?? state.manualDriveGear,
      };
    });
  },

  returnToRoad: (vehicleId) => {
    const targetId = vehicleId || get().manualDriveVehicleId || (get().selectedObject?.type === 'vehicle' ? get().selectedObject.id : null) || get().vehicles[0]?.id || 'veh-ev-024';
    set((state) => {
      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === targetId) {
          return {
            ...v,
            position: { x: 26, y: 0.04, z: 42 },
            heading: 3.3,
            speed: state.isManualDrive ? 0 : 36,
            status: (state.isManualDrive ? 'MANUAL_DRIVE' : 'EN_ROUTE') as any,
          };
        }
        return v;
      });
      return {
        vehicles: updatedVehicles,
        manualDriveSpeed: 0,
      };
    });
  },

  updateVehicle: (id, updates) => {
    set((state) => {
      const updatedVehicles = state.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));
      const updatedSelected = state.selectedObject?.type === 'vehicle' && state.selectedObject.id === id
        ? { ...state.selectedObject, data: { ...state.selectedObject.data, ...updates } }
        : state.selectedObject;
      return {
        vehicles: updatedVehicles,
        selectedObject: updatedSelected,
      };
    });
  },

  setVehicleBattery: (id, pct) => {
    const clampedPct = Math.max(0, Math.min(100, Math.round(pct)));
    const estimatedRange = clampedPct <= 0 ? 0 : Math.max(1, Math.round((clampedPct / 100) * 380));
    set((state) => {
      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === id || v.code.toLowerCase() === id.toLowerCase()) {
          const isZero = clampedPct <= 0;
          return {
            ...v,
            currentBatteryPct: clampedPct,
            estimatedRangeKm: estimatedRange,
            status: isZero ? ('STRANDED' as const) : clampedPct <= 20 ? ('LOW_BATTERY' as const) : v.status === 'STRANDED' ? ('EN_ROUTE' as const) : v.status,
            speed: isZero ? 0 : v.speed,
            vehicleHealth: isZero ? ('CRITICAL' as const) : clampedPct <= 20 ? ('WARNING' as const) : ('GOOD' as const),
          };
        }
        return v;
      });

      const updatedSelected = state.selectedObject?.type === 'vehicle' && 
        (state.selectedObject.id === id || (state.selectedObject.data as any)?.code?.toLowerCase() === id.toLowerCase())
        ? {
            ...state.selectedObject,
            data: {
              ...(state.selectedObject.data || {}),
              currentBatteryPct: clampedPct,
              estimatedRangeKm: estimatedRange,
              status: clampedPct <= 0 ? 'STRANDED' : clampedPct <= 20 ? 'LOW_BATTERY' : ((state.selectedObject.data as any)?.status === 'STRANDED' ? 'EN_ROUTE' : ((state.selectedObject.data as any)?.status || 'EN_ROUTE')),
              speed: clampedPct <= 0 ? 0 : ((state.selectedObject.data as any)?.speed ?? 40),
              vehicleHealth: clampedPct <= 0 ? 'CRITICAL' : clampedPct <= 20 ? 'WARNING' : 'GOOD',
            },
          }
        : state.selectedObject;

      return {
        vehicles: updatedVehicles,
        selectedObject: updatedSelected,
      };
    });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__DIGITAL_TWIN_STORE__ = useDigitalTwinStore;
}
