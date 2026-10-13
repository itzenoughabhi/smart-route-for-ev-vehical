'use client';

import React, { useState, useEffect } from 'react';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';
import { socketService } from '../../services/socket';
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
  ChevronRight
} from 'lucide-react';
import { RescueRequest, RescueStatus } from '../../types';

export function RescueOperatorDashboard() {
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const vehicles = useDigitalTwinStore((s) => s.vehicles);
  const stations = useDigitalTwinStore((s) => s.stations);
  const rescueRequests = useDigitalTwinStore((s) => s.rescueRequests);
  const setRescueRequests = useDigitalTwinStore((s) => s.setRescueRequests);
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const closeDashboard = useDigitalTwinStore((s) => s.closeStakeholderDashboard);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [isTriggeringScenario, setIsTriggeringScenario] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/rescue/requests?role=RESCUE_OPERATOR').catch(() => null);
        if (res && res.ok) {
          const reqs = await res.json();
          setRescueRequests(reqs);
          if (reqs.length > 0 && !selectedIncidentId) {
            setSelectedIncidentId(reqs[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load rescue requests', err);
      }
    };

    fetchRequests();
  }, [setRescueRequests]);

  const activeIncidents = rescueRequests.filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status));
  const completedIncidents = rescueRequests.filter((r) => r.status === 'COMPLETED');
  const selectedIncident = rescueRequests.find((r) => r.id === selectedIncidentId) || activeIncidents[0] || rescueRequests[0];

  // Fleet towing vehicles from digital twin
  const towFleet = vehicles.filter(
    (v) => v.model === 'Highway Patrol EV' || v.model === 'Heavy Electric Hauler' || v.code.includes('PATROL')
  );

  const handleTriggerScenario = async () => {
    setIsTriggeringScenario(true);
    try {
      socketService.simulateTwoStranded();
      // Also trigger via REST for certainty
      await fetch('http://localhost:4000/api/rescue/simulate-two-stranded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);

      // Re-fetch after 500ms
      setTimeout(async () => {
        const res = await fetch('http://localhost:4000/api/rescue/requests?role=RESCUE_OPERATOR').catch(() => null);
        if (res && res.ok) {
          const reqs = await res.json();
          setRescueRequests(reqs);
          if (reqs.length > 0) setSelectedIncidentId(reqs[0].id);
        }
      }, 500);
    } finally {
      setIsTriggeringScenario(false);
    }
  };

  const handleCompleteRescue = async (reqId: string) => {
    socketService.completeRescue(reqId);
    await fetch('http://localhost:4000/api/rescue/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: reqId }),
    }).catch(() => null);

    // Refresh state
    setTimeout(async () => {
      const res = await fetch('http://localhost:4000/api/rescue/requests?role=RESCUE_OPERATOR').catch(() => null);
      if (res && res.ok) {
        setRescueRequests(await res.json());
      }
    }, 400);
  };

  const handleUpdateStatus = async (reqId: string, status: RescueStatus) => {
    await fetch('http://localhost:4000/api/rescue/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: reqId, status }),
    }).catch(() => null);

    // Refresh
    const res = await fetch('http://localhost:4000/api/rescue/requests?role=RESCUE_OPERATOR').catch(() => null);
    if (res && res.ok) {
      setRescueRequests(await res.json());
    }
  };

  const handleViewOnMap = (vehicleId: string) => {
    selectVehicle(vehicleId);
    closeDashboard();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-y-auto p-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider font-mono">
              Emergency Tow & Rescue Command
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs font-semibold text-slate-600 font-mono">Palghar District Highway Command</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            {currentUser?.organization || 'Palghar Highway Rescue & Rapid Towing Command'}
          </h2>
          <p className="text-xs text-slate-500">
            Multi-Incident Queue, Hazard Assessment & Concurrency-Safe Tow Dispatch
          </p>
        </div>

        {/* Critical Scenario Test Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerScenario}
            disabled={isTriggeringScenario}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate: 2 Stranded EVs vs 1 Tow Van</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">ACTIVE INCIDENTS</span>
          <span className="text-xl font-black text-amber-600 font-mono">{activeIncidents.length}</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            {activeIncidents.filter((i) => i.priorityLevel === 'CRITICAL').length} Critical Lane Blockages
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">AVAILABLE TOW VANS</span>
          <span className="text-xl font-black text-emerald-600 font-mono">
            {towFleet.filter((v) => v.trafficState !== 'TOWING').length} / {towFleet.length || 1} Ready
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Patrol Unit: EV-PATROL-03</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">AVG RESCUE TIME</span>
          <span className="text-xl font-black text-blue-600 font-mono">11.4 Min</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Boisar Corridor Baseline</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 block">COMPLETED MISSIONS</span>
          <span className="text-xl font-black text-slate-900 font-mono">{completedIncidents.length}</span>
          <span className="text-[11px] text-emerald-600 font-bold font-mono mt-1 block">100% Resolved Safe</span>
        </div>
      </div>

      {/* Main Incident Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Incidents Queue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900">Incident Queue & Priority Order</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {activeIncidents.length} Pending
            </span>
          </div>

          {activeIncidents.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-700">All Corridors Clear</p>
              <p className="text-[11px] mt-1">No active stranded EV incidents reported. Click "Simulate: 2 Stranded EVs" above to test the multi-incident dispatch workflow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeIncidents.map((inc) => {
                const isSelected = inc.id === selectedIncident?.id;
                const isAssigned = inc.status === 'ASSIGNED' || inc.status === 'PROVIDER_EN_ROUTE';
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-400'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono ${
                          inc.priorityLevel === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inc.priorityLevel} ({inc.priorityScore}/100)
                        </span>
                        <span className="font-mono font-black text-slate-900">{inc.vehicleCode}</span>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isAssigned
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isAssigned ? 'TOW DISPATCHED' : `QUEUE #${inc.queuePosition || 1}`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium mb-1.5 line-clamp-1">
                      {inc.locationName}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                      <span>{inc.laneBlocked ? '🚨 Fast Lane Blocked' : '✅ Roadside Shoulder'}</span>
                      <span>ETA: ~{inc.estimatedArrivalMinutes || 8}m</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center & Right: Incident Details, State Machine & Dispatch Control */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              {/* Incident Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-black text-slate-900 text-base">{selectedIncident.vehicleCode}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-semibold">{selectedIncident.vehicleModel}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-blue-600 font-bold">{selectedIncident.ownerName}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Incident ID: {selectedIncident.id} · Logged at {new Date(selectedIncident.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <button
                  onClick={() => handleViewOnMap(selectedIncident.vehicleId)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono flex items-center gap-1.5 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Locate Incident</span>
                </button>
              </div>

              {/* State Machine Visualizer */}
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Rescue Lifecycle State Machine
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                  {[
                    { key: 'REQUESTED', label: '1. REQUESTED' },
                    { key: 'PRIORITY_ASSESSED', label: '2. ASSESSED' },
                    { key: 'ASSIGNED', label: '3. ASSIGNED' },
                    { key: 'COMPLETED', label: '4. COMPLETED' },
                  ].map((step, idx) => {
                    const isCurrent = selectedIncident.status === step.key;
                    const isPassed = ['ASSIGNED', 'COMPLETED'].includes(selectedIncident.status) && idx <= 2;
                    return (
                      <div
                        key={step.key}
                        className={`p-2 rounded-xl text-center font-bold border transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : isPassed
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority & Hazard Assessment Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">PRIORITY SCORE</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedIncident.priorityScore} / 100 ({selectedIncident.priorityLevel})
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">LANE OBSTRUCTION</span>
                  <span className={`font-bold text-xs ${selectedIncident.laneBlocked ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedIncident.laneBlocked ? 'YES (Active Lane)' : 'NO (On Shoulder)'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">VULNERABILITY</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {selectedIncident.vulnerablePassengers ? 'Elderly / Minors' : 'Standard'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">ASSIGNED TOW VAN</span>
                  <span className="font-bold text-blue-600 text-xs">
                    {selectedIncident.assignedVehicleCode || (
                      selectedIncident.queuePosition ? `Waiting (Queue #${selectedIncident.queuePosition})` : 'Unassigned'
                    )}
                  </span>
                </div>
              </div>

              {/* Safety assessment audit factors */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Assessed Safety Justification:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                  {selectedIncident.priorityFactors.map((fac, i) => (
                    <li key={i}>{fac}</li>
                  ))}
                </ul>
              </div>

              {/* Operator Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
                <div className="text-xs text-slate-500 font-mono">
                  {selectedIncident.assignedVehicleCode ? (
                    <span className="text-blue-700 font-bold flex items-center gap-1.5">
                      <Truck className="w-4 h-4" /> Tow Truck {selectedIncident.assignedVehicleCode} actively towing to {selectedIncident.targetStationName || 'Nearest Hub'}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">
                      Pending Tow Van Release (Queue Position #{selectedIncident.queuePosition || 1})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedIncident.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => handleCompleteRescue(selectedIncident.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Rescue & Free Tow Van</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs font-mono">
                      Rescue Resolved & Archived
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-xs text-slate-400">
              Select an incident from the queue to view real-time telemetry and dispatch details.
            </div>
          )}

          {/* Rescue Provider Fleet Status Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900">Registered Highway Rescue Fleet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {towFleet.map((v) => {
                const isBusy = v.trafficState === 'TOWING' || v.trafficState === 'SERVICE_ROUTE';
                return (
                  <div key={v.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900 block">{v.code}</span>
                      <span className="text-[11px] text-slate-500">{v.model}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isBusy
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isBusy ? 'ACTIVE MISSION' : 'PATROLLING READY'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
