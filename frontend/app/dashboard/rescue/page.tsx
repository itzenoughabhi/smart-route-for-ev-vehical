import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '../../../components/dashboards/DashboardNav';
import { RescueOperatorDashboard } from '../../../components/dashboards/RescueOperatorDashboard';

export const metadata: Metadata = {
  title: 'Rescue & Tow Dashboard — EVNEXUS Highway Rescue Operations',
  description: 'Live roadside incident queue, hazard priority assessment, atomic tow van dispatch, and critical multi-incident scenario simulation.',
};

export default function RescueDashboardPage() {
  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col bg-slate-50">
      <DashboardNav
        currentRole="RESCUE_OPERATOR"
        title="Rescue & Tow Command"
        subtitle="Multi-Incident Hazard Queue & Concurrency-Safe Tow Dispatch"
      />
      <div className="flex-1 overflow-y-auto">
        <RescueOperatorDashboard />
      </div>
    </main>
  );
}
