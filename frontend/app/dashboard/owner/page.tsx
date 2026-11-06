import React from 'react';
import type { Metadata } from 'next';
import { UnifiedDashboardView } from '../../../components/dashboards/UnifiedDashboardView';

export const metadata: Metadata = {
  title: 'EV Owner Dashboard — EVNEXUS 3D Drive & Telemetry',
  description: 'Immersive 3D electric vehicle driving environment, real-time battery telemetry, Margdarshak routing, and emergency roadside rescue.',
};

export default function EVOwnerPage() {
  return <UnifiedDashboardView initialRole="EV_OWNER" />;
}
