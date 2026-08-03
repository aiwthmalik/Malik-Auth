import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { MalikUser } from '../types';
import { PageHeader, StatusBadge, EmptyState, TableShell, Sensitive, FieldLabel } from './ui';

interface ClientTwoFactorProps {
  appId: string;
  users: MalikUser[];
  onRefresh: () => void;
}

interface User2FA {
  userId: string;
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  lastVerified?: string;
}

function generateSecret(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(code);
  }
  return codes;
}

export const ClientTwoFactor: React.FC<ClientTwoFactorProps> = ({
  appId,
  users,
  onRefresh,
}) => {
  const [user2faMap, setUser2faMap] = useState<Record<string, User2FA>>({});
  const [setupModalUser, setSetupModalUser] = useState<MalikUser | null>(null);
  const [setupStep, setSetupStep] = useState<'secret' | 'verify'>('secret');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [disableModalUser, setDisableModalUser] = useState<MalikUser | null>(null);
  const [disableCode, setDisableCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [search, setSearch] = useState('');

  const handleStartSetup = (user: MalikUser) => {
    const secret = generateSecret(32);
    const backupCodes = generateBackupCodes(8);
    setUser2faMap((prev) => ({
      ...prev,
      [user.id || user.username]: {
        userId: user.id || user.username,
        enabled: false,
        secret,
        backupCodes,
      },
    }));
    setSetupModalUser(user);
    setSetupStep('secret');
    setVerifyCode('');
    setVerifyError('');
  };

  const handleVerifySetup = () => {
    if (verifyCode.length !== 6 || !/^\d{6}$/.test(verifyCode)) {
      setVerifyError('Please enter a valid 6-digit code.');
      return;
    }
    const key = setupModalUser?.id || setupModalUser?.username || '';
    setUser2faMap((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: true,
        lastVerified: new Date().toISOString(),
      },
    }));
    setSetupModalUser(null);
    setVerifyCode('');
    setVerifyError('');
    onRefresh();
  };

  const handleDisable = () => {
    if (!disableModalUser) return;
    const key = disableModalUser.id || disableModalUser.username;
    if (!/^\d{6}$/.test(disableCode)) {
      setVerifyError('Enter a valid 6-digit code to disable 2FA.');
      return;
    }
    setUser2faMap((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: false,
        secret: undefined,
        backupCodes: undefined,
      },
    }));
    setDisableModalUser(null);
    setDisableCode('');
    setVerifyError('');
    onRefresh();
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyBackupCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const get2FAStatus = (user: MalikUser): boolean => {
    const key = user.id || user.username;
    return user2faMap[key]?.enabled ?? false;
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        accent="violet"
        title="Client Two-Factor Authentication"
        subtitle="Manage 2FA settings for end users of your application."
      />

      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input py-2 pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
          <span>
            <span className="font-semibold text-violet-600 dark:text-violet-400">
              {users.filter((u) => get2FAStatus(u)).length}
            </span>{' '}
            / {users.length} users with 2FA
          </span>
        </div>
      </div>

      <TableShell
        headers={['User', '2FA Status', 'Last Verified', 'Actions']}
        empty={
          <EmptyState
            icon={ShieldCheck}
            title="No users found"
            message="Add users to manage their two-factor authentication settings."
          />
        }
      >
        {filteredUsers.map((user) => {
          const key = user.id || user.username;
          const is2FAEnabled = get2FAStatus(user);
          const user2fa = user2faMap[key];

          return (
            <tr key={key} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5">
                <span className="text-sm font-medium text-surface-900 dark:text-white">{user.username}</span>
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={is2FAEnabled ? 'Active' : 'Disabled'} />
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
                {user2fa?.lastVerified ? new Date(user2fa.lastVerified).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  {!is2FAEnabled ? (
                    <button
                      onClick={() => handleStartSetup(user)}
                      className="btn-primary text-[11px] py-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Enable 2FA</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setDisableModalUser(user); setDisableCode(''); setVerifyError(''); }}
                      className="btn-ghost text-[11px] py-1.5 text-rose-500 hover:text-rose-600"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Disable 2FA</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </TableShell>

      {setupModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Enable 2FA</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">For user: {setupModalUser.username}</p>
                </div>
              </div>
              <button onClick={() => setSetupModalUser(null)} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {setupStep === 'secret' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs font-bold text-surface-700 dark:text-surface-300 mb-2">TOTP Secret</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-white px-3 py-2 font-mono text-sm text-surface-800 dark:bg-white/[0.06] dark:text-surface-200">
                      {user2faMap[setupModalUser.id || setupModalUser.username]?.secret || ''}
                    </code>
                    <button
                      onClick={() => copySecret(user2faMap[setupModalUser.id || setupModalUser.username]?.secret || '')}
                      className="p-2 text-surface-400 hover:text-surface-700 dark:hover:text-white"
                    >
                      {copiedSecret ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center py-4">
                  <div className="h-40 w-40 rounded-xl border border-surface-200 bg-white flex items-center justify-center dark:border-white/10 dark:bg-white/[0.03]">
                    <svg viewBox="0 0 200 200" className="h-32 w-32 text-surface-300 dark:text-surface-600">
                      <rect width="200" height="200" fill="currentColor" opacity="0.05" rx="8" />
                      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fill="currentColor">
                        QR Code Placeholder
                      </text>
                    </svg>
                  </div>
                </div>

                <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
                  Scan this QR code with your authenticator app, or manually enter the secret key above.
                </p>

                {user2faMap[setupModalUser.id || setupModalUser.username]?.backupCodes && (
                  <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-surface-700 dark:text-surface-300">Backup Recovery Codes</p>
                      <button
                        onClick={() => copyBackupCodes(user2faMap[setupModalUser.id || setupModalUser.username]?.backupCodes || [])}
                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                      >
                        {copiedCodes ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {user2faMap[setupModalUser.id || setupModalUser.username]?.backupCodes?.map((code, i) => (
                        <code key={i} className="rounded bg-white px-2 py-1 font-mono text-xs text-surface-700 dark:bg-white/[0.06] dark:text-surface-300">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                  <button onClick={() => setSetupModalUser(null)} className="btn-ghost text-xs">
                    Cancel
                  </button>
                  <button onClick={() => setSetupStep('verify')} className="btn-primary text-xs">
                    Next: Verify Setup
                  </button>
                </div>
              </div>
            )}

            {setupStep === 'verify' && (
              <div className="space-y-4">
                <p className="text-xs text-surface-600 dark:text-surface-400">
                  Enter the 6-digit code from your authenticator app to verify the setup.
                </p>
                <div>
                  <FieldLabel required>Verification Code</FieldLabel>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '')); setVerifyError(''); }}
                    placeholder="000000"
                    className="input text-center font-mono text-lg tracking-[0.3em]"
                  />
                </div>

                {verifyError && (
                  <p className="text-xs text-rose-500">{verifyError}</p>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                  <button onClick={() => setSetupStep('secret')} className="btn-ghost text-xs">
                    Back
                  </button>
                  <button onClick={handleVerifySetup} className="btn-primary text-xs">
                    Verify & Enable 2FA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {disableModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Disable 2FA</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">For user: {disableModalUser.username}</p>
                </div>
              </div>
              <button onClick={() => setDisableModalUser(null)} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-surface-600 dark:text-surface-400">
                Enter your current 6-digit 2FA code to confirm disabling two-factor authentication.
              </p>
              <div>
                <FieldLabel required>Current 2FA Code</FieldLabel>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => { setDisableCode(e.target.value.replace(/\D/g, '')); setVerifyError(''); }}
                  placeholder="000000"
                  className="input text-center font-mono text-lg tracking-[0.3em]"
                />
              </div>

              {verifyError && (
                <p className="text-xs text-rose-500">{verifyError}</p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button onClick={() => setDisableModalUser(null)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button onClick={handleDisable} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-rose-700">
                  Disable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
