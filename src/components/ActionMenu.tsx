import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'indigo';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  align?: 'right' | 'left';
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 176; // w-44 = 176px
      let top = rect.bottom + 4;
      let left = align === 'right' ? rect.right - menuWidth : rect.left;

      if (left < 10) left = 10;
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
      }

      const estimatedHeight = items.length * 36 + 12;
      if (top + estimatedHeight > window.innerHeight && rect.top - estimatedHeight > 0) {
        top = rect.top - estimatedHeight - 4;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => {
        setIsOpen(false);
      };
      const handleClickOutside = (event: MouseEvent) => {
        if (
          buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          menuRef.current && !menuRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
        title="More Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && coords && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999,
          }}
          className="w-44 rounded-xl bg-white border border-slate-200 shadow-xl ring-1 ring-black/5 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            let textClass = 'text-slate-700 hover:bg-slate-50';
            if (item.variant === 'danger') {
              textClass = 'text-rose-600 hover:bg-rose-50';
            } else if (item.variant === 'success') {
              textClass = 'text-emerald-700 hover:bg-emerald-50';
            } else if (item.variant === 'indigo') {
              textClass = 'text-indigo-700 hover:bg-indigo-50';
            }

            return (
              <button
                key={index}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 ${textClass}`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};
