'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Truck,
  PhoneCall,
  Search,
  Filter,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface StationOwnerDashboardProps {
  embedded?: boolean;
}

export function StationOwnerDashboard({ embedded = false }: StationOwnerDashboardProps) {
  // Navigation Menu: Overview, Live, Towing, Revenue, Chargers, Expansion
  const [activeMenu, setActiveMenu] = useState<'Overview' | 'Live' | 'Towing' | 'Revenue' | 'Chargers' | 'Expansion'>('Overview');
  const [selectedStationCode, setSelectedStationCode] = useState<string>('A102');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [selectedVanFilter, setSelectedVanFilter] = useState('ALL');
  const [searchEvQuery, setSearchEvQuery] = useState('');
  const [investedCandidate, setInvestedCandidate] = useState<string | null>(null);

  // Owner Stations Portfolio (All 9 Palghar & Boisar Regional Hubs)
  const ownerStations = [
    {
      code: 'A102',
      name: 'Boisar Central Hub',
      corridor: 'Railway Station / Market Corridor',
      bays: 4,
      power: '150kW DC',
      revenue: '₹8,24,000',
      profit: '₹5,12,000',
      towingRevenue: '₹50,400',
      totalTows: 42,
      utilization: '78%',
      status: 'Online',
    },
    {
      code: 'B104',
      name: 'Navapur Road Hub',
      corridor: 'West Industrial Corridor',
      bays: 4,
      power: '200kW DC',
      revenue: '₹11,40,000',
      profit: '₹7,25,000',
      towingRevenue: '₹66,300',
      totalTows: 51,
      utilization: '84%',
      status: 'Online',
    },
    {
      code: 'C201',
      name: 'MIDC Industrial Hub',
      corridor: 'Tarapur Heavy Chemical Zone',
      bays: 4,
      power: '250kW DC',
      revenue: '₹10,50,000',
      profit: '₹6,80,000',
      towingRevenue: '₹48,000',
      totalTows: 35,
      utilization: '82%',
      status: 'Online',
    },
    {
      code: 'D305',
      name: 'Boisar–Palghar Corridor',
      corridor: 'South Highway Interchange',
      bays: 4,
      power: '250kW DC',
      revenue: '₹9,80,000',
      profit: '₹6,10,000',
      towingRevenue: '₹36,000',
      totalTows: 24,
      utilization: '72%',
      status: 'Online',
    },
    {
      code: 'P401',
      name: 'Palghar District Central Hub',
      corridor: 'Palghar Collectorate & Railway Junction',
      bays: 6,
      power: '350kW DC',
      revenue: '₹14,20,000',
      profit: '₹9,10,000',
      towingRevenue: '₹72,500',
      totalTows: 58,
      utilization: '88%',
      status: 'Online',
    },
    {
      code: 'S801',
      name: 'Shirgaon Beach & Fort Hub',
      corridor: 'Shirgaon Historic Coast & Ocean Promenade',
      bays: 4,
      power: '150kW DC',
      revenue: '₹6,90,000',
      profit: '₹4,15,000',
      towingRevenue: '₹28,000',
      totalTows: 19,
      utilization: '65%',
      status: 'Online',
    },
    {
      code: 'M501',
      name: 'Manor NH-48 Express Hub',
      corridor: 'Mumbai-Ahmedabad Expressway Corridor',
      bays: 6,
      power: '350kW DC',
      revenue: '₹16,80,000',
      profit: '₹11,40,000',
      towingRevenue: '₹88,200',
      totalTows: 64,
      utilization: '92%',
      status: 'Online',
    },
    {
      code: 'T601',
      name: 'Tarapur Coastal Energy Hub',
      corridor: 'Tarapur Atomic Zone & Chinchani Coast',
      bays: 4,
      power: '200kW DC',
      revenue: '₹7,80,000',
      profit: '₹4,90,000',
      towingRevenue: '₹32,000',
      totalTows: 22,
      utilization: '69%',
      status: 'Online',
    },
    {
      code: 'D701',
      name: 'Dahanu Highway Hub',
      corridor: 'North Palghar Coastal Gateway',
      bays: 4,
      power: '180kW DC',
      revenue: '₹8,60,000',
      profit: '₹5,40,000',
      towingRevenue: '₹39,500',
      totalTows: 27,
      utilization: '74%',
      status: 'Online',
    },
  ];

  const currentStation = ownerStations.find((s) => s.code === selectedStationCode) || ownerStations[0];

  // Dedicated Towing Fleet & History per station
  const stationTowingData: Record<string, {
    towVans: {
      code: string;
      model: string;
      driverName: string;
      phone: string;
      status: 'AVAILABLE' | 'ON_JOB' | 'MAINTENANCE';
      totalTowedCount: number;
      monthlyTows: number;
      todayTows: number;
      totalRevenueEarned: number;
      currentMission?: { targetEv: string; etaMinutes: number; destination: string };
    }[];
    towedHistory: {
      id: string;
      timestamp: string;
      evCode: string;
      evModel: string;
      towVanCode: string;
      driverName: string;
      reason: string;
      pickupLocation: string;
      distanceKm: number;
      towingFee: number;
      status: 'COMPLETED' | 'IN_TRANSIT' | 'CHARGING_AT_STATION';
    }[];
  }> = {
    A102: {
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
          currentMission: { targetEv: 'EV-102', etaMinutes: 8, destination: 'Boisar Central Hub Bay #2' },
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
    C201: {
      towVans: [
        {
          code: 'Tow-06',
          model: 'Industrial Flatbed EV Hauler',
          driverName: 'Sunil Gupta',
          phone: '+91 98230 44106',
          status: 'AVAILABLE',
          totalTowedCount: 35,
          monthlyTows: 16,
          todayTows: 2,
          totalRevenueEarned: 48000,
        },
      ],
      towedHistory: [
        {
          id: 'RESC-4011',
          timestamp: 'Yesterday, 06:14 PM',
          evCode: 'EV-210',
          evModel: 'Tata Tiago EV',
          towVanCode: 'Tow-06',
          driverName: 'Sunil Gupta',
          reason: 'High Voltage Fuse Overload in Industrial Lane',
          pickupLocation: 'MIDC Boisar Phase 2',
          distanceKm: 4.2,
          towingFee: 1400,
          status: 'COMPLETED',
        },
      ],
    },
    P401: {
      towVans: [
        {
          code: 'Tow-07',
          model: 'Palghar Rapid Municipal Tow',
          driverName: 'Amit Deshmukh',
          phone: '+91 98230 44107',
          status: 'AVAILABLE',
          totalTowedCount: 38,
          monthlyTows: 19,
          todayTows: 3,
          totalRevenueEarned: 46200,
        },
        {
          code: 'Tow-08',
          model: 'Heavy Duty District Flatbed',
          driverName: 'Prakash Shinde',
          phone: '+91 98230 44108',
          status: 'ON_JOB',
          totalTowedCount: 20,
          monthlyTows: 11,
          todayTows: 1,
          totalRevenueEarned: 26300,
          currentMission: { targetEv: 'EV-078', etaMinutes: 6, destination: 'Palghar Central Bay #4' },
        },
      ],
      towedHistory: [
        {
          id: 'RESC-5012',
          timestamp: 'Today, 02:40 AM',
          evCode: 'EV-078',
          evModel: 'BYD Atto 3',
          towVanCode: 'Tow-08',
          driverName: 'Prakash Shinde',
          reason: 'Collectorate Junction Traffic Stall (0% Battery)',
          pickupLocation: 'Palghar Court Circle',
          distanceKm: 3.1,
          towingFee: 1500,
          status: 'IN_TRANSIT',
        },
      ],
    },
    S801: {
      towVans: [
        {
          code: 'Tow-09',
          model: 'Coastal Beach Patrol Tow',
          driverName: 'Tanaji More',
          phone: '+91 98230 44109',
          status: 'AVAILABLE',
          totalTowedCount: 19,
          monthlyTows: 9,
          todayTows: 1,
          totalRevenueEarned: 28000,
        },
      ],
      towedHistory: [
        {
          id: 'RESC-6015',
          timestamp: '11 Oct, 05:30 PM',
          evCode: 'EV-112',
          evModel: 'MG ZS EV',
          towVanCode: 'Tow-09',
          driverName: 'Tanaji More',
          reason: 'Sand Track Stuck & Battery Depletion',
          pickupLocation: 'Shirgaon Beach Road',
          distanceKm: 2.9,
          towingFee: 1600,
          status: 'COMPLETED',
        },
      ],
    },
    M501: {
      towVans: [
        {
          code: 'Tow-10',
          model: 'NH-48 Expressway Rapid Rescue',
          driverName: 'Balwant Singh',
          phone: '+91 98230 44110',
          status: 'AVAILABLE',
          totalTowedCount: 42,
          monthlyTows: 22,
          todayTows: 3,
          totalRevenueEarned: 58000,
        },
        {
          code: 'Tow-11',
          model: 'High-Speed Highway Recovery',
          driverName: 'Sandeep Rawat',
          phone: '+91 98230 44111',
          status: 'AVAILABLE',
          totalTowedCount: 22,
          monthlyTows: 12,
          todayTows: 1,
          totalRevenueEarned: 30200,
        },
      ],
      towedHistory: [
        {
          id: 'RESC-7019',
          timestamp: 'Yesterday, 11:20 PM',
          evCode: 'EV-290',
          evModel: 'Hyundai Ioniq 5',
          towVanCode: 'Tow-10',
          driverName: 'Balwant Singh',
          reason: 'High-Speed BMS Cutoff on Flyover',
          pickupLocation: 'Manor Toll Plaza km 84',
          distanceKm: 8.4,
          towingFee: 2200,
          status: 'COMPLETED',
        },
      ],
    },
    T601: {
      towVans: [
        {
          code: 'Tow-12',
          model: 'Atomic Coastal Special Tow',
          driverName: 'Nitin Kadam',
          phone: '+91 98230 44112',
          status: 'AVAILABLE',
          totalTowedCount: 22,
          monthlyTows: 10,
          todayTows: 1,
          totalRevenueEarned: 32000,
        },
      ],
      towedHistory: [
        {
          id: 'RESC-8022',
          timestamp: '10 Oct, 03:15 PM',
          evCode: 'EV-095',
          evModel: 'Tata Nexon EV Max',
          towVanCode: 'Tow-12',
          driverName: 'Nitin Kadam',
          reason: 'Inverter Overheat in Coastal Traffic',
          pickupLocation: 'Tarapur Atomic Plant Road',
          distanceKm: 4.8,
          towingFee: 1400,
          status: 'COMPLETED',
        },
      ],
    },
    D701: {
      towVans: [
        {
          code: 'Tow-13',
          model: 'North Highway Heavy Winch Van',
          driverName: 'Hemant Vaze',
          phone: '+91 98230 44113',
          status: 'AVAILABLE',
          totalTowedCount: 27,
          monthlyTows: 14,
          todayTows: 2,
          totalRevenueEarned: 39500,
        },
      ],
      towedHistory: [
        {
          id: 'RESC-9031',
          timestamp: '13 Oct, 08:45 AM',
          evCode: 'EV-155',
          evModel: 'Commercial Logistics EV',
          towVanCode: 'Tow-13',
          driverName: 'Hemant Vaze',
          reason: 'Overloaded Incline Battery Stall',
          pickupLocation: 'Dahanu Coastal Flyover',
          distanceKm: 6.2,
          towingFee: 1800,
          status: 'COMPLETED',
        },
      ],
    },
  };

  const currentTowing = stationTowingData[selectedStationCode] || stationTowingData['A102'];

  const filteredHistory = currentTowing.towedHistory.filter((item) => {
    const matchesVan = selectedVanFilter === 'ALL' || item.towVanCode === selectedVanFilter;
    const matchesSearch = !searchEvQuery.trim() || 
      item.evCode.toLowerCase().includes(searchEvQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchEvQuery.toLowerCase()) ||
      item.driverName.toLowerCase().includes(searchEvQuery.toLowerCase());
    return matchesVan && matchesSearch;
  });

  const expansionCandidates = [
    { id: '1', name: 'Dahanu Highway Hub', demand: 'High Demand', estProfit: '₹3.2L/month', capex: '₹1.8 Cr' },
    { id: '2', name: 'Palghar City Hub', demand: 'Medium Demand', estProfit: '₹2.1L/month', capex: '₹1.2 Cr' },
    { id: '3', name: 'Vasai East Hub', demand: 'Growing Demand', estProfit: '₹2.6L/month', capex: '₹1.5 Cr' },
  ];

  // 7 days x 6 hour intervals heatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hourSlots = ['6', '9', '12', '15', '18', '21'];
  const heatmapData = [
    [0.2, 0.4, 0.7, 0.5, 0.9, 0.3],
    [0.3, 0.5, 0.8, 0.6, 0.8, 0.4],
    [0.2, 0.6, 0.8, 0.7, 0.9, 0.3],
    [0.3, 0.5, 0.7, 0.6, 0.9, 0.4],
    [0.4, 0.7, 0.9, 0.8, 0.95, 0.6],
    [0.5, 0.8, 0.95, 0.9, 0.95, 0.7],
    [0.6, 0.9, 0.95, 0.8, 0.85, 0.5],
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
              { id: 'Towing', label: 'Towing & Rescues', icon: Truck, badge: `${currentTowing.towVans.length} Vans` },
              { id: 'Live', label: 'Live Operations', icon: Activity },
              { id: 'Revenue', label: 'Revenue & Profit', icon: DollarSign },
              { id: 'Chargers', label: 'Charger Management', icon: Zap },
              { id: 'Expansion', label: 'Expansion Planning', icon: Layers },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#162137]'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`hidden md:inline text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Station Owner Info & Portfolio Stats */}
        <div className="p-3 border-t border-[#192339] hidden md:block">
          <div className="p-2.5 rounded-xl bg-[#131b2e] border border-emerald-500/20 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vikram Patel (Owner)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {ownerStations.length} Regional Stations Portfolio · {ownerStations.reduce((a, b) => a + b.bays, 0)} Total Bays · {Object.values(stationTowingData).reduce((a, b) => a + b.towVans.length, 0)} Tow Vans
            </p>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA
         ======================================================== */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#f8fafc]">
        {/* Top Header Bar: Station Switcher + Filters */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-600 text-sm">
              ⚡
            </div>

            {/* Station Switcher Dropdown (Multiple Stations Owned by Same Owner) */}
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedStationCode}
                  onChange={(e) => setSelectedStationCode(e.target.value)}
                  className="text-base font-black text-slate-900 tracking-tight bg-transparent border-none cursor-pointer focus:outline-none hover:text-blue-600 transition-colors pr-2"
                >
                  {ownerStations.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code}) — {st.bays} Bays
                    </option>
                  ))}
                </select>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {currentStation.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                {currentStation.corridor} · Dedicated Towing Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Switch to Towing Tab */}
            <button
              onClick={() => setActiveMenu('Towing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeMenu === 'Towing'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Station Tow Fleet ({currentTowing.towVans.length})</span>
            </button>

            {/* Filter: Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Avatar */}
            <div 
              title="Vikram Patel — Patel Fuels & EV Charging Stations LLP"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 border border-white flex items-center justify-center text-white font-bold text-xs shadow-xs ml-1"
            >
              VP
            </div>
          </div>
        </header>

        {/* Dashboard Body Grid */}
        <main className="p-6 space-y-6">

          {/* ========================================================
              VIEW 1: OVERVIEW TAB (P&L + Hero + Sessions + Towing Widget)
             ======================================================== */}
          {activeMenu === 'Overview' && (
            <>
              {/* 4 Top KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Charging Revenue</span>
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                    {currentStation.revenue}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-emerald-600">+16%</span>
                    <span className="text-[11px] text-slate-400">vs last month</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Towing Revenue (Station)</span>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <Truck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-sans text-amber-600">
                    {currentStation.towingRevenue}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-emerald-600">+{currentStation.totalTows} tows</span>
                    <span className="text-[11px] text-slate-400">at ₹1,200/tow</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Net Operating Profit</span>
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                    {currentStation.profit}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-emerald-600">+18%</span>
                    <span className="text-[11px] text-slate-400">EBITDA Margin 62%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Charger Utilization</span>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                    {currentStation.utilization}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-emerald-600">+12%</span>
                    <span className="text-[11px] text-slate-400">{currentStation.bays} Fast Bays Active</span>
                  </div>
                </div>
              </div>

              {/* Station Hero Card + Dedicated Towing Quick Widget */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Station Hero Card (2 Cols) */}
                <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs h-64 group bg-slate-900">
                  <img
                    src="/assets/charging-hub-hero.jpg"
                    alt={currentStation.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-600/90 text-white font-mono font-bold text-xs shadow-md">
                      {currentStation.code} · {currentStation.power}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-white text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{currentStation.bays}/{currentStation.bays} Bays Operational</span>
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

                {/* Station Dedicated Towing Fleet Quick Card (1 Col) */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-black text-slate-900">Station Tow Fleet</h3>
                      </div>
                      <button
                        onClick={() => setActiveMenu('Towing')}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>Full Log</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">
                      Dedicated recovery vans stationed at {currentStation.name} for highway roadside towing:
                    </p>

                    <div className="space-y-2.5">
                      {currentTowing.towVans.map((van) => (
                        <div key={van.code} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900">{van.code}</span>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                                van.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {van.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              Driver: {van.driverName}
                            </span>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-xs font-black text-emerald-600 block">
                              {van.totalTowedCount} EVs
                            </span>
                            <span className="text-[10px] text-slate-400">Towed Total</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Total Tow Revenue:</span>
                    <span className="text-emerald-600 font-mono">
                      ₹{currentTowing.towVans.reduce((a, b) => a + b.totalRevenueEarned, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom 3 Columns: Revenue Trend, Peak Hours, Expansion */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Revenue & Profit Trend */}
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

                  <div className="w-full h-40 relative flex items-end my-3">
                    <svg className="w-full h-36" viewBox="0 0 300 120">
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

                  <div className="my-2">
                    <div className="grid grid-cols-7 gap-1 text-[10px] font-mono text-slate-400 text-center mb-1">
                      <span className="text-left"></span>
                      {hourSlots.map((h) => (
                        <span key={h}>{h}</span>
                      ))}
                    </div>

                    <div className="space-y-1">
                      {days.map((day, dIdx) => (
                        <div key={day} className="grid grid-cols-7 gap-1 items-center">
                          <span className="text-[10px] font-mono font-bold text-slate-500">{day}</span>
                          {heatmapData[dIdx].map((val, hIdx) => (
                            <div
                              key={hIdx}
                              style={{ backgroundColor: `rgba(59, 130, 246, ${val})` }}
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
            </>
          )}

          {/* ========================================================
              VIEW 2: DEDICATED STATION TOWING FLEET & DETAILED TOW LOG
             ======================================================== */}
          {activeMenu === 'Towing' && (
            <div className="space-y-6">
              {/* Station Towing Header Summary */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                      <Truck className="w-4 h-4" />
                    </span>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {currentStation.name} — Dedicated Towing Fleet & Missions
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Every fuel/EV station owns dedicated recovery vans. Track each tow vehicle, total EVs towed, incident reasons, and recovery fees.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Station Tow Vans</span>
                    <span className="text-lg font-black text-slate-900">{currentTowing.towVans.length} Active</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center font-mono">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Total EVs Towed</span>
                    <span className="text-lg font-black text-emerald-700">
                      {currentTowing.towVans.reduce((a, b) => a + b.totalTowedCount, 0)} EVs
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center font-mono">
                    <span className="text-[10px] text-blue-600 uppercase font-bold block">Towing Revenue</span>
                    <span className="text-lg font-black text-blue-700">
                      ₹{currentTowing.towVans.reduce((a, b) => a + b.totalRevenueEarned, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tow Vans Performance Cards (Per Tow Vehicle Statistics) */}
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                  <span>Assigned Towing Vehicles for {currentStation.name} ({currentStation.code})</span>
                  <span className="text-xs text-slate-400 font-normal">· Real-Time Driver & Towed Count Telemetry</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentTowing.towVans.map((van) => (
                    <div
                      key={van.code}
                      className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Code + Status Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-mono text-sm font-black text-slate-900 block leading-tight">{van.code}</span>
                              <span className="text-[11px] text-slate-400 font-semibold">{van.model}</span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            van.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                            van.status === 'ON_JOB' ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {van.status}
                          </span>
                        </div>

                        {/* Driver & Contact */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 mb-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Assigned Driver:</span>
                            <span className="font-bold text-slate-800">{van.driverName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Driver Phone:</span>
                            <span className="font-mono text-slate-700">{van.phone}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Home Station:</span>
                            <span className="font-bold text-blue-600">{currentStation.name}</span>
                          </div>
                        </div>

                        {/* Active Mission Banner if ON_JOB */}
                        {van.currentMission && (
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                              <span>Towing {van.currentMission.targetEv}</span>
                            </div>
                            <span className="font-mono text-[10px]">ETA ~{van.currentMission.etaMinutes}m</span>
                          </div>
                        )}

                        {/* Towed Statistics Counters */}
                        <div className="grid grid-cols-3 gap-2 text-center font-mono my-2 py-2 border-t border-b border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total Tows</span>
                            <span className="text-base font-black text-slate-900">{van.totalTowedCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">This Month</span>
                            <span className="text-base font-black text-blue-600">{van.monthlyTows}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Today</span>
                            <span className="text-base font-black text-emerald-600">{van.todayTows}</span>
                          </div>
                        </div>
                      </div>

                      {/* Revenue Earned by this specific Tow Van */}
                      <div className="pt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">Van Revenue:</span>
                          <span className="text-sm font-black text-emerald-600 font-mono">
                            ₹{van.totalRevenueEarned.toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedVanFilter(van.code)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
                        >
                          View Tows ({van.totalTowedCount})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Towed Vehicles Log & Mission History Table */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Towed Vehicles Log ({currentStation.name})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Record of every electric vehicle towed by this station&apos;s recovery vans with breakdown details and destination
                    </p>
                  </div>

                  {/* Filters: Van selector + Search EV code */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Van Filter Pills */}
                    <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                      <button
                        onClick={() => setSelectedVanFilter('ALL')}
                        className={`px-3 py-1 rounded-xl transition-all ${
                          selectedVanFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        All Vans
                      </button>
                      {currentTowing.towVans.map((v) => (
                        <button
                          key={v.code}
                          onClick={() => setSelectedVanFilter(v.code)}
                          className={`px-3 py-1 rounded-xl transition-all ${
                            selectedVanFilter === v.code ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          {v.code}
                        </button>
                      ))}
                    </div>

                    {/* Search EV Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchEvQuery}
                        onChange={(e) => setSearchEvQuery(e.target.value)}
                        placeholder="Search EV code, reason..."
                        className="pl-8 pr-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 w-48"
                      />
                    </div>
                  </div>
                </div>

                {/* Towed Vehicles Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                        <th className="pb-3 font-semibold">Incident / Time</th>
                        <th className="pb-3 font-semibold">Towed Vehicle</th>
                        <th className="pb-3 font-semibold">Tow Van & Driver</th>
                        <th className="pb-3 font-semibold">Breakdown Cause</th>
                        <th className="pb-3 font-semibold">Pickup Location</th>
                        <th className="pb-3 font-semibold">Distance</th>
                        <th className="pb-3 font-semibold">Towing Fee</th>
                        <th className="pb-3 font-semibold">Outcome Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 font-mono">
                            <span className="font-bold text-slate-900 block">{item.id}</span>
                            <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                          </td>

                          <td className="py-3.5">
                            <span className="font-mono font-black text-slate-900 block">{item.evCode}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{item.evModel}</span>
                          </td>

                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 font-mono font-bold flex items-center justify-center text-[10px]">
                                🚚
                              </span>
                              <div>
                                <span className="font-mono font-bold text-slate-900 block">{item.towVanCode}</span>
                                <span className="text-[10px] text-slate-500">{item.driverName}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 font-medium text-slate-700 max-w-[200px]">
                            {item.reason}
                          </td>

                          <td className="py-3.5 font-mono text-slate-600">
                            {item.pickupLocation}
                          </td>

                          <td className="py-3.5 font-mono text-slate-600 font-bold">
                            {item.distanceKm} km
                          </td>

                          <td className="py-3.5 font-mono font-black text-emerald-600">
                            ₹{item.towingFee.toLocaleString()}
                          </td>

                          <td className="py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                              item.status === 'CHARGING_AT_STATION' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status === 'CHARGING_AT_STATION' ? 'Charging at Hub' : item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredHistory.length === 0 && (
                    <div className="py-8 text-center text-slate-400 font-mono text-xs">
                      No tow records found matching current filter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 3: LIVE OPERATIONS & CHARGERS (Bays & Real-time load)
             ======================================================== */}
          {(activeMenu === 'Live' || activeMenu === 'Chargers') && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900">
                {currentStation.name} — Real-Time Bay Status
              </h3>
              <p className="text-xs text-slate-500">
                Live monitoring of all charging dispensers, voltage feeds, and current active vehicles:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {Array.from({ length: currentStation.bays }).map((_, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">Bay #{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        idx === 1 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {idx === 1 ? 'Occupied (EV-102)' : 'Available'}
                      </span>
                    </div>
                    <div className="font-mono text-slate-600 text-[11px]">
                      Power: {idx === 1 ? '142 kW' : '0 kW'} · 150 kW DC Max
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {idx === 1 ? 'Towed by Tow-02 · Currently at 18% SOC' : 'Ready for next vehicle'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 4: REVENUE & PROFIT DETAILED
             ======================================================== */}
          {activeMenu === 'Revenue' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900">
                Commercial P&L Statement — {currentStation.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-xs text-blue-600 block">Gross EV Retail Vend</span>
                  <span className="text-xl font-black text-blue-900">{currentStation.revenue}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-xs text-amber-700 block">Towing Service Fees</span>
                  <span className="text-xl font-black text-amber-900">{currentStation.towingRevenue}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-700 block">Net Operating Profit</span>
                  <span className="text-xl font-black text-emerald-900">{currentStation.profit}</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 5: EXPANSION PLANNING
             ======================================================== */}
          {activeMenu === 'Expansion' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900">
                New Charging Station Expansion Candidates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {expansionCandidates.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 block">{c.name}</span>
                    <span className="text-amber-600 font-mono font-bold block mt-1">{c.demand}</span>
                    <span className="text-slate-500 font-mono block mt-1">Est. Profit: {c.estProfit}</span>
                    <span className="text-slate-900 font-mono font-black block mt-2">{c.capex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
