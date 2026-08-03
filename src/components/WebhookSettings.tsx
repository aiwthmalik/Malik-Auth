import React, { useState } from 'react';
import {
  Webhook,
  Send,
  Check,
  X,
  Bell,
  ShieldAlert,
  UserPlus,
  Clock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { MalikApp } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';
import { Card, PageHeader, FieldLabel } from './ui';

interface WebhookSettingsProps {
  app: MalikApp;
  onUpdate: () => void;
}

export const WebhookSettings: React.FC<WebhookSettingsProps> = ({ app, onUpdate }) => {
  const [webhookUrl, setWebhookUrl] = useState(app.discordWebhook || '');
  const [enabled, setEnabled] = useState(!!app.discordWebhook);
  const [events, setEvents] = useState<string[]>(['login', 'register', 'ban', 'expiry']);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const availableEvents = [
    { id: 'login', label: 'User Login', icon: UserPlus, description: 'When a user logs in' },
    { id: 'register', label: 'User Register', icon: UserPlus, description: 'When a new user registers' },
    { id: 'ban', label: 'User Ban', icon: ShieldAlert, description: 'When a user is banned' },
    { id: 'expiry', label: 'License Expiry', icon: Clock, description: 'When a license expires' },
    { id: 'key_generated', label: 'Key Generated', icon: Bell, description: 'When license keys are generated' },
    { id: 'session_active', label: 'Session Active', icon: Bell, description: 'When a session becomes active' },
  ];

  const toggleEvent = (eventId: string) => {
    setEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      setTestResult({ success: false, message: 'Please enter a valid webhook URL' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const payload = {
        username: 'MalikAuth',
        embeds: [
          {
            title: '🧪 Test Webhook',
            description: 'This is a test message from MalikAuth to verify your webhook configuration.',
            color: 5814783,
            fields: [
              { name: 'App Name', value: app.name, inline: true },
              { name: 'App ID', value: app.appId, inline: true },
              { name: 'Status', value: '✅ Connected', inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 204) {
        setTestResult({ success: true, message: 'Test webhook sent successfully!' });
        await logActivity(app.appId, 'REMOTE_SYNC', 'Admin', 'SYS', 'Test webhook sent successfully');
      } else {
        setTestResult({ success: false, message: `Failed: HTTP ${response.status}` });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Failed to send test webhook. Check the URL.' });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      const finalUrl = enabled ? webhookUrl : '';
      await updateApp(app.id, { discordWebhook: finalUrl });
      await logActivity(app.appId, 'REMOTE_SYNC', 'Admin', 'SYS', `Webhook configuration updated [Enabled: ${enabled}]`);
      setSaveMessage('Webhook settings saved successfully');
      onUpdate();
    } catch (err) {
      console.error('Error saving webhook settings:', err);
      setSaveMessage('Failed to save webhook settings');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Webhook}
        title="Discord Webhook Settings"
        subtitle="Configure Discord webhook notifications for real-time event alerts."
        accent="violet"
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Webhook className="h-4 w-4 text-violet-500" />
                Webhook Configuration
              </h3>
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                Enter your Discord webhook URL to receive real-time notifications
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                enabled
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-surface-200 bg-surface-100 text-surface-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-400'
              }`}
            >
              {enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <FieldLabel required>Discord Webhook URL</FieldLabel>
              <div className="flex gap-2">
                <input
                  type="url"
                  required={enabled}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="input flex-1 font-mono text-sm"
                  disabled={!enabled}
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testing || !enabled || !webhookUrl}
                  className="btn-ghost whitespace-nowrap"
                >
                  {testing ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      Testing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Test Webhook
                    </span>
                  )}
                </button>
              </div>
              {testResult && (
                <div
                  className={`mt-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                    testResult.success
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <div className="border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <Bell className="h-4 w-4 text-violet-500" />
              Event Notifications
            </h3>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              Select which events should trigger webhook notifications
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {availableEvents.map((event) => {
              const isSelected = events.includes(event.id);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => toggleEvent(event.id)}
                  disabled={!enabled}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/10 shadow-sm shadow-violet-500/10'
                      : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
                  } ${!enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                      isSelected
                        ? 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-surface-200 bg-surface-100 text-surface-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-500'
                    }`}
                  >
                    <event.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-surface-900 dark:text-white">{event.label}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 truncate">{event.description}</div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500'
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

        <div className="flex items-center justify-end gap-3">
          {saveMessage && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {saveMessage}
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Webhook Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
