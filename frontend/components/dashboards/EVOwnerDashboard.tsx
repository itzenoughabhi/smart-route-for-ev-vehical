'use client';

import React, { useState } from 'react';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';
import { socketService } from '../../services/socket';
import { MargdarshakModal } from '../MargdarshakModal';
import { 
  Car, 
  Zap, 
  BatteryCharging, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  PhoneCall,
  History,
  Info
} from 'lucide-react';
import { Vehicle } from '../../types';

export function EVOwnerDashboard() {
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const vehicles = useDigitalTwinStore((s) => s.vehicles);
  const stations = useDigitalTwinStore((s) => s.stations);
  const rescueRequests = useDigitalTwinStore((s) => s.rescueRequests);
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const selectStation = useDigitalTwinStore((s) => s.selectStation);
  const closeDashboard = useDigitalTwinStore((s) => s.closeStakeholderDashboard);

  // Filter owner vehicles (Rahul Sharma owns EV-024 & EV-057)
  const ownerVehicles = vehicles.filter(
    (v) => (currentUser?.assignedVehicleIds || ['veh-ev-024', 'veh-ev-057']).includes(v.id) ||
           (currentUser?.assignedVehicleIds || ['veh-ev-024', 'veh-ev-057']).includes(v.code)
  );
  const activeFleet = ownerVehicles.length > 0 ? ownerVehicles : vehicles.slice(0, 2);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(activeFleet[0]?.id || '');
  const currentVehicle = activeFleet.find((v) => v.id === selectedVehicleId) || activeFleet[0];

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isMargdarshakOpen, setIsMargdarshakOpen] = useState(false);
  const [laneBlocked, setLaneBlocked] = useState(true);
  const [shoulderAvailable, setShoulderAvailable] = useState(false);
  const [passengerCount, setPassengerCount] = useState(2);
  const [vulnerablePassengers, setVulnerablePassengers] = useState(true);
  const [emergencyNote, setEmergencyNote] = useState('');
  const [isSubmittingRescue, setIsSubmittingRescue] = useState(false);

  // Active rescue request for current vehicle
  const activeRescue = rescueRequests.find(
    (r) => (r.vehicleId === currentVehicle?.id || r.vehicleCode === currentVehicle?.code) &&
           !['COMPLETED', 'CANCELLED'].includes(r.status)
  );

  const handleTrackVehicle = (v: Vehicle) => {
    selectVehicle(v.id);
    closeDashboard();
  };

  const handleSubmitRescue = async () => {
    if (!currentVehicle) return;
    setIsSubmittingRescue(true);
    try {
      socketService.createRescueRequest({
        vehicleId: currentVehicle.id,
        ownerId: currentUser?.id,
        ownerName: currentUser?.name || 'Rahul Sharma',
        laneBlocked,
        shoulderAvailable,
        passengerCount,
        vulnerablePassengers,
        note: emergencyNote || `Emergency tow assistance requested by ${currentUser?.name || 'EV Owner'}`,
      });
      setIsEmergencyModalOpen(false);
    } finally {
      setIsSubmittingRescue(false);
    }
  };

  // Nearby stations sorted by distance
  const nearbyStations = stations.map((st) => {
    const dist = currentVehicle 
      ? Math.hypot(st.position.x - currentVehicle.position.x, st.position.z - currentVehicle.position.z) * 0.12
      : 3.5;
    const availBays = st.chargers.filter((c) => c.status === 'AVAILABLE').length;
    return {
      ...st,
      distanceKm: Number(dist.toFixed(1)),
      availBays,
      totalBays: st.chargers.length,
      estimatedWaitMin: (st.queue?.length || 0) * 12,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-y-auto p-6 font-sans">
      {/* Header Profile Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider font-mono">
              EV Owner Portal
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs font-semibold text-slate-600 font-mono">Boisar Smart Telemetry</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Welcome back, {currentUser?.name || 'Rahul Sharma'}
          </h2>
          <p className="text-xs text-slate-500">
            {currentUser?.organization || 'Registered EV Owner'} · {activeFleet.length} Vehicle(s) Connected
          </p>
        </div>

        {/* Stranded Emergency Action */}
        <div className="flex items-center gap-2">
          {activeRescue ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <div className="text-xs font-bold font-mono">
                RESCUE ACTIVE: {activeRescue.status}
                {activeRescue.queuePosition && activeRescue.queuePosition > 0 
                  ? ` (Queue #${activeRescue.queuePosition})` 
                  : ' (Tow Dispatched)'}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SOS Roadside Rescue</span>
            </button>
          )}

          <button
            onClick={() => setIsMargdarshakOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Margdarshak EV Routing</span>
          </button>
        </div>
      </div>

      {/* Vehicle Selector Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {activeFleet.map((v) => {
          const isSelected = v.id === currentVehicle?.id;
          const isLow = v.currentBatteryPct < 25;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all min-w-[240px] ${
                isSelected
                  ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                isLow ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <Car className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-slate-900">{v.code}</span>
                  <span className={`text-[11px] font-mono font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                    {v.currentBatteryPct.toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate font-medium">{v.model}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Range: ~{v.estimatedRangeKm || Math.round((v.currentBatteryPct / 100) * 380)} km
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Telemetry & Battery Health */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Telemetry Card */}
          {currentVehicle && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{currentVehicle.code} · Live Telemetry</h3>
                    <p className="text-[11px] text-slate-500">{currentVehicle.model}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTrackVehicle(currentVehicle)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>View on 3D Map</span>
                  </button>
                </div>
              </div>

              {/* Battery SOC Visual Meter */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-600" />
                    State of Charge (SOC)
                  </span>
                  <span className={`text-sm ${
                    currentVehicle.currentBatteryPct < 20 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {currentVehicle.currentBatteryPct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentVehicle.currentBatteryPct < 20
                        ? 'bg-red-500 animate-pulse'
                        : currentVehicle.currentBatteryPct < 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(4, currentVehicle.currentBatteryPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
                  <span>Remaining Range: ~{currentVehicle.estimatedRangeKm || Math.round((currentVehicle.currentBatteryPct / 100) * 380)} km</span>
                  <span>Battery Capacity: {currentVehicle.batteryCapacityKwh || 40.5} kWh LFP</span>
                </div>
              </div>

              {/* Status Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">CURRENT SPEED</span>
                  <span className="font-bold text-slate-900 text-sm">{currentVehicle.speed.toFixed(0)} km/h</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">OPERATING STATUS</span>
                  <span className="font-bold text-blue-600 text-xs truncate block">{currentVehicle.status}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">TRAFFIC BEHAVIOR</span>
                  <span className="font-bold text-indigo-600 text-xs truncate block">{currentVehicle.trafficState}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">HEALTH MONITOR</span>
                  <span className="font-bold text-emerald-600 text-xs">NOMINAL (98.4%)</span>
                </div>
              </div>

              {/* Current Road Location */}
              <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-blue-900 block">Current Geographic Position:</span>
                  <span className="text-blue-800 font-mono text-[11px]">
                    {currentVehicle.currentLocationName || 'Boisar–Palghar Regional Arterial Road (SH-40)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active Rescue Status Tracker (if requested) */}
          {activeRescue && (
            <div className="bg-white rounded-2xl p-5 border-2 border-amber-400 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-black text-slate-900 font-mono">
                    ROADSIDE RESCUE INCIDENT · {activeRescue.id}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 font-mono">
                  {activeRescue.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs font-mono">
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                  <span className="text-slate-500 block text-[10px]">ASSIGNED TOW TRUCK</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {activeRescue.assignedVehicleCode || 'Pending Dispatch'}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                  <span className="text-slate-500 block text-[10px]">ESTIMATED ARRIVAL (ETA)</span>
                  <span className="font-bold text-amber-700 text-xs">
                    ~{activeRescue.estimatedArrivalMinutes || 8} Minutes
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                  <span className="text-slate-500 block text-[10px]">QUEUE PRIORITY</span>
                  <span className="font-bold text-blue-700 text-xs">
                    {activeRescue.priorityLevel} ({activeRescue.priorityScore}/100)
                  </span>
                </div>
              </div>

              {activeRescue.queuePosition && activeRescue.queuePosition > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Your tow truck is currently responding to a higher danger incident (active lane blockage). You are at <strong>Queue Position #{activeRescue.queuePosition}</strong> and will be served immediately upon completion.
                  </span>
                </div>
              )}

              {/* Priority factors */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">Assessed Safety Factors:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {activeRescue.priorityFactors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Charging Session & Assistance History */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-black text-slate-900">Recent Charging & Service History</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Last 30 Days</span>
            </div>

            <div className="space-y-2.5">
              {[
                { station: 'Boisar Central Hub [A102]', date: 'Today, 08:30 AM', energy: '32.4 kWh', cost: '₹599.40', type: 'DC Fast 150kW' },
                { station: 'Navapur Road Hub [B104]', date: 'Yesterday, 06:15 PM', energy: '28.0 kWh', cost: '₹518.00', type: 'DC Fast 150kW' },
                { station: 'MIDC Industrial Hub [C201]', date: '11 Oct 2026, 02:40 PM', energy: '41.2 kWh', cost: '₹762.20', type: 'DC Fast 350kW' },
              ].map((sess, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{sess.station}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{sess.date} · {sess.type}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-600 block">{sess.energy}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{sess.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Nearby Stations & Margdarshak Recommendations */}
        <div className="space-y-6">
          {/* Nearby Charging Stations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Nearby Charging Hubs</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Real-Time Bays</span>
            </div>

            <div className="space-y-3">
              {nearbyStations.slice(0, 4).map((st) => (
                <div
                  key={st.id}
                  onClick={() => selectStation(st.id)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-900 font-mono">{st.code} · {st.name}</span>
                    <span className="text-[11px] font-mono font-bold text-blue-600">{st.distanceKm} km</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mb-2">{st.district}</p>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${
                      st.availBays > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {st.availBays}/{st.totalBays} Bays Available
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Wait: ~{st.estimatedWaitMin}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Support & Emergency Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black tracking-wide font-mono uppercase text-emerald-400">
                24/7 Boisar Highway Assistance
              </h4>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Stranded on SH-40 or MIDC? Rapid towing vans patrol every 15 minutes. Dispatch with 1-click above or call emergency dispatch.
            </p>
            <div className="p-3 rounded-xl bg-white/10 font-mono text-xs flex items-center justify-between">
              <span className="text-slate-300">Emergency Hotline</span>
              <span className="font-bold text-white tracking-wider">112 / +91 2525 240108</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Rescue Request Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Request Emergency Roadside Towing</h3>
                <p className="text-xs text-slate-500">
                  {currentVehicle?.code} ({currentVehicle?.model}) · 0% Battery / Mechanical Halt
                </p>
              </div>
            </div>

            <div className="space-y-4 my-4 text-xs">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] leading-relaxed">
                🚨 <strong>Safety First:</strong> Turn on hazard warning lights immediately. If safe, exit vehicle and stand behind guardrails away from high-speed traffic.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Safety & Road Clearance</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={laneBlocked}
                      onChange={(e) => setLaneBlocked(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span className="text-slate-700">Vehicle is stopping/blocking an active traffic lane (High Hazard)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shoulderAvailable}
                      onChange={(e) => setShoulderAvailable(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-700">Vehicle has pulled onto safe paved shoulder</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Passengers on Board</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Total Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(Number(e.target.value))}
                      className="w-16 px-2 py-1 border rounded-lg text-center font-mono font-bold"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vulnerablePassengers}
                      onChange={(e) => setVulnerablePassengers(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-700">Vulnerable passengers (Elderly/Children)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Incident Notes / Landmark</label>
                <textarea
                  rows={2}
                  value={emergencyNote}
                  onChange={(e) => setEmergencyNote(e.target.value)}
                  placeholder="e.g. Near Saravali bridge intersection, heading towards Palghar..."
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-red-500 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingRescue}
                onClick={handleSubmitRescue}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20"
              >
                {isSubmittingRescue ? 'Submitting...' : 'Confirm Emergency Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Margdarshak Modal Integration */}
      {isMargdarshakOpen && currentVehicle && (
        <MargdarshakModal
          isOpen={isMargdarshakOpen}
          onClose={() => setIsMargdarshakOpen(false)}
          vehicle={currentVehicle}
          stations={stations}
        />
      )}
    </div>
  );
}
