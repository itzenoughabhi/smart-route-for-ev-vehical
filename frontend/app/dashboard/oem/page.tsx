import React from 'react';
import type { Metadata } from 'next';
import { UnifiedDashboardView } from '../../../components/dashboards/UnifiedDashboardView';

export const metadata: Metadata = {
  title: 'OEM Analytics Dashboard — EVNEXUS Manufacturer Workspace',
  description: 'Regional EV adoption trends, battery degradation curves, breakdown heatmaps, and privacy-compliant fleet analytics.',
};

export default function OEMDashboardPage() {
  return <UnifiedDashboardView initialRole="EV_MANUFACTURER" />;
}
