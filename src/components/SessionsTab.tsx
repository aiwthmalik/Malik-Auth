import React, { useState } from 'react';
import {
  Radio,
  Power,
  Search,
  Trash2
} from 'lucide-react';
import { MalikSession } from '../types';
import { terminateSession, deleteSession } from '../lib/malikAuthService';
import { formatPKTDateTime } from '../lib/dateUtils';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';
import { PageHeader, StatusBadge, EmptyState, TableShell, Sensitive } from './ui';

interface SessionsTabProps {
  appId: string;
  sessions: MalikSession[];
  onRefresh: () => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ appId, sessions, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [sessionToKill, setSessionToKill] = useState<MalikSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<MalikSession | null>(null);
  const [terminating, setTerminating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmKillSession = async () => {
    if (!sessionToKill || !sessionToKill.id) return;
    setTerminating(true);
    try {
      await terminateSession(sessionToKill.id, sessionToKill.sessionId, appId);
      setSessionToKill(null);
      onRefresh();
    } catch (err) {
      console.error('Error terminating session:', err);
    } finally {
      setTerminating(false);
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete || !sessionToDelete.id) return;
    setDeleting(true);
    try {
      await deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Error deleting session log:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.hwid.toLowerCase().includes(search.toLowerCase()) ||
      s.sessionId.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = sessions.filter((s) => s.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <PageHeader
        icon={Radio}
        accent="emerald"
        title="Live Connected Sessions"
        subtitle="Real-time heartbeat monitoring for active client connections."
      />

      {/* Search */}
      <div className="card flex items-center justify-between p-4">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
          <input
            type="text"
            placeholder="Search username, session ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input py-2 pl-9 text-xs"
          />
        </div>
        <span className="hidden text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:inline">
          {activeCount} Active Heartbeats
        </span>
      </div>

      {/* Sessions Table */}
      <TableShell
        headers={['Username', 'Session ID', 'HWID', 'IP Address', 'Status', 'Last Heartbeat', 'Actions']}
        empty={
          <EmptyState
            icon={Radio}
            title="No live sessions"
            message="No live sessions connected. Sessions will appear in real time when users connect from your software."
          />
        }
      >
        {filteredSessions.map((s) => {
          const rowMenuItems: ActionMenuItem[] = [
            ...(s.status === 'Active'
              ? [
                  {
                    label: 'Kill Live Session',
                    icon: Power,
                    variant: 'danger' as const,
                    onClick: () => setSessionToKill(s),
                  },
                ]
              : []),
            {
              label: 'Delete Session Log',
              icon: Trash2,
              variant: 'danger' as const,
              onClick: () => setSessionToDelete(s),
            },
          ];

          return (
            <tr key={s.id || s.sessionId} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5 font-bold text-surface-900 dark:text-white">
                {s.username}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs font-bold text-brand-700 dark:text-brand-300">
                <Sensitive value={s.sessionId} />
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
                {s.hwid ? <Sensitive value={s.hwid} className="font-medium" /> : <span className="text-surface-400 dark:text-surface-500">—</span>}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-600 dark:text-surface-400">
                {s.ipAddress ? <Sensitive value={s.ipAddress} className="font-medium" /> : <span className="text-surface-400 dark:text-surface-500">—</span>}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={s.status} />
              </td>
              <td className="px-4 py-3.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                {formatPKTDateTime(s.lastHeartbeat)}
              </td>
              <td className="px-4 py-3.5 text-right">
                <ActionMenu items={rowMenuItems} align="right" />
              </td>
            </tr>
          );
        })}
      </TableShell>

      <ConfirmModal
        isOpen={!!sessionToKill}
        title="Kill Live Connected Session"
        message={`Are you sure you want to kill the active session for user "${sessionToKill?.username}"? Their application client will terminate immediately.`}
        confirmLabel="Kill Session"
        isLoading={terminating}
        onConfirm={confirmKillSession}
        onClose={() => setSessionToKill(null)}
      />

      <ConfirmModal
        isOpen={!!sessionToDelete}
        title="Delete Session Log"
        message={`Are you sure you want to delete session log "${sessionToDelete?.sessionId}" for user "${sessionToDelete?.username}"? This action is irreversible.`}
        confirmLabel="Delete Session Log"
        isLoading={deleting}
        onConfirm={confirmDeleteSession}
        onClose={() => setSessionToDelete(null)}
      />
    </div>
  );
};