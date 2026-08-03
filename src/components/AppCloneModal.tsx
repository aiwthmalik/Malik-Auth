import React, { useState } from 'react';
import {
  Copy,
  Check,
  X,
  Loader2,
  FileText,
  Database,
  Webhook,
  Users,
  Activity,
  Key
} from 'lucide-react';
import { MalikApp, MalikLicense, MalikRemoteVariable } from '../types';
import { createApp, generateLicenses, setRemoteVariable, logActivity } from '../lib/malikAuthService';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Card, PageHeader, FieldLabel } from './ui';

interface AppCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceApp: MalikApp;
}

interface CloneOptions {
  copyLicenses: boolean;
  copyRemoteVariables: boolean;
  copyWebhookConfig: boolean;
  markLicensesAsUnused: boolean;
  copyUsers: boolean;
  copySessions: boolean;
  copyActivityLogs: boolean;
}

export const AppCloneModal: React.FC<AppCloneModalProps> = ({
  isOpen,
  onClose,
  sourceApp
}) => {
  const [appName, setAppName] = useState(`${sourceApp.name} (Clone)`);
  const [cloning, setCloning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' });
  const [result, setResult] = useState<{ success: boolean; message: string; newAppId?: string } | null>(null);
  const [options, setOptions] = useState<CloneOptions>({
    copyLicenses: true,
    copyRemoteVariables: true,
    copyWebhookConfig: true,
    markLicensesAsUnused: true,
    copyUsers: false,
    copySessions: false,
    copyActivityLogs: false,
  });

  const toggleOption = (key: keyof CloneOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const generateId = (prefix: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}_${result}`;
  };

  const generateKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleClone = async () => {
    setCloning(true);
    setResult(null);
    setProgress({ current: 0, total: 100, step: 'Creating new app...' });

    try {
      const newAppId = generateId('APP');
      const newAppSecret = generateKey();
      const newEncryptionKey = generateKey();

      setProgress({ current: 10, total: 100, step: 'Creating app document...' });

      const newAppData: Omit<MalikApp, 'id' | 'createdAt'> = {
        name: appName,
        appId: newAppId,
        appSecret: newAppSecret,
        version: sourceApp.version,
        appType: sourceApp.appType,
        status: 'Active',
        ownerId: sourceApp.ownerId,
        encryptionKey: newEncryptionKey,
        allowHwidReset: sourceApp.allowHwidReset,
        motd: sourceApp.motd,
        discordWebhook: options.copyWebhookConfig ? sourceApp.discordWebhook : undefined,
      };

      const newAppIdDoc = await createApp(newAppData);

      setProgress({ current: 25, total: 100, step: 'App created. Cloning data...' });

      let itemsCopied = 0;

      if (options.copyLicenses) {
        setProgress({ current: 30, total: 100, step: 'Copying licenses...' });
        const licensesQuery = query(collection(db, 'licenses'), where('appId', '==', sourceApp.appId));
        const licensesSnapshot = await getDocs(licensesQuery);

        const licenseBatch = writeBatch(db);
        licensesSnapshot.docs.forEach((licenseDoc) => {
          const licenseData = licenseDoc.data() as MalikLicense;
          const newDocRef = doc(collection(db, 'licenses'));
          licenseBatch.set(newDocRef, {
            ...licenseData,
            appId: newAppId,
            key: options.markLicensesAsUnused ? `MALIK-CLONE-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : licenseData.key,
            status: options.markLicensesAsUnused ? 'Unused' : licenseData.status,
            usedBy: options.markLicensesAsUnused ? '' : licenseData.usedBy,
            createdAt: new Date().toISOString(),
          });
          itemsCopied++;
        });
        await licenseBatch.commit();
      }

      if (options.copyRemoteVariables) {
        setProgress({ current: 50, total: 100, step: 'Copying remote variables...' });
        const varsQuery = query(collection(db, 'remote_variables'), where('appId', '==', sourceApp.appId));
        const varsSnapshot = await getDocs(varsQuery);

        const varsBatch = writeBatch(db);
        varsSnapshot.docs.forEach((varDoc) => {
          const varData = varDoc.data() as MalikRemoteVariable;
          const newDocRef = doc(collection(db, 'remote_variables'));
          varsBatch.set(newDocRef, {
            ...varData,
            appId: newAppId,
            updatedAt: new Date().toISOString(),
          });
          itemsCopied++;
        });
        await varsBatch.commit();
      }

      setProgress({ current: 80, total: 100, step: 'Finalizing clone...' });

      await logActivity(
        newAppId,
        'KEY_GENERATED',
        'Admin',
        'SYS',
        `App cloned from ${sourceApp.name} (${sourceApp.appId}) with ${itemsCopied} items`
      );

      setProgress({ current: 100, total: 100, step: 'Complete!' });

      setResult({
        success: true,
        message: `Successfully cloned app with ${itemsCopied} items`,
        newAppId,
      });
    } catch (err) {
      console.error('Clone error:', err);
      setResult({ success: false, message: 'Failed to clone app. Please try again.' });
    } finally {
      setCloning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-500">
              <Copy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Clone Application</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Create a copy of {sourceApp.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <FieldLabel required>New App Name</FieldLabel>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="input text-sm"
            />
          </div>

          <Card className="p-4">
            <h4 className="mb-3 text-sm font-bold text-surface-900 dark:text-white">
              What to Clone
            </h4>
            <div className="space-y-2">
              {[
                { key: 'copyLicenses', label: 'License Keys', icon: Key, desc: 'Copy all license keys', badge: options.markLicensesAsUnused ? 'Mark as Unused' : undefined },
                { key: 'copyRemoteVariables', label: 'Remote Variables', icon: Database, desc: 'Copy server variables' },
                { key: 'copyWebhookConfig', label: 'Webhook Config', icon: Webhook, desc: 'Copy Discord webhook URL' },
              ].map(({ key, label, icon: Icon, desc, badge }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleOption(key as keyof CloneOptions)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    options[key as keyof CloneOptions]
                      ? 'border-brand-500/40 bg-brand-500/10'
                      : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    options[key as keyof CloneOptions]
                      ? 'border-brand-500/25 bg-brand-500/10 text-brand-500'
                      : 'border-surface-200 bg-surface-100 text-surface-500 dark:border-white/10 dark:bg-white/[0.04]'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-surface-900 dark:text-white">{label}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">{desc}</div>
                  </div>
                  {badge && (
                    <span className="badge border border-surface-200 bg-surface-100 text-xs dark:border-white/10 dark:bg-white/[0.04]">
                      {badge}
                    </span>
                  )}
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${
                    options[key as keyof CloneOptions]
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-surface-300 dark:border-surface-600'
                  }`}>
                    {options[key as keyof CloneOptions] && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="mb-3 text-sm font-bold text-surface-900 dark:text-white">
              Do NOT Copy
            </h4>
            <div className="space-y-2">
              {[
                { key: 'copyUsers', label: 'Users', icon: Users, desc: 'User accounts and credentials' },
                { key: 'copySessions', label: 'Sessions', icon: Activity, desc: 'Active user sessions' },
                { key: 'copyActivityLogs', label: 'Activity Logs', icon: FileText, desc: 'Audit trail and logs' },
              ].map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleOption(key as keyof CloneOptions)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    options[key as keyof CloneOptions]
                      ? 'border-brand-500/40 bg-brand-500/10'
                      : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    options[key as keyof CloneOptions]
                      ? 'border-brand-500/25 bg-brand-500/10 text-brand-500'
                      : 'border-surface-200 bg-surface-100 text-surface-500 dark:border-white/10 dark:bg-white/[0.04]'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-surface-900 dark:text-white">{label}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">{desc}</div>
                  </div>
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${
                    options[key as keyof CloneOptions]
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-surface-300 dark:border-surface-600'
                  }`}>
                    {options[key as keyof CloneOptions] && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {cloning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400">
                <span>{progress.step}</span>
                <span>{progress.current}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${progress.current}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                result.success
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {result.message}
                {result.newAppId && (
                  <span className="ml-2 font-mono text-xs">({result.newAppId})</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
            <button onClick={onClose} className="btn-ghost text-xs">
              {result?.success ? 'Close' : 'Cancel'}
            </button>
            {!result?.success && (
              <button
                onClick={handleClone}
                disabled={cloning || !appName.trim()}
                className="btn-primary text-xs"
              >
                {cloning ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cloning...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Clone App
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
