'use client';

import React, { useState, useEffect } from 'react';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';
import { 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Zap, 
  Clock, 
  MapPin, 
  Layers, 
  PlusCircle, 
  FileText, 
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ArrowUpRight,
  Percent,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { StationFinancialMetric, ExpansionCandidate, StationOwnerAlert } from '../../types';

export function StationOwnerDashboard() {
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const stations = useDigitalTwinStore((s) => s.stations);
  const stationFinancials = useDigitalTwinStore((s) => s.stationFinancials);
  const setStationFinancials = useDigitalTwinStore((s) => s.setStationFinancials);
  const expansionCandidates = useDigitalTwinStore((s) => s.expansionCandidates);
  const setExpansionCandidates = useDigitalTwinStore((s) => s.setExpansionCandidates);
  const stationAlerts = useDigitalTwinStore((s) => s.stationAlerts);
  const setStationAlerts = useDigitalTwinStore((s) => s.setStationAlerts);
  const selectStation = useDigitalTwinStore((s) => s.selectStation);

  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'RANKING' | 'EXPANSION' | 'ALERTS'>('ANALYTICS');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);
  const [compareCandidateIds, setCompareCandidateIds] = useState<string[]>(['exp-midc-phase2', 'exp-palghar-bypass']);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const [finRes, expRes, alRes] = await Promise.all([
          fetch('http://localhost:4000/api/station-owner/financials?role=STATION_OWNER').catch(() => null),
          fetch('http://localhost:4000/api/station-owner/expansion-candidates?role=STATION_OWNER').catch(() => null),
          fetch('http://localhost:4000/api/station-owner/alerts?role=STATION_OWNER').catch(() => null),
        ]);

        if (finRes && finRes.ok) {
          const fins = await finRes.json();
          setStationFinancials(fins);
          if (fins.length > 0 && !selectedStationId) {
            setSelectedStationId(fins[0].stationId);
          }
        }
        if (expRes && expRes.ok) {
          setExpansionCandidates(await expRes.json());
        }
        if (alRes && alRes.ok) {
          setStationAlerts(await alRes.json());
        }
      } catch (err) {
        console.error('Failed to load station owner analytics', err);
      }
    };

    fetchFinancials();
  }, [setStationFinancials, setExpansionCandidates, setStationAlerts]);

  // Aggregate metrics across stations
  const totalRevenue = stationFinancials.reduce((acc, s) => acc + s.grossRevenueMonthly, 0);
  const totalOpex = stationFinancials.reduce((acc, s) => acc + s.totalOpexMonthly, 0);
  const totalNetProfit = stationFinancials.reduce((acc, s) => acc + s.netOperatingProfitMonthly, 0);
  const avgMargin = totalRevenue > 0 ? Number(((totalNetProfit / totalRevenue) * 100).toFixed(1)) : 0;
  const totalBays = stationFinancials.reduce((acc, s) => acc + s.totalBays, 0);
  const availableBays = stationFinancials.reduce((acc, s) => acc + s.availableBays, 0);

  const activeStationMetric = stationFinancials.find((s) => s.stationId === selectedStationId) || stationFinancials[0];

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-y-auto p-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider font-mono">
              Commercial Hub Operator
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs font-semibold text-slate-600 font-mono">Station Profitability & Expansion</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            {currentUser?.organization || 'Patel Fuels & EV Charging Stations LLP'}
          </h2>
          <p className="text-xs text-slate-500">
            Operating {stationFinancials.length} Charging Hubs in Boisar–Palghar Belt
          </p>
        </div>

        {/* View Switcher Tabs & Assumptions Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAssumptionsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Financial Assumptions</span>
          </button>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'ANALYTICS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Station P&L
            </button>
            <button
              onClick={() => setActiveTab('RANKING')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'RANKING' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profitability Ranking
            </button>
            <button
              onClick={() => setActiveTab('EXPANSION')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'EXPANSION' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expansion Analysis
            </button>
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-3 py-1 rounded-lg transition-all relative ${
                activeTab === 'ALERTS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alerts ({stationAlerts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">TOTAL MONTHLY REVENUE</span>
          <span className="text-xl font-black text-slate-900 font-mono">₹{(totalRevenue / 100000).toFixed(2)} Lakh</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Retail Tariff: ₹18.5/kWh</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">TOTAL MONTHLY OPEX</span>
          <span className="text-xl font-black text-slate-800 font-mono">₹{(totalOpex / 100000).toFixed(2)} Lakh</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Power + Demand + Leases</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">NET OPERATING PROFIT</span>
          <span className="text-xl font-black text-emerald-600 font-mono">₹{(totalNetProfit / 100000).toFixed(2)} Lakh</span>
          <span className="text-[11px] text-emerald-700 font-bold font-mono mt-1 block">
            Net Margin: {avgMargin}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">NETWORK CHARGING BAYS</span>
          <span className="text-xl font-black text-blue-600 font-mono">{availableBays} / {totalBays} Free</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            {stationFinancials.length} Stations Active
          </span>
        </div>
      </div>

      {/* TAB 1: EXISTING STATION ANALYTICS (P&L) */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Station Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {stationFinancials.map((st) => (
              <button
                key={st.stationId}
                onClick={() => setSelectedStationId(st.stationId)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-mono transition-all whitespace-nowrap ${
                  st.stationId === activeStationMetric?.stationId
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {st.stationCode} · {st.stationName}
              </button>
            ))}
          </div>

          {activeStationMetric && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Financial Breakdown Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-mono">
                      {activeStationMetric.stationCode} · {activeStationMetric.stationName} Financial Statement
                    </h3>
                    <p className="text-xs text-slate-500">{activeStationMetric.district}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                    Rank #{activeStationMetric.profitabilityRank} in Network
                  </span>
                </div>

                {/* Clear Financial Statement Breakdown */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl font-bold">
                    <span className="text-slate-800">1. Gross Revenue (Monthly Delivered: {activeStationMetric.monthlyEnergyDeliveredKwh.toLocaleString()} kWh @ ₹18.5/kWh)</span>
                    <span className="text-slate-900 text-sm">₹{activeStationMetric.grossRevenueMonthly.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between px-3 text-slate-600">
                    <span>(-) Wholesale Electricity Cost ({activeStationMetric.monthlyEnergyDeliveredKwh.toLocaleString()} kWh @ ₹7.8/kWh)</span>
                    <span>-₹{activeStationMetric.wholesaleElectricityCostMonthly.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-blue-50/70 rounded-xl font-bold text-blue-900">
                    <span>= Gross Operating Margin</span>
                    <span>₹{activeStationMetric.grossMarginMonthly.toLocaleString()} ({activeStationMetric.grossMarginPct}%)</span>
                  </div>

                  <div className="px-3 space-y-1.5 text-[11px] text-slate-500 pt-1">
                    <span className="font-bold text-slate-700 block">Operating Expenses (OPEX):</span>
                    <div className="flex justify-between">
                      <span>• Grid Contracted Demand Charges</span>
                      <span>-₹{activeStationMetric.opexBreakdown.demandCharges.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Charger Preventive Maintenance ({activeStationMetric.totalBays} Bays)</span>
                      <span>-₹{activeStationMetric.opexBreakdown.maintenance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Site Lease / Land Rent</span>
                      <span>-₹{activeStationMetric.opexBreakdown.rentAndLease.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Security & Attendant Staffing</span>
                      <span>-₹{activeStationMetric.opexBreakdown.staffing.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Cloud Network & Billing Fee (3.5%)</span>
                      <span>-₹{activeStationMetric.opexBreakdown.networkFees.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl font-black text-emerald-900 text-sm border border-emerald-200">
                    <span>= Net Operating Profit (EBITDA)</span>
                    <span>₹{activeStationMetric.netOperatingProfitMonthly.toLocaleString()} ({activeStationMetric.operatingMarginPct}%)</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <span className="text-slate-400 block text-[10px]">REVENUE / BAY</span>
                    <span className="font-bold text-slate-900">₹{activeStationMetric.revenuePerBayMonthly.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <span className="text-slate-400 block text-[10px]">NET PROFIT / BAY</span>
                    <span className="font-bold text-emerald-600">₹{activeStationMetric.profitPerBayMonthly.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <span className="text-slate-400 block text-[10px]">PAYBACK PERIOD</span>
                    <span className="font-bold text-blue-600">{activeStationMetric.estimatedPaybackPeriodMonths} Months</span>
                  </div>
                </div>
              </div>

              {/* Operational Telemetry Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-slate-900 font-mono uppercase tracking-wider">
                  Operational Health & Occupancy
                </h4>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">CHARGER UPTIME</span>
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-slate-900 text-lg">{activeStationMetric.uptimePct}%</span>
                    <span className="text-emerald-600 text-xs">High Reliability</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">OCCUPANCY & QUEUE</span>
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-slate-900 text-lg">{activeStationMetric.occupancyPct}%</span>
                    <span className="text-amber-600 text-xs">{activeStationMetric.queueLength} in Queue</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">PEAK DEMAND WINDOW</span>
                  <span className="font-mono font-bold text-slate-900 text-xs block">
                    {activeStationMetric.peakHour}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">AVG CHARGING TIME</span>
                  <span className="font-mono font-bold text-slate-900 text-xs block">
                    {activeStationMetric.avgChargingDurationMin} Minutes / Session
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MOST PROFITABLE STATION ANALYSIS & RANKING */}
      {activeTab === 'RANKING' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Station Profitability Comparison & Multi-Factor Ranking</h3>
              <p className="text-xs text-slate-500">
                Ranked holistically by Net Operating Profit, Capital Investment, Utilization, and Payback Velocity (not revenue alone).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-3">RANK</th>
                  <th className="p-3">STATION CODE & NAME</th>
                  <th className="p-3">BAYS</th>
                  <th className="p-3">OCCUPANCY</th>
                  <th className="p-3">MONTHLY REVENUE</th>
                  <th className="p-3">MONTHLY OPEX</th>
                  <th className="p-3">NET PROFIT</th>
                  <th className="p-3">NET MARGIN</th>
                  <th className="p-3">PAYBACK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stationFinancials.map((st) => (
                  <tr key={st.stationId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-black text-blue-600">#{st.profitabilityRank}</td>
                    <td className="p-3 font-bold text-slate-900">
                      {st.stationCode} · {st.stationName}
                      <span className="block text-[10px] text-slate-400 font-normal">{st.district}</span>
                    </td>
                    <td className="p-3">{st.totalBays} Bays</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold">
                        {st.occupancyPct}%
                      </span>
                    </td>
                    <td className="p-3 font-bold">₹{st.grossRevenueMonthly.toLocaleString()}</td>
                    <td className="p-3 text-slate-600">₹{st.totalOpexMonthly.toLocaleString()}</td>
                    <td className="p-3 font-black text-emerald-600">₹{st.netOperatingProfitMonthly.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-700">{st.operatingMarginPct}%</td>
                    <td className="p-3 text-blue-700 font-bold">{st.estimatedPaybackPeriodMonths} Mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: NEW LOCATION RECOMMENDATIONS & EXPANSION ANALYSIS */}
      {activeTab === 'EXPANSION' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            💡 <strong>Expansion Intelligence:</strong> Candidate zones analyzed using regional EV traffic telemetry, grid substation headroom, competitor distance, and capital payback forecasts. All forecasts are labeled as estimates.
          </div>

          {/* Expansion Candidates Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expansionCandidates.map((cand) => (
              <div
                key={cand.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-500 transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Rank #{cand.recommendationRank} Expansion Target
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Zone: {cand.zoneType}
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 mb-1">{cand.name}</h4>
                <p className="text-[11px] text-slate-500 mb-3">{cand.locationArea}</p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center p-3 bg-slate-50 rounded-xl mb-3">
                  <div>
                    <span className="text-[9px] text-slate-400 block">EST. CAPEX</span>
                    <span className="font-bold text-slate-900">₹{(cand.initialCapex / 100000).toFixed(1)}L</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">NET PROFIT/MO</span>
                    <span className="font-bold text-emerald-600">₹{(cand.projectedMonthlyNetProfit / 100000).toFixed(2)}L</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">PAYBACK</span>
                    <span className="font-bold text-blue-600">{cand.estimatedPaybackMonths} Mo</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px] text-slate-600 leading-relaxed mb-3">
                  <span className="font-bold text-slate-700 block mb-0.5">Why Recommended:</span>
                  {cand.recommendationReason}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                  <span>Grid Readiness: <strong>{cand.gridReadinessScore}/100</strong></span>
                  <span>Competition: <strong>{cand.competitionDensity}</strong></span>
                  <span>Target: <strong>{cand.targetBaysCount} Fast Bays</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STATION OWNER ALERTS */}
      {activeTab === 'ALERTS' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-slate-900 mb-2">Automated Commercial & Operational Alerts</h3>
          {stationAlerts.map((al) => (
            <div
              key={al.id}
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                al.severity === 'CRITICAL'
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : al.severity === 'WARNING'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{al.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(al.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] mt-1 leading-relaxed">{al.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financial Assumptions Modal */}
      {showAssumptionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900 mb-2">Documented Financial Assumptions</h3>
            <p className="text-slate-500 mb-4 leading-relaxed">
              Every financial calculation in EVNEXUS distinguishes Gross Revenue, Cost of Goods Sold, Gross Margin, and Net Operating Profit using the following baseline parameters:
            </p>

            <div className="space-y-2 font-mono bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px]">
              <div className="flex justify-between">
                <span>• DC Fast Retail Charging Tariff:</span>
                <span className="font-bold">₹18.50 / kWh</span>
              </div>
              <div className="flex justify-between">
                <span>• AC Slow Charging Tariff:</span>
                <span className="font-bold">₹12.00 / kWh</span>
              </div>
              <div className="flex justify-between">
                <span>• Grid Wholesale Tariff (MSEDCL 11kV):</span>
                <span className="font-bold">₹7.80 / kWh</span>
              </div>
              <div className="flex justify-between">
                <span>• Grid Contracted Demand Charge:</span>
                <span className="font-bold">₹240 / kW / month</span>
              </div>
              <div className="flex justify-between">
                <span>• Charger Preventive Maintenance:</span>
                <span className="font-bold">₹3,500 / bay / month</span>
              </div>
              <div className="flex justify-between">
                <span>• Station Land Lease / Rent:</span>
                <span className="font-bold">₹25,000 / station / month</span>
              </div>
              <div className="flex justify-between">
                <span>• Staff & Security Overhead:</span>
                <span className="font-bold">₹20,000 / station / month</span>
              </div>
              <div className="flex justify-between">
                <span>• Cloud Network & Billing Fee:</span>
                <span className="font-bold">3.5% of Gross Revenue</span>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAssumptionsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
