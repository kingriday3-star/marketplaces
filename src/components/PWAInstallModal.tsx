import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { APK_INFO, downloadAndroidTwaConfig } from '../utils/downloadApk';
import {
  Smartphone,
  Share2,
  CheckCircle2,
  X,
  Copy,
  Check,
  MessageCircle,
  QrCode,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Zap,
  Globe,
  FileCode2,
  MoreVertical
} from 'lucide-react';
import QRCode from 'qrcode';
import { Product } from '../types';
import { GooglePlayIcon } from './GooglePlayBadge';
import { SupportedLanguage, resolveBaseLang, t } from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  language?: SupportedLanguage;
}

type InstallModalTab = 'direct' | 'playstore' | 'share';

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  language = 'bn'
}) => {
  const { isInstalled, isIOS, isIframe, standaloneUrl, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<InstallModalTab>('direct');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [installSuccessNotice, setInstallSuccessNotice] = useState(false);
  const [manualGuideHint, setManualGuideHint] = useState(false);
  const [twaExported, setTwaExported] = useState(false);

  const baseLang = resolveBaseLang(language);

  // Live direct standalone app URL
  const appUrl =
    standaloneUrl ||
    (typeof window !== 'undefined'
      ? window.location.href.split('?')[0]
      : 'https://ais-pre-kzmx5l3uac4a3lv7cxr3sf-870223207021.europe-west2.run.app');

  useEffect(() => {
    if (isOpen && appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (isIframe) {
      window.open(`${standaloneUrl}?direct_install=true`, '_blank');
      return;
    }

    const success = await install();
    if (success) {
      setInstallSuccessNotice(true);
      setTimeout(() => {
        setInstallSuccessNotice(false);
        onClose();
      }, 2500);
    } else {
      setManualGuideHint(true);
    }
  };

  const handleDownloadTwaBundle = async () => {
    const ok = await downloadAndroidTwaConfig(appUrl);
    if (ok) {
      setTwaExported(true);
      setTimeout(() => setTwaExported(false), 3500);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareText =
    baseLang === 'bn'
      ? `আসসালামু আলাইকুম! "Market places" শপিং অ্যাপটি ১-ট্যাপে সরাসরি আপনার ফোনে ইনস্টল করুন:\n${appUrl}\n(কোনো বাড়তি ফাইল ছাড়াই সরাসরি হোম স্ক্রিনে অ্যাপ ইনস্টল করে শপিং করুন)`
      : baseLang === 'ar'
        ? `قم بتثبيت تطبيق التسوق "Market places" مباشرة على هاتفك بضغطة واحدة:\n${appUrl}`
        : `Install the "Market places" shopping app directly on your phone in 1 tap:\n${appUrl}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 relative border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title={t('back', language)}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title={t('close', language)}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3.5 mt-6 sm:mt-4">
            <div className="w-14 h-14 bg-[#0f1829] rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shrink-0 border border-white/20">
              <img src="/logo.png" alt="Market places" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black flex items-center gap-1">
                  <span>Market</span>
                  <span className="text-[#fb7701]">places</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{baseLang === 'bn' ? 'WebAPK ভেরিফাইড' : 'WebAPK Verified'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {baseLang === 'bn'
                  ? 'অ্যান্ড্রয়েড WebAPK, প্লে-স্টোর TWA ও iOS ইনস্টল'
                  : baseLang === 'ar'
                    ? 'تثبيت مباشر على أندرويد وآيفون'
                    : 'Android WebAPK, Play Store TWA & iOS Install'}
              </p>
            </div>
          </div>

          {/* 3 Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mt-5 p-1 bg-white/10 rounded-2xl text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span className="truncate">{baseLang === 'bn' ? 'সরাসরি ইনস্টল' : baseLang === 'ar' ? 'تثبيت مباشر' : 'Direct Install'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('playstore')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'playstore'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <GooglePlayIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">{baseLang === 'bn' ? 'প্লে স্টোর / APK' : baseLang === 'ar' ? 'متجر بلاي' : 'Play Store'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('share')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'share'
                  ? 'bg-gradient-to-r from-[#fb7701] to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{baseLang === 'bn' ? 'লিংক ও শেয়ার' : baseLang === 'ar' ? 'مشاركة الرابط' : 'Link & Share'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {(isInstalled || installSuccessNotice) && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-3 shadow-md">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="flex-1">
                <strong className="text-sm font-black block">
                  {baseLang === 'bn' ? 'অভিনন্দন! আপনার ফোনে অ্যাপটি ইনস্টল রয়েছে!' : 'App is installed on your device!'}
                </strong>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-0.5">
                  {baseLang === 'bn' ? 'হোম স্ক্রিন থেকে সরাসরি Market places আইকনে চাপ দিয়ে শপিং করুন।' : 'Launch Market places directly from your home screen.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: DIRECT PHONE INSTALLATION */}
          {activeTab === 'direct' && (
            <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl shadow-xl border border-slate-700/80 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-300" />
                    <span>{baseLang === 'bn' ? '১-ট্যাপ WebAPK ইনস্টল' : '1-Tap Android WebAPK'}</span>
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white mt-1.5">
                    {baseLang === 'bn' ? 'ফোনে সরাসরি অ্যাপ ইনস্টল করুন' : baseLang === 'ar' ? 'تثبيت التطبيق مباشرة على هاتفك' : 'Install Official App to Phone'}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-amber-300 block">v{APK_INFO.versionName}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {baseLang === 'bn' ? 'সম্পূর্ণ ফ্রি' : '100% Free'}
                  </span>
                </div>
              </div>

              {isIframe ? (
                <a
                  href={`${standaloneUrl}?direct_install=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 group no-underline"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <span className="block leading-tight text-base font-black">
                      {baseLang === 'bn' ? '📲 ১-ট্যাপে সরাসরি ফোনে ইনস্টল করুন' : '📲 1-Tap Direct Install'}
                    </span>
                    <span className="text-[11px] font-normal text-emerald-100 block truncate">
                      {baseLang === 'bn' ? 'ক্রোম ব্রাউজারে খুলে সরাসরি হোম স্ক্রিনে অ্যাপ যুক্ত করুন' : 'Open standalone window & add to phone home screen'}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-200 shrink-0" />
                </a>
              ) : isInstalled ? (
                <div className="w-full py-3.5 px-5 bg-emerald-700/80 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 border border-emerald-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>{baseLang === 'bn' ? 'আপনার ফোনে Market places সফলভাবে ইনস্টল রয়েছে!' : 'Market places is installed on your phone!'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <span className="block leading-tight text-base font-black">
                      {baseLang === 'bn' ? '📲 ১-ট্যাপে ফোনে ইনস্টল করুন' : '📲 1-Tap Direct Install'}
                    </span>
                    <span className="text-[11px] font-normal text-emerald-100 block">
                      {baseLang === 'bn' ? 'Google Chrome সাইনড WebAPK হিসেবে ইনস্টল হবে' : 'Installs natively via Chrome WebAPK / Home Screen'}
                    </span>
                  </div>
                </button>
              )}

              {manualGuideHint && (
                <div className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-xl text-[11px] text-amber-100 leading-relaxed">
                  {isIOS
                    ? (baseLang === 'bn'
                        ? 'আইফোনে Safari ব্রাউজারের নিচে Share (⎋) আইকনে চাপ দিয়ে "Add to Home Screen" সিলেক্ট করুন।'
                        : 'On iPhone Safari, tap Share (⎋) at bottom and choose "Add to Home Screen".')
                    : (baseLang === 'bn'
                        ? 'ক্রোম ব্রাউজারের ডান-উপরে থাকা ⋮ মেনুতে চাপ দিয়ে "Install app" বা "Add to Home screen" সিলেক্ট করুন।'
                        : 'In Android Chrome, tap the top-right ⋮ menu and select "Install app" or "Add to Home screen".')}
                </div>
              )}

              {/* Visual Android & iOS Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className={`p-3 rounded-2xl border ${!isIOS ? 'bg-black/45 border-emerald-500/50' : 'bg-black/30 border-white/10'} space-y-1.5`}>
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <MoreVertical className="w-3.5 h-3.5" />
                    <span>{baseLang === 'bn' ? 'অ্যান্ড্রয়েড (Chrome)' : 'Android (Chrome)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {baseLang === 'bn'
                      ? `${toBengaliNumber(1, language)}. উপরের বাটনে চাপ দিন অথবা ⋮ মেনু খুলুন।\n${toBengaliNumber(2, language)}. "Install app" চাপলেই হোম স্ক্রিনে চলে আসবে।`
                      : '1. Tap Install above or open ⋮ menu.\n2. Choose "Install app" for signed WebAPK.'}
                  </p>
                </div>

                <div className={`p-3 rounded-2xl border ${isIOS ? 'bg-black/45 border-sky-500/50' : 'bg-black/30 border-white/10'} space-y-1.5`}>
                  <div className="font-bold text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{baseLang === 'bn' ? 'আইফোন (iOS Safari)' : 'iPhone (iOS Safari)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {baseLang === 'bn'
                      ? `${toBengaliNumber(1, language)}. Safari নিচে Share (⎋) চাপুন।\n${toBengaliNumber(2, language)}. "Add to Home Screen" সিলেক্ট করুন।`
                      : '1. Tap Share (⎋) in Safari.\n2. Tap "Add to Home Screen" -> Add.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-300 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Play Protect</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{baseLang === 'bn' ? 'সুপার ফাস্ট ও জিরো হ্যাং' : 'Zero-Lag Native Launch'}</span>
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE PLAY STORE / BUBBLEWRAP TWA CONFIG */}
          {activeTab === 'playstore' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-5 bg-slate-900 text-white rounded-3xl border border-slate-700/80 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-slate-200">
                    <GooglePlayIcon className="w-10 h-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-base text-white">Google Play Store & TWA</h4>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-2 py-0.5 rounded-full">
                        v{APK_INFO.versionName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {APK_INFO.packageName}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{baseLang === 'bn' ? 'প্লে প্রোটেক্ট স্ট্যান্ডার্ড ভেরিফাইড' : 'Play Store TWA Standard Ready'}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="p-2 bg-white/5 rounded-xl">
                    <span className="block text-xs font-black text-amber-300">4.9 ★</span>
                    <span className="text-[10px] text-slate-400">{baseLang === 'bn' ? 'রেটিং' : 'Rating'}</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl">
                    <span className="block text-xs font-black text-emerald-400">TWA</span>
                    <span className="text-[10px] text-slate-400">{baseLang === 'bn' ? 'আর্কিটেকচার' : 'Engine'}</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl">
                    <span className="block text-xs font-black text-sky-400">Fast</span>
                    <span className="text-[10px] text-slate-400">{baseLang === 'bn' ? 'পারফরম্যান্স' : 'Speed'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <GooglePlayIcon className="w-5 h-5" />
                  <span>{baseLang === 'bn' ? 'প্লে-স্টোর WebAPK মোডে ইনস্টল করুন' : 'Install via Play WebAPK Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTwaBundle}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-slate-100 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCode2 className="w-4 h-4 text-amber-300" />
                  <span>
                    {baseLang === 'bn'
                      ? 'প্লে-স্টোর TWA / Android বিল্ড কনফিগ ডাউনলোড (.json)'
                      : 'Download Play Store Bubblewrap TWA Config (.json)'}
                  </span>
                </button>

                {twaExported && (
                  <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-[11px] text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {baseLang === 'bn'
                        ? 'Bubblewrap TWA কনফিগ (marketplaces-android-twa-config.json) ডাউনলোড হয়েছে!'
                        : 'Downloaded marketplaces-android-twa-config.json for signed APK/AAB build!'}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <strong>{baseLang === 'bn' ? 'ইন্টারন্যাশনাল Play Store TWA নিশ্চয়তা:' : 'International Play Store TWA Compliance:'}</strong>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                  {baseLang === 'bn'
                    ? 'অ্যান্ড্রয়েড ফোনে সরাসরি WebAPK ইনস্টল ছাড়াও ডেভেলপাররা ডাউনলোড করা কনফিগ ও Bubblewrap CLI ব্যবহার করে অফিশিয়াল সাইনড .AAB / .APK প্লে-স্টোরে আপলোড করতে পারবেন।'
                    : 'Includes Digital Asset Links & TWA manifest so owners can build a signed Google Play .AAB/.APK via Bubblewrap CLI.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: LINK & TRIAL SHARE */}
          {activeTab === 'share' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-[#fb7701]" />
                    <span>{baseLang === 'bn' ? 'গ্রাহক বা বন্ধুদের অ্যাপ লিংক পাঠান:' : 'Share install link with customers:'}</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-[11px] font-bold text-[#fb7701] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQrCode ? (baseLang === 'bn' ? 'QR লুকান' : 'Hide QR') : (baseLang === 'bn' ? 'QR কোড দেখুন' : 'View QR')}</span>
                  </button>
                </div>

                {showQrCode && qrCodeDataUrl && (
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2 animate-in fade-in zoom-in-95 duration-200">
                    <img src={qrCodeDataUrl} alt="App QR Code" className="w-40 h-40 mx-auto rounded-xl shadow-xs" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {baseLang === 'bn'
                        ? 'মোবাইল ক্যামেরা দিয়ে স্ক্যান করলেই সরাসরি অ্যাপ খুলবে।'
                        : 'Scan with any phone camera to open & install immediately.'}
                    </p>
                  </div>
                )}

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? (baseLang === 'bn' ? 'কপি!' : 'Copied!') : (baseLang === 'bn' ? 'কপি' : 'Copy')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{baseLang === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Share on WhatsApp'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2.5 px-3 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? (baseLang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (baseLang === 'bn' ? 'ইনস্টল লিংক কপি' : 'Copy Install Link')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Market places v{APK_INFO.versionName} • {APK_INFO.packageName}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
          >
            {t('close', language)}
          </button>
        </div>

      </div>
    </div>
  );
};
