import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  appName?: string | null;
  activeTab: string;
  onNavigate?: (tab: string) => void;
}

const tabLabels: Record<string, string> = {
  manage_apps: 'Applications',
  overview: 'Overview',
  csharp_sdk: 'C# WinForms SDK',
  users: 'End Users',
  licenses: 'License Keys',
  sessions: 'Live Sessions',
  remote: 'Remote Variables',
  logs: 'Activity Logs',
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ appName, activeTab, onNavigate }) => {
  const tabLabel = tabLabels[activeTab] || activeTab;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400 mb-4" aria-label="Breadcrumb">
      {/* Desktop: full path */}
      <span className="hidden sm:flex items-center gap-1.5">
        <button
          onClick={() => onNavigate?.('manage_apps')}
          className="flex items-center gap-1 font-medium transition-colors hover:text-brand-500"
        >
          <Home className="h-3 w-3" />
          MalikAuth
        </button>

        {appName && (
          <>
            <ChevronRight className="h-3 w-3 text-surface-300 dark:text-surface-600" />
            <span className="font-medium text-surface-700 dark:text-surface-200">{appName}</span>
          </>
        )}

        {activeTab !== 'manage_apps' && (
          <>
            <ChevronRight className="h-3 w-3 text-surface-300 dark:text-surface-600" />
            <span className="font-bold text-surface-900 dark:text-white">{tabLabel}</span>
          </>
        )}
      </span>

      {/* Mobile: last item only */}
      <span className="sm:hidden flex items-center gap-1.5">
        {appName && activeTab !== 'manage_apps' ? (
          <span className="font-bold text-surface-900 dark:text-white">{tabLabel}</span>
        ) : (
          <button
            onClick={() => onNavigate?.('manage_apps')}
            className="flex items-center gap-1 font-medium transition-colors hover:text-brand-500"
          >
            <Home className="h-3 w-3" />
            MalikAuth
          </button>
        )}
      </span>
    </nav>
  );
};
