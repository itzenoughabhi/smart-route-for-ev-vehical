'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { socketService } from '../services/socket';
import { useDigitalTwinStore } from '../store/useDigitalTwinStore';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { VehiclePanel } from '../components/VehiclePanel';
import { StationPanel } from '../components/StationPanel';
import { ServiceCenterPanel } from '../components/ServiceCenterPanel';
import { PowerGridPanel } from '../components/PowerGridPanel';
import { HomeChargerPanel } from '../components/HomeChargerPanel';
import { DemoScenarioWizard } from '../components/DemoScenarioWizard';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { MapControls } from '../components/MapControls';
import { LiveEventsDrawer } from '../components/LiveEventsDrawer';
import { SimulationDrawer } from '../components/SimulationDrawer';
import { TwoDMapOverlay } from '../components/TwoDMapOverlay';
import { SwipableDistrictDock } from '../components/SwipableDistrictDock';
import { WorldValidationModal } from '../components/WorldValidationModal';
import { StakeholderModal } from '../components/dashboards/StakeholderModal';

const MapLibreBoisarMap = dynamic(
  () => import('../components/MapLibreBoisarMap').then((mod) => mod.MapLibreBoisarMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#edf3f8] text-slate-600">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs tracking-wider text-slate-700 uppercase font-semibold">
          Loading OpenStreetMap Geographic Foundation...
        </p>
        <span className="text-[10px] text-slate-500 font-mono mt-1">
          Boisar, Maharashtra · Lat: 19.7902325, Lon: 72.7657359
        </span>
      </div>
    ),
  }
);

const DigitalTwinScene = dynamic(
  () => import('../3d/Scene').then((mod) => mod.DigitalTwinScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#edf3f8] text-slate-600">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs tracking-wider text-slate-700 uppercase font-semibold">
          Loading EVNEXUS Boisar 3D Digital Twin...
        </p>
        <span className="text-[10px] text-slate-500 font-mono mt-1">
          Synchronizing GIS Road Network, Substation & Telemetry
        </span>
      </div>
    ),
  }
);

export default function Home() {
  const mapMode = useDigitalTwinStore((s) => s.mapMode);
  const setMapMode = useDigitalTwinStore((s) => s.setMapMode);
  const isAuditModalOpen = useDigitalTwinStore((s) => s.isAuditModalOpen);
  const toggleAuditModal = useDigitalTwinStore((s) => s.toggleAuditModal);

  useEffect(() => {
    socketService.connect();
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#edf3f8]">
      <Sidebar />

      <div className="absolute top-0 left-56 right-0 bottom-0 z-0">
        {mapMode === 'REAL_MAP' ? (
          <MapLibreBoisarMap onSwitchTo3D={() => setMapMode('3D_TWIN')} />
        ) : (
          <DigitalTwinScene />
        )}
      </div>

      <TopBar />

      <SwipableDistrictDock />

      <VehiclePanel />
      <StationPanel />
      <ServiceCenterPanel />
      <PowerGridPanel />
      <HomeChargerPanel />

      <DemoScenarioWizard />

      <JourneyTimeline />

      <MapControls />

      <LiveEventsDrawer />
      <SimulationDrawer />
      <TwoDMapOverlay />

      <WorldValidationModal isOpen={isAuditModalOpen} onClose={() => toggleAuditModal(false)} />
      <StakeholderModal />
    </main>
  );
}
