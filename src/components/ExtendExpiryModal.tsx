import React, { useState, useEffect } from 'react';
import { Clock, X, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { formatCustomExpiryDate, parseExpiryToDate } from '../lib/dateUtils';
import { FieldLabel } from './ui';

interface ExtendExpiryModalProps {
  isOpen: boolean;
  title: string;
  currentExpiry?: string;
  isLoading?: boolean;
  onSave: (newExpiryStr: string) => void;
  onClose: () => void;
}

export const ExtendExpiryModal: React.FC<ExtendExpiryModalProps> = ({
  isOpen,
  title,
  currentExpiry = '',
  isLoading = false,
  onSave,
  onClose,
}) => {
  const [expiryInput, setExpiryInput] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExpiryInput(currentExpiry || formatCustomExpiryDate(new Date(Date.now() + 30 * 86400000)));
      setActivePreset(null);
    }
  }, [isOpen, currentExpiry]);

  if (!isOpen) return null;

  const applyPresetDays = (days: number, label: string) => {
    const baseDate = parseExpiryToDate(currentExpiry) || new Date();
    // If baseDate is in the past, start extending from now
    const startFrom = baseDate.getTime() < Date.now() ? new Date() : baseDate;
    const newDate = new Date(startFrom.getTime() + days * 86400000);
    setExpiryInput(formatCustomExpiryDate(newDate));
    setActivePreset(label);
  };

  const applyLifetime = () => {
    setExpiryInput('Lifetime / Never Expires');
    setActivePreset('Lifetime');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiryInput.trim()) return;
    onSave(expiryInput.trim());
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="card w-full max-w-md p-6 animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-surface-900 dark:text-white">{title}</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">Update license expiration timestamp</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Quick Extension Presets</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPresetDays(1, '+1 Day')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                  activePreset === '+1 Day'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-surface-100 dark:bg-white/[0.04] border-surface-200 dark:border-white/10 text-surface-700 dark:text-surface-200 hover:bg-brand-500/10 dark:hover:bg-white/[0.08]'
                }`}
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(7, '+7 Days')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                  activePreset === '+7 Days'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-surface-100 dark:bg-white/[0.04] border-surface-200 dark:border-white/10 text-surface-700 dark:text-surface-200 hover:bg-brand-500/10 dark:hover:bg-white/[0.08]'
                }`}
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(30, '+30 Days')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                  activePreset === '+30 Days'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-surface-100 dark:bg-white/[0.04] border-surface-200 dark:border-white/10 text-surface-700 dark:text-surface-200 hover:bg-brand-500/10 dark:hover:bg-white/[0.08]'
                }`}
              >
                +30 Days
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(365, '+1 Year')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                  activePreset === '+1 Year'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-surface-100 dark:bg-white/[0.04] border-surface-200 dark:border-white/10 text-surface-700 dark:text-surface-200 hover:bg-brand-500/10 dark:hover:bg-white/[0.08]'
                }`}
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={applyLifetime}
                className={`col-span-2 py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all inline-flex items-center justify-center gap-1.5 ${
                  activePreset === 'Lifetime'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lifetime / Never Expire</span>
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>Custom Expiry Format (DD/MM/YYYY hh:mm am/pm)</FieldLabel>
            <div className="relative">
              <input
                type="text"
                required
                value={expiryInput}
                onChange={(e) => {
                  setExpiryInput(e.target.value);
                  setActivePreset(null);
                }}
                placeholder="e.g. 30/07/2026 11:33 pm"
                className="input font-mono pr-10"
              />
              <Calendar className="w-4 h-4 text-surface-400 dark:text-surface-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
              Formatted as <code className="text-brand-500 dark:text-brand-400 font-mono">DD/MM/YYYY hh:mm am/pm</code>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !expiryInput.trim()}
              className="btn-primary disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Saving...' : 'Update Expiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};