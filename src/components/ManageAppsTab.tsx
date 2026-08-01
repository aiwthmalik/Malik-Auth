import React, { useState } from 'react';
import {
  AppWindow,
  PlusCircle,
  Trash2,
  Check,
  Shield,
  AlertCircle,
  Edit2,
  ArrowRightLeft
} from 'lucide-react';
import { MalikApp } from '../types';
import { deleteApp, updateApp } from '../lib/malikAuthService';
import { formatPKTDateTime } from '../lib/dateUtils';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';

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
      {/* Applications Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <AppWindow className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Applications</h2>
          </div>

          <button
            onClick={onOpenCreateApp}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Application</span>
          </button>
        </div>

        {apps.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Applications Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Get started by creating your first MalikAuth security application.
            </p>
            <button
              onClick={onOpenCreateApp}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
            >
              Create Application
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold">Application</th>
                  <th className="py-3.5 px-4 font-semibold">Version</th>
                  <th className="py-3.5 px-4 font-semibold">App Type</th>
                  <th className="py-3.5 px-4 font-semibold">Creation Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                      <tr key={app.id} className="bg-indigo-50/30">
                        <td colSpan={5} className="p-4">
                          <div className="space-y-4 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm">
                            <h4 className="text-xs font-bold uppercase text-indigo-900">
                              Edit Application Settings — {app.name}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Application Title
                                </label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  App Type
                                </label>
                                <input
                                  type="text"
                                  value={editAppType}
                                  onChange={(e) => setEditAppType(e.target.value)}
                                  placeholder="e.g. C#, C++, Python, Web"
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Discord Webhook URL
                                </label>
                                <input
                                  type="text"
                                  value={editWebhook}
                                  onChange={(e) => setEditWebhook(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleSaveEdit(app)}
                                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-sm"
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
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{app.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              App ID: {app.appId}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 flex items-center space-x-1 ml-1">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700">
                        v{app.version}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold uppercase">
                          {app.appType || 'C#'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                        {formatPKTDateTime(app.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ActionMenu items={menuItems} align="right" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
