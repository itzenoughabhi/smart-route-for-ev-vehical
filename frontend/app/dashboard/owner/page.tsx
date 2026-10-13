import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '../../../components/dashboards/DashboardNav';
import { EVOwner3DExperience } from '../../../components/dashboards/EVOwner3DExperience';

export const metadata: Metadata = {
  title: 'EV Owner Dashboard — EVNEXUS 3D Drive & Telemetry',
  description: 'Immersive 3D electric vehicle driving environment, real-time battery telemetry, Margdarshak routing, and emergency roadside rescue.',
};

export default function EVOwnerPage() {
  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col bg-slate-900">
      <DashboardNav
        currentRole="EV_OWNER"
        title="EV Owner Workspace"
        subtitle="3D Driving Environment, Charging Navigation & SOS Rescue"
      />
      <div className="flex-1 relative overflow-hidden">
        <EVOwner3DExperience />
      </div>
    </main>
  );
}
