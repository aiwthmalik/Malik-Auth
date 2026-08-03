import React, { useState } from 'react';
import { Trash2, ShieldAlert, Clock, CheckSquare, XSquare } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onBulkDelete: () => void;
  onBulkBan: () => void;
  onBulkExtend: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  totalCount,
  onBulkDelete,
  onBulkBan,
  onBulkExtend,
  onSelectAll,
  onDeselectAll,
}) => {
  const [confirmAction, setConfirmAction] = useState<'delete' | 'ban' | null>(null);
  const [loading, setLoading] = useState(false);

  if (selectedCount === 0) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (confirmAction === 'delete') onBulkDelete();
      else if (confirmAction === 'ban') onBulkBan();
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-500/20 bg-brand-600/95 backdrop-blur-md px-4 py-3 shadow-lg shadow-brand-900/20 animate-slide-up">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{selectedCount} selected</span>
            <span className="text-xs text-brand-200">of {totalCount} total</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSelectAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All</span>
            </button>
            <button onClick={onDeselectAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <XSquare className="w-3.5 h-3.5" />
              <span>Deselect All</span>
            </button>
            <div className="w-px h-5 bg-brand-400/30" />
            <button onClick={onBulkExtend} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Clock className="w-3.5 h-3.5" />
              <span>Extend Expiry</span>
            </button>
            <button onClick={() => setConfirmAction('ban')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-500/30 rounded-lg transition-colors">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Ban Selected</span>
            </button>
            <button onClick={() => setConfirmAction('delete')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:text-white hover:bg-rose-500/30 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction === 'delete'}
        title="Bulk Delete"
        message={`Are you sure you want to delete ${selectedCount} selected items? This action is irreversible.`}
        confirmLabel="Delete All Selected"
        variant="danger"
        isLoading={loading}
        onConfirm={handleConfirm}
        onClose={() => setConfirmAction(null)}
      />

      <ConfirmModal
        isOpen={confirmAction === 'ban'}
        title="Bulk Ban"
        message={`Are you sure you want to ban ${selectedCount} selected items?`}
        confirmLabel="Ban All Selected"
        variant="warning"
        isLoading={loading}
        onConfirm={handleConfirm}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
};
