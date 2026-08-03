import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Search,
  Key,
  Filter,
  Download
} from 'lucide-react';
import { MalikLicense } from '../types';
import { logActivity } from '../lib/malikAuthService';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Card, PageHeader, EmptyState, TableShell, StatusBadge, FieldLabel } from './ui';

interface LicenseGroupsProps {
  appId: string;
  licenses: MalikLicense[];
  onRefresh: () => void;
}

interface LicenseGroup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const LicenseGroups: React.FC<LicenseGroupsProps> = ({
  appId,
  licenses,
  onRefresh
}) => {
  const [groups, setGroups] = useState<LicenseGroup[]>(() => {
    const saved = localStorage.getItem(`malik_license_groups_${appId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [editingGroup, setEditingGroup] = useState<LicenseGroup | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const saveGroups = (newGroups: LicenseGroup[]) => {
    setGroups(newGroups);
    localStorage.setItem(`malik_license_groups_${appId}`, JSON.stringify(newGroups));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setSaving(true);
    try {
      const newGroup: LicenseGroup = {
        id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name: groupName.trim(),
        description: groupDescription.trim(),
        createdAt: new Date().toISOString(),
      };

      saveGroups([...groups, newGroup]);
      await logActivity(appId, 'KEY_GENERATED', 'Admin', 'SYS', `Created license group: ${newGroup.name}`);

      setGroupName('');
      setGroupDescription('');
      setIsCreateModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Error creating group:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !groupName.trim()) return;

    setSaving(true);
    try {
      const updatedGroups = groups.map(g =>
        g.id === editingGroup.id
          ? { ...g, name: groupName.trim(), description: groupDescription.trim() }
          : g
      );

      saveGroups(updatedGroups);
      await logActivity(appId, 'KEY_GENERATED', 'Admin', 'SYS', `Updated license group: ${groupName}`);

      setGroupName('');
      setGroupDescription('');
      setEditingGroup(null);
      setIsCreateModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Error updating group:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Keys will not be deleted.')) return;

    const group = groups.find(g => g.id === groupId);
    saveGroups(groups.filter(g => g.id !== groupId));

    if (group) {
      await logActivity(appId, 'KEY_GENERATED', 'Admin', 'SYS', `Deleted license group: ${group.name}`);
    }
    onRefresh();
  };

  const getKeysInGroup = (groupId: string): MalikLicense[] => {
    return licenses.filter(l => (l as any).groupId === groupId);
  };

  const filteredLicenses = licenses.filter(l => {
    const matchesSearch = l.key.toLowerCase().includes(search.toLowerCase()) ||
      l.note?.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !selectedGroup || (l as any).groupId === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const exportGroupKeys = (groupId: string) => {
    const keys = getKeysInGroup(groupId).map(l => l.key).join('\n');
    const blob = new Blob([keys], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-keys-${groupId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderOpen}
        title="License Key Groups"
        subtitle="Organize license keys into named groups or batches."
        accent="sky"
        actions={
          <button
            onClick={() => {
              setEditingGroup(null);
              setGroupName('');
              setGroupDescription('');
              setIsCreateModalOpen(true);
            }}
            className="btn-primary text-xs"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="p-5 lg:col-span-1">
          <h4 className="mb-3 text-sm font-bold text-surface-900 dark:text-white">Groups</h4>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                !selectedGroup
                  ? 'border-brand-500/40 bg-brand-500/10 font-semibold'
                  : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02]'
              }`}
            >
              <FolderOpen className="h-4 w-4 text-surface-500" />
              <span className="flex-1">All Keys</span>
              <span className="text-xs text-surface-500">{licenses.length}</span>
            </button>
            {groups.map(group => {
              const keyCount = getKeysInGroup(group.id).length;
              return (
                <div key={group.id} className="group relative">
                  <button
                    onClick={() => setSelectedGroup(group.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                      selectedGroup === group.id
                        ? 'border-brand-500/40 bg-brand-500/10 font-semibold'
                        : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02]'
                    }`}
                  >
                    <FolderOpen className="h-4 w-4 text-brand-500" />
                    <span className="flex-1 truncate">{group.name}</span>
                    <span className="text-xs text-surface-500">{keyCount}</span>
                  </button>
                  <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGroup(group);
                        setGroupName(group.name);
                        setGroupDescription(group.description);
                        setIsCreateModalOpen(true);
                      }}
                      className="rounded p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(group.id);
                      }}
                      className="rounded p-1 text-surface-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search keys..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input py-2 pl-9 text-xs"
              />
            </div>
            {selectedGroup && (
              <button
                onClick={() => exportGroupKeys(selectedGroup)}
                className="btn-ghost text-xs"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}
          </div>

          <TableShell
            headers={['License Key', 'Key Name', 'Status', 'Group', 'Expiry']}
            empty={
              <EmptyState
                icon={Key}
                title="No keys found"
                message={selectedGroup ? "No keys in this group." : "No license keys available."}
              />
            }
          >
            {filteredLicenses.map((license) => {
              const group = groups.find(g => g.id === (license as any).groupId);
              return (
                <tr key={license.id || license.key} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3.5 font-mono text-sm font-bold text-brand-700 dark:text-brand-300">
                    {license.key}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-surface-700 dark:text-surface-300">
                    {license.keyName || '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={license.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    {group ? (
                      <span className="badge border border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        {group.name}
                      </span>
                    ) : (
                      <span className="text-xs text-surface-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-surface-500 dark:text-surface-400">
                    {license.expiry || '—'}
                  </td>
                </tr>
              );
            })}
          </TableShell>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">
                {editingGroup ? 'Edit Group' : 'Create Group'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
              <div>
                <FieldLabel required>Group Name</FieldLabel>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., VIP Keys, Beta Testing"
                  className="input text-sm"
                />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  rows={3}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Optional description for this group"
                  className="input resize-none text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !groupName.trim()} className="btn-primary text-xs">
                  {saving ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
