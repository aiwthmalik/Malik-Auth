import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Globe,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Check
} from 'lucide-react';
import { MalikApp } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';
import { Card, PageHeader, FieldLabel, EmptyState, TableShell } from './ui';

interface IPWhitelistProps {
  app: MalikApp;
  onUpdate: () => void;
}

interface IPEntry {
  ip: string;
  cidr?: string;
  description?: string;
}

export const IPWhitelist: React.FC<IPWhitelistProps> = ({ app, onUpdate }) => {
  const [ipList, setIpList] = useState<IPEntry[]>((app as any).ipWhitelist || []);
  const [newIP, setNewIP] = useState('');
  const [newCIDR, setNewCIDR] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [enforced, setEnforced] = useState((app as any).ipWhitelistEnabled || false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testIP, setTestIP] = useState('');
  const [testResult, setTestResult] = useState<{ allowed: boolean; message: string } | null>(null);

  const validateIP = (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const validateCIDR = (cidr: string): boolean => {
    if (!cidr) return true;
    const cidrRegex = /^\/(\d{1,2})$/;
    if (!cidrRegex.test(cidr)) return false;
    const prefix = parseInt(cidr.substring(1));
    return prefix >= 0 && prefix <= 32;
  };

  const addIP = () => {
    if (!newIP.trim()) return;
    if (!validateIP(newIP.trim())) {
      alert('Invalid IP address format');
      return;
    }
    if (newCIDR && !validateCIDR(newCIDR)) {
      alert('Invalid CIDR notation. Use /0 to /32');
      return;
    }

    const entry: IPEntry = {
      ip: newIP.trim(),
      cidr: newCIDR.trim() || undefined,
      description: newDescription.trim() || undefined,
    };

    setIpList(prev => [...prev, entry]);
    setNewIP('');
    setNewCIDR('');
    setNewDescription('');
  };

  const removeIP = (index: number) => {
    setIpList(prev => prev.filter((_, i) => i !== index));
  };

  const testIPMatch = () => {
    if (!testIP.trim()) return;

    const ipToTest = testIP.trim();
    const allowed = ipList.some(entry => {
      if (entry.cidr) {
        return ipMatchesCIDR(ipToTest, entry.ip, entry.cidr);
      }
      return ipToTest === entry.ip;
    });

    setTestResult({
      allowed,
      message: allowed
        ? `IP ${ipToTest} is ALLOWED`
        : `IP ${ipToTest} is BLOCKED`
    });
    setTimeout(() => setTestResult(null), 5000);
  };

  const ipMatchesCIDR = (testIP: string, networkIP: string, cidr: string): boolean => {
    const prefix = parseInt(cidr.substring(1));
    const testParts = testIP.split('.').map(Number);
    const networkParts = networkIP.split('.').map(Number);

    if (testParts.length !== 4 || networkParts.length !== 4) return false;

    const testBin = testParts.reduce((acc, part) => (acc << 8) + part, 0);
    const networkBin = networkParts.reduce((acc, part) => (acc << 8) + part, 0);
    const mask = ~((1 << (32 - prefix)) - 1);

    return (testBin & mask) === (networkBin & mask);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      await updateApp(app.id, {
        ipWhitelist: ipList,
        ipWhitelistEnabled: enforced,
      } as any);
      await logActivity(app.appId, 'REMOTE_SYNC', 'Admin', 'SYS', `IP whitelist updated [${ipList.length} IPs, Enforced: ${enforced}]`);
      setSaveMessage('IP whitelist settings saved successfully');
      onUpdate();
    } catch (err) {
      console.error('Error saving IP whitelist:', err);
      setSaveMessage('Failed to save IP whitelist');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="IP Whitelist"
        subtitle="Configure allowed IP addresses for enhanced security."
        accent="emerald"
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Globe className="h-4 w-4 text-emerald-500" />
                Whitelist Configuration
              </h3>
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                Add IP addresses that are allowed to access your application
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnforced(!enforced)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                enforced
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-surface-200 bg-surface-100 text-surface-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-400'
              }`}
            >
              {enforced ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {enforced ? 'Enforced' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <FieldLabel required>IP Address</FieldLabel>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="192.168.1.1"
                  className="input font-mono text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>CIDR</FieldLabel>
                <input
                  type="text"
                  value={newCIDR}
                  onChange={(e) => setNewCIDR(e.target.value)}
                  placeholder="/32"
                  className="input font-mono text-sm"
                />
              </div>
              <div className="sm:col-span-4">
                <FieldLabel>Description</FieldLabel>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Office IP"
                  className="input text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={addIP}
                  disabled={!newIP.trim()}
                  className="btn-primary w-full text-xs"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                <AlertCircle className="h-4 w-4" />
                <span>Supported formats: IPv4 (192.168.1.1), CIDR notation (192.168.1.0/24)</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
            <h4 className="text-sm font-bold text-surface-900 dark:text-white">
              Whitelisted IPs ({ipList.length})
            </h4>
          </div>

          <TableShell
            headers={['IP Address', 'CIDR', 'Description', 'Actions']}
            empty={
              <EmptyState
                icon={Globe}
                title="No IPs configured"
                message="Add IP addresses above to restrict access."
              />
            }
          >
            {ipList.map((entry, index) => (
              <tr key={index} className="transition-colors hover:bg-surface-50/80 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3.5 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {entry.ip}
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-surface-600 dark:text-surface-400">
                  {entry.cidr || '—'}
                </td>
                <td className="px-4 py-3.5 text-xs text-surface-700 dark:text-surface-300">
                  {entry.description || '—'}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeIP(index)}
                    className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </TableShell>
        </Card>

        <Card className="p-6">
          <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
            <h4 className="text-sm font-bold text-surface-900 dark:text-white">
              Test IP Access
            </h4>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={testIP}
              onChange={(e) => setTestIP(e.target.value)}
              placeholder="Enter IP to test (e.g., 192.168.1.1)"
              className="input flex-1 font-mono text-sm"
            />
            <button
              type="button"
              onClick={testIPMatch}
              disabled={!testIP.trim()}
              className="btn-ghost text-xs"
            >
              <Check className="h-4 w-4" />
              Test
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-3 rounded-lg border px-4 py-3 text-sm font-medium ${
                testResult.allowed
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {testResult.message}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saveMessage && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {saveMessage}
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save IP Whitelist'}
          </button>
        </div>
      </form>
    </div>
  );
};
