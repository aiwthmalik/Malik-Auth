import { useState, useCallback, useRef } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

let toastId = 0;

export function useToast(maxToasts = 3, defaultDuration = 5000) {
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
    (type: ToastItem['type'], message: string, duration?: number) => {
      const id = `toast-${++toastId}`;
      const dur = duration ?? defaultDuration;
      const toast: ToastItem = { id, type, message, duration: dur };

      setToasts((prev) => {
        const next = [toast, ...prev];
        return next.slice(0, maxToasts);
      });

      const timer = setTimeout(() => dismiss(id), dur);
      timersRef.current.set(id, timer);
      return id;
    },
    [maxToasts, defaultDuration, dismiss]
  );

  const toast = {
    success: (message: string, duration?: number) => addToast('success', message, duration),
    error: (message: string, duration?: number) => addToast('error', message, duration),
    warning: (message: string, duration?: number) => addToast('warning', message, duration),
    info: (message: string, duration?: number) => addToast('info', message, duration),
  };

  return { toast, toasts, dismiss };
}
