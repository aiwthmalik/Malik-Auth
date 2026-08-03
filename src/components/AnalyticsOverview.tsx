import React, { useMemo } from 'react';
import {
  BarChart3,
  Users,
  Key,
  Activity,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { MalikActivityLog, MalikSession, MalikLicense } from '../types';
import { Card, PageHeader } from './ui';

interface AnalyticsOverviewProps {
  appId: string;
  logs: MalikActivityLog[];
  sessions: MalikSession[];
  licenses: MalikLicense[];
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  appId,
  logs,
  sessions,
  licenses
}) => {
  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const logsLast7Days = logs.filter(l => new Date(l.timestamp) >= last7Days);
    const logsLast30Days = logs.filter(l => new Date(l.timestamp) >= last30Days);

    const loginsLast7Days = logsLast7Days.filter(l => l.action === 'USER_LOGIN').length;
    const loginsLast30Days = logsLast30Days.filter(l => l.action === 'USER_LOGIN').length;

    const activeSessions = sessions.filter(s => s.status === 'Active').length;
    const totalSessions = sessions.length;

    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter(l => l.status === 'Active').length;
    const unusedLicenses = licenses.filter(l => l.status === 'Unused').length;
    const expiredLicenses = licenses.filter(l => l.status === 'Expired').length;

    return {
      loginsLast7Days,
      loginsLast30Days,
      activeSessions,
      totalSessions,
      totalLicenses,
      activeLicenses,
      unusedLicenses,
      expiredLicenses,
    };
  }, [logs, sessions, licenses]);

  const loginFrequencyByDay = useMemo(() => {
    const now = new Date();
    const days: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const count = logs.filter(l => {
        const logDate = new Date(l.timestamp).toISOString().split('T')[0];
        return logDate === dateStr && l.action === 'USER_LOGIN';
      }).length;
      days.push({ date: dayName, count });
    }

    return days;
  }, [logs]);

  const sessionTimeline = useMemo(() => {
    const now = new Date();
    const hours: { hour: string; count: number }[] = [];

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';
      const count = sessions.filter(s => {
        const sessionHour = new Date(s.lastHeartbeat).getHours();
        return sessionHour === hour.getHours() && s.status === 'Active';
      }).length;
      hours.push({ hour: hourStr, count });
    }

    return hours;
  }, [sessions]);

  const keyGenerationStats = useMemo(() => {
    const now = new Date();
    const weeks: { week: string; generated: number; activated: number }[] = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekLabel = `Week ${4 - i}`;

      const generated = licenses.filter(l => {
        const created = new Date(l.createdAt);
        return created >= weekStart && created < weekEnd;
      }).length;

      const activated = licenses.filter(l => {
        const activated = l.activatedAt ? new Date(l.activatedAt) : null;
        return activated && activated >= weekStart && activated < weekEnd;
      }).length;

      weeks.push({ week: weekLabel, generated, activated });
    }

    return weeks;
  }, [licenses]);

  const userGrowth = useMemo(() => {
    const now = new Date();
    const days: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const count = logs.filter(l => {
        const logDate = new Date(l.timestamp).toISOString().split('T')[0];
        return logDate === dateStr && (l.action === 'USER_LOGIN' || l.action === 'LICENSE_ACTIVATED');
      }).length;
      days.push({ date: dayName, count });
    }

    return days;
  }, [logs]);

  const maxLoginFreq = Math.max(...loginFrequencyByDay.map(d => d.count), 1);
  const maxSessionHour = Math.max(...sessionTimeline.map(h => h.count), 1);
  const maxKeyGen = Math.max(...keyGenerationStats.map(w => w.generated + w.activated), 1);
  const maxUserGrowth = Math.max(...userGrowth.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics Overview"
        subtitle="Usage statistics and performance metrics for your application."
        accent="brand"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Logins (7 Days)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight">{stats.loginsLast7Days}</span>
            <span className="ml-2 text-xs text-surface-500 dark:text-surface-400">
              ({stats.loginsLast30Days} this month)
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Active Sessions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight">{stats.activeSessions}</span>
            <span className="ml-2 text-xs text-surface-500 dark:text-surface-400">
              ({stats.totalSessions} total)
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Active Keys
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight">{stats.activeLicenses}</span>
            <span className="ml-2 text-xs text-surface-500 dark:text-surface-400">
              ({stats.unusedLicenses} unused)
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Total Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight">{stats.totalLicenses}</span>
            <span className="ml-2 text-xs text-surface-500 dark:text-surface-400">
              licenses issued
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white">
              <Calendar className="h-4 w-4 text-brand-500" />
              Login Frequency (Last 7 Days)
            </h3>
          </div>
          <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
            {loginFrequencyByDay.map((day, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs font-bold text-surface-900 dark:text-white">
                  {day.count}
                </div>
                <div
                  className="w-full rounded-t-lg bg-brand-500 transition-all duration-300 hover:bg-brand-400"
                  style={{
                    height: `${(day.count / maxLoginFreq) * 120}px`,
                    minHeight: day.count > 0 ? '8px' : '2px',
                  }}
                />
                <div className="text-[10px] font-medium text-surface-500 dark:text-surface-400">
                  {day.date}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white">
              <Activity className="h-4 w-4 text-emerald-500" />
              Active Sessions Timeline (24h)
            </h3>
          </div>
          <div className="flex items-end justify-between gap-1" style={{ height: '160px' }}>
            {sessionTimeline.map((hour, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-surface-900 dark:text-white">
                  {hour.count > 0 ? hour.count : ''}
                </div>
                <div
                  className="w-full rounded-t bg-emerald-500 transition-all duration-300 hover:bg-emerald-400"
                  style={{
                    height: `${(hour.count / maxSessionHour) * 120}px`,
                    minHeight: hour.count > 0 ? '4px' : '1px',
                  }}
                />
                {idx % 4 === 0 && (
                  <div className="text-[9px] font-medium text-surface-500 dark:text-surface-400">
                    {hour.hour}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white">
              <Key className="h-4 w-4 text-violet-500" />
              Key Generation Stats (4 Weeks)
            </h3>
          </div>
          <div className="flex items-end justify-between gap-4" style={{ height: '160px' }}>
            {keyGenerationStats.map((week, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex gap-1">
                  <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    {week.generated}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {week.activated}
                  </div>
                </div>
                <div className="flex w-full items-end justify-center gap-1" style={{ height: '120px' }}>
                  <div
                    className="w-1/2 rounded-t bg-violet-500 transition-all duration-300"
                    style={{
                      height: `${(week.generated / maxKeyGen) * 100}px`,
                      minHeight: week.generated > 0 ? '4px' : '1px',
                    }}
                  />
                  <div
                    className="w-1/2 rounded-t bg-emerald-500 transition-all duration-300"
                    style={{
                      height: `${(week.activated / maxKeyGen) * 100}px`,
                      minHeight: week.activated > 0 ? '4px' : '1px',
                    }}
                  />
                </div>
                <div className="text-[10px] font-medium text-surface-500 dark:text-surface-400">
                  {week.week}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-surface-500 dark:text-surface-400">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm bg-violet-500" />
              Generated
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm bg-emerald-500" />
              Activated
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white">
              <Users className="h-4 w-4 text-amber-500" />
              User Activity (Last 7 Days)
            </h3>
          </div>
          <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
            {userGrowth.map((day, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs font-bold text-surface-900 dark:text-white">
                  {day.count}
                </div>
                <div
                  className="w-full rounded-t-lg bg-amber-500 transition-all duration-300 hover:bg-amber-400"
                  style={{
                    height: `${(day.count / maxUserGrowth) * 120}px`,
                    minHeight: day.count > 0 ? '8px' : '2px',
                  }}
                />
                <div className="text-[10px] font-medium text-surface-500 dark:text-surface-400">
                  {day.date}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
