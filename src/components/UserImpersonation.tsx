import React, { useState } from 'react';
import {
  UserCog,
  AlertTriangle,
  LogOut,
  User,
  Shield,
  Search
} from 'lucide-react';
import { MalikUser } from '../types';
import { Card, PageHeader, EmptyState, TableShell, StatusBadge } from './ui';

interface UserImpersonationProps {
  appId: string;
  users: MalikUser[];
}

export const UserImpersonation: React.FC<UserImpersonationProps> = ({ appId, users }) => {
  const [selectedUser, setSelectedUser] = useState<MalikUser | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [search, setSearch] = useState('');
  const [impersonationSession, setImpersonationSession] = useState<{
    user: MalikUser;
    startedAt: Date;
    sessionId: string;
  } | null>(null);

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleImpersonate = (user: MalikUser) => {
    setSelectedUser(user);
  };

  const confirmImpersonation = () => {
    if (!selectedUser) return;

    const sessionId = `IMPERSONATE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    setImpersonating(true);

    setTimeout(() => {
      setImpersonationSession({
        user: selectedUser,
        startedAt: new Date(),
        sessionId,
      });
      setImpersonating(false);
      setSelectedUser(null);
    }, 1500);
  };

  const endImpersonation = () => {
    setImpersonationSession(null);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        title="User Impersonation"
        subtitle="Admin tool for debugging user sessions. Use with caution."
        accent="amber"
      />

      {impersonationSession && (
        <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  Impersonating User: {impersonationSession.user.username}
                </h4>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                  Session started {impersonationSession.startedAt.toLocaleTimeString()} • ID: {impersonationSession.sessionId}
                </p>
              </div>
            </div>
            <button
              onClick={endImpersonation}
              className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-500/30 dark:text-amber-300"
            >
              <LogOut className="h-4 w-4" />
              End Impersonation
            </button>
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
          <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
            <Shield className="h-4 w-4 text-amber-500" />
            Select User to Impersonate
          </h3>
          <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
            Choose a user to create a temporary debugging session
          </p>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2 pl-9 text-xs"
            />
          </div>
        </div>

        <TableShell
          headers={['Username', 'Email', 'Status', 'HWID', 'Last Seen', 'Actions']}
          empty={
            <EmptyState
              icon={User}
              title="No users found"
              message="No users match your search criteria."
            />
          }
        >
          {filteredUsers.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5">
                <span className="font-semibold text-surface-900 dark:text-white">{user.username}</span>
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
                {user.email || '—'}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-600 dark:text-surface-400">
                {user.hwid ? `${user.hwid.substring(0, 12)}...` : '—'}
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-500 dark:text-surface-400">
                {user.lastSeen || 'Never'}
              </td>
              <td className="px-4 py-3.5 text-right">
                <button
                  onClick={() => handleImpersonate(user)}
                  disabled={impersonating || !!impersonationSession}
                  className="btn-ghost text-xs"
                >
                  <UserCog className="h-3.5 w-3.5" />
                  Impersonate
                </button>
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Confirm Impersonation</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    You are about to impersonate a user
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">Warning</p>
                    <p className="mt-1 text-amber-600/80 dark:text-amber-400/80">
                      You will be logged in as <strong>{selectedUser.username}</strong>.
                      All actions will be performed under this user's identity.
                      This session will be logged for audit purposes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Username:</span>
                    <span className="font-semibold text-surface-900 dark:text-white">{selectedUser.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Status:</span>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Role:</span>
                    <span className="font-medium text-surface-700 dark:text-surface-300">{selectedUser.role || 'User'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button onClick={() => setSelectedUser(null)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button
                  onClick={confirmImpersonation}
                  disabled={impersonating}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600"
                >
                  {impersonating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Session...
                    </>
                  ) : (
                    <>
                      <UserCog className="h-4 w-4" />
                      Start Impersonation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
