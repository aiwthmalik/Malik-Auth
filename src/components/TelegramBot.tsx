import React, { useState } from 'react';
import {
  Send,
  Bot,
  Check,
  X,
  MessageSquare,
  Users,
  Radio,
  Shield,
  Settings,
  Zap,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, PageHeader, FieldLabel } from './ui';
import { MalikApp } from '../types';

interface TelegramBotProps {
  app: MalikApp;
  onUpdate: () => void;
}

const AVAILABLE_EVENTS = [
  { id: 'login', label: 'User Login', icon: Users },
  { id: 'register', label: 'User Register', icon: Users },
  { id: 'ban', label: 'User Ban', icon: Shield },
  { id: 'key_generated', label: 'Key Generated', icon: Zap },
  { id: 'session_active', label: 'Session Active', icon: Radio },
  { id: 'expiry', label: 'License Expiry', icon: AlertTriangle },
  { id: 'system', label: 'System Alerts', icon: Settings },
];

const BOT_COMMANDS = [
  { cmd: '/status', desc: 'Get app status overview' },
  { cmd: '/users', desc: 'Get total user count' },
  { cmd: '/sessions', desc: 'Get active session count' },
  { cmd: '/ban <username>', desc: 'Ban a user by username' },
  { cmd: '/unban <username>', desc: 'Unban a user by username' },
];

export const TelegramBot: React.FC<TelegramBotProps> = ({ app, onUpdate }) => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [events, setEvents] = useState<string[]>(['login', 'ban', 'system']);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);

  const toggleEvent = (id: string) => {
    setEvents((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  };

  const handleTest = async () => {
    if (!botToken || !chatId) {
      setTestResult({ success: false, message: 'Enter bot token and chat ID first.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🧪 *MalikAuth Test*\n\nApp: ${app.name}\nApp ID: ${app.appId}\nStatus: Connected ✅`,
          parse_mode: 'Markdown',
        }),
      });
      if (res.ok) {
        setTestResult({ success: true, message: 'Test message sent successfully!' });
        setConnected(true);
      } else {
        setTestResult({ success: false, message: `Failed: HTTP ${res.status}` });
      }
    } catch {
      setTestResult({ success: false, message: 'Failed to send. Check token and chat ID.' });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        title="Telegram Bot"
        subtitle="Configure Telegram bot for notifications and remote management."
        accent="sky"
      />

      {/* Connection Status */}
      <Card className="flex items-center gap-4 p-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            connected
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'
              : 'border-surface-200 bg-surface-100 text-surface-400 dark:border-white/10 dark:bg-white/[0.04]'
          }`}
        >
          {connected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-bold text-surface-900 dark:text-white">
            {connected ? 'Bot Connected' : 'Bot Not Connected'}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {connected ? 'Telegram bot is active and receiving events.' : 'Configure and test your bot to connect.'}
          </p>
        </div>
      </Card>

      {/* Bot Configuration */}
      <Card className="space-y-5 p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Settings className="h-4 w-4 text-sky-500" />
          Bot Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <FieldLabel required>Bot Token</FieldLabel>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="input font-mono text-sm"
            />
            <p className="mt-1 text-[11px] text-surface-400">
              Get this from @BotFather on Telegram
            </p>
          </div>
          <div>
            <FieldLabel required>Chat ID</FieldLabel>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-1001234567890"
              className="input font-mono text-sm"
            />
            <p className="mt-1 text-[11px] text-surface-400">
              Use @userinfobot or @getmyid_bot to find your chat ID
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTest} disabled={testing} className="btn-primary">
            {testing ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Test Message
              </span>
            )}
          </button>
          {testResult && (
            <span
              className={`text-xs font-medium ${
                testResult.success ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {testResult.message}
            </span>
          )}
        </div>
      </Card>

      {/* Event Selector */}
      <Card className="space-y-4 p-6">
        <h3 className="text-sm font-bold tracking-tight">Event Notifications</h3>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          Select which events should trigger Telegram notifications.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AVAILABLE_EVENTS.map((ev) => {
            const selected = events.includes(ev.id);
            return (
              <button
                key={ev.id}
                onClick={() => toggleEvent(ev.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? 'border-sky-500/40 bg-sky-500/10'
                    : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    selected
                      ? 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      : 'border-surface-200 bg-surface-100 text-surface-500 dark:border-white/10 dark:bg-white/[0.04]'
                  }`}
                >
                  <ev.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{ev.label}</span>
                <div
                  className={`ml-auto h-4 w-4 rounded border-2 flex items-center justify-center ${
                    selected ? 'border-sky-500 bg-sky-500' : 'border-surface-300 dark:border-surface-600'
                  }`}
                >
                  {selected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Bot Commands Documentation */}
      <Card className="space-y-4 p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4 text-sky-500" />
          Bot Commands
        </h3>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          Send these commands to your Telegram bot for remote management.
        </p>
        <div className="space-y-2">
          {BOT_COMMANDS.map((c) => (
            <div
              key={c.cmd}
              className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2 dark:border-white/10"
            >
              <code className="font-mono text-xs font-bold text-sky-500">{c.cmd}</code>
              <span className="text-xs text-surface-500">{c.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <button className="btn-primary" onClick={onUpdate}>
          <Check className="h-4 w-4" />
          Save Telegram Configuration
        </button>
      </div>
    </div>
  );
};
