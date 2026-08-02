import React, { useState } from 'react';
import { ShieldCheck, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { createApp } from '../lib/malikAuthService';
import { FieldLabel } from './ui';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="card w-full max-w-md overflow-hidden animate-scale-in">
        <div className="px-6 py-5 border-b border-surface-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight text-surface-900 dark:text-white">Create MalikAuth App</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">Enterprise Licensing & Remote Memory Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs px-3.5 py-2.5 rounded-lg font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <FieldLabel required>Application Title</FieldLabel>
            <input
              type="text"
              required
              placeholder="e.g. Apex Platform v2 or Enterprise Loader"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Initial Version</FieldLabel>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="input font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-surface-700 dark:text-surface-200 cursor-pointer input py-2.5">
                <input
                  type="checkbox"
                  checked={allowHwidReset}
                  onChange={(e) => setAllowHwidReset(e.target.checked)}
                  className="rounded bg-white border-surface-300 text-brand-600 focus:ring-brand-500/20 dark:bg-white/[0.04] dark:border-white/20"
                />
                <span>Allow HWID Resets</span>
              </label>
            </div>
          </div>

          <div>
            <FieldLabel>Message of the Day (MOTD)</FieldLabel>
            <textarea
              rows={2}
              value={motd}
              onChange={(e) => setMotd(e.target.value)}
              placeholder="News or status shown to software clients upon connection"
              className="input resize-none"
            />
          </div>

          <div>
            <FieldLabel required>Discord Webhook URL</FieldLabel>
            <input
              type="url"
              required
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="input"
            />
            <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
              Required for receiving real-time audit logs and activity notifications when the dashboard is closed.
            </p>
          </div>

          <div className="bg-brand-500/[0.06] rounded-xl p-3 border border-brand-500/15">
            <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Automatic Cryptographic Generation</span>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
              MalikAuth will automatically generate your cryptographic App ID, App Secret, and AES Encryption Key for secure remote synchronization.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create MalikAuth App'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};