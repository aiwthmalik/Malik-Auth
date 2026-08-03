import React from 'react';
import { AppWindow, Key, Users, Radio } from 'lucide-react';
import { MalikApp, MalikLicense, MalikUser, MalikSession } from '../types';
import { isExpired } from '../lib/dateUtils';
import { Card } from './ui';

interface GlobalStatsProps {
  apps: MalikApp[];
  licenses: MalikLicense[];
  users: MalikUser[];
  sessions: MalikSession[];
}

export const GlobalStats: React.FC<GlobalStatsProps> = ({ apps, licenses, users, sessions }) => {
  const activeKeys = licenses.filter(
    (l) => (l.status === 'Active' || l.status === 'Unused') && !isExpired(l.expiry)
  ).length;
  const activeUsers = users.filter(
    (u) => u.status === 'Active' && !isExpired(u.expiry)
  ).length;
  const liveSessions = sessions.filter((s) => s.status === 'Active').length;

  const stats = [
    {
      label: 'Total Apps',
      value: apps.length,
      icon: AppWindow,
      color: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
    },
    {
      label: 'Total Keys',
      value: activeKeys,
      sub: `${licenses.length} All`,
      icon: Key,
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Total Users',
      value: activeUsers,
      sub: `${users.length} All`,
      icon: Users,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Total Sessions',
      value: liveSessions,
      sub: `${sessions.length} All`,
      icon: Radio,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    },
  ];

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
        Platform Overview
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xl font-extrabold tracking-tight text-surface-900 dark:text-white">
                {s.value}
              </span>
              <span className="block text-[11px] font-medium text-surface-500 dark:text-surface-400">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
