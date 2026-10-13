import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '../../../components/dashboards/DashboardNav';
import { StationOwnerDashboard } from '../../../components/dashboards/StationOwnerDashboard';

export const metadata: Metadata = {
  title: 'Station Operator Dashboard — EVNEXUS Commercial P&L & Expansion',
  description: 'Charging station financial statements, revenue vs OPEX, EBITDA margins, profitability ranking, and candidate expansion analysis.',
};

export default function StationDashboardPage() {
  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col bg-slate-50">
      <DashboardNav
        currentRole="STATION_OWNER"
        title="Station Operator"
        subtitle="Commercial Station Analytics, P&L & Expansion Planning"
      />
      <div className="flex-1 overflow-y-auto">
        <StationOwnerDashboard />
      </div>
    </main>
  );
}
