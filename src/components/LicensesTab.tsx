import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Search,
  AlertCircle,
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Generate Button (Minimal) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">License Key Repository</h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Keys</span>
        </button>
      </div>

      {/* Filter & Bulk Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search keys, name, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
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
          disabled={licenses.filter((l) => l.status === 'Unused').length === 0}
          className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-center space-x-1.5 transition-colors"
        >
          {bulkCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600">Copied All Unused Keys!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy All Unused Keys ({licenses.filter((l) => l.status === 'Unused').length})</span>
            </>
          )}
        </button>
      </div>

      {/* Licenses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredLicenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No licenses match your search criteria. Generate keys above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold">License Key (Hover to Reveal)</th>
                  <th className="py-3.5 px-4 font-semibold">Key Name</th>
                  <th className="py-3.5 px-4 font-semibold">Expiry & Countdown</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">HWID / Used By</th>
                  <th className="py-3.5 px-4 font-semibold">Note</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                    <tr key={lic.id || lic.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        <div className="flex items-center space-x-2">
                          <span
                            className="blur-sm hover:blur-none transition-all duration-200 cursor-pointer select-all"
                            title="Hover to reveal license key"
                          >
                            {lic.key}
                          </span>
                          <button
                            onClick={() => copyKey(lic.key)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                            title="Copy Key"
                          >
                            {copiedKey === lic.key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                          {lic.keyName || 'Standard Key'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        <ExpiryCountdown expiryStr={lic.expiry} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            effectiveStatus === 'Unused'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : effectiveStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : effectiveStatus === 'Expired'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {lic.usedBy ? (
                          <span
                            className="blur-xs hover:blur-none transition-all duration-200 cursor-pointer"
                            title="Hover to reveal HWID"
                          >
                            {lic.usedBy}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {lic.note || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ActionMenu items={rowMenuItems} align="right" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop-up Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Generate License Keys</h3>
                  <p className="text-xs text-slate-500">
                    Create secure MALIK-XXXX-XXXX license keys
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                    Amount (1-50) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                    Key Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. VIP Access Key"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Note / Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Sold to @username (Batch #01)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Improved Expiry Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Expiry Duration / Time ({TIMEZONE_LABEL})</span>
                  </label>
                  <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                    {computeExpiryString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpiryMode('1day')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '1day'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1 Day (24h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('7days')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '7days'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    7 Days (1 Week)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('30days')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '30days'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    30 Days (1 Month)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('365days')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === '365days'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    365 Days (1 Year)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('lifetime')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === 'lifetime'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Lifetime (Never)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryMode('custom')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryMode === 'custom'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Custom Date/Time
                  </button>
                </div>

                {expiryMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Calendar Date
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-600/20"
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


