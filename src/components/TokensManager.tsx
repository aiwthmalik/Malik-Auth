import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Search,
  ShieldOff,
  X,
  RefreshCw,
} from 'lucide-react';
import { MalikToken } from '../types';
import { PageHeader, StatusBadge, EmptyState, TableShell, Sensitive, FieldLabel } from './ui';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';

interface TokensManagerProps {
  appId: string;
  tokens: MalikToken[];
  onRefresh: () => void;
}

function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export const TokensManager: React.FC<TokensManagerProps> = ({
  appId,
  tokens,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [tokenName, setTokenName] = useState('');
  const [maxUses, setMaxUses] = useState(0);
  const [expiryMode, setExpiryMode] = useState<'none' | '1day' | '7days' | '30days' | '365days' | 'custom'>('none');
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('23:59');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<{ id: string; token: string } | null>(null);
  const [deletingToken, setDeletingToken] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);

  const computeExpiry = (): string | undefined => {
    if (expiryMode === 'none') return undefined;
    let d: Date;
    if (expiryMode === '1day') d = new Date(Date.now() + 1 * 86400000);
    else if (expiryMode === '7days') d = new Date(Date.now() + 7 * 86400000);
    else if (expiryMode === '30days') d = new Date(Date.now() + 30 * 86400000);
    else if (expiryMode === '365days') d = new Date(Date.now() + 365 * 86400000);
    else {
      const [year, month, day] = customDate.split('-').map(Number);
      const [hours, minutes] = customTime.split(':').map(Number);
      d = new Date(year, month - 1, day, hours, minutes, 0);
    }
    return d.toISOString();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTokens: string[] = [];
      for (let i = 0; i < amount; i++) {
        newTokens.push(generateRandomHex(64));
      }
      setGeneratedTokens(newTokens);
      setTokenName('');
      setMaxUses(0);
      setExpiryMode('none');
      // Parent component will handle actual persistence
      onRefresh();
    } catch (err) {
      console.error('Failed to generate tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteToken = async () => {
    if (!tokenToDelete) return;
    setDeletingToken(true);
    try {
      setTokenToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete token:', err);
    } finally {
      setDeletingToken(false);
    }
  };

  const handleRevoke = (token: MalikToken) => {
    if (!token.id) return;
    onRefresh();
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const copyAllActive = () => {
    const activeTokens = tokens
      .filter((t) => t.status === 'Active')
      .map((t) => t.token)
      .join('\n');
    if (!activeTokens) return;
    navigator.clipboard.writeText(activeTokens);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2500);
  };

  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      t.token.toLowerCase().includes(search.toLowerCase()) ||
      (t.name && t.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = tokens.filter((t) => t.status === 'Active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        accent="violet"
        title="Token Manager"
        subtitle="Generate and manage authentication tokens as an alternative to license keys."
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" />
            <span>Generate Tokens</span>
          </button>
        }
      />

      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
            <input
              type="text"
              placeholder="Search tokens or name..."
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
            <option value="ALL">All Statuses ({tokens.length})</option>
            <option value="Active">Active ({tokens.filter((t) => t.status === 'Active').length})</option>
            <option value="Expired">Expired ({tokens.filter((t) => t.status === 'Expired').length})</option>
            <option value="Revoked">Revoked ({tokens.filter((t) => t.status === 'Revoked').length})</option>
          </select>
        </div>

        <button
          onClick={copyAllActive}
          disabled={activeCount === 0}
          className="btn-ghost text-xs"
        >
          {bulkCopied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied Active Tokens!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy All Active ({activeCount})</span>
            </>
          )}
        </button>
      </div>

      {generatedTokens.length > 0 && (
        <div className="card border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
              <Check className="h-4 w-4" />
              Generated Tokens
            </div>
            <button onClick={() => setGeneratedTokens([])} className="text-surface-400 hover:text-surface-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {generatedTokens.map((t, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white p-2 dark:border-white/10 dark:bg-white/[0.03]">
                <Sensitive value={t} className="flex-1 font-mono text-xs" />
                <button onClick={() => copyToken(t)} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                  {copiedToken === t ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(generatedTokens.join('\n')); setBulkCopied(true); setTimeout(() => setBulkCopied(false), 2500); }}
            className="btn-ghost mt-3 text-xs w-full"
          >
            <Copy className="h-4 w-4" />
            <span>Copy All Generated Tokens</span>
          </button>
        </div>
      )}

      <TableShell
        headers={['Token', 'Name', 'Uses', 'Expiry', 'Status', 'Last Used', 'Actions']}
        empty={
          <EmptyState
            icon={KeyRound}
            title="No tokens found"
            message="Generate tokens above to use as an alternative authentication method."
          />
        }
      >
        {filteredTokens.map((tok) => {
          const rowMenuItems: ActionMenuItem[] = [
            {
              label: 'Copy Token',
              icon: Copy,
              onClick: () => copyToken(tok.token),
            },
            {
              label: 'Revoke Token',
              icon: ShieldOff,
              variant: 'danger',
              onClick: () => handleRevoke(tok),
            },
            {
              label: 'Delete Token',
              icon: Trash2,
              variant: 'danger',
              onClick: () => tok.id && setTokenToDelete({ id: tok.id, token: tok.token }),
            },
          ];

          return (
            <tr key={tok.id || tok.token} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Sensitive value={tok.token} className="font-mono font-bold text-violet-700 dark:text-violet-300" />
                  <button
                    onClick={() => copyToken(tok.token)}
                    className="p-1 text-surface-400 transition-colors hover:text-surface-800 dark:hover:text-white"
                    title="Copy Token"
                  >
                    {copiedToken === tok.token ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex rounded-lg border border-surface-200 bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-200">
                  {tok.name || 'Unnamed Token'}
                </span>
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-700 dark:text-surface-300">
                {tok.usesCount} / {tok.maxUses === 0 ? '∞' : tok.maxUses}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-surface-700 dark:text-surface-300">
                {tok.expiry ? new Date(tok.expiry).toLocaleDateString() : 'Never'}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={tok.status} />
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
                {tok.lastUsed ? new Date(tok.lastUsed).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3.5 text-right">
                <ActionMenu items={rowMenuItems} align="right" />
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Generate Tokens</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Create 64-character hex authentication tokens</p>
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
                  <FieldLabel>Token Name</FieldLabel>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. Production Token"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Max Uses (0 = Unlimited)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="input"
                />
              </div>

              <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-4 space-y-3 dark:border-white/10 dark:bg-white/[0.03]">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                  <RefreshCw className="h-4 w-4 text-violet-500" />
                  Token Expiry
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['none', 'No Expiry'],
                    ['1day', '1 Day'],
                    ['7days', '7 Days'],
                    ['30days', '30 Days'],
                    ['365days', '1 Year'],
                    ['custom', 'Custom'],
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExpiryMode(mode)}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ${
                        expiryMode === mode
                          ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-600/20'
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
                      <FieldLabel>Date</FieldLabel>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Generating...' : `Generate ${amount} Token(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!tokenToDelete}
        title="Delete Token"
        message={`Are you sure you want to delete token "${tokenToDelete?.token.slice(0, 16)}..."? This action is irreversible.`}
        confirmLabel="Delete Token"
        isLoading={deletingToken}
        onConfirm={confirmDeleteToken}
        onClose={() => setTokenToDelete(null)}
      />
    </div>
  );
};
