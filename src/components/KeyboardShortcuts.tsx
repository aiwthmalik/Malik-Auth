import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: 'Ctrl + K', description: 'Focus search bar' },
  { keys: 'Ctrl + N', description: 'New app modal' },
  { keys: 'Escape', description: 'Close modals' },
  { keys: 'Ctrl + 1-7', description: 'Switch tabs' },
  { keys: '?', description: 'Show this help' },
];

interface KeyboardShortcutsProps {
  onNewApp?: () => void;
  activeTabSetter?: (tab: number) => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onNewApp, activeTabSetter }) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false);
        document.dispatchEvent(new CustomEvent('malik:close-modals'));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('malik:focus-search'));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewApp?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && /^[1-7]$/.test(e.key)) {
        e.preventDefault();
        activeTabSetter?.(Number(e.key) - 1);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewApp, activeTabSetter]);

  return (
    <>
      {showHelp && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="card w-full max-w-sm p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-brand-500" />
                </div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">Keyboard Shortcuts</h3>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-50 dark:hover:bg-white/[0.03]">
                  <span className="text-sm text-surface-700 dark:text-surface-200">{s.description}</span>
                  <kbd className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border border-surface-200 bg-surface-100 text-surface-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-300">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
