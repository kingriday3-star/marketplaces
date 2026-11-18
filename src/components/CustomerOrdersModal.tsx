import React, { useState } from 'react';
import { Order, User, Product } from '../types';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  HelpCircle,
  MoreHorizontal,
  Package,
  MapPin,
  Phone,
  X
} from 'lucide-react';
import {
  SupportedLanguage,
  formatMoney,
  getDistrictLabel,
  getProductTitle,
  resolveBaseLang,
  t
} from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  orders: Order[];
  products?: Product[];
  onReorderProduct?: (productTitle: string) => void;
  language?: SupportedLanguage;
}

type OrderTab = 'all' | 'processing' | 'shipped' | 'delivered' | 'returns';

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  products = [],
  onReorderProduct,
  language = 'bn'
}) => {
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const findMatchedProduct = (ord: Order): Product | undefined => {
    return products.find(
      (p) =>
        (ord.productId && p.id === ord.productId) ||
        p.title === ord.productTitle ||
        p.titleEn === ord.productTitle
    );
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'processing' && ord.status !== 'pending') return false;
    if (activeTab === 'shipped' && ord.status !== 'confirmed') return false;
    if (activeTab === 'delivered' && ord.status !== 'delivered') return false;
    if (activeTab === 'returns' && ord.status !== 'cancelled') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.productTitle.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStepNumber = (status: Order['status'], trackingStep?: number): number => {
    if (status === 'delivered') return 4;
    if (status === 'confirmed') return trackingStep && trackingStep >= 2 ? trackingStep : 3;
    if (status === 'pending') return 2;
    return 1;
  };

  const dateLocale = isBn ? 'bn-BD' : isAr ? 'ar-SA' : 'en-GB';

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f4f4] dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans animate-in slide-in-from-right duration-200">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1 -ml-1 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title={t('back', language)}
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>

          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {t('myOrders', language)}
          </h1>

          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className="p-1 -mr-1 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title={t('search', language)}
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Search input slide down */}
        {showSearchInput && (
          <div className="max-w-xl mx-auto px-4 pb-2.5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isBn
                    ? 'অর্ডার নম্বর বা পণ্য দিয়ে খুঁজুন...'
                    : isAr
                    ? 'ابحث برقم الطلب أو اسم المنتج...'
                    : 'Search by item name or order ID...'
                }
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full border border-slate-200 dark:border-slate-700 outline-none focus:border-[#fb7701]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="max-w-xl mx-auto flex items-center justify-between px-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/80">
          {[
            { id: 'all' as OrderTab, bn: 'সকল অর্ডার', ar: 'جميع الطلبات', en: 'All orders' },
            { id: 'processing' as OrderTab, bn: 'প্রসেসিং', ar: 'قيد المعالجة', en: 'Processing' },
            { id: 'shipped' as OrderTab, bn: 'শিপড', ar: 'تم الشحن', en: 'Shipped' },
            { id: 'delivered' as OrderTab, bn: 'ডেলিভার্ড', ar: 'تم التوصيل', en: 'Delivered' },
            { id: 'returns' as OrderTab, bn: 'রিটার্ন/বাতিল', ar: 'المرتجعات', en: 'Returns' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-2 text-center text-xs sm:text-[13px] font-bold relative transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-slate-950 dark:text-white font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {isBn ? tab.bn : isAr ? tab.ar : tab.en}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-slate-950 dark:bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto max-w-xl w-full mx-auto p-3 sm:p-4 space-y-3 pb-24">
        {/* Green Order Guarantee Strip */}
        <div
          onClick={() => setShowRefundModal(true)}
          className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-xs cursor-pointer hover:bg-emerald-100/70 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 min-w-0">
            <span className="flex items-center gap-1 font-black shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('deliveryGuarantee', language)}</span>
            </span>
            <span className="text-emerald-300 dark:text-emerald-700">|</span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
              {isBn
                ? 'দেরি হলে ক্ষতিপূরণ • ক্ষতিগ্রস্ত হলে রিটার্ন • ৫০ দিন ফ্রি রিটার্ন'
                : isAr
                ? 'تعويض التأخير • استرجاع مجاني لمدة 50 يوماً'
                : 'Credit for delay • Return if damaged • 50-day free return'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 my-4 shadow-xs">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isBn
                ? 'এই ক্যাটাগরিতে কোনো অর্ডার পাওয়া যায়নি'
                : isAr
                ? 'لم يتم العثور على طلبات في هذا القسم'
                : 'No orders found in this section'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isBn
                ? 'হোমে ফিরে গিয়ে আপনার পছন্দের পণ্য অর্ডার করুন।'
                : isAr
                ? 'تصفح المتجر لاكتشاف منتجاتك المفضلة.'
                : 'Browse our store to find your favorite products.'}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 bg-[#fb7701] hover:bg-[#e65100] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              {isBn ? 'শপিং শুরু করুন' : isAr ? 'ابدأ التسوق' : 'Start shopping'}
            </button>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isDelivered = ord.status === 'delivered';
            const isCanceled = ord.status === 'cancelled';
            const formattedDate = new Date(ord.createdAt || Date.now()).toLocaleDateString(dateLocale, {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            const matchedProduct = findMatchedProduct(ord);
            const displayProductTitle = matchedProduct
              ? getProductTitle(matchedProduct, language)
              : ord.productTitle;
            const thumbImage = matchedProduct?.image;
            const hasThumbError = thumbErrors[ord.id];

            return (
              <div
                key={ord.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                {/* Status Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
                    {isDelivered
                      ? isBn
                        ? `${formattedDate}-এ ডেলিভার্ড`
                        : isAr
                        ? `تم التوصيل في ${formattedDate}`
                        : `Delivered on ${formattedDate}`
                      : isCanceled
                      ? isBn
                        ? 'অর্ডার বাতিল'
                        : isAr
                        ? 'تم الإلغاء'
                        : 'Canceled'
                      : ord.status === 'confirmed'
                      ? isBn
                        ? 'অন দ্য ওয়ে • ট্রানজিটে রয়েছে'
                        : isAr
                        ? 'تم الشحن • في الطريق'
                        : 'Shipped • In transit'
                      : isBn
                      ? 'প্রক্রিয়াধীন (Processing)'
                      : isAr
                      ? 'قيد المعالجة'
                      : 'Processing'}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    #{ord.id.slice(-6)}
                  </span>
                </div>

                {/* Product Row with Real Matched Product Thumbnail + Package Fallback */}
                <div
                  className="flex items-center justify-between gap-3 cursor-pointer"
                  onClick={() => setSelectedTrackingOrder(ord)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center">
                      {thumbImage && !hasThumbError ? (
                        <img
                          src={thumbImage}
                          alt={displayProductTitle}
                          className="w-full h-full object-cover"
                          onError={() =>
                            setThumbErrors((prev) => ({ ...prev, [ord.id]: true }))
                          }
                        />
                      ) : (
                        <Package className="w-7 h-7 text-slate-400" />
                      )}
                      {ord.quantity > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-black px-1 rounded">
                          x{toBengaliNumber(ord.quantity, language)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {displayProductTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {getDistrictLabel(ord.district, language)}
                      </p>
                    </div>
                  </div>

                  {/* Price & Items Count on Right */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      <span>{formatMoney(ord.totalAmount, language)}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      {toBengaliNumber(ord.quantity || 1, language)} {t('itemsCountLabel', language)}
                    </div>
                  </div>
                </div>

                {/* Canceled Refund Detail */}
                {isCanceled && (
                  <div className="bg-[#fffbf6] dark:bg-amber-950/20 border border-orange-200/80 dark:border-amber-900/40 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 font-extrabold text-[12px]">
                      <span>
                        {isBn
                          ? 'ক্যাশ অন ডেলিভারি আইটেম বাতিল। রিফান্ড ইস্যু হয়েছে'
                          : isAr
                          ? 'تم إلغاء الطلب وإصدار الاسترداد'
                          : 'Cash on Delivery items canceled. Refund issued'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    {ord.cancelReason && (
                      <p className="text-[11px] font-bold text-red-600 dark:text-red-400">
                        {isBn ? 'বাতিলের কারণ:' : isAr ? 'سبب الإلغاء:' : 'Reason:'} {ord.cancelReason}
                      </p>
                    )}
                    <p className="text-[11px] text-orange-800/90 dark:text-orange-300 leading-relaxed">
                      {formatMoney(ord.totalAmount, language)}{' '}
                      {isBn
                        ? 'ক্রেডিট ব্যালেন্স এই বাতিলকৃত অর্ডারের বিপরীতে ইস্যু করা হয়েছে।'
                        : isAr
                        ? 'تمت إضافته إلى رصيدك لهذا الإلغاء.'
                        : 'credit has been issued to your account for this cancellation.'}
                    </p>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-orange-100 dark:border-slate-700 font-semibold text-[11px] flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">
                        {isBn
                          ? 'মোট রিফান্ড পরিমাণ:'
                          : isAr
                          ? 'إجمالي مبلغ الاسترداد:'
                          : 'Total refund amount:'}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatMoney(ord.totalAmount, language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                        <span>💳 {isBn ? 'ক্রেডিট ব্যালেন্স' : isAr ? 'رصيد الحساب' : 'Credit balance'}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {formatMoney(ord.totalAmount, language)} ({isBn ? 'ক্রেডিট' : isAr ? 'رصيد' : 'Credit'})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      {isBn ? 'অনুরোধের সময়:' : isAr ? 'تاريخ الطلب:' : 'Requested on'} {formattedDate}
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() =>
                      showToast(
                        isBn
                          ? `অর্ডার #${ord.id.slice(-6)} বিস্তারিত প্রস্তুত`
                          : isAr
                          ? `تفاصيل الطلب #${ord.id.slice(-6)}`
                          : `Order #${ord.id.slice(-6)} details loaded.`
                      )
                    }
                    className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="More"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedTrackingOrder(ord)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-full border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isBn ? 'ট্র্যাক করুন' : isAr ? 'تتبع الطلب' : 'Track order'}
                  </button>

                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-full border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isCanceled
                      ? isBn
                        ? 'রিফান্ড বিবরণ'
                        : isAr
                        ? 'تفاصيل الاسترداد'
                        : 'Refund details'
                      : isBn
                      ? 'রিটার্ন/রিফান্ড'
                      : isAr
                      ? 'إرجاع/استرداد'
                      : 'Return/Refund'}
                  </button>

                  <button
                    onClick={() => {
                      if (onReorderProduct) {
                        onReorderProduct(ord.productTitle);
                      }
                      showToast(
                        isBn
                          ? 'পণ্যটি পুনরায় কার্টে যোগ করা হয়েছে!'
                          : isAr
                          ? 'تمت إعادة إضافة المنتج إلى السلة!'
                          : 'Item re-added to your cart!'
                      );
                    }}
                    className="px-4 py-1.5 text-xs font-black text-white bg-[#fb7701] hover:bg-[#e65100] rounded-full shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    {isBn ? 'আবার কিনুন' : isAr ? 'اشترِ مجدداً' : 'Buy this again'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Live Tracking Modal */}
      {selectedTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#fb7701]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t('orderTracking', language)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrackingOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4-Step Visual Progress Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="truncate pr-2">
                  {findMatchedProduct(selectedTrackingOrder)
                    ? getProductTitle(findMatchedProduct(selectedTrackingOrder)!, language)
                    : selectedTrackingOrder.productTitle}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black shrink-0">
                  {toBengaliNumber(
                    getStepNumber(selectedTrackingOrder.status, selectedTrackingOrder.trackingStep),
                    language
                  )}
                  /{toBengaliNumber(4, language)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                {[
                  { step: 1, label: t('trackStep1', language) },
                  { step: 2, label: t('trackStep2', language) },
                  { step: 3, label: t('trackStep3', language) },
                  { step: 4, label: t('trackStep4', language) }
                ].map((s) => {
                  const active =
                    getStepNumber(
                      selectedTrackingOrder.status,
                      selectedTrackingOrder.trackingStep
                    ) >= s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 shadow-xs ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {active ? '✓' : toBengaliNumber(s.step, language)}
                      </div>
                      <span className="line-clamp-2">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery address & Courier Info */}
            <div className="text-xs space-y-2 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{t('deliveryAddress', language)}: </span>
                  <span>
                    {selectedTrackingOrder.deliveryAddress},{' '}
                    {getDistrictLabel(selectedTrackingOrder.district, language)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="font-bold">{t('customerPhone', language)}: </span>
                  <span className="font-mono">{selectedTrackingOrder.customerPhone}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrackingOrder(null)}
              className="w-full py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              {t('close', language)}
            </button>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {isBn
                    ? 'রিফান্ড ও রিটার্ন প্রটেকশন'
                    : isAr
                    ? 'حماية الاسترجاع والاسترداد'
                    : 'Refund & Return Protection'}
                </span>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isBn
                ? 'Market places-এর ৫০ দিনের ফ্রি রিটার্ন পলিসি অনুযায়ী পণ্য হাতে পাওয়ার পর যেকোনো কারণে সম্পূর্ণ রিফান্ড বা পণ্য পরিবর্তন করতে পারবেন।'
                : isAr
                ? 'تقدم Market places سياسة إرجاع مجانية لمدة 50 يوماً. إذا كان المنتج تالفاً أو متأخراً، ستحصل على استرداد كامل.'
                : 'Market places offers 50-day free returns. If your item is damaged or delayed, you receive a full credit balance refund.'}
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold space-y-1">
              <div>
                ✔{' '}
                {isBn
                  ? 'ডেলিভারিতে বিলম্ব হলে ক্রেডিট রিফান্ড'
                  : isAr
                  ? 'تعويض عند تأخر التوصيل'
                  : 'Credit for delivery delays'}
              </div>
              <div>
                ✔{' '}
                {isBn
                  ? 'ক্ষতিগ্রস্ত হলে বিনামূল্যে রিটার্ন ও পিকআপ'
                  : isAr
                  ? 'إرجاع واستلام مجاني للمنتجات التالفة'
                  : 'Free return & home pickup for damaged items'}
              </div>
              <div>
                ✔{' '}
                {isBn
                  ? 'ইনস্ট্যান্ট ওয়ালেট রিফান্ড ট্রান্সফার'
                  : isAr
                  ? 'تحويل فوري لرصيد المحفظة'
                  : 'Instant credit balance deposit'}
              </div>
            </div>
            <button
              onClick={() => setShowRefundModal(false)}
              className="w-full py-2 bg-[#fb7701] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {isBn ? 'বুঝেছি' : isAr ? 'فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in duration-200 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-[#fb7701]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
