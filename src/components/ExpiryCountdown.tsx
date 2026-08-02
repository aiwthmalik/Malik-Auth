import React, { useState, useEffect } from 'react';
import { parseExpiryToDate } from '../lib/dateUtils';
import { Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ExpiryCountdownProps {
  expiryStr?: string;
  showBadgeOnly?: boolean;
}

export const ExpiryCountdown: React.FC<ExpiryCountdownProps> = ({ expiryStr, showBadgeOnly }) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!expiryStr || expiryStr === '—') {
    return <span className="text-surface-400 dark:text-surface-500 font-mono text-xs">—</span>;
  }

  const targetDate = parseExpiryToDate(expiryStr);

  if (!targetDate) {
    // Lifetime or unknown non-date string
    if (expiryStr.toLowerCase().includes('lifetime')) {
      return (
        <span className="badge border bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Lifetime ∞</span>
        </span>
      );
    }
    return <span className="text-surface-700 dark:text-surface-300 font-mono text-xs">{expiryStr}</span>;
  }

  const diffMs = targetDate.getTime() - now;

  if (diffMs <= 0) {
    return (
      <span className="badge border bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400">
        <ShieldAlert className="w-3 h-3 text-rose-500 animate-pulse" />
        <span>EXPIRED</span>
      </span>
    );
  }

  const totalSec = Math.floor(diffMs / 1000);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60) % 60;
  const hrs = Math.floor(totalSec / 3600) % 24;
  const days = Math.floor(totalSec / 86400);

  let countdownText = '';
  if (days > 0) {
    countdownText = `${days}d ${hrs}h ${min}m ${sec}s`;
  } else if (hrs > 0) {
    countdownText = `${hrs}h ${min}m ${sec}s`;
  } else {
    countdownText = `${min}m ${sec}s`;
  }

  if (showBadgeOnly) {
    return (
      <span className="badge border font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25">
        <Clock className="w-3 h-3 text-amber-500" />
        <span>{countdownText}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-brand-400 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-brand-400 shrink-0" />
        <span>{countdownText}</span>
      </span>
      <span className="text-[10px] text-surface-400 dark:text-surface-500 font-mono truncate max-w-[140px]" title={expiryStr}>
        {expiryStr}
      </span>
    </div>
  );
};