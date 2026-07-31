import React, { useState } from 'react';
import {
  AppWindow,
  PlusCircle,
  Trash2,
  Check,
  Shield,
  Webhook,
  Calendar,
  AlertCircle,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { MalikApp } from '../types';
import { deleteApp, updateApp } from '../lib/malikAuthService';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWebhook, setEditWebhook] = useState('');
  const [editMotd, setEditMotd] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDelete = async (app: MalikApp) => {
    if (!app.id) return;
    const confirmMsg = `Are you sure you want to delete application "${app.name}" (${app.appId})? This action is irreversible.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(app.id);
    try {
      await deleteApp(app.id);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete app:', err);
      alert('Error deleting application: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (app: MalikApp) => {
    setEditingId(app.id || null);
    setEditName(app.name);
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

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <AppWindow className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Application Management</h1>
              <p className="text-xs text-slate-500">
                View, configure, switch between, or delete your MalikAuth software applications.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateApp}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm shadow-indigo-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Application</span>
        </button>
      </div>

      {/* Applications List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Applications ({apps.length})
          </span>
          <span className="text-xs text-slate-500">
            Active Application is highlighted
          </span>
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
          <div className="divide-y divide-slate-100">
            {apps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const isEditing = editingId === app.id;

              return (
                <div
                  key={app.id}
                  className={`p-6 transition-colors ${
                    isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                            Application Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                            Discord Webhook URL
                          </label>
                          <input
                            type="text"
                            value={editWebhook}
                            onChange={(e) => setEditWebhook(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                            Message of the Day (MOTD)
                          </label>
                          <input
                            type="text"
                            value={editMotd}
                            onChange={(e) => setEditMotd(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveEdit(app)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: App Info */}
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Shield className="w-6 h-6" />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2.5">
                            <h3 className="text-base font-bold text-slate-900">{app.name}</h3>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                              v{app.version}
                            </span>
                            {isSelected && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Active App</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 font-mono">
                            <div>
                              <span className="text-slate-400">App ID: </span>
                              <span className="text-slate-800 font-semibold">{app.appId}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Owner ID: </span>
                              <span className="text-slate-800 font-semibold">{app.ownerId || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(app.createdAt)}</span>
                            </div>
                          </div>

                          {app.discordWebhook && (
                            <div className="mt-2 flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-2.5 py-1 rounded-lg w-fit">
                              <Webhook className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-xs font-mono">
                                Webhook Connected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {!isSelected && (
                          <button
                            onClick={() => onSelectApp(app)}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors border border-indigo-200"
                          >
                            Switch to App
                          </button>
                        )}

                        <button
                          onClick={() => startEdit(app)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-slate-200"
                          title="Edit Webhook & Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(app)}
                          disabled={deletingId === app.id}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-rose-200"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === app.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
