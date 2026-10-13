import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-y-auto select-auto">
      {children}
    </div>
  );
}
