import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Lock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Send,
  Clock,
  RefreshCw,
  FileText,
  Headphones
} from 'lucide-react';
import { Order, RefundClaim, User } from '../types';
import { SupportedLanguage, formatMoney, resolveBaseLang, t } from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';
import { submitRefundClaim } from '../utils/realtimeClient';

export type TrustProtectionTab = 'privacy' | 'refund' | 'delivery';

interface TrustProtectionModalProps {
  isOpen: boolean;
  initialTab?: TrustProtectionTab;
  onClose: () => void;
  currentUser: User | null;
  walletKey: string;
  orders: Order[];
  refundClaims: RefundClaim[];
  onRefundSubmitted?: (claim: RefundClaim) => void;
  onOpenOrders?: () => void;
  onOpenSupport?: () => void;
  language?: SupportedLanguage;
}

const PRIVACY_PREF_KEY = 'marketplaces_privacy_prefs_v1';

export const TrustProtectionModal: React.FC<TrustProtectionModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
  currentUser,
  walletKey,
  orders,
  refundClaims,
  onRefundSubmitted,
  onOpenOrders,
  onOpenSupport,
  language = 'bn'
}) => {
  const [activeTab, setActiveTab] = useState<TrustProtectionTab>(initialTab);

  // Privacy preferences state
  const [orderUpdatesOptIn, setOrderUpdatesOptIn] = useState(true);
  const [promoAlertsOptIn, setPromoAlertsOptIn] = useState(true);
  const [gpsAssistOptIn, setGpsAssistOptIn] = useState(true);
  const [privacySavedToast, setPrivacySavedToast] = useState(false);

  // Refund claim form state
  const [orderId, setOrderId] = useState('');
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.type === 'phone' ? currentUser.identifier : ''
  );
  const [issueType, setIssueType] = useState<RefundClaim['issueType']>('damaged');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState<RefundClaim | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (currentUser?.type === 'phone' && !customerPhone) {
      setCustomerPhone(currentUser.identifier);
    }
  }, [currentUser, customerPhone]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRIVACY_PREF_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.orderUpdatesOptIn === 'boolean') setOrderUpdatesOptIn(parsed.orderUpdatesOptIn);
        if (typeof parsed.promoAlertsOptIn === 'boolean') setPromoAlertsOptIn(parsed.promoAlertsOptIn);
        if (typeof parsed.gpsAssistOptIn === 'boolean') setGpsAssistOptIn(parsed.gpsAssistOptIn);
      }
    } catch {}
  }, []);

  if (!isOpen) return null;

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const myOrders = orders.filter((o) => {
    if (currentUser) {
      return (
        o.customerId === currentUser.id ||
        o.customerPhone === currentUser.identifier ||
        o.customerName === currentUser.name
      );
    }
    return true;
  }).slice(0, 6);

  const myRefunds = refundClaims.filter(
    (c) => c.walletKey === walletKey || (currentUser && c.customerPhone === currentUser.identifier)
  );

  const savePrivacyPrefs = (next: { orderUpdatesOptIn: boolean; promoAlertsOptIn: boolean; gpsAssistOptIn: boolean }) => {
    try {
      localStorage.setItem(PRIVACY_PREF_KEY, JSON.stringify(next));
      setPrivacySavedToast(true);
      setTimeout(() => setPrivacySavedToast(false), 2500);
    } catch {}
  };

  const handleSelectOrder = (ord: Order) => {
    setOrderId(ord.id);
    if (!customerPhone) setCustomerPhone(ord.customerPhone);
    setRequestedAmount(String(ord.totalAmount));
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess(null);

    if (!orderId.trim() || !customerPhone.trim() || !description.trim()) {
      setClaimError(
        isBn
          ? 'দয়া করে অর্ডার নম্বর, মোবাইল নম্বর এবং সমস্যার বিবরণ লিখুন।'
          : isAr
          ? 'يرجى إدخال رقم الطلب ورقم الهاتف ووصف المشكلة.'
          : 'Please enter the Order ID, phone number, and issue description.'
      );
      return;
    }

    setSubmitting(true);
    const res = await submitRefundClaim({
      orderId: orderId.trim(),
      customerName: currentUser?.name || 'Customer',
      customerPhone: customerPhone.trim(),
      walletKey,
      issueType,
      description: description.trim(),
      requestedAmount: Number(requestedAmount || 0)
    });
    setSubmitting(false);

    if (!res.ok || !res.claim) {
      setClaimError(res.error || 'Could not submit refund claim');
      return;
    }

    setClaimSuccess(res.claim);
    setOrderId('');
    setDescription('');
    setRequestedAmount('');
    onRefundSubmitted?.(res.claim);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Green Trust Header */}
        <div className="bg-gradient-to-r from-[#007a4d] via-[#00965e] to-emerald-600 text-white p-4 sm:p-5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer shrink-0"
                title={t('back', language)}
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black truncate">
                  {activeTab === 'privacy'
                    ? isBn
                      ? 'সিকিউরিটি ও প্রাইভেসি নীতিমালা'
                      : isAr
                      ? 'الأمان وسياسة الخصوصية'
                      : 'Security & Privacy Center'
                    : activeTab === 'refund'
                    ? isBn
                      ? 'গ্যারান্টেড রিফান্ড ও ক্রেতা সুরক্ষা'
                      : isAr
                      ? 'ضمان الاسترداد وحماية المشتري'
                      : 'Guaranteed Refund Protection'
                    : isBn
                    ? 'ডেলিভারি গ্যারান্টি ও সময়সীমা'
                    : isAr
                    ? 'ضمان التوصيل في الموعد'
                    : 'Delivery Guarantee & SLA'}
                </h3>
                <p className="text-[11px] text-emerald-100 truncate">
                  Market places Verified Buyer Protection Program
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
              title={t('close', language)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Interactive Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 bg-black/20 rounded-2xl text-[11px] sm:text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white text-emerald-800 shadow-sm font-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('securePrivacy', language)}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refund')}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'refund'
                  ? 'bg-white text-emerald-800 shadow-sm font-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isBn ? 'গ্যারান্টেড রিফান্ড' : isAr ? 'استرداد مضمون' : 'Refund Guarantee'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('delivery')}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'delivery'
                  ? 'bg-white text-emerald-800 shadow-sm font-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('deliveryGuarantee', language)}</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-800 dark:text-slate-200">
          {/* TAB 1: SECURITY & PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <div className="font-black text-emerald-900 dark:text-emerald-300 mb-0.5">
                    {isBn
                      ? 'আন্তর্জাতিক ই-কমার্স স্ট্যান্ডার্ড প্রাইভেসি সুরক্ষা'
                      : isAr
                      ? 'معيار الأمان والخصوصية للتجارة الإلكترونية العالمية'
                      : 'International E-Commerce Privacy & Security Standards'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'Market places আপনার অ্যাকাউন্ট, ফোন নম্বর, জিমেইল, লোকেশন এবং অর্ডার তথ্য সর্বোচ্চ এনক্রিপশনের মাধ্যমে সুরক্ষিত রাখে। আপনার অনুমতি ছাড়া কোনো তথ্য তৃতীয় পক্ষের সাথে শেয়ার বা বিক্রি করা হয় না।'
                      : isAr
                      ? 'تحمي Market places بيانات حسابك ورقم هاتفك وعنوانك بتشفير كامل ولا تشارك بياناتك مع أي طرف ثالث بدون إذنك.'
                      : 'Market places protects your account credentials, contact details, delivery address, and payment records using industry-standard encryption. We never sell or rent personal data to third-party advertisers.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    titleBn: '১. তথ্য সংগ্রহ ও ব্যবহারের স্বচ্ছতা',
                    titleEn: '1. Data Collection & Purpose',
                    descBn:
                      'শুধুমাত্র অর্ডার কনফার্মেশন, ডেলিভারি কুরিয়ার যোগাযোগ এবং ক্রেতা সুরক্ষা সেবা প্রদানের জন্য নাম, মোবাইল ও ঠিকানা ব্যবহৃত হয়।',
                    descEn:
                      'We collect only the name, phone/Gmail, and delivery address needed to fulfill your order, verify OTP login, and process refunds.'
                  },
                  {
                    titleBn: '২. SSL/TLS এনক্রিপশন ও OTP সুরক্ষা',
                    titleEn: '2. TLS Encryption & OTP Protection',
                    descBn:
                      'সকল ডেটা ট্রান্সফার এনক্রিপ্টেড এবং নতুন একাউন্ট তৈরিতে ৬-ডিজিট OTP যাচাই ও পাসওয়ার্ড সুরক্ষা ব্যবস্থা কার্যকর থাকে।',
                    descEn:
                      'All API traffic runs over encrypted HTTPS/TLS. Accounts require 6-digit OTP verification and password protection.'
                  },
                  {
                    titleBn: '৩. ক্যাশ অন ডেলিভারি ও ওয়ালেট নিরাপত্তা',
                    titleEn: '3. Safe COD & Protected Wallet',
                    descBn:
                      'অগ্রিম কার্ড নম্বর সংরক্ষণ করা হয় না। ক্যাশ অন ডেলিভারিতে পণ্য হাতে পেয়ে যাচাই করে মূল্য পরিশোধ করার সুবিধা রয়েছে।',
                    descEn:
                      'No sensitive card numbers are stored on file. Inspect your parcel with Cash on Delivery and keep refunds safely in Protected Wallet Credits.'
                  },
                  {
                    titleBn: '৪. আপনার ডেটা নিয়ন্ত্রণ ও অধিকার',
                    titleEn: '4. Your Data Rights & Deletion',
                    descBn:
                      'আপনি যেকোনো সময় প্রোফাইল তথ্য হালনাগাদ, পারমিশন পরিবর্তন অথবা একাউন্ট ও ডেটা মুছে ফেলার অনুরোধ করতে পারবেন।',
                    descEn:
                      'You retain full control to edit your profile, manage notification & location permissions, or request permanent account deletion anytime.'
                  }
                ].map((section, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1"
                  >
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{isBn ? section.titleBn : section.titleEn}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isBn ? section.descBn : section.descEn}
                    </p>
                  </div>
                ))}
              </div>

              {/* Interactive Privacy Controls */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {isBn ? 'আপনার প্রাইভেসি পছন্দসমূহ নিয়ন্ত্রণ করুন' : isAr ? 'التحكم في تفضيلات الخصوصية' : 'Manage Privacy Preferences'}
                  </h4>
                  {privacySavedToast && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isBn ? 'সংরক্ষিত' : 'Saved'}
                    </span>
                  )}
                </div>

                {[
                  {
                    labelBn: 'অর্ডার ও ডেলিভারি স্ট্যাটাস অ্যালার্ট',
                    labelEn: 'Live Order & Courier Status Alerts',
                    checked: orderUpdatesOptIn,
                    onToggle: () => {
                      const next = { orderUpdatesOptIn: !orderUpdatesOptIn, promoAlertsOptIn, gpsAssistOptIn };
                      setOrderUpdatesOptIn(next.orderUpdatesOptIn);
                      savePrivacyPrefs(next);
                    }
                  },
                  {
                    labelBn: 'প্রমোশনাল ডিসকাউন্ট ও ফ্ল্যাশ অফার নোটিফিকেশন',
                    labelEn: 'Promotional Deals & Bonus Notifications',
                    checked: promoAlertsOptIn,
                    onToggle: () => {
                      const next = { orderUpdatesOptIn, promoAlertsOptIn: !promoAlertsOptIn, gpsAssistOptIn };
                      setPromoAlertsOptIn(next.promoAlertsOptIn);
                      savePrivacyPrefs(next);
                    }
                  },
                  {
                    labelBn: 'চেকআউটে ঐচ্ছিক GPS লোকেশন সহায়তা',
                    labelEn: 'Optional GPS Delivery Pin Assist',
                    checked: gpsAssistOptIn,
                    onToggle: () => {
                      const next = { orderUpdatesOptIn, promoAlertsOptIn, gpsAssistOptIn: !gpsAssistOptIn };
                      setGpsAssistOptIn(next.gpsAssistOptIn);
                      savePrivacyPrefs(next);
                    }
                  }
                ].map((pref, i) => (
                  <label key={i} className="flex items-center justify-between gap-3 py-1 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isBn ? pref.labelBn : pref.labelEn}
                    </span>
                    <button
                      type="button"
                      onClick={pref.onToggle}
                      className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                        pref.checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          pref.checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GUARANTEED REFUND FOR ANY ISSUE */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
                {[
                  {
                    titleBn: 'ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ পণ্য',
                    titleEn: 'Damaged / Defective',
                    subBn: '১০০% ফ্রি রিপ্লেসমেন্ট বা ফুল রিফান্ড',
                    subEn: '100% Instant Credit or Free Replacement'
                  },
                  {
                    titleBn: 'ভুল পণ্য বা সাইজ',
                    titleEn: 'Wrong Item Received',
                    subBn: 'কোনো চার্জ ছাড়াই ফ্রি রিটার্ন পিকআপ',
                    subEn: 'Free Pickup & Instant Refund'
                  },
                  {
                    titleBn: 'পণ্য না পৌঁছালে',
                    titleEn: 'Item Not Delivered',
                    subBn: 'নির্ধারিত সময়ে না পেলে সম্পূর্ণ টাকা ফেরত',
                    subEn: 'Full Guarantee Backed to Wallet'
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {isBn ? item.titleBn : item.titleEn}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                      {isBn ? item.subBn : item.subEn}
                    </div>
                  </div>
                ))}
              </div>

              {/* Refund Request Form */}
              <form
                onSubmit={handleSubmitRefund}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-[#fb7701]" />
                    <span>
                      {isBn
                        ? 'সরাসরি রিফান্ড / রিটার্ন আবেদন করুন'
                        : isAr
                        ? 'تقديم طلب استرداد أو إرجاع'
                        : 'Submit Instant Refund / Issue Claim'}
                    </span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600">24h Review SLA</span>
                </div>

                {myOrders.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {isBn ? 'সাম্প্রতিক অর্ডার থেকে সিলেক্ট করুন:' : 'Quick-select from recent orders:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {myOrders.map((ord) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => handleSelectOrder(ord)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                            orderId === ord.id
                              ? 'bg-[#fb7701] text-white border-[#fb7701]'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          #{ord.id} ({formatMoney(ord.totalAmount, language)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {claimError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}

                {claimSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {isBn
                        ? `আপনার রিফান্ড আবেদন (#${claimSuccess.id}) সফলভাবে জমা হয়েছে! এডমিন অনুমোদনের সাথে সাথেই আপনার ক্রেডিট ব্যালেন্সে টাকা যোগ হবে।`
                        : `Refund claim #${claimSuccess.id} submitted! Once approved, your Protected Credit Balance is credited automatically.`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isBn ? 'অর্ডার নম্বর *' : 'Order ID *'}
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="ORD-123456"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isBn ? 'সমস্যার ধরন' : 'Issue Type'}
                    </label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value as RefundClaim['issueType'])}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    >
                      <option value="damaged">{isBn ? 'পণ্য ভাঙা বা ক্ষতিগ্রস্ত' : 'Damaged / Defective Item'}</option>
                      <option value="wrong_item">{isBn ? 'ভুল পণ্য বা সাইজ এসেছে' : 'Wrong Item / Size'}</option>
                      <option value="not_delivered">{isBn ? 'নির্ধারিত সময়ে ডেলিভারি হয়নি' : 'Not Delivered on Time'}</option>
                      <option value="quality_issue">{isBn ? 'মান অনুযায়ী নয়' : 'Quality Not as Described'}</option>
                      <option value="other">{isBn ? 'অন্যান্য সমস্যা' : 'Other Issue'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isBn ? 'দাবিকৃত রিফান্ড পরিমাণ' : 'Refund Amount'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(e.target.value)}
                      placeholder="500"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isBn ? 'বিস্তারিত সমস্যা লিখুন *' : 'Describe the issue *'}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isBn
                        ? 'আপনার পণ্যের কী সমস্যা হয়েছে তা সংক্ষেপে লিখুন...'
                        : 'Briefly explain the issue with your order...'
                    }
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? isBn
                        ? 'জমা হচ্ছে...'
                        : 'Submitting...'
                      : isBn
                      ? 'গ্যারান্টেড রিফান্ড ক্লেইম জমা দিন'
                      : 'Submit Refund Guarantee Claim'}
                  </span>
                </button>
              </form>

              {/* Submitted Claims History */}
              {myRefunds.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {isBn ? 'আপনার পূর্ববর্তী রিফান্ড আবেদনসমূহ' : 'Your Refund Claims'} ({toBengaliNumber(myRefunds.length, language)})
                  </h4>
                  {myRefunds.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">
                          #{c.id} · {isBn ? 'অর্ডার' : 'Order'} #{c.orderId}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{c.description}</div>
                        {c.adminNote && (
                          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                            {c.adminNote}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          c.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELIVERY GUARANTEE */}
          {activeTab === 'delivery' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/70 flex items-start gap-3">
                <Truck className="w-6 h-6 text-[#fb7701] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <div className="font-black text-slate-900 dark:text-white text-sm mb-1">
                    {isBn
                      ? 'সময়মতো ডেলিভারি গ্যারান্টি (সারা দেশ ও আন্তর্জাতিক মান)'
                      : isAr
                      ? 'ضمان التوصيل السريع وفي الموعد'
                      : 'Verified On-Time Delivery Guarantee'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'অর্ডার কনফার্ম হওয়ার সাথে সাথেই রিয়েল-টাইম প্যাকেজিং ও কুরিয়ার ট্র্যাকিং চালু হয়। নির্ধারিত সময়ের বেশি দেরি হলে ওয়ালেটে ক্রেডিট বোনাস ক্ষতিপূরণ পাবেন।'
                      : 'Live order tracking starts the second you confirm checkout. Delays beyond the guaranteed window qualify for instant Wallet Credit compensation.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600">
                    <Clock className="w-4 h-4" />
                    <span>{isBn ? 'ঢাকা মেট্রো: ২৪–৪৮ ঘণ্টা' : 'Dhaka Metro: 24–48 Hours'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'ঢাকার ভেতরে এক্সপ্রেস হোম ডেলিভারি। রাইডারের সামনে পণ্য চেক করে ক্যাশ অন ডেলিভারিতে পেমেন্ট করার সুযোগ।'
                      : 'Express doorstep delivery inside Dhaka with full Cash on Delivery parcel inspection.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-[#fb7701]">
                    <Truck className="w-4 h-4" />
                    <span>{isBn ? 'সারাদেশ (৬৪ জেলা): ২–৪ দিন' : 'Nationwide (All Districts): 2–4 Days'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'দেশের যেকোনো জেলায় দ্রুত ও নিরাপদ কুরিয়ার হোম ডেলিভারি ও পিকআপ পয়েন্ট সুবিধা।'
                      : 'Tracked nationwide courier coverage across every district with zero hidden fees.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {isBn ? 'আপনার বর্তমান অর্ডার লাইভ ট্র্যাক করুন' : 'Track Your Current Orders Live'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isBn
                      ? 'প্যাকেজিং থেকে ডেলিভারি পর্যন্ত প্রতিটি ধাপ দেখুন'
                      : 'Check real-time packaging, courier & delivery steps'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenOrders && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenOrders();
                      }}
                      className="px-3.5 py-2 bg-[#fb7701] hover:bg-[#e65100] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
                    >
                      {isBn ? 'অর্ডার ট্র্যাকিং' : 'Track Orders'}
                    </button>
                  )}
                  {onOpenSupport && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSupport();
                      }}
                      className="px-3.5 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সাপোর্ট AI' : 'Support AI'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold">
            Market places · Protected Shopping
          </span>
          {onOpenSupport && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupport();
              }}
              className="px-4 py-2 bg-[#fb7701] hover:bg-[#e65100] text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{isBn ? 'সাপোর্ট সেন্টার AI' : 'Open Support AI'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
