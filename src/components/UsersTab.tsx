import React, { useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Cpu,
  Check,
  UserPlus,
  Plus,
  X,
  Clock
} from 'lucide-react';
import { MalikUser } from '../types';
import { resetUserHwid, updateUserStatus, deleteUser, createUser, logActivity } from '../lib/malikAuthService';
import { formatCustomExpiryDate, parseExpiryToDate, TIMEZONE_LABEL } from '../lib/dateUtils';
import { ExpiryCountdown } from './ExpiryCountdown';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';
import { ExtendExpiryModal } from './ExtendExpiryModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PageHeader, StatusBadge, EmptyState, TableShell, Sensitive, FieldLabel } from './ui';

interface UsersTabProps {
  appId: string;
  users: MalikUser[];
  onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ appId, users, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<MalikUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [userToResetHwid, setUserToResetHwid] = useState<MalikUser | null>(null);
  const [expiryModalUser, setExpiryModalUser] = useState<MalikUser | null>(null);
  const [updatingExpiry, setUpdatingExpiry] = useState(false);

  // Custom user creation state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [expiryMode, setExpiryMode] = useState<'30days' | '1day' | '7days' | '365days' | 'lifetime' | 'custom'>('30days');
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('23:59');
  const [creatingUser, setCreatingUser] = useState(false);

  const computeExpiryString = () => {
    if (expiryMode === 'lifetime') {
      return 'Lifetime (Never Expires)';
    }
    let d: Date;
    if (expiryMode === '1day') {
      d = new Date(Date.now() + 1 * 86400000);
    } else if (expiryMode === '7days') {
      d = new Date(Date.now() + 7 * 86400000);
    } else if (expiryMode === '30days') {
      d = new Date(Date.now() + 30 * 86400000);
    } else if (expiryMode === '365days') {
      d = new Date(Date.now() + 365 * 86400000);
    } else {
      // Custom Date & Time
      const [year, month, day] = customDate.split('-').map(Number);
      const [hours, minutes] = customTime.split(':').map(Number);
      d = new Date(year, month - 1, day, hours, minutes, 0);
    }
    return formatCustomExpiryDate(d);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Username and Password are required.');
      return;
    }
    const finalExpiry = computeExpiryString();
    setCreatingUser(true);
    try {
      await createUser(appId, newUsername.trim(), newPassword.trim(), newEmail.trim(), finalExpiry);
      setNewUsername('');
      setNewPassword('');
      setNewEmail('');
      setIsModalOpen(false);
      setSuccessMsg(`Custom user ${newUsername} created successfully!`);
      onRefresh();
    } catch (err: any) {
      console.error('Error creating user:', err);
    } finally {
      setCreatingUser(false);
    }
  };

  const confirmResetHwid = async () => {
    if (!userToResetHwid || !userToResetHwid.id) return;
    setResettingId(userToResetHwid.id);
    try {
      await resetUserHwid(userToResetHwid.id, userToResetHwid.username, appId);
      setSuccessMsg(`HWID reset for ${userToResetHwid.username}. Hardware lock cleared!`);
      setUserToResetHwid(null);
      onRefresh();
    } catch (err) {
      console.error('Error resetting HWID:', err);
    } finally {
      setResettingId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !userToDelete.id) return;
    setDeletingUser(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleToggleBan = async (user: MalikUser) => {
    if (!user.id) return;
    const nextStatus = user.status === 'Banned' ? 'Active' : 'Banned';
    await updateUserStatus(user.id, nextStatus);
    await logActivity(
      appId,
      'USER_LOGIN',
      'Admin',
      user.hwid,
      `Changed user ${user.username} status to ${nextStatus}`
    );
    onRefresh();
  };

  const handleSaveUserExpiry = async (newExpiryStr: string) => {
    if (!expiryModalUser || !expiryModalUser.id) return;
    setUpdatingExpiry(true);
    try {
      await updateDoc(doc(db, 'users', expiryModalUser.id), { expiry: newExpiryStr });
      await logActivity(
        appId,
        'USER_LOGIN',
        'Admin',
        expiryModalUser.hwid,
        `Updated expiry for user ${expiryModalUser.username} to ${newExpiryStr}`
      );
      setExpiryModalUser(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update user expiry:', err);
    } finally {
      setUpdatingExpiry(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.hwid.toLowerCase().includes(search.toLowerCase()) ||
      u.licenseKey.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        icon={Cpu}
        accent="violet"
        title="End Users Management"
        subtitle="Monitor authenticated users, hardware locks, and access expiry."
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" />
            <span>Create Custom User</span>
          </button>
        }
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card flex items-center justify-between p-4">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
          <input
            type="text"
            placeholder="Search username, HWID, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input py-2 pl-9 text-xs"
          />
        </div>
        <span className="hidden text-xs font-medium text-surface-500 dark:text-surface-400 sm:inline">
          Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Users Table */}
      <TableShell
        headers={['Username', 'HWID (Hardware ID)', 'License Key', 'Expiry & Countdown', 'IP Address', 'Status', 'Actions']}
        empty={
          <EmptyState
            icon={Users}
            title="No users found"
            message="No authenticated end users found. Users will appear automatically here in real time when they authenticate from your application."
          />
        }
      >
        {filteredUsers.map((user) => {
          const targetDate = parseExpiryToDate(user.expiry);
          const isTimePassed = targetDate ? targetDate.getTime() <= Date.now() : false;
          const effectiveStatus = user.status === 'Active' && isTimePassed ? 'Expired' : user.status;

          const rowMenuItems: ActionMenuItem[] = [
            {
              label: resettingId === user.id ? 'Resetting...' : 'Reset HWID Lock',
              icon: RefreshCw,
              disabled: resettingId === user.id,
              onClick: () => setUserToResetHwid(user),
            },
            {
              label: 'Extend / Change Expiry',
              icon: Clock,
              variant: 'indigo',
              onClick: () => setExpiryModalUser(user),
            },
            {
              label: user.status === 'Banned' ? 'Unban User' : 'Ban User',
              icon: user.status === 'Banned' ? ShieldCheck : ShieldAlert,
              variant: user.status === 'Banned' ? 'success' : 'danger',
              onClick: () => handleToggleBan(user),
            },
            {
              label: 'Delete User Record',
              icon: Trash2,
              variant: 'danger',
              onClick: () => setUserToDelete(user),
            },
          ];

          return (
            <tr key={user.id || user.username} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5 font-bold text-surface-900 dark:text-white">
                {user.username}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
                {user.hwid === 'RESET_PENDING' ? (
                  <span className="inline-flex rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-400">
                    RESET_PENDING (Awaiting New HWID)
                  </span>
                ) : (
                  <Sensitive value={user.hwid || 'N/A'} className="font-medium" />
                )}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs font-bold text-brand-700 dark:text-brand-300">
                {user.licenseKey ? <Sensitive value={user.licenseKey} /> : <span className="text-surface-400 dark:text-surface-500">N/A</span>}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
                <ExpiryCountdown expiryStr={user.expiry} />
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-600 dark:text-surface-400">
                {user.ipAddress ? (
                  <Sensitive value={user.ipAddress} className="font-medium" />
                ) : (
                  <span className="text-surface-400 dark:text-surface-500">—</span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={effectiveStatus} />
              </td>
              <td className="px-4 py-3.5 text-right">
                <ActionMenu items={rowMenuItems} align="right" />
              </td>
            </tr>
          );
        })}
      </TableShell>

      {/* Pop-up User Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Create Custom User</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Create an end user with custom expiry without requiring a key
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Username</FieldLabel>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. malik_pro_user"
                    className="input"
                  />
                </div>
                <div>
                  <FieldLabel required>Password</FieldLabel>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. StrongPass!2026"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Email (Optional)</FieldLabel>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="input"
                />
              </div>

              {/* Improved Expiry Selection */}
              <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                    <Clock className="h-4 w-4 text-violet-500" />
                    <span>Expiry Duration / Time ({TIMEZONE_LABEL})</span>
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-violet-600 dark:text-violet-300">
                    {computeExpiryString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['1day', '1 Day (24h)'],
                    ['7days', '7 Days (1 Week)'],
                    ['30days', '30 Days (1 Month)'],
                    ['365days', '365 Days (1 Year)'],
                    ['lifetime', 'Lifetime (Never)'],
                    ['custom', 'Custom Date/Time'],
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExpiryMode(mode)}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ${
                        expiryMode === mode
                          ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-600/20'
                          : 'border-surface-200 bg-white text-surface-700 hover:bg-surface-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-200 dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {expiryMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 border-t border-surface-200 pt-3 dark:border-white/10">
                    <div>
                      <FieldLabel>Calendar Date</FieldLabel>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="input py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <FieldLabel>Time</FieldLabel>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="input py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="btn-primary text-xs"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!userToResetHwid}
        title="Reset Hardware ID (HWID) Lock"
        message={`Are you sure you want to reset HWID lock for user "${userToResetHwid?.username}"? The next PC that logs in with this user will claim the hardware authorization.`}
        confirmLabel="Reset HWID Lock"
        variant="warning"
        isLoading={resettingId === userToResetHwid?.id}
        onConfirm={confirmResetHwid}
        onClose={() => setUserToResetHwid(null)}
      />

      <ConfirmModal
        isOpen={!!userToDelete}
        title="Delete End User Record"
        message={`Are you sure you want to delete user "${userToDelete?.username}"? This action is irreversible.`}
        confirmLabel="Delete User"
        isLoading={deletingUser}
        onConfirm={confirmDeleteUser}
        onClose={() => setUserToDelete(null)}
      />

      <ExtendExpiryModal
        isOpen={!!expiryModalUser}
        title={`Extend / Change Expiry for User "${expiryModalUser?.username}"`}
        currentExpiry={expiryModalUser?.expiry}
        isLoading={updatingExpiry}
        onSave={handleSaveUserExpiry}
        onClose={() => setExpiryModalUser(null)}
      />
    </div>
  );
};