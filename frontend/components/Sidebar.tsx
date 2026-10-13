'use client';

import React from 'react';
import { useDigitalTwinStore } from '../store/useDigitalTwinStore';
import {
  LayoutDashboard,
  Zap,
  Car,
  Activity,
  Wrench,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

export function Sidebar() {
  const activeNav = useDigitalTwinStore((s) => s.activeNav);
  const setActiveNav = useDigitalTwinStore((s) => s.setActiveNav);
  const selectStation = useDigitalTwinStore((s) => s.selectStation);
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const selectGrid = useDigitalTwinStore((s) => s.selectGrid);
  const selectServiceCenter = useDigitalTwinStore((s) => s.selectServiceCenter);
  const recenterCamera = useDigitalTwinStore((s) => s.recenterCamera);
  const toggleScenarioDrawer = useDigitalTwinStore((s) => s.toggleScenarioDrawer);
  const isScenarioDrawerOpen = useDigitalTwinStore((s) => s.isScenarioDrawerOpen);

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'stations' as const, label: 'Charging Hubs', icon: Zap },
    { id: 'vehicles' as const, label: 'EV Fleet', icon: Car },
    { id: 'grid' as const, label: 'Power Grid', icon: Activity },
    { id: 'service' as const, label: 'EV Service Hub', icon: Wrench },
    { id: 'incidents' as const, label: 'Incidents Feed', icon: AlertCircle },
  ];

  const handleNavClick = (id: typeof activeNav) => {
    setActiveNav(id);
    const state = useDigitalTwinStore.getState();
    if (id === 'overview') {
      recenterCamera();
    } else if (id === 'stations' && state.stations.length > 0) {
      selectStation(state.stations[0].id);
    } else if (id === 'vehicles' && state.vehicles.length > 0) {
      selectVehicle(state.vehicles[0].id);
    } else if (id === 'grid') {
      selectGrid();
    } else if (id === 'service') {
      selectServiceCenter();
    }
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-56 z-30 bg-white/95 backdrop-blur-md border-r border-slate-200/90 shadow-sm flex flex-col justify-between py-5 px-3 select-none pointer-events-auto font-sans">
      <div>
        <div 
          className="px-2 mb-6 cursor-pointer" 
          onClick={() => handleNavClick('overview')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900 font-mono">
                EVNEXUS
              </h1>
              <p className="text-[9px] font-bold tracking-wider text-slate-400 font-mono uppercase">
                Boisar Digital Twin
              </p>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            Lat 19.7902° · Lon 72.7657°
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-white bg-blue-600 shadow-md shadow-blue-500/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="px-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Stakeholder Portals
          </span>
          <div className="space-y-1">
            <button
              onClick={() => useDigitalTwinStore.getState().openStakeholderDashboard('EV_OWNER')}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <span>🚗</span>
                <span>EV Owner</span>
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-bold">Portal</span>
            </button>

            <button
              onClick={() => useDigitalTwinStore.getState().openStakeholderDashboard('EV_MANUFACTURER')}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <span>🏭</span>
                <span>Manufacturer</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-600 font-bold">OEM</span>
            </button>

            <button
              onClick={() => useDigitalTwinStore.getState().openStakeholderDashboard('STATION_OWNER')}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <span>⛽</span>
                <span>Station Owner</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">P&L</span>
            </button>

            <button
              onClick={() => useDigitalTwinStore.getState().openStakeholderDashboard('RESCUE_OPERATOR')}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <span>🛻</span>
                <span>Rescue Operator</span>
              </span>
              <span className="text-[10px] font-mono text-amber-600 font-bold">Dispatch</span>
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => toggleScenarioDrawer()}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              isScenarioDrawerOpen
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Demo Scenario</span>
          </button>
        </div>
      </div>

      <div className="px-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700 font-mono text-[10px]">Boisar Grid 5MW</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">v3.0</span>
      </div>
    </aside>
  );
}
