import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileJson, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
}

interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  columns: Column[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, filename, columns }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportCSV = () => {
    const header = columns.map((c) => `"${c.label}"`).join(',');
    const rows = data.map((row) =>
      columns.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    download(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
    setOpen(false);
  };

  const exportJSON = () => {
    const json = JSON.stringify(
      data.map((row) => {
        const obj: Record<string, any> = {};
        columns.forEach((c) => { obj[c.key] = row[c.key]; });
        return obj;
      }),
      null,
      2
    );
    download(json, `${filename}.json`, 'application/json');
    setOpen(false);
  };

  const download = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-ghost text-xs">
        <Download className="w-4 h-4" />
        <span>Export ({data.length})</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 py-1 card border border-surface-200 dark:border-white/10 shadow-xl animate-scale-in origin-top-right">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Export as CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <FileJson className="w-4 h-4 text-brand-500" />
            <span>Export as JSON</span>
          </button>
        </div>
      )}
    </div>
  );
};
