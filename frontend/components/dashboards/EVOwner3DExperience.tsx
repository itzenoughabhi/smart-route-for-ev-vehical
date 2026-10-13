'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  Info
} from 'lucide-react';
import { Vehicle, Station } from '../../types';

// Dynamic import of the existing 3D scene
const DigitalTwinScene = dynamic(
  () => import('../../3d/Scene').then((mod) => mod.DigitalTwinScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#edf3f8] text-slate-600">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs tracking-wider text-slate-700 uppercase font-semibold">
          Initializing 3D EV Driving Environment...
        </p>
        <span className="text-[10px] text-slate-500 font-mono mt-1">
          Synchronizing GIS Road Network, Moving Vehicles & Substation Telemetry
        </span>
      </div>
    ),
  }
);

export function EVOwner3DExperience() {
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const vehicles = useDigitalTwinStore((s) => s.vehicles);
  const stations = useDigitalTwinStore((s) => s.stations);
  const rescueRequests = useDigitalTwinStore((s) => s.rescueRequests);
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const recenterCamera = useDigitalTwinStore((s) => s.recenterCamera);
  const toggleTrackVehicle = useDigitalTwinStore((s) => s.toggleTrackVehicle);
  const trackingVehicleId = useDigitalTwinStore((s) => s.trackingVehicleId);
  const isConnected = useDigitalTwinStore((s) => s.isConnected);

  // Initialize socket connection on mount
  useEffect(() => {
    socketService.connect();
  }, []);

  // Filter owner's registered vehicles (Rahul Sharma owns EV-024 & EV-057)
  const ownerVehicles = vehicles.filter(
    (v) => (currentUser?.assignedVehicleIds || ['veh-ev-024', 'veh-ev-057']).includes(v.id) ||
           (currentUser?.assignedVehicleIds || ['veh-ev-024', 'veh-ev-057']).includes(v.code)
  );
  const activeFleet = ownerVehicles.length > 0 ? ownerVehicles : vehicles.slice(0, 2);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(activeFleet[0]?.id || 'veh-ev-024');
  const activeVehicle = activeFleet.find((v) => v.id === selectedVehicleId) || activeFleet[0];

  // Auto-track the owner's vehicle initially for immersive experience
  useEffect(() => {
    if (activeVehicle && !trackingVehicleId) {
      toggleTrackVehicle(activeVehicle.id);
    }
  }, [activeVehicle?.id]);

  // Modal & Drawer States
  const [activeDrawer, setActiveDrawer] = useState<'NAVIGATE' | 'SOS' | 'TELEMETRY' | 'HISTORY' | null>(null);
  const [isMargdarshakOpen, setIsMargdarshakOpen] = useState(false);
  const [selectedTargetStation, setSelectedTargetStation] = useState<Station | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // SOS Roadside Form State
  const [laneBlocked, setLaneBlocked] = useState(true);
  const [shoulderAvailable, setShoulderAvailable] = useState(false);
  const [passengerCount, setPassengerCount] = useState(2);
  const [vulnerablePassengers, setVulnerablePassengers] = useState(true);
  const [emergencyNote, setEmergencyNote] = useState('');
  const [isSubmittingSOS, setIsSubmittingSOS] = useState(false);

  // Active rescue request for active vehicle
  const activeRescue = rescueRequests.find(
    (r) => (r.vehicleId === activeVehicle?.id || r.vehicleCode === activeVehicle?.code) &&
           !['COMPLETED', 'CANCELLED'].includes(r.status)
  );

  // Nearby stations calculated from active vehicle position
  const nearbyStations = stations.map((st) => {
    const dist = activeVehicle
      ? Math.hypot(st.position.x - activeVehicle.position.x, st.position.z - activeVehicle.position.z) * 0.12
      : 3.2;
    const availBays = st.chargers.filter((c) => c.status === 'AVAILABLE').length;
    return {
      ...st,
      distanceKm: Number(dist.toFixed(1)),
      availBays,
      totalBays: st.chargers.length,
      estimatedWaitMin: (st.queue?.length || 0) * 12,
      estArrivalSoc: Math.max(2, Math.round(activeVehicle ? activeVehicle.currentBatteryPct - dist * 1.6 : 40)),
      estTravelTimeMin: Math.round((dist / 38) * 60) + 2,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  // Navigation action: reroute simulated EV to chosen station
  const handleStartNavigation = (station: typeof nearbyStations[0]) => {
    if (!activeVehicle) return;
    setIsNavigating(true);
    socketService.emit('simulation:reroute', {
      vehicleId: activeVehicle.id,
      targetStationId: station.id,
    });
    setActiveDrawer(null);
  };

  // SOS Dispatch submission
  const handleSubmitSOS = async () => {
    if (!activeVehicle) return;
    setIsSubmittingSOS(true);
    try {
      socketService.createRescueRequest({
        vehicleId: activeVehicle.id,
        ownerId: currentUser?.id,
        ownerName: currentUser?.name || 'Rahul Sharma',
        laneBlocked,
        shoulderAvailable,
        passengerCount,
        vulnerablePassengers,
        note: emergencyNote || `Emergency roadside tow requested for ${activeVehicle.code} (${activeVehicle.model})`,
      });
      setActiveDrawer(null);
    } finally {
      setIsSubmittingSOS(false);
    }
  };

  const handleCancelRescue = (requestId: string) => {
    socketService.emit('rescue:update-status', {
      requestId,
      status: 'CANCELLED',
      note: 'Cancelled by EV owner',
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-900 select-none">
      {/* 1. IMMERSIVE 3D VIEWPORT (Primary Full-Screen View) */}
      <div className="absolute inset-0 z-0">
        <DigitalTwinScene />
      </div>

      {/* 2. TOP HUD: Vehicle Telemetry & Live Status Strip */}
      <div className="absolute top-3 left-4 right-4 z-20 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          {/* Active Vehicle Badge & Switcher */}
          <div className="flex items-center gap-2 bg-white/80 hover:bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl p-1.5 shadow-md transition-all">
            <div className="flex items-center gap-2 pl-2 pr-3 py-1">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-900">
                    {activeVehicle?.code || 'EV-024'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {activeVehicle?.model || 'Tata Nexon EV'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono leading-none">
                  Owner: {currentUser?.name || 'Rahul Sharma'}
                </div>
              </div>
            </div>

            {/* Switch vehicles button if owner has multiple */}
            {activeFleet.length > 1 && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                {activeFleet.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      toggleTrackVehicle(v.id);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      v.id === activeVehicle?.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {v.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core HUD Telemetry Meters */}
          <div className="flex items-center gap-2">
            {/* Battery SOC % */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-3 py-1.5 shadow-md flex items-center gap-2 font-mono">
              <BatteryCharging className={`w-4 h-4 ${
                (activeVehicle?.currentBatteryPct ?? 100) < 20 ? 'text-red-600 animate-pulse' : 'text-emerald-600'
              }`} />
              <div>
                <span className="text-[9px] text-slate-400 block font-medium">BATTERY SOC</span>
                <span className={`text-xs font-black ${
                  (activeVehicle?.currentBatteryPct ?? 100) < 20 ? 'text-red-600' : 'text-slate-900'
                }`}>
                  {activeVehicle?.currentBatteryPct.toFixed(0) ?? 82}%
                </span>
              </div>
            </div>

            {/* Estimated Range */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-3 py-1.5 shadow-md font-mono hidden sm:block">
              <span className="text-[9px] text-slate-400 block font-medium">EST. RANGE</span>
              <span className="text-xs font-black text-slate-900">
                ~{activeVehicle?.estimatedRangeKm || Math.round(((activeVehicle?.currentBatteryPct || 80) / 100) * 380)} km
              </span>
            </div>

            {/* Current Speed */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-3 py-1.5 shadow-md font-mono hidden sm:block">
              <span className="text-[9px] text-slate-400 block font-medium">SPEED</span>
              <span className="text-xs font-black text-slate-900">
                {activeVehicle?.speed.toFixed(0) ?? 42} km/h
              </span>
            </div>

            {/* Active Status Badge */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-3 py-1.5 shadow-md font-mono text-xs">
              <span className="text-[9px] text-slate-400 block font-medium">STATUS</span>
              <span className={`font-black text-[11px] ${
                activeVehicle?.status === 'STRANDED' ? 'text-red-600' :
                activeVehicle?.status === 'BEING_TOWED' ? 'text-amber-600' :
                activeVehicle?.status === 'CHARGING' ? 'text-emerald-600' : 'text-blue-600'
              }`}>
                {activeVehicle?.status ?? 'EN_ROUTE'}
              </span>
            </div>

            {/* Camera Controls Button */}
            <div className="flex items-center bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-1 shadow-md">
              <button
                onClick={() => activeVehicle && toggleTrackVehicle(activeVehicle.id)}
                title="Toggle Follow-Vehicle Camera"
                className={`p-1.5 rounded-xl transition-all ${
                  trackingVehicleId === activeVehicle?.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={recenterCamera}
                title="Reset Camera to City Overview"
                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Rescue Emergency Banner (if roadside rescue active) */}
        {activeRescue && (
          <div className="pointer-events-auto bg-amber-500/90 text-white backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-amber-400/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="font-bold font-mono">
                ROADSIDE RESCUE ACTIVE: {activeRescue.status}
                {activeRescue.queuePosition && activeRescue.queuePosition > 0 
                  ? ` (Queue Position #${activeRescue.queuePosition} · ETA ~${activeRescue.estimatedArrivalMinutes}m)` 
                  : ` (Tow Van ${activeRescue.assignedVehicleCode || 'Dispatched'} En Route)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveDrawer('SOS')}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] transition-all font-mono"
              >
                View Incident
              </button>
              <button
                onClick={() => handleCancelRescue(activeRescue.id)}
                className="px-2 py-1 rounded-lg hover:bg-white/20 text-white/90 text-[11px] font-mono"
              >
                Cancel SOS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. FLOATING ACTION DOCK (Bottom Control Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-white/80 p-2 rounded-2xl shadow-xl">
        {/* Navigate to Charging Station */}
        <button
          onClick={() => setActiveDrawer('NAVIGATE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeDrawer === 'NAVIGATE'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4 text-blue-500" />
          <span>Navigate to Station</span>
        </button>

        {/* SOS / Request Towing Button */}
        <button
          onClick={() => setActiveDrawer('SOS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeDrawer === 'SOS' || activeRescue
              ? 'bg-red-600 text-white shadow-md shadow-red-500/20 animate-pulse'
              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{activeRescue ? 'Rescue Status' : 'SOS / Request Towing'}</span>
        </button>

        {/* Margdarshak Route Recommendation */}
        <button
          onClick={() => setIsMargdarshakOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Margdarshak AI</span>
        </button>

        {/* Vehicle Telemetry Drawer */}
        <button
          onClick={() => setActiveDrawer('TELEMETRY')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeDrawer === 'TELEMETRY'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="hidden sm:inline">Telemetry</span>
        </button>

        {/* Charging & Service History */}
        <button
          onClick={() => setActiveDrawer('HISTORY')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeDrawer === 'HISTORY'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>

      {/* 4. DRAWER: NAVIGATE TO CHARGING STATION */}
      {activeDrawer === 'NAVIGATE' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-xl bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900">Nearby Charging Stations</h3>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {nearbyStations.slice(0, 5).map((st) => (
              <div
                key={st.id}
                className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900">{st.code}</span>
                    <span className="font-bold text-slate-800">{st.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{st.district}</p>
                  
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-1">
                    <span className="text-blue-600 font-bold">{st.distanceKm} km away</span>
                    <span>Travel: ~{st.estTravelTimeMin} min</span>
                    <span className="text-emerald-600 font-bold">Est. SOC at arrival: {st.estArrivalSoc}%</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    st.availBays > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {st.availBays}/{st.totalBays} Bays Free
                  </span>
                  
                  <button
                    onClick={() => handleStartNavigation(st)}
                    className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all"
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

      {/* 5. DRAWER: SOS ROADSIDE RESCUE & TOWING */}
      {activeDrawer === 'SOS' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-black text-slate-900">Roadside Towing & Emergency Assistance</h3>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeRescue ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between font-mono font-bold mb-1">
                  <span className="text-amber-900">INCIDENT ID: {activeRescue.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px]">
                    {activeRescue.status}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  {activeRescue.assignedVehicleCode
                    ? `Tow Truck ${activeRescue.assignedVehicleCode} has been assigned and is heading to your position.`
                    : `Your rescue request is registered. You are at Queue Position #${activeRescue.queuePosition || 1} due to highway lane hazard priority.`}
                </p>
                <div className="mt-2 text-[10px] font-mono text-slate-600 flex justify-between">
                  <span>Priority: {activeRescue.priorityLevel} ({activeRescue.priorityScore}/100)</span>
                  <span>ETA: ~{activeRescue.estimatedArrivalMinutes || 8} mins</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleCancelRescue(activeRescue.id)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-[11px] leading-relaxed">
                🚨 <strong>Emergency Dispatch:</strong> Towing vans patrol SH-40 and Boisar MIDC. Confirm incident safety status below to dispatch immediately.
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laneBlocked}
                    onChange={(e) => setLaneBlocked(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">Vehicle is blocking an active travel lane (Immediate Hazard)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vulnerablePassengers}
                    onChange={(e) => setVulnerablePassengers(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">Vulnerable passengers on board (Elderly / Children)</span>
                </label>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={emergencyNote}
                  onChange={(e) => setEmergencyNote(e.target.value)}
                  placeholder="Optional notes or landmark..."
                  className="w-full px-3 py-1.5 border rounded-xl text-xs outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingSOS}
                  onClick={handleSubmitSOS}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20"
                >
                  {isSubmittingSOS ? 'Dispatching...' : 'Confirm SOS Dispatch'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. DRAWER: DETAILED TELEMETRY */}
      {activeDrawer === 'TELEMETRY' && activeVehicle && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 font-mono">
              {activeVehicle.code} · Telemetry & Battery Health
            </h3>
            <button onClick={() => setActiveDrawer(null)} className="p-1 rounded-lg text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono mb-3">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[9px] text-slate-400 block">BATTERY HEALTH</span>
              <span className="font-bold text-emerald-600">98.4% SOH</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[9px] text-slate-400 block">PACK TEMP</span>
              <span className="font-bold text-slate-900">31.2°C</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[9px] text-slate-400 block">TRAFFIC MODE</span>
              <span className="font-bold text-blue-600 truncate block">{activeVehicle.trafficState}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[9px] text-slate-400 block">DC CHARGES</span>
              <span className="font-bold text-slate-900">42 Lifetime</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl">
            Location: {activeVehicle.currentLocationName || 'Boisar–Palghar Highway (SH-40)'}
          </div>
        </div>
      )}

      {/* 7. DRAWER: CHARGING HISTORY */}
      {activeDrawer === 'HISTORY' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">Charging Session Receipts</h3>
            <button onClick={() => setActiveDrawer(null)} className="p-1 rounded-lg text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { hub: 'Boisar Central Hub [A102]', time: 'Today, 08:30 AM', kwh: '32.4 kWh', fee: '₹599.40' },
              { hub: 'Navapur Road Hub [B104]', time: 'Yesterday, 06:15 PM', kwh: '28.0 kWh', fee: '₹518.00' },
            ].map((s, idx) => (
              <div key={idx} className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 block">{s.hub}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{s.time}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-emerald-600 block">{s.kwh}</span>
                  <span className="text-[10px] text-slate-500">{s.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Margdarshak Route Recommendation Modal */}
      {isMargdarshakOpen && activeVehicle && (
        <MargdarshakModal
          isOpen={isMargdarshakOpen}
          onClose={() => setIsMargdarshakOpen(false)}
          vehicle={activeVehicle}
          stations={stations}
        />
      )}
    </div>
  );
}
