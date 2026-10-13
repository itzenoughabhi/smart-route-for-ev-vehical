import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '../../../components/dashboards/DashboardNav';
import { ManufacturerDashboard } from '../../../components/dashboards/ManufacturerDashboard';

export const metadata: Metadata = {
  title: 'OEM Analytics Dashboard — EVNEXUS Manufacturer Workspace',
  description: 'Regional EV adoption trends, battery degradation curves, breakdown heatmaps, and privacy-compliant fleet analytics.',
};

export default function OEMDashboardPage() {
  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col bg-slate-50">
      <DashboardNav
        currentRole="EV_MANUFACTURER"
        title="OEM Analytics"
        subtitle="Regional Adoption, Battery Health & Incident Hotspots"
      />
      <div className="flex-1 overflow-y-auto">
        <ManufacturerDashboard />
      </div>
    </main>
  );
}
