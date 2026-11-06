'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Building2, 
  Fuel, 
  Truck, 
  ArrowRight, 
  Layers, 
  Maximize2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { EVOwner3DExperience } from '../../components/dashboards/EVOwner3DExperience';
import { ManufacturerDashboard } from '../../components/dashboards/ManufacturerDashboard';
import { StationOwnerDashboard } from '../../components/dashboards/StationOwnerDashboard';
import { RescueOperatorDashboard } from '../../components/dashboards/RescueOperatorDashboard';

export default function DashboardPortalPage() {
  const [activeTab, setActiveTab] = useState<'QUAD' | 'OWNER' | 'OEM' | 'STATION' | 'RESCUE'>('OWNER');

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header / Switcher Bar */}
      <header className="h-16 px-6 bg-[#0c1322]/95 backdrop-blur-xl border-b border-[#1c2842] flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/40 group-hover:scale-105 transition-all">
              ⚡
            </div>
            <div>
              <span className="font-mono text-sm font-black tracking-wider text-white">
                EVNEXUS
              </span>
              <span className="text-slate-500 mx-1.5 font-mono">/</span>
              <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                Stakeholder Ecosystem
              </span>
            </div>
          </Link>
        </div>

        {/* Tab View Selector matching the user's 4-panel image */}
        <div className="flex items-center bg-[#131d33] p-1 rounded-2xl border border-white/10 gap-1">

          <button
            onClick={() => setActiveTab('OWNER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'OWNER'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">1. EV Owner</span>
          </button>

          <button
            onClick={() => setActiveTab('OEM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'OEM'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">2. OEM Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('STATION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'STATION'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Fuel className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">3. Station P&L</span>
          </button>

          <button
            onClick={() => setActiveTab('RESCUE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RESCUE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">4. Rescue Command</span>
          </button>
        </div>

        {/* Link back to Boisar 3D Digital Twin */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Open Boisar 3D Twin</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* ========================================================
            CASE 1: QUAD 4-IN-1 VIEW (EXACTLY MATCHING USER'S IMAGE)
           ======================================================== */}
        {activeTab === 'QUAD' && (
          <div className="max-w-[1920px] mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PANEL 1: EV OWNER DASHBOARD */}
              <div className="rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl flex flex-col bg-[#0b101c]">
                <div className="h-600px relative">
                  <div className="h-[560px] relative">
                    <EVOwner3DExperience embedded={true} />
                  </div>
                </div>
                <div className="py-2.5 px-4 bg-[#0a0f1a] border-t border-[#1e2a44] flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="text-blue-400">1. EV OWNER DASHBOARD (In-Car 3D Driving View)</span>
                  <Link
                    href="/dashboard/owner"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    <span>Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* PANEL 2: OEM / MANUFACTURER DASHBOARD */}
              <div className="rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl flex flex-col bg-white">
                <div className="h-[560px] overflow-hidden">
                  <ManufacturerDashboard embedded={true} />
                </div>
                <div className="py-2.5 px-4 bg-[#0a0f1a] border-t border-[#1e2a44] flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="text-indigo-400">2. OEM / MANUFACTURER DASHBOARD (Tata Motors EV)</span>
                  <Link
                    href="/dashboard/oem"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    <span>Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* PANEL 3: CHARGING STATION OPERATOR DASHBOARD */}
              <div className="rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl flex flex-col bg-white">
                <div className="h-[560px] overflow-hidden">
                  <StationOwnerDashboard embedded={true} />
                </div>
                <div className="py-2.5 px-4 bg-[#0a0f1a] border-t border-[#1e2a44] flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="text-emerald-400">3. CHARGING STATION OPERATOR DASHBOARD (Profitability & Expansion)</span>
                  <Link
                    href="/dashboard/station"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    <span>Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* PANEL 4: RESCUE & TOW OPERATOR DASHBOARD */}
              <div className="rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl flex flex-col bg-white">
                <div className="h-[560px] overflow-hidden">
                  <RescueOperatorDashboard embedded={true} />
                </div>
                <div className="py-2.5 px-4 bg-[#0a0f1a] border-t border-[#1e2a44] flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="text-amber-400">4. RESCUE & TOW OPERATOR DASHBOARD (Incident Management)</span>
                  <Link
                    href="/dashboard/rescue"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    <span>Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            CASE 2: INDIVIDUAL TAB VIEWS
           ======================================================== */}
        {activeTab === 'OWNER' && (
          <div className="h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl">
            <EVOwner3DExperience />
          </div>
        )}

        {activeTab === 'OEM' && (
          <div className="h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl">
            <ManufacturerDashboard />
          </div>
        )}

        {activeTab === 'STATION' && (
          <div className="h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl">
            <StationOwnerDashboard />
          </div>
        )}

        {activeTab === 'RESCUE' && (
          <div className="h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border border-[#1e2a44] shadow-2xl">
            <RescueOperatorDashboard />
          </div>
        )}
      </main>
    </div>
  );
}
