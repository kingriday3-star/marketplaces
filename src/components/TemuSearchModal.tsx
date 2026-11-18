import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Clock,
  Trash2,
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';
import { Product } from '../types';
import {
  SupportedLanguage,
  getBadgeLabel,
  getCategoryName,
  getProductTitle,
  getProductDescription,
  resolveBaseLang,
  t
} from '../utils/i18n';
import { formatTaka, toBengaliNumber } from '../utils/bengali';

interface TemuSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  products: Product[];
  onProductClick: (product: Product) => void;
  onOrderClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  language?: SupportedLanguage;
}

const STORAGE_RECENT_SEARCHES = 'marketplaces_recent_searches_v1';

export const TemuSearchModal: React.FC<TemuSearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  products,
  onProductClick,
  onOrderClick,
  onAddToCart,
  language = 'bn'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({});
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECENT_SEARCHES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 8);
      }
    } catch {
      // ignore
    }
    return ['স্মার্ট ওয়াচ', 'টি-শার্ট', 'এয়ারবাডস'];
  });

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const popularKeywords = useMemo(
    () => [
      { text: isBn ? 'স্মার্ট ওয়াচ' : isAr ? 'ساعة ذكية' : 'smart watch', icon: '🔥' },
      { text: isBn ? 'কুর্তি ও ফ্যাশন' : isAr ? 'أزياء نسائية' : 'ladies fashion', icon: '🔥' },
      { text: isBn ? 'ব্লুটুথ এয়ারবাডস' : isAr ? 'سماعات بلوتوث' : 'bluetooth earbuds', icon: '🔥' },
      { text: isBn ? 'কার্গো প্যান্ট' : isAr ? 'بنطال كارغو' : 'cargo pants', icon: '🔥' },
      { text: isBn ? 'সেফটি জুতা' : isAr ? 'أحذية رياضية' : 'safety shoes', icon: '👟' },
      { text: isBn ? 'সুন্দরবনের মধু' : isAr ? 'عسل طبيعي' : 'natural honey', icon: '🍯' },
      { text: isBn ? 'চামড়ার ব্যাগ' : isAr ? 'حقيبة جلد' : 'leather bag', icon: '💼' },
      { text: isBn ? 'বাচ্চাদের ড্রেস' : isAr ? 'ملابس أطفال' : 'kids dress', icon: '🧸' }
    ],
    [isBn, isAr]
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_RECENT_SEARCHES, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_RECENT_SEARCHES);
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (term?: string) => {
    const q = term !== undefined ? term : searchQuery;
    if (q.trim()) {
      saveRecentSearch(q.trim());
      onSearchChange(q.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const matchingProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const title = p.title.toLowerCase();
      const titleEn = (p.titleEn || '').toLowerCase();
      const localizedTitle = getProductTitle(p, language).toLowerCase();
      const desc = p.description.toLowerCase();
      const descEn = (p.descriptionEn || '').toLowerCase();
      const cat = p.category.toLowerCase();
      const localizedCat = getCategoryName(p.category, language).toLowerCase();
      const badge = (p.badge || '').toLowerCase();
      return (
        title.includes(q) ||
        titleEn.includes(q) ||
        localizedTitle.includes(q) ||
        desc.includes(q) ||
        descEn.includes(q) ||
        cat.includes(q) ||
        localizedCat.includes(q) ||
        badge.includes(q)
      );
    });
  }, [searchQuery, products, language]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] bg-white dark:bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200"
      style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
    >
      {/* Top Header with Search Input */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 sm:px-5 flex items-center gap-2 sm:gap-3 shadow-xs">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-1 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
          title={t('back', language)}
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full pl-4 pr-1.5 py-1 border-2 border-slate-900 dark:border-slate-300 focus-within:border-[#fb7701] focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPlaceholder', language)}
            className="w-full text-sm sm:text-base font-bold bg-transparent outline-none text-slate-950 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 select-text"
            autoFocus
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="p-1.5 text-slate-500 hover:text-slate-950 dark:hover:text-white rounded-full cursor-pointer transition-colors mr-1"
              title={t('clearSearch', language)}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            className="w-8 h-8 rounded-full bg-slate-950 dark:bg-white hover:bg-[#fb7701] dark:hover:bg-[#fb7701] text-white dark:text-slate-950 dark:hover:text-white flex items-center justify-center shrink-0 shadow transition-colors cursor-pointer"
            title={t('search', language)}
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-5">
        {!searchQuery.trim() ? (
          <>
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-slate-950 dark:text-white">
                <TrendingUp className="w-4 h-4 text-[#fb7701]" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  {isBn ? 'জনপ্রিয় অনুসন্ধান' : isAr ? 'عمليات البحث الرائجة' : 'Popular right now'}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {popularKeywords.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSearchChange(item.text);
                      handleSearchSubmit(item.text);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-orange-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-orange-300 rounded-full text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-slate-950 dark:text-white font-bold text-xs sm:text-sm">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {isBn ? 'সাম্প্রতিক অনুসন্ধান' : isAr ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clearSearchBtn', language)}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        onSearchChange(term);
                        handleSearchSubmit(term);
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Categories Bar */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t('menuCategoriesSection', language)}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  'পোশাক ও ফ্যাশন',
                  'গ্যাজেট ও ইলেকট্রনিক্স',
                  'হোম ও কিচেন',
                  'স্পোর্টস ও ফিটনেস'
                ].map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSearchChange(cat);
                      handleSearchSubmit(cat);
                    }}
                    className="p-2.5 bg-orange-50/60 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl border border-orange-200 dark:border-slate-700 font-bold text-xs text-left cursor-pointer transition-colors"
                  >
                    {getCategoryName(cat, language)}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              <span>
                {t('searchFoundForPrefix', language)} ‘{searchQuery}’ (
                {toBengaliNumber(matchingProducts.length, language)} {t('itemsCountLabel', language)})
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const catalog = document.getElementById('product-catalog-section');
                  if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[#fb7701] font-bold underline cursor-pointer"
              >
                {t('viewAllProducts', language)}
              </button>
            </div>

            {matchingProducts.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {t('noProductsFound', language)}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-medium">
                  {isBn
                    ? 'বানান সঠিক আছে কিনা যাচাই করুন অথবা উপরের ট্রেন্ডিং কিওয়ার্ড থেকে একটি সিলেক্ট করুন।'
                    : isAr
                    ? 'تحقق من الإملاء أو اختر من الكلمات الرائجة أعلاه.'
                    : 'Check your spelling or choose from the popular keywords above.'}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {t('clearSearch', language)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingProducts.map((product) => {
                  const title = getProductTitle(product, language);
                  const desc = getProductDescription(product, language);
                  const hasErr = thumbErrors[product.id];

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        onProductClick(product);
                      }}
                      className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-[#fb7701] transition-all flex items-center gap-3 cursor-pointer group shadow-xs"
                    >
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                        {product.image && !hasErr ? (
                          <img
                            src={product.image}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={() =>
                              setThumbErrors((prev) => ({ ...prev, [product.id]: true }))
                            }
                          />
                        ) : (
                          <ShoppingBag className="w-7 h-7 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="bg-[#d9261c] text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                            {getBadgeLabel(product.badge || '11.11 SALE', language)}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded truncate">
                            {getCategoryName(product.category, language)}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white line-clamp-1 group-hover:text-[#fb7701] transition-colors">
                          {title}
                        </h4>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mb-1.5 font-medium">
                          {desc}
                        </p>

                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-base font-black text-[#fb7701]">
                              {formatTaka(product.price, language)}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[11px] line-through text-slate-500 font-bold">
                                {formatTaka(product.originalPrice, language)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(product);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-orange-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:text-[#fb7701] rounded-lg transition-colors cursor-pointer"
                              title={t('addToCartBtn', language)}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOrderClick(product);
                              }}
                              className="px-2.5 py-1.5 bg-[#fb7701] hover:bg-[#e65100] text-white font-extrabold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
                            >
                              {t('quickOrderBtn', language)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Close Button */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:px-6 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
          Market places • {t('cashOnDelivery', language)}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{t('close', language)}</span>
        </button>
      </div>
    </div>
  );
};
