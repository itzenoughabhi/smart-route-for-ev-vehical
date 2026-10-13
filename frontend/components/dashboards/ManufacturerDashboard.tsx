'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Lock,
  Home,
  Car,
  Activity,
  FileText,
  Settings,
  ChevronDown,
  Calendar,
  Wrench,
  Flame,
  CheckCircle2,
  PieChart as PieIcon
} from 'lucide-react';

interface ManufacturerDashboardProps {
  embedded?: boolean;
}

export function ManufacturerDashboard({ embedded = false }: ManufacturerDashboardProps) {
  const [activeMenu, setActiveMenu] = useState('Overview');
  const [timeRange, setTimeRange] = useState('Last 6 Months');
  const [regionFilter, setRegionFilter] = useState('All India');
  const [hotspotView, setHotspotView] = useState<'Incidents' | 'Heatmap'>('Incidents');

  const kpis = [
    { title: 'Total Vehicles', value: '25,480', delta: '+ 18%', deltaType: 'positive', icon: Car, iconColor: 'text-blue-500' },
    { title: 'Avg. Vehicle Health', value: '92.4%', delta: '+ 2.1%', deltaType: 'positive', icon: Activity, iconColor: 'text-emerald-500' },
    { title: 'Total Incidents', value: '3,240', delta: '- 5%', deltaType: 'positive', icon: AlertTriangle, iconColor: 'text-red-500' },
    { title: 'Service Requests', value: '1,820', delta: '+ 12%', deltaType: 'neutral', icon: Wrench, iconColor: 'text-indigo-500' },
  ];

  const models = [
    { name: 'Tata Tiago EV', share: '42%', color: '#3b82f6' },
    { name: 'Tata Nexon EV', share: '28%', color: '#06b6d4' },
    { name: 'Tata Punch EV', share: '18%', color: '#10b981' },
    { name: 'Tata Curvv EV', share: '8%', color: '#8b5cf6' },
    { name: 'Others', share: '4%', color: '#64748b' },
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
              <span className="block text-[10px] text-blue-400 font-mono -mt-0.5">OEM Analytics</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'Overview', label: 'Overview', icon: Home },
              { id: 'Vehicles', label: 'Vehicle Analytics', icon: Car },
              { id: 'Battery', label: 'Battery Performance', icon: BatteryMedium },
              { id: 'Breakdown', label: 'Breakdown Insights', icon: AlertTriangle },
              { id: 'Network', label: 'Charging Network', icon: Zap },
              { id: 'Regional', label: 'Regional Analysis', icon: Globe2 },
              { id: 'Fleet', label: 'Fleet Trends', icon: TrendingUp },
              { id: 'Reports', label: 'Reports', icon: FileText },
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

        {/* k-Anonymized Privacy Badge in Sidebar */}
        <div className="p-3 border-t border-[#192339] hidden md:block">
          <div className="p-2.5 rounded-xl bg-[#131b2e] border border-blue-500/20 text-[11px]">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>k-Anonymized</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Cohort size k ≥ 10. Individual driver PII stripped.
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
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-600 text-sm">
              T
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                Tata Motors EV
                <span className="text-xs font-semibold text-slate-400 font-mono hidden sm:inline">
                  Manufacturer Analytics Dashboard
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter: Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Filter: Region */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
              <Globe2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{regionFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white flex items-center justify-center text-white font-bold text-xs shadow-xs ml-1">
              TM
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
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs font-bold ${
                      kpi.deltaType === 'positive' ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {kpi.delta}
                    </span>
                    <span className="text-[11px] text-slate-400">vs last period</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Middle Row: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EV Adoption Trend (Line Chart) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">EV Adoption Trend</h3>
                  <p className="text-xs text-slate-400 font-mono">Monthly New Fleet Registrations</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  25,480 Active
                </span>
              </div>

              {/* Chart SVG */}
              <div className="w-full h-48 relative flex items-end">
                <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                  
                  {/* Gradient fill */}
                  <defs>
                    <linearGradient id="adoptionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area */}
                  <path
                    d="M 20 120 Q 100 110, 180 85 T 340 60 T 480 20 L 480 140 L 20 140 Z"
                    fill="url(#adoptionGrad)"
                  />
                  {/* Line */}
                  <path
                    d="M 20 120 Q 100 110, 180 85 T 340 60 T 480 20"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  {[
                    { cx: 20, cy: 120 },
                    { cx: 100, cy: 110 },
                    { cx: 180, cy: 85 },
                    { cx: 260, cy: 75 },
                    { cx: 340, cy: 60 },
                    { cx: 420, cy: 40 },
                    { cx: 480, cy: 20 },
                  ].map((pt, i) => (
                    <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                  ))}
                </svg>
              </div>

              {/* Month Labels */}
              <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400 mt-2 px-2">
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
              </div>
            </div>

            {/* Battery Performance (Dual Bar & Line Chart) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Battery Performance</h3>
                  <p className="text-xs text-slate-400 font-mono">Range Retention vs Energy Efficiency</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Avg. Range (km)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Energy Efficiency
                  </span>
                </div>
              </div>

              {/* Bar and Line SVG */}
              <div className="w-full h-48 relative flex items-end">
                <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150">
                  <line x1="0" y1="35" x2="500" y2="35" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="115" x2="500" y2="115" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Bars */}
                  {[
                    { x: 30, h: 60 },
                    { x: 110, h: 75 },
                    { x: 190, h: 80 },
                    { x: 270, h: 90 },
                    { x: 350, h: 98 },
                    { x: 430, h: 108 },
                  ].map((bar, i) => (
                    <rect
                      key={i}
                      x={bar.x}
                      y={140 - bar.h}
                      width="26"
                      height={bar.h}
                      rx="4"
                      fill="#3b82f6"
                    />
                  ))}

                  {/* Efficiency Line */}
                  <path
                    d="M 43 90 L 123 80 L 203 72 L 283 62 L 363 50 L 443 38"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {[43, 123, 203, 283, 363, 443].map((cx, i) => {
                    const cy = [90, 80, 72, 62, 50, 38][i];
                    return (
                      <circle key={i} cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                    );
                  })}
                </svg>
              </div>

              {/* Month Labels */}
              <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400 mt-2 px-6">
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Breakdown Hotspots & Vehicle Model Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Breakdown Hotspots Map Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Breakdown Hotspots</h3>
                  <p className="text-xs text-slate-400 font-mono">Geographic Roadside Incident Density</p>
                </div>
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setHotspotView('Incidents')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      hotspotView === 'Incidents' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Incidents
                  </button>
                  <button
                    onClick={() => setHotspotView('Heatmap')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      hotspotView === 'Heatmap' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Heatmap
                  </button>
                </div>
              </div>

              {/* Dark Map Simulation */}
              <div className="w-full h-56 rounded-2xl bg-[#090f1d] border border-[#16233c] relative overflow-hidden flex items-center justify-center">
                {/* SVG Roads & Map Backdrop */}
                <svg className="absolute inset-0 w-full h-full opacity-40">
                  <path d="M 20 80 Q 150 120, 280 60 T 450 140" fill="none" stroke="#2563eb" strokeWidth="4" />
                  <path d="M 120 20 Q 200 120, 320 200" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <path d="M 40 180 L 400 40" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="6 4" />
                </svg>

                {/* Region Labels */}
                <span className="absolute top-12 left-14 text-slate-300 font-mono text-xs font-bold tracking-wider">
                  Boisar
                </span>
                <span className="absolute bottom-10 left-24 text-slate-400 font-mono text-xs font-bold">
                  Pasthal
                </span>
                <span className="absolute bottom-8 right-32 text-slate-400 font-mono text-xs font-bold">
                  Palghar
                </span>

                {/* Hotspot Markers */}
                {[
                  { top: '35%', left: '38%', count: '14' },
                  { top: '55%', left: '46%', count: '8' },
                  { top: '48%', left: '65%', count: '12' },
                  { top: '70%', left: '55%', count: '6' },
                ].map((spot, i) => (
                  <div
                    key={i}
                    style={{ top: spot.top, left: spot.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group"
                  >
                    <span className="w-8 h-8 rounded-full bg-red-500/30 animate-ping absolute" />
                    <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-red-600/50">
                      {spot.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Model Distribution Donut Chart */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Vehicle Model Distribution</h3>
                <p className="text-xs text-slate-400 font-mono">Share of 25,480 Active Fleet</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-4">
                {/* Donut Chart SVG */}
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#3b82f6" strokeWidth="5" strokeDasharray="42 58" strokeDashoffset="0" />
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#06b6d4" strokeWidth="5" strokeDasharray="28 72" strokeDashoffset="-42" />
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#10b981" strokeWidth="5" strokeDasharray="18 82" strokeDashoffset="-70" />
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#8b5cf6" strokeWidth="5" strokeDasharray="8 92" strokeDashoffset="-88" />
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#64748b" strokeWidth="5" strokeDasharray="4 96" strokeDashoffset="-96" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="font-mono text-base font-black text-slate-900 block leading-tight">25,480</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Vehicles</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 text-xs">
                  {models.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="font-semibold text-slate-700">{m.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{m.share}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Top Regional Seller:</span>
                <span className="font-bold text-blue-600">Tata Tiago EV (10,700 units)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
