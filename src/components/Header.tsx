import React, { useState, useRef, useEffect } from 'react';
import { User, Product } from '../types';
import {
  Search,
  List,
  ShoppingCart,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Globe,
  Download,
  X
} from 'lucide-react';
import { toBengaliNumber, formatTaka } from '../utils/bengali';
import {
  SupportedLanguage,
  LANGUAGES,
  t,
  getProductTitle,
  getCategoryName,
  resolveBaseLang
} from '../utils/i18n';
import { MenuDrawer } from './MenuDrawer';

interface HeaderProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onAdminPanelClick: () => void;
  onAgentPortalClick: () => void;
  onMyOrdersClick: () => void;
  onCartClick: () => void;
  onDownloadClick?: () => void;
  onUserProfileClick?: () => void;
  cartCount: number;
  orderCount: number;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  products?: Product[];
  onProductSelect?: (product: Product) => void;
  isOnline?: boolean;
  isMenuDrawerOpen?: boolean;
  onOpenMenuDrawer?: () => void;
  onCloseMenuDrawer?: () => void;
  onSearchClick?: () => void;
  onOpenLanguageSelector?: () => void;
  onOpenPrivacy?: () => void;
  onOpenGuarantee?: (tab: 'refund' | 'delivery') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLoginClick,
  onLogoutClick,
  onAdminPanelClick,
  onAgentPortalClick,
  onMyOrdersClick,
  onCartClick,
  onDownloadClick,
  onUserProfileClick,
  cartCount,
  orderCount,
  onSelectCategory,
  activeCategory,
  theme = 'light',
  onThemeToggle,
  language = 'bn',
  onLanguageChange,
  searchQuery = '',
  onSearchChange,
  products = [],
  onProductSelect,
  isOnline = true,
  isMenuDrawerOpen,
  onOpenMenuDrawer,
  onCloseMenuDrawer,
  onSearchClick,
  onOpenLanguageSelector,
  onOpenPrivacy,
  onOpenGuarantee
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [internalCategoryDrawerOpen, setInternalCategoryDrawerOpen] = useState(false);

  const drawerOpen = isMenuDrawerOpen !== undefined ? isMenuDrawerOpen : internalCategoryDrawerOpen;
  const handleOpenDrawer = () => {
    if (onOpenMenuDrawer) onOpenMenuDrawer();
    else setInternalCategoryDrawerOpen(true);
  };
  const handleCloseDrawer = () => {
    if (onCloseMenuDrawer) onCloseMenuDrawer();
    else setInternalCategoryDrawerOpen(false);
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const langContainerRef = useRef<HTMLDivElement>(null);

  const activeLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const baseLang = resolveBaseLang(language);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (langContainerRef.current && !langContainerRef.current.contains(target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const searchSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !products.length) return [];
    return products
      .filter((p) => {
        const title = getProductTitle(p, language).toLowerCase();
        const origTitle = p.title.toLowerCase();
        const cat = p.category.toLowerCase();
        const catLocalized = getCategoryName(p.category, language).toLowerCase();
        const desc = p.description.toLowerCase();
        return (
          title.includes(q) ||
          origTitle.includes(q) ||
          cat.includes(q) ||
          catLocalized.includes(q) ||
          desc.includes(q)
        );
      })
      .slice(0, 5);
  }, [searchQuery, products, language]);

  const categories = React.useMemo(
    () => [
      { id: 'সব পণ্য', label: getCategoryName('সব পণ্য', language) },
      { id: 'পুরুষ ফ্যাশন', label: getCategoryName('পুরুষ ফ্যাশন', language) },
      { id: 'নারী ফ্যাশন', label: getCategoryName('নারী ফ্যাশন', language) },
      { id: 'বাচ্চাদের ফ্যাশন', label: getCategoryName('বাচ্চাদের ফ্যাশন', language) },
      { id: 'গ্যাজেট ও ইলেকট্রনিক্স', label: getCategoryName('গ্যাজেট ও ইলেকট্রনিক্স', language) },
      { id: 'ব্যাগ ও লাগেজ', label: getCategoryName('ব্যাগ ও লাগেজ', language) },
      { id: 'হোম ও কিচেন', label: getCategoryName('হোম ও কিচেন', language) },
      { id: 'স্পোর্টস ও ফিটনেস', label: getCategoryName('স্পোর্টস ও ফিটনেস', language) },
      { id: 'অর্গানিক ও খাদ্যদ্রব্য', label: getCategoryName('অর্গানিক ও খাদ্যদ্রব্য', language) },
      { id: 'গহনা ও এক্সেসরিজ', label: getCategoryName('গহনা ও এক্সেসরিজ', language) }
    ],
    [language]
  );

  const handleSuggestionClick = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      const catalogEl = document.getElementById('product-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* 1. Top Row */}
      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Brand Logo */}
        <div className="shrink-0 flex items-center gap-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelectCategory('সব পণ্য');
              if (onSearchChange) onSearchChange('');
            }}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            title="Market places"
          >
            <img
              src="/logo.png"
              alt="Market places"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0f1829] object-cover shadow-xs shrink-0 border border-slate-200/60 dark:border-slate-700"
            />
            <span className="text-lg sm:text-2xl font-black tracking-tighter text-[#fb7701] group-hover:opacity-90 uppercase">
              Market<span className="text-[#ff5000]">places</span>
            </span>
          </a>

          <div
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{t(isOnline ? 'online' : 'offline', language)}</span>
          </div>
        </div>

        {/* Search Input */}
        <div ref={searchContainerRef} className="flex-1 max-w-lg mx-1 relative">
          <div
            onClick={() => {
              setIsLangMenuOpen(false);
              setShowSuggestions(false);
              if (onSearchClick) {
                onSearchClick();
              }
            }}
            className="w-full flex items-center bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-full px-3.5 py-1.5 border-2 border-slate-300 dark:border-slate-700 focus-within:border-slate-950 dark:focus-within:border-white focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-xs cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 mr-2" />
            <input
              type="text"
              placeholder={t('searchPlaceholder', language)}
              value={searchQuery}
              onClick={(e) => {
                setIsLangMenuOpen(false);
                setShowSuggestions(false);
                if (onSearchClick) {
                  e.stopPropagation();
                  onSearchClick();
                }
              }}
              onFocus={() => {
                setIsLangMenuOpen(false);
                if (onSearchClick) {
                  onSearchClick();
                } else if (searchQuery.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-slate-600 dark:placeholder:text-slate-400 font-bold text-slate-950 dark:text-white cursor-pointer select-text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSearchChange) onSearchChange('');
                  setShowSuggestions(false);
                }}
                className="p-1 rounded-full text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                title={t('clearSearch', language)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showSuggestions && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>
                  {t('search', language)} ({toBengaliNumber(searchSuggestions.length, language)})
                </span>
              </div>

              {searchSuggestions.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {searchSuggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSuggestionClick(prod)}
                      className="p-2.5 flex items-center gap-3 hover:bg-orange-50/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <img
                        src={prod.image}
                        alt={getProductTitle(prod, language)}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {getProductTitle(prod, language)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-extrabold text-[#fb7701]">
                            {formatTaka(prod.price, language)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {getCategoryName(prod.category, language)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div
                    onClick={() => {
                      setShowSuggestions(false);
                      const catalogEl = document.getElementById('product-catalog-section');
                      if (catalogEl) {
                        catalogEl.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="p-2.5 text-center text-xs font-bold text-[#fb7701] hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {t('viewAllProducts', language)} →
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  {t('noProductsFound', language)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsLangMenuOpen(false);
              setShowSuggestions(false);
              handleOpenDrawer();
            }}
            className="flex items-center gap-1 px-2 py-1.5 text-slate-700 dark:text-slate-200 hover:text-[#fb7701] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('menu', language)}
          >
            <List className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline text-xs font-bold">{t('menu', language)}</span>
          </button>

          {/* Language Switcher */}
          {onLanguageChange && (
            <div ref={langContainerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  setIsLangMenuOpen(!isLangMenuOpen);
                }}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-orange-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#fb7701] text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95 shadow-2xs"
                title={t('langChange', language)}
              >
                <span className="text-xs leading-none">{activeLangObj.flag}</span>
                <span className="text-[11px] font-extrabold uppercase">
                  {baseLang.toUpperCase()}
                </span>
                <span className="text-[8px] opacity-60">▼</span>
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-750 flex items-center justify-between">
                    <span>{t('langChange', language)}</span>
                    <Globe className="w-3 h-3 text-[#fb7701]" />
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {LANGUAGES.slice(0, 10).map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          onLanguageChange(l.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-orange-50 dark:hover:bg-slate-750 transition-colors cursor-pointer ${
                          language === l.code
                            ? 'text-[#fb7701] font-black bg-orange-50/70 dark:bg-slate-750'
                            : 'text-slate-700 dark:text-slate-200 font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{l.flag}</span>
                          <span className="truncate">{l.nativeName}</span>
                        </span>
                        {language === l.code && <Check className="w-3.5 h-3.5 text-[#fb7701] shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {onOpenLanguageSelector && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLangMenuOpen(false);
                        onOpenLanguageSelector();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-[#fb7701] hover:bg-orange-50 dark:hover:bg-slate-750 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between cursor-pointer"
                    >
                      <span>{t('viewAllLanguages', language)}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Shopping Cart Icon */}
          <button
            type="button"
            onClick={onCartClick}
            className="p-2 text-slate-700 dark:text-slate-200 hover:text-[#fb7701] rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
            title={t('shoppingCart', language)}
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#fb7701] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {cartCount > 9 ? `${toBengaliNumber(9, language)}+` : toBengaliNumber(cartCount, language)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Horizontal Category Tabs */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 flex items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none whitespace-nowrap text-xs sm:text-sm font-bold">
          {categories.map((cat, index) => {
            const isSelected = index === 0 ? activeCategory === 'সব পণ্য' : activeCategory === cat.id;
            return (
              <button
                key={`${cat.id}-${index}`}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`py-2 relative transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-slate-950 dark:text-white font-extrabold text-xs sm:text-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:text-[#fb7701] dark:hover:text-[#fb7701] font-bold text-xs sm:text-sm'
                }`}
              >
                <span>{cat.label}</span>
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Double Guarantee Strip */}
      <div className="bg-[#fff6ee] dark:bg-slate-850 border-y border-[#fed7aa] dark:border-slate-800 text-slate-950 dark:text-slate-100 text-xs py-2 px-3 sm:px-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs font-bold overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#fb7701] shrink-0" />
            <div>
              <span className="font-extrabold text-slate-950 dark:text-white">{t('freeShipping', language)}</span>
              <span className="text-slate-700 dark:text-slate-300 ml-1.5 hidden sm:inline font-semibold">{t('specialForYou', language)}</span>
            </div>
          </div>

          <div className="w-px h-3.5 bg-slate-400 dark:bg-slate-600 shrink-0" />

          <button
            type="button"
            onClick={() => onOpenGuarantee?.('delivery')}
            className="flex items-center gap-2 text-left hover:opacity-80 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#fb7701] shrink-0" />
            <div>
              <span className="font-extrabold text-slate-950 dark:text-white">{t('deliveryGuarantee', language)}</span>
              <span className="text-slate-700 dark:text-slate-300 ml-1.5 hidden sm:inline font-semibold">{t('refundForIssue', language)}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Green Trust Bar */}
      <div className="bg-[#00965e] text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-5 font-semibold">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenGuarantee?.('refund')}
            className="flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-white text-[#00965e] flex items-center justify-center text-[10px] font-black">
              ✓
            </span>
            <span>{t('whyChoose', language)}</span>
          </button>
          <div className="flex items-center gap-3">
            {onDownloadClick && (
              <button
                type="button"
                onClick={onDownloadClick}
                className="hidden sm:flex items-center gap-1 text-emerald-100 hover:text-white underline font-bold cursor-pointer text-[11px]"
              >
                <Download className="w-3 h-3" />
                <span>{t('downloadApp', language)}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (onOpenPrivacy) onOpenPrivacy();
                else onSelectCategory('সব পণ্য');
              }}
              className="flex items-center gap-0.5 text-emerald-100 hover:text-white transition-colors cursor-pointer"
            >
              <span>{t('securePrivacy', language)}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Sliding Navigation Menu Drawer */}
      <MenuDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        currentUser={currentUser}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
        onAdminPanelClick={onAdminPanelClick}
        onAgentPortalClick={onAgentPortalClick}
        onMyOrdersClick={onMyOrdersClick}
        onCartClick={onCartClick}
        onDownloadClick={onDownloadClick}
        onUserProfileClick={onUserProfileClick}
        cartCount={cartCount}
        orderCount={orderCount}
        onSelectCategory={onSelectCategory}
        activeCategory={activeCategory}
        theme={theme}
        onThemeToggle={onThemeToggle}
        language={language}
        onLanguageChange={onLanguageChange}
        onOpenLanguageSelector={onOpenLanguageSelector}
        isOnline={isOnline}
      />
    </header>
  );
};
