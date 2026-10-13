'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
  Compass,
  Home,
  Activity,
  Calendar,
  ChevronDown,
  BarChart3,
  Flame,
  Settings,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface StationOwnerDashboardProps {
  embedded?: boolean;
}

export function StationOwnerDashboard({ embedded = false }: StationOwnerDashboardProps) {
  const [activeMenu, setActiveMenu] = useState('Overview');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [investedCandidate, setInvestedCandidate] = useState<string | null>(null);

  const kpis = [
    { title: 'Total Revenue', value: '₹8,24,000', delta: '+16%', deltaType: 'positive', icon: DollarSign, iconColor: 'text-blue-500' },
    { title: 'Operating Cost', value: '₹3,12,000', delta: '+8%', deltaType: 'negative', icon: AlertTriangle, iconColor: 'text-red-500' },
    { title: 'Net Profit', value: '₹5,12,000', delta: '+18%', deltaType: 'positive', icon: TrendingUp, iconColor: 'text-emerald-500' },
    { title: 'Charger Utilization', value: '78%', delta: '+12%', deltaType: 'positive', icon: Zap, iconColor: 'text-amber-500' },
  ];

  const expansionCandidates = [
    { id: '1', name: 'Dahanu Highway Hub', demand: 'High Demand', estProfit: '₹3.2L/month', capex: '₹1.8 Cr' },
    { id: '2', name: 'Palghar City Hub', demand: 'Medium Demand', estProfit: '₹2.1L/month', capex: '₹1.2 Cr' },
    { id: '3', name: 'Vasai East Hub', demand: 'Growing Demand', estProfit: '₹2.6L/month', capex: '₹1.5 Cr' },
  ];

  // 7 days x 6 hour intervals heatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hourSlots = ['6', '9', '12', '15', '18', '21'];
  // Opacity levels (0.1 to 0.9) to simulate realistic demand peaks
  const heatmapData = [
    [0.2, 0.4, 0.7, 0.5, 0.9, 0.3], // Mon
    [0.3, 0.5, 0.8, 0.6, 0.8, 0.4], // Tue
    [0.2, 0.6, 0.8, 0.7, 0.9, 0.3], // Wed
    [0.3, 0.5, 0.7, 0.6, 0.9, 0.4], // Thu
    [0.4, 0.7, 0.9, 0.8, 0.95, 0.6], // Fri
    [0.5, 0.8, 0.95, 0.9, 0.95, 0.7], // Sat
    [0.6, 0.9, 0.95, 0.8, 0.85, 0.5], // Sun
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
              <span className="block text-[10px] text-emerald-400 font-mono -mt-0.5">Station Operator</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'Overview', label: 'Overview', icon: Home },
              { id: 'Live', label: 'Live Operations', icon: Activity },
              { id: 'Revenue', label: 'Revenue & Profit', icon: DollarSign },
              { id: 'Chargers', label: 'Charger Management', icon: Zap },
              { id: 'Demand', label: 'Demand Analysis', icon: BarChart3 },
              { id: 'Expansion', label: 'Expansion Planning', icon: Layers },
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

        {/* Tariff & P&L Status */}
        <div className="p-3 border-t border-[#192339] hidden md:block">
          <div className="p-2.5 rounded-xl bg-[#131b2e] border border-emerald-500/20 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Solar Grid Tied</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Wholesale tariff: ₹7.20/kWh. Retail vend: ₹18.50/kWh.
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-600 text-sm">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Boisar Central Hub (A102)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Railway Station / Market Corridor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter: Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 border border-white flex items-center justify-center text-white font-bold text-xs shadow-xs ml-1">
              SO
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
                      kpi.deltaType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {kpi.delta}
                    </span>
                    <span className="text-[11px] text-slate-400">vs last month</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Middle Row: Station Hero Image + Charging Sessions Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Station Hero Card */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs h-64 group bg-slate-900">
              <img
                src="/assets/charging-hub-hero.jpg"
                alt="Boisar Central EV Hub"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Bottom Badges Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-white text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>4/4 Bays Available</span>
                </div>

                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-white text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>12 min Avg. Wait Time</span>
                </div>

                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-white text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>36 Sessions Today</span>
                </div>
              </div>
            </div>

            {/* Charging Sessions Curve Chart */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Charging Sessions</h3>
                  <p className="text-xs text-slate-400 font-mono">Daily Traffic Throughput</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900 font-mono">1,248</span>
                  <span className="ml-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    +22%
                  </span>
                </div>
              </div>

              {/* Smooth Sessions Curve */}
              <div className="w-full h-44 relative flex items-end">
                <svg className="w-full h-40 overflow-visible" viewBox="0 0 500 140">
                  <defs>
                    <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Area */}
                  <path
                    d="M 20 120 Q 140 130, 200 90 T 360 40 T 480 30 L 480 135 L 20 135 Z"
                    fill="url(#sessionsGrad)"
                  />
                  {/* Curve Line */}
                  <path
                    d="M 20 120 Q 140 130, 200 90 T 360 40 T 480 30"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Points */}
                  {[
                    { cx: 20, cy: 120 },
                    { cx: 160, cy: 110 },
                    { cx: 250, cy: 75 },
                    { cx: 360, cy: 40 },
                    { cx: 480, cy: 30 },
                  ].map((p, i) => (
                    <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                  ))}
                </svg>
              </div>

              <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400 mt-2 px-2">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: 3 Columns (Revenue Trend, Peak Demand Hours, Expansion Opportunity) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Revenue & Profit Trend Grouped Bars */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Revenue & Profit Trend</h3>
                <div className="flex items-center gap-3 text-[10px] font-mono mt-2">
                  <span className="flex items-center gap-1 font-bold text-blue-600">
                    <span className="w-2 h-2 rounded-xs bg-blue-500" /> Revenue
                  </span>
                  <span className="flex items-center gap-1 font-bold text-red-500">
                    <span className="w-2 h-2 rounded-xs bg-red-400" /> Cost
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" /> Profit
                  </span>
                </div>
              </div>

              {/* Grouped Bars SVG */}
              <div className="w-full h-40 relative flex items-end my-3">
                <svg className="w-full h-36" viewBox="0 0 300 120">
                  {/* Apr to Sep */}
                  {[
                    { x: 10, rev: 60, cost: 35, prof: 25 },
                    { x: 55, rev: 72, cost: 40, prof: 32 },
                    { x: 100, rev: 80, cost: 42, prof: 38 },
                    { x: 145, rev: 88, cost: 45, prof: 43 },
                    { x: 190, rev: 98, cost: 48, prof: 50 },
                    { x: 235, rev: 110, cost: 52, prof: 58 },
                  ].map((bar, i) => (
                    <g key={i}>
                      <rect x={bar.x} y={115 - bar.rev} width="8" height={bar.rev} rx="2" fill="#3b82f6" />
                      <rect x={bar.x + 10} y={115 - bar.cost} width="8" height={bar.cost} rx="2" fill="#f87171" />
                      <rect x={bar.x + 20} y={115 - bar.prof} width="8" height={bar.prof} rx="2" fill="#10b981" />
                    </g>
                  ))}
                </svg>
              </div>

              <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-400 px-1">
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
              </div>
            </div>

            {/* 2. Peak Demand Hours Heatmap */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Peak Demand Hours</h3>
                <p className="text-xs text-slate-400 font-mono">Diurnal Grid Stress Matrix</p>
              </div>

              {/* Heatmap Matrix */}
              <div className="my-2">
                {/* Header slots */}
                <div className="grid grid-cols-7 gap-1 text-[10px] font-mono text-slate-400 text-center mb-1">
                  <span className="text-left"></span>
                  {hourSlots.map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>

                {/* Day Rows */}
                <div className="space-y-1">
                  {days.map((day, dIdx) => (
                    <div key={day} className="grid grid-cols-7 gap-1 items-center">
                      <span className="text-[10px] font-mono font-bold text-slate-500">{day}</span>
                      {heatmapData[dIdx].map((val, hIdx) => (
                        <div
                          key={hIdx}
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${val})`,
                          }}
                          className="h-4 rounded-xs border border-blue-200/40 hover:scale-110 transition-transform cursor-pointer"
                          title={`${day} @ ${hourSlots[hIdx]}:00 — Demand ${(val * 100).toFixed(0)}%`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Low Demand</span>
                <div className="flex gap-1">
                  {[0.2, 0.4, 0.7, 0.95].map((op, i) => (
                    <span key={i} style={{ backgroundColor: `rgba(59, 130, 246, ${op})` }} className="w-3 h-2 rounded-xs" />
                  ))}
                </div>
                <span>Peak Load</span>
              </div>
            </div>

            {/* 3. Expansion Opportunity */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Expansion Opportunity</h3>
                <p className="text-xs text-slate-400 font-mono">Recommended Substation Corridors</p>
              </div>

              <div className="space-y-3 my-2">
                {expansionCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-400 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono font-bold text-[10px] flex items-center justify-center">
                          {c.id}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-600 block mt-0.5">
                        {c.demand}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        Est. Profit: {c.estProfit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 font-mono block mb-1">
                        {c.capex}
                      </span>
                      <button
                        onClick={() => setInvestedCandidate(c.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          investedCandidate === c.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        {investedCandidate === c.id ? 'Approved' : 'Invest'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center text-[10px] font-mono text-slate-400">
                AI Payback: 2.3 Years · Projected IRR 28.4%
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
