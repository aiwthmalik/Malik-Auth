import React, { useState, useRef } from 'react';
import {
  FileCheck,
  Upload,
  Trash2,
  Search,
  X,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { MalikHashCheck } from '../types';
import { PageHeader, StatusBadge, EmptyState, TableShell, FieldLabel } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface HashChecksProps {
  appId: string;
  hashes: MalikHashCheck[];
  onRefresh: () => void;
}

interface HashManifestEntry {
  fileName: string;
  hash: string;
  fileSize?: number;
}

export const HashChecks: React.FC<HashChecksProps> = ({
  appId,
  hashes,
  onRefresh,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [hashToDelete, setHashToDelete] = useState<string | null>(null);
  const [deletingHash, setDeletingHash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [versionFilter, setVersionFilter] = useState('ALL');
  const [verifyFileName, setVerifyFileName] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<'pass' | 'fail' | null>(null);

  const [uploadForm, setUploadForm] = useState({
    appVersion: '',
    manifestJson: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let entries: HashManifestEntry[];
      try {
        entries = JSON.parse(uploadForm.manifestJson);
      } catch {
        alert('Invalid JSON format. Please provide a valid hash manifest.');
        setLoading(false);
        return;
      }

      if (!Array.isArray(entries)) {
        alert('Manifest must be a JSON array of {fileName, hash} objects.');
        setLoading(false);
        return;
      }

      const newHashes: MalikHashCheck[] = entries.map((entry) => ({
        appId,
        fileName: entry.fileName,
        expectedHash: entry.hash,
        fileSize: entry.fileSize || 0,
        appVersion: uploadForm.appVersion,
        uploadedAt: new Date().toISOString(),
      }));

      console.log('Uploading hash manifest:', newHashes);
      setUploadForm({ appVersion: '', manifestJson: '' });
      setIsUploadModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to upload manifest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setUploadForm({ ...uploadForm, manifestJson: content });
    };
    reader.readAsText(file);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const match = hashes.find(
      (h) => h.fileName === verifyFileName && h.expectedHash === verifyHash
    );
    setVerifyResult(match ? 'pass' : 'fail');
  };

  const confirmDelete = async () => {
    if (!hashToDelete) return;
    setDeletingHash(true);
    try {
      setHashToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete hash:', err);
    } finally {
      setDeletingHash(false);
    }
  };

  const filteredHashes = hashes.filter((h) => {
    const matchesSearch =
      h.fileName.toLowerCase().includes(search.toLowerCase()) ||
      h.expectedHash.toLowerCase().includes(search.toLowerCase());
    const matchesVersion = versionFilter === 'ALL' || h.appVersion === versionFilter;
    return matchesSearch && matchesVersion;
  });

  const versions = [...new Set(hashes.map((h) => h.appVersion))];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileCheck}
        accent="rose"
        title="Hash Checks"
        subtitle="Verify file integrity with SHA-256 hash comparisons."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setIsVerifyModalOpen(true)} className="btn-ghost text-xs">
              <CheckCircle className="h-4 w-4" />
              <span>Verify Hash</span>
            </button>
            <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary text-xs">
              <Upload className="h-4 w-4" />
              <span>Upload Manifest</span>
            </button>
          </div>
        }
      />

      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
            <input
              type="text"
              placeholder="Search file names or hashes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2 pl-9 text-xs"
            />
          </div>

          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="select py-2 text-xs"
          >
            <option value="ALL">All Versions</option>
            {versions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-surface-500 dark:text-surface-400">
          <span className="font-semibold text-rose-600 dark:text-rose-400">{hashes.length}</span> hashes stored
        </div>
      </div>

      <TableShell
        headers={['File Name', 'Expected Hash', 'Size', 'Version', 'Uploaded', 'Actions']}
        empty={
          <EmptyState
            icon={FileCheck}
            title="No hash entries"
            message="Upload a hash manifest to start verifying file integrity."
          />
        }
      >
        {filteredHashes.map((h) => (
          <tr key={h.id || `${h.fileName}-${h.appVersion}`} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="font-mono text-sm font-medium text-surface-900 dark:text-white">{h.fileName}</span>
              </div>
            </td>
            <td className="px-4 py-3.5">
              <code className="rounded-md bg-surface-100 px-2 py-0.5 font-mono text-[11px] text-surface-700 dark:bg-white/[0.06] dark:text-surface-300">
                {h.expectedHash.slice(0, 16)}...{h.expectedHash.slice(-8)}
              </code>
            </td>
            <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
              {h.fileSize > 0 ? `${(h.fileSize / 1024).toFixed(1)} KB` : '—'}
            </td>
            <td className="px-4 py-3.5">
              <span className="inline-flex rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
                {h.appVersion}
              </span>
            </td>
            <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
              {new Date(h.uploadedAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3.5 text-right">
              <button
                onClick={() => h.id && setHashToDelete(h.id)}
                className="p-1.5 text-surface-400 transition-colors hover:text-rose-500"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </TableShell>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-2xl animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Upload Hash Manifest</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Upload a JSON file with file-to-hash mappings</p>
                </div>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadManifest} className="space-y-4">
              <div>
                <FieldLabel required>App Version</FieldLabel>
                <input
                  type="text"
                  required
                  value={uploadForm.appVersion}
                  onChange={(e) => setUploadForm({ ...uploadForm, appVersion: e.target.value })}
                  placeholder="e.g. 1.0.0"
                  className="input"
                />
              </div>

              <div>
                <FieldLabel>Upload JSON File</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost text-xs mb-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose JSON File</span>
                </button>
              </div>

              <div>
                <FieldLabel required>Hash Manifest (JSON Array)</FieldLabel>
                <textarea
                  required
                  rows={8}
                  value={uploadForm.manifestJson}
                  onChange={(e) => setUploadForm({ ...uploadForm, manifestJson: e.target.value })}
                  placeholder={`[\n  { "fileName": "app.exe", "hash": "a1b2c3d4...", "fileSize": 1024000 },\n  { "fileName": "config.json", "hash": "e5f6g7h8...", "fileSize": 2048 }\n]`}
                  className="input font-mono text-xs"
                />
              </div>

              <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Expected format: JSON array with objects containing <code className="font-semibold">fileName</code>, <code className="font-semibold">hash</code> (SHA-256), and optional <code className="font-semibold">fileSize</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Uploading...' : 'Upload Manifest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Verify File Hash</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Compare a file hash against stored values</p>
                </div>
              </div>
              <button onClick={() => { setIsVerifyModalOpen(false); setVerifyResult(null); }} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <FieldLabel required>File Name</FieldLabel>
                <select
                  required
                  value={verifyFileName}
                  onChange={(e) => setVerifyFileName(e.target.value)}
                  className="select"
                >
                  <option value="">Select a file...</option>
                  {[...new Set(hashes.map((h) => h.fileName))].map((fn) => (
                    <option key={fn} value={fn}>{fn}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel required>SHA-256 Hash to Verify</FieldLabel>
                <input
                  type="text"
                  required
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  placeholder="Enter the SHA-256 hash..."
                  className="input font-mono text-xs"
                />
              </div>

              {verifyResult !== null && (
                <div className={`rounded-xl border p-4 ${verifyResult === 'pass' ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-rose-500/25 bg-rose-500/5'}`}>
                  <div className="flex items-center gap-3">
                    {verifyResult === 'pass' ? (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-rose-500" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${verifyResult === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {verifyResult === 'pass' ? 'Hash Match — File Verified' : 'Hash Mismatch — Integrity Failed'}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {verifyResult === 'pass' ? 'The provided hash matches the stored expected hash.' : 'The provided hash does not match any stored hash for this file.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => { setIsVerifyModalOpen(false); setVerifyResult(null); }} className="btn-ghost text-xs">
                  Close
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Verify Hash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!hashToDelete}
        title="Delete Hash Entry"
        message="Are you sure you want to delete this hash entry? This will remove the integrity check for this file."
        confirmLabel="Delete Entry"
        isLoading={deletingHash}
        onConfirm={confirmDelete}
        onClose={() => setHashToDelete(null)}
      />
    </div>
  );
};
