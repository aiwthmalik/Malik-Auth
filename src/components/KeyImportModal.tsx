import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { MalikLicense } from '../types';
import { logActivity } from '../lib/malikAuthService';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Card, PageHeader, FieldLabel, EmptyState } from './ui';

interface KeyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  onImported: () => void;
}

export const KeyImportModal: React.FC<KeyImportModalProps> = ({
  isOpen,
  onClose,
  appId,
  onImported
}) => {
  const [inputText, setInputText] = useState('');
  const [previewKeys, setPreviewKeys] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ success: boolean; message: string; imported: number } | null>(null);
  const [expiryMode, setExpiryMode] = useState<'30days' | '7days' | '365days' | 'lifetime'>('30days');
  const [keyName, setKeyName] = useState('Imported Key');
  const [note, setNote] = useState('Bulk imported via CSV/Text');

  const parseInput = useCallback((text: string) => {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.startsWith('MALIK-') || line.match(/^[A-Z0-9]{4,}$/i)));

    setPreviewKeys(lines);
    return lines;
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    parseInput(text);
  };

  const computeExpiry = (): string => {
    const now = Date.now();
    switch (expiryMode) {
      case '7days': return new Date(now + 7 * 86400000).toISOString();
      case '30days': return new Date(now + 30 * 86400000).toISOString();
      case '365days': return new Date(now + 365 * 86400000).toISOString();
      case 'lifetime': return 'Lifetime (Never Expires)';
      default: return new Date(now + 30 * 86400000).toISOString();
    }
  };

  const handleImport = async () => {
    if (previewKeys.length === 0) return;

    setImporting(true);
    setResult(null);
    setProgress({ current: 0, total: previewKeys.length });

    try {
      const expiry = computeExpiry();
      const batchSize = 500;
      let imported = 0;

      for (let i = 0; i < previewKeys.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = previewKeys.slice(i, i + batchSize);

        for (const key of chunk) {
          const docRef = doc(collection(db, 'licenses'));
          const newLicense: MalikLicense = {
            key,
            keyName,
            appId,
            status: 'Unused',
            note,
            expiry,
            usedBy: '',
            createdAt: new Date().toISOString(),
          };
          batch.set(docRef, newLicense);
          imported++;
          setProgress({ current: imported, total: previewKeys.length });
        }

        await batch.commit();
      }

      await logActivity(
        appId,
        'KEY_GENERATED',
        'Admin',
        'N/A',
        `Bulk imported ${imported} license key(s) via CSV/Text`
      );

      setResult({ success: true, message: `Successfully imported ${imported} keys`, imported });
      onImported();
    } catch (err) {
      console.error('Import error:', err);
      setResult({ success: false, message: 'Failed to import keys. Please try again.', imported: 0 });
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setPreviewKeys([]);
    setResult(null);
    setProgress({ current: 0, total: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-2xl animate-scale-in overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-500">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">Import License Keys</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Import keys from CSV or text (one key per line)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <FieldLabel required>Paste License Keys</FieldLabel>
            <textarea
              rows={6}
              value={inputText}
              onChange={handleTextChange}
              placeholder={"Paste keys here (one per line):\nMALIK-XXXX-XXXX-XXXX-XXXX\nMALIK-YYYY-YYYY-YYYY-YYYY\n..."}
              className="input resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              Supports MALIK-XXXX format or plain alphanumeric keys. One key per line.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Key Name</FieldLabel>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="input text-sm"
              />
            </div>
            <div>
              <FieldLabel>Note</FieldLabel>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input text-sm"
              />
            </div>
            <div>
              <FieldLabel>Expiry</FieldLabel>
              <select
                value={expiryMode}
                onChange={(e) => setExpiryMode(e.target.value as any)}
                className="select text-sm"
              >
                <option value="7days">7 Days</option>
                <option value="30days">30 Days</option>
                <option value="365days">1 Year</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
          </div>

          {previewKeys.length > 0 && (
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-surface-900 dark:text-white">
                  Preview ({previewKeys.length} keys detected)
                </h4>
                <button onClick={handleClear} className="btn-ghost text-xs">
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-surface-200 bg-surface-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-white/10">
                      <th className="px-2 py-1.5 text-left font-semibold text-surface-600 dark:text-surface-400">#</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-surface-600 dark:text-surface-400">License Key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-white/[0.06]">
                    {previewKeys.slice(0, 20).map((key, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1.5 font-mono text-surface-500">{idx + 1}</td>
                        <td className="px-2 py-1.5 font-mono font-bold text-brand-600 dark:text-brand-400">{key}</td>
                      </tr>
                    ))}
                    {previewKeys.length > 20 && (
                      <tr>
                        <td colSpan={2} className="px-2 py-1.5 text-center text-surface-500">
                          ...and {previewKeys.length - 20} more keys
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400">
                <span>Importing keys...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                result.success
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {result.message}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-white/10">
            <button onClick={onClose} className="btn-ghost text-xs">
              {result?.success ? 'Close' : 'Cancel'}
            </button>
            {!result?.success && (
              <button
                onClick={handleImport}
                disabled={importing || previewKeys.length === 0}
                className="btn-primary text-xs"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import {previewKeys.length} Key(s)
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
