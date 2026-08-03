import React, { useState, useMemo } from 'react';
import {
  Download,
  TrendingUp,
  Calendar,
  Globe,
  File,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Card, PageHeader, TableShell, EmptyState, FieldLabel } from './ui';

interface DownloadCounterProps {
  appId: string;
  downloads: MalikDownload[];
  onRefresh: () => void;
}

interface MalikDownload {
  id: string;
  date: string;
  ip: string;
  userAgent: string;
  file: string;
  status: 'success' | 'failed' | 'partial';
}

export const DownloadCounter: React.FC<DownloadCounterProps> = ({ appId, downloads, onRefresh }) => {
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [fileFilter, setFileFilter] = useState('all');

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getTime() - 30 * 86400000);

    return {
      total: downloads.length,
      today: downloads.filter((d) => new Date(d.date) >= todayStart).length,
      thisWeek: downloads.filter((d) => new Date(d.date) >= weekStart).length,
      thisMonth: downloads.filter((d) => new Date(d.date) >= monthStart).length,
    };
  }, [downloads]);

  const files = useMemo(() => {
    const fileMap = new Map<string, number>();
    downloads.forEach((d) => {
      fileMap.set(d.file, (fileMap.get(d.file) || 0) + 1);
    });
    return Array.from(fileMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [downloads]);

  const maxFileCount = files.length > 0 ? Math.max(...files.map((f) => f[1])) : 1;

  const dailyTrend = useMemo(() => {
    const last14Days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = downloads.filter((dl) => dl.date.startsWith(dateStr)).length;
      last14Days.push({ date: dateStr, count });
    }
    return last14Days;
  }, [downloads]);

  const maxDailyCount = dailyTrend.length > 0 ? Math.max(...dailyTrend.map((d) => d.count), 1) : 1;

  const uniqueIPs = useMemo(() => {
    const ips = new Set(downloads.map((d) => d.ip));
    return ips.size;
  }, [downloads]);

  const filteredDownloads = downloads.filter((d) => {
    if (fileFilter !== 'all' && d.file !== fileFilter) return false;
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return d.date.startsWith(today);
    }
    if (dateFilter === 'week') {
      return new Date(d.date) >= new Date(Date.now() - 7 * 86400000);
    }
    if (dateFilter === 'month') {
      return new Date(d.date) >= new Date(Date.now() - 30 * 86400000);
    }
    return true;
  });

  const uniqueFiles = useMemo(() => {
    const fileSet = new Set(downloads.map((d) => d.file));
    return Array.from(fileSet);
  }, [downloads]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'failed':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
      case 'partial':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-surface-500/10 text-surface-600 dark:text-surface-400';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Download}
        accent="sky"
        title="Download Counter"
        subtitle="Track and analyze download statistics"
        actions={
          <button onClick={onRefresh} className="btn-ghost text-xs">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Downloads', value: stats.total, icon: Download, color: 'brand' },
          { label: 'Downloads Today', value: stats.today, icon: Calendar, color: 'emerald' },
          { label: 'This Week', value: stats.thisWeek, icon: TrendingUp, color: 'sky' },
          { label: 'This Month', value: stats.thisMonth, icon: BarChart3, color: 'violet' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-${stat.color}-500/20 bg-${stat.color}-500/10 text-${stat.color}-500`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Downloaded Files */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Top Downloaded Files</h3>
          </div>

          {files.length === 0 ? (
            <div className="py-8 text-center text-xs text-surface-500 dark:text-surface-400">
              No download data available
            </div>
          ) : (
            <div className="space-y-3">
              {files.map(([file, count]) => (
                <div key={file} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-surface-700 dark:text-surface-300 truncate max-w-[200px]">
                      {file}
                    </span>
                    <span className="font-bold text-surface-900 dark:text-white">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                      style={{ width: `${(count / maxFileCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Daily Trend */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">14-Day Download Trend</h3>
          </div>

          {dailyTrend.length === 0 ? (
            <div className="py-8 text-center text-xs text-surface-500 dark:text-surface-400">
              No trend data available
            </div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {dailyTrend.map((day, i) => {
                const height = maxDailyCount > 0 ? (day.count / maxDailyCount) * 100 : 0;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-surface-500 dark:text-surface-400">
                      {day.count}
                    </span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-sky-600 to-sky-400 transition-all duration-500"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[9px] text-surface-400 dark:text-surface-500 rotate-45 origin-left">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Download History */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Download History</h3>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              ({filteredDownloads.length} records)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="select py-1.5 text-xs"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <select
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="select py-1.5 text-xs"
            >
              <option value="all">All Files</option>
              {uniqueFiles.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <TableShell
          headers={['Date', 'IP Address', 'User Agent', 'File', 'Status']}
          empty={
            <EmptyState
              icon={Download}
              title="No downloads found"
              message="No download records match your filters."
            />
          }
        >
          {filteredDownloads.slice(0, 50).map((dl) => (
            <tr key={dl.id} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono text-xs text-surface-700 dark:text-surface-300">
                {formatDate(dl.date)}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-surface-700 dark:text-surface-300">
                {dl.ip}
              </td>
              <td className="px-4 py-3 text-xs text-surface-600 dark:text-surface-400 max-w-[200px] truncate">
                {dl.userAgent}
              </td>
              <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                {dl.file}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(dl.status)}`}>
                  {dl.status}
                </span>
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>

      {/* Unique IPs */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-sky-500" />
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Unique IP Addresses
            </span>
          </div>
          <span className="text-lg font-bold text-surface-900 dark:text-white">{uniqueIPs}</span>
        </div>
      </Card>
    </div>
  );
};
