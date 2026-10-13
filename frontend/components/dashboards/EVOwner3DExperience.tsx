'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';
import { socketService } from '../../services/socket';
import { MargdarshakModal } from '../MargdarshakModal';
import { 
  Car, 
  Zap, 
  BatteryCharging, 
  ShieldAlert, 
  Sparkles, 
  Navigation, 
  MapPin, 
  Clock, 
  Camera, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  History, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Compass,
  ArrowRight,
  Info,
  Home,
  Bell,
  Settings,
  Grid,
  Radio,
  Share2,
  ChevronRight,
  PhoneCall,
  Volume2,
  Fuel
} from 'lucide-react';
import { Vehicle, Station } from '../../types';

// Dynamic import of the existing 3D scene
const DigitalTwinScene = dynamic(
  () => import('../../3d/Scene').then((mod) => mod.DigitalTwinScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090d16] text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs tracking-wider text-blue-400 uppercase font-semibold">
          Initializing 3D Windshield Driving Simulation...
        </p>
        <span className="text-[10px] text-slate-500 font-mono mt-1">
          Synchronizing GIS Road Network, Moving Vehicles & Substation Telemetry
        </span>
      </div>
    ),
  }
);

interface EVOwner3DExperienceProps {
  embedded?: boolean;
}

export function EVOwner3DExperience({ embedded = false }: EVOwner3DExperienceProps) {
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const vehicles = useDigitalTwinStore((s) => s.vehicles);
  const stations = useDigitalTwinStore((s) => s.stations);
  const rescueRequests = useDigitalTwinStore((s) => s.rescueRequests);
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const recenterCamera = useDigitalTwinStore((s) => s.recenterCamera);
  const toggleTrackVehicle = useDigitalTwinStore((s) => s.toggleTrackVehicle);
  const trackingVehicleId = useDigitalTwinStore((s) => s.trackingVehicleId);
  const isConnected = useDigitalTwinStore((s) => s.isConnected);

  useEffect(() => {
    socketService.connect();
  }, []);

  // Filter owner's registered vehicles (Rahul Sharma owns EV-057 Tata Tiago EV by default)
  const ownerVehicles = vehicles.filter(
    (v) => (currentUser?.assignedVehicleIds || ['veh-ev-057', 'veh-ev-024']).includes(v.id) ||
           (currentUser?.assignedVehicleIds || ['veh-ev-057', 'veh-ev-024']).includes(v.code) ||
           v.code === 'EV-057'
  );
  const activeFleet = ownerVehicles.length > 0 ? ownerVehicles : vehicles.slice(0, 2);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(activeFleet[0]?.id || 'veh-ev-057');
  const activeVehicle = activeFleet.find((v) => v.id === selectedVehicleId) || activeFleet[0];

  useEffect(() => {
    if (activeVehicle && !trackingVehicleId) {
      toggleTrackVehicle(activeVehicle.id);
    }
  }, [activeVehicle?.id]);

  // Modal & Drawer States
  const [activeNavMenu, setActiveNavMenu] = useState<'Home' | 'Vehicle' | 'Navigation' | 'Stations' | 'SOS' | 'History'>('Home');
  const [activeDrawer, setActiveDrawer] = useState<'NAVIGATE' | 'SOS' | 'TELEMETRY' | 'HISTORY' | 'VEHICLES' | null>(null);
  const [isMargdarshakOpen, setIsMargdarshakOpen] = useState(false);
  const [selectedTargetStation, setSelectedTargetStation] = useState<Station | null>(null);
  const [isNavigating, setIsNavigating] = useState(true);

  // SOS Roadside Form State
  const [laneBlocked, setLaneBlocked] = useState(true);
  const [shoulderAvailable, setShoulderAvailable] = useState(false);
  const [passengerCount, setPassengerCount] = useState(2);
  const [vulnerablePassengers, setVulnerablePassengers] = useState(true);
  const [emergencyNote, setEmergencyNote] = useState('');
  const [isSubmittingSOS, setIsSubmittingSOS] = useState(false);

  // Active rescue request for active vehicle
  const activeRescue = rescueRequests.find(
    (r) => (r.vehicleId === activeVehicle?.id || r.vehicleCode === activeVehicle?.code || r.vehicleCode === 'EV-057') &&
           !['COMPLETED', 'CANCELLED'].includes(r.status)
  );

  // Compute nearby stations
  const nearbyStations = stations.map((st) => {
    const dist = 2.9; // km default to Boisar Central Hub
    const availBays = st.chargers?.filter((c) => c.status === 'AVAILABLE').length ?? 3;
    const totalBays = st.chargers?.length ?? 4;
    return {
      ...st,
      availBays,
      totalBays,
      distanceKm: Number(dist.toFixed(1)),
      estTravelTimeMin: Math.max(3, Math.round((dist / 35) * 60)),
      estArrivalSoc: Math.max(5, Math.round((activeVehicle?.currentBatteryPct || 46) - dist * 2.8)),
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const handleStartNavigation = (st: Station) => {
    setSelectedTargetStation(st);
    setIsNavigating(true);
    setActiveDrawer(null);
  };

  const handleTriggerSOS = async () => {
    if (!activeVehicle) return;
    setIsSubmittingSOS(true);
    try {
      const payload = {
        vehicleId: activeVehicle.id,
        vehicleCode: activeVehicle.code || 'EV-057',
        userRole: 'EV_OWNER',
        laneBlocked,
        shoulderAvailable,
        passengerCount,
        hasVulnerablePassengers: vulnerablePassengers,
        reason: emergencyNote || 'Low battery exhaustion on Boisar main corridor',
        location: {
          x: activeVehicle.position?.x ?? 0,
          y: activeVehicle.position?.y ?? 0,
          z: activeVehicle.position?.z ?? 0,
          roadId: activeVehicle.currentLocationName || 'road-main-1',
          nearestStationCode: 'A102',
        },
      };

      socketService.requestRescue(payload);
      await fetch('http://localhost:4000/api/rescue/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      setActiveDrawer(null);
    } catch (err) {
      console.error('Failed to trigger SOS', err);
    } finally {
      setIsSubmittingSOS(false);
    }
  };

  const handleCancelRescue = async (rescueId: string) => {
    try {
      socketService.cancelRescue(rescueId);
      await fetch(`http://localhost:4000/api/rescue/cancel/${rescueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: 'EV_OWNER' }),
      }).catch(() => null);
    } catch (err) {
      console.error('Failed to cancel rescue', err);
    }
  };

  const batteryPct = activeVehicle?.currentBatteryPct ? Math.round(activeVehicle.currentBatteryPct) : 46;
  const speedKmh = activeVehicle?.speed ? Math.round(activeVehicle.speed) : 48;
  const estRangeKm = Math.round((batteryPct / 100) * 250);

  return (
    <div className={`relative w-full ${embedded ? 'h-full min-h-[520px]' : 'h-screen'} bg-[#070b13] flex overflow-hidden font-sans select-none`}>
      {/* ========================================================
          1. LEFT VERTICAL DARK NAVY SIDEBAR (matching Reference Image)
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
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'Home', label: 'Home', icon: Home, active: activeNavMenu === 'Home', onClick: () => { setActiveNavMenu('Home'); setActiveDrawer(null); } },
              { id: 'Vehicle', label: 'My Vehicle', icon: Car, active: activeNavMenu === 'Vehicle', onClick: () => { setActiveNavMenu('Vehicle'); setActiveDrawer('VEHICLES'); } },
              { id: 'Navigation', label: 'Navigation', icon: Navigation, active: activeNavMenu === 'Navigation', onClick: () => { setActiveNavMenu('Navigation'); setActiveDrawer('NAVIGATE'); } },
              { id: 'Stations', label: 'Charging Stations', icon: Zap, active: activeNavMenu === 'Stations', onClick: () => { setActiveNavMenu('Stations'); setActiveDrawer('NAVIGATE'); } },
              { id: 'SOS', label: 'SOS / Towing', icon: PhoneCall, active: activeNavMenu === 'SOS', onClick: () => { setActiveNavMenu('SOS'); setActiveDrawer('SOS'); } },
              { id: 'History', label: 'History', icon: History, active: activeNavMenu === 'History', onClick: () => { setActiveNavMenu('History'); setActiveDrawer('HISTORY'); } },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.active
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

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-[#192339] space-y-1">
          <button 
            onClick={() => setActiveDrawer('TELEMETRY')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#162137]"
            title="Notifications"
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Notifications</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#162137]"
            title="All Workspaces"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Settings</span>
          </Link>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN COCKPIT VIEWPORT (Windshield + 3D Road + Cockpit Frame)
         ======================================================== */}
      <div className="flex-1 relative flex flex-col overflow-hidden bg-black">
        {/* 3D Scene rendered through the windshield */}
        <div className="absolute inset-0 z-0">
          <DigitalTwinScene />
        </div>

        {/* Realistic Cockpit Vignette / Windshield Surround */}
        <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.8)] border-[6px] border-[#0a0f18]/80" />

        {/* ========================================================
            3. TOP FLOATING HUD BAR (matching Reference Image)
           ======================================================== */}
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between gap-3">
          {/* Left Pill Cluster: Vehicle + Telemetry */}
          <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
            {/* Tata Tiago EV Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#0e1626]/85 backdrop-blur-xl border border-blue-500/30 text-white shadow-xl shadow-black/40">
              <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-400/50 flex items-center justify-center font-black text-xs text-blue-400">
                T
              </div>
              <div className="text-left">
                <span className="font-mono text-xs font-black tracking-tight block">EV-057</span>
                <span className="text-[10px] text-slate-400 font-medium leading-none block">Tata Tiago EV</span>
              </div>
            </div>

            {/* Battery Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0e1626]/85 backdrop-blur-xl border border-white/10 text-white shadow-xl">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[9px] text-slate-400 block font-mono leading-none">Battery</span>
                <span className="font-mono text-xs font-black text-emerald-400">{batteryPct}%</span>
              </div>
            </div>

            {/* Range Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0e1626]/85 backdrop-blur-xl border border-white/10 text-white shadow-xl">
              <Compass className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-[9px] text-slate-400 block font-mono leading-none">Range</span>
                <span className="font-mono text-xs font-black text-slate-200">~{estRangeKm} km</span>
              </div>
            </div>

            {/* Speed Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0e1626]/85 backdrop-blur-xl border border-white/10 text-white shadow-xl">
              <div>
                <span className="text-[9px] text-slate-400 block font-mono leading-none">Speed</span>
                <span className="font-mono text-xs font-black text-white">{speedKmh} km/h</span>
              </div>
            </div>

            {/* Online Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {/* Right Pill Cluster: Time, Weather, Profile Avatar */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0e1626]/85 backdrop-blur-xl border border-white/10 text-xs font-mono text-slate-300 shadow-xl">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>08:32 AM</span>
              <span className="text-slate-600">|</span>
              <span>🌤️ 24°C</span>
            </div>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-md">
              RS
            </div>
          </div>
        </div>

        {/* ========================================================
            4. AUGMENTED REALITY (AR) WINDSHIELD OVERLAYS
           ======================================================== */}
        {/* Overhead Highway Green Signs (center windshield) */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-15 pointer-events-none flex flex-col items-center gap-2">
          <div className="bg-[#0b6623]/90 border border-emerald-400/60 rounded-xl px-4 py-1.5 shadow-2xl backdrop-blur-sm flex items-center gap-2.5 text-white">
            <ArrowRight className="w-4 h-4 text-emerald-300 -rotate-45" />
            <div className="text-left font-sans">
              <div className="text-xs font-black tracking-wide uppercase">Boisar Central Hub</div>
              <div className="text-[10px] text-emerald-200 font-mono font-bold">2.9 km ahead</div>
            </div>
          </div>

          <div className="bg-emerald-600/80 border border-emerald-400/40 rounded-full px-3 py-0.5 text-[10px] font-bold text-white shadow-lg flex items-center gap-1.5 animate-bounce">
            <Zap className="w-3 h-3 text-yellow-300" />
            <span>Charging Station Available</span>
          </div>
        </div>

        {/* Next Turn Floating HUD Box (Top-Right Windshield) */}
        <div className="absolute top-20 right-6 z-20 pointer-events-auto w-64 bg-[#0d1627]/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-3 text-white shadow-2xl shadow-black/60 font-sans">
          <div className="flex items-start gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-400 shrink-0">
              <Navigation className="w-4 h-4 rotate-45" />
            </div>
            <div>
              <div className="text-xs font-mono font-black text-blue-400 uppercase tracking-wider">Next Turn 2.4 km</div>
              <div className="text-xs font-bold text-slate-100 leading-tight">Take right to Boisar Central Hub</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/10 text-center font-mono">
            <div>
              <span className="text-[9px] text-slate-400 block">Distance</span>
              <span className="text-xs font-black text-white">2.9 km</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">ETA</span>
              <span className="text-xs font-black text-emerald-400">6 min</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Arrival SOC</span>
              <span className="text-xs font-black text-blue-400">38%</span>
            </div>
          </div>
        </div>

        {/* Active Rescue Banner (if SOS active) */}
        {activeRescue && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 z-25 pointer-events-auto bg-red-600/90 text-white backdrop-blur-md rounded-2xl px-5 py-2 shadow-2xl border border-red-400 flex items-center gap-3 text-xs animate-pulse">
            <PhoneCall className="w-4 h-4" />
            <span className="font-mono font-black uppercase">
              TOW VAN DISPATCHED: {activeRescue.assignedVehicleCode || 'Tow-02'} · ETA ~8 min
            </span>
            <button
              onClick={() => handleCancelRescue(activeRescue.id)}
              className="ml-2 px-2 py-0.5 rounded-lg bg-black/30 hover:bg-black/50 text-[10px] font-mono uppercase"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ========================================================
            5. IN-CAR DIGITAL DASHBOARD COCKPIT (Curved Lower Display)
           ======================================================== */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[94%] max-w-4xl">
          {/* Cockpit Frame Cowl */}
          <div className="relative bg-gradient-to-t from-[#0a0f1b] via-[#0d1627]/95 to-[#0d1627]/80 backdrop-blur-2xl border border-[#233555] rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              
              {/* Left Gauge: Circular Battery & Range */}
              <div className="flex items-center justify-center gap-4 py-1 border-b md:border-b-0 md:border-r border-white/10">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-700"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-400 transition-all duration-1000"
                      strokeDasharray={`${batteryPct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-mono text-base font-black text-white">{batteryPct}%</span>
                    <span className="text-[9px] text-slate-400 font-mono">SOC</span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estimated Range</span>
                  <span className="text-lg font-black text-emerald-400 block">~{estRangeKm} km</span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Battery Temp: 31°C</span>
                </div>
              </div>

              {/* Center Gauge: Speedometer + Lane Visualizer + ECO Mode */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-500/30">
                    ECO MODE
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">15.2 kWh/100km</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-black text-white tracking-tighter">
                    {speedKmh}
                  </span>
                  <span className="font-mono text-xs text-slate-400 font-bold uppercase">km/h</span>
                </div>

                {/* Car Lane Graphic */}
                <div className="w-36 h-5 relative flex items-center justify-center mt-1">
                  <div className="absolute inset-x-0 h-0.5 bg-slate-700 rounded-full" />
                  <div className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center z-10">
                    <Car className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Right Gauge: Turn Mini-Map Guidance */}
              <div className="flex items-center justify-between py-1 border-t md:border-t-0 md:border-l border-white/10 pl-0 md:pl-4">
                <div className="text-left font-sans">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-mono font-black uppercase">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>2.9 km</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">Boisar Central Hub</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">6 min remaining</div>
                </div>

                <button
                  onClick={() => setIsMargdarshakOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Route</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================
            6. BOTTOM ACTION DOCK (Dock Buttons matching Reference Image)
           ======================================================== */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-25 pointer-events-auto flex items-center gap-2 bg-[#0c1424]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex-wrap justify-center">
          {/* Navigate to Station */}
          <button
            onClick={() => setActiveDrawer('NAVIGATE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeDrawer === 'NAVIGATE'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40'
                : 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
            }`}
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Navigate to Station</span>
          </button>

          {/* SOS / Request Towing Button */}
          <button
            onClick={() => setActiveDrawer('SOS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeDrawer === 'SOS' || activeRescue
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse'
                : 'bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{activeRescue ? 'Rescue Status' : 'SOS / Request Towing'}</span>
          </button>

          {/* Margdarshak Route */}
          <button
            onClick={() => setIsMargdarshakOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Margdarshak Route</span>
          </button>

          {/* My Vehicles */}
          <button
            onClick={() => setActiveDrawer('VEHICLES')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <Car className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">My Vehicles</span>
          </button>

          {/* Nearby Stations */}
          <button
            onClick={() => setActiveDrawer('NAVIGATE')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Nearby Stations</span>
          </button>

          {/* Vehicle Telemetry */}
          <button
            onClick={() => setActiveDrawer('TELEMETRY')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Vehicle Telemetry</span>
          </button>

          {/* Camera View Switcher */}
          <button
            onClick={() => activeVehicle && toggleTrackVehicle(activeVehicle.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Toggle Cockpit / Chase Camera"
          >
            <Camera className="w-4 h-4 text-slate-400" />
            <span className="hidden lg:inline">Camera View</span>
          </button>
        </div>

        {/* ========================================================
            7. DRAWERS & MODALS (Navigate, SOS, Telemetry, Vehicles)
           ======================================================== */}
        {/* NAVIGATE DRAWER */}
        {activeDrawer === 'NAVIGATE' && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-xl bg-[#0c1424]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black">Nearby Charging Stations</h3>
              </div>
              <button onClick={() => setActiveDrawer(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {nearbyStations.slice(0, 5).map((st) => (
                <div
                  key={st.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-400 transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-400">{st.code}</span>
                      <span className="font-bold text-white">{st.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{st.district}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-1">
                      <span className="text-blue-400 font-bold">{st.distanceKm} km away</span>
                      <span>Travel: ~{st.estTravelTimeMin} min</span>
                      <span className="text-emerald-400 font-bold">Est. Arrival SOC: {st.estArrivalSoc}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {st.availBays}/{st.totalBays} Free
                    </span>
                    <button
                      onClick={() => handleStartNavigation(st)}
                      className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all"
                    >
                      <span>Route Here</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOS DRAWER */}
        {activeDrawer === 'SOS' && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-lg bg-[#140b10]/95 backdrop-blur-2xl border border-red-500/40 rounded-3xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-black text-red-400">Emergency Roadside Towing</h3>
              </div>
              <button onClick={() => setActiveDrawer(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-[11px] text-red-300">
                Stranded vehicle {activeVehicle?.code || 'EV-057'} at Boisar main corridor. An autonomous dispatch mutex will assign the closest heavy patrol hauler.
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laneBlocked}
                    onChange={(e) => setLaneBlocked(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Active Lane Blocked</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vulnerablePassengers}
                    onChange={(e) => setVulnerablePassengers(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Vulnerable Passenger</span>
                </label>
              </div>

              <button
                onClick={handleTriggerSOS}
                disabled={isSubmittingSOS}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 transition-all flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{isSubmittingSOS ? 'Dispatching Tow Van...' : 'Confirm SOS Tow Request'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TELEMETRY DRAWER */}
        {activeDrawer === 'TELEMETRY' && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-md bg-[#0c1424]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl text-white font-mono">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 font-sans">
              <h3 className="text-sm font-black">Live Telemetry Diagnostics</h3>
              <button onClick={() => setActiveDrawer(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block">Battery Voltage</span>
                <span className="text-sm font-black text-white">398.2 V</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block">Cell Temp Avg</span>
                <span className="text-sm font-black text-emerald-400">31.4 °C</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block">SOH Health</span>
                <span className="text-sm font-black text-blue-400">97.4%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block">Fast Charge Cycles</span>
                <span className="text-sm font-black text-amber-400">42 Cycles</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Margdarshak Modal */}
      {isMargdarshakOpen && activeVehicle && (
        <MargdarshakModal
          vehicle={activeVehicle}
          stations={stations}
          isOpen={isMargdarshakOpen}
          onClose={() => setIsMargdarshakOpen(false)}
        />
      )}
    </div>
  );
}
