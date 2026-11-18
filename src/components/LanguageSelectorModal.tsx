import React, { useState, useMemo } from 'react';
import { Search, X, Check, Globe } from 'lucide-react';
import { LANGUAGES, SupportedLanguage, LanguageOption } from '../utils/i18n';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        l.currency.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#fb7701]" />
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Select Language ({LANGUAGES.length}+ Countries)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ভাষা, মুদ্রা ও প্রোডাক্ট বায়ো স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by country, language (e.g. Arabic, Bengali, Spanish, English)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-[#fb7701]"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Language List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
          {filteredLanguages.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No language found for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    onClose();
                  }}
                  className={`w-full px-3.5 py-3 flex items-center justify-between rounded-xl transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-[#fb7701]'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold flex items-center gap-2 truncate">
                        <span>{lang.nativeName}</span>
                        <span className="text-xs text-slate-400 font-normal">({lang.name})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{lang.country}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {lang.currency} ({lang.currencySymbol})
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#fb7701] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
