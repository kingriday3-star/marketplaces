import React from 'react';
import { Home, LayoutGrid, ShoppingCart, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { SupportedLanguage, resolveBaseLang, t } from '../utils/i18n';

interface AppBottomNavProps {
  currentUser: User | null;
  orderCount: number;
  cartCount?: number;
  activeTab: 'home' | 'categories' | 'you' | 'cart';
  onTabChange: (tab: 'home' | 'categories' | 'you' | 'cart') => void;
  inDeviceFrame?: boolean;
  language?: SupportedLanguage;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  cartCount = 0,
  activeTab,
  onTabChange,
  inDeviceFrame = false,
  language = 'bn'
}) => {
  const baseLang = resolveBaseLang(language);

  const getTabLabel = (id: 'home' | 'categories' | 'you' | 'cart') => {
    if (id === 'home') return t('navHome', language);
    if (id === 'categories') {
      if (baseLang === 'bn') return 'ক্যাটাগরি';
      if (baseLang === 'ar') return 'الفئات';
      if (baseLang === 'hi') return 'श्रेणियाँ';
      if (baseLang === 'ur') return 'اقسام';
      if (baseLang === 'es') return 'Categorías';
      if (baseLang === 'fr') return 'Catégories';
      if (baseLang === 'zh') return '分类';
      if (baseLang === 'de') return 'Kategorien';
      return 'Categories';
    }
    if (id === 'you') return t('profile', language);
    return t('cart', language);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-all ${
        inDeviceFrame ? 'rounded-b-[38px] pb-5' : 'pb-1.5'
      }`}
    >
      <div className="max-w-md mx-auto px-2 pt-1.5 flex items-center justify-around">
        {/* 1. Home Tab */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-95 ${
            activeTab === 'home'
              ? 'text-[#fb7701]'
              : 'text-slate-800 dark:text-slate-200 hover:text-slate-950'
          }`}
        >
          <div className="relative">
            <Home
              className={`w-6 h-6 transition-transform ${
                activeTab === 'home'
                  ? 'fill-[#fb7701] text-[#fb7701] scale-105'
                  : 'text-slate-800 dark:text-slate-200 stroke-[2.2]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] mt-0.5 font-bold ${
              activeTab === 'home' ? 'font-black text-[#fb7701]' : ''
            }`}
          >
            {getTabLabel('home')}
          </span>
        </button>

        {/* 2. Categories Tab */}
        <button
          onClick={() => onTabChange('categories')}
          className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-95 ${
            activeTab === 'categories'
              ? 'text-[#fb7701]'
              : 'text-slate-800 dark:text-slate-200 hover:text-slate-950'
          }`}
        >
          <div className="relative">
            <LayoutGrid
              className={`w-6 h-6 transition-transform ${
                activeTab === 'categories'
                  ? 'text-[#fb7701] stroke-[2.5] scale-105'
                  : 'text-slate-800 dark:text-slate-200 stroke-[2.2]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] mt-0.5 font-bold ${
              activeTab === 'categories' ? 'font-black text-[#fb7701]' : ''
            }`}
          >
            {getTabLabel('categories')}
          </span>
        </button>

        {/* 3. You / Profile Tab */}
        <button
          onClick={() => onTabChange('you')}
          className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-95 ${
            activeTab === 'you'
              ? 'text-[#fb7701]'
              : 'text-slate-800 dark:text-slate-200 hover:text-slate-950'
          }`}
        >
          <div className="relative">
            <UserIcon
              className={`w-6 h-6 transition-transform ${
                activeTab === 'you'
                  ? 'fill-[#fb7701] text-[#fb7701] scale-105'
                  : 'text-slate-800 dark:text-slate-200 stroke-[2.2]'
              }`}
            />
            <span className="absolute -top-1 -right-3.5 bg-[#fb7701] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              {toBengaliNumber(99, language)}+
            </span>
          </div>
          <span
            className={`text-[11px] mt-0.5 font-bold ${
              activeTab === 'you' ? 'font-black text-[#fb7701]' : ''
            }`}
          >
            {getTabLabel('you')}
          </span>
        </button>

        {/* 4. Cart Tab */}
        <button
          onClick={() => onTabChange('cart')}
          className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-95 ${
            activeTab === 'cart'
              ? 'text-[#fb7701]'
              : 'text-slate-800 dark:text-slate-200 hover:text-slate-950'
          }`}
        >
          <div className="relative">
            <ShoppingCart
              className={`w-6 h-6 transition-transform ${
                activeTab === 'cart'
                  ? 'text-[#fb7701] stroke-[2.5] scale-105'
                  : 'text-slate-800 dark:text-slate-200 stroke-[2.2]'
              }`}
            />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                {toBengaliNumber(cartCount, language)}
              </span>
            )}
            <span className="absolute -top-3.5 -right-6 bg-emerald-600 text-white text-[8px] font-black px-1 py-0.2 rounded-full whitespace-nowrap shadow-xs scale-90">
              {t('freeShipping', language)}
            </span>
          </div>
          <span
            className={`text-[11px] mt-0.5 font-bold ${
              activeTab === 'cart' ? 'font-black text-[#fb7701]' : ''
            }`}
          >
            {getTabLabel('cart')}
          </span>
        </button>
      </div>

      {inDeviceFrame && (
        <div className="w-full flex justify-center pt-2">
          <div className="w-32 h-1 bg-slate-800 rounded-full opacity-60" />
        </div>
      )}
    </nav>
  );
};
