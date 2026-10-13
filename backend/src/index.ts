import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbService } from './database/prisma';
import { stationService } from './modules/stations/station.service';
import { vehicleService } from './modules/vehicles/vehicle.service';
import { energyService } from './modules/energy/energy.service';
import { eventService } from './modules/events/event.service';
import { aiService } from './modules/ai/ai.service';
import { simulationEngine } from './modules/simulation/simulation.engine';
import { trafficController } from './modules/simulation/traffic.controller';
import { WorldValidator } from './modules/simulation/world.validator';
import { WebSocketGateway } from './websocket/gateway';
import { authService } from './modules/auth/auth.service';
import { authenticate, requireRole, AuthenticatedRequest } from './modules/auth/auth.middleware';
import { rescueService } from './modules/rescue/rescue.service';
import { stationAnalyticsService } from './modules/stations/station.analytics.service';
import { manufacturerAnalyticsService } from './modules/manufacturer/manufacturer.analytics.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wsGateway = new WebSocketGateway(server);

const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'EVNEXUS Boisar Digital Twin Server',
    databaseConnected: dbService.isConnected,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/stations', (req, res) => {
  res.json(stationService.getAllStations());
});

apiRouter.get('/stations/:id', (req, res) => {
  const station = stationService.getStationById(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found' });
  res.json(station);
});

apiRouter.get('/service-center', (req, res) => {
  res.json(stationService.getServiceCenter());
});

apiRouter.get('/home-chargers', (req, res) => {
  res.json(stationService.getAllHomeChargers());
});

apiRouter.get('/grid', (req, res) => {
  res.json(energyService.getPowerGrid());
});

apiRouter.get('/chargers', (req, res) => {
  const stations = stationService.getAllStations();
  const allChargers = stations.flatMap(s => s.chargers);
  res.json(allChargers);
});

apiRouter.get('/vehicles', (req, res) => {
  res.json(vehicleService.getAllVehicles());
});

apiRouter.get('/vehicles/:id', (req, res) => {
  const vehicle = vehicleService.getVehicleById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

apiRouter.get('/events', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  res.json(eventService.getEvents(limit));
});

apiRouter.get('/energy', (req, res) => {
  res.json(energyService.getEnergyMetrics());
});

apiRouter.get('/kpis', (req, res) => {
  res.json(energyService.getKPIs());
});

apiRouter.get('/traffic-signals', (req, res) => {
  res.json(trafficController.getAllSignals());
});

apiRouter.get('/world-validation', (req, res) => {
  res.json(WorldValidator.runValidation());
});

apiRouter.post('/simulation/vehicle', (req, res) => {
  const vehicle = vehicleService.spawnVehicle(req.body);
  wsGateway.broadcastVehicleUpdate(vehicle);
  res.status(201).json(vehicle);
});

apiRouter.post('/simulation/fault', (req, res) => {
  const { stationCode, chargerCode } = req.body;
  const result = simulationEngine.triggerFault(stationCode, chargerCode);
  if (result?.station) {
    wsGateway.broadcastStationUpdate(result.station);
  }
  res.json({ success: true, result });
});

apiRouter.post('/simulation/ev-fault', (req, res) => {
  const { vehicleCode } = req.body;
  const v = simulationEngine.triggerEVFault(vehicleCode || 'EV-024');
  if (v) wsGateway.broadcastVehicleUpdate(v);
  res.json({ success: true, vehicle: v });
});

apiRouter.post('/simulation/low-battery', (req, res) => {
  const { vehicleCode, pct } = req.body;
  const targetPct = pct !== undefined ? Number(pct) : 18;
  const v = simulationEngine.triggerLowBattery(vehicleCode || 'EV-024', targetPct);
  if (v) wsGateway.broadcastVehicleUpdate(v);
  res.json({ success: true, vehicle: v });
});

apiRouter.post('/simulation/vehicle-battery', (req, res) => {
  const { id, vehicleId, vehicleCode, batteryPct, pct } = req.body;
  const target = id || vehicleId || vehicleCode || 'EV-024';
  const targetPct = batteryPct !== undefined ? Number(batteryPct) : (pct !== undefined ? Number(pct) : 50);
  const v = simulationEngine.setVehicleBattery(target, targetPct);
  if (v) wsGateway.broadcastVehicleUpdate(v);
  res.json({ success: Boolean(v), vehicle: v });
});

apiRouter.post('/simulation/surge', (req, res) => {
  const { active } = req.body;
  const grid = simulationEngine.triggerEnergySurge(active ?? true);
  res.json({ success: true, grid });
});

apiRouter.post('/simulation/service-route', (req, res) => {
  const { vehicleId } = req.body;
  const ok = vehicleService.sendToService(vehicleId || 'veh-ev-024');
  res.json({ success: ok });
});

apiRouter.post('/simulation/tow', (req, res) => {
  const { vehicleId } = req.body;
  const result = simulationEngine.towVehicleToNearestStation(vehicleId);
  if (result) {
    wsGateway.broadcastVehicleUpdate(result.strandedVehicle);
    wsGateway.broadcastVehicleUpdate(result.towVehicle);
  }
  res.json({ success: !!result, result });
});

apiRouter.post('/simulation/finish-repair', (req, res) => {
  const { vehicleCode } = req.body;
  const v = simulationEngine.completeActiveRepair(vehicleCode || 'EV-024');
  res.json({ success: true, vehicle: v });
});

apiRouter.post('/simulation/return-to-road', (req, res) => {
  const { vehicleCode } = req.body;
  const v = simulationEngine.returnToRoad(vehicleCode || 'EV-024');
  res.json({ success: true, vehicle: v });
});

apiRouter.post('/simulation/repair', (req, res) => {
  const { chargerCode } = req.body;
  const result = simulationEngine.repairFault(chargerCode);
  if (result?.station) {
    wsGateway.broadcastStationUpdate(result.station);
  }
  res.json({ success: true, result });
});

apiRouter.post('/simulation/reset', (req, res) => {
  simulationEngine.resetSimulation();
  res.json({ success: true, message: 'Simulation reset complete' });
});

apiRouter.post('/simulation/speed', (req, res) => {
  const { multiplier } = req.body;
  simulationEngine.setSpeed(typeof multiplier === 'number' ? multiplier : 1.0);
  res.json({ success: true, speed: simulationEngine.getSpeed() });
});

apiRouter.get('/recommendations', (req, res) => {
  res.json(aiService.getPendingRecommendations());
});

apiRouter.post('/simulation/recommendation/apply', (req, res) => {
  const { id, accept } = req.body;
  const ok = aiService.resolveRecommendation(id, accept);
  res.json({ success: ok });
});

apiRouter.post('/ai/query', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query string required' });
  const result = await aiService.handleAssistantQuery(query);
  res.json(result);
});

// ==========================================
// 1. RBAC & AUTHENTICATION ENDPOINTS
// ==========================================
apiRouter.use(authenticate);

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    // Default to EV_OWNER demo account if anonymous
    const defaultUser = authService.getUserById('usr-owner-01');
    return res.json({ user: defaultUser, authenticated: false });
  }
  res.json({ user: req.user, authenticated: true });
});

apiRouter.get('/auth/demo-users', (req, res) => {
  res.json(authService.getAllDemoUsers());
});

apiRouter.post('/auth/switch-demo', (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role required' });
  try {
    const session = authService.switchRoleDemo(role);
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const session = authService.loginOrRegister(email, password);
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/assign-vehicle', (req, res) => {
  const { email, vehicleId, vehicleCode, password } = req.body;
  const targetVehicle = vehicleId || vehicleCode;
  if (!email || !targetVehicle) {
    return res.status(400).json({ error: 'Email and vehicleId or vehicleCode are required' });
  }
  try {
    const result = authService.assignVehicleToUser(email, targetVehicle, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 2. EV VEHICLE OWNER ENDPOINTS
// ==========================================
apiRouter.get('/owner/vehicles', requireRole('EV_OWNER', 'PLATFORM_ADMIN'), (req: AuthenticatedRequest, res) => {
  const allVehicles = vehicleService.getAllVehicles();
  const assignedIds = req.user?.assignedVehicleIds;
  if (req.user?.role === 'PLATFORM_ADMIN' || !assignedIds || assignedIds.length === 0) {
    return res.json(allVehicles);
  }
  const filtered = allVehicles.filter(v => assignedIds.includes(v.id) || assignedIds.includes(v.code));
  res.json(filtered.length > 0 ? filtered : allVehicles.slice(0, 2));
});

apiRouter.get('/owner/rescue-requests', requireRole('EV_OWNER', 'PLATFORM_ADMIN'), (req: AuthenticatedRequest, res) => {
  const ownerId = req.user?.id || 'usr-owner-01';
  if (req.user?.role === 'PLATFORM_ADMIN') {
    return res.json(rescueService.getAllRequests());
  }
  res.json(rescueService.getRequestsByOwner(ownerId));
});

apiRouter.post('/owner/rescue-request', requireRole('EV_OWNER', 'PLATFORM_ADMIN'), (req: AuthenticatedRequest, res) => {
  const { vehicleId, laneBlocked, shoulderAvailable, passengerCount, vulnerablePassengers, note } = req.body;
  if (!vehicleId) return res.status(400).json({ error: 'vehicleId is required' });
  try {
    const request = rescueService.createRequest({
      vehicleId,
      ownerId: req.user?.id,
      ownerName: req.user?.name,
      laneBlocked,
      shoulderAvailable,
      passengerCount,
      vulnerablePassengers,
      note,
    });
    wsGateway.broadcastRescueUpdate(request);
    res.status(201).json(request);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. EV MANUFACTURER ANALYTICS ENDPOINTS
// ==========================================
apiRouter.get('/manufacturer/analytics', requireRole('EV_MANUFACTURER', 'PLATFORM_ADMIN'), (req: AuthenticatedRequest, res) => {
  const brand = (req.query.brand as string) || req.user?.manufacturerBrand || 'Tata Motors EV';
  const analytics = manufacturerAnalyticsService.getAggregatedAnalytics(brand);
  res.json(analytics);
});

// ==========================================
// 4. STATION OWNER FINANCIAL & EXPANSION ENDPOINTS
// ==========================================
apiRouter.get('/station-owner/financials', requireRole('STATION_OWNER', 'PLATFORM_ADMIN'), (req: AuthenticatedRequest, res) => {
  const financials = stationAnalyticsService.getStationFinancials();
  const assignedStationIds = req.user?.assignedStationIds;
  if (req.user?.role === 'PLATFORM_ADMIN' || !assignedStationIds || assignedStationIds.length === 0) {
    return res.json(financials);
  }
  const filtered = financials.filter(f => assignedStationIds.includes(f.stationId));
  res.json(filtered.length > 0 ? filtered : financials);
});

apiRouter.get('/station-owner/expansion-candidates', requireRole('STATION_OWNER', 'PLATFORM_ADMIN'), (req, res) => {
  res.json(stationAnalyticsService.getExpansionCandidates());
});

apiRouter.get('/station-owner/alerts', requireRole('STATION_OWNER', 'PLATFORM_ADMIN'), (req, res) => {
  res.json(stationAnalyticsService.getStationOwnerAlerts());
});

apiRouter.get('/station-owner/towing-fleet', requireRole('STATION_OWNER', 'PLATFORM_ADMIN'), (req, res) => {
  const stationCode = (req.query.stationCode as string) || 'A102';
  const fleetData: Record<string, any> = {
    A102: {
      stationCode: 'A102',
      stationName: 'Boisar Central Hub',
      corridor: 'Railway Station / Market Corridor',
      towVans: [
        {
          code: 'Tow-01',
          model: 'Heavy Patrol EV Hauler',
          driverName: 'Ramesh Kumar',
          phone: '+91 98230 44101',
          status: 'AVAILABLE',
          totalTowedCount: 28,
          monthlyTows: 14,
          todayTows: 2,
          totalRevenueEarned: 33600,
        },
        {
          code: 'Tow-02',
          model: 'Rapid Rescue Tow Van',
          driverName: 'Suresh Patil',
          phone: '+91 98230 44102',
          status: 'ON_JOB',
          totalTowedCount: 14,
          monthlyTows: 8,
          todayTows: 1,
          totalRevenueEarned: 16800,
          currentMission: { targetEv: 'EV-102', etaMinutes: 8, destination: 'Boisar Central Hub Bay #2' }
        },
      ],
      towedHistory: [
        {
          id: 'RESC-1021',
          timestamp: 'Today, 00:24 AM',
          evCode: 'EV-102',
          evModel: 'Tata Nexon EV',
          towVanCode: 'Tow-02',
          driverName: 'Suresh Patil',
          reason: '0% Battery Depletion near Boisar Flyover',
          pickupLocation: 'Boisar Highway Flyover km 4.2',
          distanceKm: 3.4,
          towingFee: 1200,
          status: 'CHARGING_AT_STATION',
        },
        {
          id: 'RESC-1018',
          timestamp: 'Yesterday, 08:15 PM',
          evCode: 'EV-024',
          evModel: 'Tata Nexon EV',
          towVanCode: 'Tow-01',
          driverName: 'Ramesh Kumar',
          reason: 'Low Battery Exhaustion & Stalling',
          pickupLocation: 'MIDC Phase-1 Main Road',
          distanceKm: 2.1,
          towingFee: 1200,
          status: 'COMPLETED',
        },
        {
          id: 'RESC-1012',
          timestamp: '13 Oct, 02:40 PM',
          evCode: 'EV-087',
          evModel: 'MG ZS EV',
          towVanCode: 'Tow-01',
          driverName: 'Ramesh Kumar',
          reason: 'Inverter Thermal Cutoff on Incline',
          pickupLocation: 'Umroli Junction SH-40',
          distanceKm: 5.2,
          towingFee: 1500,
          status: 'COMPLETED',
        },
        {
          id: 'RESC-1004',
          timestamp: '12 Oct, 11:10 AM',
          evCode: 'EV-057',
          evModel: 'Tata Tiago EV',
          towVanCode: 'Tow-02',
          driverName: 'Suresh Patil',
          reason: 'Battery 2% Safety Shutdown',
          pickupLocation: 'Palghar Road Market Link',
          distanceKm: 4.0,
          towingFee: 1200,
          status: 'COMPLETED',
        },
      ],
    },
    B104: {
      stationCode: 'B104',
      stationName: 'Palghar Highway Hub',
      corridor: 'SH-40 Expressway Transit Corridor',
      towVans: [
        {
          code: 'Tow-03',
          model: 'Expressway Rescue Hauler',
          driverName: 'Amit Shinde',
          phone: '+91 98230 44103',
          status: 'AVAILABLE',
          totalTowedCount: 32,
          monthlyTows: 18,
          todayTows: 3,
          totalRevenueEarned: 41600,
        },
        {
          code: 'Tow-04',
          model: 'All-Terrain Flatbed EV',
          driverName: 'Ganesh Jadhav',
          phone: '+91 98230 44104',
          status: 'AVAILABLE',
          totalTowedCount: 19,
          monthlyTows: 11,
          todayTows: 1,
          totalRevenueEarned: 24700,
        },
      ],
      towedHistory: [
        {
          id: 'RESC-2041',
          timestamp: '13 Oct, 10:30 PM',
          evCode: 'EV-098',
          evModel: 'Hyundai Ioniq 5',
          towVanCode: 'Tow-03',
          driverName: 'Amit Shinde',
          reason: 'Front Suspension Breakdown',
          pickupLocation: 'SH-40 Expressway km 12',
          distanceKm: 6.8,
          towingFee: 1800,
          status: 'COMPLETED',
        },
        {
          id: 'RESC-2035',
          timestamp: '13 Oct, 04:15 PM',
          evCode: 'EV-044',
          evModel: 'Mahindra XUV400',
          towVanCode: 'Tow-04',
          driverName: 'Ganesh Jadhav',
          reason: 'Highway Range Exhaustion',
          pickupLocation: 'Manor Bypass Junction',
          distanceKm: 5.5,
          towingFee: 1500,
          status: 'COMPLETED',
        },
      ],
    },
    D305: {
      stationCode: 'D305',
      stationName: 'Tarapur Industrial Gateway',
      corridor: 'MIDC Heavy Transport Corridor',
      towVans: [
        {
          code: 'Tow-05',
          model: 'Heavy Electric Hauler',
          driverName: 'Mahendra Singh',
          phone: '+91 98230 44105',
          status: 'AVAILABLE',
          totalTowedCount: 24,
          monthlyTows: 12,
          todayTows: 1,
          totalRevenueEarned: 36000,
        },
      ],
      towedHistory: [
        {
          id: 'RESC-3019',
          timestamp: '12 Oct, 09:20 PM',
          evCode: 'EV-031',
          evModel: 'Commercial EV Van',
          towVanCode: 'Tow-05',
          driverName: 'Mahendra Singh',
          reason: 'Motor Overheating under Industrial Load',
          pickupLocation: 'Tarapur MIDC Zone-3 Gate',
          distanceKm: 3.8,
          towingFee: 1500,
          status: 'COMPLETED',
        },
      ],
    },
  };

  if (stationCode === 'ALL') {
    const allVans = Object.values(fleetData).flatMap(s => s.towVans);
    const allHistory = Object.values(fleetData).flatMap(s => s.towedHistory);
    return res.json({
      stationCode: 'ALL',
      stationName: 'All Stations Portfolio',
      corridor: 'Patel Fuels & EV Charging Stations LLP',
      towVans: allVans,
      towedHistory: allHistory,
    });
  }

  res.json(fleetData[stationCode] || fleetData['A102']);
});

// ==========================================
// 5. RESCUE OPERATOR & DISPATCH ENDPOINTS
// ==========================================
apiRouter.get('/rescue/requests', requireRole('RESCUE_OPERATOR', 'PLATFORM_ADMIN'), (req, res) => {
  res.json(rescueService.getAllRequests());
});

apiRouter.get('/rescue/requests/:id', requireRole('RESCUE_OPERATOR', 'PLATFORM_ADMIN', 'EV_OWNER'), (req, res) => {
  const reqObj = rescueService.getRequestById(req.params.id);
  if (!reqObj) return res.status(404).json({ error: 'Rescue request not found' });
  res.json(reqObj);
});

apiRouter.post('/rescue/dispatch', requireRole('RESCUE_OPERATOR', 'PLATFORM_ADMIN'), (req, res) => {
  rescueService.evaluateAndDispatchQueue();
  const allReqs = rescueService.getAllRequests();
  wsGateway.broadcastRescueQueue(allReqs);
  res.json({ success: true, requests: allReqs });
});

apiRouter.post('/rescue/complete', requireRole('RESCUE_OPERATOR', 'PLATFORM_ADMIN'), (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'requestId required' });
  const result = rescueService.completeRescue(requestId);
  if (!result) return res.status(404).json({ error: 'Rescue request not found' });
  wsGateway.broadcastRescueUpdate(result);
  wsGateway.broadcastRescueQueue(rescueService.getAllRequests());
  res.json({ success: true, result });
});

apiRouter.post('/rescue/update-status', requireRole('RESCUE_OPERATOR', 'PLATFORM_ADMIN'), (req, res) => {
  const { requestId, status, note } = req.body;
  if (!requestId || !status) return res.status(400).json({ error: 'requestId and status required' });
  const result = rescueService.updateRequestStatus(requestId, status, note);
  if (!result) return res.status(404).json({ error: 'Rescue request not found' });
  wsGateway.broadcastRescueUpdate(result);
  wsGateway.broadcastRescueQueue(rescueService.getAllRequests());
  res.json({ success: true, result });
});

apiRouter.post('/rescue/simulate-two-stranded', requireRole('RESCUE_OPERATOR', 'PLATFORM_ADMIN', 'EV_OWNER'), (req, res) => {
  const scenario = rescueService.triggerTwoStrandedEvScenario();
  wsGateway.broadcastRescueQueue(rescueService.getAllRequests());
  res.json({
    success: true,
    message: 'Triggered Critical Scenario: 2 Stranded EVs (EV-024 in active lane, EV-057 on shoulder), 1 Towing Van (EV-PATROL-03). Priority queue evaluated and van atomically assigned to EV-024.',
    scenario,
  });
});

apiRouter.get('/rescue/providers', requireRole('RESCUE_OPERATOR', 'PLATFORM_ADMIN'), (req, res) => {
  res.json(rescueService.getProviders());
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

server.listen(port, () => {
  console.log(`⚡ EVNEXUS Boisar Backend Server live at http://localhost:${port}`);
  simulationEngine.start();
});

export default app;
export { app, server };
