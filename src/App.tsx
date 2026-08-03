import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { CreateAppModal } from './components/CreateAppModal';
import { AuthModal } from './components/AuthModal';
import { SafeRender } from './components/SafeRender';

// Core tabs
const DashboardOverview = React.lazy(() => import('./components/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const LicensesTab = React.lazy(() => import('./components/LicensesTab').then(m => ({ default: m.LicensesTab })));
const UsersTab = React.lazy(() => import('./components/UsersTab').then(m => ({ default: m.UsersTab })));
const SessionsTab = React.lazy(() => import('./components/SessionsTab').then(m => ({ default: m.SessionsTab })));
const RemoteVariablesTab = React.lazy(() => import('./components/RemoteVariablesTab').then(m => ({ default: m.RemoteVariablesTab })));
const ActivityLogsTab = React.lazy(() => import('./components/ActivityLogsTab').then(m => ({ default: m.ActivityLogsTab })));
const ManageAppsTab = React.lazy(() => import('./components/ManageAppsTab').then(m => ({ default: m.ManageAppsTab })));
const SdkFilesTab = React.lazy(() => import('./components/SdkFilesTab').then(m => ({ default: m.SdkFilesTab })));
const LandingPage = React.lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));

// KeyAuth features
const TokensManager = React.lazy(() => import('./components/TokensManager').then(m => ({ default: m.TokensManager })));
const SubscriptionManager = React.lazy(() => import('./components/SubscriptionManager').then(m => ({ default: m.SubscriptionManager })));
const FunctionManager = React.lazy(() => import('./components/FunctionManager').then(m => ({ default: m.FunctionManager })));
const DownloadProtection = React.lazy(() => import('./components/DownloadProtection').then(m => ({ default: m.DownloadProtection })));
const HashChecks = React.lazy(() => import('./components/HashChecks').then(m => ({ default: m.HashChecks })));
const ClientTwoFactor = React.lazy(() => import('./components/ClientTwoFactor').then(m => ({ default: m.ClientTwoFactor })));
const ChatSystem = React.lazy(() => import('./components/ChatSystem').then(m => ({ default: m.ChatSystem })));
const LicenseMaskGenerator = React.lazy(() => import('./components/LicenseMaskGenerator').then(m => ({ default: m.LicenseMaskGenerator })));
const BulkDeletePanel = React.lazy(() => import('./components/BulkDeletePanel').then(m => ({ default: m.BulkDeletePanel })));
const UserNotes = React.lazy(() => import('./components/UserNotes').then(m => ({ default: m.UserNotes })));
const DownloadCounter = React.lazy(() => import('./components/DownloadCounter').then(m => ({ default: m.DownloadCounter })));
const AutoUpdater = React.lazy(() => import('./components/AutoUpdater').then(m => ({ default: m.AutoUpdater })));
const AntiTamper = React.lazy(() => import('./components/AntiTamper').then(m => ({ default: m.AntiTamper })));
const GeoBlocking = React.lazy(() => import('./components/GeoBlocking').then(m => ({ default: m.GeoBlocking })));
const SellerAPI = React.lazy(() => import('./components/SellerAPI').then(m => ({ default: m.SellerAPI })));
const MobileManagement = React.lazy(() => import('./components/MobileManagement').then(m => ({ default: m.MobileManagement })));
const SubAccounts = React.lazy(() => import('./components/SubAccounts').then(m => ({ default: m.SubAccounts })));
const WebhookHistory = React.lazy(() => import('./components/WebhookHistory').then(m => ({ default: m.WebhookHistory })));
const APIAnalytics = React.lazy(() => import('./components/APIAnalytics').then(m => ({ default: m.APIAnalytics })));
const InAppNotifications = React.lazy(() => import('./components/InAppNotifications').then(m => ({ default: m.InAppNotifications })));
const TelegramBot = React.lazy(() => import('./components/TelegramBot').then(m => ({ default: m.TelegramBot })));
const WebhookSettings = React.lazy(() => import('./components/WebhookSettings').then(m => ({ default: m.WebhookSettings })));
const EmailNotifications = React.lazy(() => import('./components/EmailNotifications').then(m => ({ default: m.EmailNotifications })));
const IPWhitelist = React.lazy(() => import('./components/IPWhitelist').then(m => ({ default: m.IPWhitelist })));
const TwoFactorSettings = React.lazy(() => import('./components/TwoFactorSettings').then(m => ({ default: m.TwoFactorSettings })));
const RoleManager = React.lazy(() => import('./components/RoleManager').then(m => ({ default: m.RoleManager })));
const AppCloneModal = React.lazy(() => import('./components/AppCloneModal').then(m => ({ default: m.AppCloneModal })));
const LicenseGroups = React.lazy(() => import('./components/LicenseGroups').then(m => ({ default: m.LicenseGroups })));
const BrandingSettings = React.lazy(() => import('./components/BrandingSettings').then(m => ({ default: m.BrandingSettings })));
const AnalyticsOverview = React.lazy(() => import('./components/AnalyticsOverview').then(m => ({ default: m.AnalyticsOverview })));
const UserImpersonation = React.lazy(() => import('./components/UserImpersonation').then(m => ({ default: m.UserImpersonation })));
const KeyImportModal = React.lazy(() => import('./components/KeyImportModal').then(m => ({ default: m.KeyImportModal })));
const SDKDownloadPage = React.lazy(() => import('./components/SDKDownloadPage').then(m => ({ default: m.SDKDownloadPage })));

import {
  MalikApp, MalikLicense, MalikUser, MalikSession,
  MalikRemoteVariable, MalikActivityLog, MalikToken,
  MalikSubscription, MalikFunction, MalikDownload,
  MalikHashCheck, MalikChatMessage
} from './types';

import {
  getApps, createApp, getLicenses, getUsers, getSessions,
  getRemoteVariables, getActivityLogs,
  subscribeLicenses, subscribeUsers, subscribeSessions, subscribeActivityLogs
} from './lib/malikAuthService';

import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [apps, setApps] = useState<MalikApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<MalikApp | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manage_apps');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'console'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [licenses, setLicenses] = useState<MalikLicense[]>([]);
  const [users, setUsers] = useState<MalikUser[]>([]);
  const [sessions, setSessions] = useState<MalikSession[]>([]);
  const [remoteVariables, setRemoteVariables] = useState<MalikRemoteVariable[]>([]);
  const [logs, setLogs] = useState<MalikActivityLog[]>([]);

  // New feature states (placeholder data for now)
  const [tokens] = useState<MalikToken[]>([]);
  const [subscriptions] = useState<MalikSubscription[]>([]);
  const [functions] = useState<MalikFunction[]>([]);
  const [downloads] = useState<MalikDownload[]>([]);
  const [hashes] = useState<MalikHashCheck[]>([]);
  const [chatMessages] = useState<MalikChatMessage[]>([]);
  const [notifications] = useState<any[]>([]);
  const [webhookHistory] = useState<any[]>([]);
  const [apiAnalytics] = useState<any>({ totalCalls: 0, callsToday: 0, avgResponseTime: 0, errorRate: 0, endpoints: [], daily: [], topConsumers: [], rateLimitHits: 0 });
  const [sellerKeys] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) setViewMode('console');
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
      const [licsRes, usrsRes, sessRes, varsRes, lgRes] = await Promise.allSettled([
        getLicenses(app.appId), getUsers(app.appId), getSessions(app.appId),
        getRemoteVariables(app.appId), getActivityLogs(app.appId),
      ]);
      setLicenses(licsRes.status === 'fulfilled' ? licsRes.value : []);
      setUsers(usrsRes.status === 'fulfilled' ? usrsRes.value : []);
      setSessions(sessRes.status === 'fulfilled' ? sessRes.value : []);
      setRemoteVariables(varsRes.status === 'fulfilled' ? varsRes.value : []);
      setLogs(lgRes.status === 'fulfilled' ? lgRes.value : []);
    } catch (err: any) {
      setError(err.message || 'Error loading application data');
    }
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedApps = await getApps();
      setApps(fetchedApps);
      if (fetchedApps.length > 0) {
        setSelectedApp((prev) => {
          const current = prev ? fetchedApps.find((a) => a.appId === prev.appId) || fetchedApps[0] : fetchedApps[0];
          loadAllData(current);
          return current;
        });
      } else {
        setSelectedApp(null);
        setLicenses([]); setUsers([]); setSessions([]); setRemoteVariables([]); setLogs([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to MalikAuth server');
    } finally {
      setLoading(false);
    }
  }, [loadAllData]);

  useEffect(() => {
    if (currentUser || viewMode === 'console') loadApps();
  }, [currentUser, viewMode]);

  useEffect(() => {
    if (!selectedApp) return;
    loadAllData(selectedApp);
    const unsubLics = subscribeLicenses(selectedApp.appId, setLicenses);
    const unsubUsers = subscribeUsers(selectedApp.appId, setUsers);
    const unsubSessions = subscribeSessions(selectedApp.appId, setSessions);
    const unsubLogs = subscribeActivityLogs(selectedApp.appId, setLogs);
    return () => { unsubLics(); unsubUsers(); unsubSessions(); unsubLogs(); };
  }, [selectedApp?.appId, loadAllData]);

  const handleAppCreated = async () => { await loadApps(); };
  const refresh = () => { if (selectedApp) loadAllData(selectedApp); };

  if (viewMode === 'landing') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#0b0b12] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}>
        <SafeRender name="Landing View">
          <LandingPage onOpenAuthModal={() => setIsAuthModalOpen(true)} onLaunchConsole={() => setViewMode('console')} isLoggedIn={!!currentUser} userEmail={currentUser?.email || currentUser?.displayName || null} onSignOut={handleSignOut} />
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setViewMode('console')} />
        </SafeRender>
      </React.Suspense>
    );
  }

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
      </div>
    );
  }

  const tabContent = () => {
    if (activeTab === 'manage_apps') {
      return <ManageAppsTab apps={apps} selectedApp={selectedApp} onSelectApp={(app) => { setSelectedApp(app); loadAllData(app); }} onOpenCreateApp={() => setIsCreateModalOpen(true)} onRefresh={loadApps} />;
    }
    if (!selectedApp) {
      return (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Applications Created Yet</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Click the button below to create your first application.</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-600/20">
            + Create First Application
          </button>
        </div>
      );
    }

    const app = selectedApp;
    switch (activeTab) {
      // Core
      case 'overview': return <DashboardOverview app={app} licenses={licenses} users={users} sessions={sessions} logs={logs} onRefresh={refresh} onNavigateToTab={setActiveTab} />;
      case 'csharp_sdk': return <SdkFilesTab app={app} />;
      // Licensing
      case 'licenses': return <LicensesTab appId={app.appId} licenses={licenses} onRefresh={refresh} />;
      case 'tokens': return <TokensManager appId={app.appId} tokens={tokens} onRefresh={refresh} />;
      case 'subscriptions': return <SubscriptionManager appId={app.appId} users={users} subscriptions={subscriptions} onRefresh={refresh} />;
      case 'license_mask': return <LicenseMaskGenerator appId={app.appId} onGenerate={() => {}} />;
      case 'license_groups': return <LicenseGroups appId={app.appId} licenses={licenses} onRefresh={refresh} />;
      case 'key_import': return <KeyImportModal isOpen={true} onClose={() => setActiveTab('licenses')} appId={app.appId} onImported={refresh} />;
      case 'bulk_delete': return <BulkDeletePanel appId={app.appId} licenses={licenses} users={users} sessions={sessions} onRefresh={refresh} />;
      // Users & Sessions
      case 'users': return <UsersTab appId={app.appId} users={users} onRefresh={refresh} />;
      case 'sessions': return <SessionsTab appId={app.appId} sessions={sessions} onRefresh={refresh} />;
      case 'user_notes': return <div className="space-y-4"><h2 className="text-lg font-bold">Select a user from End Users tab to view notes</h2><p className="text-sm text-surface-500">Navigate to End Users, then click on a user to manage their notes.</p></div>;
      case 'user_impersonation': return <UserImpersonation appId={app.appId} users={users} />;
      case 'sub_accounts': return <SubAccounts appId={app.appId} members={[]} onRefresh={refresh} />;
      // Security
      case 'client_2fa': return <ClientTwoFactor appId={app.appId} users={users} onRefresh={refresh} />;
      case 'hash_checks': return <HashChecks appId={app.appId} hashes={hashes} onRefresh={refresh} />;
      case 'anti_tamper': return <AntiTamper appId={app.appId} rules={[]} violations={[]} onRefresh={refresh} />;
      case 'geo_blocking': return <GeoBlocking appId={app.appId} geoSettings={{ mode: 'blocklist', countries: [] }} onUpdate={() => {}} />;
      case 'ip_whitelist': return <IPWhitelist app={app} onUpdate={() => {}} />;
      case 'download_protection': return <DownloadProtection appId={app.appId} downloads={downloads} onRefresh={refresh} />;
      // Remote Config
      case 'remote': return <RemoteVariablesTab appId={app.appId} variables={remoteVariables} onRefresh={refresh} />;
      case 'functions': return <FunctionManager appId={app.appId} functions={functions} onRefresh={refresh} />;
      case 'auto_updater': return <AutoUpdater appId={app.appId} updates={[]} onRefresh={refresh} />;
      // Communication
      case 'chat': return <ChatSystem appId={app.appId} messages={chatMessages} onRefresh={refresh} />;
      case 'webhook_settings': return <WebhookSettings app={app} onUpdate={() => {}} />;
      case 'webhook_history': return <WebhookHistory appId={app.appId} history={webhookHistory} onRefresh={refresh} />;
      case 'email_notifications': return <EmailNotifications app={app} onUpdate={() => {}} />;
      case 'telegram_bot': return <TelegramBot app={app} onUpdate={() => {}} />;
      case 'notifications': return <InAppNotifications notifications={notifications} onRead={() => {}} onDelete={() => {}} onClearAll={() => {}} />;
      // Analytics & Platform
      case 'analytics': return <AnalyticsOverview appId={app.appId} logs={logs} sessions={sessions} licenses={licenses} />;
      case 'api_analytics': return <APIAnalytics appId={app.appId} analytics={apiAnalytics} onRefresh={refresh} />;
      case 'download_counter': return <DownloadCounter appId={app.appId} downloads={downloads} onRefresh={refresh} />;
      case 'seller_api': return <SellerAPI appId={app.appId} sellers={sellerKeys} onRefresh={refresh} />;
      case 'branding': return <BrandingSettings app={app} onUpdate={() => {}} />;
      case 'role_manager': return <RoleManager app={app} onUpdate={() => {}} />;
      case 'mobile': return <MobileManagement appId={app.appId} stats={{ totalUsers: users.length, totalKeys: licenses.length, activeSessions: sessions.filter(s => s.status === 'Active').length }} onRefresh={refresh} />;
      default: return <DashboardOverview app={app} licenses={licenses} users={users} sessions={sessions} logs={logs} onRefresh={refresh} onNavigateToTab={setActiveTab} />;
    }
  };

  return (
    <SafeRender name="Console Shell">
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        <Sidebar apps={apps} selectedApp={selectedApp} onSelectApp={(app) => { setSelectedApp(app); setActiveTab('overview'); }} onOpenCreateApp={() => setIsCreateModalOpen(true)} activeTab={activeTab} onSelectTab={setActiveTab} userEmail={currentUser?.email || currentUser?.displayName || null} onSignOut={handleSignOut} onOpenLanding={() => setViewMode('landing')} activeSessions={sessions.filter(s => s.status === 'Active').length} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={loadApps} className="text-xs font-semibold px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg transition-colors">Retry</button>
              </div>
            )}
            <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /><span className="ml-2 text-sm text-slate-500 font-medium">Loading...</span></div>}>
              {tabContent()}
            </React.Suspense>
          </main>
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
                <span className="text-slate-400 font-mono">v2.6.0</span>
              </div>
            </div>
          </footer>
        </div>
        <CreateAppModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onAppCreated={handleAppCreated} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setViewMode('console')} />
      </div>
    </SafeRender>
  );
}
