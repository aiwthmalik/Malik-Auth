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
import { SdkFilesTab } from './components/SdkFilesTab';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { PktClockHeader } from './components/PktClockHeader';

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
  createApp,
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
import { ShieldCheck, Loader2, Sparkles, AlertCircle, PlusCircle } from 'lucide-react';

export default function App() {
  const [apps, setApps] = useState<MalikApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<MalikApp | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manage_apps');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auth & View Mode state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'console'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // App data state
  const [licenses, setLicenses] = useState<MalikLicense[]>([]);
  const [users, setUsers] = useState<MalikUser[]>([]);
  const [sessions, setSessions] = useState<MalikSession[]>([]);
  const [remoteVariables, setRemoteVariables] = useState<MalikRemoteVariable[]>([]);
  const [logs, setLogs] = useState<MalikActivityLog[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Automatically switch to console view when user signs in
        setViewMode('console');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setViewMode('landing');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const loadAllData = useCallback(async (app: MalikApp | null) => {
    if (!app) return;
    try {
      const [lics, usrs, sess, vars, lg] = await Promise.all([
        getLicenses(app.appId),
        getUsers(app.appId),
        getSessions(app.appId),
        getRemoteVariables(app.appId),
        getActivityLogs(app.appId),
      ]);
      setLicenses(lics);
      setUsers(usrs);
      setSessions(sess);
      setRemoteVariables(vars);
      setLogs(lg);
    } catch (err: any) {
      console.error('Error loading app data:', err);
      setError(err.message || 'Error loading application data');
    }
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedApps = await getApps();
      // Only use real apps created by the developer - no demo data or mock seeding
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
    if (currentUser || viewMode === 'console') {
      loadApps();
    }
  }, [currentUser, viewMode, loadApps]);

  useEffect(() => {
    if (!selectedApp) return;

    loadAllData(selectedApp);

    // Real-time Firestore subscriptions so key usage and user creation from WinForms show instantly
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
  }, [selectedApp, loadAllData]);

  const handleAppCreated = async (newId: string) => {
    await loadApps();
  };

  if (loading && apps.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4 animate-pulse">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center space-x-2.5 text-slate-800 font-semibold text-lg">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Initializing MalikAuth Security Platform...</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Connecting to secure Firebase cloud database</p>
      </div>
    );
  }

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLaunchConsole={() => setViewMode('console')}
          isLoggedIn={!!currentUser}
          userEmail={currentUser?.email || currentUser?.displayName || null}
          onSignOut={handleSignOut}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setViewMode('console')}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2 text-sm font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadApps}
                className="text-xs font-semibold px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg transition-colors"
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
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">No Applications Created Yet</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                You currently have no applications. Click the button below to create your first MalikAuth application and start generating secure license keys.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-600/20"
              >
                + Create First Application
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
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

              {activeTab === 'csharp_sdk' && (
                <SdkFilesTab app={selectedApp} />
              )}

              {activeTab === 'licenses' && (
                <LicensesTab
                  appId={selectedApp.appId}
                  licenses={licenses}
                  onRefresh={() => loadAllData(selectedApp)}
                />
              )}

              {activeTab === 'users' && (
                <UsersTab
                  appId={selectedApp.appId}
                  users={users}
                  onRefresh={() => loadAllData(selectedApp)}
                />
              )}

              {activeTab === 'sessions' && (
                <SessionsTab
                  appId={selectedApp.appId}
                  sessions={sessions}
                  onRefresh={() => loadAllData(selectedApp)}
                />
              )}

              {activeTab === 'remote' && (
                <RemoteVariablesTab
                  appId={selectedApp.appId}
                  variables={remoteVariables}
                  onRefresh={() => loadAllData(selectedApp)}
                />
              )}

              {activeTab === 'logs' && (
                <ActivityLogsTab
                  logs={logs}
                  onRefresh={() => loadAllData(selectedApp)}
                />
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">MalikAuth Security Platform</span>
              <span className="text-slate-300">•</span>
              <span>Enterprise Remote Licensing & Memory Security</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>Firebase Cloud Active</span>
              </span>
              <span className="text-slate-400 font-mono">MalikAuth v2.5.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Create Application Modal */}
      <CreateAppModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAppCreated={handleAppCreated}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setViewMode('console')}
      />
    </div>
  );
}
