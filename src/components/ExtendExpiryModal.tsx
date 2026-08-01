import React, { useState, useEffect } from 'react';
import { Clock, X, Calendar, Sparkles } from 'lucide-react';
import { formatCustomExpiryDate, parseExpiryToDate } from '../lib/dateUtils';

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Update license expiration timestamp</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Quick Extension Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPresetDays(1, '+1 Day')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                  activePreset === '+1 Day'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(7, '+7 Days')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                  activePreset === '+7 Days'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(30, '+30 Days')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                  activePreset === '+30 Days'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                +30 Days
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(365, '+1 Year')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                  activePreset === '+1 Year'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={applyLifetime}
                className={`col-span-2 py-2 px-2.5 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center space-x-1 ${
                  activePreset === 'Lifetime'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lifetime / Never Expire</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
              Custom Expiry Format (DD/MM/YYYY hh:mm am/pm)
            </label>
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-600 transition-colors"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Formatted as <code className="text-indigo-600 font-mono">DD/MM/YYYY hh:mm am/pm</code>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !expiryInput.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-indigo-600/20 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading ? <span>Saving...</span> : <span>Update Expiry</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
