import React, { useState } from 'react';
import { User, Order, Product } from '../types';
import {
  Headphones,
  Settings,
  ClipboardList,
  MessageSquare,
  Star,
  Clock,
  Heart,
  MapPin,
  Users,
  ChevronRight,
  Check,
  ShieldCheck,
  Download,
  Smartphone
} from 'lucide-react';
import { ProductGridCard } from './ProductGridCard';
import { SupportedLanguage, LANGUAGES, t, resolveBaseLang } from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TemuYouViewProps {
  currentUser: User | null;
  orders: Order[];
  products: Product[];
  onOpenOrders: () => void;
  onOpenSettings: () => void;
  onOpenMessages?: () => void;
  onOpenProductDetail: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenReviews: (product: Product) => void;
  onOpenLogin: () => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  onOpenDownload?: () => void;
  onOpenWallet?: () => void;
  onOpenSupportCenter?: () => void;
  onClaimFreeGift?: () => Promise<boolean>;
  walletBalance?: number;
  freeGiftClaimed?: boolean;
  language?: SupportedLanguage;
}

export const TemuYouView: React.FC<TemuYouViewProps> = ({
  currentUser,
  orders,
  products,
  onOpenOrders,
  onOpenSettings,
  onOpenMessages,
  onOpenProductDetail,
  onQuickOrder,
  onAddToCart,
  onOpenReviews,
  onOpenLogin,
  isAdmin = false,
  onOpenAdminPanel,
  onOpenDownload,
  onOpenWallet,
  onOpenSupportCenter,
  onClaimFreeGift,
  walletBalance = 0,
  freeGiftClaimed = false,
  language = 'bn'
}) => {
  const { isInstalled, isIframe, standaloneUrl, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [installSuccessToast, setInstallSuccessToast] = useState(false);
  const [showGiftAlert, setShowGiftAlert] = useState(false);
  const [claimingGift, setClaimingGift] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const baseLang = resolveBaseLang(language);
  const activeLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDirectInstall = async () => {
    setInstalling(true);
    try {
      if (isIframe) {
        window.open(`${standaloneUrl}?direct_install=true`, '_blank');
        setInstalling(false);
        return;
      }

      const success = await install();
      if (success) {
        setInstallSuccessToast(true);
        setTimeout(() => setInstallSuccessToast(false), 5000);
      } else {
        if (onOpenDownload) {
          onOpenDownload();
        }
      }
    } catch {
      if (onOpenDownload) onOpenDownload();
    } finally {
      setInstalling(false);
    }
  };

  const displayName = currentUser?.name || t('guestAccountTitle', language);
  const initialLetter = displayName.charAt(0).toUpperCase() || 'G';

  const myOrderCount = orders.filter((o) => {
    if (!currentUser) return false;
    return (
      o.customerId === currentUser.id ||
      o.customerPhone === currentUser.identifier ||
      o.customerName === currentUser.name
    );
  }).length;

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-slate-950 pb-24 text-slate-900 dark:text-slate-100">
      
      {/* 1. Header Profile Info */}
      <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white truncate">
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {!currentUser ? (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="text-xs text-[#fb7701] font-bold hover:underline cursor-pointer"
                  >
                    {t('signInOrRegister', language)}
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {isAdmin ? `🛡️ ${t('superAdmin', language)}` : currentUser.identifier}
                  </span>
                )}
                {isAdmin && onOpenAdminPanel && (
                  <button
                    type="button"
                    onClick={onOpenAdminPanel}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('adminPanel', language)}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenDownload) onOpenDownload();
                  else handleDirectInstall();
                }}
                disabled={installing}
                className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:brightness-110 active:scale-95 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-md transition-all cursor-pointer"
                title={t('downloadApp', language)}
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{baseLang === 'bn' ? 'ইনস্টল' : baseLang === 'ar' ? 'تثبيت' : 'Install'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onOpenSupportCenter) {
                  onOpenSupportCenter();
                } else {
                  showToast(
                    baseLang === 'bn'
                      ? 'কাস্টমার সাপোর্ট হেল্পলাইন ২৪/৭ চালু আছে।'
                      : baseLang === 'ar'
                        ? 'خدمة العملاء متاحة على مدار الساعة'
                        : '24/7 Customer Support is active.'
                  );
                }
              }}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={t('helpline', language)}
            >
              <Headphones className="w-5 h-5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Super Admin Master Control Card - Strictly Admin Only */}
        {isAdmin && onOpenAdminPanel && (
          <div
            onClick={onOpenAdminPanel}
            className="mt-3 p-3.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-2xl shadow-md border border-emerald-400/40 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-wide">
                    🛡️ {t('adminDashboard', language)}
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-400 text-emerald-950 font-black text-[10px] rounded uppercase shadow-xs">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 mt-0.5 leading-snug">
                  {baseLang === 'bn'
                    ? 'সকল পণ্য এড/এডিট/ডিলিট, রিয়েলটাইম অর্ডার প্রসেসিং ও এক্সপোর্ট করুন'
                    : 'Manage products, instant live orders & CSV export'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-200 shrink-0" />
          </div>
        )}

        {/* Balance & Coupons Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 text-center divide-x divide-slate-200 dark:divide-slate-800">
          <button
            type="button"
            onClick={() => onOpenWallet?.()}
            className="hover:bg-slate-50 dark:hover:bg-slate-800/60 py-1 rounded-l-xl transition-colors cursor-pointer"
          >
            <div className="text-sm font-black text-[#fb7701]">
              {activeLangObj.currency} {toBengaliNumber(walletBalance.toFixed(2), language)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {baseLang === 'bn' ? 'ক্রেডিট ব্যালেন্স' : baseLang === 'ar' ? 'رصيد الائتمان' : 'Credit balance'}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onOpenMessages?.()}
            className="hover:bg-slate-50 dark:hover:bg-slate-800/60 py-1 rounded-r-xl transition-colors cursor-pointer"
          >
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {toBengaliNumber(5, language)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {baseLang === 'bn' ? 'কুপন ও অফার' : baseLang === 'ar' ? 'القسائم والعروض' : 'Coupons & offers'}
            </div>
          </button>
        </div>

        {/* Free Gift Promo Banner */}
        <div className="mt-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">🎁</span>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase truncate">
                {baseLang === 'bn' ? 'আজকের ফ্রি উপহার গ্রহণ করুন!' : baseLang === 'ar' ? 'احصل على هديتك المجانية!' : "GRAB YOUR TODAY'S FREE GIFT!"}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {baseLang === 'bn'
                  ? `৳৫০ ওয়ালেট ক্রেডিট বোনাস যোগ করুন`
                  : 'Claim free bonus credit into your wallet'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={claimingGift || freeGiftClaimed}
            onClick={async () => {
              if (onClaimFreeGift) {
                setClaimingGift(true);
                const ok = await onClaimFreeGift();
                setClaimingGift(false);
                if (ok) {
                  setShowGiftAlert(true);
                } else {
                  showToast(
                    baseLang === 'bn'
                      ? 'এই ফ্রি উপহার বোনাসটি ইতিমধ্যে সংগ্রহ করা হয়েছে।'
                      : 'Free gift credit bonus already claimed.'
                  );
                }
              } else {
                setShowGiftAlert(true);
              }
            }}
            className={`px-4 py-1.5 text-white text-xs font-black rounded-full cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              freeGiftClaimed
                ? 'bg-emerald-600 cursor-default'
                : 'bg-[#fb7701] hover:bg-[#ff5000]'
            }`}
          >
            {freeGiftClaimed
              ? baseLang === 'bn'
                ? 'সংগৃহীত ✓'
                : 'Claimed ✓'
              : claimingGift
              ? '...'
              : baseLang === 'bn'
              ? 'সংগ্রহ'
              : baseLang === 'ar'
              ? 'احصل'
              : 'Get'}
          </button>
        </div>

        {/* Direct Mobile App Install Card */}
        {!isInstalled && (
          <div className="mt-3 bg-gradient-to-r from-[#fb7701] via-orange-500 to-amber-500 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between gap-2.5 border border-orange-300/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate">
                    📲 {t('downloadApp', language)}
                  </h4>
                  <span className="px-1.5 py-0.5 bg-white text-[#fb7701] font-black text-[9px] rounded-full uppercase shadow-2xs shrink-0">
                    WebAPK
                  </span>
                </div>
                <p className="text-[10px] text-orange-100 truncate mt-0.5">
                  {baseLang === 'bn' ? 'হোম স্ক্রিনে রাখুন ও ১-ট্যাপে শপিং করুন' : 'Add directly to home screen for fast app experience'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenDownload) onOpenDownload();
                else handleDirectInstall();
              }}
              disabled={installing}
              className="px-3.5 py-2 bg-white hover:bg-orange-50 text-[#fb7701] font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{baseLang === 'bn' ? 'ইনস্টল করুন' : baseLang === 'ar' ? 'تثبيت' : 'Install'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Shortcuts */}
      <div className="mt-2.5 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100">
        <button
          type="button"
          onClick={onOpenOrders}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[2.2]" />
            <span className="text-sm font-extrabold">{t('myOrders', language)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            {myOrderCount > 0 && (
              <span className="bg-[#fb7701] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {toBengaliNumber(myOrderCount, language)}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenMessages}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[2.2]" />
            <span className="text-sm font-extrabold">
              {baseLang === 'bn' ? 'মেসেজ ও আপডেট' : baseLang === 'ar' ? 'الرسائل والإشعارات' : 'Messages'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-[#fb7701] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {toBengaliNumber(99, language)}+
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenOrders}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[2.2]" />
            <span className="text-sm font-extrabold">{t('reviews', language)}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {isAdmin && onOpenAdminPanel && (
          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer border-l-4 border-emerald-600"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
              <div className="text-left">
                <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  {t('adminDashboard', language)}
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  {baseLang === 'bn' ? 'সকল পণ্য এডিট, লাইভ ট্র্যাকিং ও এজেন্ট অনুমোদন' : 'Full system control'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>
        )}

        {!isInstalled && (
          <button
            type="button"
            onClick={() => {
              if (onOpenDownload) onOpenDownload();
              else handleDirectInstall();
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-orange-50/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-[#fb7701]">
                <Download className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{t('downloadApp', language)}</span>
                  <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                    WebAPK
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {baseLang === 'bn' ? '১-ক্লিকে ফোনে সরাসরি ইনস্টল ও ফাস্ট ব্রাউজিং' : '1-tap mobile install & full-screen app mode'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#fb7701] text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
                {baseLang === 'bn' ? 'ইনস্টল' : 'Install'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>
        )}
      </div>

      {/* 3. Horizontal Icon Strip */}
      <div className="bg-white dark:bg-slate-900 mt-2.5 py-4 px-2 border-y border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-4 text-center">
          <button
            type="button"
            onClick={onOpenOrders}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <Clock className="w-6 h-6 text-slate-800 dark:text-slate-200 stroke-[2]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {baseLang === 'bn' ? 'হিস্ট্রি' : baseLang === 'ar' ? 'السجل' : 'History'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => showToast(baseLang === 'bn' ? 'উইশলিস্টে সেভ হয়েছে!' : 'Added to wishlist!')}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform relative"
          >
            <Heart className="w-6 h-6 text-slate-800 dark:text-slate-200 stroke-[2]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {baseLang === 'bn' ? 'উইশলিস্ট' : baseLang === 'ar' ? 'المفضلة' : 'Wishlist'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <MapPin className="w-6 h-6 text-slate-800 dark:text-slate-200 stroke-[2]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {baseLang === 'bn' ? 'ঠিকানা' : baseLang === 'ar' ? 'العناوين' : 'Addresses'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              showToast(
                baseLang === 'bn'
                  ? 'Market places অফিসিয়াল স্টোর ফলো করা হয়েছে!'
                  : 'Following Market places Official Store!'
              )
            }
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <Users className="w-6 h-6 text-slate-800 dark:text-slate-200 stroke-[2]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {baseLang === 'bn' ? 'ফলোয়িং' : baseLang === 'ar' ? 'المتابعة' : 'Following'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Promotional Banners Slider */}
      <div className="mt-2.5 px-3 overflow-x-auto scrollbar-none flex items-center gap-2.5 pb-1">
        <div className="w-64 shrink-0 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-3 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
              {t('badgeHotDeals', language)}
            </span>
            <h4 className="text-xs font-black mt-1">{t('badgeBestSellingDeals', language)}</h4>
            <span className="text-[10px] text-white/90">{t('badgeClickToGet', language)}</span>
          </div>
          <span className="text-3xl">🔥</span>
        </div>

        <div className="w-64 shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-3 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
              {t('badgeOffers', language)}
            </span>
            <h4 className="text-xs font-black mt-1">{t('badgeAmazingOffers', language)}</h4>
            <span className="text-[10px] text-white/90">{t('badgeShopNow', language)}</span>
          </div>
          <span className="text-3xl">🛍️</span>
        </div>

        <div className="w-56 shrink-0 bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl p-3 text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
              {t('badgeTrending', language)}
            </span>
            <h4 className="text-xs font-black mt-1">{t('badgePopularItems', language)}</h4>
            <span className="text-[10px] text-white/90">{t('badgeExplore', language)}</span>
          </div>
          <span className="text-3xl">⭐</span>
        </div>
      </div>

      {/* 5. Trust Guarantee Bar */}
      <div className="mt-2 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
        <span className="flex items-center gap-1.5">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{t('freeDelivery', language)}</span>
        </span>
        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          <span>{t('refundForIssue', language)}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </span>
      </div>

      {/* 6. Recommended Products */}
      <div className="p-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
          {baseLang === 'bn' ? 'আপনার জন্য প্রস্তাবিত পণ্য' : baseLang === 'ar' ? 'منتجات مقترحة لك' : 'Recommended For You'}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {products.slice(0, 6).map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              language={language}
              onProductClick={onOpenProductDetail}
              onOrderClick={onQuickOrder}
              onAddToCart={onAddToCart}
              onEditClick={() => {}}
              onDeleteClick={() => {}}
              onReviewClick={onOpenReviews}
              isAdmin={false}
            />
          ))}
        </div>
      </div>

      {/* Gift Alert Popup */}
      {showGiftAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-amber-300 animate-in zoom-in-95">
            <span className="text-5xl block animate-bounce">🎁</span>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {baseLang === 'bn' ? 'উপহার ভাউচার অ্যাক্টিভ করা হয়েছে!' : 'Free Gift Voucher Claimed!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {baseLang === 'bn'
                ? 'পরবর্তী যেকোনো পণ্য অর্ডারে আপনার স্পেশাল ফ্রি গিফট যুক্ত হয়ে যাবে।'
                : 'Your free bonus gift will be automatically included with your next order!'}
            </p>
            <button
              type="button"
              onClick={() => setShowGiftAlert(false)}
              className="w-full py-2.5 bg-[#fb7701] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {(installSuccessToast || toastMsg) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <Check className="w-4 h-4 text-white stroke-[3]" />
          <span>{toastMsg || (baseLang === 'bn' ? 'অ্যাপ সফলভাবে ইনস্টল হয়েছে!' : 'App installed successfully!')}</span>
        </div>
      )}
    </div>
  );
};
