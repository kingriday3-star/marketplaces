import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, Smartphone, Globe, ShieldAlert } from 'lucide-react';
import { SupportedLanguage, resolveBaseLang, t } from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';

interface OfflineBlockerProps {
  onRetrySuccess?: () => void;
  language?: SupportedLanguage;
}

/**
 * Actively tests internet & Express API connectivity with cache busting.
 */
export async function testLiveInternetConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const apiRes = await fetch(`/api/health?nocache=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      if (apiRes.ok) {
        clearTimeout(timeoutId);
        return true;
      }
    } catch {
      // Fallback to static asset probe
    }

    const response = await fetch(`/favicon.png?nocache=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 304 || response.type === 'opaque';
  } catch {
    return false;
  }
}

export const OfflineBlocker: React.FC<OfflineBlockerProps> = ({
  onRetrySuccess,
  language = 'bn'
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const handleManualRetry = async () => {
    setIsChecking(true);
    setCheckFailed(false);
    setErrorMessage('');

    try {
      const isConnected = await testLiveInternetConnection();
      if (isConnected) {
        if (onRetrySuccess) {
          onRetrySuccess();
        }
      } else {
        setCheckFailed(true);
        setErrorMessage(
          isBn
            ? 'এখনো কোনো ইন্টারনেট সংযোগ পাওয়া যায়নি! অনুগ্রহ করে আপনার ফোনের ডেটা অথবা ওয়াই-ফাই চালু করে আবার চেষ্টা করুন।'
            : isAr
            ? 'لا يوجد اتصال بالإنترنت بعد! يرجى تشغيل الواي فاي أو بيانات الهاتف والمحاولة مجدداً.'
            : 'Still no internet connection detected. Turn on Wi-Fi or mobile data and try again.'
        );
      }
    } catch {
      setCheckFailed(true);
      setErrorMessage(
        isBn
          ? 'সংযোগ ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ চালু করে পুনরায় চেষ্টা করুন।'
          : isAr
          ? 'فشل الاتصال. يرجى المحاولة مرة أخرى.'
          : 'Connection check failed. Please retry.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsChecking(true);
      const isConnected = await testLiveInternetConnection();
      setIsChecking(false);
      if (isConnected && onRetrySuccess) {
        onRetrySuccess();
      }
    };

    window.addEventListener('online', handleOnline);

    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const ok = await testLiveInternetConnection();
        if (ok && onRetrySuccess) {
          onRetrySuccess();
        }
      }
    }, 6000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [onRetrySuccess]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      aria-describedby="offline-desc"
      className="fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none overflow-y-auto"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-red-500/20 dark:border-red-500/30 animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-500/10 dark:bg-red-500/20 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full bg-red-500/20 dark:bg-red-500/30" />
          <div className="relative w-16 h-16 rounded-full bg-linear-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <WifiOff className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 text-xs font-bold mb-3 border border-red-200 dark:border-red-800">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t('internetOffline', language)}</span>
        </div>

        <h2
          id="offline-title"
          className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2"
        >
          {isBn
            ? 'ইন্টারনেট সংযোগ প্রয়োজন'
            : isAr
            ? 'يلزم الاتصال بالإنترنت'
            : 'Internet Connection Required'}
        </h2>

        <p
          id="offline-desc"
          className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium"
        >
          <strong className="text-slate-900 dark:text-white">Market places</strong>{' '}
          {isBn
            ? 'একটি রিয়েল-টাইম অনলাইন অ্যাপ্লিকেশন। পণ্য দেখা এবং তাৎক্ষণিক অর্ডার করার জন্য সক্রিয় ইন্টারনেট সংযোগ আবশ্যক।'
            : isAr
            ? 'هو تطبيق تسوق فوري يتطلب اتصالاً نشطاً بالإنترنت لعرض المنتجات وإرسال الطلبات.'
            : 'is a real-time online shopping platform. An active internet connection is required to browse and submit live orders.'}
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-left border border-slate-200/80 dark:border-slate-700/80 mb-6 space-y-2.5 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#fb7701]" />
            <span>
              {isBn
                ? 'সংযোগ চালু করার নির্দেশিকা:'
                : isAr
                ? 'خطوات إعادة الاتصال:'
                : 'How to reconnect:'}
            </span>
          </div>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#fb7701]/10 text-[#fb7701] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {toBengaliNumber(1, language)}
              </span>
              <span>
                {isBn
                  ? 'আপনার ফোনের Wi-Fi অথবা মোবাইল ডেটা অন করুন।'
                  : isAr
                  ? 'قم بتفعيل الواي فاي أو بيانات الهاتف.'
                  : 'Turn on your device Wi-Fi or Mobile Data.'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#fb7701]/10 text-[#fb7701] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {toBengaliNumber(2, language)}
              </span>
              <span>
                {isBn
                  ? 'নেটওয়ার্ক সচল থাকলে নিচের Retry বাটনে চাপ দিন।'
                  : isAr
                  ? 'اضغط على زر إعادة المحاولة أدناه.'
                  : 'Tap the Retry button below once connected.'}
              </span>
            </li>
          </ul>
        </div>

        {checkFailed && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/80 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleManualRetry}
          disabled={isChecking}
          className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-[#fb7701] to-[#ff5000] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>
            {isChecking
              ? isBn
                ? 'সংযোগ যাচাই হচ্ছে...'
                : isAr
                ? 'جاري التحقق...'
                : 'Checking...'
              : isBn
              ? 'পুনরায় চেষ্টা করুন (Retry)'
              : isAr
              ? 'إعادة المحاولة'
              : 'Retry Connection'}
          </span>
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Globe className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>
            {isBn
              ? 'ইন্টারনেট ফিরে পেলেই অ্যাপ স্বয়ংক্রিয়ভাবে খুলে যাবে'
              : isAr
              ? 'سيعمل التطبيق تلقائياً بمجرد عودة الاتصال'
              : 'App resumes automatically when back online'}
          </span>
        </div>
      </div>
    </div>
  );
};
