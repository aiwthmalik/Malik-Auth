import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Tag,
  ExternalLink,
  AlertTriangle,
  Check,
  Rocket,
  Loader2,
  X,
  Calendar,
  Link as LinkIcon,
  MessageSquare
} from 'lucide-react';
import { Card, PageHeader, FieldLabel, EmptyState, TableShell, StatusBadge } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface AutoUpdaterProps {
  appId: string;
  updates: MalikUpdate[];
  onRefresh: () => void;
}

interface MalikUpdate {
  id: string;
  version: string;
  changelog: string;
  downloadUrl: string;
  releaseDate: string;
  minRequiredVersion: string;
  isForced: boolean;
  channel: 'stable' | 'beta' | 'alpha';
}

const CHANNELS = ['stable', 'beta', 'alpha'] as const;

export const AutoUpdater: React.FC<AutoUpdaterProps> = ({ appId, updates, onRefresh }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Publish form state
  const [newVersion, setNewVersion] = useState('');
  const [newChangelog, setNewChangelog] = useState('');
  const [newDownloadUrl, setNewDownloadUrl] = useState('');
  const [newChannel, setNewChannel] = useState<'stable' | 'beta' | 'alpha'>('stable');
  const [minRequired, setMinRequired] = useState('');
  const [isForced, setIsForced] = useState(false);

  const [deleteUpdateId, setDeleteUpdateId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  const filteredUpdates = sortedUpdates.filter((u) => {
    if (channelFilter !== 'all' && u.channel !== channelFilter) return false;
    return true;
  });

  const latestUpdate = sortedUpdates.length > 0 ? sortedUpdates[0] : null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim() || !newChangelog.trim() || !newDownloadUrl.trim()) return;

    setIsPublishing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSuccessMsg(`Version ${newVersion} published successfully!`);
      setNewVersion('');
      setNewChangelog('');
      setNewDownloadUrl('');
      setNewChannel('stable');
      setMinRequired('');
      setIsForced(false);
      setShowPublishForm(false);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to publish update:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteUpdate = async () => {
    if (!deleteUpdateId) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setDeleteUpdateId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete update:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'stable':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400';
      case 'beta':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400';
      case 'alpha':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400';
      default:
        return 'bg-surface-500/10 text-surface-600 border-surface-500/25 dark:text-surface-300';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Rocket}
        accent="violet"
        title="Auto-Updater"
        subtitle="Manage client auto-update system and release channels"
        actions={
          <button onClick={() => setShowPublishForm(true)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" />
            <span>Publish Update</span>
          </button>
        }
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Latest Version Card */}
      {latestUpdate && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                  Latest: v{latestUpdate.version}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Released {formatDate(latestUpdate.releaseDate)}
                </p>
              </div>
            </div>
            <span className={`badge border ${getChannelBadge(latestUpdate.channel)}`}>
              {latestUpdate.channel}
            </span>
          </div>
          <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{latestUpdate.changelog}</p>
          </div>
          {latestUpdate.minRequiredVersion && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Minimum required version: v{latestUpdate.minRequiredVersion}</span>
              {latestUpdate.isForced && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-bold">Forced Update</span>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Channel Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-surface-600 dark:text-surface-400">Channel:</span>
        {['all', ...CHANNELS].map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              channelFilter === ch
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-400'
            }`}
          >
            {ch.charAt(0).toUpperCase() + ch.slice(1)}
          </button>
        ))}
      </div>

      {/* Updates Table */}
      <TableShell
        headers={['Version', 'Channel', 'Release Date', 'Min Required', 'Forced', 'Actions']}
        empty={
          <EmptyState
            icon={Rocket}
            title="No updates published"
            message="Publish your first update to get started."
          />
        }
      >
        {filteredUpdates.map((update) => (
          <tr key={update.id} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
            <td className="px-4 py-3.5">
              <span className="font-mono text-sm font-bold text-surface-900 dark:text-white">
                v{update.version}
              </span>
            </td>
            <td className="px-4 py-3.5">
              <span className={`badge border ${getChannelBadge(update.channel)}`}>
                {update.channel}
              </span>
            </td>
            <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-surface-400" />
                {formatDate(update.releaseDate)}
              </div>
            </td>
            <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
              {update.minRequiredVersion || '—'}
            </td>
            <td className="px-4 py-3.5">
              {update.isForced ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  Forced
                </span>
              ) : (
                <span className="text-surface-400 dark:text-surface-500">—</span>
              )}
            </td>
            <td className="px-4 py-3.5 text-right">
              <div className="flex items-center justify-end gap-1">
                <a
                  href={update.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-surface-400 hover:text-brand-500"
                  title="Open download URL"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setDeleteUpdateId(update.id)}
                  className="p-1.5 text-surface-400 hover:text-rose-500"
                  title="Delete update"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      {/* Publish Form Modal */}
      {showPublishForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white">Publish Update</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Release a new version to clients</p>
                </div>
              </div>
              <button
                onClick={() => setShowPublishForm(false)}
                className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Version</FieldLabel>
                  <input
                    type="text"
                    required
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="e.g. 1.2.0"
                    className="input font-mono text-xs"
                  />
                </div>
                <div>
                  <FieldLabel required>Channel</FieldLabel>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as any)}
                    className="select text-xs"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel required>Download URL</FieldLabel>
                <input
                  type="url"
                  required
                  value={newDownloadUrl}
                  onChange={(e) => setNewDownloadUrl(e.target.value)}
                  placeholder="https://..."
                  className="input text-xs"
                />
              </div>

              <div>
                <FieldLabel required>Changelog</FieldLabel>
                <textarea
                  required
                  value={newChangelog}
                  onChange={(e) => setNewChangelog(e.target.value)}
                  placeholder="What changed in this version..."
                  className="input min-h-[100px] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Min Required Version</FieldLabel>
                  <input
                    type="text"
                    value={minRequired}
                    onChange={(e) => setMinRequired(e.target.value)}
                    placeholder="e.g. 1.0.0"
                    className="input font-mono text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isForced}
                      onChange={(e) => setIsForced(e.target.checked)}
                      className="h-4 w-4 rounded border-surface-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                      Force update for clients below min version
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => setShowPublishForm(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={isPublishing} className="btn-primary text-xs">
                  {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isPublishing ? 'Publishing...' : 'Publish Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteUpdateId}
        title="Delete Update"
        message="Are you sure you want to delete this update record? This will not affect clients that already downloaded it."
        confirmLabel="Delete Update"
        variant="danger"
        onConfirm={handleDeleteUpdate}
        onClose={() => setDeleteUpdateId(null)}
      />
    </div>
  );
};
