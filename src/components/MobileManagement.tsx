import React, { useState } from 'react';
import {
  Smartphone,
  Key,
  Ban,
  Radio,
  Search,
  Mic,
  Plus,
  Users,
  Activity,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';
import { Card, PageHeader, StatusBadge, EmptyState } from './ui';

interface MobileStats {
  totalUsers: number;
  totalKeys: number;
  activeSessions: number;
}

interface MobileManagementProps {
  appId: string;
  stats: MobileStats;
  onRefresh: () => void;
}

export const MobileManagement: React.FC<MobileManagementProps> = ({ appId, stats, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [swipedCard, setSwipedCard] = useState<string | null>(null);

  const quickActions = [
    { id: 'generate', label: 'Generate Key', icon: Key, color: 'text-brand-500 bg-brand-500/10 border-brand-500/20' },
    { id: 'ban', label: 'Ban User', icon: Ban, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { id: 'sessions', label: 'View Sessions', icon: Radio, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'users', label: 'User List', icon: Users, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
  ];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-violet-500 bg-violet-500/10' },
    { label: 'Total Keys', value: stats.totalKeys, icon: Key, color: 'text-brand-500 bg-brand-500/10' },
    { label: 'Active Sessions', value: stats.activeSessions, icon: Radio, color: 'text-emerald-500 bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Smartphone}
        title="Mobile Management"
        subtitle="Touch-optimized management dashboard for on-the-go operations."
        accent="sky"
      />

      {/* Quick Search */}
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, keys, sessions..."
              className="input pl-10"
            />
          </div>
          <button
            className="btn-ghost px-3"
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Stats Grid — 2 columns for mobile */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 ${s.color} dark:border-white/10`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-extrabold tracking-tight">{s.value}</div>
                <div className="truncate text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  {s.label}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-bold tracking-tight">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={onRefresh}
              className="flex flex-col items-center gap-2 rounded-xl border border-surface-200 bg-surface-50/50 p-5 text-center transition-all hover:border-brand-400/50 hover:shadow-md hover:shadow-brand-500/5 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-brand-400/30"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-surface-700 dark:text-surface-200">{action.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Swipeable Items */}
      <Card className="space-y-3 p-5">
        <h3 className="text-sm font-bold tracking-tight">Recent Activity</h3>
        {[
          { id: '1', text: 'User "dev_alpha" logged in', time: '2m ago', status: 'Active' },
          { id: '2', text: 'License key generated for tier_pro', time: '5m ago', status: 'Active' },
          { id: '3', text: 'Session expired for user_b42', time: '12m ago', status: 'Expired' },
        ].map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-xl border border-surface-200 dark:border-white/10"
          >
            {/* Swipe delete background */}
            <div className="absolute inset-y-0 right-0 flex items-center bg-rose-500 px-4 text-white">
              <Trash2 className="h-4 w-4" />
            </div>
            {/* Card content */}
            <div
              className={`relative flex items-center gap-3 bg-white p-4 transition-transform duration-200 dark:bg-white/[0.03] ${
                swipedCard === item.id ? '-translate-x-20' : ''
              }`}
              onTouchStart={() => setSwipedCard(item.id)}
              onTouchEnd={() => setTimeout(() => setSwipedCard(null), 2000)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-white">{item.text}</p>
                <p className="text-[11px] text-surface-400">{item.time}</p>
              </div>
              <StatusBadge status={item.status} />
              <ChevronRight className="h-4 w-4 text-surface-300 dark:text-surface-600" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
