import React from 'react';
import type { Metadata } from 'next';
import { UnifiedDashboardView } from '../../../components/dashboards/UnifiedDashboardView';

export const metadata: Metadata = {
  title: 'Station Operator Dashboard — EVNEXUS Commercial P&L & Expansion',
  description: 'Charging station financial statements, revenue vs OPEX, EBITDA margins, profitability ranking, and candidate expansion analysis.',
};

export default function StationDashboardPage() {
  return <UnifiedDashboardView initialRole="STATION_OWNER" />;
}
