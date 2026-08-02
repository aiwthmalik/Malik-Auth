import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Search,
  Clock,
  ShieldAlert,
  X
} from 'lucide-react';
import { MalikLicense } from '../types';
import { generateLicenses, deleteLicense, updateLicense, logActivity } from '../lib/malikAuthService';
import { formatCustomExpiryDate, parseExpiryToDate, TIMEZONE_LABEL } from '../lib/dateUtils';
import { ExpiryCountdown } from './ExpiryCountdown';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';
import { ExtendExpiryModal } from './ExtendExpiryModal';
import { PageHeader, StatusBadge, EmptyState, TableShell, Sensitive, FieldLabel } from './ui';

interface LicensesTabProps {
  appId: string;
  licenses: MalikLicense[];
  onRefresh: () => void;
}

export const LicensesTab: React.FC<LicensesTabProps> = ({
  appId,
  licenses,
  onRefresh,
}) => {
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; key: string } | null>(null);
  const [deletingKey, setDeletingKey] = useState(false);
  const [expiryModalLicense, setExpiryModalLicense] = useState<MalikLicense | null>(null);
  const [updatingExpiry, setUpdatingExpiry] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [keyName, setKeyName] = useState('');
  const [note, setNote] = useState('');
  const [expiryMode, setExpiryMode] = useState<'30days' | '1day' | '7days' | '365days' | 'lifetime' | 'custom'>('30days');
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('23:59');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);

  const computeExpiryString = () => {
    if (expiryMode === 'lifetime') {
      return 'Lifetime (Never Expires)';
    }
    let d: Date;
    if (expiryMode === '1day') {
      d = new Date(Date.now() + 1 * 86400000);
    } else if (expiryMode === '7days') {
      d = new Date(Date.now() + 7 * 86400000);
    } else if (expiryMode === '30days') {
      d = new Date(Date.now() + 30 * 86400000);
    } else if (expiryMode === '365days') {
      d = new Date(Date.now() + 365 * 86400000);
    } else {
      // Custom Date & Time
      const [year, month, day] = customDate.split('-').map(Number);
      const [hours, minutes] = customTime.split(':').map(Number);
      d = new Date(year, month - 1, day, hours, minutes, 0);
    }
    return formatCustomExpiryDate(d);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim() || !note.trim()) {
      alert('Key Name and Note are required fields.');
      return;
    }
    const finalExpiry = computeExpiryString();
    setLoading(true);
    try {
      await generateLicenses(appId, Number(amount), keyName.trim(), note.trim(), finalExpiry);
      setKeyName('');
      setNote('');
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to generate licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteKey = async () => {
    if (!keyToDelete) return;
    setDeletingKey(true);
    try {
      await deleteLicense(keyToDelete.id);
      await logActivity(appId, 'KEY_GENERATED', 'Admin', 'N/A', `Deleted license key ${keyToDelete.key}`);
      setKeyToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete license:', err);
    } finally {
      setDeletingKey(false);
    }
  };

  const handleToggleBan = async (license: MalikLicense) => {
    const newStatus = license.status === 'Banned' ? 'Unused' : 'Banned';
    if (!license.id) return;
    await updateLicense(license.id, { status: newStatus });
    await logActivity(
      appId,
      'KEY_GENERATED',
      'Admin',
      'N/A',
      `Changed license ${license.key} status to ${newStatus}`
    );
    onRefresh();
  };

  const handleSaveExpiry = async (newExpiryStr: string) => {
    if (!expiryModalLicense || !expiryModalLicense.id) return;
    setUpdatingExpiry(true);
    try {
      await updateLicense(expiryModalLicense.id, { expiry: newExpiryStr });
      await logActivity(
        appId,
        'KEY_GENERATED',
        'Admin',
        'N/A',
        `Updated expiry for license ${expiryModalLicense.key} to ${newExpiryStr}`
      );
      setExpiryModalLicense(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update expiry:', err);
    } finally {
      setUpdatingExpiry(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllUnused = () => {
    const unusedKeys = licenses
      .filter((l) => l.status === 'Unused')
      .map((l) => l.key)
      .join('\n');
    if (!unusedKeys) return;
    navigator.clipboard.writeText(unusedKeys);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2500);
  };

  const filteredLicenses = licenses.filter((l) => {
    const matchesSearch =
      l.key.toLowerCase().includes(search.toLowerCase()) ||
      l.note.toLowerCase().includes(search.toLowerCase()) ||
      (l.keyName && l.keyName.toLowerCase().includes(search.toLowerCase())) ||
      l.usedBy.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unusedCount = licenses.filter((l) => l.status === 'Unused').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Generate Button */}
      <PageHeader
        icon={Key}
        accent="brand"
        title="License Key Repository"
        subtitle="Generate, manage, and distribute secure MALIK-XXXX keys."
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" />
            <span>Generate Keys</span>
          </button>
        }
      />

      {/* Filter & Bulk Actions Bar */}
      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
            <input
              type="text"
              placeholder="Search keys, name, or note..."
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
            <option value="ALL">All Statuses ({licenses.length})</option>
            <option value="Unused">Unused ({licenses.filter((l) => l.status === 'Unused').length})</option>
            <option value="Active">Active ({licenses.filter((l) => l.status === 'Active').length})</option>
            <option value="Expired">Expired ({licenses.filter((l) => l.status === 'Expired').length})</option>
            <option value="Banned">Banned ({licenses.filter((l) => l.status === 'Banned').length})</option>
          </select>
        </div>

        <button
          onClick={copyAllUnused}
          disabled={unusedCount === 0}
          className="btn-ghost text-xs"
        >
          {bulkCopied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied All Unused Keys!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy All Unused Keys ({unusedCount})</span>
            </>
          )}
        </button>
      </div>

      {/* Licenses Table */}
      <TableShell
        headers={['License Key', 'Key Name', 'Expiry & Countdown', 'Status', 'HWID / Used By', 'Note', 'Actions']}
        empty={
          <EmptyState
            icon={Key}
            title="No licenses found"
            message="No licenses match your search criteria. Generate keys above to get started."
          />
        }
      >
        {filteredLicenses.map((lic) => {
          const targetDate = parseExpiryToDate(lic.expiry);
          const isTimePassed = targetDate ? targetDate.getTime() <= Date.now() : false;
          const effectiveStatus = (lic.status === 'Active' || lic.status === 'Unused') && isTimePassed ? 'Expired' : lic.status;

          const rowMenuItems: ActionMenuItem[] = [
            {
              label: 'Copy License Key',
              icon: Copy,
              onClick: () => copyKey(lic.key),
            },
            {
              label: 'Extend / Change Expiry',
              icon: Clock,
              variant: 'indigo',
              onClick: () => setExpiryModalLicense(lic),
            },
            {
              label: lic.status === 'Banned' ? 'Unban Key' : 'Ban Key',
              icon: ShieldAlert,
              variant: lic.status === 'Banned' ? 'success' : 'danger',
              onClick: () => handleToggleBan(lic),
            },
            {
              label: 'Delete Key',
              icon: Trash2,
              variant: 'danger',
              onClick: () => lic.id && setKeyToDelete({ id: lic.id, key: lic.key }),
            },
          ];

          return (
            <tr key={lic.id || lic.key} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Sensitive value={lic.key} className="font-mono font-bold text-brand-700 dark:text-brand-300" />
                  <button
                    onClick={() => copyKey(lic.key)}
                    className="p-1 text-surface-400 transition-colors hover:text-surface-800 dark:hover:text-white"
                    title="Copy Key"
                  >
                    {copiedKey === lic.key ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex rounded-lg border border-surface-200 bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-200">
                  {lic.keyName || 'Standard Key'}
                </span>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
                <ExpiryCountdown expiryStr={lic.expiry} />
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={effectiveStatus} />
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-600 dark:text-surface-400">
                {lic.usedBy ? (
                  <Sensitive value={lic.usedBy} className="font-medium" />
                ) : (
                  <span className="text-surface-400 dark:text-surface-500">—</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-700 dark:text-surface-300">
                {lic.note || <span className="text-surface-400 dark:text-surface-500">—</span>}
              </td>
              <td className="px-4 py-3.5 text-right">
                <ActionMenu items={rowMenuItems} align="right" />
              </td>
            </tr>
          );
        })}
      </TableShell>

      {/* Pop-up Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-500">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Generate License Keys</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Create secure MALIK-XXXX-XXXX license keys
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Amount (1-50)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <FieldLabel required>Key Name</FieldLabel>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. VIP Access Key"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <FieldLabel required>Note / Reference</FieldLabel>
                <input
                  type="text"
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Sold to @username (Batch #01)"
                  className="input"
                />
              </div>

              {/* Improved Expiry Selection */}
              <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-4 space-y-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                    <Clock className="h-4 w-4 text-brand-500" />
                    <span>Expiry Duration / Time ({TIMEZONE_LABEL})</span>
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-300">
                    {computeExpiryString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['1day', '1 Day (24h)'],
                    ['7days', '7 Days (1 Week)'],
                    ['30days', '30 Days (1 Month)'],
                    ['365days', '365 Days (1 Year)'],
                    ['lifetime', 'Lifetime (Never)'],
                    ['custom', 'Custom Date/Time'],
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExpiryMode(mode)}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ${
                        expiryMode === mode
                          ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                          : 'border-surface-200 bg-white text-surface-700 hover:bg-surface-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-200 dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {expiryMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 border-t border-surface-200 pt-3 dark:border-white/10">
                    <div>
                      <FieldLabel>Calendar Date</FieldLabel>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="input py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <FieldLabel>Time</FieldLabel>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="input py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs"
                >
                  {loading ? 'Generating...' : `Generate ${amount} Key(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!keyToDelete}
        title="Delete License Key"
        message={`Are you sure you want to delete license key "${keyToDelete?.key}"? This action is irreversible.`}
        confirmLabel="Delete License Key"
        isLoading={deletingKey}
        onConfirm={confirmDeleteKey}
        onClose={() => setKeyToDelete(null)}
      />

      <ExtendExpiryModal
        isOpen={!!expiryModalLicense}
        title={`Extend / Change Expiry for Key "${expiryModalLicense?.key}"`}
        currentExpiry={expiryModalLicense?.expiry}
        isLoading={updatingExpiry}
        onSave={handleSaveExpiry}
        onClose={() => setExpiryModalLicense(null)}
      />
    </div>
  );
};