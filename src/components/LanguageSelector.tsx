import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import {
  getLanguage,
  setLanguage,
  getLanguageName,
  getLanguageFlag,
  getSupportedLanguages,
  onLanguageChange,
  type Language
} from '../lib/i18n';

export const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<Language>(getLanguage());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onLanguageChange(() => {
      setCurrent(getLanguage());
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = getSupportedLanguages();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-700 transition-all hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-300 dark:hover:border-white/20"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{getLanguageFlag(current)} {getLanguageName(current)}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
          {languages.map((lang) => {
            const isSelected = current === lang;
            return (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base">{getLanguageFlag(lang)}</span>
                <span className="flex-1 font-medium">{getLanguageName(lang)}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
