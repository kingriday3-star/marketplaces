import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { DISTRICTS } from '../data/initialProducts';
import { updateUserProfile, isAuthorizedAdminEmail } from '../utils/auth';
import {
  SupportedLanguage,
  LANGUAGES,
  t,
  resolveBaseLang,
  getDistrictLabel
} from '../utils/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ProductGridCard } from './ProductGridCard';
import {
  X,
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
  ArrowLeft,
  ShieldCheck,
  Download,
  Edit2,
  Search,
  CheckCircle2,
  LogIn,
  LogOut
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  orders: Order[];
  products?: Product[];
  onOpenOrders: () => void;
  onOpenSearch?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAgentPortal?: () => void;
  onOpenDownload?: () => void;
  onOpenMessages?: () => void;
  onOpenSettings?: () => void;
  onOpenProductDetail?: (product: Product) => void;
  onQuickOrder?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onOpenReviews?: (product: Product) => void;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  onUserUpdated?: (updated: User) => void;
  language?: SupportedLanguage;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  orders,
  products = [],
  onOpenOrders,
  onOpenSearch,
  onOpenAdminPanel,
  onOpenDownload,
  onOpenMessages,
  onOpenSettings,
  onOpenProductDetail,
  onQuickOrder,
  onAddToCart,
  onOpenReviews,
  onLogout,
  onOpenLogin,
  onUserUpdated,
  language = 'bn'
}) => {
  const { isInstalled, isIframe, standaloneUrl, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [installSuccessToast, setInstallSuccessToast] = useState(false);
  const [showGiftAlert, setShowGiftAlert] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [name, setName] = useState(currentUser?.name || '');
  const [identifier, setIdentifier] = useState(currentUser?.identifier || '');
  const [alternatePhone, setAlternatePhone] = useState(currentUser?.alternatePhone || '');
  const [district, setDistrict] = useState(currentUser?.district || DISTRICTS[0]);
  const [address, setAddress] = useState(currentUser?.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setName(currentUser?.name || '');
    setIdentifier(currentUser?.identifier || '');
    setAlternatePhone(currentUser?.alternatePhone || '');
    setDistrict(currentUser?.district || DISTRICTS[0]);
    setAddress(currentUser?.address || '');
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const baseLang = resolveBaseLang(language);
  const activeLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isAdmin = currentUser ? isAuthorizedAdminEmail(currentUser.identifier) : false;

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
        if (onOpenDownload) onOpenDownload();
      }
    } catch {
      if (onOpenDownload) onOpenDownload();
    } finally {
      setInstalling(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = updateUserProfile({
      name: name.trim(),
      address: address.trim(),
      district,
      alternatePhone: alternatePhone.trim()
    });

    if (updated && onUserUpdated) {
      onUserUpdated(updated);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditingProfile(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f7f7] dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans animate-in slide-in-from-right duration-200">
      
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-13 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title={t('back', language)}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-black text-slate-950 dark:text-white">
            {t('profile', language)}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={t('search', language)}
            >
              <Search className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          {!isInstalled && (
            <button
              type="button"
              onClick={handleDirectInstall}
              disabled={installing}
              className="px-2.5 py-1 bg-gradient-to-r from-[#fb7701] to-[#ff5000] text-white text-[11px] font-black rounded-full flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{baseLang === 'bn' ? 'ইনস্টল' : baseLang === 'ar' ? 'تثبيت' : 'Install'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            title={t('close', language)}
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-none">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-rose-400/40 shrink-0">
                {initialLetter}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-950 dark:text-white truncate">
                    {displayName}
                  </h2>
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                      title={baseLang === 'bn' ? 'প্রোফাইল এডিট' : 'Edit Profile'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {currentUser ? (
                    <>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-none">
                        {isAdmin ? t('superAdmin', language) : currentUser.identifier}
                      </span>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{t('superAdmin', language)}</span>
                        </span>
                      )}
                    </>
                  ) : (
                    onOpenLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLogin();
                        }}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-[#fb7701] hover:underline cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t('signInOrRegister', language)}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Support & Settings */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  showToast(
                    baseLang === 'bn'
                      ? 'কাস্টমার সাপোর্ট হেল্পলাইন ২৪/৭ চালু আছে।'
                      : baseLang === 'ar'
                        ? 'خدمة العملاء متاحة على مدار الساعة 24/7'
                        : '24/7 Customer Support is active.'
                  )
                }
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title={t('helpline', language)}
              >
                <Headphones className="w-5 h-5 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenSettings) onOpenSettings();
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Balance & Coupons Strip */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 text-center divide-x divide-slate-200 dark:divide-slate-800">
            <div>
              <div className="text-base font-black text-slate-950 dark:text-white">
                {activeLangObj.currency} {toBengaliNumber('0.00', language)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {baseLang === 'bn' ? 'ক্রেডিট ব্যালেন্স' : baseLang === 'ar' ? 'رصيد الائتمان' : 'Credit balance'}
              </div>
            </div>
            <div>
              <div className="text-base font-black text-slate-950 dark:text-white">
                {toBengaliNumber(5, language)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {baseLang === 'bn' ? 'কুপন ও অফার' : baseLang === 'ar' ? 'القسائم والعروض' : 'Coupons & offers'}
              </div>
            </div>
          </div>

          {/* Grab Free Gift Banner */}
          <div className="mt-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">🎁</span>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase truncate">
                  {baseLang === 'bn' ? 'আজকের ফ্রি উপহার গ্রহণ করুন!' : baseLang === 'ar' ? 'احصل على هديتك المجانية اليوم!' : "GRAB YOUR TODAY'S FREE GIFT!"}
                </h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                  {baseLang === 'bn' ? 'যোগ্য অর্ডারের সাথে নিশ্চিত বোনাস উপহার' : 'With qualifying order(s)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGiftAlert(true)}
              className="px-4 py-1.5 bg-[#fb7701] hover:bg-[#ff5000] text-white text-xs font-black rounded-full cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              {baseLang === 'bn' ? 'সংগ্রহ' : baseLang === 'ar' ? 'احصل عليها' : 'Get'}
            </button>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="mt-2.5 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenOrders();
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2.2]" />
              <span className="text-sm font-extrabold">{t('myOrders', language)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {myOrderCount > 0 && (
                <span className="bg-[#fb7701] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {toBengaliNumber(myOrderCount, language)}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenMessages) onOpenMessages();
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2.2]" />
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
            onClick={() => {
              onClose();
              onOpenOrders();
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2.2]" />
              <span className="text-sm font-extrabold">{t('reviews', language)}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Direct Install App Row */}
          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                if (onOpenDownload) {
                  onClose();
                  onOpenDownload();
                } else {
                  handleDirectInstall();
                }
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-orange-50/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-[#fb7701] shrink-0">
                  <Download className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-sm font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{t('downloadApp', language)}</span>
                    <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                      WebAPK
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {baseLang === 'bn' ? '১-ক্লিকে ফোনে সরাসরি অ্যাপ ইনস্টল করুন' : 'Install native app directly to phone'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="bg-[#fb7701] text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg">
                  {baseLang === 'bn' ? 'ইনস্টল' : 'Install'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          )}

          {/* Super Admin Dashboard - Strictly Admin Only */}
          {isAdmin && onOpenAdminPanel && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminPanel();
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer border-l-4 border-emerald-600"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                <div className="text-left">
                  <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    {t('adminDashboard', language)}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {baseLang === 'bn' ? 'লাইভ অর্ডার, পণ্য ও এজেন্ট কন্ট্রোল' : 'Full system control'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          {currentUser && onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 stroke-[2.2]" />
                <span className="text-sm font-extrabold">{t('logout', language)}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 4-Column Action Strip */}
        <div className="bg-white dark:bg-slate-900 mt-2.5 py-4 px-2 border-y border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-4 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrders();
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <Clock className="w-6 h-6 text-slate-700 dark:text-slate-200 stroke-[2]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {baseLang === 'bn' ? 'হিস্ট্রি' : baseLang === 'ar' ? 'السجل' : 'History'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                showToast(baseLang === 'bn' ? 'পছন্দের পণ্য উইশলিস্টে সেভ হয়েছে!' : 'Added to your wishlist!')
              }
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <Heart className="w-6 h-6 text-slate-700 dark:text-slate-200 stroke-[2]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {baseLang === 'bn' ? 'উইশলিস্ট' : baseLang === 'ar' ? 'المفضلة' : 'Wishlist'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUser) setIsEditingProfile(true);
                else if (onOpenLogin) {
                  onClose();
                  onOpenLogin();
                }
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <MapPin className="w-6 h-6 text-slate-700 dark:text-slate-200 stroke-[2]" />
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
              <Users className="w-6 h-6 text-slate-700 dark:text-slate-200 stroke-[2]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {baseLang === 'bn' ? 'ফলোয়িং' : baseLang === 'ar' ? 'المتابعة' : 'Following'}
              </span>
            </button>
          </div>
        </div>

        {/* Promotional Sliders */}
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

        {/* Trust Guarantee Bar */}
        <div className="mt-2 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('freeDelivery', language)}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            <span>{t('refundForIssue', language)}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </span>
        </div>

        {/* Recommended Products */}
        <div className="p-3">
          <h3 className="text-sm font-black text-slate-950 dark:text-white mb-3">
            {baseLang === 'bn' ? 'আপনার জন্য প্রস্তাবিত পণ্য' : baseLang === 'ar' ? 'منتجات مقترحة لك' : 'Recommended For You'}
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {products.slice(0, 6).map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                language={language}
                onProductClick={(p) => {
                  onClose();
                  if (onOpenProductDetail) onOpenProductDetail(p);
                }}
                onOrderClick={(p) => {
                  onClose();
                  if (onQuickOrder) onQuickOrder(p);
                }}
                onAddToCart={(p) => {
                  onClose();
                  if (onAddToCart) onAddToCart(p);
                }}
                onEditClick={() => {}}
                onDeleteClick={() => {}}
                onReviewClick={(p) => {
                  onClose();
                  if (onOpenReviews) onOpenReviews(p);
                }}
                isAdmin={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Sheet */}
      {isEditingProfile && currentUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 text-slate-900 dark:text-white shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#fb7701]" />
                <span>{baseLang === 'bn' ? 'প্রোফাইল ও ঠিকানা এডিট করুন' : 'Edit Profile & Address'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {t('customerName', language)}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:border-[#fb7701] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {baseLang === 'bn' ? 'ফোন নাম্বার / ইমেইল' : 'Phone / Email'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {baseLang === 'bn' ? 'বিকল্প ফোন নাম্বার' : 'Alternate Phone'}
                </label>
                <input
                  type="text"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold focus:border-[#fb7701] focus:outline-hidden"
                  placeholder="018xxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {t('deliveryArea', language)}
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold focus:border-[#fb7701] focus:outline-hidden"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {getDistrictLabel(d, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {t('deliveryAddress', language)}
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold focus:border-[#fb7701] focus:outline-hidden"
                />
              </div>

              {saveSuccess && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{baseLang === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে সেভ হয়েছে!' : 'Profile details saved!'}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  {baseLang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#fb7701] hover:bg-[#ff5000] text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  {baseLang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Alert Popup */}
      {showGiftAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-amber-400 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <span className="text-5xl block animate-bounce">🎁</span>
            <h4 className="text-base font-black text-slate-950 dark:text-white">
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
