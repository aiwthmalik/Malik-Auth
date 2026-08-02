import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { MalikActivityLog } from '../types';
import { formatPKTDateTime } from '../lib/dateUtils';
import { PageHeader, EmptyState, TableShell, Sensitive } from './ui';

interface ActivityLogsTabProps {
  logs: MalikActivityLog[];
  onRefresh: () => void;
}

const actionStyle = (action: string): string => {
  switch (action) {
    case 'LICENSE_ACTIVATED':
      return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'USER_LOGIN':
      return 'border-brand-500/25 bg-brand-500/10 text-brand-600 dark:text-brand-400';
    case 'HWID_RESET':
      return 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'REMOTE_SYNC':
      return 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400';
    case 'KEY_GENERATED':
      return 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400';
    default:
      return 'border-surface-200 bg-surface-100 text-surface-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-300';
  }
};

export const ActivityLogsTab: React.FC<ActivityLogsTabProps> = ({ logs, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.hwid.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={FileText}
        title="Security & Audit Activity Logs"
        subtitle="Real-time audit trail of every license activation, application login, and HWID reset."
        accent="sky"
        actions={
          <button onClick={onRefresh} className="btn-ghost">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Logs</span>
          </button>
        }
      />

      {/* Filters */}
      <div className="card animate-in-up flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search actor, HWID, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="select w-full pl-9 sm:w-60"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="LICENSE_ACTIVATED">LICENSE_ACTIVATED</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="HWID_RESET">HWID_RESET</option>
            <option value="REMOTE_SYNC">REMOTE_SYNC</option>
            <option value="KEY_GENERATED">KEY_GENERATED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <TableShell
        headers={['Event Type', 'Actor / License', 'HWID', 'Description', 'Timestamp']}
        empty={
          <EmptyState
            icon={ShieldCheck}
            title="No logs match your filter criteria"
            message="Try adjusting your search or action filter to see more audit records."
          />
        }
      >
        {filteredLogs.map((log) => (
          <tr
            key={log.id || `${log.timestamp}-${log.actor}`}
            className="hover:bg-surface-50/80 transition-colors dark:hover:bg-white/[0.03]"
          >
            <td className="py-3.5 px-4">
              <span className={`badge border ${actionStyle(log.action)}`}>{log.action}</span>
            </td>
            <td className="py-3.5 px-4 font-mono text-xs font-bold text-surface-900 dark:text-white">
              {log.actor}
            </td>
            <td className="py-3.5 px-4 font-mono text-xs">
              {log.hwid === 'N/A' ? (
                <span className="text-surface-400 dark:text-surface-500">—</span>
              ) : (
                <Sensitive value={log.hwid} className="text-surface-500 dark:text-surface-400" />
              )}
            </td>
            <td className="py-3.5 px-4 text-xs text-surface-700 dark:text-surface-300">
              {log.details}
            </td>
            <td className="py-3.5 px-4 text-right text-xs font-medium text-surface-500 dark:text-surface-400">
              {formatPKTDateTime(log.timestamp)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
};