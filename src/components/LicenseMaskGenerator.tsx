import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Eye,
  Save,
  Trash2,
  Plus,
  Copy,
  Check,
  Hash,
  CaseSensitive,
  Asterisk,
  X
} from 'lucide-react';
import { Card, PageHeader, FieldLabel } from './ui';

interface LicenseMaskGeneratorProps {
  appId: string;
  onGenerate: (keys: string[], name: string, expiry: string) => void;
}

interface MaskTemplate {
  id: string;
  name: string;
  pattern: string;
}

function generateFromMask(mask: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const digits = '0123456789';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let result = '';
  for (const ch of mask) {
    if (ch === '#') {
      result += digits[Math.floor(Math.random() * digits.length)];
    } else if (ch === '$') {
      result += upper[Math.floor(Math.random() * upper.length)];
    } else if (ch === 'X') {
      result += chars[Math.floor(Math.random() * chars.length)];
    } else if (ch === '*') {
      result += chars[Math.floor(Math.random() * chars.length)];
    } else {
      result += ch;
    }
  }
  return result;
}

const DEFAULT_MASK = 'XXXX-XXXX-XXXX-XXXX';

const PRESET_TEMPLATES: MaskTemplate[] = [
  { id: 'standard', name: 'Standard (XXXX-XXXX-XXXX-XXXX)', pattern: 'XXXX-XXXX-XXXX-XXXX' },
  { id: 'malik', name: 'MALIK Prefix (MALIK-XXXX-XXXX)', pattern: 'MALIK-XXXX-XXXX' },
  { id: 'numeric', name: 'Numeric Only (####-####-####)', pattern: '####-####-####' },
  { id: 'mixed', name: 'Mixed (MALIK-#####-$$$$)', pattern: 'MALIK-#####-$$$$' },
];

export const LicenseMaskGenerator: React.FC<LicenseMaskGeneratorProps> = ({ appId, onGenerate }) => {
  const [mask, setMask] = useState(DEFAULT_MASK);
  const [batchSize, setBatchSize] = useState(10);
  const [keyName, setKeyName] = useState('');
  const [expiry, setExpiry] = useState('30 Days');
  const [showPreview, setShowPreview] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<MaskTemplate[]>(PRESET_TEMPLATES);
  const [templateName, setTemplateName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  const previewKeys = useMemo(() => {
    return Array.from({ length: Math.min(batchSize, 20) }, () => generateFromMask(mask));
  }, [mask, batchSize]);

  const handleGenerate = () => {
    const keys = Array.from({ length: batchSize }, () => generateFromMask(mask));
    setGeneratedKeys(keys);
    setShowPreview(true);
  };

  const handleConfirmGenerate = () => {
    if (generatedKeys.length > 0) {
      onGenerate(generatedKeys, keyName || 'Custom Mask Keys', expiry);
      setGeneratedKeys([]);
      setShowPreview(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate: MaskTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      pattern: mask,
    };
    setSavedTemplates((prev) => [...prev, newTemplate]);
    setTemplateName('');
    setShowSaveForm(false);
  };

  const handleDeleteTemplate = (id: string) => {
    setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyAllKeys = () => {
    navigator.clipboard.writeText(generatedKeys.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const maskLegend = [
    { char: 'X', desc: 'Alphanumeric (A-Z, 0-9)' },
    { char: '#', desc: 'Digits only (0-9)' },
    { char: '$', desc: 'Uppercase letters (A-Z)' },
    { char: '*', desc: 'Any character' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wand2}
        accent="emerald"
        title="License Mask Generator"
        subtitle="Create custom license key formats with configurable masks"
        actions={
          generatedKeys.length > 0 && (
            <button onClick={() => setShowPreview(true)} className="btn-primary text-xs">
              <Eye className="h-4 w-4" />
              <span>View Generated ({generatedKeys.length})</span>
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mask Configuration */}
        <Card className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Mask Pattern</h3>
          </div>

          <div>
            <FieldLabel required>Mask Pattern</FieldLabel>
            <input
              type="text"
              value={mask}
              onChange={(e) => setMask(e.target.value)}
              className="input font-mono text-sm"
              placeholder="XXXX-XXXX-XXXX-XXXX"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {maskLegend.map((item) => (
              <div
                key={item.char}
                className="flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.03]"
              >
                <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.char}</code>
                <span className="text-surface-600 dark:text-surface-400">{item.desc}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Key Name</FieldLabel>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="input text-xs"
                placeholder="e.g. VIP License"
              />
            </div>
            <div>
              <FieldLabel required>Expiry</FieldLabel>
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="select text-xs"
              >
                <option value="1 Day">1 Day</option>
                <option value="7 Days">7 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="365 Days">365 Days</option>
                <option value="Lifetime">Lifetime</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Batch Size (1-100)</FieldLabel>
            <input
              type="number"
              min={1}
              max={100}
              value={batchSize}
              onChange={(e) => setBatchSize(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="input text-xs"
            />
          </div>

          <button onClick={handleGenerate} className="btn-primary w-full text-xs">
            <Wand2 className="h-4 w-4" />
            <span>Generate {batchSize} Key(s)</span>
          </button>
        </Card>

        {/* Templates & Preview */}
        <div className="space-y-5">
          {/* Saved Templates */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Saved Templates</h3>
              </div>
              <button
                onClick={() => setShowSaveForm(true)}
                className="btn-ghost text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Save Current</span>
              </button>
            </div>

            {showSaveForm && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="input flex-1 text-xs"
                  placeholder="Template name"
                />
                <button onClick={handleSaveTemplate} className="btn-primary text-xs">
                  Save
                </button>
                <button onClick={() => setShowSaveForm(false)} className="btn-ghost text-xs">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              {savedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="cursor-pointer" onClick={() => setMask(template.pattern)}>
                    <p className="text-xs font-semibold text-surface-900 dark:text-white">{template.name}</p>
                    <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400">{template.pattern}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-surface-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Live Preview */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Live Preview</h3>
              <span className="text-xs text-surface-500 dark:text-surface-400">(updates as you type)</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto">
              {previewKeys.map((key, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-surface-100 bg-white px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <span className="font-mono text-xs font-medium text-surface-800 dark:text-surface-200">{key}</span>
                  <button
                    onClick={() => copyKey(key)}
                    className="p-1 text-surface-400 hover:text-emerald-500"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Generation Confirmation Modal */}
      {showPreview && generatedKeys.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                  Generated {generatedKeys.length} License Keys
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Review and confirm to add these keys
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="text-surface-500 dark:text-surface-400">Key Name</span>
                <p className="font-semibold text-surface-900 dark:text-white">{keyName || 'Custom Mask Keys'}</p>
              </div>
              <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="text-surface-500 dark:text-surface-400">Expiry</span>
                <p className="font-semibold text-surface-900 dark:text-white">{expiry}</p>
              </div>
            </div>

            <div className="mb-5 max-h-60 overflow-y-auto space-y-1">
              {generatedKeys.map((key, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-surface-100 bg-white px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <span className="text-xs text-surface-400 dark:text-surface-500">#{i + 1}</span>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{key}</span>
                  <button
                    onClick={() => copyKey(key)}
                    className="p-1 text-surface-400 hover:text-emerald-500"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-surface-200 pt-4 dark:border-white/10">
              <button onClick={copyAllKeys} className="btn-ghost text-xs">
                <Copy className="h-4 w-4" />
                <span>Copy All Keys</span>
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button onClick={handleConfirmGenerate} className="btn-primary text-xs">
                  Confirm & Create {generatedKeys.length} Key(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
