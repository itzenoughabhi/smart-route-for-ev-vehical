import { stationService } from './station.service';
import { vehicleService } from '../vehicles/vehicle.service';

export interface FinancialAssumptions {
  retailTariffPerKwhDcFast: number;  // ₹ / kWh e.g. 18.5
  retailTariffPerKwhAcSlow: number;  // ₹ / kWh e.g. 12.0
  gridElectricityTariffPerKwh: number;// ₹ / kWh wholesale e.g. 7.8
  gridDemandChargePerKwMonth: number; // ₹ / kW / month e.g. 240
  maintenanceCostPerBayMonth: number;// ₹ / month e.g. 3500
  rentAndLeasePerStationMonth: number;// ₹ / month e.g. 25000
  staffAndSecurityMonth: number;     // ₹ / month e.g. 20000
  softwareAndNetworkFeePct: number;  // 3.5% of gross revenue
}

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptions = {
  retailTariffPerKwhDcFast: 18.5,
  retailTariffPerKwhAcSlow: 12.0,
  gridElectricityTariffPerKwh: 7.8,
  gridDemandChargePerKwMonth: 240,
  maintenanceCostPerBayMonth: 3500,
  rentAndLeasePerStationMonth: 25000,
  staffAndSecurityMonth: 20000,
  softwareAndNetworkFeePct: 0.035,
};

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
  
  // Financial metrics (Monthly ₹)
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
  
  // Capex & Opex
  initialCapex: number; // ₹
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
  gridReadinessScore: number; // 0 - 100
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

export class StationAnalyticsService {
  private static instance: StationAnalyticsService;

  private constructor() {}

  public static getInstance(): StationAnalyticsService {
    if (!StationAnalyticsService.instance) {
      StationAnalyticsService.instance = new StationAnalyticsService();
    }
    return StationAnalyticsService.instance;
  }

  public getStationFinancials(assumptions: FinancialAssumptions = DEFAULT_FINANCIAL_ASSUMPTIONS): StationFinancialMetric[] {
    const stations = stationService.getAllStations();
    
    const metrics: StationFinancialMetric[] = stations.map((st) => {
      const totalBays = st.chargers.length;
      const occupiedBays = st.chargers.filter((c) => c.status === 'CHARGING').length;
      const faultedBays = st.chargers.filter((c) => c.status === 'FAULT' || c.status === 'OFFLINE').length;
      const availableBays = st.chargers.filter((c) => c.status === 'AVAILABLE').length;
      const occupancyPct = totalBays > 0 ? Math.round((occupiedBays / totalBays) * 100) : 0;
      const uptimePct = totalBays > 0 ? Number((((totalBays - faultedBays) / totalBays) * 100).toFixed(1)) : 100;
      const queueLen = st.queue ? st.queue.length : 0;

      // Energy estimates based on station scale
      const dailyEnergyKwh = (st.dailyEnergyKwh && st.dailyEnergyKwh > 50) 
        ? st.dailyEnergyKwh 
        : Math.round(st.maxCapacityKw * 0.45 * 24);
      const monthlyEnergyKwh = dailyEnergyKwh * 30;

      // Revenue: Assume average tariff weighted ₹18.5/kWh
      const grossRevenueMonthly = Math.round(monthlyEnergyKwh * assumptions.retailTariffPerKwhDcFast);
      const wholesaleElectricityCost = Math.round(monthlyEnergyKwh * assumptions.gridElectricityTariffPerKwh);
      const demandCharges = Math.round(st.maxCapacityKw * assumptions.gridDemandChargePerKwMonth);
      const maintenance = totalBays * assumptions.maintenanceCostPerBayMonth;
      const rent = assumptions.rentAndLeasePerStationMonth;
      const staffing = assumptions.staffAndSecurityMonth;
      const networkFees = Math.round(grossRevenueMonthly * assumptions.softwareAndNetworkFeePct);

      const totalOpex = wholesaleElectricityCost + demandCharges + maintenance + rent + staffing + networkFees;
      const grossMarginMonthly = grossRevenueMonthly - wholesaleElectricityCost;
      const grossMarginPct = grossRevenueMonthly > 0 ? Number(((grossMarginMonthly / grossRevenueMonthly) * 100).toFixed(1)) : 0;
      const netOperatingProfitMonthly = grossRevenueMonthly - totalOpex;
      const operatingMarginPct = grossRevenueMonthly > 0 ? Number(((netOperatingProfitMonthly / grossRevenueMonthly) * 100).toFixed(1)) : 0;

      const revenuePerBayMonthly = totalBays > 0 ? Math.round(grossRevenueMonthly / totalBays) : 0;
      const profitPerBayMonthly = totalBays > 0 ? Math.round(netOperatingProfitMonthly / totalBays) : 0;

      // Capex benchmark: ~₹15 Lakh per 150kW fast charger + ₹18 Lakh transformer/civil
      const estimatedCapex = totalBays * 1500000 + 1800000;
      const monthlyReturn = Math.max(1000, netOperatingProfitMonthly);
      const paybackPeriodMonths = Number((estimatedCapex / monthlyReturn).toFixed(1));
      const annualizedRoi = Number(((netOperatingProfitMonthly * 12 / estimatedCapex) * 100).toFixed(1));

      return {
        stationId: st.id,
        stationCode: st.code,
        stationName: st.name,
        district: st.district,
        totalBays,
        availableBays,
        occupancyPct,
        queueLength: queueLen,
        uptimePct,
        avgChargingDurationMin: 28,
        avgWaitTimeMin: queueLen > 0 ? queueLen * 12 : 2,
        peakHour: '17:00 - 21:00 (Evening Industrial Rush)',
        dailyEnergyDeliveredKwh: dailyEnergyKwh,
        monthlyEnergyDeliveredKwh: monthlyEnergyKwh,
        grossRevenueMonthly,
        wholesaleElectricityCostMonthly: wholesaleElectricityCost,
        grossMarginMonthly,
        grossMarginPct,
        opexBreakdown: {
          electricityCost: wholesaleElectricityCost,
          demandCharges,
          maintenance,
          rentAndLease: rent,
          staffing,
          networkFees,
        },
        totalOpexMonthly: totalOpex,
        netOperatingProfitMonthly,
        operatingMarginPct,
        revenuePerBayMonthly,
        profitPerBayMonthly,
        estimatedCapitalInvested: estimatedCapex,
        estimatedPaybackPeriodMonths: paybackPeriodMonths,
        annualizedRoiPct: annualizedRoi,
        profitabilityRank: 0,
      };
    });

    // Rank by Net Operating Profit & Utilization
    metrics.sort((a, b) => b.netOperatingProfitMonthly - a.netOperatingProfitMonthly);
    metrics.forEach((m, idx) => {
      m.profitabilityRank = idx + 1;
    });

    return metrics;
  }

  public getExpansionCandidates(): ExpansionCandidate[] {
    return [
      {
        id: 'exp-midc-phase2',
        name: 'Tarapur MIDC Phase II Chemical Zone & Heavy Fleet Hub',
        locationArea: 'Tarapur MIDC East Chemical Ring Road',
        zoneType: 'INDUSTRIAL_TRANSIT',
        targetBaysCount: 6,
        transformerCapacityKva: 1000,
        estimatedDailyTrafficEVs: 480,
        projectedDailySessions: 74,
        projectedMonthlyEnergyKwh: 66600,
        initialCapex: 9800000, // ₹98 Lakh
        capexBreakdown: {
          chargers: 6000000,
          transformerAndGrid: 2200000,
          civilAndCanopy: 1200000,
          licensingAndApprovals: 400000,
        },
        projectedMonthlyRevenue: 1232100, // ₹12.32L
        projectedMonthlyOpex: 624000,
        projectedMonthlyNetProfit: 608100,
        estimatedPaybackMonths: 16.1,
        gridReadinessScore: 94,
        competitionDensity: 'LOW',
        recommendationRank: 1,
        recommendationReason: 'Highest commercial fleet density with 0 ultra-fast DC chargers in 3.5km. Heavy duty commercial trucks and local staff fleets guarantee immediate 65%+ utilization.',
      },
      {
        id: 'exp-palghar-bypass',
        name: 'Palghar East Collectorate Bypass & Railway Ring',
        locationArea: 'Palghar East Bypass Junction near Court Complex',
        zoneType: 'URBAN_RAILWAY',
        targetBaysCount: 4,
        transformerCapacityKva: 630,
        estimatedDailyTrafficEVs: 320,
        projectedDailySessions: 46,
        projectedMonthlyEnergyKwh: 38640,
        initialCapex: 6400000, // ₹64 Lakh
        capexBreakdown: {
          chargers: 4000000,
          transformerAndGrid: 1400000,
          civilAndCanopy: 800000,
          licensingAndApprovals: 200000,
        },
        projectedMonthlyRevenue: 714840,
        projectedMonthlyOpex: 382000,
        projectedMonthlyNetProfit: 332840,
        estimatedPaybackMonths: 19.2,
        gridReadinessScore: 88,
        competitionDensity: 'MEDIUM',
        recommendationRank: 2,
        recommendationReason: 'Key intercity commuter transit point between Boisar and Palghar district headquarters. High private car traffic with consistent morning and evening charging peaks.',
      },
      {
        id: 'exp-manor-nh48',
        name: 'Manor NH-48 Mumbai–Ahmedabad Expressway Toll Plaza Hub',
        locationArea: 'NH-48 Golden Quadrilateral Interchange near Surya River',
        zoneType: 'HIGHWAY_INTERCHANGE',
        targetBaysCount: 8,
        transformerCapacityKva: 1500,
        estimatedDailyTrafficEVs: 1100,
        projectedDailySessions: 98,
        projectedMonthlyEnergyKwh: 117600,
        initialCapex: 14500000, // ₹1.45 Crore
        capexBreakdown: {
          chargers: 8500000,
          transformerAndGrid: 3500000,
          civilAndCanopy: 2000000,
          licensingAndApprovals: 500000,
        },
        projectedMonthlyRevenue: 2175600,
        projectedMonthlyOpex: 1120000,
        projectedMonthlyNetProfit: 1055600,
        estimatedPaybackMonths: 13.7,
        gridReadinessScore: 82,
        competitionDensity: 'HIGH',
        recommendationRank: 3,
        recommendationReason: 'Extremely high long-distance highway travel volume. Captures weekend Mumbai-Gujarat intercity traffic. Higher Capex offset by superior throughput.',
      },
      {
        id: 'exp-dahanu-coast',
        name: 'Dahanu Beach Promenade & Coastal Port Highway',
        locationArea: 'Dahanu Coastal Road intersection',
        zoneType: 'COASTAL_TOURISM',
        targetBaysCount: 4,
        transformerCapacityKva: 400,
        estimatedDailyTrafficEVs: 180,
        projectedDailySessions: 24,
        projectedMonthlyEnergyKwh: 20160,
        initialCapex: 5800000,
        capexBreakdown: {
          chargers: 3600000,
          transformerAndGrid: 1200000,
          civilAndCanopy: 800000,
          licensingAndApprovals: 200000,
        },
        projectedMonthlyRevenue: 372960,
        projectedMonthlyOpex: 242000,
        projectedMonthlyNetProfit: 130960,
        estimatedPaybackMonths: 44.2,
        gridReadinessScore: 68,
        competitionDensity: 'LOW',
        recommendationRank: 4,
        recommendationReason: 'Weekend tourism heavy with seasonal variability. Moderate payback period; recommended as a Phase 2 secondary priority.',
      },
    ];
  }

  public getStationOwnerAlerts(): StationOwnerAlert[] {
    const stations = stationService.getAllStations();
    const alerts: StationOwnerAlert[] = [];

    stations.forEach((st) => {
      const qLen = st.queue ? st.queue.length : 0;
      if (qLen >= 2) {
        alerts.push({
          id: `al-q-${st.code}`,
          stationCode: st.code,
          type: 'QUEUE_SPIKE',
          severity: 'WARNING',
          title: `Congestion Alert at ${st.name} [${st.code}]`,
          message: `Station queue currently has ${qLen} vehicles waiting. Estimated wait exceeds 24 mins. Consider dynamic load balancing or tariff incentives.`,
          timestamp: new Date().toISOString(),
        });
      }

      const faultCount = st.chargers.filter((c) => c.status === 'FAULT' || c.status === 'OFFLINE').length;
      if (faultCount > 0) {
        alerts.push({
          id: `al-flt-${st.code}`,
          stationCode: st.code,
          type: 'CHARGER_FAULT',
          severity: 'CRITICAL',
          title: `Charger Downtime: ${faultCount} Bay(s) Inactive`,
          message: `${faultCount} charging bay(s) currently offline at ${st.name}. Projected daily revenue loss: ₹${faultCount * 4200}. Technician ticket generated.`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Expansion alert
    alerts.push({
      id: 'al-exp-midc',
      stationCode: 'EXP-MIDC',
      type: 'EXPANSION_OPPORTUNITY',
      severity: 'INFO',
      title: 'High ROI Expansion Opportunity Detected',
      message: 'Tarapur MIDC Phase II Chemical Zone shows 480 daily EV passes with 0 fast chargers. Estimated payback: 16.1 months.',
      timestamp: new Date().toISOString(),
    });

    return alerts;
  }
}

export const stationAnalyticsService = StationAnalyticsService.getInstance();
