import React, { useState } from 'react';
import {
  ToggleLeft,
  Plus,
  Trash2,
  Search,
  X,
  Edit3,
} from 'lucide-react';
import { MalikFunction } from '../types';
import { PageHeader, StatusBadge, EmptyState, TableShell, FieldLabel } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface FunctionManagerProps {
  appId: string;
  functions: MalikFunction[];
  onRefresh: () => void;
}

const PREDEFINED_FUNCTIONS = [
  { name: 'PremiumFeature', description: 'Access to premium-only features', requiredTier: 'Pro' },
  { name: 'EarlyAccess', description: 'Early access to new features before release', requiredTier: 'Pro' },
  { name: 'BetaFeatures', description: 'Access to beta features under testing', requiredTier: 'Basic' },
  { name: 'ExportData', description: 'Ability to export data in bulk', requiredTier: 'Enterprise' },
  { name: 'AdvancedAnalytics', description: 'Detailed analytics dashboard access', requiredTier: 'Enterprise' },
];

export const FunctionManager: React.FC<FunctionManagerProps> = ({
  appId,
  functions,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFn, setEditingFn] = useState<MalikFunction | null>(null);
  const [fnToDelete, setFnToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const [fnForm, setFnForm] = useState({
    name: '',
    description: '',
    enabled: true,
    requiredTier: 'Basic',
  });

  const handleSaveFn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingFn && editingFn.id) {
        onRefresh();
      } else {
        const newFn: MalikFunction = {
          appId,
          name: fnForm.name,
          description: fnForm.description,
          enabled: fnForm.enabled,
          requiredTier: fnForm.requiredTier,
          enabledForUsers: [],
          createdAt: new Date().toISOString(),
        };
        console.log('Creating function:', newFn);
        onRefresh();
      }
      setFnForm({ name: '', description: '', enabled: true, requiredTier: 'Basic' });
      setEditingFn(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save function:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFn = (fn: MalikFunction) => {
    setEditingFn(fn);
    setFnForm({
      name: fn.name,
      description: fn.description,
      enabled: fn.enabled,
      requiredTier: fn.requiredTier,
    });
    setIsModalOpen(true);
  };

  const confirmDeleteFn = () => {
    if (!fnToDelete) return;
    setFnToDelete(null);
    onRefresh();
  };

  const handleToggle = (fn: MalikFunction) => {
    if (!fn.id) return;
    onRefresh();
  };

  const handleBulkEnable = (tier: string) => {
    functions.forEach((fn) => {
      if (fn.requiredTier === tier && !fn.enabled) {
        handleToggle(fn);
      }
    });
  };

  const handleBulkDisable = (tier: string) => {
    functions.forEach((fn) => {
      if (fn.requiredTier === tier && fn.enabled) {
        handleToggle(fn);
      }
    });
  };

  const handleAddPredefined = (predefined: typeof PREDEFINED_FUNCTIONS[0]) => {
    setFnForm({
      name: predefined.name,
      description: predefined.description,
      enabled: true,
      requiredTier: predefined.requiredTier,
    });
    setEditingFn(null);
    setIsModalOpen(true);
  };

  const filteredFunctions = functions.filter((fn) => {
    const matchesSearch =
      fn.name.toLowerCase().includes(search.toLowerCase()) ||
      fn.description.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || fn.requiredTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const tiers: string[] = [...new Set<string>(functions.map((f) => f.requiredTier || ''))];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ToggleLeft}
        accent="sky"
        title="Function Management"
        subtitle="Toggle features on/off per app or subscription tier."
        actions={
          <button onClick={() => { setEditingFn(null); setFnForm({ name: '', description: '', enabled: true, requiredTier: 'Basic' }); setIsModalOpen(true); }} className="btn-primary text-xs">
            <Plus className="h-4 w-4" />
            <span>Add Function</span>
          </button>
        }
      />

      {functions.length === 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Quick Add Predefined Functions</h3>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_FUNCTIONS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleAddPredefined(p)}
                className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-medium text-surface-700 transition-all hover:border-sky-400 hover:bg-sky-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-200 dark:hover:border-sky-500/50"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Bulk Actions by Tier</h3>
          <div className="flex flex-wrap gap-2">
            {tiers.map((tier) => (
              <div key={tier} className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white p-2 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">{tier}</span>
                <button onClick={() => handleBulkEnable(tier)} className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400">
                  Enable All
                </button>
                <button onClick={() => handleBulkDisable(tier)} className="rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400">
                  Disable All
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
            <input
              type="text"
              placeholder="Search functions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2 pl-9 text-xs"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="select py-2 text-xs"
          >
            <option value="ALL">All Tiers</option>
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      <TableShell
        headers={['Status', 'Function', 'Description', 'Required Tier', 'Enabled Users', 'Actions']}
        empty={
          <EmptyState
            icon={ToggleLeft}
            title="No functions defined"
            message="Add functions to control feature access for your application."
          />
        }
      >
        {filteredFunctions.map((fn) => (
          <tr key={fn.id || fn.name} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
            <td className="px-4 py-3.5">
              <button
                onClick={() => handleToggle(fn)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  fn.enabled ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    fn.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </td>
            <td className="px-4 py-3.5">
              <span className="font-mono text-sm font-bold text-surface-900 dark:text-white">{fn.name}</span>
            </td>
            <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
              {fn.description}
            </td>
            <td className="px-4 py-3.5">
              <span className="inline-flex rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                {fn.requiredTier}
              </span>
            </td>
            <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
              {fn.enabledForUsers.length}
            </td>
            <td className="px-4 py-3.5 text-right">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => handleEditFn(fn)} className="p-1.5 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => fn.id && setFnToDelete(fn.id)} className="p-1.5 text-surface-400 transition-colors hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-500">
                  <ToggleLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">
                    {editingFn ? 'Edit Function' : 'Add Function'}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Define a feature flag for your app</p>
                </div>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingFn(null); }} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFn} className="space-y-4">
              <div>
                <FieldLabel required>Function Name</FieldLabel>
                <input
                  type="text"
                  required
                  value={fnForm.name}
                  onChange={(e) => setFnForm({ ...fnForm, name: e.target.value })}
                  placeholder="e.g. PremiumFeature"
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <input
                  type="text"
                  value={fnForm.description}
                  onChange={(e) => setFnForm({ ...fnForm, description: e.target.value })}
                  placeholder="e.g. Access to premium features"
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Required Tier</FieldLabel>
                  <select
                    value={fnForm.requiredTier}
                    onChange={(e) => setFnForm({ ...fnForm, requiredTier: e.target.value })}
                    className="select"
                  >
                    <option value="Free">Free</option>
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Enabled by Default</FieldLabel>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFnForm({ ...fnForm, enabled: !fnForm.enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fnForm.enabled ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          fnForm.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-surface-600 dark:text-surface-400">
                      {fnForm.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingFn(null); }} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Saving...' : editingFn ? 'Update Function' : 'Add Function'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!fnToDelete}
        title="Delete Function"
        message="Are you sure you want to delete this function? This will remove the feature flag entirely."
        confirmLabel="Delete Function"
        isLoading={false}
        onConfirm={confirmDeleteFn}
        onClose={() => setFnToDelete(null)}
      />
    </div>
  );
};
