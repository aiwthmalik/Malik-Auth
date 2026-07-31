import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Radio,
  Users,
  Key,
  FileText,
  Save,
  Lock,
  Code,
  Terminal,
  X
} from 'lucide-react';
import { MalikApp, MalikLicense, MalikUser, MalikSession, MalikActivityLog } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';

interface DashboardOverviewProps {
  app: MalikApp;
  licenses: MalikLicense[];
  users: MalikUser[];
  sessions: MalikSession[];
  logs: MalikActivityLog[];
  onRefresh: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  app,
  licenses,
  users,
  sessions,
  logs,
  onRefresh,
  onNavigateToTab,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showInitModal, setShowInitModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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

  const copyInitCode = () => {
    const code = `using MalikAuth;

// MalikAuth / KeyAuth-Style Client Initialization (Filled with your App Details)
public static MalikAuthClient malikAuth = new MalikAuthClient(
    appId: "${app.appId}",
    ownerId: "${app.ownerId || 'owner_78625'}",
    appSecret: "${(app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, '')}",
    version: "${app.version || '1.0.0'}",
    webhookUrl: "${app.discordWebhook || ''}"
);

// Call InitializeAsync() when your application launches
bool ok = await malikAuth.InitializeAsync();
if (!ok) {
    Console.WriteLine("MalikAuth Security Engine initialization failed!");
    Environment.Exit(1);
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id && !app.appId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      if (app.id) {
        await updateApp(app.id, {
          motd,
          version,
          status: status as any,
        });
      }
      await logActivity(
        app.appId,
        'REMOTE_SYNC',
        'Developer',
        'SYS',
        `Updated MOTD/Version to v${version} [Status: ${status}]`
      );
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

  const activeLicenses = licenses.filter((l) => l.status === 'Active' || l.status === 'Unused').length;
  const activeSessions = sessions.filter((s) => s.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Stats Grid at the Very Top (No App Name/Version/ID Banner) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateToTab('licenses')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
              Available & Active Keys
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{activeLicenses}</span>
            <span className="text-xs text-slate-500 font-medium">
              {licenses.length} Total Keys
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('users')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
              Authenticated Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{users.length}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
              <span>HWID Locked</span>
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('sessions')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
              Live Connected Sessions
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{activeSessions}</span>
            <span className="text-xs text-slate-500">Heartbeat Live</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('logs')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
              Audit Logs & Activity
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{logs.length}</span>
            <span className="text-xs text-slate-500">Real-time sync</span>
          </div>
        </div>
      </div>

      {/* API Credentials & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credentials Column */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>MalikAuth / KeyAuth Credentials</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pass these values into your client application initialization. Hover over blurred fields to reveal.
              </p>
            </div>

            <button
              onClick={() => setShowInitModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs border border-indigo-200 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Show Connecting Init Code</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* APP ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  App ID (10 Chars)
                </label>
                <span className="text-[11px] text-slate-400">Used in client initialization</span>
              </div>
              <input
                type="text"
                readOnly
                value={app.appId}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-indigo-700 focus:outline-none select-all"
              />
            </div>

            {/* OWNER ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Owner ID (5 Chars)
                </label>
                <span className="text-[11px] text-slate-400">Account identifier</span>
              </div>
              <input
                type="text"
                readOnly
                value={app.ownerId || 'N/A'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:outline-none select-all"
              />
            </div>

            {/* APP SECRET (Blurred by default, clear on hover) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  App Secret (20 Chars - Hover to Reveal)
                </label>
                <span className="text-[11px] text-slate-400">Cryptographic Signature</span>
              </div>
              <input
                type="text"
                readOnly
                value={(app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, '')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none blur-sm hover:blur-none transition-all duration-200 cursor-pointer select-all"
                title="Hover to reveal secret"
              />
            </div>

            {/* AES ENCRYPTION KEY (Blurred by default, clear on hover) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  AES-256 Remote Sync Encryption Key (Hover to Reveal)
                </label>
                <span className="text-[11px] text-slate-400">Remote variables key</span>
              </div>
              <input
                type="text"
                readOnly
                value={app.encryptionKey}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-700 focus:outline-none blur-sm hover:blur-none transition-all duration-200 cursor-pointer select-all"
                title="Hover to reveal encryption key"
              />
            </div>
          </div>
        </div>

        {/* MOTD & Version Settings Column */}
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">App Config & MOTD</h3>
              <p className="text-xs text-slate-500">
                Live variables pushed to all clients upon launch.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Client Build Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Application Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Active">Active (Accepting Logins)</option>
                  <option value="Maintenance">Maintenance (Block New Logins)</option>
                  <option value="Disabled">Disabled (Revoke All Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Message of the Day (MOTD)
                </label>
                <textarea
                  rows={3}
                  value={motd}
                  onChange={(e) => setMotd(e.target.value)}
                  placeholder="Welcome message or server status news for users"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            {saveMessage && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg mb-2 text-center font-medium">
                {saveMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Syncing...' : 'Save & Push to Clients'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* C# / KeyAuth-style Connecting Code Modal */}
      {showInitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  C# / KeyAuth Connecting Init Code
                </h3>
              </div>
              <button
                onClick={() => setShowInitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Copy and paste this snippet into your C# application (Console, WinForms, or WPF). Your credentials are pre-filled below:
              </p>

              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 font-mono text-xs p-4">
                <pre className="overflow-x-auto leading-relaxed">
{`using MalikAuth;

// MalikAuth / KeyAuth-Style Client Initialization
public static MalikAuthClient malikAuth = new MalikAuthClient(
    appId: "${app.appId}",
    ownerId: "${app.ownerId || 'owner_78625'}",
    appSecret: "${(app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, '')}",
    version: "${app.version || '1.0.0'}",
    webhookUrl: "${app.discordWebhook || ''}"
);

// Call InitializeAsync() when your application launches
bool ok = await malikAuth.InitializeAsync();
if (!ok) {
    Console.WriteLine("MalikAuth Security Engine initialization failed!");
    Environment.Exit(1);
}`}
                </pre>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowInitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={copyInitCode}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied Connecting Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Init Snippet</span>
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

