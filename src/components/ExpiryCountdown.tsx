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
    return <span className="text-slate-400 font-mono text-xs">—</span>;
  }

  const targetDate = parseExpiryToDate(expiryStr);

  if (!targetDate) {
    // Lifetime or unknown non-date string
    if (expiryStr.toLowerCase().includes('lifetime')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Lifetime ∞</span>
        </span>
      );
    }
    return <span className="text-slate-700 font-mono text-xs">{expiryStr}</span>;
  }

  const diffMs = targetDate.getTime() - now;

  if (diffMs <= 0) {
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <ShieldAlert className="w-3 h-3 text-rose-600 animate-pulse" />
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
      <span className="inline-flex items-center space-x-1 font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>{countdownText}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs font-bold text-indigo-700 flex items-center space-x-1">
        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>{countdownText}</span>
      </span>
      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={expiryStr}>
        {expiryStr}
      </span>
    </div>
  );
};
