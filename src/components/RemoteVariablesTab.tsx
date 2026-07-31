import React, { useState } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Eye,
  EyeOff,
  Database,
  Check,
  Copy
} from 'lucide-react';
import { MalikRemoteVariable } from '../types';
import { setRemoteVariable, deleteRemoteVariable } from '../lib/malikAuthService';

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

  const handleDelete = async (id: string, varKey: string) => {
    if (!window.confirm(`Delete remote variable ${varKey}?`)) return;
    await deleteRemoteVariable(id);
    onRefresh();
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
      {/* Banner & Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 border-b border-slate-200 pb-4 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Remote Server Synchronization Variables</h2>
            <p className="text-xs text-slate-500">
              Push dynamic offsets, encrypted strings, or download URLs to your client software without re-compiling your application.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Variable Key
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OFFSET_LOCAL_PLAYER"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Value / Payload
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 0x0182E4B0 or https://..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Min Role Required
            </label>
            <select
              value={minRole}
              onChange={(e) => setMinRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="Basic">Basic User</option>
              <option value="VIP">VIP Subscriber</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Admin">Admin Only</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-center h-10">
            <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-0"
              />
              <span className="font-semibold">Encrypt</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save & Push'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Variables Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {variables.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No remote variables configured. Add your variables above to push live settings to your client applications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold">Variable Key</th>
                  <th className="py-3.5 px-4 font-semibold">Value / Payload</th>
                  <th className="py-3.5 px-4 font-semibold">Encryption</th>
                  <th className="py-3.5 px-4 font-semibold">Min Role</th>
                  <th className="py-3.5 px-4 font-semibold">Last Updated</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variables.map((v) => {
                  const isVisible = visibleValues[v.id || v.key];
                  return (
                    <tr key={v.id || v.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {v.key}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={isVisible ? 'text-slate-900' : 'text-slate-400'}>
                            {isVisible ? v.value : '••••••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleVisible(v.id || v.key)}
                            className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
                            title="Toggle Visibility"
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyVal(v.value, v.key)}
                            className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
                            title="Copy Value"
                          >
                            {copiedKey === v.key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          v.isEncrypted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {v.isEncrypted ? 'AES Encrypted' : 'Plaintext'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {v.minRole}+
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(v.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setKey(v.key);
                              setValue(v.value);
                              setMinRole(v.minRole);
                            }}
                            className="text-slate-400 hover:text-indigo-600 p-1"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => v.id && handleDelete(v.id, v.key)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
