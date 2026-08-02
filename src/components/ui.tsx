import React from 'react';
import { LucideIcon } from 'lucide-react';

/* ---------- Card ---------- */
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`card ${onClick ? 'cursor-pointer transition-all duration-200 hover:border-brand-400/50 hover:shadow-md hover:shadow-brand-500/5' : ''} ${className}`}
  >
    {children}
  </div>
);

/* ---------- Page Header ---------- */
export const PageHeader: React.FC<{
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: string;
  actions?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, accent = 'brand', actions }) => {
  const accentMap: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };
  return (
    <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${accentMap[accent] || accentMap.brand}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-surface-500 dark:text-surface-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
};

/* ---------- Status Badge ---------- */
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
    Unused: 'bg-sky-500/10 text-sky-600 border-sky-500/25 dark:text-sky-400',
    Expired: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
    Banned: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
    Terminated: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
    Revoked: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
    Maintenance: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
    Disabled: 'bg-surface-500/10 text-surface-600 border-surface-500/25 dark:text-surface-300',
    Suspended: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
  };
  const cls = map[status] || 'bg-surface-500/10 text-surface-600 border-surface-500/25 dark:text-surface-300';
  return <span className={`badge border ${cls}`}>{status}</span>;
};

/* ---------- Empty State ---------- */
export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50 text-surface-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-500">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-sm font-bold text-surface-900 dark:text-white">{title}</h3>
    {message && <p className="mt-1 max-w-md text-xs text-surface-500 dark:text-surface-400">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ---------- Table wrapper ---------- */
export const TableShell: React.FC<{
  children: React.ReactNode;
  headers: string[];
  empty?: React.ReactNode;
}> = ({ children, headers, empty }) => {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const isEmpty = childArray.length === 0;

  return (
    <div className="card overflow-hidden">
      {isEmpty && empty ? (
        empty
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50/80 text-xs uppercase tracking-wider text-surface-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-surface-400">
                {headers.map((h, i) => (
                  <th key={i} className={`px-4 py-3.5 font-semibold ${i === headers.length - 1 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-white/[0.06]">{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ---------- Sensitive (blur on hover) ---------- */
export const Sensitive: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) => (
  <span
    className={`cursor-pointer select-all blur-[5px] transition-all duration-200 hover:blur-none ${className}`}
    title="Hover to reveal"
  >
    {value}
  </span>
);

/* ---------- Section label ---------- */
export const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400">
    {children}
    {required && <span className="ml-0.5 text-rose-500">*</span>}
  </label>
);