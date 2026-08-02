import React, { useState, useEffect } from 'react';
import { Globe, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { TIMEZONE_LABEL } from '../lib/dateUtils';

interface PktClockHeaderProps {
  appName?: string;
  appVersion?: string;
}

export const PktClockHeader: React.FC<PktClockHeaderProps> = ({ appName, appVersion }) => {
  const [pktTimeStr, setPktTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setPktTimeStr(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* App Info & Security Engine */}
      <div className="flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              {appName || 'MalikAuth Security Engine'}
            </h1>
            {appVersion && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v{appVersion}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 flex items-center space-x-1.5 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>All System Expiration & Audit Timestamps operating on Pakistan Time</span>
          </p>
        </div>
      </div>

      {/* Live GMT+5 Islamabad / Karachi Clock Badge */}
      <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl self-start md:self-auto shadow-inner">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
          <Clock className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <Globe className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              {TIMEZONE_LABEL}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wide block">
            {pktTimeStr || 'Loading GMT+5 time...'}
          </span>
        </div>
      </div>
    </div>
  );
};
