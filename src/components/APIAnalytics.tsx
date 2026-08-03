import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, PageHeader, TableShell } from './ui';

interface EndpointStat {
  action: string;
  calls: number;
  avgTime: number;
  errorRate: number;
}

interface TopConsumer {
  identifier: string;
  calls: number;
  lastSeen: string;
}

interface DailyCalls {
  date: string;
  count: number;
}

interface APIAnalyticsData {
  totalCalls: number;
  callsToday: number;
  avgResponseTime: number;
  errorRate: number;
  rateLimitHits: number;
  endpoints: EndpointStat[];
  topConsumers: TopConsumer[];
  dailyCalls: DailyCalls[];
}

interface APIAnalyticsProps {
  appId: string;
  analytics: APIAnalyticsData;
  onRefresh: () => void;
}

export const APIAnalytics: React.FC<APIAnalyticsProps> = ({ appId, analytics, onRefresh }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  const maxDaily = Math.max(...analytics.dailyCalls.map((d) => d.count), 1);

  const kpis = [
    { label: 'Total Calls', value: analytics.totalCalls.toLocaleString(), icon: Activity, color: 'text-brand-500 bg-brand-500/10 border-brand-500/20', change: '+12%', up: true },
    { label: 'Calls Today', value: analytics.callsToday.toLocaleString(), icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', change: '+5%', up: true },
    { label: 'Avg Response', value: `${analytics.avgResponseTime}ms`, icon: Clock, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20', change: '-3ms', up: false },
    { label: 'Error Rate', value: `${analytics.errorRate.toFixed(1)}%`, icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', change: analytics.errorRate > 2 ? '+0.5%' : '-0.2%', up: analytics.errorRate > 2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="API Analytics"
        subtitle="Detailed API usage analytics and endpoint performance."
        accent="emerald"
        actions={
          <div className="flex items-center gap-2">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as '7d' | '30d')} className="select !py-1.5 !text-xs">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button onClick={onRefresh} className="btn-ghost">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">{k.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${k.color}`}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight">{k.value}</span>
              <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${k.up ? 'text-emerald-500' : 'text-sky-500'}`}>
                {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-bold tracking-tight">Usage Over Time</h3>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {analytics.dailyCalls.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-surface-500">{d.count}</span>
              <div
                className="w-full rounded-t-lg bg-brand-500/20 transition-all hover:bg-brand-500/40"
                style={{ height: `${(d.count / maxDaily) * 120}px`, minHeight: 4 }}
              />
              <span className="text-[10px] text-surface-400">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Endpoint Breakdown + Top Consumers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TableShell headers={['Endpoint', 'Calls', 'Avg Time', 'Error %']}>
          {analytics.endpoints.map((ep) => (
            <tr key={ep.action} className="hover:bg-surface-50/50 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-surface-900 dark:text-white">
                {ep.action}
              </td>
              <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-300">
                {ep.calls.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-surface-500">{ep.avgTime}ms</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold ${ep.errorRate > 5 ? 'text-rose-500' : ep.errorRate > 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {ep.errorRate.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </TableShell>

        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-bold tracking-tight">Top Consumers</h3>
          <div className="space-y-3">
            {analytics.topConsumers.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-surface-50 text-[11px] font-bold text-surface-500 dark:border-white/10 dark:bg-white/[0.03]">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-mono text-xs font-semibold text-surface-900 dark:text-white">{c.identifier}</p>
                  <p className="text-[11px] text-surface-400">Last seen {new Date(c.lastSeen).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-surface-700 dark:text-surface-200">{c.calls.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Rate Limit Hits */}
      {analytics.rateLimitHits > 0 && (
        <Card className="flex items-center gap-4 border-amber-500/25 bg-amber-500/5 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-surface-900 dark:text-white">
              {analytics.rateLimitHits.toLocaleString()} rate limit hits
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Consider increasing rate limits for affected API keys.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
