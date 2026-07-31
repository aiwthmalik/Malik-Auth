import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { MalikActivityLog } from '../types';

interface ActivityLogsTabProps {
  logs: MalikActivityLog[];
  onRefresh: () => void;
}

export const ActivityLogsTab: React.FC<ActivityLogsTabProps> = ({ logs, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.hwid.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Security & Audit Activity Logs</h2>
            <p className="text-xs text-slate-500">
              Real-time audit trail of every license activation, application login, and HWID reset.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search actor, HWID, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
        >
          <option value="ALL">All Actions ({logs.length})</option>
          <option value="LICENSE_ACTIVATED">LICENSE_ACTIVATED</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
          <option value="HWID_RESET">HWID_RESET</option>
          <option value="REMOTE_SYNC">REMOTE_SYNC</option>
          <option value="KEY_GENERATED">KEY_GENERATED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No logs match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold">Event Type</th>
                  <th className="py-3.5 px-4 font-semibold">Actor / License</th>
                  <th className="py-3.5 px-4 font-semibold">HWID</th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id || `${log.timestamp}-${log.actor}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.action === 'LICENSE_ACTIVATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.action === 'USER_LOGIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        log.action === 'HWID_RESET' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900">
                      {log.actor}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {log.hwid}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
