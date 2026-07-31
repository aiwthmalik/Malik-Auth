import React, { useState } from 'react';
import {
  Radio,
  Power,
  Search,
  ShieldAlert,
  Clock,
  Check,
  AlertTriangle
} from 'lucide-react';
import { MalikSession } from '../types';
import { terminateSession } from '../lib/malikAuthService';

interface SessionsTabProps {
  appId: string;
  sessions: MalikSession[];
  onRefresh: () => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ appId, sessions, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const handleTerminate = async (session: MalikSession) => {
    if (!session.id) return;
    if (!window.confirm(`Remote Kill Switch: Terminate active session for ${session.username}? Their application will close immediately.`)) {
      return;
    }
    setTerminatingId(session.id);
    try {
      await terminateSession(session.id, session.sessionId, appId);
      onRefresh();
    } catch (err) {
      console.error('Error terminating session:', err);
    } finally {
      setTerminatingId(null);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.hwid.toLowerCase().includes(search.toLowerCase()) ||
      s.sessionId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live Connected Sessions & Remote Kill Switch</h2>
            <p className="text-xs text-slate-500">
              Monitor active heartbeat timestamps. Terminating a session sends a remote kill command to the client application.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search username, session ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          {filteredSessions.filter((s) => s.status === 'Active').length} Active Heartbeats
        </span>
      </div>

      {/* Sessions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No live sessions connected. Sessions will appear in real time when users connect from your software.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-semibold">Username</th>
                  <th className="py-3.5 px-4 font-semibold">Session ID</th>
                  <th className="py-3.5 px-4 font-semibold">HWID</th>
                  <th className="py-3.5 px-4 font-semibold">IP Address</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Last Heartbeat</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Remote Kill Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((s) => (
                  <tr key={s.id || s.sessionId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.username}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-700">
                      {s.sessionId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {s.hwid}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {s.ipAddress}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(s.lastHeartbeat).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {s.status === 'Active' ? (
                        <button
                          onClick={() => handleTerminate(s)}
                          disabled={terminatingId === s.id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Kill Session</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Terminated</span>
                      )}
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
