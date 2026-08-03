import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Database,
  Check,
  Copy,
  ShieldAlert
} from 'lucide-react';
import { MalikRemoteVariable } from '../types';
import { setRemoteVariable, deleteRemoteVariable } from '../lib/malikAuthService';
import { formatPKTDateTime } from '../lib/dateUtils';
import { ActionMenu, ActionMenuItem } from './ActionMenu';
import { ConfirmModal } from './ConfirmModal';
import { PageHeader, EmptyState, TableShell, Sensitive, FieldLabel, Card } from './ui';

interface RemoteVariablesTabProps {
  appId: string;
  variables: MalikRemoteVariable[];
  onRefresh: () => void;
}

export const RemoteVariablesTab: React.FC<RemoteVariablesTabProps> = ({
  appId,
  variables,
  onRefresh,
}) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [minRole, setMinRole] = useState('Basic');
  const [loading, setLoading] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [varToDelete, setVarToDelete] = useState<{ id: string; key: string } | null>(null);
  const [deletingVar, setDeletingVar] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    setLoading(true);
    try {
      await setRemoteVariable({
        appId,
        key: key.trim().toUpperCase(),
        value: value.trim(),
        isEncrypted,
        minRole,
      });
      setKey('');
      setValue('');
      onRefresh();
    } catch (err) {
      console.error('Error saving remote variable:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteVar = async () => {
    if (!varToDelete) return;
    setDeletingVar(true);
    try {
      await deleteRemoteVariable(varToDelete.id);
      setVarToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete remote variable:', err);
    } finally {
      setDeletingVar(false);
    }
  };

  const toggleVisible = (id: string) => {
    setVisibleValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyVal = (val: string, k: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Database}
        title="Remote Server Variables"
        subtitle="Push live key/value settings to your client applications in real time."
        accent="brand"
        actions={
          <span className="badge border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {variables.length} Variable{variables.length === 1 ? '' : 's'}
          </span>
        }
      />

      {/* Create Variable Form */}
      <CreateVariableForm
        onSubmit={handleSave}
        keyState={key}
        setKeyState={setKey}
        valueState={value}
        setValueState={setValue}
        isEncrypted={isEncrypted}
        setIsEncrypted={setIsEncrypted}
        minRole={minRole}
        setMinRole={setMinRole}
        loading={loading}
      />

      {/* Variables Table */}
      <TableShell
        headers={['Variable Key', 'Value / Payload', 'Encryption', 'Min Role', 'Last Updated', 'Actions']}
        empty={
          <EmptyState
            icon={Database}
            title="No remote variables configured"
            message="Add your variables above to push live settings to your client applications."
          />
        }
      >
        {variables.map((v) => {
          const isVisible = visibleValues[v.id || v.key];

          const rowMenuItems: ActionMenuItem[] = [
            {
              label: 'Edit Variable',
              icon: Edit2,
              onClick: () => {
                setKey(v.key);
                setValue(v.value);
                setMinRole(v.minRole);
              },
            },
            {
              label: 'Delete Variable',
              icon: Trash2,
              variant: 'danger',
              onClick: () => v.id && setVarToDelete({ id: v.id, key: v.key }),
            },
          ];

          return (
            <tr key={v.id || v.key} className="hover:bg-surface-50/80 transition-colors dark:hover:bg-white/[0.03]">
              <td className="py-3.5 px-4 font-mono font-bold text-brand-700 dark:text-brand-400">
                {v.key}
              </td>
              <td className="py-3.5 px-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  {isVisible ? (
                    <span className="text-surface-900 select-all dark:text-surface-100">{v.value}</span>
                  ) : (
                    <Sensitive value={'••••••••••••••••'} className="text-surface-400 dark:text-surface-500" />
                  )}
                  <button
                    onClick={() => toggleVisible(v.id || v.key)}
                    className="rounded-lg p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white"
                    title="Toggle Visibility"
                  >
                    {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => copyVal(v.value, v.key)}
                    className="rounded-lg p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white"
                    title="Copy Value"
                  >
                    {copiedKey === v.key ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </td>
              <td className="py-3.5 px-4">
                <span
                  className={`badge border ${
                    v.isEncrypted
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-surface-200 bg-surface-100 text-surface-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-300'
                  }`}
                >
                  {v.isEncrypted ? 'AES Encrypted' : 'Plaintext'}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <span className="badge border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  {v.minRole}+
                </span>
              </td>
              <td className="py-3.5 px-4 text-xs font-medium text-surface-500 dark:text-surface-400">
                {formatPKTDateTime(v.updatedAt)}
              </td>
              <td className="py-3.5 px-4 text-right">
                <ActionMenu items={rowMenuItems} align="right" />
              </td>
            </tr>
          );
        })}
      </TableShell>

      <ConfirmModal
        isOpen={!!varToDelete}
        title="Delete Remote Variable"
        message={`Are you sure you want to delete remote variable "${varToDelete?.key}"? This action is irreversible.`}
        confirmLabel="Delete Variable"
        isLoading={deletingVar}
        onConfirm={confirmDeleteVar}
        onClose={() => setVarToDelete(null)}
      />
    </div>
  );
};

/* ---------- Inline Create Form ---------- */
const CreateVariableForm = ({
  onSubmit,
  keyState,
  setKeyState,
  valueState,
  setValueState,
  isEncrypted,
  setIsEncrypted,
  minRole,
  setMinRole,
  loading,
}: {
  onSubmit: (e: React.FormEvent) => void;
  keyState: string;
  setKeyState: (s: string) => void;
  valueState: string;
  setValueState: (s: string) => void;
  isEncrypted: boolean;
  setIsEncrypted: (b: boolean) => void;
  minRole: string;
  setMinRole: (s: string) => void;
  loading: boolean;
}) => (
  <form onSubmit={onSubmit} className="card animate-in-up p-5">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
      <div className="md:col-span-4">
        <FieldLabel required>Variable Key</FieldLabel>
        <input
          type="text"
          required
          placeholder="e.g. OFFSET_LOCAL_PLAYER"
          value={keyState}
          onChange={(e) => setKeyState(e.target.value)}
          className="input font-mono"
        />
      </div>

      <div className="md:col-span-4">
        <FieldLabel required>Value / Payload</FieldLabel>
        <input
          type="text"
          required
          placeholder="e.g. 0x0182E4B0 or https://..."
          value={valueState}
          onChange={(e) => setValueState(e.target.value)}
          className="input font-mono"
        />
      </div>

      <div className="md:col-span-2">
        <FieldLabel required>Min Role Required</FieldLabel>
        <select
          value={minRole}
          onChange={(e) => setMinRole(e.target.value)}
          className="select"
        >
          <option value="Basic">Basic User</option>
          <option value="VIP">VIP Subscriber</option>
          <option value="Enterprise">Enterprise</option>
          <option value="Admin">Admin Only</option>
        </select>
      </div>

      <div className="md:col-span-1 flex items-center">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-surface-700 dark:text-surface-200">
          <input
            type="checkbox"
            checked={isEncrypted}
            onChange={(e) => setIsEncrypted(e.target.checked)}
            className="h-4 w-4 rounded border-surface-300 bg-white text-brand-600 focus:ring-brand-500/30 dark:border-white/20 dark:bg-white/[0.04]"
          />
          Encrypt
        </label>
      </div>

      <div className="md:col-span-1">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{loading ? 'Saving...' : 'Save & Push'}</span>
        </button>
      </div>
    </div>
  </form>
);