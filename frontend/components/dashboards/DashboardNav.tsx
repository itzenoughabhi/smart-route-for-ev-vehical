'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';
import { 
  Car, 
  Building2, 
  Fuel, 
  Truck, 
  Layers
} from 'lucide-react';
import { UserRole } from '../../types';

interface DashboardNavProps {
  currentRole: UserRole;
  title: string;
  subtitle: string;
  activeRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export function DashboardNav({ 
  currentRole, 
  title, 
  subtitle,
  activeRole,
  onRoleChange
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useDigitalTwinStore((s) => s.currentUser);
  const setUser = useDigitalTwinStore((s) => s.setUser);
  const openStakeholderDashboard = useDigitalTwinStore((s) => s.openStakeholderDashboard);
  const isConnected = useDigitalTwinStore((s) => s.isConnected);

  const effectiveRole = activeRole || currentRole;

  const links: Array<{ href: string; role: UserRole; label: string; icon: any; tag: string }> = [
    { href: '/dashboard/owner', role: 'EV_OWNER', label: 'EV Owner', icon: Car, tag: '3D Drive' },
    { href: '/dashboard/oem', role: 'EV_MANUFACTURER', label: 'OEM Analytics', icon: Building2, tag: 'Telemetry' },
    { href: '/dashboard/station', role: 'STATION_OWNER', label: 'Station Operator', icon: Fuel, tag: 'P&L' },
    { href: '/dashboard/rescue', role: 'RESCUE_OPERATOR', label: 'Rescue & Tow', icon: Truck, tag: 'Dispatch' },
  ];

  // Auto-sync demo user on page load/mount if not matching current active role
  useEffect(() => {
    if (!currentUser || currentUser.role !== effectiveRole) {
      fetch('http://localhost:4000/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: effectiveRole }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((session) => {
          if (session?.user) {
            setUser(session.user);
          }
        })
        .catch(() => null);
    }
    openStakeholderDashboard(effectiveRole);
  }, [effectiveRole, currentUser?.role, setUser, openStakeholderDashboard]);

  const handleTabClick = async (e: React.MouseEvent, linkRole: UserRole, linkHref: string) => {
    e.preventDefault();

    // 1. Immediately notify callback if parent handles in-page view switching
    if (onRoleChange) {
      onRoleChange(linkRole);
    }

    // 2. Sync digital twin store active dashboard
    openStakeholderDashboard(linkRole);

    // 3. Sync user session in backend and local store
    try {
      const res = await fetch('http://localhost:4000/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: linkRole }),
      }).catch(() => null);

      if (res && res.ok) {
        const session = await res.json();
        if (session?.user) {
          setUser(session.user);
        }
      }
    } catch {
      // Fallback
    }

    // 4. Update the URL route smoothly if not handled in-page
    if (!onRoleChange && pathname !== linkHref) {
      router.push(linkHref);
    }
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-30 font-sans shadow-xs">
      {/* Brand & Active Workspace */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black tracking-tight text-slate-900">
                EVNEXUS
              </span>
              <span className="text-slate-300">/</span>
              <span className="font-mono text-xs font-bold text-blue-600">
                {title}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              {subtitle}
            </p>
          </div>
        </Link>
      </div>

      {/* Role Navigation Tabs - Fully Synchronized */}
      <nav className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 gap-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = effectiveRole ? effectiveRole === link.role : pathname === link.href;
          return (
            <button
              key={link.href}
              onClick={(e) => handleTabClick(e, link.role, link.href)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="hidden md:inline">{link.label}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded hidden lg:inline ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-400'
              }`}>
                {link.tag}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Status & 3D Twin Link */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-slate-700 font-semibold">{currentUser?.name || 'Authorized User'}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600 font-bold uppercase">
            {currentUser?.role || effectiveRole}
          </span>
        </div>

        <Link
          href="/"
          title="Return to Full Boisar 3D Digital Twin"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">3D Twin</span>
        </Link>
      </div>
    </header>
  );
}
