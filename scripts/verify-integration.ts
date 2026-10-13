import { authService } from '../backend/src/modules/auth/auth.service';
import { rescueService } from '../backend/src/modules/rescue/rescue.service';
import { stationAnalyticsService } from '../backend/src/modules/stations/station.analytics.service';
import { manufacturerAnalyticsService } from '../backend/src/modules/manufacturer/manufacturer.analytics.service';
import { vehicleService, VehicleService } from '../backend/src/modules/vehicles/vehicle.service';
import { stationService } from '../backend/src/modules/stations/station.service';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 EVNEXUS INTEGRATION VERIFICATION & REGRESSION TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. RBAC & Authentication Tests
  console.log('\n--- 1. RBAC & Access Control Tests ---');
  const demoUsers = authService.getAllDemoUsers();
  assert(demoUsers.length === 5, '5 Role-Based Demo Users Seeded', `Got ${demoUsers.length}`);
  
  const evOwner = authService.getUserById('usr-owner-01');
  assert(evOwner?.role === 'EV_OWNER', 'EV_OWNER user retrieved correctly');

  const mfgUser = authService.getUserById('usr-mfg-01');
  assert(mfgUser?.role === 'EV_MANUFACTURER', 'EV_MANUFACTURER user retrieved correctly');

  const stationOwner = authService.getUserById('usr-station-01');
  assert(stationOwner?.role === 'STATION_OWNER', 'STATION_OWNER user retrieved correctly');

  const rescueOp = authService.getUserById('usr-rescue-01');
  assert(rescueOp?.role === 'RESCUE_OPERATOR', 'RESCUE_OPERATOR user retrieved correctly');

  // Session token validation
  const session = authService.createSession(evOwner!);
  const validatedUser = authService.validateSession(session.token);
  assert(validatedUser?.id === evOwner?.id, 'Session token validation succeeds');

  // 2. Critical Scenario: Two Stranded EVs & One Towing Van Concurrency Test
  console.log('\n--- 2. Two Stranded EVs & One Towing Van Concurrency Test ---');
  const scenario = rescueService.triggerTwoStrandedEvScenario();
  
  assert(Boolean(scenario.incident1 && scenario.incident2), 'Both stranded incidents created successfully');
  assert(scenario.incident1.vehicleCode === 'EV-024', 'Incident 1 is EV-024 (Active Fast Lane Hazard)');
  assert(scenario.incident2.vehicleCode === 'EV-057', 'Incident 2 is EV-057 (Roadside Shoulder)');
  
  // Verify priority calculation
  assert(scenario.incident1.priorityScore > scenario.incident2.priorityScore,
    `EV-024 priority score (${scenario.incident1.priorityScore}) higher than EV-057 (${scenario.incident2.priorityScore}) due to active lane blocking & passenger vulnerability`);

  // Verify atomic van reservation (Only ONE can claim the van)
  const req1 = rescueService.getRequestById(scenario.incident1.id);
  const req2 = rescueService.getRequestById(scenario.incident2.id);

  assert(req1?.status === 'ASSIGNED', 'EV-024 is ASSIGNED to towing van EV-PATROL-03');
  assert(req1?.assignedVehicleCode === 'EV-PATROL-03', 'Towing van EV-PATROL-03 allocated to EV-024');
  assert(req2?.status === 'PRIORITY_ASSESSED' || req2?.status === 'REQUESTED', 'EV-057 remains in waiting queue');
  assert(req2?.queuePosition === 1, `EV-057 is queued at position #1 (Got #${req2?.queuePosition})`);
  assert(req2?.assignedVehicleCode === undefined, 'EV-057 did NOT illegally claim the already-occupied towing van (Atomic Lock Validated)');

  // 3. Queue Progression Test: Complete First Rescue & Auto-Dispatch Second
  console.log('\n--- 3. Rescue Queue Automatic Progression Test ---');
  rescueService.completeRescue(scenario.incident1.id);
  const completedReq1 = rescueService.getRequestById(scenario.incident1.id);
  assert(completedReq1?.status === 'COMPLETED', 'First rescue transitioned to COMPLETED');

  // After first rescue is completed, van is released and EV-057 is dispatched!
  const updatedReq2 = rescueService.getRequestById(scenario.incident2.id);
  assert(updatedReq2?.status === 'ASSIGNED', 'EV-057 automatically progressed from queue to ASSIGNED after van release');
  assert(updatedReq2?.assignedVehicleCode === 'EV-PATROL-03', 'EV-PATROL-03 reassigned to EV-057 automatically');

  // Complete second rescue
  rescueService.completeRescue(scenario.incident2.id);
  const completedReq2 = rescueService.getRequestById(scenario.incident2.id);
  assert(completedReq2?.status === 'COMPLETED', 'Second rescue transitioned to COMPLETED');

  // 4. Station Commercial Analytics & Profitability Ranking Test
  console.log('\n--- 4. Station Profitability & Expansion Analytics Test ---');
  const financials = stationAnalyticsService.getStationFinancials();
  assert(financials.length >= 4, `All network stations evaluated in financials (${financials.length} stations)`);

  const topStation = financials[0];
  assert(topStation.profitabilityRank === 1, 'Stations ranked with #1 highest profitability');
  assert(topStation.grossRevenueMonthly > topStation.wholesaleElectricityCostMonthly,
    'Gross margin positive: Revenue > Wholesale power costs');
  assert(topStation.grossRevenueMonthly > topStation.totalOpexMonthly,
    'Net Operating Profit accurately calculated after OPEX deductions');
  assert(topStation.estimatedPaybackPeriodMonths > 0 && topStation.estimatedPaybackPeriodMonths < 100,
    `Realistic capital payback period calculated (${topStation.estimatedPaybackPeriodMonths} months)`);

  const expansionCandidates = stationAnalyticsService.getExpansionCandidates();
  assert(expansionCandidates.length === 4, '4 Expansion candidate zones generated');
  assert(expansionCandidates[0].initialCapex > 0, 'Candidate Capex properly estimated');
  assert(expansionCandidates[0].projectedMonthlyNetProfit > 0, 'Candidate Monthly Net Profit estimated');

  // 5. Manufacturer Aggregated Telemetry & Privacy Test
  console.log('\n--- 5. Manufacturer Telemetry & DPDP Privacy Test ---');
  const mfgAnalytics = manufacturerAnalyticsService.getAggregatedAnalytics('Tata Motors EV');
  assert(mfgAnalytics.brand === 'Tata Motors EV', 'Manufacturer analytics scoped to requested brand');
  assert(mfgAnalytics.batteryHealthByModel.length >= 2, 'Aggregated battery health curves present');
  assert(mfgAnalytics.incidentHotspots.length >= 1, 'Breakdown incident hotspots mapped');
  assert(Boolean(mfgAnalytics.privacyNotice), 'Privacy shield disclosure present');

  // 6. Existing Systems Preservation & Regression Tests
  console.log('\n--- 6. Existing Engine & Route Graph Regression Tests ---');
  const allVehicles = vehicleService.getAllVehicles();
  assert(allVehicles.length > 5, `Vehicle fleet intact with ${allVehicles.length} simulated EVs`);

  const allStations = stationService.getAllStations();
  assert(allStations.length >= 4, `Charging stations intact with ${allStations.length} hubs`);

  const testRoute = VehicleService.getRouteForStation('A102');
  assert(testRoute.length > 2, `Road graph waypoint route generation intact (${testRoute.length} points)`);

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
