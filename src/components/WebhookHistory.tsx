import React, { useState } from 'react';
import {
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { Card, PageHeader, StatusBadge, EmptyState, TableShell } from './ui';

interface WebhookDelivery {
  id: string;
  event: string;
  url: string;
  status: 'success' | 'failed' | 'pending';
  statusCode: number;
  responseTime: number;
  payload: string;
  response?: string;
  createdAt: string;
}

interface WebhookHistoryProps {
  appId: string;
  history: WebhookDelivery[];
  onRefresh: () => void;
}

export const WebhookHistory: React.FC<WebhookHistoryProps> = ({ appId, history, onRefresh }) => {
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const events = Array.from(new Set(history.map((h) => h.event)));

  const filtered = history.filter((h) => {
    if (filterEvent !== 'all' && h.event !== filterEvent) return false;
    if (filterStatus !== 'all' && h.status !== filterStatus) return false;
    return true;
  });

  const totalSent = history.length;
  const successCount = history.filter((h) => h.status === 'success').length;
  const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;
  const avgResponseTime =
    totalSent > 0
      ? Math.round(history.reduce((sum, h) => sum + h.responseTime, 0) / totalSent)
      : 0;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title="Webhook History"
        subtitle="Track all webhook deliveries and retry failed ones."
        accent="sky"
        actions={
          <button onClick={onRefresh} className="btn-ghost">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Sent', value: totalSent, icon: History, color: 'text-brand-500 bg-brand-500/10 border-brand-500/20' },
          { label: 'Success Rate', value: `${successRate}%`, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Avg Response Time', value: `${avgResponseTime}ms`, icon: Clock, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">{s.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-surface-500">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="select !py-1.5 !text-xs">
          <option value="all">All Events</option>
          {events.map((ev) => (
            <option key={ev} value={ev}>{ev}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select !py-1.5 !text-xs">
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Webhook Deliveries"
          message="Webhook delivery history will appear here."
        />
      ) : (
        <TableShell headers={['Event', 'Status', 'URL', 'Response', 'Time', 'Actions']}>
          {filtered.map((h) => (
            <React.Fragment key={h.id}>
              <tr className="hover:bg-surface-50/50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <span className="badge border bg-surface-500/10 text-surface-600 border-surface-500/25 text-[10px] dark:text-surface-300">
                    {h.event}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {statusIcon(h.status)}
                    <StatusBadge status={h.status === 'success' ? 'Active' : h.status === 'failed' ? 'Banned' : 'Pending'} />
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate font-mono text-xs text-surface-600 dark:text-surface-300">
                  {h.url}
                </td>
                <td className="px-4 py-3 text-xs text-surface-500">{h.statusCode}</td>
                <td className="px-4 py-3 text-xs text-surface-500">{h.responseTime}ms</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {h.status === 'failed' && (
                      <button className="rounded-lg px-2 py-1 text-[11px] font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {expandedId === h.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedId === h.id && (
                <tr>
                  <td colSpan={6} className="border-t border-surface-100 bg-surface-50/30 px-4 py-4 dark:border-white/5 dark:bg-white/[0.01]">
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-surface-500">Payload</p>
                        <pre className="max-h-40 overflow-auto rounded-lg border border-surface-200 bg-surface-950 p-3 font-mono text-[11px] text-emerald-400 dark:border-white/10">
                          {JSON.stringify(JSON.parse(h.payload || '{}'), null, 2)}
                        </pre>
                      </div>
                      {h.response && (
                        <div>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-surface-500">Response</p>
                          <pre className="max-h-32 overflow-auto rounded-lg border border-surface-200 bg-surface-950 p-3 font-mono text-[11px] text-surface-300 dark:border-white/10">
                            {h.response}
                          </pre>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </TableShell>
      )}
    </div>
  );
};
