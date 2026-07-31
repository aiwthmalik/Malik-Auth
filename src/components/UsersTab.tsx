import React, { useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Cpu,
  Clock,
  Check,
  UserPlus,
  Plus,
  X,
  Calendar
} from 'lucide-react';
import { MalikUser } from '../types';
import { resetUserHwid, updateUserStatus, deleteUser, createUser, logActivity } from '../lib/malikAuthService';

interface UsersTabProps {
  appId: string;
  users: MalikUser[];
  onRefresh: () => void;
}

const formatCustomExpiryDate = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `[${day}/${month}/${year}][${pad(hours)}:${minutes}:${seconds} ${ampm}]`;
};

export const UsersTab: React.FC<UsersTabProps> = ({ appId, users, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const handleHwidReset = async (user: MalikUser) => {
    if (!user.id) return;
    if (!window.confirm(`Reset HWID lock for user ${user.username}? The next PC to login will claim this license.`)) {
      return;
    }
    setResettingId(user.id);
    try {
      await resetUserHwid(user.id, user.username, appId);
      setSuccessMsg(`HWID reset for ${user.username}. Hardware lock cleared!`);
      onRefresh();
    } catch (err) {
      console.error('Error resetting HWID:', err);
    } finally {
      setResettingId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
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

  const handleDelete = async (user: MalikUser) => {
    if (!user.id) return;
    if (!window.confirm(`Delete user record ${user.username}?`)) return;
    await deleteUser(user.id);
    onRefresh();
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">End Users & Hardware ID (HWID) Lock</h2>
            <p className="text-xs text-slate-500">
              Manage authenticated client machines, inspect hardware UUIDs, and perform 1-click HWID resets.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm shadow-violet-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Custom User</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search username, HWID, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No authenticated end users found. Users will appear automatically here in real time when they authenticate from your application.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold">Username</th>
                  <th className="py-3.5 px-4 font-semibold">HWID (Hardware ID)</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">License Key</th>
                  <th className="py-3.5 px-4 font-semibold">Expiry</th>
                  <th className="py-3.5 px-4 font-semibold">IP Address</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">HWID Reset & Ban</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id || user.username} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {user.username}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {user.hwid === 'RESET_PENDING' ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          RESET_PENDING (Awaiting New HWID)
                        </span>
                      ) : (
                        user.hwid
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-700">
                      {user.licenseKey}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {user.expiry || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {user.ipAddress}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleHwidReset(user)}
                          disabled={resettingId === user.id}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                          title="Reset Hardware ID lock"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${resettingId === user.id ? 'animate-spin' : ''}`} />
                          <span>Reset HWID</span>
                        </button>

                        <button
                          onClick={() => handleToggleBan(user)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                            user.status === 'Banned'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          {user.status === 'Banned' ? 'Unban' : 'Ban'}
                        </button>

                        <button
                          onClick={() => handleDelete(user)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete User Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop-up User Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Custom User</h3>
                  <p className="text-xs text-slate-500">
                    Create an end user with custom expiry without requiring a key
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. malik_pro_user"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. StrongPass!2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Improved Expiry Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-violet-600" />
                    <span>Expiry Duration / Time</span>
                  </label>
                  <span className="text-[11px] font-mono text-violet-600 font-semibold">
                    {computeExpiryString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpiryMode('1day')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '1day'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1 Day (24h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('7days')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '7days'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    7 Days (1 Week)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('30days')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '30days'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    30 Days (1 Month)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('365days')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '365days'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    365 Days (1 Year)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('lifetime')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === 'lifetime'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Lifetime (Never)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('custom')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === 'custom'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Custom Date/Time
                  </button>
                </div>

                {expiryMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Calendar Date
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm shadow-violet-600/20"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
