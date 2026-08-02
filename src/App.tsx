import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { CreateAppModal } from './components/CreateAppModal';
import { DashboardOverview } from './components/DashboardOverview';
import { LicensesTab } from './components/LicensesTab';
import { UsersTab } from './components/UsersTab';
import { SessionsTab } from './components/SessionsTab';
import { RemoteVariablesTab } from './components/RemoteVariablesTab';
import { ActivityLogsTab } from './components/ActivityLogsTab';
import { ManageAppsTab } from './components/ManageAppsTab';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { MaintenanceBanner } from './components/MaintenanceBanner';
import { useTheme } from './lib/useTheme';

import {
  MalikApp,
  MalikLicense,
  MalikUser,
  MalikSession,
  MalikRemoteVariable,
  MalikActivityLog
} from './types';

import {
  getApps,
  getLicenses,
  getUsers,
  getSessions,
  getRemoteVariables,
  getActivityLogs,
  subscribeLicenses,
  subscribeUsers,
  subscribeSessions,
  subscribeActivityLogs
} from './lib/malikAuthService';

import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ShieldCheck, Loader2, AlertCircle, PlusCircle } from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [apps, setApps] = useState<MalikApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<MalikApp | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manage_apps');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'console'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [licenses, setLicenses] = useState<MalikLicense[]>([]);
  const [users, setUsers] = useState<MalikUser[]>([]);
  const [sessions, setSessions] = useState<MalikSession[]>([]);
  const [remoteVariables, setRemoteVariables] = useState<MalikRemoteVariable[]>([]);
  const [logs, setLogs] = useState<MalikActivityLog[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setViewMode('landing');
      setApps([]);
      setSelectedApp(null);
      setLicenses([]);
      setUsers([]);
      setSessions([]);
      setRemoteVariables([]);
      setLogs([]);
      setError(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const loadAllData = useCallback(async (app: MalikApp | null) => {
    if (!app) return;
    try {
      const [lics, usrs, sess, vars, lg] = await Promise.allSettled([
        getLicenses(app.appId),
        getUsers(app.appId),
        getSessions(app.appId),
        getRemoteVariables(app.appId),
        getActivityLogs(app.appId),
      ]);
      if (lics.status === 'fulfilled') setLicenses(lics.value);
      if (usrs.status === 'fulfilled') setUsers(usrs.value);
      if (sess.status === 'fulfilled') setSessions(sess.value);
      if (vars.status === 'fulfilled') setRemoteVariables(vars.value);
      if (lg.status === 'fulfilled') setLogs(lg.value);
    } catch (err: any) {
      console.error('Error loading app data:', err);
    }
  }, []);

  const loadApps = useCallback(async () => {
    console.log('[App] loadApps starting...');
    setLoading(true);
    setError(null);
    try {
      const fetchedApps = await getApps();
      console.log('[App] getApps returned:', fetchedApps?.length || 0, 'apps');
      setApps(fetchedApps);
      if (fetchedApps.length > 0) {
        const current = selectedApp
          ? fetchedApps.find((a) => a.appId === selectedApp.appId) || fetchedApps[0]
          : fetchedApps[0];
        setSelectedApp(current);
        await loadAllData(current);
      } else {
        setSelectedApp(null);
        setLicenses([]);
        setUsers([]);
        setSessions([]);
        setRemoteVariables([]);
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Failed to load apps:', err);
      setError(err.message || 'Failed to connect to MalikAuth server');
    } finally {
      setLoading(false);
    }
  }, [selectedApp, loadAllData]);

  useEffect(() => {
    if (viewMode === 'console') {
      loadApps();
    }
  }, [viewMode]);

  useEffect(() => {
    if (!selectedApp) return;

    const unsubLics = subscribeLicenses(selectedApp.appId, (updatedLicenses) => {
      setLicenses(updatedLicenses);
    });
    const unsubUsers = subscribeUsers(selectedApp.appId, (updatedUsers) => {
      setUsers(updatedUsers);
    });
    const unsubSessions = subscribeSessions(selectedApp.appId, (updatedSessions) => {
      setSessions(updatedSessions);
    });
    const unsubLogs = subscribeActivityLogs(selectedApp.appId, (updatedLogs) => {
      setLogs(updatedLogs);
    });

    return () => {
      unsubLics();
      unsubUsers();
      unsubSessions();
      unsubLogs();
    };
  }, [selectedApp]);

  const handleAppCreated = async () => {
    await loadApps();
  };

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLaunchConsole={() => setViewMode('console')}
          isLoggedIn={!!currentUser}
          userEmail={currentUser?.email || currentUser?.displayName || null}
          onSignOut={handleSignOut}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setViewMode('console')}
        />
      </>
    );
  }

  if (loading && apps.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 text-surface-900 dark:bg-[#0b0b12] dark:text-white">
        <div className="relative mb-5">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-brand-500/30" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/30">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-lg font-semibold">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span>Loading MalikAuth Console...</span>
        </div>
        <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">Connecting to Firebase cloud database</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-50 text-surface-900 dark:bg-[#0b0b12] dark:text-surface-100">
      <Sidebar
        apps={apps}
        selectedApp={selectedApp}
        onSelectApp={(app) => {
          setSelectedApp(app);
          setActiveTab('overview');
        }}
        onOpenCreateApp={() => setIsCreateModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        userEmail={currentUser?.email || currentUser?.displayName || null}
        onSignOut={handleSignOut}
        onOpenLanding={() => setViewMode('landing')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {selectedApp && <MaintenanceBanner app={selectedApp} />}

          {error && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadApps}
                className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-500/25 dark:text-rose-300"
              >
                Retry Connection
              </button>
            </div>
          )}

          {activeTab === 'manage_apps' ? (
            <ManageAppsTab
              apps={apps}
              selectedApp={selectedApp}
              onSelectApp={(app) => {
                setSelectedApp(app);
                loadAllData(app);
              }}
              onOpenCreateApp={() => setIsCreateModalOpen(true)}
              onRefresh={loadApps}
            />
          ) : !selectedApp ? (
            <div className="card flex flex-col items-center px-6 py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">No Applications Created Yet</h2>
              <p className="mt-1 max-w-md text-sm text-surface-500 dark:text-surface-400">
                You currently have no applications. Click the button below to create your first MalikAuth application and start generating secure license keys.
              </p>
              <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary mt-6">
                <PlusCircle className="h-4 w-4" />
                Create First Application
              </button>
            </div>
          ) : (
            <div className="animate-in-up">
              {activeTab === 'overview' && (
                <DashboardOverview
                  app={selectedApp}
                  licenses={licenses}
                  users={users}
                  sessions={sessions}
                  logs={logs}
                  onRefresh={() => loadAllData(selectedApp)}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'licenses' && (
                <LicensesTab appId={selectedApp.appId} licenses={licenses} onRefresh={() => loadAllData(selectedApp)} />
              )}
              {activeTab === 'users' && (
                <UsersTab appId={selectedApp.appId} users={users} onRefresh={() => loadAllData(selectedApp)} />
              )}
              {activeTab === 'sessions' && (
                <SessionsTab appId={selectedApp.appId} sessions={sessions} onRefresh={() => loadAllData(selectedApp)} />
              )}
              {activeTab === 'remote' && (
                <RemoteVariablesTab appId={selectedApp.appId} variables={remoteVariables} onRefresh={() => loadAllData(selectedApp)} />
              )}
              {activeTab === 'logs' && (
                <ActivityLogsTab logs={logs} onRefresh={() => loadAllData(selectedApp)} />
              )}
            </div>
          )}
        </main>

        <footer className="mt-auto border-t border-surface-200 bg-white/60 py-5 text-xs text-surface-500 backdrop-blur dark:border-white/10 dark:bg-white/[0.02] dark:text-surface-400">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <span className="font-bold text-surface-800 dark:text-white">MalikAuth Security Platform</span>
              <span className="text-surface-300 dark:text-surface-600">•</span>
              <span>Enterprise Remote Licensing & Memory Security</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Firebase Cloud Active
              </span>
              <span className="font-mono text-surface-400 dark:text-surface-500">MalikAuth v2.5.0</span>
            </div>
          </div>
        </footer>
      </div>

      <CreateAppModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAppCreated={handleAppCreated}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setViewMode('console')}
      />
    </div>
  );
}