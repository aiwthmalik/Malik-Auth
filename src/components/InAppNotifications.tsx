import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Shield,
  AlertTriangle,
  Info,
  CreditCard,
  Settings,
  X,
  ChevronDown,
} from 'lucide-react';
import { Card, PageHeader, EmptyState } from './ui';
import { formatNotificationTime } from '../lib/notifications';

interface Notification {
  id: string;
  type: 'system' | 'security' | 'update' | 'billing' | 'custom';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

interface InAppNotificationsProps {
  notifications: Notification[];
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const TYPE_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  system: { icon: Info, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20' },
  security: { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  update: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  billing: { icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  custom: { icon: Settings, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20' },
};

export const InAppNotifications: React.FC<InAppNotificationsProps> = ({
  notifications,
  onRead,
  onDelete,
  onClearAll,
}) => {
  const [showPanel, setShowPanel] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    system: true,
    security: true,
    update: true,
    billing: true,
    custom: true,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread' && n.read) return false;
    if (!prefs[n.type]) return false;
    return true;
  });

  const togglePref = (type: string) => {
    setPrefs((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bell}
        title="Notifications"
        subtitle="Manage your in-app notification center and preferences."
        accent="brand"
      />

      {/* Bell + Controls */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-surface-700 dark:text-surface-200" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-surface-900 dark:text-white">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {notifications.length} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-1 dark:border-white/10 dark:bg-white/[0.02]">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  filter === f
                    ? 'bg-white text-surface-900 shadow-sm dark:bg-white/10 dark:text-white'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={onClearAll} className="btn-ghost text-xs">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark All Read
          </button>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-bold tracking-tight">Notification Preferences</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
            const Icon = cfg.icon;
            const enabled = prefs[type];
            return (
              <button
                key={type}
                onClick={() => togglePref(type)}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                  enabled
                    ? `${cfg.bg} border-current`
                    : 'border-surface-200 bg-surface-50/50 opacity-50 dark:border-white/10 dark:bg-white/[0.02]'
                }`}
              >
                <Icon className={`h-4 w-4 ${enabled ? cfg.color : 'text-surface-400'}`} />
                <span className="text-xs font-semibold capitalize text-surface-700 dark:text-surface-200">{type}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No Notifications"
          message="You're all caught up! Notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.custom;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`card flex items-start gap-4 p-4 transition-all ${
                  !n.read ? 'border-l-2 border-l-brand-500 bg-brand-500/[0.02]' : ''
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-bold ${!n.read ? 'text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-300'}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-surface-400">{formatNotificationTime(n.timestamp)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {!n.read && (
                      <button
                        onClick={() => onRead(n.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-brand-500 hover:bg-brand-500/10"
                      >
                        <Check className="h-3 w-3" />
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(n.id)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
