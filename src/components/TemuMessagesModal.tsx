import React, { useState, useEffect } from 'react';
import { Product, WalletAccount } from '../types';
import {
  ArrowLeft,
  MessageSquare,
  Tag,
  Package,
  Wallet,
  ChevronRight,
  ChevronDown,
  Headphones,
  Check,
  Zap,
  CheckCircle2,
  Gift,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { SupportedLanguage, formatMoney, resolveBaseLang, t } from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';
import { ProductGridCard } from './ProductGridCard';
import { claimPromoCredit } from '../utils/realtimeClient';

export type MessagesSubSection = 'inbox' | 'promotions' | 'wallet';

interface TemuMessagesModalProps {
  isOpen: boolean;
  initialSection?: MessagesSubSection;
  onClose: () => void;
  products?: Product[];
  wallet?: WalletAccount | null;
  walletKey?: string;
  onWalletUpdated?: (wallet: WalletAccount) => void;
  onOpenProductDetail?: (product: Product) => void;
  onQuickOrder?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onOpenReviews?: (product: Product) => void;
  onOpenOrders?: () => void;
  onOpenSupportCenter?: () => void;
  onOpenTrustTab?: (tab: 'privacy' | 'refund' | 'delivery') => void;
  language?: SupportedLanguage;
}

export const TemuMessagesModal: React.FC<TemuMessagesModalProps> = ({
  isOpen,
  initialSection = 'inbox',
  onClose,
  products = [],
  wallet,
  walletKey = 'guest-default',
  onWalletUpdated,
  onOpenProductDetail,
  onQuickOrder,
  onAddToCart,
  onOpenReviews,
  onOpenOrders,
  onOpenSupportCenter,
  onOpenTrustTab,
  language = 'bn'
}) => {
  const [section, setSection] = useState<MessagesSubSection>(initialSection);
  const [showPreviousMessages, setShowPreviousMessages] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [claimingPromoId, setClaimingPromoId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSection(initialSection);
    }
  }, [isOpen, initialSection]);

  // Promotional items: discounted, lightning deals, or promotional badges
  const promoProducts = React.useMemo(() => {
    const promos = products.filter(
      (p) =>
        p.lightningDeal ||
        (p.originalPrice && p.originalPrice > p.price) ||
        (p.badge && /sale|অফার|ফ্ল্যাশ|সেরা|পছন্দ/i.test(p.badge))
    );
    return promos.length > 0 ? promos : products;
  }, [products]);

  if (!isOpen) return null;

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const balance = wallet?.balance ?? 0;
  const claimedPromos = wallet?.claimedPromos ?? [];
  const transactions = wallet?.transactions ?? [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClaimBonus = async (promoId: 'PROMO_250' | 'FREE_GIFT_50' | 'WELCOME_100') => {
    if (claimedPromos.includes(promoId)) {
      showToast(isBn ? 'এই বোনাস ক্রেডিট ইতিমধ্যে সংগ্রহ করা হয়েছে।' : 'This bonus is already claimed.');
      return;
    }
    setClaimingPromoId(promoId);
    const res = await claimPromoCredit(walletKey, promoId);
    setClaimingPromoId(null);
    if (res.ok && res.wallet) {
      onWalletUpdated?.(res.wallet);
      showToast(
        isBn
          ? `অভিনন্দন! আপনার ক্রেডিট ব্যালেন্সে ${formatMoney(res.creditedAmount || 0, language)} যোগ হয়েছে!`
          : `Added ${formatMoney(res.creditedAmount || 0, language)} to your Credit balance!`
      );
    } else if (res.wallet) {
      onWalletUpdated?.(res.wallet);
      showToast(res.error || 'Already claimed');
    } else {
      showToast(res.error || 'Could not claim bonus');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f4f4] dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (section !== 'inbox') setSection('inbox');
              else onClose();
            }}
            className="p-1 -ml-1 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title={t('back', language)}
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {section === 'promotions'
              ? isBn
                ? 'প্রমোশন ও ডিসকাউন্ট পণ্য'
                : isAr
                ? 'العروض والمنتجات المخفضة'
                : 'Promotions & Deals'
              : section === 'wallet'
              ? isBn
                ? 'ক্রেডিট ব্যালেন্স ও ওয়ালেট'
                : isAr
                ? 'رصيد الحساب والمحفظة'
                : 'Credit balance & Wallet'
              : isBn
              ? 'মেসেজ ও নোটিফিকেশন'
              : isAr
              ? 'الرسائل والإشعارات'
              : 'Messages'}
          </h1>

          <button
            type="button"
            onClick={() =>
              showToast(
                isBn
                  ? 'সকল মেসেজ পঠিত হিসেবে চিহ্নিত করা হয়েছে।'
                  : isAr
                  ? 'تم تحديد جميع الإشعارات كمقروءة.'
                  : 'All notifications marked as read.'
              )
            }
            className="p-1 -mr-1 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Mark all read"
          >
            <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Trust Bar */}
        <div
          onClick={() => onOpenTrustTab?.('delivery')}
          className="bg-[#fcfaf7] dark:bg-slate-800/80 px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('freeShipping', language)}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isBn
                  ? '৩০ দিনের মধ্যে মূল্য সমন্বয় ও রিফান্ড গ্যারান্টি'
                  : isAr
                  ? 'تعديل السعر خلال 30 يوماً'
                  : 'Price adjustment within 30 days'}
              </span>
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto max-w-xl w-full mx-auto pb-24">
        {section === 'inbox' && (
          <>
            {/* Notifications List */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {/* Promotions Item -> Opens Promotions Products Showcase */}
              <div
                onClick={() => setSection('promotions')}
                className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#fb7701] to-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Tag className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{isBn ? 'প্রমোশন ও ডিসকাউন্ট' : isAr ? 'العروض والتخفيضات' : 'Promotions'}</span>
                      <span className="text-[10px] font-bold text-[#fb7701]">
                        ({toBengaliNumber(promoProducts.length, language)})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                      {claimedPromos.includes('PROMO_250')
                        ? isBn
                          ? 'প্রমোশনাল পণ্য ও ফ্ল্যাশ অফার দেখুন'
                          : 'Tap to shop discounted promotional deals'
                        : isBn
                        ? `বিশেষ প্রমোশনাল বোনাস: ${formatMoney(250, language)} সংগ্রহ করুন`
                        : isAr
                        ? `عرض استرداد نقدي: ${formatMoney(250, language)}`
                        : `Special promotional bonus: ${formatMoney(250, language)}`}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {toBengaliNumber('9:40', language)} PM
                  </div>
                  <span className="inline-block mt-1 bg-[#fb7701] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    {toBengaliNumber(promoProducts.length, language)}
                  </span>
                </div>
              </div>

              {/* Orders & Shipping Item */}
              <div
                onClick={() => {
                  if (onOpenOrders) onOpenOrders();
                }}
                className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Package className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {isBn ? 'অর্ডার ও শিপিং আপডেট' : isAr ? 'الطلبات والشحن' : 'Orders & Shipping'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                      {isBn
                        ? 'আপনার অর্ডার লাইভ ট্র্যাক করুন'
                        : isAr
                        ? 'تتبع شحناتك مباشرة'
                        : 'Tap to track your live order shipments'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Credit Balance Item -> Opens Live Protected Wallet */}
              <div
                onClick={() => setSection('wallet')}
                className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#fb7701] to-amber-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Wallet className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{isBn ? 'ক্রেডিট ব্যালেন্স' : isAr ? 'رصيد الحساب' : 'Credit balance'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-black">
                        {formatMoney(balance, language)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                      {isBn
                        ? 'সুরক্ষিত ওয়ালেট, রিফান্ড ও ডিসকাউন্ট ক্রেডিট'
                        : isAr
                        ? 'حماية الاسترداد والمحفظة'
                        : 'Protected wallet & refund credits'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Previous messages accordion */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-center py-2.5">
              <button
                type="button"
                onClick={() => setShowPreviousMessages(!showPreviousMessages)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <span>
                  {isBn ? 'পূর্ববর্তী মেসেজসমূহ' : isAr ? 'الرسائل السابقة' : 'Previous messages'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showPreviousMessages ? 'rotate-180' : ''}`}
                />
              </button>
              {showPreviousMessages && (
                <div className="p-3 text-xs text-slate-400">
                  {isBn
                    ? 'গত ৩০ দিনের সকল নোটিফিকেশন নিরাপদে সংরক্ষিত রয়েছে।'
                    : isAr
                    ? 'جميع التنبيهات لآخر 30 يوماً محفوظة بأمان.'
                    : 'All past 30 days alerts are archived safely.'}
                </div>
              )}
            </div>

            {/* Market places Support Center -> Launches AI Support Agent Modal */}
            <div
              onClick={() => onOpenSupportCenter?.()}
              className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 flex items-center justify-center text-[#fb7701]">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>
                      {isBn
                        ? 'Market places সাপোর্ট সেন্টার'
                        : isAr
                        ? 'مركز دعم Market places'
                        : 'Market places Support Center'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase">
                      AI Agent
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'হ্যালো, আমরা আপনাকে কীভাবে সাহায্য করতে পারি? (AI চ্যাট)'
                      : isAr
                      ? 'مرحباً، كيف يمكننا مساعدتك اليوم؟'
                      : 'Hi, how can we help you today? (Live AI Agent)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSupportCenter?.();
                }}
                className="px-3.5 py-1.5 bg-[#fb7701] hover:bg-[#e65100] text-white text-xs font-black rounded-full transition-colors cursor-pointer shadow-xs shrink-0"
              >
                {isBn ? 'সাপোর্ট' : isAr ? 'الدعم' : 'Support'}
              </button>
            </div>

            {/* Recommended Feed underneath */}
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#fb7701] fill-[#fb7701]" />
                  <span>
                    {isBn ? 'আপনার জন্য সুপারিশকৃত পণ্য' : isAr ? 'موصى به لك' : 'Recommended for you'}
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {products.slice(0, 6).map((prod) => (
                  <ProductGridCard
                    key={prod.id}
                    product={prod}
                    language={language}
                    onProductClick={onOpenProductDetail}
                    onOrderClick={onQuickOrder || (() => {})}
                    onAddToCart={onAddToCart}
                    onEditClick={() => {}}
                    onDeleteClick={() => {}}
                    onReviewClick={onOpenReviews}
                    isAdmin={false}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* SUB-SECTION 1: PROMOTIONS PRODUCTS & BONUS SHOWCASE */}
        {section === 'promotions' && (
          <div className="p-3 sm:p-4 space-y-4">
            {/* Claimable Promotional Bonus Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fb7701] to-[#ff5000] text-white shadow-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-orange-100 uppercase">
                    {isBn ? 'বিশেষ প্রমোশনাল ওয়ালেট বোনাস' : 'Special Promotional Bonus'}
                  </div>
                  <div className="text-lg font-black">{formatMoney(250, language)}</div>
                </div>
              </div>
              <button
                type="button"
                disabled={claimedPromos.includes('PROMO_250') || claimingPromoId === 'PROMO_250'}
                onClick={() => void handleClaimBonus('PROMO_250')}
                className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer transition-all ${
                  claimedPromos.includes('PROMO_250')
                    ? 'bg-emerald-500 text-white cursor-default'
                    : 'bg-white text-[#fb7701] hover:bg-orange-50 shadow-md active:scale-95'
                }`}
              >
                {claimedPromos.includes('PROMO_250')
                  ? isBn
                    ? 'সংগ্রহ হয়েছে ✓'
                    : 'Claimed ✓'
                  : claimingPromoId === 'PROMO_250'
                  ? '...'
                  : isBn
                  ? 'বোনাস নিন'
                  : 'Claim Now'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#fb7701]" />
                <span>
                  {isBn ? 'প্রমোশন ও ডিসকাউন্টের সকল পণ্য' : isAr ? 'المنتجات الترويجية والعروض' : 'Promotional Sale Products'}
                </span>
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {toBengaliNumber(promoProducts.length, language)} {t('itemsCountLabel', language)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {promoProducts.map((prod) => (
                <ProductGridCard
                  key={prod.id}
                  product={prod}
                  language={language}
                  onProductClick={onOpenProductDetail}
                  onOrderClick={onQuickOrder || (() => {})}
                  onAddToCart={onAddToCart}
                  onEditClick={() => {}}
                  onDeleteClick={() => {}}
                  onReviewClick={onOpenReviews}
                  isAdmin={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* SUB-SECTION 2: WORKING CREDIT BALANCE & WALLET */}
        {section === 'wallet' && (
          <div className="p-3 sm:p-4 space-y-4">
            {/* Balance Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#0f1829] text-white shadow-xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#fb7701]" />
                  <span>{isBn ? 'সুরক্ষিত ক্রেডিট ব্যালেন্স' : isAr ? 'رصيد المحفظة المحمي' : 'Protected Credit Balance'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                  Active
                </span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {formatMoney(balance, language)}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isBn
                  ? 'অর্ডার করার সময় চেকআউট পেজ থেকে এই ক্রেডিট ব্যালেন্স ডিসকাউন্ট হিসেবে ব্যবহার করতে পারবেন। রিফান্ড ও প্রমো বোনাস এখানেই জমা হয়।'
                  : 'Apply this credit balance directly at checkout to lower your order total. Approved refunds and bonus credits are stored here safely.'}
              </p>
            </div>

            {/* Claimable Bonus Credits */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                {isBn ? 'উপলব্ধ ফ্রি ক্রেডিট বোনাস সংগ্রহ করুন' : 'Claim Available Bonus Credits'}
              </h3>

              {[
                {
                  id: 'PROMO_250' as const,
                  amount: 250,
                  titleBn: 'বিশেষ প্রমোশনাল বোনাস',
                  titleEn: 'Special Promotional Bonus'
                },
                {
                  id: 'WELCOME_100' as const,
                  amount: 100,
                  titleBn: 'ওয়েলকাম শপিং ক্রেডিট',
                  titleEn: 'Welcome Shopping Credit'
                },
                {
                  id: 'FREE_GIFT_50' as const,
                  amount: 50,
                  titleBn: 'আজকের ফ্রি উপহার বোনাস',
                  titleEn: "Today's Free Gift Bonus"
                }
              ].map((b) => {
                const isClaimed = claimedPromos.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {isBn ? b.titleBn : b.titleEn}
                      </div>
                      <div className="text-xs font-bold text-[#fb7701]">+{formatMoney(b.amount, language)}</div>
                    </div>
                    <button
                      type="button"
                      disabled={isClaimed || claimingPromoId === b.id}
                      onClick={() => void handleClaimBonus(b.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                        isClaimed
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 cursor-default'
                          : 'bg-[#fb7701] hover:bg-[#e65100] text-white shadow-xs'
                      }`}
                    >
                      {isClaimed
                        ? isBn
                          ? 'সংগ্রহ হয়েছে ✓'
                          : 'Claimed ✓'
                        : claimingPromoId === b.id
                        ? '...'
                        : isBn
                        ? 'সংগ্রহ করুন'
                        : 'Claim'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Transaction History */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                {isBn ? 'ওয়ালেট লেনদেনের ইতিহাস' : 'Credit History'}
              </h3>
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  {isBn
                    ? 'এখনো কোনো লেনদেন হয়নি। উপরের বোনাস সংগ্রহ করে শুরু করুন!'
                    : 'No wallet transactions yet. Claim a bonus above to get started!'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            tx.type === 'credit'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                              : 'bg-orange-100 dark:bg-orange-950 text-[#fb7701]'
                          }`}
                        >
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{tx.reason}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`font-black shrink-0 ${
                          tx.type === 'credit' ? 'text-emerald-600' : 'text-[#fb7701]'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {formatMoney(tx.amount, language)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
