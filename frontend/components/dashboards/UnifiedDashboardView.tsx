'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { DashboardNav } from './DashboardNav';
import { EVOwner3DExperience } from './EVOwner3DExperience';
import { ManufacturerDashboard } from './ManufacturerDashboard';
import { StationOwnerDashboard } from './StationOwnerDashboard';
import { RescueOperatorDashboard } from './RescueOperatorDashboard';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';

const ROLE_METADATA: Record<UserRole, { title: string; subtitle: string; href: string }> = {
  EV_OWNER: {
    title: 'EV Owner Workspace',
    subtitle: '3D Driving Environment, Charging Navigation & SOS Rescue',
    href: '/dashboard/owner',
  },
  EV_MANUFACTURER: {
    title: 'OEM Analytics',
    subtitle: 'Regional Adoption, Battery Health & Incident Hotspots',
    href: '/dashboard/oem',
  },
  STATION_OWNER: {
    title: 'Station Operator',
    subtitle: 'Commercial Station Analytics, P&L & Expansion Planning',
    href: '/dashboard/station',
  },
  RESCUE_OPERATOR: {
    title: 'Rescue & Tow Command',
    subtitle: 'Multi-Incident Hazard Queue & Concurrency-Safe Tow Dispatch',
    href: '/dashboard/rescue',
  },
  PLATFORM_ADMIN: {
    title: 'Platform Admin',
    subtitle: 'Global Operations & System Settings',
    href: '/dashboard/station',
  },
};

export function UnifiedDashboardView({ initialRole }: { initialRole: UserRole }) {
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const activeStakeholderDashboard = useDigitalTwinStore((s) => s.activeStakeholderDashboard);

  useEffect(() => {
    setActiveRole(initialRole);
  }, [initialRole]);

  const meta = ROLE_METADATA[activeRole] || ROLE_METADATA.STATION_OWNER;

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    const targetHref = ROLE_METADATA[role]?.href || '/dashboard/station';
    if (typeof window !== 'undefined' && window.location.pathname !== targetHref) {
      window.history.pushState(null, '', targetHref);
    }
  };

  return (
    <main className={`w-screen h-screen overflow-hidden flex flex-col ${activeRole === 'EV_OWNER' ? 'bg-[#070b13]' : 'bg-slate-50'}`}>
      <DashboardNav
        currentRole={activeRole}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        title={meta.title}
        subtitle={meta.subtitle}
      />
      <div className={`flex-1 ${activeRole === 'EV_OWNER' ? 'relative overflow-hidden' : 'overflow-y-auto'}`}>
        {activeRole === 'EV_OWNER' && <EVOwner3DExperience />}
        {activeRole === 'EV_MANUFACTURER' && <ManufacturerDashboard />}
        {activeRole === 'STATION_OWNER' && <StationOwnerDashboard />}
        {activeRole === 'RESCUE_OPERATOR' && <RescueOperatorDashboard />}
      </div>
    </main>
  );
}
