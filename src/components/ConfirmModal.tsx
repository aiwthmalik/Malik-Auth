import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'indigo';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  let iconCls = 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:text-rose-400';
  let iconBtn = 'btn-danger';
  if (variant === 'warning') {
    iconCls = 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:text-amber-400';
    iconBtn = 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25 rounded-xl inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  } else if (variant === 'indigo') {
    iconCls = 'bg-brand-500/10 text-brand-500 border-brand-500/20 dark:text-brand-400';
    iconBtn = 'btn-primary';
  }

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

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border shrink-0 ${iconCls}`}>
            {variant === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">{title}</h3>
            <p className="mt-1.5 text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`${iconBtn} disabled:opacity-50 disabled:pointer-events-none`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};