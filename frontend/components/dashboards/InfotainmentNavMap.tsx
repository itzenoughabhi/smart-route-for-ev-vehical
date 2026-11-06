'use client';

import React, { useState, useMemo } from 'react';
import { 
  Navigation, 
  MapPin, 
  Star, 
  Clock, 
  Zap, 
  Plus, 
  Minus, 
  Crosshair, 
  CornerUpLeft, 
  CornerUpRight, 
  ArrowUp,
  Sparkles,
  Compass
} from 'lucide-react';
import { Vehicle, Station } from '../../types';

interface InfotainmentNavMapProps {
  vehicle: Vehicle;
  destinationStation?: Station | null;
  stations: Station[];
  speedKmh: number;
  batteryPct: number;
  onReroute: (stationCode: string) => void;
  onOpenMargdarshak: () => void;
}

export function InfotainmentNavMap({
  vehicle,
  destinationStation,
  stations,
  speedKmh,
  batteryPct,
  onReroute,
  onOpenMargdarshak,
}: InfotainmentNavMapProps) {
  const [zoom, setZoom] = useState(1.15);
  const [isFavorited, setIsFavorited] = useState(true);
  const [isNavActive, setIsNavActive] = useState(true);

  // Convert 3D world coordinates [-195..230, -245..235] to 2D SVG canvas [0..800, 0..520]
  const worldToSvg = (wx: number, wz: number) => {
    const minX = -195;
    const maxX = 230;
    const minZ = -245;
    const maxZ = 235;

    const normX = Math.max(0, Math.min(1, (wx - minX) / (maxX - minX)));
    const normZ = Math.max(0, Math.min(1, (wz - minZ) / (maxZ - minZ)));

    const svgX = normX * 800;
    const svgY = normZ * 520;
    return { x: Math.round(svgX * 10) / 10, y: Math.round(svgY * 10) / 10 };
  };

  const vehWorldX = vehicle?.position?.x ?? 20;
  const vehWorldZ = vehicle?.position?.z ?? 30;
  const vehHeading = vehicle?.heading ?? 0;
  const vehSvg = worldToSvg(vehWorldX, vehWorldZ);

  // Vehicle heading rotation angle in degrees for SVG pointer
  const vehHeadingDeg = (vehHeading * 180) / Math.PI;

  // Real route waypoints path matching live vehicle pathing
  const remainingWps = useMemo(() => {
    const wps = vehicle?.routeWaypoints || [];
    const idx = vehicle?.currentWaypointIndex || 0;
    return wps.slice(idx);
  }, [vehicle?.routeWaypoints, vehicle?.currentWaypointIndex]);

  // Compute SVG route path from vehicle position along remaining waypoints
  const routePathD = useMemo(() => {
    if (remainingWps.length > 0) {
      let d = `M ${vehSvg.x} ${vehSvg.y}`;
      for (let i = 0; i < remainingWps.length; i++) {
        const pt = worldToSvg(remainingWps[i].x, remainingWps[i].z);
        d += ` L ${pt.x} ${pt.y}`;
      }
      return d;
    }

    // Default lead path ahead of vehicle along heading
    const fwdX = vehWorldX + Math.sin(vehHeading) * 30;
    const fwdZ = vehWorldZ + Math.cos(vehHeading) * 30;
    const fwdSvg = worldToSvg(fwdX, fwdZ);
    return `M ${vehSvg.x} ${vehSvg.y} L ${fwdSvg.x} ${fwdSvg.y}`;
  }, [remainingWps, vehSvg.x, vehSvg.y, vehWorldX, vehWorldZ, vehHeading]);

  // Dynamic Turn Guidance Calculation
  const { turnDirection, turnDistKm, remainingKm, etaMinutes, instructionText } = useMemo(() => {
    const nextTargetWp = remainingWps[1] || remainingWps[0];
    let turnDir: 'LEFT' | 'RIGHT' | 'STRAIGHT' = 'STRAIGHT';
    let nextTurnDistM = 2000;

    if (nextTargetWp) {
      const dx = nextTargetWp.x - vehWorldX;
      const dz = nextTargetWp.z - vehWorldZ;
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - vehHeading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      if (diff > 0.3) turnDir = 'RIGHT';
      else if (diff < -0.3) turnDir = 'LEFT';
      else turnDir = 'STRAIGHT';

      nextTurnDistM = Math.hypot(dx, dz) * 25;
    }

    let totalRemainingM = 0;
    for (let i = 0; i < remainingWps.length - 1; i++) {
      const p1 = remainingWps[i];
      const p2 = remainingWps[i + 1];
      totalRemainingM += Math.hypot(p2.x - p1.x, p2.z - p1.z) * 25;
    }

    const remKm = Math.max(0.4, Number((totalRemainingM / 1000).toFixed(1)));
    const tDistKm = Math.max(0.2, Number((nextTurnDistM / 1000).toFixed(1)));
    const effectiveSpeed = Math.max(25, speedKmh || 40);
    const etaMin = Math.max(1, Math.round((remKm / effectiveSpeed) * 60));

    const targetName = destinationStation
      ? destinationStation.name
      : vehicle?.currentLocationName
      ? vehicle.currentLocationName.replace(/^Patrolling\s+/i, '').replace(/^Approaching\s+/i, '')
      : 'Highway Corridor';

    let text = `Continue Straight for ${tDistKm} km on ${targetName}`;
    if (turnDir === 'LEFT') {
      text = `Take Left in ${tDistKm} km towards ${targetName}`;
    } else if (turnDir === 'RIGHT') {
      text = `Turn Right in ${tDistKm} km into ${targetName}`;
    }

    return {
      turnDirection: turnDir,
      turnDistKm: tDistKm,
      remainingKm: remKm,
      etaMinutes: etaMin,
      instructionText: text,
    };
  }, [remainingWps, vehWorldX, vehWorldZ, vehHeading, speedKmh, destinationStation, vehicle?.currentLocationName]);

  // Dynamic ViewBox for smooth auto-follow centering
  const viewBoxStr = useMemo(() => {
    const baseWidth = 800;
    const baseHeight = 520;
    const viewWidth = baseWidth / zoom;
    const viewHeight = baseHeight / zoom;

    const minX = Math.max(-20, Math.min(820 - viewWidth, vehSvg.x - viewWidth / 2));
    const minY = Math.max(-20, Math.min(540 - viewHeight, vehSvg.y - viewHeight / 2));
    return `${minX} ${minY} ${viewWidth} ${viewHeight}`;
  }, [zoom, vehSvg.x, vehSvg.y]);

  // Major Regional Road Corridors in SVG coordinates
  const roadNetworkPaths = useMemo(() => {
    const toPath = (coords: Array<[number, number]>) => {
      return coords
        .map(([x, z], i) => {
          const pt = worldToSvg(x, z);
          return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
        })
        .join(' ');
    };

    return {
      // SH-40 Boisar-Palghar Highway
      sh40: toPath([
        [14, 30], [23, 52], [32, 75], [36, 115], [40, 155], [45, 185], [50, 215]
      ]),
      // Manor NH-48 Express Highway
      manor: toPath([
        [12, -18], [60, -20], [115, -22], [165, -24], [205, -25]
      ]),
      // Palghar-Manor Regional Connector
      palgharManor: toPath([
        [50, 215], [105, 150], [160, 70], [205, -25]
      ]),
      // Shirgaon Beach Coast Road
      shirgaon: toPath([
        [40, 155], [20, 165], [0, 175], [-50, 195], [-95, 215], [-65, 215], [-25, 215], [15, 215], [50, 215]
      ]),
      // Tarapur Coastal Highway
      tarapur: toPath([
        [0, 0], [-30, -5], [-60, -10], [-95, -10], [-135, -35], [-155, -50], [-170, -65]
      ]),
      // MIDC Industrial Loop
      midc: toPath([
        [-30, -5], [-50, 35], [-70, 80], [-55, 105], [-30, 125], [-10, 80], [14, 30]
      ]),
      // Dahanu Northern Arterial Highway
      dahanu: toPath([
        [4, -40], [32, -60], [34, -115], [35, -175], [35, -230]
      ]),
      // Betegaon Residential Township
      betegaon: toPath([
        [14, 30], [45, 25], [80, 15], [55, -5], [35, -12], [12, -18], [0, 0]
      ]),
      // Boisar Town & Substation Grid
      boisarTown: toPath([
        [0, 0], [12, -18], [4, -40], [32, -60], [10, -70], [-10, -80], [-50, -90], [-55, -50], [-60, -10]
      ]),
    };
  }, []);

  return (
    <div className="flex-1 grid grid-cols-12 gap-2.5 items-stretch h-full min-h-[200px]">
      
      {/* ========================================================
          LEFT / CENTER PANE: FULL-FEATURED GPS VECTOR MAP (Col 1-8)
         ======================================================== */}
      <div className="col-span-12 lg:col-span-8 relative rounded-2xl bg-[#060b14] border border-[#1b2a45] overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* SVG Interactive Dynamic Navigation Map */}
        <div className="absolute inset-0 z-0">
          <svg
            viewBox={viewBoxStr}
            className="w-full h-full transition-all duration-300 ease-out"
          >
            <defs>
              {/* Route Glow Filter */}
              <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Vehicle Halo Glow */}
              <radialGradient id="vehGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>

              {/* Arabian Sea Coastal Gradient */}
              <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#031e33" />
                <stop offset="70%" stopColor="#082f49" />
                <stop offset="100%" stopColor="#0e3d5f" stopOpacity="0" />
              </linearGradient>

              {/* Surya River Gradient */}
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#075985" />
                <stop offset="50%" stopColor="#0c4a6e" />
                <stop offset="100%" stopColor="#032b43" />
              </linearGradient>

              {/* Regional Grid Pattern */}
              <pattern id="regionalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#060d19" />
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e1a2d" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect x="-100" y="-100" width="1000" height="720" fill="url(#regionalGrid)" />

            {/* Arabian Sea Coastal Water on the West Coast */}
            <rect x="0" y="0" width="110" height="520" fill="url(#seaGrad)" opacity="0.6" />
            <text x="24" y="260" fill="#0284c7" opacity="0.4" fontSize="12" fontWeight="bold" transform="rotate(-90 24 260)" letterSpacing="4">
              ARABIAN SEA COASTLINE
            </text>

            {/* Winding Surya River on East Side */}
            <path
              d="M 680 0 C 660 120, 720 220, 690 320 S 740 440, 710 520 L 750 520 C 780 440, 730 320, 760 220 S 700 120, 720 0 Z"
              fill="url(#riverGrad)"
              opacity="0.5"
            />
            <text x="735" y="160" fill="#38bdf8" opacity="0.35" fontSize="10" fontWeight="bold" transform="rotate(75 735 160)" letterSpacing="2">
              SURYA RIVER
            </text>

            {/* Stylized District Urban Zones */}
            <g fill="#0a1526" stroke="#162740" strokeWidth="1" opacity="0.8">
              {/* Boisar Central & Railway Zone */}
              <rect x="360" y="210" width="80" height="60" rx="8" />
              <text x="372" y="244" fill="#334155" fontSize="9" fontWeight="bold">BOISAR TOWN</text>

              {/* Palghar Urban Hub Zone */}
              <rect x="440" y="460" width="90" height="50" rx="8" />
              <text x="452" y="490" fill="#334155" fontSize="9" fontWeight="bold">PALGHAR CITY</text>

              {/* Tarapur MIDC Industrial Estate */}
              <rect x="200" y="320" width="100" height="60" rx="8" />
              <text x="214" y="355" fill="#334155" fontSize="9" fontWeight="bold">TARAPUR MIDC</text>

              {/* Shirgaon Coastal Enclave */}
              <rect x="130" y="460" width="90" height="50" rx="8" />
              <text x="142" y="490" fill="#334155" fontSize="9" fontWeight="bold">SHIRGAON FORT</text>

              {/* Manor Expressway Gateway */}
              <rect x="680" y="210" width="90" height="55" rx="8" />
              <text x="696" y="242" fill="#334155" fontSize="9" fontWeight="bold">MANOR NH-48</text>

              {/* Dahanu North Agro Zone */}
              <rect x="410" y="15" width="85" height="50" rx="8" />
              <text x="424" y="45" fill="#334155" fontSize="9" fontWeight="bold">DAHANU GATE</text>
            </g>

            {/* Regional Road Network - Base Layer */}
            <g fill="none" stroke="#13233a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
              <path d={roadNetworkPaths.sh40} />
              <path d={roadNetworkPaths.manor} />
              <path d={roadNetworkPaths.palgharManor} />
              <path d={roadNetworkPaths.shirgaon} />
              <path d={roadNetworkPaths.tarapur} />
              <path d={roadNetworkPaths.midc} />
              <path d={roadNetworkPaths.dahanu} />
              <path d={roadNetworkPaths.betegaon} />
              <path d={roadNetworkPaths.boisarTown} />
            </g>

            {/* Regional Road Network - Surface Asphalt Layer */}
            <g fill="none" stroke="#1e3454" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
              <path d={roadNetworkPaths.sh40} />
              <path d={roadNetworkPaths.manor} />
              <path d={roadNetworkPaths.palgharManor} />
              <path d={roadNetworkPaths.shirgaon} />
              <path d={roadNetworkPaths.tarapur} />
              <path d={roadNetworkPaths.midc} />
              <path d={roadNetworkPaths.dahanu} />
              <path d={roadNetworkPaths.betegaon} />
              <path d={roadNetworkPaths.boisarTown} />
            </g>

            {/* Road Centerline Dashes */}
            <g fill="none" stroke="#334e68" strokeWidth="1" strokeDasharray="6 6" strokeLinecap="round">
              <path d={roadNetworkPaths.sh40} />
              <path d={roadNetworkPaths.manor} />
              <path d={roadNetworkPaths.palgharManor} />
              <path d={roadNetworkPaths.shirgaon} />
              <path d={roadNetworkPaths.tarapur} />
              <path d={roadNetworkPaths.midc} />
              <path d={roadNetworkPaths.dahanu} />
            </g>

            {/* ========================================================
                ACTIVE LIVE ROUTE PATH (Matching Vehicle Waypoints)
               ======================================================== */}
            {/* 1. Outer Glow Aura */}
            <path
              d={routePathD}
              fill="none"
              stroke="#0284c7"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.38"
            />
            {/* 2. Vibrant Cyan Road Core */}
            <path
              d={routePathD}
              fill="none"
              stroke="#00d2ff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#routeGlow)"
            />
            {/* 3. Animated White Dash Center Guide */}
            <path
              d={routePathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
              strokeDasharray="8 5"
            />

            {/* Station Map Pins (Dynamically Rendered from All Stations) */}
            {stations.map((st) => {
              const pos = worldToSvg(st.position?.x ?? 0, st.position?.z ?? 0);
              const isDest = destinationStation
                ? (st.id === destinationStation.id || st.code === destinationStation.code)
                : (vehicle?.destinationStationId === st.id);

              const availableBays = st.chargers?.filter((c) => c.status === 'AVAILABLE').length ?? 3;
              const totalBays = st.chargers?.length ?? 4;

              if (isDest) {
                // Active Target Station (Pulsing Red Marker with Highlight Pill)
                return (
                  <g key={st.id || st.code} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer">
                    <circle r="18" fill="#ef4444" opacity="0.25" className="animate-ping" />
                    <circle r="9" fill="#ef4444" />
                    <circle r="4" fill="#ffffff" />
                    <g transform="translate(14, -10)">
                      <rect
                        x="0"
                        y="-12"
                        width="140"
                        height="24"
                        rx="12"
                        fill="#0c1929"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                      />
                      <circle cx="10" cy="0" r="4" fill="#ef4444" />
                      <text x="20" y="3.5" fill="#ffffff" fontSize="9.5" fontFamily="sans-serif" fontWeight="bold">
                        {st.name}
                      </text>
                    </g>
                  </g>
                );
              }

              // Other District Charging Hubs (Clickable Green Badges)
              return (
                <g 
                  key={st.id || st.code} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onReroute(st.code)}
                  className="cursor-pointer group hover:scale-110 transition-transform"
                >
                  <circle r="6.5" fill="#10b981" />
                  <circle r="2.5" fill="#ffffff" />
                  <g transform="translate(10, -12)">
                    <rect
                      x="0"
                      y="-11"
                      width="104"
                      height="22"
                      rx="11"
                      fill="#071a14"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    <text x="8" y="-1" fill="#34d399" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
                      ⚡ {st.name.length > 14 ? st.name.slice(0, 14) + '…' : st.name}
                    </text>
                    <text x="8" y="8" fill="#6ee7b7" fontSize="7.5" fontFamily="monospace">
                      {availableBays}/{totalBays} Bays Free
                    </text>
                  </g>
                </g>
              );
            })}

            {/* LIVE MOVING VEHICLE GPS CURSOR (Blue Chevron Arrow 🔼) */}
            <g transform={`translate(${vehSvg.x}, ${vehSvg.y})`}>
              <circle r="22" fill="url(#vehGlow)" className="animate-pulse" />
              <circle r="12" fill="#0284c7" opacity="0.4" />
              
              {/* Rotated Vehicle Pointer Arrow */}
              <g transform={`rotate(${vehHeadingDeg})`}>
                <polygon
                  points="0,-14 9,10 0,6 -9,10"
                  fill="#00e5ff"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#routeGlow)"
                />
              </g>

              {/* Floating Vehicle Badge */}
              <g transform="translate(14, 14)">
                <rect
                  x="0"
                  y="-10"
                  width="54"
                  height="18"
                  rx="9"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text x="6" y="2.5" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {vehicle?.code || 'EV-057'}
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Floating Top Map Telemetry Bar */}
        <div className="relative z-10 m-3 flex items-center justify-between pointer-events-none">
          <div className="bg-[#060b14]/85 backdrop-blur-md border border-[#1b2a45] px-2.5 py-1 rounded-lg text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>GPS LIVE · {vehicle?.code || 'EV-057'}</span>
          </div>

          <div className="bg-black/75 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 shadow-lg">
            {speedKmh} km/h · {batteryPct}%
          </div>
        </div>

        {/* Floating Map Zoom & Recenter Controls (Right Edge of Map) */}
        <div className="relative z-10 m-3 flex justify-end items-end pointer-events-auto">
          <div className="flex flex-col gap-1.5 bg-[#091222]/90 border border-white/10 rounded-xl p-1 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setZoom((z) => Math.min(2.2, z + 0.25))}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.25))}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1.15)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-cyan-400 hover:text-cyan-200 transition-all cursor-pointer"
              title="Center on Vehicle"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          RIGHT PANE: TURN-BY-TURN GUIDANCE & DESTINATION (Col 9-12)
         ======================================================== */}
      <div className="col-span-12 lg:col-span-4 flex flex-col justify-between space-y-2">
        
        {/* 1. Destination Header Card with Hub Photo & Favorite Star */}
        <div className="rounded-xl bg-[#091222] border border-[#1b2a45] p-2.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-700 to-cyan-500 overflow-hidden shrink-0 border border-cyan-400/40 flex items-center justify-center shadow-md">
                <span className="text-base">⚡</span>
              </div>

              <div className="min-w-0">
                <span className="text-xs font-black text-white block leading-tight truncate">
                  {destinationStation?.name || (vehicle?.currentLocationName ? vehicle.currentLocationName.replace(/^Patrolling\s+/i, '') : 'Palghar Regional Highway')}
                </span>
                <span className="text-[9.5px] text-slate-400 block mt-0.5 truncate">
                  {destinationStation ? 'Target Charging Hub · Fast CCS2' : 'Active Regional Corridor (Continuous Drive)'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0 ml-1.5"
              title="Save to favorites"
            >
              <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        {/* 2. Turn-by-Turn Next Maneuver Guidance Card */}
        <div className="flex-1 rounded-xl bg-gradient-to-b from-[#0c182e] to-[#08101f] border border-blue-500/30 p-2.5 shadow-xl flex flex-col justify-between">
          
          <div className="space-y-2">
            {/* Top: Next Turn Arrow & Distance */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/60 text-blue-400 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                {turnDirection === 'LEFT' ? (
                  <CornerUpLeft className="w-5 h-5 text-cyan-300" />
                ) : turnDirection === 'RIGHT' ? (
                  <CornerUpRight className="w-5 h-5 text-cyan-300" />
                ) : (
                  <ArrowUp className="w-5 h-5 text-cyan-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white tracking-tight leading-none">
                    {turnDistKm} km
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ⏱ {etaMinutes} min
                  </span>
                </div>
                {/* Specific Turn Instruction: Take Left / Turn Right in 2 km */}
                <span className="text-[10px] font-bold text-cyan-300 block mt-0.5 leading-tight line-clamp-2">
                  {instructionText}
                </span>
              </div>
            </div>

            {/* Arrival Time & Battery Metrics */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>{remainingKm} km remaining</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span>🔋 {Math.max(8, Math.round(batteryPct - (remainingKm * 0.45)))}% at arrival</span>
              </div>
            </div>
          </div>

          {/* 3. Action Buttons: Start Navigation & Alternative Routes */}
          <div className="space-y-1.5 mt-2 pt-1.5 border-t border-white/10">
            <button
              onClick={() => setIsNavActive(!isNavActive)}
              className={`w-full py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isNavActive
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40 ring-1 ring-blue-400/50'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 fill-white" />
              <span>{isNavActive ? 'GPS Navigation Active' : 'Start Navigation'}</span>
            </button>

            <button
              onClick={onOpenMargdarshak}
              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400 text-slate-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Alternative Routes</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
