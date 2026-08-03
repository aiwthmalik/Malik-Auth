import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Radio,
  Users,
  Key,
  Save,
  Lock,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { MalikApp, MalikLicense, MalikUser, MalikSession, MalikActivityLog } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';
import { isExpired } from '../lib/dateUtils';
import { Card, FieldLabel, Sensitive } from './ui';
import { GlobalStats } from './GlobalStats';

interface DashboardOverviewProps {
  app: MalikApp;
  licenses: MalikLicense[];
  users: MalikUser[];
  sessions: MalikSession[];
  logs: MalikActivityLog[];
  allApps?: MalikApp[];
  allLicenses?: MalikLicense[];
  allUsers?: MalikUser[];
  allSessions?: MalikSession[];
  onRefresh: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  app,
  licenses,
  users,
  sessions,
  logs,
  allApps,
  allLicenses,
  allUsers,
  allSessions,
  onRefresh,
  onNavigateToTab,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [motd, setMotd] = useState(app.motd || '');
  const [version, setVersion] = useState(app.version || '1.0.0');
  const [status, setStatus] = useState(app.status || 'Active');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id && !app.appId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      if (app.id) {
        await updateApp(app.id, { motd, version, status: status as any });
      }
      await logActivity(app.appId, 'REMOTE_SYNC', 'Developer', 'SYS', `Updated MOTD/Version to v${version} [Status: ${status}]`);
      setSaveMessage('Settings updated successfully & synchronized across connected clients');
      onRefresh();
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveMessage('Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const activeLicenses = licenses.filter((l) => (l.status === 'Active' || l.status === 'Unused') && !isExpired(l.expiry)).length;
  const activeUsersCount = users.filter((u) => u.status === 'Active' && !isExpired(u.expiry)).length;
  const activeSessions = sessions.filter((s) => s.status === 'Active').length;

  const stats = [
    {
      label: 'Available & Active Keys',
      value: activeLicenses,
      sub: `${licenses.length} Total Keys`,
      icon: Key,
      color: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
      tab: 'licenses',
    },
    {
      label: 'Authenticated Users',
      value: users.length,
      sub: 'HWID Locked',
      icon: Users,
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      tab: 'users',
    },
    {
      label: 'Live Connected Sessions',
      value: activeSessions,
      sub: 'Heartbeat Live',
      icon: Radio,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      tab: 'sessions',
    },
  ];

  const credFields = [
    { label: 'App ID (10 Chars)', value: app.appId, hint: 'Used in client initialization', mono: true, color: 'text-brand-500' },
    { label: 'Owner ID (5 Chars)', value: app.ownerId || 'N/A', hint: 'Account identifier', mono: true, color: 'text-surface-800 dark:text-surface-100' },
    { label: 'App Secret (Hover to Reveal)', value: (app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, ''), hint: 'Cryptographic Signature', mono: true, color: 'text-surface-900 dark:text-white', sensitive: true },
    { label: 'AES-256 Sync Key (Hover to Reveal)', value: app.encryptionKey, hint: 'Remote variables key', mono: true, color: 'text-emerald-700 dark:text-emerald-400', sensitive: true },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <GlobalStats
        apps={allApps || [app]}
        licenses={allLicenses || licenses}
        users={allUsers || users}
        sessions={allSessions || sessions}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} onClick={() => onNavigateToTab(s.tab)} className="group p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                {s.label}
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">{s.value}</span>
              <span className="flex items-center gap-1 text-xs font-medium text-surface-500 dark:text-surface-400">
                {s.sub}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Credentials & Config */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Credentials */}
        <Card className="space-y-5 p-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Lock className="h-4 w-4 text-brand-500" />
                MalikAuth / KeyAuth Credentials
              </h2>
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                Pass these values into your client application initialization. Hover over blurred fields to reveal.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {credFields.map((f) => (
              <div key={f.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400">
                    {f.label}
                  </label>
                  <span className="text-[11px] text-surface-400">{f.hint}</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={f.value}
                    className={`input select-all pr-10 font-mono ${f.color} ${f.sensitive ? 'blur-[5px] hover:blur-none' : ''}`}
                    title={f.sensitive ? 'Hover to reveal' : undefined}
                  />
                  <button
                    onClick={() => copyToClipboard(f.value, f.label)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white"
                    title="Copy"
                  >
                    {copiedField === f.label ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* MOTD & Version */}
        <form onSubmit={handleSaveSettings} className="card flex flex-col justify-between space-y-4 p-6">
          <div>
            <div className="mb-4 border-b border-surface-200 pb-3 dark:border-white/10">
              <h3 className="text-base font-bold tracking-tight">App Config & MOTD</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">Live variables pushed to all clients upon launch.</p>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel>Client Build Version</FieldLabel>
                <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className="input font-mono" />
              </div>
              <div>
                <FieldLabel>Application Status</FieldLabel>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="select">
                  <option value="Active">Active (Accepting Logins)</option>
                  <option value="Maintenance">Maintenance (Block New Logins)</option>
                  <option value="Disabled">Disabled (Revoke All Access)</option>
                </select>
              </div>
              <div>
                <FieldLabel>Message of the Day (MOTD)</FieldLabel>
                <textarea rows={3} value={motd} onChange={(e) => setMotd(e.target.value)} placeholder="Welcome message or server status news for users" className="input resize-none" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            {saveMessage && (
              <div className="mb-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {saveMessage}
              </div>
            )}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              <Save className="h-4 w-4" />
              {saving ? 'Syncing...' : 'Save & Push to Clients'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};