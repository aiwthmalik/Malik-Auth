import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-shimmer rounded-xl bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 dark:from-white/[0.06] dark:via-white/[0.10] dark:to-white/[0.06] ${className}`}
  />
);

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  if (count === 1) return <Shimmer className={className} />;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={i} className={className} />
      ))}
    </>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card p-5 space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <Shimmer className="h-3 w-28 rounded-lg" />
      <Shimmer className="h-9 w-9 rounded-xl" />
    </div>
    <div className="space-y-2">
      <Shimmer className="h-8 w-20 rounded-lg" />
      <Shimmer className="h-3 w-32 rounded-lg" />
    </div>
  </div>
);

export const SkeletonStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${className}`}>
    {Array.from({ length: 3 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => (
  <div className={`card overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50/80 dark:border-white/10 dark:bg-white/[0.02]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3.5">
                <Shimmer className="h-3 w-20 rounded-lg" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-white/[0.06]">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="hover:bg-surface-50/80 dark:hover:bg-white/[0.03]">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3.5">
                  <Shimmer className={`h-3 rounded-lg ${c === 0 ? 'w-24' : c === cols - 1 ? 'w-16 ml-auto' : 'w-20'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2.5 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Shimmer
        key={i}
        className={`h-3 rounded-lg ${
          i === lines - 1 ? 'w-3/5' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <Shimmer
    className={`rounded-full shrink-0 ${className}`}
    style={{ width: size, height: size } as React.CSSProperties}
  />
);
