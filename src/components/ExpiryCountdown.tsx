import React, { useState, useEffect } from 'react';
import { parseExpiryToDate, formatPKTDateTime } from '../lib/dateUtils';
import { Clock, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

interface ExpiryCountdownProps {
  expiryStr?: string;
  showBadgeOnly?: boolean;
}

function getExpiryColor(diffMs: number): { badge: string; text: string; icon: string } {
  if (diffMs <= 0) {
    return {
      badge: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
      text: 'text-rose-600 dark:text-rose-400',
      icon: 'text-rose-500',
    };
  }
  const hoursLeft = diffMs / (1000 * 60 * 60);
  const daysLeft = diffMs / (1000 * 60 * 60 * 24);

  if (hoursLeft < 1) {
    return {
      badge: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
      text: 'text-rose-600 dark:text-rose-400',
      icon: 'text-rose-500',
    };
  }
  if (daysLeft < 1) {
    return {
      badge: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500',
    };
  }
  if (daysLeft <= 7) {
    return {
      badge: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500',
    };
  }
  return {
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500',
  };
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
  const exactDate = targetDate ? formatPKTDateTime(targetDate) : expiryStr;

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

  const colors = getExpiryColor(diffMs);
  const isPulsing = diffMs < 1000 * 60 * 60; // < 1 hour

  if (showBadgeOnly) {
    return (
      <span className={`badge border font-mono ${colors.badge}`} title={`Expires: ${exactDate}`}>
        <Clock className={`w-3 h-3 ${colors.icon} ${isPulsing ? 'animate-pulse' : ''}`} />
        <span>{countdownText}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col group relative">
      <span className={`font-mono text-xs font-bold flex items-center gap-1 ${colors.text}`}>
        <Clock className={`w-3.5 h-3.5 shrink-0 ${colors.icon} ${isPulsing ? 'animate-pulse' : ''}`} />
        <span>{countdownText}</span>
      </span>
      <span className="text-[10px] text-surface-400 dark:text-surface-500 font-mono truncate max-w-[140px]" title={expiryStr}>
        {expiryStr}
      </span>
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
        <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-[11px] font-medium text-surface-700 shadow-lg dark:border-white/10 dark:bg-[#15151f] dark:text-surface-200 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Info className="h-3 w-3 text-surface-400" />
            <span>Expires: {exactDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};