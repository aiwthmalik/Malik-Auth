import React, { useState } from 'react';
import {
  Store,
  Key,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Activity,
  Code,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { Card, PageHeader, StatusBadge, EmptyState, TableShell, FieldLabel } from './ui';

interface SellerAPIKey {
  id: string;
  key: string;
  sellerName: string;
  permissions: ('read' | 'write' | 'generate' | 'delete')[];
  rateLimit: number;
  status: 'Active' | 'Revoked';
  createdAt: string;
  lastUsed?: string;
}

interface APIUsageLog {
  id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  responseTime: number;
}

interface SellerAPIProps {
  appId: string;
  sellers: SellerAPIKey[];
  usageLog?: APIUsageLog[];
  onRefresh: () => void;
}

export const SellerAPI: React.FC<SellerAPIProps> = ({ appId, sellers, usageLog = [], onRefresh }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [newPermissions, setNewPermissions] = useState<('read' | 'write' | 'generate' | 'delete')[]>(['read']);
  const [newRateLimit, setNewRateLimit] = useState(100);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'logs' | 'docs'>('keys');

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return key;
    return key.slice(0, 8) + '••••••••' + key.slice(-4);
  };

  const permColor = (p: string) => {
    const map: Record<string, string> = {
      read: 'bg-sky-500/10 text-sky-600 border-sky-500/25 dark:text-sky-400',
      write: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
      generate: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
      delete: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
    };
    return map[p] || map.read;
  };

  const codeExample = `curl -X POST https://api.malikauth.com/api/v1 \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "action": "license_init",
    "appId": "${appId}",
    "key": "YOUR_LICENSE_KEY",
    "name": "Username",
    "hwid": "HWID_HERE"
  }'`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Store}
        title="Seller API"
        subtitle="Manage API keys for resellers to handle licenses programmatically."
        accent="amber"
        actions={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Generate API Key
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-white/10 dark:bg-white/[0.02]">
        {(['keys', 'logs', 'docs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-surface-900 shadow-sm dark:bg-white/10 dark:text-white'
                : 'text-surface-500 hover:text-surface-700 dark:text-surface-400'
            }`}
          >
            {tab === 'keys' ? 'API Keys' : tab === 'logs' ? 'Usage Logs' : 'Documentation'}
          </button>
        ))}
      </div>

      {activeTab === 'keys' && (
        <>
          {/* Create Form */}
          {showCreate && (
            <Card className="space-y-4 p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Key className="h-4 w-4 text-amber-500" />
                New API Key
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Seller Name</FieldLabel>
                  <input
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                    className="input"
                    placeholder="e.g. ResellerAlpha"
                  />
                </div>
                <div>
                  <FieldLabel required>Rate Limit (req/min)</FieldLabel>
                  <input
                    type="number"
                    value={newRateLimit}
                    onChange={(e) => setNewRateLimit(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Permissions</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {(['read', 'write', 'generate', 'delete'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setNewPermissions((prev) =>
                          prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                        )
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        newPermissions.includes(p)
                          ? permColor(p)
                          : 'border-surface-200 bg-surface-50 text-surface-500 dark:border-white/10 dark:bg-white/[0.02]'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="btn-ghost">
                  Cancel
                </button>
                <button className="btn-primary" onClick={onRefresh}>
                  <Plus className="h-4 w-4" />
                  Create Key
                </button>
              </div>
            </Card>
          )}

          {/* Keys Table */}
          {sellers.length === 0 ? (
            <EmptyState
              icon={Key}
              title="No API Keys"
              message="Generate API keys for your resellers to manage licenses."
            />
          ) : (
            <TableShell headers={['Seller', 'Key', 'Permissions', 'Rate Limit', 'Status', 'Actions']}>
              {sellers.map((s) => (
                <tr key={s.id} className="hover:bg-surface-50/50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">{s.sellerName}</span>
                    {s.lastUsed && (
                      <span className="ml-2 text-[11px] text-surface-400">
                        Last used {new Date(s.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className={revealedKeys.has(s.id) ? '' : 'blur-[5px] hover:blur-none'}>
                        {revealedKeys.has(s.id) ? s.key : maskKey(s.key)}
                      </span>
                      <button onClick={() => toggleReveal(s.id)} className="text-surface-400 hover:text-surface-600">
                        {revealedKeys.has(s.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => copyKey(s.key, s.id)} className="text-surface-400 hover:text-surface-600">
                        {copiedKey === s.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.permissions.map((p) => (
                        <span key={p} className={`badge border text-[10px] ${permColor(p)}`}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-300">
                    {s.rateLimit}/min
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-white/10 dark:hover:text-white">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </TableShell>
          )}
        </>
      )}

      {activeTab === 'logs' && (
        <>
          {usageLog.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No API Usage"
              message="API usage will appear here once keys are used."
            />
          ) : (
            <TableShell headers={['Timestamp', 'Endpoint', 'Status', 'Response Time']}>
              {usageLog.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-surface-50/50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs text-surface-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-surface-700 dark:text-surface-300">
                    {log.endpoint}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge border text-[10px] ${
                        log.status < 300
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-surface-500">{log.responseTime}ms</td>
                </tr>
              ))}
            </TableShell>
          )}
        </>
      )}

      {activeTab === 'docs' && (
        <Card className="space-y-4 p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Code className="h-4 w-4 text-amber-500" />
            API Documentation
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Use your API key with the <code className="font-mono text-amber-500">X-API-Key</code> header to interact with the MalikAuth API.
          </p>
          <div className="rounded-xl border border-surface-200 bg-surface-950 p-4 dark:border-white/10">
            <pre className="overflow-x-auto font-mono text-xs text-emerald-400">{codeExample}</pre>
          </div>
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500">Available Endpoints</h4>
            <div className="space-y-2">
              {[
                { method: 'POST', path: '/api/v1', desc: 'license_init — Initialize a license' },
                { method: 'POST', path: '/api/v1', desc: 'license_create — Create a new license' },
                { method: 'POST', path: '/api/v1', desc: 'license_delete — Delete a license' },
                { method: 'POST', path: '/api/v1', desc: 'user_ban — Ban a user' },
                { method: 'POST', path: '/api/v1', desc: 'stats — Get app statistics' },
              ].map((ep, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2 dark:border-white/10">
                  <span className="badge border bg-emerald-500/10 text-emerald-600 border-emerald-500/25 text-[10px] font-bold dark:text-emerald-400">
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-surface-600 dark:text-surface-300">{ep.path}</span>
                  <span className="text-xs text-surface-500">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
