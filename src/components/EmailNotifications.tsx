import React, { useState } from 'react';
import {
  Mail,
  Send,
  Check,
  X,
  Bell,
  UserPlus,
  LogIn,
  Clock,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { MalikApp } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';
import { Card, PageHeader, FieldLabel } from './ui';

interface EmailNotificationSettings {
  enabled: boolean;
  events: {
    user_registered: boolean;
    user_login: boolean;
    license_expired: boolean;
    user_banned: boolean;
    session_terminated: boolean;
  };
  recipients: string[];
  webhookUrl: string;
}

interface EmailNotificationsProps {
  app: MalikApp;
  onUpdate: () => void;
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  user_registered: {
    subject: 'New User Registration - {{app_name}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
  <h2 style="color:#4f46e5;margin:0 0 16px">New User Registration</h2>
  <p style="color:#374151;font-size:14px">A new user has registered on <strong>{{app_name}}</strong>.</p>
  <table style="width:100%;font-size:13px;color:#6b7280;margin:16px 0">
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Username:</td><td>{{username}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">License Key:</td><td>{{license_key}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">IP Address:</td><td>{{ip_address}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Time:</td><td>{{timestamp}}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <p style="color:#9ca3af;font-size:11px">MalikAuth Security Platform</p>
</div></body></html>`
  },
  user_login: {
    subject: 'User Login Alert - {{app_name}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
  <h2 style="color:#059669;margin:0 0 16px">User Login</h2>
  <p style="color:#374151;font-size:14px">A user has logged in to <strong>{{app_name}}</strong>.</p>
  <table style="width:100%;font-size:13px;color:#6b7280;margin:16px 0">
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Username:</td><td>{{username}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">HWID:</td><td>{{hwid}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">IP Address:</td><td>{{ip_address}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Time:</td><td>{{timestamp}}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <p style="color:#9ca3af;font-size:11px">MalikAuth Security Platform</p>
</div></body></html>`
  },
  license_expired: {
    subject: 'License Expired - {{app_name}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
  <h2 style="color:#d97706;margin:0 0 16px">License Expired</h2>
  <p style="color:#374151;font-size:14px">A license key has expired on <strong>{{app_name}}</strong>.</p>
  <table style="width:100%;font-size:13px;color:#6b7280;margin:16px 0">
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">License Key:</td><td>{{license_key}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">User:</td><td>{{username}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Expiry Date:</td><td>{{expiry_date}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Time:</td><td>{{timestamp}}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <p style="color:#9ca3af;font-size:11px">MalikAuth Security Platform</p>
</div></body></html>`
  },
  user_banned: {
    subject: 'User Banned - {{app_name}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
  <h2 style="color:#dc2626;margin:0 0 16px">User Banned</h2>
  <p style="color:#374151;font-size:14px">A user has been banned on <strong>{{app_name}}</strong>.</p>
  <table style="width:100%;font-size:13px;color:#6b7280;margin:16px 0">
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Username:</td><td>{{username}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Reason:</td><td>{{reason}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Time:</td><td>{{timestamp}}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <p style="color:#9ca3af;font-size:11px">MalikAuth Security Platform</p>
</div></body></html>`
  },
  session_terminated: {
    subject: 'Session Terminated - {{app_name}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
  <h2 style="color:#7c3aed;margin:0 0 16px">Session Terminated</h2>
  <p style="color:#374151;font-size:14px">A session has been terminated on <strong>{{app_name}}</strong>.</p>
  <table style="width:100%;font-size:13px;color:#6b7280;margin:16px 0">
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Username:</td><td>{{username}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Session ID:</td><td>{{session_id}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Reason:</td><td>{{reason}}</td></tr>
    <tr><td style="padding:6px 0;font-weight:600;color:#374151">Time:</td><td>{{timestamp}}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <p style="color:#9ca3af;font-size:11px">MalikAuth Security Platform</p>
</div></body></html>`
  }
};

const EVENT_META: Record<string, { label: string; description: string; icon: typeof Mail; color: string }> = {
  user_registered: {
    label: 'User Registered',
    description: 'When a new user registers with a license key',
    icon: UserPlus,
    color: 'emerald'
  },
  user_login: {
    label: 'User Login',
    description: 'When a user logs in to the application',
    icon: LogIn,
    color: 'sky'
  },
  license_expired: {
    label: 'License Expired',
    description: 'When a license key or user account expires',
    icon: Clock,
    color: 'amber'
  },
  user_banned: {
    label: 'User Banned',
    description: 'When a user account is banned by an admin',
    icon: ShieldAlert,
    color: 'rose'
  },
  session_terminated: {
    label: 'Session Terminated',
    description: 'When an active session is terminated',
    icon: X,
    color: 'violet'
  }
};

const DEFAULT_SETTINGS: EmailNotificationSettings = {
  enabled: false,
  events: {
    user_registered: true,
    user_login: false,
    license_expired: true,
    user_banned: true,
    session_terminated: false
  },
  recipients: [],
  webhookUrl: ''
};

export const EmailNotifications: React.FC<EmailNotificationsProps> = ({ app, onUpdate }) => {
  const savedSettings = ((app as any).emailNotifications as EmailNotificationSettings) || DEFAULT_SETTINGS;
  const [settings, setSettings] = useState<EmailNotificationSettings>(savedSettings);
  const [newRecipient, setNewRecipient] = useState('');
  const [previewEvent, setPreviewEvent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const toggleEvent = (eventId: keyof EmailNotificationSettings['events']) => {
    setSettings(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [eventId]: !prev.events[eventId]
      }
    }));
  };

  const addRecipient = () => {
    const email = newRecipient.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (settings.recipients.includes(email)) return;
    setSettings(prev => ({
      ...prev,
      recipients: [...prev.recipients, email]
    }));
    setNewRecipient('');
  };

  const removeRecipient = (email: string) => {
    setSettings(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      await updateApp(app.id, { emailNotifications: settings } as any);
      await logActivity(app.appId, 'REMOTE_SYNC', 'Admin', 'SYS', `Email notification settings updated [Enabled: ${settings.enabled}]`);
      setSaveMessage('Email notification settings saved successfully');
      onUpdate();
    } catch (err) {
      console.error('Error saving email notifications:', err);
      setSaveMessage('Failed to save email notification settings');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Mail}
        title="Email Notifications"
        subtitle="Configure email alerts for important events in your application."
        accent="sky"
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Bell className="h-4 w-4 text-sky-500" />
                Email Notification Settings
              </h3>
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                Enable or disable email notifications for your application
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                settings.enabled
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-surface-200 bg-surface-100 text-surface-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-400'
              }`}
            >
              {settings.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {!settings.enabled && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Email notifications are currently disabled. Enable them to start receiving alerts.
            </div>
          )}
        </Card>

        <Card className="space-y-5 p-6">
          <div className="border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <Bell className="h-4 w-4 text-sky-500" />
              Event Types
            </h3>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              Select which events should trigger email notifications
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['user_registered', 'user_login', 'license_expired', 'user_banned', 'session_terminated'] as const).map((eventId) => {
              const meta = EVENT_META[eventId];
              const isSelected = settings.events[eventId];
              return (
                <button
                  key={eventId}
                  type="button"
                  onClick={() => toggleEvent(eventId)}
                  disabled={!settings.enabled}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? `border-${meta.color}-500/40 bg-${meta.color}-500/10 shadow-sm`
                      : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
                  } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                      isSelected
                        ? `border-${meta.color}-500/25 bg-${meta.color}-500/10 text-${meta.color}-600 dark:text-${meta.color}-400`
                        : 'border-surface-200 bg-surface-100 text-surface-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-500'
                    }`}
                  >
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-surface-900 dark:text-white">{meta.label}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 truncate">{meta.description}</div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500'
                        : 'border-surface-300 dark:border-surface-600'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <div className="border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <Mail className="h-4 w-4 text-sky-500" />
              Notification Recipients
            </h3>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              Email addresses that will receive notification alerts
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                placeholder="admin@example.com"
                className="input flex-1 text-sm"
                disabled={!settings.enabled}
              />
              <button
                type="button"
                onClick={addRecipient}
                disabled={!settings.enabled || !newRecipient.trim()}
                className="btn-ghost whitespace-nowrap"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </span>
              </button>
            </div>

            {settings.recipients.length > 0 ? (
              <div className="space-y-2">
                {settings.recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50/50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-surface-400" />
                      <span className="text-sm text-surface-700 dark:text-surface-300">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="rounded-md p-1 text-surface-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-surface-200 py-6 text-center text-xs text-surface-400 dark:border-white/10">
                No recipients added. Add email addresses to receive notifications.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Eye className="h-4 w-4 text-sky-500" />
                Email Template Preview
              </h3>
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                Preview the email templates that will be sent for each event
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.keys(EMAIL_TEMPLATES).map((eventId) => {
                const meta = EVENT_META[eventId];
                const isPreviewing = previewEvent === eventId;
                return (
                  <button
                    key={eventId}
                    type="button"
                    onClick={() => setPreviewEvent(isPreviewing ? null : eventId)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isPreviewing
                        ? 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'border-surface-200 bg-surface-50 text-surface-600 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-surface-400 dark:hover:border-white/20'
                    }`}
                  >
                    {isPreviewing ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {previewEvent && (
              <div className="rounded-xl border border-surface-200 bg-surface-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="mb-3">
                  <span className="text-xs font-semibold text-surface-600 dark:text-surface-400">Subject: </span>
                  <span className="font-mono text-xs text-surface-900 dark:text-white">
                    {EMAIL_TEMPLATES[previewEvent].subject.replace('{{app_name}}', app.name)}
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-lg border border-surface-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"
                  dangerouslySetInnerHTML={{
                    __html: EMAIL_TEMPLATES[previewEvent].body
                      .replace(/\{\{app_name\}\}/g, app.name)
                      .replace(/\{\{username\}\}/g, 'john_doe')
                      .replace(/\{\{license_key\}\}/g, 'MALIK-XXXX-XXXX-XXXX-XXXX')
                      .replace(/\{\{ip_address\}\}/g, '192.168.1.1')
                      .replace(/\{\{hwid\}\}/g, 'HWID-ABC123')
                      .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
                      .replace(/\{\{expiry_date\}\}/g, '2026-12-31')
                      .replace(/\{\{session_id\}\}/g, 'SESS-ABC123')
                      .replace(/\{\{reason\}\}/g, 'Violation of terms of service')
                  }}
                />
              </div>
            )}

            {!previewEvent && (
              <div className="rounded-lg border border-dashed border-surface-200 py-6 text-center text-xs text-surface-400 dark:border-white/10">
                Select an event type above to preview its email template.
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saveMessage && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {saveMessage}
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Email Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
