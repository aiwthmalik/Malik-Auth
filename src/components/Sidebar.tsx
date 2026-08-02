import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Key,
  Users,
  Radio,
  FileCode,
  Code2,
  PlusCircle,
  LogOut,
  Home,
  ChevronDown,
  Check,
  Shield,
  Sun,
  Moon,
  Sparkles,
  AppWindow
} from 'lucide-react';
import { MalikApp } from '../types';
import { Theme } from '../lib/useTheme';

interface SidebarProps {
  apps: MalikApp[];
  selectedApp: MalikApp | null;
  onSelectApp: (app: MalikApp) => void;
  onOpenCreateApp: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  onOpenLanding?: () => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  apps,
  selectedApp,
  onSelectApp,
  onOpenCreateApp,
  activeTab,
  onSelectTab,
  userEmail,
  onSignOut,
  onOpenLanding,
  theme,
  onToggleTheme,
}) => {
  console.log('[Sidebar] rendering with apps:', apps?.length || 0, 'selected:', selectedApp?.name);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { id: 'manage_apps', label: 'Applications', icon: AppWindow },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'csharp_sdk', label: 'C# WinForms SDK', icon: Code2 },
    { id: 'users', label: 'End Users', icon: Users },
    { id: 'licenses', label: 'License Keys', icon: Key },
    { id: 'sessions', label: 'Live Sessions', icon: Radio },
    { id: 'remote', label: 'Remote Variables', icon: Sparkles },
  ];

  return (
    <aside className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-surface-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d0d16]/90">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-surface-200 p-5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-md shadow-brand-500/25">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="block text-lg font-black tracking-tight text-surface-900 dark:text-white">MalikAuth</span>
            <span className="block text-[11px] font-medium text-surface-500 dark:text-surface-400">Security Platform</span>
          </div>
        </div>
        <button
          onClick={onToggleTheme}
          title="Toggle theme"
          className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Application Switcher */}
      <div className="border-b border-surface-200 p-4 dark:border-white/10">
        <label className="mb-2 block px-1 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
          Active Application
        </label>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-xs font-medium text-surface-800 transition-colors hover:bg-surface-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-100 dark:hover:bg-white/[0.08]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="truncate font-semibold">{selectedApp ? selectedApp.name : 'No App Selected'}</span>
            </div>
            <ChevronDown className={`ml-1 h-4 w-4 shrink-0 text-surface-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#15151f]">
              <div className="max-h-48 divide-y divide-surface-100 overflow-y-auto dark:divide-white/[0.06]">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onSelectApp(app);
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-brand-500/10"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold text-surface-800 dark:text-surface-100">{app.name}</span>
                      <span className="font-mono text-[10px] text-surface-400">v{app.version}</span>
                    </div>
                    {selectedApp?.id === app.id && <Check className="ml-2 h-4 w-4 shrink-0 text-brand-500" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-surface-100 bg-surface-50 p-2 dark:border-white/10 dark:bg-white/[0.03]">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenCreateApp();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-500"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500/15 to-violet-500/10 text-brand-700 shadow-sm dark:text-brand-300'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-white/[0.05] dark:hover:text-white'
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive ? 'text-brand-500' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-200'
                }`}
              />
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-surface-200 bg-surface-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]">
        {userEmail && (
          <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex min-w-0 flex-col pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Developer Account</span>
              <span className="truncate text-xs font-semibold text-surface-800 dark:text-surface-100">{userEmail}</span>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="shrink-0 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-surface-500 dark:text-surface-400">
          <button
            onClick={onOpenLanding}
            className="flex items-center gap-1.5 font-medium transition-colors hover:text-brand-500"
          >
            <Home className="h-3.5 w-3.5" />
            Landing Page
          </button>
          <span className="font-mono text-surface-400 dark:text-surface-500">v2.5.0</span>
        </div>
      </div>
    </aside>
  );
};