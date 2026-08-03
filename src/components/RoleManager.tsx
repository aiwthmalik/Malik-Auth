import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Mail,
  Crown,
  Eye,
  Edit2,
  Search
} from 'lucide-react';
import { MalikApp } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, PageHeader, EmptyState, TableShell, FieldLabel, StatusBadge } from './ui';

interface RoleManagerProps {
  app: MalikApp;
  onUpdate: () => void;
}

interface RoleAssignment {
  userId: string;
  email: string;
  username: string;
  role: 'Owner' | 'Admin' | 'Viewer';
  assignedAt: string;
}

export const RoleManager: React.FC<RoleManagerProps> = ({ app, onUpdate }) => {
  const [roles, setRoles] = useState<RoleAssignment[]>((app as any).roles || []);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Viewer'>('Admin');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const roleConfig = {
    Owner: { icon: Crown, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25' },
    Admin: { icon: Shield, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25' },
    Viewer: { icon: Eye, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-500/25' },
  };

  const filteredRoles = roles.filter(r =>
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    const existing = roles.find(r => r.email.toLowerCase() === inviteEmail.toLowerCase());
    if (existing) {
      alert('This user already has a role assigned');
      return;
    }

    const newRole: RoleAssignment = {
      userId: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      email: inviteEmail.trim(),
      username: inviteEmail.split('@')[0],
      role: inviteRole,
      assignedAt: new Date().toISOString(),
    };

    setRoles(prev => [...prev, newRole]);
    setInviteEmail('');
  };

  const removeRole = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the app?')) return;
    setRoles(prev => prev.filter(r => r.userId !== userId));
  };

  const changeRole = async (userId: string, newRole: 'Admin' | 'Viewer') => {
    setRoles(prev => prev.map(r =>
      r.userId === userId ? { ...r, role: newRole } : r
    ));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      await updateApp(app.id, { roles } as any);
      await logActivity(app.appId, 'REMOTE_SYNC', 'Admin', 'SYS', `Role assignments updated [${roles.length} members]`);
      setSaveMessage('Role assignments saved successfully');
      onUpdate();
    } catch (err) {
      console.error('Error saving roles:', err);
      setSaveMessage('Failed to save role assignments');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Role-Based Dashboard Access"
        subtitle="Manage team roles and permissions for this application."
        accent="violet"
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-5 p-6">
          <div className="border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <Mail className="h-4 w-4 text-violet-500" />
              Invite Team Member
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <FieldLabel required>Email Address</FieldLabel>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="input text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <FieldLabel required>Role</FieldLabel>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="select text-sm"
              >
                <option value="Admin">Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex items-end">
              <button
                type="button"
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                className="btn-primary w-full text-xs"
              >
                <Plus className="h-4 w-4" />
                Invite
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="text-xs text-surface-600 dark:text-surface-400">
              <strong>Roles:</strong> Owner (full access) • Admin (manage keys, users, settings) • Viewer (read-only access)
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
            <h4 className="text-sm font-bold text-surface-900 dark:text-white">
              Team Members ({roles.length})
            </h4>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input py-1.5 pl-9 text-xs"
              />
            </div>
          </div>

          <TableShell
            headers={['Member', 'Role', 'Assigned', 'Actions']}
            empty={
              <EmptyState
                icon={Users}
                title="No team members"
                message="Invite team members above to collaborate on this app."
              />
            }
          >
            {filteredRoles.map((roleAssignment) => {
              const roleInfo = roleConfig[roleAssignment.role];
              const RoleIcon = roleInfo.icon;

              return (
                <tr key={roleAssignment.userId} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3.5">
                    <div>
                      <div className="font-semibold text-surface-900 dark:text-white">{roleAssignment.username}</div>
                      <div className="text-xs text-surface-500 dark:text-surface-400">{roleAssignment.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <RoleIcon className={`h-4 w-4 ${roleInfo.color}`} />
                      <select
                        value={roleAssignment.role}
                        onChange={(e) => changeRole(roleAssignment.userId, e.target.value as any)}
                        disabled={roleAssignment.role === 'Owner'}
                        className="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs font-semibold dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-surface-500 dark:text-surface-400">
                    {new Date(roleAssignment.assignedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {roleAssignment.role !== 'Owner' && (
                      <button
                        type="button"
                        onClick={() => removeRole(roleAssignment.userId)}
                        className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Remove Member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </TableShell>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saveMessage && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {saveMessage}
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Role Assignments'}
          </button>
        </div>
      </form>
    </div>
  );
};
