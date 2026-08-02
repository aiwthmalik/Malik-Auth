import React from 'react';
import { Wrench, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MalikApp } from '../types';

interface MaintenanceBannerProps {
  app: MalikApp;
}

export const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({ app }) => {
  if (!app || app.status === 'Active') return null;

  const isMaintenance = app.status === 'Maintenance';
  const Icon = isMaintenance ? Wrench : Ban;
  const title = isMaintenance ? 'Maintenance Mode Active' : 'Application Disabled';
  const message = isMaintenance
    ? 'New client logins are blocked. Existing sessions remain active until revoked.'
    : 'All access has been revoked. Re-enable the application to restore service.';

  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
        isMaintenance
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-bold">
          {title}
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {app.name}
          </span>
        </div>
        <p className="mt-0.5 text-xs opacity-90">{message}</p>
      </div>
      <span className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold sm:flex">
        <AlertTriangle className="h-3.5 w-3.5" />
        Status: {app.status}
      </span>
    </div>
  );
};

export const CloudStatus: React.FC<{ online?: boolean }> = ({ online = true }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
    {online ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : (
      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
    )}
    {online ? 'Firebase Cloud Active' : 'Offline'}
  </span>
);