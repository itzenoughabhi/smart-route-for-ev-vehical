'use client';

import React from 'react';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';
import { EVOwnerDashboard } from './EVOwnerDashboard';
import { ManufacturerDashboard } from './ManufacturerDashboard';
import { StationOwnerDashboard } from './StationOwnerDashboard';
import { RescueOperatorDashboard } from './RescueOperatorDashboard';
import { 
  X, 
  Car, 
  Building2, 
  Fuel, 
  Truck, 
  ShieldCheck, 
  Maximize2, 
  Minimize2,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';

export function StakeholderModal() {
  const isStakeholderModalOpen = useDigitalTwinStore((s) => s.isStakeholderModalOpen);
  const activeStakeholderDashboard = useDigitalTwinStore((s) => s.activeStakeholderDashboard);
  const openStakeholderDashboard = useDigitalTwinStore((s) => s.openStakeholderDashboard);
  const closeStakeholderDashboard = useDigitalTwinStore((s) => s.closeStakeholderDashboard);
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const setUser = useDigitalTwinStore((s) => s.setUser);

  const [isFullScreen, setIsFullScreen] = React.useState(true);

  if (!isStakeholderModalOpen || !activeStakeholderDashboard) return null;

  const roles: Array<{ role: UserRole; label: string; icon: any; color: string; tag: string }> = [
    { role: 'EV_OWNER', label: 'EV Owner', icon: Car, color: 'text-blue-600 bg-blue-50', tag: '3D Drive' },
    { role: 'EV_MANUFACTURER', label: 'OEM Analytics', icon: Building2, color: 'text-indigo-600 bg-indigo-50', tag: 'Telemetry' },
    { role: 'STATION_OWNER', label: 'Station Operator', icon: Fuel, color: 'text-emerald-600 bg-emerald-50', tag: 'P&L' },
    { role: 'RESCUE_OPERATOR', label: 'Rescue & Tow', icon: Truck, color: 'text-amber-600 bg-amber-50', tag: 'Dispatch' },
  ];

  const handleRoleChange = async (role: UserRole) => {
    openStakeholderDashboard(role);
    try {
      const res = await fetch('http://localhost:4000/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }).catch(() => null);

      if (res && res.ok) {
        const session = await res.json();
        setUser(session.user);
      }
    } catch (e) {
      // Fallback local switch
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className={`bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
        isFullScreen ? 'w-full h-full' : 'w-[92vw] h-[86vh] max-w-6xl'
      }`}>
        {/* Stakeholder Header Switcher */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-tight text-slate-900 font-mono">
                  EVNEXUS PORTAL
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 text-slate-600">
                  Stakeholder Workspace
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Active User: {currentUser?.name} ({currentUser?.role})
              </p>
            </div>
          </div>

          {/* Role Navigation Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 gap-0.5">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = activeStakeholderDashboard === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => handleRoleChange(r.role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{r.label}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded hidden lg:inline ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-400'
                  }`}>
                    {r.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Collapse' : 'Expand'}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={closeStakeholderDashboard}
              title="Close to 3D Digital Twin"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Dashboard Body */}
        <div className="flex-1 overflow-hidden relative">
          {activeStakeholderDashboard === 'EV_OWNER' && <EVOwnerDashboard />}
          {activeStakeholderDashboard === 'EV_MANUFACTURER' && <ManufacturerDashboard />}
          {activeStakeholderDashboard === 'STATION_OWNER' && <StationOwnerDashboard />}
          {activeStakeholderDashboard === 'RESCUE_OPERATOR' && <RescueOperatorDashboard />}
        </div>
      </div>
    </div>
  );
}
