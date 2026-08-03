import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  AlertTriangle,
  Bug,
  Cpu,
  FileCheck,
  Eye,
  X,
  Loader2,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Card, PageHeader, FieldLabel, EmptyState, TableShell, StatusBadge } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface AntiTamperProps {
  appId: string;
  rules: AntiTamperRule[];
  violations: AntiTamperViolation[];
  onRefresh: () => void;
}

interface AntiTamperRule {
  id: string;
  name: string;
  type: 'debugger' | 'hook' | 'memory' | 'integrity';
  action: 'terminate' | 'log' | 'notify';
  enabled: boolean;
}

interface AntiTamperViolation {
  id: string;
  timestamp: string;
  user: string;
  hwid: string;
  ruleTriggered: string;
  actionTaken: string;
}

const RULE_TYPES = [
  { value: 'debugger', label: 'Debugger Detection', icon: Bug, color: 'rose' },
  { value: 'hook', label: 'Hook Detection', icon: Eye, color: 'amber' },
  { value: 'memory', label: 'Memory Scan', icon: Cpu, color: 'violet' },
  { value: 'integrity', label: 'File Integrity', icon: FileCheck, color: 'sky' },
] as const;

const ACTIONS = [
  { value: 'terminate', label: 'Terminate Process' },
  { value: 'log', label: 'Log Violation' },
  { value: 'notify', label: 'Notify Admin' },
] as const;

export const AntiTamper: React.FC<AntiTamperProps> = ({ appId, rules, violations, onRefresh }) => {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'debugger' | 'hook' | 'memory' | 'integrity'>('debugger');
  const [newRuleAction, setNewRuleAction] = useState<'terminate' | 'log' | 'notify'>('terminate');
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const enabledRules = rules.filter((r) => r.enabled);
  const recentViolations = [...violations]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccessMsg(`Rule "${newRuleName}" added successfully!`);
      setNewRuleName('');
      setNewRuleType('debugger');
      setNewRuleAction('terminate');
      setIsAddingRule(false);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to add rule:', err);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRuleToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    // In production, this would call an API to toggle the rule
    onRefresh();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'terminate':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400';
      case 'log':
        return 'bg-sky-500/10 text-sky-600 border-sky-500/25 dark:text-sky-400';
      case 'notify':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400';
      default:
        return 'bg-surface-500/10 text-surface-600 border-surface-500/25 dark:text-surface-300';
    }
  };

  const getTypeConfig = (type: string) => {
    return RULE_TYPES.find((t) => t.value === type) || RULE_TYPES[0];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        accent="rose"
        title="Anti-Tamper System"
        subtitle="Integrity verification and tamper detection"
        actions={
          <button onClick={() => setIsAddingRule(true)} className="btn-primary text-xs">
            <Plus className="h-4 w-4" />
            <span>Add Rule</span>
          </button>
        }
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{rules.length}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">Total Rules</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{enabledRules.length}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">Active Rules</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{violations.length}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">Total Violations</p>
        </Card>
      </div>

      {/* Rules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-bold text-surface-900 dark:text-white">Detection Rules</h3>
        </div>

        {rules.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={Shield}
              title="No rules configured"
              message="Add detection rules to protect your application from tampering."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rules.map((rule) => {
              const typeConfig = getTypeConfig(rule.type);
              const TypeIcon = typeConfig.icon;
              return (
                <Card
                  key={rule.id}
                  className={`p-4 transition-all ${rule.enabled ? '' : 'opacity-60'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-${typeConfig.color}-500/20 bg-${typeConfig.color}-500/10 text-${typeConfig.color}-500`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white">{rule.name}</h4>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {typeConfig.label}
                        </p>
                        <span className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${getActionBadge(rule.action)}`}>
                          {rule.action === 'terminate' ? 'Terminate' : rule.action === 'log' ? 'Log' : 'Notify Admin'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="p-1"
                        title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.enabled ? (
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-surface-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setRuleToDelete(rule.id)}
                        className="p-1 text-surface-400 hover:text-rose-500"
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Violations Log */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-bold text-surface-900 dark:text-white">Violation Log</h3>
          <span className="text-xs text-surface-500 dark:text-surface-400">
            ({violations.length} total)
          </span>
        </div>

        <TableShell
          headers={['Timestamp', 'User', 'HWID', 'Rule Triggered', 'Action Taken']}
          empty={
            <EmptyState
              icon={AlertTriangle}
              title="No violations recorded"
              message="No anti-tamper violations have been detected yet."
            />
          }
        >
          {recentViolations.map((v) => (
            <tr key={v.id} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono text-xs text-surface-700 dark:text-surface-300">
                {formatDate(v.timestamp)}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-surface-900 dark:text-white">
                {v.user}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-surface-700 dark:text-surface-300">
                {v.hwid}
              </td>
              <td className="px-4 py-3 text-xs text-surface-700 dark:text-surface-300">
                {v.ruleTriggered}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${getActionBadge(v.actionTaken)}`}>
                  {v.actionTaken}
                </span>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>

      {/* Add Rule Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white">Add Detection Rule</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Configure a new tamper detection rule</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingRule(false)}
                className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <FieldLabel required>Rule Name</FieldLabel>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Debugger Check"
                  className="input text-xs"
                />
              </div>

              <div>
                <FieldLabel required>Detection Type</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {RULE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewRuleType(type.value)}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-all ${
                          newRuleType === type.value
                            ? `border-${type.color}-500 bg-${type.color}-500/10 text-${type.color}-600 dark:text-${type.color}-400`
                            : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel required>Action on Violation</FieldLabel>
                <select
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value as any)}
                  className="select text-xs"
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => setIsAddingRule(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!ruleToDelete}
        title="Delete Detection Rule"
        message="Are you sure you want to delete this detection rule? The application will no longer be protected by this rule."
        confirmLabel="Delete Rule"
        variant="danger"
        onConfirm={handleDeleteRule}
        onClose={() => setRuleToDelete(null)}
      />
    </div>
  );
};
