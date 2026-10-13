'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDigitalTwinStore } from '../store/useDigitalTwinStore';
import { socketService } from '../services/socket';
import { 
  Search, 
  Bell, 
  Sliders, 
  Zap, 
  Truck, 
  AlertTriangle, 
  Activity, 
  Wrench, 
  Play,
  Camera, 
  Compass, 
  Flame,
  Globe,
  Layers,
  Car
} from 'lucide-react';
import { CameraMode, MapMode } from '../types';

export function TopBar() {
  const kpis = useDigitalTwinStore((s) => s.kpis);
  const events = useDigitalTwinStore((s) => s.events);
  const toggleEvents = useDigitalTwinStore((s) => s.toggleEvents);
  const isEventsOpen = useDigitalTwinStore((s) => s.isEventsOpen);
  const toggleSimDrawer = useDigitalTwinStore((s) => s.toggleSimDrawer);
  const toggleScenarioDrawer = useDigitalTwinStore((s) => s.toggleScenarioDrawer);
  const isScenarioDrawerOpen = useDigitalTwinStore((s) => s.isScenarioDrawerOpen);
  const selectStation = useDigitalTwinStore((s) => s.selectStation);
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const vehicleCount = useDigitalTwinStore((s) => s.vehicles.length);
  const cameraMode = useDigitalTwinStore((s) => s.cameraMode);
  const setCameraMode = useDigitalTwinStore((s) => s.setCameraMode);
  const mapMode = useDigitalTwinStore((s) => s.mapMode);
  const setMapMode = useDigitalTwinStore((s) => s.setMapMode);
  const powerGrid = useDigitalTwinStore((s) => s.powerGrid);

  const [search, setSearch] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) return;

    const { stations, vehicles } = useDigitalTwinStore.getState();

    const matchedStation = stations.find(
      (s) => s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    );
    if (matchedStation) {
      selectStation(matchedStation.id);
      return;
    }

    const matchedVehicle = vehicles.find((v) => v.code.toLowerCase().includes(query));
    if (matchedVehicle) {
      selectVehicle(matchedVehicle.id);
    }
  };

  const isGridOverloaded = (powerGrid?.loadPercentage ?? 0) > 85;
  const unreadCount = events.filter((e) => e.severity === 'CRITICAL' || e.severity === 'WARNING').length;

  const cameraModes: { id: CameraMode; label: string }[] = [
    { id: 'CITY', label: 'CITY' },
    { id: 'STATION', label: 'STATION' },
    { id: 'VEHICLE', label: 'VEHICLE' },
    { id: 'GRID', label: 'GRID' },
    { id: 'SERVICE', label: 'SERVICE' },
  ];

  const mapModes: { id: MapMode; label: string; icon: any }[] = [
    { id: 'REAL_MAP', label: 'REAL MAP (OSM)', icon: Globe },
    { id: '3D_TWIN', label: '3D TWIN', icon: Layers },
    { id: 'VEHICLE_FOLLOW', label: 'VEHICLE FOLLOW', icon: Car },
    { id: 'CHARGING_NETWORK', label: 'CHARGERS', icon: Zap },
    { id: 'POWER_GRID', label: 'POWER GRID', icon: Activity },
    { id: 'SERVICE_NETWORK', label: 'SERVICE HUB', icon: Wrench },
  ];

  return (
    <div className="fixed top-0 left-56 right-0 z-20 px-6 pt-3 pb-2 select-none pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-72 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Boisar sites, EVs, chargers..."
              className="w-full bg-white/40 hover:bg-white/55 focus:bg-white/75 backdrop-blur-xl border border-white/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-500 outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-400/20 shadow-sm font-sans transition-all"
            />
          </form>

          <div className="flex items-center gap-2">
            <div className="bg-white/40 hover:bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl px-3 py-1 text-[11px] shadow-sm transition-all">
              <span className="text-slate-500 block text-[9px] font-mono font-medium">ACTIVE EVs</span>
              <span className="font-bold text-slate-900 font-mono">{vehicleCount}</span>
            </div>

            <div className="bg-white/40 hover:bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl px-3 py-1 text-[11px] shadow-sm transition-all">
              <span className="text-slate-500 block text-[9px] font-mono font-medium">CHARGING</span>
              <span className="font-bold text-emerald-600 font-mono">{kpis.vehiclesCharging}</span>
            </div>

            <div className="bg-white/40 hover:bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl px-3 py-1 text-[11px] shadow-sm transition-all">
              <span className="text-slate-500 block text-[9px] font-mono font-medium">WAITING</span>
              <span className="font-bold text-amber-600 font-mono">{kpis.waitingVehicles}</span>
            </div>

            <div className="bg-white/40 hover:bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl px-3 py-1 text-[11px] shadow-sm transition-all">
              <span className="text-slate-500 block text-[9px] font-mono font-medium">AVAILABLE BAYS</span>
              <span className="font-bold text-blue-600 font-mono">{kpis.availableChargers}</span>
            </div>

            <div className={`border rounded-xl px-3 py-1 text-[11px] shadow-sm backdrop-blur-xl transition-all ${
              isGridOverloaded
                ? 'bg-red-500/20 border-red-400/60 text-red-700 animate-pulse'
                : 'bg-white/40 hover:bg-white/55 border-white/60'
            }`}>
              <span className="text-slate-500 block text-[9px] font-mono font-medium">GRID LOAD</span>
              <span className={`font-bold font-mono ${isGridOverloaded ? 'text-red-600' : 'text-slate-800'}`}>
                {kpis.networkLoadMw.toFixed(1)} MW ({powerGrid?.loadPercentage ?? 68}%)
              </span>
            </div>

            <div className="bg-white/40 hover:bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl px-3 py-1 text-[11px] shadow-sm transition-all">
              <span className="text-slate-500 block text-[9px] font-mono font-medium">IN SERVICE</span>
              <span className="font-bold text-indigo-600 font-mono">{kpis.serviceVehicles}</span>
            </div>

            <div className="bg-white/40 hover:bg-white/55 backdrop-blur-xl border border-white/60 rounded-xl px-2.5 py-1 text-[11px] shadow-sm flex items-center gap-2 transition-all">
              <span className="text-amber-500">🌤️</span>
              <div>
                <span className="text-slate-500 block text-[9px] font-mono leading-none">BOISAR METEO</span>
                <span className="font-bold text-slate-700 font-mono text-[10px]">32°C · 68% RH · 11kV OK</span>
              </div>
            </div>

            {kpis.activeFaults > 0 && (
              <div className="bg-red-500/15 border border-red-400/50 backdrop-blur-xl rounded-xl px-2.5 py-1 text-[11px] flex items-center gap-1.5 shadow-sm animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-700 font-bold font-mono">{kpis.activeFaults} FAULTS</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              title="Role-Based Stakeholder Dashboards"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 pointer-events-auto"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Dashboards</span>
            </Link>

            <button
              onClick={() => toggleSimDrawer()}
              title="Simulation Controls"
              className="bg-white/40 hover:bg-white/65 backdrop-blur-xl border border-white/60 p-2 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => toggleEvents()}
              title="Network Events Log"
              className={`bg-white/40 hover:bg-white/65 backdrop-blur-xl border border-white/60 p-2 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm relative ${
                isEventsOpen ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-xl px-2 py-1 flex items-center gap-1 text-[11px] font-mono shadow-sm">
              <span className="text-slate-500 font-bold mr-1 text-[10px]">MAP MODE:</span>
              {mapModes.map((mm) => {
                const Icon = mm.icon;
                const isActive = mapMode === mm.id;
                return (
                  <button
                    key={mm.id}
                    onClick={() => setMapMode(mm.id)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                      isActive
                        ? mm.id === 'REAL_MAP'
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                          : 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{mm.label}</span>
                  </button>
                );
              })}
            </div>

            {mapMode !== 'REAL_MAP' && (
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-xl px-2 py-1 flex items-center gap-1 text-[11px] font-mono shadow-sm">
                <Camera className="w-3 h-3 text-slate-500" />
                <span className="text-slate-500 font-medium mr-1 text-[10px]">CAM:</span>
                {cameraModes.map((cm) => (
                  <button
                    key={cm.id}
                    onClick={() => setCameraMode(cm.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      cameraMode === cm.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {cm.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isGridOverloaded && (
            <div className="bg-red-500/15 border border-red-400/50 backdrop-blur-xl px-2.5 py-1 rounded-xl text-[10px] font-semibold text-red-700 flex items-center gap-1.5 shadow-sm animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>⚠ GRID OVERLOAD RISK (&gt;90%)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
