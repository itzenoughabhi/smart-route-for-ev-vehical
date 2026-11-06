'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  PhoneCall,
  UserCheck,
  Key,
  Mail,
  Eye,
  EyeOff,
  Gauge,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Wind,
  Fan,
  Volume2,
  Shield,
  Layers,
  Fuel,
  Grid2X2,
  Check
} from 'lucide-react';
import { Vehicle, Station } from '../../types';
import { InfotainmentNavMap } from './InfotainmentNavMap';

// Dynamic import of the existing 3D simulation scene
const DigitalTwinScene = dynamic(
  () => import('../../3d/Scene').then((mod) => mod.DigitalTwinScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b13] text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs tracking-wider text-blue-400 uppercase font-semibold">
          Rendering Real-Time 3D Windshield View...
        </p>
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
  const updateVehicle = useDigitalTwinStore((s) => s.updateVehicle);
  const recenterCamera = useDigitalTwinStore((s) => s.recenterCamera);
  const toggleTrackVehicle = useDigitalTwinStore((s) => s.toggleTrackVehicle);
  const trackingVehicleId = useDigitalTwinStore((s) => s.trackingVehicleId);
  const isConnected = useDigitalTwinStore((s) => s.isConnected);
  const assignVehicleToUser = useDigitalTwinStore((s) => s.assignVehicleToUser);
  const clearSelection = useDigitalTwinStore((s) => s.clearSelection);

  useEffect(() => {
    socketService.connect();
    clearSelection();
  }, [clearSelection]);

  // Filter owner's vehicle (default Rahul Sharma owns EV-057)
  const ownerVehicles = vehicles.filter(
    (v) => (currentUser?.assignedVehicleIds || ['veh-ev-057', 'veh-ev-024']).includes(v.id) ||
           (currentUser?.assignedVehicleIds || ['veh-ev-057', 'veh-ev-024']).includes(v.code) ||
           v.code === 'EV-057'
  );
  const activeFleet = ownerVehicles.length > 0 ? ownerVehicles : vehicles.slice(0, 2);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(activeFleet[0]?.id || 'veh-ev-057');
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId || v.code === selectedVehicleId) || activeFleet[0] || vehicles[0];
  const destinationStation = activeVehicle?.destinationStationId
    ? stations.find((s) => s.id === activeVehicle.destinationStationId || s.code === activeVehicle.destinationStationId) || null
    : null;

  useEffect(() => {
    if (activeVehicle && !trackingVehicleId) {
      toggleTrackVehicle(activeVehicle.id);
    }
  }, [activeVehicle?.id]);

  // Infotainment Internal Navigation Tab
  const [activeScreenTab, setActiveScreenTab] = useState<'Home' | 'Navigation' | 'Charging' | 'Vehicle' | 'Assistance' | 'Settings'>('Navigation');

  const [selectedDriveMode, setSelectedDriveMode] = useState<'ECO' | 'CITY' | 'SPORT'>('ECO');

  useEffect(() => {
    if (activeVehicle?.driveMode) {
      setSelectedDriveMode(activeVehicle.driveMode);
    }
  }, [activeVehicle?.driveMode]);

  const [isMargdarshakOpen, setIsMargdarshakOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Climate Control States
  const [driverTemp, setDriverTemp] = useState(22.0);
  const [passTemp, setPassTemp] = useState(22.0);
  const [fanSpeed, setFanSpeed] = useState(3);
  const [acActive, setAcActive] = useState(true);
  const [defrostFront, setDefrostFront] = useState(false);
  const [defrostRear, setDefrostRear] = useState(false);
  const [recirculate, setRecirculate] = useState(true);

  // Music Player States
  const PLAYLIST = [
    { title: 'Chasing Horizons', artist: 'AERØ' },
    { title: 'Midnight City', artist: 'M83' },
    { title: 'Neon Drive', artist: 'Kavinsky' },
    { title: 'Electric Avenue', artist: 'Eddy Grant' },
    { title: 'Resonance', artist: 'HOME' }
  ];
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const currentTrack = PLAYLIST[trackIndex];
  const [isCabinMuted, setIsCabinMuted] = useState(false);

  // Assign Vehicle Form States
  const [assignEmail, setAssignEmail] = useState(currentUser?.email || 'rahul.sharma@gmail.com');
  const [assignPassword, setAssignPassword] = useState('evnexus@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedVehicleToAssign, setSelectedVehicleToAssign] = useState<string>(activeVehicle?.id || 'veh-ev-057');
  const [isAssigning, setIsAssigning] = useState(false);

  // SOS Form States
  const [laneBlocked, setLaneBlocked] = useState(true);
  const [vulnerablePassengers, setVulnerablePassengers] = useState(true);
  const [isSubmittingSOS, setIsSubmittingSOS] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Rescue Request for current car
  const activeRescue = rescueRequests.find(
    (r) => (r.vehicleId === activeVehicle?.id || r.vehicleCode === activeVehicle?.code || r.vehicleCode === 'EV-057') &&
           !['COMPLETED', 'CANCELLED'].includes(r.status)
  );

  // Dynamic telemetry metrics with exact stop & stranded detection
  const isStranded = activeVehicle?.status === 'STRANDED' || (typeof activeVehicle?.currentBatteryPct === 'number' && activeVehicle.currentBatteryPct <= 1 && (activeVehicle?.speed ?? 0) === 0);
  const isCharging = activeVehicle?.status === 'CHARGING' || activeVehicle?.status === 'QUEUE' || activeVehicle?.status === 'CHARGER_ASSIGNED';
  const isPaused = activeVehicle?.status === 'PAUSED' || activeVehicle?.trafficState === 'STOPPED';
  const isStopped = isStranded || isCharging || isPaused || (typeof activeVehicle?.speed === 'number' && activeVehicle.speed < 1);

  // Real Speed: If vehicle is stopped or stranded, speed is strictly 0 km/h
  const speedKmh = isStopped ? 0 : Math.round(activeVehicle?.speed ?? 0);

  // Real Battery: 0% if stranded, otherwise accurate percentage
  const batteryPct = isStranded ? 0 : (typeof activeVehicle?.currentBatteryPct === 'number' ? Math.round(activeVehicle.currentBatteryPct) : 46);

  // Real Range: 0 km if battery is 0 or stranded
  const estRangeKm = isStranded || batteryPct === 0 ? 0 : Math.round((batteryPct / 100) * 250);

  // Gear & Driving Indicators
  const gearStatus = isStranded ? 'P · STRANDED' : isCharging ? 'P · CHARGING' : isStopped ? 'P · STOPPED' : 'D · READY';
  const adasStatus = isStranded ? 'HAZARDS ACTIVE' : isCharging ? 'CHARGING PORT ACTIVE' : isStopped ? 'PARK BRAKE ENGAGED' : 'LANE ASSIST ON';
  const driveModeBadge = isStranded ? 'HAZARD' : isStopped ? 'PARK' : selectedDriveMode;

  const DRIVE_MODE_SPEEDS: Record<'ECO' | 'CITY' | 'SPORT', number> = {
    ECO: 40,
    CITY: 60,
    SPORT: 95,
  };

  const handleSelectDriveMode = (mode: 'ECO' | 'CITY' | 'SPORT') => {
    setSelectedDriveMode(mode);
    if (!activeVehicle) return;

    const targetSpeed = DRIVE_MODE_SPEEDS[mode];

    if (isStopped || isStranded) {
      updateVehicle(activeVehicle.id, { driveMode: mode });
      socketService.emit('vehicle:update', { id: activeVehicle.id, driveMode: mode });
      showToast(`${mode} Mode Pre-Selected (Vehicle is ${gearStatus})`);
      return;
    }

    updateVehicle(activeVehicle.id, { 
      speed: targetSpeed, 
      driveMode: mode, 
      status: 'EN_ROUTE',
      trafficState: 'CRUISING' 
    });
    socketService.emit('vehicle:update', { 
      id: activeVehicle.id, 
      speed: targetSpeed, 
      driveMode: mode,
      status: 'EN_ROUTE' 
    });

    if (mode === 'SPORT') {
      showToast(`🔥 SPORT MODE ENGAGED! Throttle unleashed — Target Speed ${targetSpeed} km/h`);
    } else if (mode === 'CITY') {
      showToast(`🏙️ CITY Dynamic Mode active — Cruising at ${targetSpeed} km/h`);
    } else {
      showToast(`🌱 ECO Conservation Mode active — Cruising at ${targetSpeed} km/h`);
    }
  };

  // Steering wheel & Drive controls
  const handleStopVehicle = () => {
    if (!activeVehicle) return;
    updateVehicle(activeVehicle.id, { speed: 0, status: 'PAUSED', trafficState: 'STOPPED' });
    socketService.emit('vehicle:update', { id: activeVehicle.id, speed: 0, status: 'PAUSED' });
    showToast(`Vehicle ${activeVehicle.code} Stopped. Speed is 0 km/h (P · STOPPED).`);
  };

  const handleResumeVehicle = () => {
    if (!activeVehicle) return;
    if (activeVehicle.status === 'STRANDED' || (activeVehicle.currentBatteryPct ?? 0) <= 0) {
      showToast(`Vehicle ${activeVehicle.code} is STRANDED (0% battery). Switching to Roadside Assistance.`);
      setActiveScreenTab('Assistance');
      return;
    }
    const cruisingSpeed = DRIVE_MODE_SPEEDS[selectedDriveMode] || 45;
    updateVehicle(activeVehicle.id, { speed: cruisingSpeed, status: 'EN_ROUTE', trafficState: 'CRUISING', driveMode: selectedDriveMode });
    socketService.emit('vehicle:update', { id: activeVehicle.id, speed: cruisingSpeed, status: 'EN_ROUTE', driveMode: selectedDriveMode });
    showToast(`Vehicle ${activeVehicle.code} Resumed: ${selectedDriveMode} at ${cruisingSpeed} km/h (D · READY).`);
  };

  const handleRerouteToStation = (stationCodeOrId: string) => {
    const target = stations.find((s) => s.code === stationCodeOrId || s.id === stationCodeOrId) || stations[0];
    if (target && activeVehicle) {
      const isStr = activeVehicle.status === 'STRANDED' || (activeVehicle.currentBatteryPct ?? 0) <= 0;
      socketService.rerouteVehicle(activeVehicle.id, target.id);
      updateVehicle(activeVehicle.id, {
        destinationStationId: target.id,
        currentStationId: null,
        assignedChargerId: null,
        status: isStr ? 'STRANDED' : 'EN_ROUTE',
        speed: isStr ? 0 : 45,
        trafficState: isStr ? 'STOPPED' : 'CRUISING',
      });
      showToast(`GPS Navigation: Rerouted ${activeVehicle.code} to ${target.name}`);
    }
  };

  // Dynamic Regional Charging & Fuel Hubs across the digital twin network
  const hubsList = useMemo(() => {
    if (!stations || stations.length === 0) {
      return [
        { code: 'A102', name: 'Boisar Central Hub', dist: '2.9 km', bays: '4/4 Bays', color: 'text-emerald-400' },
        { code: 'B104', name: 'Navapur Road Hub', dist: '6.4 km', bays: '4/4 Bays', color: 'text-emerald-400' },
        { code: 'C201', name: 'MIDC Industrial Hub', dist: '7.8 km', bays: '4/4 Bays', color: 'text-emerald-400' },
        { code: 'D305', name: 'Boisar–Palghar Corridor', dist: '8.5 km', bays: '4/4 Bays', color: 'text-emerald-400' },
        { code: 'P401', name: 'Palghar District Central Hub', dist: '14.2 km', bays: '5/6 Bays', color: 'text-emerald-400' },
        { code: 'S801', name: 'Shirgaon Beach & Fort Hub', dist: '16.1 km', bays: '4/4 Bays', color: 'text-emerald-400' },
        { code: 'M501', name: 'Manor NH-48 Express Hub', dist: '19.5 km', bays: '6/6 Bays', color: 'text-emerald-400' },
        { code: 'T601', name: 'Tarapur Coastal Energy Hub', dist: '15.3 km', bays: '4/4 Bays', color: 'text-emerald-400' },
        { code: 'D701', name: 'Dahanu Highway Hub', dist: '22.0 km', bays: '4/4 Bays', color: 'text-emerald-400' },
      ];
    }

    return stations.map((st) => {
      const availBays = st.chargers?.filter((c) => c.status === 'AVAILABLE').length ?? 3;
      const totalBays = st.chargers?.length ?? 4;
      const distKm = activeVehicle?.position
        ? (Math.hypot(st.position.x - activeVehicle.position.x, st.position.z - activeVehicle.position.z) * 0.12).toFixed(1)
        : '3.5';
      
      return {
        code: st.code,
        name: st.name,
        dist: `${distKm} km`,
        bays: `${availBays}/${totalBays} Bays`,
        color: availBays > 0 ? 'text-emerald-400' : 'text-amber-400',
      };
    });
  }, [stations, activeVehicle?.position?.x, activeVehicle?.position?.z]);

  // Assign vehicle handler
  const handleAssignVehicle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!assignEmail.trim()) {
      showToast('Please enter an email address');
      return;
    }

    setIsAssigning(true);
    try {
      const chosenVeh = vehicles.find(
        (v) => v.id === selectedVehicleToAssign || v.code.toLowerCase() === selectedVehicleToAssign.toLowerCase()
      ) || activeVehicle;

      await fetch('http://localhost:4000/api/auth/assign-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: assignEmail.trim(),
          password: assignPassword,
          vehicleId: chosenVeh.id,
          vehicleCode: chosenVeh.code,
        }),
      }).catch(() => null);

      assignVehicleToUser(chosenVeh.id, assignEmail.trim(), assignEmail.split('@')[0]);
      setSelectedVehicleId(chosenVeh.id);
      toggleTrackVehicle(chosenVeh.id);

      showToast(`Vehicle ${chosenVeh.code} assigned to ${assignEmail}! Camera locked.`);
    } catch {
      showToast('Vehicle assigned locally');
    } finally {
      setIsAssigning(false);
    }
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
        shoulderAvailable: false,
        passengerCount: 2,
        hasVulnerablePassengers: vulnerablePassengers,
        reason: 'Low battery exhaustion on Boisar main corridor',
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

      showToast(`SOS Dispatched! Tow Van En Route to ${activeVehicle.code}`);
    } catch {
      console.error('Failed to trigger SOS');
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
      showToast('Roadside rescue request cancelled');
    } catch {
      console.error('Failed to cancel rescue');
    }
  };

  return (
    <div className={`relative w-full ${embedded ? 'h-full min-h-[620px]' : 'h-full min-h-full'} bg-[#070b13] flex flex-col overflow-hidden font-sans select-none`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-blue-600/95 text-white backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl border border-blue-400 flex items-center gap-2.5 text-xs font-mono font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          TOP SECTION: REALISTIC WINDSHIELD VIEW & OVERHEAD AR
         ======================================================== */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-950">
        
        {/* 3D Simulation through Windshield (First-Person Driver POV) */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <DigitalTwinScene mode="IN_CABIN" activeVehicleId={activeVehicle?.id} />
        </div>

        {/* Authentic In-Cabin Windshield Cockpit Framing */}
        {/* 1. Top Sun-Strip Tint Gradient */}
        <div className="absolute top-0 inset-x-0 h-16 pointer-events-none z-10 bg-gradient-to-b from-black/80 via-black/25 to-transparent" />

        {/* 2. Left A-Pillar Windshield Frame */}
        <div 
          className="absolute top-0 left-0 bottom-0 w-10 sm:w-16 pointer-events-none z-10 bg-gradient-to-r from-black/90 via-black/50 to-transparent"
        />

        {/* 3. Right A-Pillar Windshield Frame */}
        <div 
          className="absolute top-0 right-0 bottom-0 w-10 sm:w-16 pointer-events-none z-10 bg-gradient-to-l from-black/90 via-black/50 to-transparent"
        />

        {/* 4. Lower Dashboard Cowl with Illuminated Ambient Cyan LED Contour Strip */}
        <div className="absolute bottom-0 inset-x-0 h-6 sm:h-8 pointer-events-none z-15 flex flex-col justify-end">
          {/* Ambient Blue/Cyan LED Neon Contour Strip */}
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_14px_#00f0ff]" />

          {/* Curved Soft-Touch Dashboard Surface */}
          <div className="w-full h-full bg-gradient-to-b from-[#090e18] via-[#060a12] to-[#04070d] border-t border-cyan-500/25 flex items-center justify-center relative overflow-hidden">
            {/* Center Acoustic / Light Sensor Bulge */}
            <div className="w-20 sm:w-28 h-2 rounded-t-full bg-[#0d1524] border-t border-cyan-400/30 mx-auto shadow-inner" />
          </div>
        </div>

        {/* Realistic Windshield Tint & Vignette */}
        <div className="absolute inset-0 z-5 pointer-events-none shadow-[inset_0_40px_80px_rgba(0,0,0,0.6)]" />

        {/* Projected Driver Windshield HUD (Speed & Speed Limit) */}
        <div className="absolute top-16 left-28 z-20 pointer-events-none flex items-center gap-3">
          <div className="text-left font-sans">
            <span className={`text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] block leading-none ${
              isStranded ? 'text-red-400 animate-pulse' : selectedDriveMode === 'SPORT' && !isStopped ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.7)]' : 'text-white'
            }`}>
              {speedKmh}
            </span>
            <span className="text-xs font-mono text-slate-300 font-bold uppercase block mt-1 drop-shadow flex items-center gap-1.5">
              <span>km/h {isStranded ? '(STRANDED)' : isStopped ? '(STOPPED)' : ''}</span>
              {!isStranded && !isStopped && (
                <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono font-black ${
                  selectedDriveMode === 'SPORT' 
                    ? 'bg-red-500/90 text-white border border-amber-300/60 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse' 
                    : selectedDriveMode === 'CITY' 
                    ? 'bg-blue-600/80 text-white' 
                    : 'bg-emerald-600/80 text-white'
                }`}>
                  {selectedDriveMode}
                </span>
              )}
            </span>
          </div>

          {/* Speed Limit Sign: 120 km/h in Sport, 80 km/h in City/Eco */}
          <div className="w-8 h-8 rounded-full border-[3px] border-red-600 bg-white flex items-center justify-center text-black font-black text-xs shadow-lg">
            {selectedDriveMode === 'SPORT' ? 120 : 80}
          </div>
        </div>

        {/* Active Rescue Emergency Banner (if roadside rescue active) */}
        {activeRescue && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-25 pointer-events-auto bg-red-600/90 text-white backdrop-blur-md rounded-2xl px-5 py-2 shadow-2xl border border-red-400 flex items-center gap-3 text-xs animate-pulse">
            <PhoneCall className="w-4 h-4" />
            <span className="font-mono font-black uppercase">
              TOW VAN DISPATCHED: {activeRescue.assignedVehicleCode || 'Tow-01'} · ETA ~8 min
            </span>
            <button
              onClick={() => handleCancelRescue(activeRescue.id)}
              className="ml-2 px-2.5 py-0.5 rounded-lg bg-black/40 hover:bg-black/60 text-[10px] font-mono uppercase"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          LOWER SECTION: VEHICLE INTERIOR COCKPIT & INFOTAINMENT
         ======================================================== */}
      <div className="relative z-20 w-full shrink-0 h-[355px] bg-[#0a0f19] border-t border-[#18263f] px-3 sm:px-5 pt-2 pb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between">
        
        {/* Main Cockpit Flex: Steering Wheel + Panoramic Screen */}
        <div className="flex items-center gap-3.5 max-w-7xl mx-auto w-full h-[278px]">
          
          {/* ========================================================
              LEFT: MULTI-FUNCTION STEERING WHEEL WITH TATA LOGO
             ======================================================== */}
          <div className="hidden lg:flex flex-col items-center justify-between shrink-0 w-64 h-full relative select-none">
            {/* Steering Wheel Rim */}
            <div className="relative w-48 h-48 rounded-full border-[12px] border-[#131b2c] shadow-[0_8px_20px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.1)] flex items-center justify-center bg-transparent shrink-0">
              
              {/* Horizontal Spokes with Controls */}
              <div className="absolute w-full h-8 bg-gradient-to-r from-[#172236] via-[#101826] to-[#172236] flex items-center justify-between px-2 text-[9px] text-slate-300 font-mono">
                {/* Left Spoke Thumb Controls */}
                <div className="flex items-center gap-1 z-20">
                  <button 
                    onClick={() => setActiveScreenTab('Assistance')}
                    className="p-1 rounded bg-black/40 hover:bg-red-600/60 cursor-pointer text-slate-300 hover:text-white transition-all flex items-center justify-center text-[10px]"
                    title="Roadside Assistance / SOS"
                  >
                    📞
                  </button>
                  <button 
                    onClick={() => {
                      setIsCabinMuted(!isCabinMuted);
                      showToast(isCabinMuted ? 'Cabin Audio Unmuted' : 'Cabin Audio Muted');
                    }}
                    className={`p-1 rounded bg-black/40 hover:bg-blue-600/60 cursor-pointer transition-all flex items-center justify-center text-[10px] ${
                      isCabinMuted ? 'text-red-400' : 'text-slate-300 hover:text-white'
                    }`}
                    title={isCabinMuted ? 'Unmute' : 'Mute Cabin Sound'}
                  >
                    {isCabinMuted ? '🔇' : '🔊'}
                  </button>
                </div>

                {/* Right Spoke Thumb Controls: Drive Resume & Stop */}
                <div className="flex items-center gap-1 z-20">
                  <button 
                    onClick={handleResumeVehicle}
                    className="px-2 py-0.5 rounded bg-emerald-600/50 hover:bg-emerald-600 border border-emerald-500/60 text-emerald-200 hover:text-white cursor-pointer font-bold text-[8.5px] transition-all shadow-sm"
                    title={`Resume Drive (${selectedDriveMode} · ${DRIVE_MODE_SPEEDS[selectedDriveMode]} km/h)`}
                  >
                    RES
                  </button>
                  <button 
                    onClick={handleStopVehicle}
                    className="px-2 py-0.5 rounded bg-amber-600/50 hover:bg-amber-600 border border-amber-500/60 text-amber-200 hover:text-white cursor-pointer font-bold text-[8.5px] transition-all shadow-sm"
                    title="Stop / Park Vehicle (0 km/h)"
                  >
                    SET
                  </button>
                </div>
              </div>

              {/* Lower Vertical Spoke */}
              <div className="absolute bottom-0 w-8 h-12 bg-[#152033]" />

              {/* Center Airbag Hub with Tata Motors Logo */}
              <div 
                onClick={() => setActiveScreenTab('Settings')}
                className="relative z-10 w-16 h-16 rounded-full bg-[#0e1625] border-2 border-[#2b3d5e] flex flex-col items-center justify-center shadow-xl cursor-pointer hover:scale-105 transition-transform"
                title="Click to Switch Vehicle / Driver Credentials"
              >
                {/* Illuminated Tata Motors Logo Emblem */}
                <svg viewBox="0 0 100 65" className="w-8 h-5 drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]" fill="none">
                  <ellipse cx="50" cy="32.5" rx="46" ry="29" stroke="url(#tataGlow)" strokeWidth="4" />
                  <path d="M 24 24 C 36 24 47 34 47 48" stroke="url(#tataGlow)" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M 76 24 C 64 24 53 34 53 48" stroke="url(#tataGlow)" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M 28 24 Q 50 20 72 24" stroke="url(#tataGlow)" strokeWidth="4.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="tataGlow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-[6.5px] font-mono font-bold tracking-widest text-slate-300 mt-0.5 uppercase">
                  TATA EV
                </span>
              </div>
            </div>

            {/* Digital Cockpit Instrument Cluster (Behind Steering Wheel - Matching Image 2) */}
            <div className="w-full mt-1.5 bg-[#060a14] border border-blue-500/20 rounded-xl p-1.5 shadow-lg flex items-center justify-between font-mono relative overflow-hidden">
              {/* Left Circular Gauge: Battery SOC & Range */}
              <div className="flex flex-col items-center relative w-14">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#162238" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={isStranded ? '#ef4444' : '#10b981'}
                      strokeWidth="3.2"
                      strokeDasharray={`${(batteryPct / 100) * 88} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className={`text-[10px] font-black leading-none ${isStranded ? 'text-red-400' : 'text-emerald-400'}`}>
                      {batteryPct}%
                    </span>
                    <span className="text-[6.5px] text-slate-400 font-sans mt-0.5 leading-none">
                      {estRangeKm} km
                    </span>
                  </div>
                </div>
                <span className="text-[6px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans font-bold">
                  RANGE
                </span>
              </div>

              {/* Center ADAS Lane Perspective Display */}
              <div className="flex flex-col items-center justify-center px-1 border-x border-white/10 w-18">
                <div className="relative w-12 h-9 flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 60 40">
                    <polygon points="12,40 48,40 38,12 22,12" fill="#091322" opacity="0.8" />
                    <line x1="14" y1="40" x2="23" y2="12" stroke="#00e5ff" strokeWidth="1.8" opacity="0.85" />
                    <line x1="46" y1="40" x2="37" y2="12" stroke="#00e5ff" strokeWidth="1.8" opacity="0.85" />
                    <line x1="30" y1="40" x2="30" y2="16" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  </svg>
                  <div className="absolute bottom-0.5 text-[10px]">
                    🚘
                  </div>
                </div>
                <span className="text-[7px] font-black text-cyan-300 tracking-wider">
                  {isStranded ? 'P · STRANDED' : isStopped ? 'P · PARK' : 'D · READY'}
                </span>
              </div>

              {/* Right Circular Gauge: Speedometer & Drive Mode */}
              <div className="flex flex-col items-center relative w-14">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#162238" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={selectedDriveMode === 'SPORT' && !isStopped ? '#ef4444' : selectedDriveMode === 'CITY' && !isStopped ? '#3b82f6' : '#10b981'}
                      strokeWidth="3.2"
                      strokeDasharray={`${Math.min(88, (speedKmh / 120) * 88)} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-white leading-none">
                      {speedKmh}
                    </span>
                    <span className="text-[6.5px] text-slate-400 font-mono leading-none mt-0.5">
                      km/h
                    </span>
                  </div>
                </div>
                <span className={`text-[6.5px] font-black uppercase tracking-widest mt-0.5 font-sans ${
                  selectedDriveMode === 'SPORT' && !isStopped ? 'text-amber-400 font-bold animate-pulse' : 'text-cyan-400'
                }`}>
                  {driveModeBadge}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              CENTER & RIGHT: PANORAMIC CURVED INFOTAINMENT DISPLAY
             ======================================================== */}
          <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden bg-[#0a101d] border border-[#203152] rounded-2xl p-2 sm:p-2.5 shadow-2xl relative">
            
            {/* Electric Blue Ambient LED Strip along bottom of screen */}
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />

            <div className="grid grid-cols-12 gap-2.5 items-stretch h-full min-h-0">
              
              {/* 1. Infotainment Left Vertical Menu (Col 1-2) */}
              <div className="col-span-12 sm:col-span-2 flex sm:flex-col gap-0.5 border-b sm:border-b-0 sm:border-r border-white/10 pr-0 sm:pr-1.5 pb-1 sm:pb-0 overflow-x-auto">
                {[
                  { id: 'Home', label: 'Home', icon: Home },
                  { id: 'Navigation', label: 'Navigation', icon: Navigation },
                  { id: 'Charging', label: 'Charging', icon: Zap },
                  { id: 'Vehicle', label: 'Vehicle', icon: Car },
                  { id: 'Assistance', label: 'Assistance', icon: Shield },
                  { id: 'Settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreenTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveScreenTab(item.id as any)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold ring-1 ring-blue-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2. Infotainment Main Content Area (Col 3-12) */}
              <div className="col-span-12 sm:col-span-10 flex flex-col h-full min-h-0 overflow-y-auto pr-0.5">
                
                {/* TAB 1: NAVIGATION (FULL INTERACTIVE GPS MAP - MATCHING IMAGE 2) */}
                {activeScreenTab === 'Navigation' && (
                  <InfotainmentNavMap
                    vehicle={activeVehicle}
                    destinationStation={destinationStation}
                    stations={stations}
                    speedKmh={speedKmh}
                    batteryPct={batteryPct}
                    onReroute={handleRerouteToStation}
                    onOpenMargdarshak={() => setIsMargdarshakOpen(true)}
                  />
                )}

                {/* TAB 2: CHARGING (DEDICATED STATIONS BROWSER & LIVE BAYS) */}
                {activeScreenTab === 'Charging' && (
                  <div className="h-full flex flex-col justify-between gap-2.5 min-h-0">
                    {/* Header: Battery Charging State */}
                    <div className="grid grid-cols-4 gap-2 bg-[#060b14] border border-blue-500/20 rounded-xl p-2 shrink-0">
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-sans block">BATTERY STATE</span>
                        <span className={`text-xs font-black font-mono ${isStranded ? 'text-red-400' : 'text-emerald-400'}`}>
                          {batteryPct}%
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono block">~{estRangeKm} km</span>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <span className="text-[9px] text-slate-400 font-sans block">CHARGING RATE</span>
                        <span className="text-xs font-black font-mono text-cyan-400">120 kW</span>
                        <span className="text-[8.5px] text-slate-500 font-mono block">DC Fast CCS2</span>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <span className="text-[9px] text-slate-400 font-sans block">TIME TO 80%</span>
                        <span className="text-xs font-black font-mono text-white">~22 min</span>
                        <span className="text-[8.5px] text-slate-500 font-mono block">Ultra-Fast</span>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <span className="text-[9px] text-slate-400 font-sans block">NETWORK HUBS</span>
                        <span className="text-xs font-black font-mono text-emerald-400">{stations.length > 0 ? stations.length : hubsList.length} Active</span>
                        <span className="text-[8.5px] text-slate-500 font-mono block">Palghar District</span>
                      </div>
                    </div>

                    {/* Stations Grid: Responsive 3-column scrollable grid displaying all 9 regional charging & fuel hubs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 flex-1 min-h-0 overflow-y-auto pr-1">
                      {hubsList.map((hub) => (
                        <div
                          key={hub.code}
                          className="p-2.5 rounded-xl bg-[#091222] border border-white/10 hover:border-cyan-400/50 flex flex-col justify-between transition-all shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 pr-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                <span className="font-bold text-white text-[11px] truncate block">{hub.name}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{hub.dist} · DC Fast</span>
                            </div>
                            <span className="font-mono text-[9px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                              {hub.bays}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              handleRerouteToStation(hub.code);
                              setActiveScreenTab('Navigation');
                            }}
                            className="mt-2 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-blue-600/30"
                          >
                            <Navigation className="w-3 h-3 rotate-45" />
                            <span>Navigate to this Hub</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: VEHICLE (LIVE TELEMETRY & DRIVE DYNAMICS) */}
                {activeScreenTab === 'Vehicle' && (
                  <div className="h-full flex flex-col justify-between space-y-2">
                    {/* Live Telemetry Metric Cards */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-xl bg-[#091222] border border-white/10 text-center">
                        <span className="text-[9px] text-slate-400 block font-sans">MOTOR POWER</span>
                        <span className="text-sm font-black font-mono text-cyan-400 block mt-0.5">95 kW</span>
                        <span className="text-[8.5px] text-slate-500 font-mono block">245 Nm · 3,420 RPM</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#091222] border border-white/10 text-center">
                        <span className="text-[9px] text-slate-400 block font-sans">BATTERY HEALTH</span>
                        <span className="text-sm font-black font-mono text-emerald-400 block mt-0.5">98.2%</span>
                        <span className="text-[8.5px] text-slate-500 font-mono block">31.4°C · SOH Optimal</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#091222] border border-white/10 text-center">
                        <span className="text-[9px] text-slate-400 block font-sans">TIRE PRESSURE</span>
                        <span className="text-sm font-black font-mono text-white block mt-0.5">33 PSI</span>
                        <span className="text-[8.5px] text-emerald-400 font-mono block">All 4 Wheels OK</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#091222] border border-white/10 text-center">
                        <span className="text-[9px] text-slate-400 block font-sans">EFFICIENCY</span>
                        <span className="text-sm font-black font-mono text-indigo-300 block mt-0.5">138 Wh/km</span>
                        <span className="text-[8.5px] text-slate-500 font-mono block">Regen: 42.8 kWh</span>
                      </div>
                    </div>

                    {/* Drive Mode & Regen Selection */}
                    <div className="grid grid-cols-2 gap-2 flex-1 items-stretch">
                      {/* Drive Mode Selector */}
                      <div className="p-2.5 rounded-xl bg-[#091222] border border-white/10 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-white block">Drive Dynamics Mode</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Throttle curve and energy conservation</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                          {(['ECO', 'CITY', 'SPORT'] as const).map((mode) => {
                            const isCurrent = selectedDriveMode === mode;
                            return (
                              <button
                                key={mode}
                                onClick={() => handleSelectDriveMode(mode)}
                                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer flex flex-col items-center justify-center ${
                                  isCurrent
                                    ? mode === 'SPORT'
                                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/50 ring-1 ring-red-400 font-black scale-[1.02]'
                                      : mode === 'CITY'
                                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-bold ring-1 ring-blue-300'
                                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 font-bold ring-1 ring-emerald-300'
                                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                                }`}
                              >
                                <span>{mode}</span>
                                <span className="text-[7.5px] opacity-80 font-normal">
                                  {mode === 'SPORT' ? '95 km/h' : mode === 'CITY' ? '60 km/h' : '40 km/h'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Regenerative Braking Selector */}
                      <div className="p-2.5 rounded-xl bg-[#091222] border border-white/10 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-white block">Regenerative Braking Level</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Energy recovery intensity upon deceleration</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                          {['Level 1', 'Level 2', 'One-Pedal'].map((lvl, i) => (
                            <button
                              key={lvl}
                              onClick={() => showToast(`Regenerative Braking: ${lvl}`)}
                              className={`py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                i === 1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: ASSISTANCE (EMERGENCY ROADSIDE TOW ASSISTANCE) */}
                {activeScreenTab === 'Assistance' && (
                  <div className="h-full flex flex-col justify-between space-y-2">
                    {/* Active Rescue or Readiness Banner */}
                    <div className={`p-2 rounded-xl border flex items-center justify-between ${
                      activeRescue
                        ? 'bg-red-950/80 border-red-500 animate-pulse'
                        : 'bg-[#091222] border-white/10'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeRescue ? 'bg-red-600 text-white' : 'bg-blue-600/30 text-blue-400'}`}>
                          <PhoneCall className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-white block leading-tight">
                            {activeRescue ? `TOW VAN DISPATCHED: ${activeRescue.assignedVehicleCode || 'Tow-01'}` : '24/7 Roadside EV Emergency Network'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            {activeRescue ? 'Estimated Arrival: ~8 min · Emergency Services Notified' : 'Direct roadside towing, flatbed dispatch & mobile charging van'}
                          </span>
                        </div>
                      </div>

                      {activeRescue && (
                        <button
                          onClick={() => handleCancelRescue(activeRescue.id)}
                          className="px-2.5 py-0.5 rounded-lg bg-black/50 hover:bg-black/70 text-red-300 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Emergency Actions Grid */}
                    <div className="grid grid-cols-2 gap-2 flex-1 items-stretch">
                      {/* 1-Click SOS Dispatch */}
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4a121d] to-[#250a10] border border-red-500/40 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-black text-white block">Immediate SOS Towing Request</span>
                          <p className="text-[9px] text-red-200 mt-0.5">
                            Broadcast GPS coordinates to nearest Boisar recovery van.
                          </p>

                          <div className="mt-1.5 space-y-1 text-[9px] text-slate-300 font-mono">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={laneBlocked}
                                onChange={(e) => setLaneBlocked(e.target.checked)}
                                className="rounded text-red-600 w-3 h-3"
                              />
                              <span>Vehicle is blocking traffic lane</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={vulnerablePassengers}
                                onChange={(e) => setVulnerablePassengers(e.target.checked)}
                                className="rounded text-red-600 w-3 h-3"
                              />
                              <span>Elderly / children / priority medical aboard</span>
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={handleTriggerSOS}
                          disabled={isSubmittingSOS}
                          className="mt-2 w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] tracking-wider uppercase shadow-md shadow-red-600/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{isSubmittingSOS ? 'Dispatching Tow Van...' : 'Dispatch Roadside Tow Van'}</span>
                        </button>
                      </div>

                      {/* Hotlines & Service Center */}
                      <div className="p-2.5 rounded-xl bg-[#091222] border border-white/10 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-white block">Emergency Hotlines & Hub Support</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Dedicated Tata Motors EV Roadside Assistance</span>

                          <div className="mt-2 space-y-1.5">
                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Tata EV Toll-Free:</span>
                              <span className="font-mono text-cyan-400 font-bold">1800-209-7979</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Saravali Service Hub:</span>
                              <span className="font-mono text-emerald-400 font-bold">4.2 km · Open 24h</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => showToast('Emergency Hazard Flashers Activated')}
                          className="w-full py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600 border border-amber-500/40 text-amber-200 hover:text-white font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Toggle Hazard Flashers</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: SETTINGS (DRIVER CREDENTIALS & VEHICLE ASSIGNMENT) */}
                {activeScreenTab === 'Settings' && (
                  <div className="h-full flex flex-col justify-between space-y-2">
                    {/* Active Driver Profile Banner */}
                    <div className="p-2 rounded-xl bg-[#091222] border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                          {currentUser?.name ? currentUser.name[0].toUpperCase() : 'R'}
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-white block leading-tight">
                            Driver: {currentUser?.name || 'Rahul Sharma'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            {currentUser?.email || 'rahul.sharma@gmail.com'} · ID: DRV-8821
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-cyan-400 block font-mono">
                          {activeVehicle.code} ({activeVehicle.model})
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Cockpit Camera Locked
                        </span>
                      </div>
                    </div>

                    {/* Vehicle Assignment & Switcher Form */}
                    <form onSubmit={handleAssignVehicle} className="p-2.5 rounded-xl bg-[#091222] border border-blue-500/20 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-white">Switch or Assign Any Vehicle in Fleet</span>
                          <span className="text-[9px] text-slate-400 font-mono">{vehicles.length} Vehicles Online</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Driver Email</label>
                            <input
                              type="email"
                              required
                              value={assignEmail}
                              onChange={(e) => setAssignEmail(e.target.value)}
                              placeholder="e.g. rahul.sharma@gmail.com"
                              className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] font-mono focus:border-cyan-400 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={assignPassword}
                                onChange={(e) => setAssignPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] font-mono focus:border-cyan-400 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-slate-400 block mb-0.5">Assign EV in Fleet</label>
                            <select
                              value={selectedVehicleToAssign}
                              onChange={(e) => setSelectedVehicleToAssign(e.target.value)}
                              className="w-full px-2.5 py-1 rounded-lg bg-[#060a14] border border-white/10 text-white text-[11px] font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
                            >
                              {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.code} · {v.model} ({Math.round(v.currentBatteryPct)}% · {Math.round(v.speed)} km/h)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400">
                          Assigns vehicle to driver account and aligns the 3D first-person cockpit camera.
                        </span>
                        <button
                          type="submit"
                          disabled={isAssigning}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-md shadow-blue-600/40 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isAssigning ? 'Assigning...' : 'Assign & Lock'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 6: HOME (CLEAN VEHICLE OVERVIEW - NO DUPLICATE BUTTONS) */}
                {activeScreenTab === 'Home' && (
                  <div className="h-full flex flex-col justify-between gap-2.5 min-h-0">
                    {/* Top Row: Next Trip Destination Card + Live Vehicle Vitality */}
                    <div className="grid grid-cols-2 gap-2.5 shrink-0">
                      {/* Active Navigation Preview */}
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#123160] to-[#0c1e3d] border border-blue-400/30 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-cyan-300 font-mono font-bold">ACTIVE TRIP</span>
                            <span className="text-[9px] text-slate-400 font-mono">ETA 6 min</span>
                          </div>
                          <span className="text-xs font-black text-white block mt-0.5">
                            {destinationStation ? destinationStation.name : (activeVehicle?.currentLocationName ? activeVehicle.currentLocationName.replace(/^Patrolling\s+/i, '') : 'Boisar Central Hub')}
                          </span>
                          <span className="text-[9px] text-slate-300 block truncate">
                            {destinationStation ? 'Target Fast Charging Hub · DC CCS2' : 'Regional Highway Corridor'}
                          </span>
                        </div>

                        <button
                          onClick={() => setActiveScreenTab('Navigation')}
                          className="mt-1.5 py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                        >
                          <Navigation className="w-3 h-3 rotate-45" />
                          <span>Open Full GPS Navigation</span>
                        </button>
                      </div>

                      {/* Live Drive Vitals */}
                      <div className="p-2.5 rounded-xl bg-[#091222] border border-white/10 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold block">VEHICLE TELEMETRY</span>
                          <div className="flex items-baseline justify-between mt-0.5">
                            <span className="text-lg font-black font-mono text-white">{speedKmh} km/h</span>
                            <span className={`text-[11px] font-mono font-bold ${isStranded ? 'text-red-400' : 'text-emerald-400'}`}>
                              {batteryPct}% (~{estRangeKm} km)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[9px] font-mono text-slate-400">
                          <span>Status: <b className="text-white">{gearStatus}</b></span>
                          <span>Drive: <b className={selectedDriveMode === 'SPORT' && !isStopped ? 'text-amber-400 font-bold animate-pulse' : 'text-cyan-400'}>{driveModeBadge}</b></span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: 3 Core Primary Non-Duplicate Shortcuts */}
                    <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0 items-stretch">
                      {/* Charging Network */}
                      <button
                        onClick={() => setActiveScreenTab('Charging')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400 text-left transition-all flex flex-col justify-between cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-white block">Charging Network</span>
                          <span className="text-[8.5px] text-slate-400 block mt-0.5">Live bay availability & speeds</span>
                        </div>
                      </button>

                      {/* Vehicle Diagnostics */}
                      <button
                        onClick={() => setActiveScreenTab('Vehicle')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400 text-left transition-all flex flex-col justify-between cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-white block">Diagnostics & Health</span>
                          <span className="text-[8.5px] text-slate-400 block mt-0.5">Motor, TPMS & regen modes</span>
                        </div>
                      </button>

                      {/* Assistance */}
                      <button
                        onClick={() => setActiveScreenTab('Assistance')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-400 text-left transition-all flex flex-col justify-between cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-400/40 text-red-400 flex items-center justify-center shrink-0">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-white block">Roadside Assistance</span>
                          <span className="text-[8.5px] text-slate-400 block mt-0.5">Emergency SOS & recovery dispatch</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            BOTTOM VEHICLE CONTROLS BAR: MEDIA + CLIMATE + DRIVER PROFILE
           ======================================================== */}
        <div className="mt-1.5 pt-1.5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-white max-w-7xl mx-auto w-full shrink-0">
          
          {/* 1. Media Player Widget */}
          <div className="flex items-center gap-2.5 bg-[#0d1625] border border-white/10 px-2.5 py-1 rounded-xl shadow-md w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-[9px] shadow-sm">
                🎵
              </div>
              <div>
                <span className="text-[11px] font-bold text-white block leading-tight">{currentTrack.title}</span>
                <span className="text-[9px] text-slate-400 font-mono block">{currentTrack.artist}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <button 
                onClick={() => {
                  const nextIdx = (trackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
                  setTrackIndex(nextIdx);
                  showToast(`Playing: ${PLAYLIST[nextIdx].title} — ${PLAYLIST[nextIdx].artist}`);
                }}
                className="p-0.5 hover:text-white cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-3 h-3" />
              </button>
              <button 
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  showToast(!isPlaying ? 'Media Playback Resumed' : 'Media Playback Paused');
                }}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button 
                onClick={() => {
                  const nextIdx = (trackIndex + 1) % PLAYLIST.length;
                  setTrackIndex(nextIdx);
                  showToast(`Playing: ${PLAYLIST[nextIdx].title} — ${PLAYLIST[nextIdx].artist}`);
                }}
                className="p-0.5 hover:text-white cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. Dual-Zone Climate Controls (A/C) */}
          <div className="flex items-center gap-1.5 bg-[#0d1625] border border-white/10 px-3 py-1 rounded-xl shadow-md font-mono text-[11px]">
            {/* Driver Temp */}
            <div className="flex items-center gap-0.5">
              <button 
                onClick={() => {
                  const t = Number((driverTemp - 0.5).toFixed(1));
                  setDriverTemp(t);
                  showToast(`Driver Temperature: ${t}°C`);
                }}
                className="px-1 text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ‹
              </button>
              <span className="font-bold text-white">{driverTemp.toFixed(1)}°C</span>
              <button 
                onClick={() => {
                  const t = Number((driverTemp + 0.5).toFixed(1));
                  setDriverTemp(t);
                  showToast(`Driver Temperature: ${t}°C`);
                }}
                className="px-1 text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ›
              </button>
            </div>

            {/* Fan Speed Button (Click to cycle speed) */}
            <button 
              onClick={() => {
                const nextFan = (fanSpeed % 5) + 1;
                setFanSpeed(nextFan);
                showToast(`Cabin Fan Speed: Level ${nextFan}`);
              }}
              className="flex items-center gap-1 px-1.5 border-l border-r border-white/10 text-slate-300 hover:text-white font-sans cursor-pointer"
              title="Click to change fan speed"
            >
              <Fan className="w-3 h-3 text-blue-400" />
              <span className="font-mono">{fanSpeed}</span>
            </button>

            {/* A/C Toggle */}
            <button 
              onClick={() => {
                setAcActive(!acActive);
                showToast(!acActive ? 'Air Conditioning ON' : 'Air Conditioning OFF');
              }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${acActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              A/C
            </button>

            {/* Defrost Front */}
            <button 
              onClick={() => {
                setDefrostFront(!defrostFront);
                showToast(!defrostFront ? 'Front Windshield Defrost ON' : 'Front Defrost OFF');
              }}
              className={`p-0.5 rounded cursor-pointer ${defrostFront ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'}`}
              title="Front Windshield Defrost"
            >
              <Wind className="w-3 h-3" />
            </button>

            {/* Defrost Rear */}
            <button 
              onClick={() => {
                setDefrostRear(!defrostRear);
                showToast(!defrostRear ? 'Rear Window Defrost ON' : 'Rear Defrost OFF');
              }}
              className={`p-0.5 rounded cursor-pointer ${defrostRear ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'}`}
              title="Rear Window Defrost"
            >
              <Layers className="w-3 h-3" />
            </button>

            {/* Air Recirculation */}
            <button 
              onClick={() => {
                setRecirculate(!recirculate);
                showToast(!recirculate ? 'Air Recirculation ON' : 'Fresh Air Intake ON');
              }}
              className={`p-0.5 rounded cursor-pointer ${recirculate ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
              title="Internal Air Circulation"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            {/* Passenger Temp */}
            <div className="flex items-center gap-0.5 pl-1.5 border-l border-white/10">
              <button 
                onClick={() => {
                  const t = Number((passTemp - 0.5).toFixed(1));
                  setPassTemp(t);
                  showToast(`Passenger Temperature: ${t}°C`);
                }}
                className="px-1 text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ‹
              </button>
              <span className="font-bold text-white">{passTemp.toFixed(1)}°C</span>
              <button 
                onClick={() => {
                  const t = Number((passTemp + 0.5).toFixed(1));
                  setPassTemp(t);
                  showToast(`Passenger Temperature: ${t}°C`);
                }}
                className="px-1 text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ›
              </button>
            </div>
          </div>

          {/* 3. Connectivity & Driver Profile */}
          <div 
            onClick={() => setActiveScreenTab('Settings')}
            className="flex items-center gap-2.5 bg-[#0d1625] hover:bg-[#132035] border border-white/10 px-2.5 py-1 rounded-xl shadow-md cursor-pointer transition-all"
            title="Click to Switch User / Assign Vehicle"
          >
            {/* 5G Signal */}
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 border-r border-white/10 pr-1.5">
              <span>5G</span>
              <span className="text-emerald-400 font-bold">📶</span>
            </div>

            {/* User Avatar Circle */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'R'}
            </div>

            <div className="text-left font-sans">
              <span className="text-[11px] font-bold text-white block leading-tight">
                {currentUser?.name || 'Rahul Sharma'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono block">
                {activeVehicle?.code || 'EV-057'} · {activeVehicle?.model || 'Tata Tiago EV'}
              </span>
            </div>
          </div>

        </div>
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
