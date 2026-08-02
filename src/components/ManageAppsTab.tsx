import React, { useState } from 'react';
import {
  AppWindow,
  PlusCircle,
  Trash2,
  Check,
  Shield,
  Edit2,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { MalikApp } from '../types';
import { deleteApp, updateApp } from '../lib/malikAuthService';
import { formatPKTDateTime } from '../lib/dateUtils';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';
import { PageHeader, EmptyState, TableShell, FieldLabel } from './ui';

interface ManageAppsTabProps {
  apps: MalikApp[];
  selectedApp: MalikApp | null;
  onSelectApp: (app: MalikApp) => void;
  onOpenCreateApp: () => void;
  onRefresh: () => void;
}

export const ManageAppsTab: React.FC<ManageAppsTabProps> = ({
  apps,
  selectedApp,
  onSelectApp,
  onOpenCreateApp,
  onRefresh,
}) => {
  console.log('[ManageAppsTab] rendering with apps:', apps?.length || 0);
  const [appToDelete, setAppToDelete] = useState<MalikApp | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAppType, setEditAppType] = useState('C#');
  const [editWebhook, setEditWebhook] = useState('');
  const [editMotd, setEditMotd] = useState('');
  const [saving, setSaving] = useState(false);

  const confirmDeleteApp = async () => {
    if (!appToDelete || !appToDelete.id) return;
    setDeleting(true);
    try {
      await deleteApp(appToDelete.id);
      setAppToDelete(null);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete app:', err);
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (app: MalikApp) => {
    setEditingId(app.id || null);
    setEditName(app.name);
    setEditAppType(app.appType || 'C#');
    setEditWebhook(app.discordWebhook || '');
    setEditMotd(app.motd || '');
  };

  const handleSaveEdit = async (app: MalikApp) => {
    if (!app.id) return;
    if (!editName.trim()) {
      alert('Application name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await updateApp(app.id, {
        name: editName.trim(),
        appType: editAppType.trim(),
        discordWebhook: editWebhook.trim(),
        motd: editMotd.trim(),
      });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update app:', err);
      alert('Error saving application updates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={AppWindow}
        title="Applications"
        subtitle="Manage your MalikAuth security applications and their configurations."
        accent="brand"
        actions={
          <button onClick={onOpenCreateApp} className="btn-primary">
            <PlusCircle className="h-4 w-4" />
            <span>Create Application</span>
          </button>
        }
      />

      {/* Table */}
      <TableShell
        headers={['Application', 'Version', 'App Type', 'Creation Date & Time', 'Actions']}
        empty={
          <EmptyState
            icon={AppWindow}
            title="No Applications Found"
            message="Get started by creating your first MalikAuth security application."
            action={
              <button onClick={onOpenCreateApp} className="btn-primary">
                <PlusCircle className="h-4 w-4" />
                <span>Create Application</span>
              </button>
            }
          />
        }
      >
        {apps.map((app) => {
          const isSelected = selectedApp?.id === app.id;
          const isEditing = editingId === app.id;

          const menuItems: ActionMenuItem[] = [
            ...(!isSelected
              ? [
                  {
                    label: 'Switch to App',
                    icon: ArrowRightLeft,
                    variant: 'indigo' as const,
                    onClick: () => onSelectApp(app),
                  },
                ]
              : []),
            {
              label: 'Edit Settings',
              icon: Edit2,
              variant: 'default' as const,
              onClick: () => startEdit(app),
            },
            {
              label: 'Delete App',
              icon: Trash2,
              variant: 'danger' as const,
              onClick: () => setAppToDelete(app),
            },
          ];

          if (isEditing) {
            return (
              <tr key={app.id} className="bg-brand-500/[0.03]">
                <td colSpan={5} className="p-4">
                  <div className="space-y-4 rounded-xl border border-brand-500/20 bg-white p-4 shadow-sm dark:bg-[#15151f]">
                    <div className="flex items-center justify-between border-b border-surface-200 pb-3 dark:border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-200">
                        Edit Application Settings —{' '}
                        <span className="font-mono text-brand-600 dark:text-brand-400">{app.name}</span>
                      </h4>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white"
                        title="Cancel editing"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <FieldLabel required>Application Title</FieldLabel>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <FieldLabel>App Type</FieldLabel>
                        <input
                          type="text"
                          value={editAppType}
                          onChange={(e) => setEditAppType(e.target.value)}
                          placeholder="e.g. C#, C++, Python, Web"
                          className="input"
                        />
                      </div>
                      <div>
                        <FieldLabel>Discord Webhook URL</FieldLabel>
                        <input
                          type="text"
                          value={editWebhook}
                          onChange={(e) => setEditWebhook(e.target.value)}
                          className="input font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Message of the Day (MOTD)</FieldLabel>
                      <input
                        type="text"
                        value={editMotd}
                        onChange={(e) => setEditMotd(e.target.value)}
                        placeholder="e.g. Welcome back to the app!"
                        className="input"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveEdit(app)}
                        className="btn-primary"
                      >
                        {saving ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          }

          return (
            <tr
              key={app.id}
              className={`transition-colors ${
                isSelected
                  ? 'bg-brand-500/[0.04] hover:bg-brand-500/[0.07] dark:bg-brand-500/[0.06]'
                  : 'hover:bg-surface-50/80 dark:hover:bg-white/[0.03]'
              }`}
            >
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                        : 'bg-surface-100 text-surface-600 dark:bg-white/[0.06] dark:text-surface-300'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-surface-900 dark:text-white">{app.name}</span>
                    <span className="font-mono text-[10px] text-surface-400 dark:text-surface-500">
                      App ID: {app.appId}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="badge ml-1 border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3.5 px-4 font-mono text-xs font-medium text-surface-700 dark:text-surface-300">
                v{app.version}
              </td>
              <td className="py-3.5 px-4 font-mono text-xs">
                <span className="badge border border-surface-200 bg-surface-100 text-surface-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-200">
                  {app.appType || 'C#'}
                </span>
              </td>
              <td className="py-3.5 px-4 text-xs font-medium text-surface-500 dark:text-surface-400">
                {formatPKTDateTime(app.createdAt)}
              </td>
              <td className="py-3.5 px-4 text-right">
                <ActionMenu items={menuItems} align="right" />
              </td>
            </tr>
          );
        })}
      </TableShell>

      <ConfirmModal
        isOpen={!!appToDelete}
        title="Delete Application"
        message={`Are you sure you want to delete application "${appToDelete?.name}" (${appToDelete?.appId})? This action is irreversible.`}
        confirmLabel="Delete Application"
        isLoading={deleting}
        onConfirm={confirmDeleteApp}
        onClose={() => setAppToDelete(null)}
      />
    </div>
  );
};