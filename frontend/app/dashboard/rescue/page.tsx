import React from 'react';
import type { Metadata } from 'next';
import { UnifiedDashboardView } from '../../../components/dashboards/UnifiedDashboardView';

export const metadata: Metadata = {
  title: 'Rescue & Tow Dashboard — EVNEXUS Highway Rescue Operations',
  description: 'Live roadside incident queue, hazard priority assessment, atomic tow van dispatch, and critical multi-incident scenario simulation.',
};

export default function RescueDashboardPage() {
  return <UnifiedDashboardView initialRole="RESCUE_OPERATOR" />;
}
