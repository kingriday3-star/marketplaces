import React from 'react';
import { User } from '../types';
import {
  X,
  ArrowLeft,
  ShoppingBag,
  Zap,
  ShoppingCart,
  Store,
  ShieldCheck,
  Share2,
  Sun,
  Moon,
  Globe,
  LogOut,
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';
import {
  SupportedLanguage,
  LANGUAGES,
  t,
  getCategoryName,
  isRtlLanguage
} from '../utils/i18n';
import { isAuthorizedAdminEmail } from '../utils/auth';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
  onOpenLanguageSelector?: () => void;
  isOnline?: boolean;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
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
  onOpenLanguageSelector,
  isOnline = true
}) => {
  if (!isOpen) return null;

  const isAdmin = currentUser ? isAuthorizedAdminEmail(currentUser.identifier) : false;
  const isAgent = currentUser?.role === 'agent' || currentUser?.isApprovedAgent;
  const isRtl = isRtlLanguage(language);
  const activeLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const categories = [
    { id: 'সব পণ্য', icon: '🛍️', badgeKey: 'catBadgePopular' },
    { id: 'পুরুষ ফ্যাশন', icon: '👔', badgeKey: 'catBadgeHot' },
    { id: 'নারী ফ্যাশন', icon: '👗', badgeKey: 'catBadgeNew' },
    { id: 'বাচ্চাদের ফ্যাশন', icon: '🧸', badgeKey: 'catBadgeCute' },
    { id: 'গ্যাজেট ও ইলেকট্রনিক্স', icon: '⌚', badgeKey: 'catBadgeOffer' },
    { id: 'ব্যাগ ও লাগেজ', icon: '🎒', badgeKey: 'catBadgeBest' },
    { id: 'হোম ও কিচেন', icon: '🏠', badgeKey: '' },
    { id: 'স্পোর্টস ও ফিটনেস', icon: '👟', badgeKey: '' },
    { id: 'অর্গানিক ও খাদ্যদ্রব্য', icon: '🍯', badgeKey: 'catBadgePure' },
    { id: 'গহনা ও এক্সেসরিজ', icon: '💍', badgeKey: 'catBadgeTrendy' }
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex ${isRtl ? 'justify-end' : 'justify-start'} bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200`}
    >
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sliding Drawer Container */}
      <div
        className={`relative w-80 sm:w-96 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 ${
          isRtl
            ? 'border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right'
            : 'border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left'
        } duration-250`}
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
              title={t('back', language)}
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            <img
              src="/logo.png"
              alt="Market places"
              className="w-7 h-7 rounded-lg bg-[#0f1829] object-cover border border-white/15 shrink-0 ml-0.5"
            />
            <span className="text-base font-black tracking-tight text-[#fb7701]">
              Market<span className="text-[#ff5000]">places</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t('close', language)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Profile Card */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-850 dark:to-slate-800 border-b border-orange-100 dark:border-slate-800 shrink-0">
          {currentUser ? (
            <div className="flex items-center justify-between gap-3">
              <div
                onClick={() => {
                  if (onUserProfileClick) {
                    onClose();
                    onUserProfileClick();
                  }
                }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
                title={t('profile', language)}
              >
                <div className="w-10 h-10 rounded-full bg-[#fb7701] text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-base">
                  {currentUser.avatar || (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] text-slate-400">›</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {isAdmin ? t('superAdmin', language) : currentUser.identifier}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                      isAdmin
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : isAgent
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isAdmin
                      ? `🛡️ ${t('superAdmin', language)}`
                      : isAgent
                      ? `🏪 ${t('sellerAgent', language)}`
                      : `👤 ${t('customerProfile', language)}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogoutClick();
                  onClose();
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                title={t('logout', language)}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {t('welcomeTitle', language)}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {t('welcomeSubtitle', language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                className="px-3 py-1.5 bg-[#fb7701] hover:bg-[#ff5000] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {t('login', language)}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          
          {/* Section 1: Categories */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
              {t('menuCategoriesSection', language)}
            </div>
            <div className="space-y-1">
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#fb7701]/10 text-[#fb7701] font-bold border border-[#fb7701]/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <span className="truncate">{getCategoryName(cat.id, language)}</span>
                    </div>
                    {cat.badgeKey && (
                      <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {t(cat.badgeKey, language)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Quick Features */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
              {t('menuShoppingSection', language)}
            </div>
            <div className="space-y-1">
              
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('সব পণ্য');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="truncate">⚡ {t('lightningDealsMenu', language)}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onCartClick();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShoppingCart className="w-4 h-4 text-[#fb7701] shrink-0" />
                  <span className="truncate">{t('shoppingCart', language)}</span>
                </div>
                {cartCount > 0 && (
                  <span className="text-xs bg-[#fb7701] text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                    {toBengaliNumber(cartCount, language)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onMyOrdersClick();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{t('myOrdersTracking', language)}</span>
                </div>
                {orderCount > 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full shrink-0">
                    {toBengaliNumber(orderCount, language)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onAgentPortalClick();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Store className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{t('sellerAgentSell', language)}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Super Admin Panel - Strictly visible ONLY to authorized admin */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onAdminPanelClick();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{t('adminDashboard', language)}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded shrink-0">
                    {t('superAdmin', language)}
                  </span>
                </button>
              )}

              {onDownloadClick && (
                <button
                  type="button"
                  onClick={() => {
                    onDownloadClick();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#fb7701] bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 transition-colors cursor-pointer border border-orange-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Share2 className="w-4 h-4 text-[#fb7701] shrink-0" />
                    <span className="truncate">{t('downloadAndShare', language)}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              )}

            </div>
          </div>

          {/* Section 3: Preferences & Themes */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
              {t('menuSettingsSection', language)}
            </div>
            <div className="space-y-1.5">
              
              {onThemeToggle && (
                <button
                  type="button"
                  onClick={onThemeToggle}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    <span>{theme === 'dark' ? t('lightMode', language) : t('darkMode', language)}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {theme === 'dark' ? t('darkLabel', language) : t('lightLabel', language)}
                  </span>
                </button>
              )}

              {onLanguageChange && (
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      <span>{t('selectLanguageLabel', language)}</span>
                    </div>
                    <span className="text-[11px] text-[#fb7701] font-bold">
                      {activeLangObj.flag} {activeLangObj.nativeName}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {LANGUAGES.slice(0, 6).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => onLanguageChange(lang.code)}
                        className={`py-1 px-1.5 rounded text-[10px] font-medium text-center transition-all cursor-pointer truncate ${
                          language === lang.code
                            ? 'bg-[#fb7701] text-white font-bold shadow-2xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {lang.nativeName}
                      </button>
                    ))}
                  </div>
                  {onOpenLanguageSelector && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLanguageSelector();
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-[#fb7701] hover:bg-orange-50 dark:hover:bg-slate-600 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span>{t('viewAllLanguages', language)}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Footer with Online Status */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 shrink-0 text-center">
          <div
            className={`flex items-center justify-center gap-2 text-xs font-semibold mb-1 ${
              isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{t(isOnline ? 'onlineSyncMode' : 'internetOffline', language)}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Market places v2.5.0 • WebAPK & Play TWA Ready
          </p>
        </div>

      </div>
    </div>
  );
};
