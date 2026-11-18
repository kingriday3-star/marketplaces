import React, { useState } from 'react';
import { User } from '../types';
import {
  ArrowLeft,
  Shield,
  Lock,
  Key,
  ShieldCheck,
  ChevronRight,
  Share2,
  LogOut,
  Check,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { SupportedLanguage, LANGUAGES, resolveBaseLang, t } from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';

interface TemuSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogout: () => void;
  language: SupportedLanguage;
  onOpenLanguageSelector: () => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  onOpenTrustTab?: (tab: 'privacy' | 'refund' | 'delivery') => void;
}

export const TemuSettingsModal: React.FC<TemuSettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  language = 'bn',
  onOpenLanguageSelector,
  isAdmin = false,
  onOpenAdminPanel,
  onOpenTrustTab
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const activeLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const appShareUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-pre-kzmx5l3uac4a3lv7cxr3sf-870223207021.europe-west2.run.app';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Market places',
          text: isBn
            ? 'Market places - ১০০+ ভাষায় অনলাইন শপিং ও প্রোডাক্ট এক্সপ্লোর করুন!'
            : 'Market places - Global Online Shopping in 100+ Languages!',
          url: appShareUrl
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    try {
      await navigator.clipboard.writeText(appShareUrl);
      setCopiedLink(true);
      showToast(isBn ? 'অ্যাপ লিংক কপি করা হয়েছে!' : isAr ? 'تم نسخ الرابط!' : 'App link copied!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f4f4] dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center">
          <button
            onClick={onClose}
            className="p-1 -ml-1 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title={t('back', language)}
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white ml-3">
            {isBn ? 'সেটিংস' : isAr ? 'الإعدادات' : 'Settings'}
          </h1>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto max-w-xl w-full mx-auto pb-24">
        {/* Top Account Protection Section */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
              {isBn
                ? 'আপনার অ্যাকাউন্ট সম্পূর্ণ সুরক্ষিত'
                : isAr
                ? 'حسابك محمي بالكامل'
                : 'Your account is protected'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {isBn
                ? 'Market places আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখে এবং গোপনীয়তা বজায় রাখে।'
                : isAr
                ? 'تحافظ Market places على أمان وخصوصية معلوماتك الشخصية بالكامل.'
                : 'Market places protects your personal information and keeps it private, safe and secure.'}
            </p>
          </div>

          {/* 2x2 Grid of Security Cards */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              {
                id: 'security',
                icon: Shield,
                bn: 'অ্যাকাউন্ট সিকিউরিটি',
                ar: 'أمان الحساب',
                en: 'Account security'
              },
              {
                id: 'privacy',
                icon: Lock,
                bn: 'প্রাইভেসি',
                ar: 'الخصوصية',
                en: 'Privacy'
              },
              {
                id: 'permissions',
                icon: Key,
                bn: 'পারমিশন',
                ar: 'الأذونات',
                en: 'Permissions'
              },
              {
                id: 'safety',
                icon: ShieldCheck,
                bn: 'সেফটি সেন্টার',
                ar: 'مركز الأمان',
                en: 'Safety center'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'privacy' && onOpenTrustTab) {
                      onOpenTrustTab('privacy');
                      return;
                    }
                    if (item.id === 'safety' && onOpenTrustTab) {
                      onOpenTrustTab('refund');
                      return;
                    }
                    setActiveSubModal(item.id);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {isBn ? item.bn : isAr ? item.ar : item.en}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Admin Control Center Access (strictly visible to authenticated owner only) */}
          {isAdmin && onOpenAdminPanel && (
            <div
              onClick={() => {
                onClose();
                onOpenAdminPanel();
              }}
              className="mt-3 p-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl flex items-center justify-between cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <div>
                  <div className="text-xs font-black">
                    {isBn ? '🛡️ সুপার এডমিন কন্ট্রোল ড্যাশবোর্ড' : '🛡️ Super Admin Control Dashboard'}
                  </div>
                  <div className="text-[10px] text-emerald-100">
                    {isBn
                      ? 'পণ্য, অর্ডার, ট্র্যাকিং ও এজেন্ট নিয়ন্ত্রণ করুন'
                      : 'Control products, live orders & agents'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-200" />
            </div>
          )}
        </div>

        {/* Settings Menu Rows */}
        <div className="mt-2.5 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-[13px] font-bold">
          <div
            onClick={() => setActiveSubModal('payment')}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{isBn ? 'আপনার পেমেন্ট মেথড' : isAr ? 'طرق الدفع' : 'Your payment methods'}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={onOpenLanguageSelector}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{isBn ? 'দেশ ও অঞ্চল' : isAr ? 'البلد والمنطقة' : 'Country & region'}</span>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
              <span>
                {activeLangObj.flag} {activeLangObj.country}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div
            onClick={onOpenLanguageSelector}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{t('selectLanguageLabel', language)}</span>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
              <span>
                {activeLangObj.nativeName} ({toBengaliNumber(LANGUAGES.length, language)}+)
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div
            onClick={onOpenLanguageSelector}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{isBn ? 'মুদ্রা (Currency)' : isAr ? 'العملة' : 'Currency'}</span>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
              <span className="font-bold text-[#fb7701]">
                {activeLangObj.currency} ({activeLangObj.currencySymbol})
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div
            onClick={() => setActiveSubModal('notifications')}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{isBn ? 'নোটিফিকেশন অ্যালার্ট' : isAr ? 'الإشعارات' : 'Notifications'}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Secondary Settings Section */}
        <div className="mt-2.5 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-[13px] font-bold">
          <div
            onClick={() => setActiveSubModal('about')}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{isBn ? 'অ্যাপ পরিচিতি' : isAr ? 'عن التطبيق' : 'About this app'}</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-normal">
              <span>v2.5.0</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div
            onClick={() => setActiveSubModal('terms')}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>
              {isBn ? 'আইনগত শর্তাবলী ও নীতি' : isAr ? 'الشروط والسياسات' : 'Legal terms & policies'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={handleShareApp}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#fb7701]" />
              <span>{t('shareApp', language)}</span>
            </div>
            <div className="flex items-center gap-1 text-[#fb7701] text-xs">
              {copiedLink ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কপি হয়েছে' : isAr ? 'تم النسخ' : 'Copied'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 font-bold">
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isBn ? 'লিংক কপি' : isAr ? 'نسخ الرابط' : 'Copy link'}</span>
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="mt-2.5 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-[13px] font-bold">
          <button
            onClick={() =>
              showToast(
                isBn
                  ? 'অ্যাকাউন্ট পরিবর্তনের জন্য সাইন আউট করে নতুন অ্যাকাউন্টে লগইন করুন।'
                  : isAr
                  ? 'قم بتسجيل الخروج للتبديل إلى حساب آخر.'
                  : 'Sign out to switch to another verified account.'
              )
            }
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{isBn ? 'অ্যাকাউন্ট পরিবর্তন করুন' : isAr ? 'تبديل الحساب' : 'Switch accounts'}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors cursor-pointer"
          >
            <span>{t('logout', language)}</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub Modals */}
      {activeSubModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize">
              {activeSubModal}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeSubModal === 'payment' &&
                (isBn
                  ? 'ক্যাশ অন ডেলিভারি (COD) প্রতিটি অর্ডারে সাপোর্ট করা হয়।'
                  : isAr
                  ? 'الدفع عند الاستلام متاح لجميع المنتجات.'
                  : 'Cash on delivery is supported for all products.')}
              {activeSubModal === 'about' &&
                (isBn
                  ? 'Market places - ১০০+ দেশের ভাষা সমর্থিত প্রফেশনাল অনলাইন মার্কেটপ্লেস।'
                  : isAr
                  ? 'Market places - متجر إلكتروني عالمي يدعم أكثر من 100 لغة.'
                  : 'Market places - Multilingual global e-commerce storefront (v2.5.0).')}
              {activeSubModal === 'terms' &&
                (isBn
                  ? 'Market places-এর ৫০ দিনের রিটার্ন পলিসি এবং নিরাপদ অর্ডার প্রটেকশন প্রযোজ্য।'
                  : isAr
                  ? 'تخضع جميع المشتريات لسياسة إرجاع لمدة 50 يوماً.'
                  : 'All purchases are protected by a 50-day return policy and secure guarantees.')}
              {activeSubModal === 'security' &&
                (isBn
                  ? 'আপনার সেশন ও পাসওয়ার্ড সম্পূর্ণ নিরাপদ এবং সুরক্ষিত।'
                  : isAr
                  ? 'جلستك وبيانات اعتمادك محمية ومشفرة بالكامل.'
                  : 'Your session and credentials are protected and encrypted.')}
              {activeSubModal === 'privacy' &&
                (isBn
                  ? 'আমরা কখনোই তৃতীয় পক্ষের সাথে আপনার ব্যক্তিগত তথ্য শেয়ার করি না।'
                  : isAr
                  ? 'نحن نحمي خصوصية المستخدم ولا نشارك بياناتك أبداً.'
                  : 'We strictly protect user privacy and never share your details with third parties.')}
              {activeSubModal === 'permissions' &&
                (isBn
                  ? 'নোটিফিকেশন ও অফলাইন ক্যাশিং সুবিধাসমূহ সক্রিয় রয়েছে।'
                  : isAr
                  ? 'الإشعارات والتخزين المؤقت للعمل دون اتصال نشطة.'
                  : 'Notifications, GPS delivery helper, and offline caching permissions are active.')}
              {activeSubModal === 'safety' &&
                (isBn
                  ? '১০০% ভেরিফাইড বিক্রেতা ও পণ্যের গুণমান নিশ্চিতকরণ।'
                  : isAr
                  ? 'شبكة بائعين موثوقين مع حماية كاملة للعملاء.'
                  : 'Verified seller network with comprehensive customer protection.')}
              {activeSubModal === 'notifications' &&
                (isBn
                  ? 'লাইভ অর্ডার স্ট্যাটাস ও ডিসকাউন্ট নোটিফিকেশন চালু আছে।'
                  : isAr
                  ? 'إشعارات حالة الطلبات المباشرة والعروض مفعلة.'
                  : 'Real-time order status and promotional alerts are enabled.')}
            </p>
            <button
              onClick={() => setActiveSubModal(null)}
              className="w-full py-2 bg-[#fb7701] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {isBn ? 'ঠিক আছে' : isAr ? 'حسناً' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in duration-200 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-[#fb7701]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
