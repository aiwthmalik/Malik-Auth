import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Users,
  Calendar,
  X,
  Edit3,
} from 'lucide-react';
import { MalikUser } from '../types';
import { PageHeader, StatusBadge, EmptyState, TableShell, FieldLabel } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface SubscriptionTier {
  id?: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
  maxUsers: number;
  status: 'Active' | 'Inactive';
}

interface UserSubscription {
  id?: string;
  userId: string;
  subscriptionId: string;
  status: 'active' | 'cancelled' | 'past_due';
  startDate: string;
  renewalDate: string;
}

interface SubscriptionManagerProps {
  appId: string;
  users: MalikUser[];
  onRefresh: () => void;
}

const DEFAULT_TIERS: SubscriptionTier[] = [
  { name: 'Free', price: 0, durationDays: 365, features: ['Basic Access'], maxUsers: 100, status: 'Active' },
  { name: 'Basic', price: 9.99, durationDays: 30, features: ['Basic Access', 'Standard Support'], maxUsers: 50, status: 'Active' },
  { name: 'Pro', price: 29.99, durationDays: 30, features: ['Basic Access', 'Standard Support', 'Priority Support', 'Advanced Features'], maxUsers: 25, status: 'Active' },
  { name: 'Enterprise', price: 99.99, durationDays: 365, features: ['Basic Access', 'Standard Support', 'Priority Support', 'Advanced Features', 'Custom Integration', 'Dedicated Manager'], maxUsers: 10, status: 'Active' },
];

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  appId,
  users,
  onRefresh,
}) => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(DEFAULT_TIERS);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [tierForm, setTierForm] = useState({
    name: '',
    price: 0,
    durationDays: 30,
    features: '',
    maxUsers: 50,
  });

  const [assignForm, setAssignForm] = useState({
    userId: '',
    subscriptionId: '',
    durationDays: 30,
  });

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const featuresList = tierForm.features.split(',').map((f) => f.trim()).filter(Boolean);
      if (editingTier && editingTier.id) {
        setTiers((prev) =>
          prev.map((t) =>
            t.id === editingTier.id
              ? { ...t, name: tierForm.name, price: tierForm.price, durationDays: tierForm.durationDays, features: featuresList, maxUsers: tierForm.maxUsers }
              : t
          )
        );
      } else {
        const newTier: SubscriptionTier = {
          name: tierForm.name,
          price: tierForm.price,
          durationDays: tierForm.durationDays,
          features: featuresList,
          maxUsers: tierForm.maxUsers,
          status: 'Active',
        };
        setTiers((prev) => [...prev, newTier]);
      }
      setTierForm({ name: '', price: 0, durationDays: 30, features: '', maxUsers: 50 });
      setEditingTier(null);
      setIsTierModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save tier:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTier = (tier: SubscriptionTier) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      price: tier.price,
      durationDays: tier.durationDays,
      features: tier.features.join(', '),
      maxUsers: tier.maxUsers,
    });
    setIsTierModalOpen(true);
  };

  const confirmDeleteTier = () => {
    if (!tierToDelete) return;
    setTiers((prev) => prev.filter((t) => t.id !== tierToDelete));
    setTierToDelete(null);
    onRefresh();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newSub: UserSubscription = {
        userId: assignForm.userId,
        subscriptionId: assignForm.subscriptionId,
        status: 'active',
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + assignForm.durationDays * 86400000).toISOString(),
      };
      setUserSubscriptions((prev) => [...prev, newSub]);
      setAssignForm({ userId: '', subscriptionId: '', durationDays: 30 });
      setIsAssignModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to assign subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTiers = tiers.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase())
  );

  const getSubCountForTier = (tierName: string) =>
    userSubscriptions.filter((s) => {
      const tier = tiers.find((t) => t.id === s.subscriptionId);
      return tier?.name === tierName && s.status === 'active';
    }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        accent="emerald"
        title="Subscription Manager"
        subtitle="Define subscription tiers and assign them to users."
        actions={
          <div className="flex gap-2">
            <button onClick={() => { setEditingTier(null); setTierForm({ name: '', price: 0, durationDays: 30, features: '', maxUsers: 50 }); setIsTierModalOpen(true); }} className="btn-primary text-xs">
              <Plus className="h-4 w-4" />
              <span>Add Tier</span>
            </button>
            <button onClick={() => setIsAssignModalOpen(true)} className="btn-ghost text-xs">
              <Users className="h-4 w-4" />
              <span>Assign to User</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div key={tier.id || tier.name} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-surface-900 dark:text-white">{tier.name}</h3>
              <StatusBadge status={tier.status} />
            </div>
            <div className="mb-3">
              <span className="text-2xl font-bold text-surface-900 dark:text-white">${tier.price}</span>
              <span className="text-xs text-surface-500 dark:text-surface-400">/{tier.durationDays}d</span>
            </div>
            <div className="mb-3 text-xs text-surface-600 dark:text-surface-400">
              {getSubCountForTier(tier.name)} / {tier.maxUsers} users
            </div>
            <ul className="mb-4 space-y-1">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400">
                  <div className="h-1 w-1 rounded-full bg-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => handleEditTier(tier)} className="btn-ghost flex-1 text-xs py-1.5">
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => tier.id && setTierToDelete(tier.id)} className="btn-ghost flex-1 text-xs py-1.5 text-rose-500 hover:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <TableShell
        headers={['User', 'Subscription', 'Status', 'Start Date', 'Renewal Date', 'Actions']}
        empty={
          <EmptyState
            icon={CreditCard}
            title="No subscriptions assigned"
            message="Assign subscriptions to users to get started."
          />
        }
      >
        {userSubscriptions.map((sub, idx) => {
          const user = users.find((u) => u.id === sub.userId);
          const tier = tiers.find((t) => t.id === sub.subscriptionId);
          return (
            <tr key={sub.id || idx} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3.5 text-sm font-medium text-surface-900 dark:text-white">
                {user?.username || sub.userId}
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {tier?.name || 'Unknown'}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={sub.status} />
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
                {new Date(sub.startDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3.5 text-xs text-surface-600 dark:text-surface-400">
                {new Date(sub.renewalDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3.5 text-right">
                <button
                  onClick={() => setUserSubscriptions((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1.5 text-surface-400 transition-colors hover:text-rose-500"
                  title="Cancel Subscription"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          );
        })}
      </TableShell>

      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">
                    {editingTier ? 'Edit Tier' : 'Create Tier'}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Define a new subscription tier</p>
                </div>
              </div>
              <button onClick={() => { setIsTierModalOpen(false); setEditingTier(null); }} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Tier Name</FieldLabel>
                  <input
                    type="text"
                    required
                    value={tierForm.name}
                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                    placeholder="e.g. Pro"
                    className="input"
                  />
                </div>
                <div>
                  <FieldLabel required>Price ($)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={tierForm.price}
                    onChange={(e) => setTierForm({ ...tierForm, price: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Duration (Days)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    required
                    value={tierForm.durationDays}
                    onChange={(e) => setTierForm({ ...tierForm, durationDays: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <FieldLabel>Max Users</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    value={tierForm.maxUsers}
                    onChange={(e) => setTierForm({ ...tierForm, maxUsers: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Features (comma-separated)</FieldLabel>
                <input
                  type="text"
                  value={tierForm.features}
                  onChange={(e) => setTierForm({ ...tierForm, features: e.target.value })}
                  placeholder="e.g. Basic Access, Priority Support, Advanced Features"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => { setIsTierModalOpen(false); setEditingTier(null); }} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Saving...' : editingTier ? 'Update Tier' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Assign Subscription</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Assign a tier to a user</p>
                </div>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <FieldLabel required>User</FieldLabel>
                <select
                  required
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="select"
                >
                  <option value="">Select a user...</option>
                  {users.map((u) => (
                    <option key={u.id || u.username} value={u.id || ''}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel required>Subscription Tier</FieldLabel>
                <select
                  required
                  value={assignForm.subscriptionId}
                  onChange={(e) => setAssignForm({ ...assignForm, subscriptionId: e.target.value })}
                  className="select"
                >
                  <option value="">Select a tier...</option>
                  {tiers.filter((t) => t.status === 'Active').map((t) => (
                    <option key={t.id || t.name} value={t.id || ''}>
                      {t.name} — ${t.price}/{t.durationDays}d
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Assigning...' : 'Assign Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!tierToDelete}
        title="Delete Tier"
        message="Are you sure you want to delete this subscription tier? Users assigned to it may be affected."
        confirmLabel="Delete Tier"
        isLoading={false}
        onConfirm={confirmDeleteTier}
        onClose={() => setTierToDelete(null)}
      />
    </div>
  );
};
