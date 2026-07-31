import React, { useState } from 'react';
import { ShieldCheck, X, Sparkles } from 'lucide-react';
import { createApp } from '../lib/malikAuthService';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppCreated: (newAppId: string) => void;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({
  isOpen,
  onClose,
  onAppCreated,
}) => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [motd, setMotd] = useState('Welcome to MalikAuth Security Engine! All systems operational.');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [allowHwidReset, setAllowHwidReset] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide an application name');
      return;
    }

    if (!discordWebhook.trim() || !discordWebhook.startsWith('http')) {
      setError('Please provide a valid Discord Webhook URL (required for audit logs & notifications)');
      return;
    }

    setLoading(true);
    try {
      // Helper for exact character length alphanumeric strings
      const randChars = (len: number) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // Generate exact length credentials
      const ownerId = randChars(5);       // 5 characters only
      const appId = randChars(10);        // 10 characters only
      const appSecret = randChars(20);    // 20 characters only
      const encryptionKey = randChars(16);

      const newId = await createApp({
        name: name.trim(),
        appId,
        appSecret,
        version,
        status: 'Active',
        ownerId,
        encryptionKey,
        allowHwidReset,
        motd,
        discordWebhook: discordWebhook.trim(),
      });

      setName('');
      setVersion('1.0.0');
      setDiscordWebhook('');
      onAppCreated(newId);
      onClose();
    } catch (err: any) {
      console.error('Error creating MalikAuth app:', err);
      setError(err.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Create MalikAuth App</h3>
              <p className="text-xs text-slate-500">Enterprise Licensing & Remote Memory Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-lg font-medium shadow-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Application Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Platform v2 or Enterprise Loader"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                Initial Version
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 border border-slate-300 rounded-lg p-2.5">
                <input
                  type="checkbox"
                  checked={allowHwidReset}
                  onChange={(e) => setAllowHwidReset(e.target.checked)}
                  className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-0"
                />
                <span>Allow HWID Resets</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Message of the Day (MOTD)
            </label>
            <textarea
              rows={2}
              value={motd}
              onChange={(e) => setMotd(e.target.value)}
              placeholder="News or status shown to software clients upon connection"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Discord Webhook URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Required for receiving real-time audit logs and activity notifications when the dashboard is closed.
            </p>
          </div>

          <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100">
            <div className="flex items-center space-x-2 text-xs text-indigo-900 font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Automatic Cryptographic Generation</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              MalikAuth will automatically generate your cryptographic App ID, App Secret, and AES Encryption Key for secure remote synchronization.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-colors flex items-center space-x-1.5"
            >
              <span>{loading ? 'Creating...' : 'Create MalikAuth App'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
