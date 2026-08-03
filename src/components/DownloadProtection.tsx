import React, { useState } from 'react';
import {
  Download,
  Plus,
  Copy,
  Check,
  Trash2,
  Search,
  X,
  ExternalLink,
  ShieldOff,
  Link,
} from 'lucide-react';
import { MalikDownload } from '../types';
import { PageHeader, StatusBadge, EmptyState, TableShell, Sensitive, FieldLabel } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface DownloadProtectionProps {
  appId: string;
  downloads: MalikDownload[];
  onRefresh: () => void;
}

function generateToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export const DownloadProtection: React.FC<DownloadProtectionProps> = ({
  appId,
  downloads,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [maxDownloads, setMaxDownloads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dlToDelete, setDlToDelete] = useState<string | null>(null);
  const [deletingDl, setDeletingDl] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = generateToken(32);
      const downloadUrl = `https://yourdomain.com/dl/${token}`;
      const expiry = new Date(Date.now() + expiryDays * 86400000).toISOString();

      const newDownload: MalikDownload = {
        appId,
        originalUrl: originalUrl,
        downloadUrl,
        expiry,
        maxDownloads: maxDownloads,
        downloadCount: 0,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      console.log('Creating download link:', newDownload);
      setOriginalUrl('');
      setExpiryDays(7);
      setMaxDownloads(0);
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to create download link:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!dlToDelete) return;
    setDeletingDl(true);
    try {
      setDlToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete download:', err);
    } finally {
      setDeletingDl(false);
    }
  };

  const handleRevoke = (dl: MalikDownload) => {
    if (!dl.id) return;
    onRefresh();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredDownloads = downloads.filter((dl) => {
    const matchesSearch =
      dl.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
      dl.downloadUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || dl.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = downloads.filter((d) => d.status === 'Active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Download}
        accent="amber"
        title="Download Protection"
        subtitle="Generate secure, expiring download URLs for your files."
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" />
            <span>Create Download Link</span>
          </button>
        }
      />

      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
            <input
              type="text"
              placeholder="Search URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2 pl-9 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select py-2 text-xs"
          >
            <option value="ALL">All Statuses ({downloads.length})</option>
            <option value="Active">Active ({downloads.filter((d) => d.status === 'Active').length})</option>
            <option value="Expired">Expired ({downloads.filter((d) => d.status === 'Expired').length})</option>
            <option value="Revoked">Revoked ({downloads.filter((d) => d.status === 'Revoked').length})</option>
          </select>
        </div>

        <div className="text-xs text-surface-500 dark:text-surface-400">
          <span className="font-semibold text-amber-600 dark:text-amber-400">{activeCount}</span> active links
        </div>
      </div>

      <TableShell
        headers={['Download URL', 'Original File', 'Downloads', 'Expiry', 'Status', 'Actions']}
        empty={
          <EmptyState
            icon={Download}
            title="No download links"
            message="Create protected download URLs above to get started."
          />
        }
      >
        {filteredDownloads.map((dl) => {
          const isExpired = new Date(dl.expiry) < new Date();
          const effectiveStatus = isExpired && dl.status === 'Active' ? 'Expired' : dl.status;

          return (
            <tr key={dl.id || dl.downloadUrl} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Link className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <Sensitive value={dl.downloadUrl} className="font-mono text-xs text-amber-700 dark:text-amber-300" />
                  <button
                    onClick={() => copyUrl(dl.downloadUrl)}
                    className="p-1 text-surface-400 transition-colors hover:text-surface-800 dark:hover:text-white"
                    title="Copy URL"
                  >
                    {copiedUrl === dl.downloadUrl ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400 max-w-[200px] truncate">
                {dl.originalUrl}
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-700 dark:text-surface-300">
                {dl.downloadCount} / {dl.maxDownloads === 0 ? '∞' : dl.maxDownloads}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
                {new Date(dl.expiry).toLocaleDateString()}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={effectiveStatus} />
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => copyUrl(dl.downloadUrl)}
                    className="p-1.5 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRevoke(dl)}
                    className="p-1.5 text-surface-400 transition-colors hover:text-amber-500"
                    title="Revoke"
                  >
                    <ShieldOff className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => dl.id && setDlToDelete(dl.id)}
                    className="p-1.5 text-surface-400 transition-colors hover:text-rose-500"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableShell>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Create Download Link</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Generate a secure, expiring download URL</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <FieldLabel required>Original File URL</FieldLabel>
                <input
                  type="url"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/files/myapp-v1.0.zip"
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Expiry (Days)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    required
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <FieldLabel>Max Downloads (0 = Unlimited)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  The generated URL will be in the format: <span className="font-mono text-amber-600 dark:text-amber-400">https://yourdomain.com/dl/{'{token}'}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Creating...' : 'Create Protected Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!dlToDelete}
        title="Delete Download Link"
        message="Are you sure you want to delete this download link? Anyone with the URL will no longer be able to download."
        confirmLabel="Delete Link"
        isLoading={deletingDl}
        onConfirm={confirmDelete}
        onClose={() => setDlToDelete(null)}
      />
    </div>
  );
};
