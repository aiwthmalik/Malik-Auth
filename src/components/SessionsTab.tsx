import React, { useState } from 'react';
import {
  Radio,
  Power,
  Search,
  Check,
  Trash2
} from 'lucide-react';
import { MalikSession } from '../types';
import { terminateSession, deleteSession } from '../lib/malikAuthService';
import { formatPKTDateTime } from '../lib/dateUtils';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';

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

  return (
    <div className="space-y-6">
      {/* Banner (Minimal) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Live Connected Sessions</h2>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search username, session ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          {filteredSessions.filter((s) => s.status === 'Active').length} Active Heartbeats
        </span>
      </div>

      {/* Sessions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No live sessions connected. Sessions will appear in real time when users connect from your software.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold">Username</th>
                  <th className="py-3.5 px-4 font-semibold">Session ID (Hover to Reveal)</th>
                  <th className="py-3.5 px-4 font-semibold">HWID</th>
                  <th className="py-3.5 px-4 font-semibold">IP Address</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Last Heartbeat</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                    <tr key={s.id || s.sessionId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {s.username}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-indigo-700">
                        <span
                          className="blur-xs hover:blur-none transition-all duration-200 cursor-pointer select-all"
                          title="Hover to reveal Session ID"
                        >
                          {s.sessionId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {s.hwid ? (
                          <span
                            className="blur-xs hover:blur-none transition-all duration-200 cursor-pointer select-all"
                            title="Hover to reveal HWID"
                          >
                            {s.hwid}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {s.ipAddress ? (
                          <span
                            className="blur-xs hover:blur-none transition-all duration-200 cursor-pointer select-all"
                            title="Hover to reveal IP Address"
                          >
                            {s.ipAddress}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            s.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                        {formatPKTDateTime(s.lastHeartbeat)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ActionMenu items={rowMenuItems} align="right" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
