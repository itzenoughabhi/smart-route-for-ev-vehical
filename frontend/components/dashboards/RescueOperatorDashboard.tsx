'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Radio, 
  Users, 
  Play, 
  RotateCcw,
  Navigation,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Home,
  Layers,
  FileText,
  Building,
  Settings,
  Battery,
  PhoneCall,
  Search
} from 'lucide-react';

interface RescueOperatorDashboardProps {
  embedded?: boolean;
}

export function RescueOperatorDashboard({ embedded = false }: RescueOperatorDashboardProps) {
  const [activeMenu, setActiveMenu] = useState('Incidents');
  const [viewMode, setViewMode] = useState<'Map' | 'List'>('Map');
  const [selectedIncident, setSelectedIncident] = useState('EV-102');
  const [filterTag, setFilterTag] = useState<'ALL' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED'>('ALL');

  const kpis = [
    { title: 'Active Incidents', value: '12', delta: '+2 urgent', icon: AlertTriangle, iconColor: 'text-red-500' },
    { title: 'Available Vans', value: '8', delta: '4 standby', icon: Truck, iconColor: 'text-emerald-500' },
    { title: 'Avg. Response Time', value: '18 min', delta: '-3 min target', icon: Clock, iconColor: 'text-blue-500' },
    { title: 'Service Success', value: '92%', delta: '+4% SLA', icon: CheckCircle2, iconColor: 'text-purple-500' },
  ];

  const requests = [
    { code: 'EV-102', reason: '0% Battery', location: 'Boisar Central Hub', priority: 'High', status: 'Waiting', color: 'red' },
    { code: 'EV-103', reason: '0% Battery', location: 'Boisar Central Hub', priority: 'Medium', status: 'Queued', color: 'amber' },
    { code: 'EV-098', reason: 'Accident / Breakdown', location: 'Palghar Highway', priority: 'High', status: 'Assigned', color: 'blue' },
    { code: 'EV-087', reason: 'Battery 5%', location: 'Dahanu Road', priority: 'Medium', status: 'En Route', color: 'emerald' },
  ];

  const fleet = [
    { code: 'Tow-01', status: 'Available', statusColor: 'emerald', hub: 'Boisar Hub', eta: null },
    { code: 'Tow-02', status: 'On Job', statusColor: 'blue', hub: 'Boisar Corridor', eta: 'ETA 12 min' },
    { code: 'Tow-03', status: 'Available', statusColor: 'emerald', hub: 'Palghar Hub', eta: null },
    { code: 'Tow-04', status: 'Maintenance', statusColor: 'amber', hub: 'Dahanu Hub', eta: 'Off-duty' },
  ];

  return (
    <div className={`w-full ${embedded ? 'h-full min-h-[520px]' : 'h-screen'} bg-[#f1f5f9] text-slate-800 flex overflow-hidden font-sans select-none`}>
      {/* ========================================================
          1. LEFT DARK NAVY SIDEBAR
         ======================================================== */}
      <aside className="w-16 md:w-56 bg-[#0c1322] border-r border-[#192339] flex flex-col justify-between shrink-0 z-30 transition-all">
        <div>
          {/* Logo Brand */}
          <div className="h-16 flex items-center px-4 gap-2.5 border-b border-[#192339]">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/30 shrink-0">
              ⚡
            </div>
            <div className="hidden md:block">
              <span className="font-mono text-sm font-black tracking-wider text-white">
                EVNEXUS
              </span>
              <span className="block text-[10px] text-red-400 font-mono -mt-0.5">Rescue & Tow</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'Incidents', label: 'Live Incidents', icon: ShieldAlert },
              { id: 'Dispatch', label: 'Dispatch', icon: Navigation },
              { id: 'TowFleet', label: 'Tow Fleet', icon: Truck },
              { id: 'History', label: 'Incident History', icon: Clock },
              { id: 'Analytics', label: 'Analytics', icon: Layers },
              { id: 'Providers', label: 'Providers', icon: Building },
              { id: 'Settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#162137]'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mutex Status Indicator in Sidebar */}
        <div className="p-3 border-t border-[#192339] hidden md:block">
          <div className="p-2.5 rounded-xl bg-[#131b2e] border border-red-500/20 text-[11px]">
            <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Atomic Mutex</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Concurrency lock active. Prevents double van assignment.
            </p>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA
         ======================================================== */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#f8fafc]">
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center font-black text-red-600 text-sm">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Highway Rescue & Tow Command
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-600 border border-red-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                National Highway 48 & Boisar Industrial Road Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-600 border border-white flex items-center justify-center text-white font-bold text-xs shadow-xs ml-1">
              RO
            </div>
          </div>
        </header>

        {/* Dashboard Body Grid */}
        <main className="p-6 space-y-6">
          {/* 4 Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                    <div className={`p-1.5 rounded-lg bg-slate-50 ${kpi.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                    {kpi.value}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-slate-500">
                    <span>{kpi.delta}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Middle Row: Tactical Map + Latest Rescue Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Dark Tactical Map */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      onClick={() => setViewMode('Map')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        viewMode === 'Map' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Map View
                    </button>
                    <button
                      onClick={() => setViewMode('List')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        viewMode === 'List' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      List View
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> En Route
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> On Site
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed
                  </span>
                </div>
              </div>

              {/* Tactical Dark Map Canvas Simulation */}
              <div className="w-full h-80 rounded-2xl bg-[#090f1d] border border-[#16233c] relative overflow-hidden flex items-center justify-center">
                {/* Roads Vector */}
                <svg className="absolute inset-0 w-full h-full opacity-50">
                  <path d="M 40 40 L 480 320" fill="none" stroke="#2563eb" strokeWidth="4" />
                  <path d="M 80 280 L 440 60" fill="none" stroke="#38bdf8" strokeWidth="3" />
                  <path d="M 260 30 L 260 320" fill="none" stroke="#1e293b" strokeWidth="3" strokeDasharray="8 4" />
                </svg>

                {/* Highway Markers */}
                <span className="absolute top-8 left-12 text-slate-300 font-mono text-xs font-bold">Boisar</span>
                <span className="absolute top-24 right-16 text-slate-400 font-mono text-xs font-bold">NH-48</span>
                <span className="absolute bottom-10 left-16 text-slate-400 font-mono text-xs font-bold">Palghar</span>

                {/* Tow Trucks (Blue) */}
                <div className="absolute top-24 left-32 flex items-center gap-1.5 bg-blue-600/90 text-white px-2 py-1 rounded-xl shadow-lg border border-blue-400 text-[10px] font-bold font-mono">
                  <Truck className="w-3 h-3" />
                  <span>Tow-01</span>
                </div>

                <div className="absolute bottom-20 right-40 flex items-center gap-1.5 bg-blue-600/90 text-white px-2 py-1 rounded-xl shadow-lg border border-blue-400 text-[10px] font-bold font-mono">
                  <Truck className="w-3 h-3" />
                  <span>Tow-02</span>
                </div>

                {/* Stranded Vehicles (Red pulsing) */}
                <div className="absolute top-36 left-48 cursor-pointer group">
                  <span className="w-8 h-8 rounded-full bg-red-500/30 animate-ping absolute" />
                  <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                    !
                  </div>
                </div>

                {/* Interactive Tooltip Card matching image */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0c1424]/95 backdrop-blur-xl border border-red-500/40 rounded-2xl p-3 text-white shadow-2xl z-20 w-56 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-red-400 text-sm">EV-102</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold uppercase">
                      High Priority
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-0.5 font-medium">
                    <div className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-red-400" />
                      <span>Battery 0% (Depleted)</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      2 EVs near same station
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Latest Rescue Requests Queue */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-900">Latest Rescue Requests</h3>
                  <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                </div>

                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.code}
                      onClick={() => setSelectedIncident(req.code)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedIncident === req.code
                          ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-black text-xs text-slate-900">{req.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          req.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {req.priority}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700">{req.reason}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                        <span>{req.location}</span>
                        <span className="font-bold text-blue-600">{req.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Active Queue Depth: 4</span>
                <span className="text-emerald-600 font-bold">Dispatch Mutex Free</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Tow Fleet Status + Incident Response Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tow Fleet Status Cards */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 mb-3">Tow Fleet Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fleet.map((van) => (
                  <div key={van.code} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-700 mb-2 shadow-xs">
                      <Truck className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-mono text-xs font-black text-slate-900 block">{van.code}</span>
                    <span className={`text-[10px] font-mono font-bold block mt-0.5 ${
                      van.statusColor === 'emerald' ? 'text-emerald-600' :
                      van.statusColor === 'blue' ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                      {van.status}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{van.eta || van.hub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident Response Time Line Chart */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Incident Response Time</h3>
                  <p className="text-xs text-slate-400 font-mono">Dispatch to Arrival SLA</p>
                </div>
                <span className="text-sm font-mono font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  18 min Avg
                </span>
              </div>

              {/* Response Time Curve */}
              <div className="w-full h-32 relative flex items-end">
                <svg className="w-full h-28 overflow-visible" viewBox="0 0 500 100">
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />

                  <path
                    d="M 20 50 Q 80 40, 140 60 T 260 45 T 380 50 T 480 35"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {[20, 80, 140, 200, 260, 320, 380, 440, 480].map((cx, i) => {
                    const cy = [50, 45, 60, 52, 45, 55, 50, 42, 35][i];
                    return (
                      <circle key={i} cx={cx} cy={cy} r="3" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                    );
                  })}
                </svg>
              </div>

              <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-400 px-2">
                <span>Sep 1</span>
                <span>Sep 5</span>
                <span>Sep 10</span>
                <span>Sep 15</span>
                <span>Sep 20</span>
                <span>Sep 25</span>
                <span>Sep 30</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
