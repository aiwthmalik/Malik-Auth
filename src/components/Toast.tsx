import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalToastId = 0;
const MAX_TOASTS = 3;
const DISMISS_MS = 5000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastItem['type'], message: string) => {
      const id = `toast-${++globalToastId}`;
      setToasts((prev) => [id, ...prev.filter((_, i) => i < MAX_TOASTS - 1)]
        .map((item) => (typeof item === 'string' ? toasts.find((t) => t.id === item) : item))
        .filter(Boolean) as ToastItem[]
      );
      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        return next.slice(0, MAX_TOASTS);
      });
      const timer = setTimeout(() => dismiss(id), DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const toast = {
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info: (message: string) => addToast('info', message),
  };

  const iconMap: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />,
    error: <AlertCircle className="w-4.5 h-4.5 text-rose-500" />,
    warning: <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />,
    info: <Info className="w-4.5 h-4.5 text-brand-500" />,
  };

  const bgMap: Record<string, string> = {
    success: 'border-emerald-500/20 bg-emerald-500/10',
    error: 'border-rose-500/20 bg-rose-500/10',
    warning: 'border-amber-500/20 bg-amber-500/10',
    info: 'border-brand-500/20 bg-brand-500/10',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-slide-in ${bgMap[t.type]}`}
          >
            <div className="mt-0.5 shrink-0">{iconMap[t.type]}</div>
            <p className="text-sm font-medium text-surface-900 dark:text-white flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-0.5 shrink-0 p-0.5 rounded-md text-surface-400 hover:text-surface-700 dark:hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
