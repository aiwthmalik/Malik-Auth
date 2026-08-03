import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Search,
  X,
  User,
  Shield,
  Info,
} from 'lucide-react';
import { MalikChatMessage } from '../types';
import { PageHeader, EmptyState, FieldLabel } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface ChatSystemProps {
  appId: string;
  messages: MalikChatMessage[];
  onRefresh: () => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  appId,
  messages,
  onRefresh,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [senderName, setSenderName] = useState('Admin');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      const msg: MalikChatMessage = {
        appId,
        sender: senderName,
        senderType: 'admin',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };
      console.log('Sending message:', msg);
      setNewMessage('');
      onRefresh();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      console.log('Clearing chat history for app:', appId);
      setClearConfirm(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setClearing(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'admin':
        return <Shield className="h-3.5 w-3.5 text-violet-500" />;
      case 'system':
        return <Info className="h-3.5 w-3.5 text-sky-500" />;
      default:
        return <User className="h-3.5 w-3.5 text-surface-400" />;
    }
  };

  const getSenderBadgeClass = (senderType: string) => {
    switch (senderType) {
      case 'admin':
        return 'bg-violet-500/10 text-violet-700 dark:text-violet-300';
      case 'system':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300';
      default:
        return 'bg-surface-100 text-surface-700 dark:bg-white/[0.06] dark:text-surface-300';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        accent="sky"
        title="Chat System"
        subtitle="In-app communication channel between developer and users."
        actions={
          <button
            onClick={() => setClearConfirm(true)}
            className="btn-ghost text-xs text-rose-500 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear History</span>
          </button>
        }
      />

      <div className="card flex h-[600px] flex-col overflow-hidden">
        <div className="border-b border-surface-200 bg-surface-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-surface-900 dark:text-white">Support Channel</span>
            </div>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {messages.length} messages
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                message="Start a conversation with your users."
              />
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id || msg.timestamp}
                className={`flex gap-3 ${msg.senderType === 'admin' ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-white/[0.06]">
                  {getSenderIcon(msg.senderType)}
                </div>
                <div className={`max-w-[75%] ${msg.senderType === 'admin' ? 'items-end' : 'items-start'}`}>
                  <div className={`mb-1 flex items-center gap-2 ${msg.senderType === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-surface-900 dark:text-white">{msg.sender}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSenderBadgeClass(msg.senderType)}`}>
                      {msg.senderType}
                    </span>
                    <span className="text-[10px] text-surface-400 dark:text-surface-500">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`rounded-xl px-4 py-2.5 text-sm ${
                      msg.senderType === 'admin'
                        ? 'bg-brand-600 text-white'
                        : msg.senderType === 'system'
                        ? 'border border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/5 dark:text-sky-200'
                        : 'border border-surface-200 bg-white text-surface-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-200'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-surface-200 bg-surface-50/80 p-4 dark:border-white/10 dark:bg-white/[0.02]">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-semibold text-surface-600 dark:text-surface-400">Admin</span>
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input flex-1 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="btn-primary px-4 py-2"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={clearConfirm}
        title="Clear Chat History"
        message="Are you sure you want to clear all chat messages? This action cannot be undone."
        confirmLabel="Clear All Messages"
        isLoading={clearing}
        onConfirm={handleClearHistory}
        onClose={() => setClearConfirm(false)}
      />
    </div>
  );
};
