import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  Key,
  Users,
  Clock,
  ShieldAlert,
  FileText,
  RefreshCw,
  Loader2,
  Check
} from 'lucide-react';
import { MalikLicense, MalikUser, MalikSession } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { Card, PageHeader, FieldLabel } from './ui';

interface BulkDeletePanelProps {
  appId: string;
  licenses: MalikLicense[];
  users: MalikUser[];
  sessions: MalikSession[];
  onRefresh: () => void;
}

interface BulkOperation {
  id: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  variant: 'danger' | 'warning';
  count: number;
  action: string;
}

export const BulkDeletePanel: React.FC<BulkDeletePanelProps> = ({
  appId,
  licenses,
  users,
  sessions,
  onRefresh,
}) => {
  const [confirmOperation, setConfirmOperation] = useState<BulkOperation | null>(null);
  const [executing, setExecuting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [olderThanDays, setOlderThanDays] = useState(30);

  const unusedLicenses = licenses.filter((l) => l.status === 'Unused');
  const usedLicenses = licenses.filter((l) => l.status === 'Active');
  const expiredLicenses = licenses.filter((l) => {
    if (l.status === 'Expired') return true;
    if (l.expiry) {
      const d = new Date(l.expiry);
      return d.getTime() <= Date.now();
    }
    return false;
  });
  const bannedLicenses = licenses.filter((l) => l.status === 'Banned');
  const terminatedSessions = sessions.filter((s) => s.status === 'Terminated' || s.status === 'Expired');

  const now = new Date();
  const olderThanDate = new Date(now.getTime() - olderThanDays * 86400000);

  const operations: BulkOperation[] = [
    {
      id: 'delete-unused',
      label: 'Delete ALL Unused Licenses',
      description: `Permanently remove ${unusedLicenses.length} unused license keys`,
      icon: Key,
      variant: 'warning',
      count: unusedLicenses.length,
      action: 'DELETE_UNUSED_LICENSES',
    },
    {
      id: 'delete-used',
      label: 'Delete ALL Used Licenses',
      description: `Permanently remove ${usedLicenses.length} active/used license keys`,
      icon: Key,
      variant: 'danger',
      count: usedLicenses.length,
      action: 'DELETE_USED_LICENSES',
    },
    {
      id: 'delete-expired',
      label: 'Delete ALL Expired Licenses',
      description: `Permanently remove ${expiredLicenses.length} expired license keys`,
      icon: Clock,
      variant: 'warning',
      count: expiredLicenses.length,
      action: 'DELETE_EXPIRED_LICENSES',
    },
    {
      id: 'delete-banned',
      label: 'Delete ALL Banned Licenses',
      description: `Permanently remove ${bannedLicenses.length} banned license keys`,
      icon: ShieldAlert,
      variant: 'danger',
      count: bannedLicenses.length,
      action: 'DELETE_BANNED_LICENSES',
    },
    {
      id: 'delete-all-licenses',
      label: 'Delete ALL Licenses',
      description: `Permanently remove ALL ${licenses.length} license keys. This cannot be undone!`,
      icon: Trash2,
      variant: 'danger',
      count: licenses.length,
      action: 'DELETE_ALL_LICENSES',
    },
    {
      id: 'delete-expired-users',
      label: 'Delete ALL Expired Users',
      description: `Remove users with expired accounts`,
      icon: Users,
      variant: 'warning',
      count: users.filter((u) => {
        if (u.expiry) {
          const d = new Date(u.expiry);
          return d.getTime() <= Date.now();
        }
        return false;
      }).length,
      action: 'DELETE_EXPIRED_USERS',
    },
    {
      id: 'delete-terminated',
      label: 'Delete ALL Terminated Sessions',
      description: `Remove ${terminatedSessions.length} terminated/expired sessions`,
      icon: FileText,
      variant: 'warning',
      count: terminatedSessions.length,
      action: 'DELETE_TERMINATED_SESSIONS',
    },
    {
      id: 'delete-old-logs',
      label: `Delete Activity Logs Older Than ${olderThanDays} Days`,
      description: `Remove activity logs older than ${olderThanDays} days`,
      icon: Clock,
      variant: 'warning',
      count: -1,
      action: 'DELETE_OLD_LOGS',
    },
  ];

  const handleExecute = async () => {
    if (!confirmOperation) return;
    setExecuting(true);
    try {
      // Simulate API call - in production this would call malikAuthService
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccessMsg(`Operation "${confirmOperation.label}" completed successfully!`);
      setConfirmOperation(null);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Bulk operation failed:', err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trash2}
        accent="rose"
        title="Bulk Delete Panel"
        subtitle="Mass delete operations for licenses, users, and sessions"
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 dark:bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Warning: Destructive Operations</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              These operations are irreversible. Always ensure you have backups before performing bulk deletions.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Licenses', value: licenses.length, color: 'brand' },
          { label: 'Total Users', value: users.length, color: 'violet' },
          { label: 'Active Sessions', value: sessions.filter((s) => s.status === 'Active').length, color: 'emerald' },
          { label: 'Expired Items', value: expiredLicenses.length, color: 'amber' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {operations.map((op) => {
          const Icon = op.icon;
          return (
            <Card
              key={op.id}
              className={`p-5 transition-all hover:shadow-md ${
                op.variant === 'danger'
                  ? 'border-rose-500/20 hover:border-rose-500/40'
                  : 'border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      op.variant === 'danger'
                        ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white">{op.label}</h4>
                    <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{op.description}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                    op.variant === 'danger'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {op.count >= 0 ? op.count : '~'}
                </span>
              </div>

              {op.id === 'delete-old-logs' && (
                <div className="mt-3 flex items-center gap-2">
                  <FieldLabel>Older than (days)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={olderThanDays}
                    onChange={(e) => setOlderThanDays(Math.max(1, Number(e.target.value)))}
                    className="input w-20 py-1 text-xs"
                  />
                </div>
              )}

              <button
                onClick={() => setConfirmOperation(op)}
                disabled={op.count === 0}
                className={`mt-4 w-full text-xs ${
                  op.variant === 'danger' ? 'btn-danger' : 'btn-ghost'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Execute Delete</span>
              </button>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmOperation}
        title={confirmOperation?.label || ''}
        message={
          confirmOperation
            ? `Are you sure you want to ${confirmOperation.label.toLowerCase()}? ${
                confirmOperation.count >= 0
                  ? `This will permanently delete ${confirmOperation.count} item(s).`
                  : 'This action is irreversible.'
              } This action cannot be undone.`
            : ''
        }
        confirmLabel={executing ? 'Processing...' : 'Yes, Delete'}
        variant="danger"
        isLoading={executing}
        onConfirm={handleExecute}
        onClose={() => setConfirmOperation(null)}
      />
    </div>
  );
};
