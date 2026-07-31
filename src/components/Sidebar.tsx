import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Key,
  Users,
  Radio,
  FileCode,
  FileText,
  PlusCircle,
  LogOut,
  Home,
  ChevronDown,
  Check,
  Shield,
  Sparkles,
  AppWindow
} from 'lucide-react';
import { MalikApp } from '../types';

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
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'manage_apps', label: 'Manage Applications', icon: AppWindow },
    { id: 'licenses', label: 'License Keys', icon: Key },
    { id: 'users', label: 'End Users', icon: Users },
    { id: 'sessions', label: 'Live Sessions', icon: Radio },
    { id: 'remote', label: 'Remote Variables', icon: FileCode },
    { id: 'logs', label: 'Activity Logs', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 shadow-sm z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">
              MalikAuth
            </span>
            <span className="text-xs font-medium text-slate-500 block mt-1">
              Security Platform
            </span>
          </div>
        </div>
      </div>

      {/* Application Switcher */}
      <div className="p-4 border-b border-slate-100">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Active Application
        </label>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 transition-colors"
          >
            <div className="flex items-center space-x-2 truncate">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate font-semibold">
                {selectedApp ? selectedApp.name : 'No App Selected'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onSelectApp(app);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-indigo-50 text-left transition-colors"
                  >
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-slate-800 truncate">
                        {app.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        v{app.version}
                      </span>
                    </div>
                    {selectedApp?.id === app.id && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-2 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenCreateApp();
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Application</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/60">
        {userEmail && (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Developer Account
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate">
                {userEmail}
              </span>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out of MalikAuth"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Cloud Active</span>
          </span>
          <span className="font-mono text-slate-400">v2.5.0</span>
        </div>
      </div>
    </aside>
  );
};
