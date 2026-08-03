import React, { useState } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Card, PageHeader, FieldLabel, EmptyState } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface UserNotesProps {
  userId: string;
  username: string;
  notes: MalikUserNote[];
  onAdd: (note: Omit<MalikUserNote, 'id' | 'timestamp'>) => void;
  onDelete: (noteId: string) => void;
}

interface MalikUserNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  type: 'general' | 'warning' | 'important';
}

const NOTE_TYPES = [
  { value: 'general', label: 'General', color: 'bg-sky-500/10 text-sky-600 border-sky-500/25 dark:text-sky-400', icon: Info },
  { value: 'warning', label: 'Warning', color: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400', icon: AlertTriangle },
  { value: 'important', label: 'Important', color: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400', icon: AlertCircle },
] as const;

export const UserNotes: React.FC<UserNotesProps> = ({ userId, username, notes, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<'general' | 'warning' | 'important'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    onAdd({
      text: newNoteText.trim(),
      author: 'Admin',
      type: newNoteType,
    });
    setNewNoteText('');
    setNewNoteType('general');
    setIsAdding(false);
  };

  const handleEditNote = (note: MalikUserNote) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editText.trim()) return;
    // In production, this would call an API to update the note
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteNote = (noteId: string) => {
    onDelete(noteId);
    setNoteToDelete(null);
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeConfig = (type: string) => {
    return NOTE_TYPES.find((t) => t.value === type) || NOTE_TYPES[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-brand-500" />
          <h3 className="text-sm font-bold text-surface-900 dark:text-white">
            Notes for {username}
          </h3>
          <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600 dark:bg-white/[0.06] dark:text-surface-400">
            {notes.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
              New Note
            </h4>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            className="input min-h-[80px] text-xs"
            placeholder="Enter note content..."
          />

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FieldLabel>Note Type</FieldLabel>
              <div className="flex gap-2">
                {NOTE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setNewNoteType(type.value)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        newNoteType === type.value
                          ? type.color
                          : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-400'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="btn-ghost text-xs">
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newNoteText.trim()}
              className="btn-primary text-xs"
            >
              <Check className="h-4 w-4" />
              <span>Save Note</span>
            </button>
          </div>
        </Card>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={StickyNote}
            title="No notes yet"
            message="Add a note to keep track of important information about this user."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => {
            const typeConfig = getTypeConfig(note.type);
            const TypeIcon = typeConfig.icon;
            return (
              <Card key={note.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${typeConfig.color}`}>
                      <TypeIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="input min-h-[60px] text-xs"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(note.id)}
                              className="btn-primary text-xs"
                            >
                              <Check className="h-3 w-3" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-ghost text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-surface-800 dark:text-surface-200 whitespace-pre-wrap">
                            {note.text}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[11px] text-surface-500 dark:text-surface-400">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                            <span>by {note.author}</span>
                            <span>{formatTimestamp(note.timestamp)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId !== note.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-1.5 text-surface-400 hover:text-brand-500"
                        title="Edit note"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setNoteToDelete(note.id)}
                        className="p-1.5 text-surface-400 hover:text-rose-500"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete Note"
        variant="danger"
        onConfirm={() => noteToDelete && handleDeleteNote(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
      />
    </div>
  );
};
