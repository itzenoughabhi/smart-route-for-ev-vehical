import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Car, 
  Building2, 
  Fuel, 
  Truck, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Sparkles,
  Compass
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'EVNEXUS Portals — Multi-Stakeholder Workspaces',
  description: 'Choose your role-based workspace: EV Owner 3D Drive, OEM Analytics, Station Operator P&L, or Rescue & Tow Command.',
};

export default function DashboardLandingPage() {
  const dashboards = [
    {
      title: 'EV Vehicle Owner',
      subtitle: '3D Driving Environment & Personal Telemetry',
      href: '/dashboard/owner',
      icon: Car,
      color: 'blue',
      badge: '3D DRIVE DEFAULT',
      description: 'Full-screen 3D driving simulation with live SOC, estimated range, Margdarshak EV route guidance, nearby fast chargers, and 1-click SOS roadside towing.',
      features: ['Immersive 3D Viewport', 'Margdarshak AI Routing', 'SOS Emergency Assistance', 'Live Tow Van Tracking'],
    },
    {
      title: 'OEM Analytics',
      subtitle: 'Tata Motors EV Fleet Intelligence',
      href: '/dashboard/oem',
      icon: Building2,
      color: 'indigo',
      badge: 'PRIVACY PROTECTED',
      description: 'Regional fleet adoption statistics, battery SOH degradation curves, roadside breakdown heatmaps, diurnal charging demand, and underserved corridor analysis.',
      features: ['k-Anonymized Cohorts', 'Battery Health & SOH', 'Corridor Incident Heatmaps', 'Underserved Infrastructure'],
    },
    {
      title: 'Station Operator',
      subtitle: 'Commercial P&L & Expansion Planning',
      href: '/dashboard/station',
      icon: Fuel,
      color: 'emerald',
      badge: 'FINANCIAL INTELLIGENCE',
      description: 'Comprehensive financial statement with gross revenue, wholesale power costs, OPEX, Net Operating Profit (EBITDA), multi-factor station rankings, and expansion candidate evaluation.',
      features: ['P&L Statement & Margins', 'Revenue vs OPEX Breakdown', 'Multi-Factor Station Ranking', 'Expansion ROI & Payback'],
    },
    {
      title: 'Rescue & Tow Command',
      subtitle: 'Highway Dispatch & Multi-Incident Queue',
      href: '/dashboard/rescue',
      icon: Truck,
      color: 'amber',
      badge: 'ATOMIC DISPATCH',
      description: 'Highway rescue incident queue, road danger and passenger vulnerability priority assessment, concurrency-safe atomic van assignment, and multi-stranded scenario simulation.',
      features: ['2 Stranded EVs Concurrency Safe', 'Hazard & Lane Blocking Matrix', 'Queue Order & Realistic ETA', 'Automatic Van Reassignment'],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
                ⚡
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight font-mono">
                EVNEXUS
              </h1>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-500 font-mono uppercase">
                Stakeholder Workspaces
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Select your role to access dedicated telemetry, commercial analytics, or 3D operational control.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold shadow-xs hover:shadow-sm transition-all"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Open Boisar 3D Digital Twin</span>
          </Link>
        </div>

        {/* 4 Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {dashboards.map((dash) => {
            const Icon = dash.icon;
            return (
              <Link
                key={dash.href}
                href={dash.href}
                className="group p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-600 flex items-center justify-center text-slate-700 group-hover:text-white transition-all shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 uppercase">
                      {dash.badge}
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {dash.title}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 font-mono mb-2">
                    {dash.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {dash.description}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-100 mb-4">
                    {dash.features.map((f, i) => (
                      <span key={i} className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-400 font-mono pt-6 border-t border-slate-200">
        EVNEXUS Boisar Digital Twin · Real-Time Smart EV Charging Network & Urban Fleet Platform
      </footer>
    </main>
  );
}
