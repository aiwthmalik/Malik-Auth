import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Crown,
  Code,
  Eye,
  Mail,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Card, PageHeader, StatusBadge, EmptyState, TableShell, FieldLabel } from './ui';

interface SubAccount {
  id: string;
  email: string;
  name: string;
  role: 'Owner' | 'Admin' | 'Developer' | 'Viewer';
  lastActive: string;
  status: 'Active' | 'Invited' | 'Disabled';
}

interface SubAccountsProps {
  appId: string;
  members: SubAccount[];
  onRefresh: () => void;
}

const ROLE_PERMISSIONS: Record<string, { icon: React.FC<any>; color: string; perms: string[] }> = {
  Owner: { icon: Crown, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', perms: ['Full access to all features', 'Manage team members', 'Billing & subscription', 'Delete application'] },
  Admin: { icon: Shield, color: 'text-brand-500 bg-brand-500/10 border-brand-500/20', perms: ['Manage users & licenses', 'Configure settings', 'View analytics', 'Manage webhooks'] },
  Developer: { icon: Code, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20', perms: ['Manage licenses', 'View activity logs', 'Access API keys', 'View sessions'] },
  Viewer: { icon: Eye, color: 'text-surface-500 bg-surface-500/10 border-surface-500/20', perms: ['Read-only access', 'View dashboard', 'View stats', 'View logs'] },
};

export const SubAccounts: React.FC<SubAccountsProps> = ({ appId, members, onRefresh }) => {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<SubAccount['role']>('Viewer');
  const [expandedPerms, setExpandedPerms] = useState<string | null>(null);

  const roleBadge = (role: string) => {
    const r = ROLE_PERMISSIONS[role];
    if (!r) return null;
    const Icon = r.icon;
    return (
      <span className={`badge border ${r.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Team Management"
        subtitle="Manage sub-accounts and control team member permissions."
        accent="violet"
        actions={
          <button onClick={() => setShowInvite(!showInvite)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Invite Member
          </button>
        }
      />

      {/* Invite Form */}
      {showInvite && (
        <Card className="space-y-4 p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Mail className="h-4 w-4 text-violet-500" />
            Invite Team Member
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>Email Address</FieldLabel>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="input"
              />
            </div>
            <div>
              <FieldLabel required>Role</FieldLabel>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as SubAccount['role'])} className="select">
                <option value="Viewer">Viewer — Read-only</option>
                <option value="Developer">Developer — Manage licenses, view logs</option>
                <option value="Admin">Admin — Manage users, licenses, settings</option>
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-surface-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-surface-500">
              {inviteRole} will have access to:
            </p>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[inviteRole]?.perms.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300">
                  <div className="h-1 w-1 rounded-full bg-violet-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowInvite(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" onClick={onRefresh}>
              <Mail className="h-4 w-4" />
              Send Invite
            </button>
          </div>
        </Card>
      )}

      {/* Permission Matrix */}
      <Card className="space-y-4 p-6">
        <h3 className="text-sm font-bold tracking-tight">Permission Matrix</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(ROLE_PERMISSIONS).map(([role, data]) => {
            const Icon = data.icon;
            return (
              <button
                key={role}
                onClick={() => setExpandedPerms(expandedPerms === role ? null : role)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  expandedPerms === role
                    ? 'border-brand-400/50 shadow-md shadow-brand-500/5'
                    : 'border-surface-200 hover:border-surface-300 dark:border-white/10 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${data.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ChevronDown className={`h-4 w-4 text-surface-400 transition-transform ${expandedPerms === role ? 'rotate-180' : ''}`} />
                </div>
                <div className="mt-3 text-sm font-bold text-surface-900 dark:text-white">{role}</div>
                {expandedPerms === role && (
                  <ul className="mt-2 space-y-1">
                    {data.perms.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-surface-500 dark:text-surface-400">
                        <div className="h-1 w-1 rounded-full bg-brand-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Members Table */}
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Team Members"
          message="Invite team members to collaborate on managing your application."
        />
      ) : (
        <TableShell headers={['Member', 'Role', 'Last Active', 'Status', 'Actions']}>
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-surface-50/50 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white">{m.name}</span>
                  <span className="ml-2 text-xs text-surface-400">{m.email}</span>
                </div>
              </td>
              <td className="px-4 py-3">{roleBadge(m.role)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-surface-500">
                  <Clock className="h-3 w-3" />
                  {new Date(m.lastActive).toLocaleDateString()}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={m.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1">
                  <select className="select !py-1 !px-2 !text-[11px]">
                    {Object.keys(ROLE_PERMISSIONS).map((r) => (
                      <option key={r} value={r} selected={r === m.role}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {m.role !== 'Owner' && (
                    <button className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
};
