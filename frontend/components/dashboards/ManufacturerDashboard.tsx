'use client';

import React, { useState, useEffect } from 'react';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';
import { 
  Building2, 
  ShieldCheck, 
  BarChart3, 
  BatteryMedium, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Layers, 
  Zap, 
  TrendingUp, 
  Globe2, 
  Cpu,
  Lock
} from 'lucide-react';
import { ManufacturerFleetAnalytics } from '../../types';

export function ManufacturerDashboard() {
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const manufacturerAnalytics = useDigitalTwinStore((s) => s.manufacturerAnalytics);
  const setManufacturerAnalytics = useDigitalTwinStore((s) => s.setManufacturerAnalytics);

  const [selectedBrand, setSelectedBrand] = useState('Tata Motors EV');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('LAST_30_DAYS');
  const [selectedModelFilter, setSelectedModelFilter] = useState('ALL');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/manufacturer/analytics?brand=${encodeURIComponent(selectedBrand)}&role=EV_MANUFACTURER`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setManufacturerAnalytics(data);
        } else {
          // Fallback demo data if offline
          const fallbackData: ManufacturerFleetAnalytics = {
            brand: selectedBrand,
            anonymizedFleetCount: 4550,
            regionalAdoption: [
              {
                region: 'Boisar Town & Industrial Corridor',
                totalRegisteredEVs: 1420,
                growthRateYoY: 34.2,
                brandMarketSharePct: { 'Tata Motors EV': 48.5, 'Mahindra EV': 18.2, 'BYD': 12.4, 'Others': 20.9 },
                topModels: [
                  { model: 'Tata Nexon EV', count: 430, sharePct: 30.2 },
                  { model: 'Tata Tiago EV', count: 260, sharePct: 18.3 },
                ],
              },
              {
                region: 'Palghar Highway (SH-40)',
                totalRegisteredEVs: 980,
                growthRateYoY: 28.6,
                brandMarketSharePct: { 'Tata Motors EV': 52.0, 'Mahindra EV': 16.0, 'Others': 32.0 },
                topModels: [
                  { model: 'Tata Nexon EV', count: 320, sharePct: 32.6 },
                  { model: 'Tata Punch EV', count: 190, sharePct: 19.4 },
                ],
              },
            ],
            batteryHealthByModel: [
              {
                model: 'Tata Nexon EV (40.5 kWh LFP)',
                sampleSize: 740,
                avgSOHPct: 96.8,
                avgRangeRetentionPct: 94.5,
                degradationPer10kKmPct: 0.38,
                fastChargeExposurePct: 62.0,
                avgBatteryTempCelsius: 32.4,
              },
              {
                model: 'Tata Tiago EV (24 kWh LFP)',
                sampleSize: 420,
                avgSOHPct: 97.4,
                avgRangeRetentionPct: 95.8,
                degradationPer10kKmPct: 0.32,
                fastChargeExposurePct: 38.5,
                avgBatteryTempCelsius: 30.8,
              },
            ],
            incidentHotspots: [
              {
                corridorName: 'SH-40 Boisar–Palghar Highway (Umroli Junction)',
                region: 'Palghar Corridor',
                incidentCount: 14,
                primaryCause: 'Depleted State of Charge before reaching rural charging corridor',
                avgResponseTimeMin: 14.2,
                severityDistribution: { critical: 4, warning: 8, info: 2 },
              },
            ],
            chargingPatterns: [
              { hourOfDay: 6, avgSessionDurationMin: 22, avgEnergyDeliveredKwh: 24.0, preferredChargerType: '150kW_DC', avgStartingSocPct: 28, avgEndingSocPct: 80 },
              { hourOfDay: 12, avgSessionDurationMin: 32, avgEnergyDeliveredKwh: 36.2, preferredChargerType: '150kW_DC', avgStartingSocPct: 18, avgEndingSocPct: 82 },
              { hourOfDay: 18, avgSessionDurationMin: 36, avgEnergyDeliveredKwh: 42.0, preferredChargerType: '350kW_DC', avgStartingSocPct: 14, avgEndingSocPct: 85 },
            ],
            underservedZones: [
              {
                zone: 'Tarapur MIDC Phase II',
                evDensity: 'Very High (Commercial Logistics)',
                chargerGap: 'Deficit of 8 DC Fast Bays within 4km',
                priority: 'URGENT',
              },
            ],
            privacyNotice: '🔒 Privacy Protected: All telemetry metrics are strictly aggregated with k-anonymity (k >= 5). Individual owner names, GPS waypoints, private journey logs, and telephone numbers are stripped per Indian DPDP & Global Automotive Privacy standards.',
          };
          setManufacturerAnalytics(fallbackData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedBrand, setManufacturerAnalytics]);

  const analytics = manufacturerAnalytics;

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-y-auto p-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider font-mono">
              OEM Analytics Portal
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs font-semibold text-slate-600 font-mono">Aggregated Telemetry Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            {currentUser?.organization || 'Tata Motors Electric Mobility Division'}
          </h2>
          <p className="text-xs text-slate-500">
            Regional Fleet Diagnostics, Range Retention, Incident Heatmaps & Charging Demand
          </p>
        </div>

        {/* Brand & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none shadow-sm font-mono"
          >
            <option value="Tata Motors EV">Tata Motors EV</option>
            <option value="Mahindra EV">Mahindra Electric</option>
            <option value="BYD">BYD Auto</option>
            <option value="Hyundai">Hyundai EV</option>
          </select>

          <select
            value={selectedTimePeriod}
            onChange={(e) => setSelectedTimePeriod(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 outline-none shadow-sm font-mono"
          >
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="LAST_90_DAYS">Last Quarter (Q3)</option>
          </select>
        </div>
      </div>

      {/* Privacy Safeguard Banner (Strict DPDP Compliance) */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 mb-6 flex items-start gap-3 text-xs text-indigo-900">
        <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Privacy Shield & Data Anonymization Active (DPDP Act / GDPR)</span>
          <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
            {analytics?.privacyNotice || 'Individual vehicle journey trails, registered driver names, and live street addresses are stripped. Telemetry is aggregated into cohorts (k ≥ 5) for battery degradation, breakdown heatmaps, and regional adoption forecasting.'}
          </p>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">REGIONAL BRAND FLEET</span>
          <span className="text-xl font-black text-slate-900 font-mono">
            {analytics?.anonymizedFleetCount.toLocaleString() || '4,550'}
          </span>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1 font-mono">
            <TrendingUp className="w-3 h-3" /> +34.2% YoY Growth
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">AVG BATTERY SOH</span>
          <span className="text-xl font-black text-emerald-600 font-mono">97.1%</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            0.34% drop / 10k km
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">MARKET SHARE (BOISAR)</span>
          <span className="text-xl font-black text-blue-600 font-mono">48.5%</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Rank #1 in district
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">ROADSIDE ASSIST INCIDENTS</span>
          <span className="text-xl font-black text-amber-600 font-mono">14 Cases</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Avg response: 14.2 min
          </span>
        </div>
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Battery Health & Range Degradation Curves */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BatteryMedium className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900">Aggregated Battery Health & Range Retention</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Cohort Sample Size</span>
          </div>

          <div className="space-y-4">
            {analytics?.batteryHealthByModel.map((bh, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1.5 font-mono">
                  <span className="font-bold text-slate-900">{bh.model}</span>
                  <span className="text-emerald-700 font-bold">{bh.avgSOHPct}% SOH</span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${bh.avgSOHPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Sample: {bh.sampleSize} EVs</span>
                  <span>DC Fast Exposure: {bh.fastChargeExposurePct}%</span>
                  <span>Avg Pack Temp: {bh.avgBatteryTempCelsius}°C</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown Locations & Incident Hotspots */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900">Breakdown Hotspots & Rescue Demand</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Incident Frequency</span>
          </div>

          <div className="space-y-3">
            {analytics?.incidentHotspots.map((hs, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{hs.corridorName}</span>
                  <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                    {hs.incidentCount} Incidents
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2">{hs.primaryCause}</p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-amber-200/40">
                  <span>Region: {hs.region}</span>
                  <span>Avg Rescue ETA: {hs.avgResponseTimeMin}m</span>
                  <span className="text-red-700 font-bold">{hs.severityDistribution.critical} Critical Blockages</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Adoption Trends & Charging Infrastructure Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regional Market Share & Adoption */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900">Regional EV Adoption & Brand Share</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Sub-District Breakdown</span>
          </div>

          <div className="space-y-4">
            {analytics?.regionalAdoption.map((ra, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-900 font-mono">{ra.region}</span>
                  <span className="font-mono text-blue-700 font-bold">{ra.totalRegisteredEVs} Active EVs</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono mb-2">
                  <span className="text-slate-500">OEM Market Share:</span>
                  {Object.entries(ra.brandMarketSharePct).map(([br, pct]) => (
                    <span key={br} className="font-bold text-slate-700">
                      {br}: <strong className="text-indigo-600">{pct}%</strong>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span className="font-bold">Top Models:</span>
                  {ra.topModels.map((tm, tIdx) => (
                    <span key={tIdx} className="bg-white px-2 py-0.5 rounded border text-slate-600">
                      {tm.model} ({tm.count} units · {tm.sharePct}%)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underserved Charging Gaps */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">Underserved Zones</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">OEM Priority</span>
          </div>

          <div className="space-y-3">
            {analytics?.underservedZones.map((uz, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{uz.zone}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                    uz.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {uz.priority}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">{uz.chargerGap}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Density: {uz.evDensity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
