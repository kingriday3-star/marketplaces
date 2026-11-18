import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import {
  SupportedLanguage,
  t,
  getProductTitle,
  getDistrictLabel,
  resolveBaseLang
} from '../utils/i18n';
import {
  X,
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  MapPin,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { DISTRICTS } from '../data/initialProducts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckoutSuccess: (order: Order) => void;
  walletBalance?: number;
  walletKey?: string;
  language?: SupportedLanguage;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckoutSuccess,
  walletBalance = 0,
  walletKey = 'guest-default',
  language = 'bn'
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [useWalletCredit, setUseWalletCredit] = useState(false);

  if (!isOpen) return null;

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = selectedDistrict.includes('ঢাকার ভিতরে') ? 60 : 120;
  const rawTotal = subtotal > 0 ? subtotal + deliveryCharge : 0;
  const creditApplied = useWalletCredit && walletBalance > 0 ? Math.min(walletBalance, rawTotal) : 0;
  const totalAmount = Math.max(0, rawTotal - creditApplied);

  const handleGetLocation = () => {
    setFormError('');
    if (!navigator.geolocation) {
      setFormError(
        isBn
          ? 'আপনার ডিভাইসে জিপিএস সুবিধা নেই। অনুগ্রহ করে ঠিকানা লিখে দিন।'
          : isAr
          ? 'جهازك لا يدعم GPS. يرجى كتابة العنوان يدوياً.'
          : 'GPS is not supported on your device. Please type your address.'
      );
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
        setFormError(
          isBn
            ? 'লোকেশন পাওয়া যায়নি। অনুগ্রহ করে ঠিকানায় বিস্তারিত লিখে দিন।'
            : isAr
            ? 'لم يتم العثور على الموقع. يرجى إدخال العنوان بالتفصيل.'
            : 'Unable to fetch GPS location. Please type your delivery address.'
        );
      },
      { timeout: 8000 }
    );
  };

  // Instantaneous zero-lag cart checkout
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setFormError(
        isBn
          ? 'দয়া করে আপনার নাম, ফোন নম্বর এবং সম্পূর্ণ ঠিকানা লিখুন।'
          : isAr
          ? 'يرجى كتابة الاسم ورقم الهاتف والعنوان بالكامل.'
          : 'Please enter your name, phone number, and complete delivery address.'
      );
      return;
    }

    setOrderSubmitting(true);

    const firstTitle = getProductTitle(cartItems[0].product, language);
    const extraCount = cartItems.length - 1;
    const summaryTitle =
      cartItems.length === 1
        ? cartItems[0].product.title
        : isBn
        ? `${firstTitle} এবং আরও ${toBengaliNumber(extraCount, language)}টি পণ্য`
        : `${firstTitle} + ${extraCount} more`;

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      productId: cartItems[0]?.product.id || 'cart-order',
      productTitle: summaryTitle,
      productPrice: subtotal,
      quantity: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      deliveryCharge,
      totalAmount,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      district: selectedDistrict,
      paymentMethod: 'cod',
      status: 'pending',
      trackingStep: 1,
      createdAt: new Date().toISOString(),
      creditUsed: creditApplied > 0 ? creditApplied : undefined,
      walletKey: creditApplied > 0 ? walletKey : undefined,
      location: location
        ? {
            lat: location.lat,
            lng: location.lng,
            address: deliveryAddress.trim(),
            mapUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`
          }
        : undefined
    };

    onCheckoutSuccess(newOrder);
    onClearCart();
    setOrderSubmitting(false);
    setIsCheckingOut(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title={t('back', language)}
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <ShoppingBag className="w-5 h-5 text-[#fb7701] shrink-0" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('shoppingCart', language)} ({toBengaliNumber(cartItems.length, language)})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('close', language)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {isBn
                  ? 'আপনার কার্ট খালি রয়েছে'
                  : isAr
                  ? 'سلتك فارغة حالياً'
                  : 'Your cart is empty'}
              </h4>
              <p className="text-xs text-slate-400">
                {isBn
                  ? 'পছন্দের পণ্য বেছে নিয়ে কার্টে যোগ করুন।'
                  : isAr
                  ? 'اختر منتجاتك المفضلة وأضفها إلى السلة.'
                  : 'Pick your favorite items and add them to cart.'}
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#fb7701] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
              >
                {isBn ? 'শপিং চালিয়ে যান' : isAr ? 'متابعة التسوق' : 'Continue Shopping'}
              </button>
            </div>
          ) : !isCheckingOut ? (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-xs"
                >
                  <img
                    src={item.product.image}
                    alt={getProductTitle(item.product, language)}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {getProductTitle(item.product, language)}
                    </h5>
                    <span className="text-xs font-bold text-[#fb7701] block mt-0.5">
                      {formatTaka(item.product.price, language)}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold font-mono px-1">
                        {toBengaliNumber(item.quantity, language)}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handlePlaceOrder} className="space-y-3 animate-in fade-in">
              {formError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('cashOnDeliveryPromise', language)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t('customerName', language)} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isBn ? 'পুরো নাম' : isAr ? 'الاسم الكامل' : 'Full Name'}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#fb7701]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t('customerPhone', language)} *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#fb7701]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t('deliveryArea', language)}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#fb7701]"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {getDistrictLabel(d, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t('deliveryAddress', language)} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={
                    isBn
                      ? 'বাড়ি/রোড নং, এলাকা, থানা...'
                      : isAr
                      ? 'رقم المنزل، الشارع، الحي، المدينة...'
                      : 'House/Road No, Area, City...'
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#fb7701]"
                />
              </div>

              {/* GPS Auto location */}
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  location
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>
                  {gettingLocation
                    ? t('gpsDetecting', language)
                    : location
                    ? `✓ ${t('gpsSuccess', language)}`
                    : t('gpsDetectLocation', language)}
                </span>
              </button>

              {/* Apply Credit Balance Toggle */}
              {walletBalance > 0 && (
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 cursor-pointer text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isBn
                      ? `ক্রেডিট ব্যালেন্স ব্যবহার করুন (${formatTaka(walletBalance, language)})`
                      : `Apply Credit Balance (${formatTaka(walletBalance, language)})`}
                  </span>
                  <input
                    type="checkbox"
                    checked={useWalletCredit}
                    onChange={(e) => setUseWalletCredit(e.target.checked)}
                    className="w-4 h-4 accent-[#fb7701] cursor-pointer"
                  />
                </label>
              )}

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{t('subtotal', language)}</span>
                  <span>{formatTaka(subtotal, language)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{t('deliveryCharge', language)}</span>
                  <span>{formatTaka(deliveryCharge, language)}</span>
                </div>
                {creditApplied > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>{isBn ? 'ক্রেডিট ডিসকাউন্ট' : 'Credit Applied'}</span>
                    <span>-{formatTaka(creditApplied, language)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>{t('totalAmount', language)}</span>
                  <span className="text-[#fb7701]">{formatTaka(totalAmount, language)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t('back', language)}
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="flex-1 py-2.5 bg-[#fb7701] hover:bg-[#e65100] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('confirmOrder', language)}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with totals */}
        {cartItems.length > 0 && !isCheckingOut && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>{t('subtotal', language)}</span>
              <span className="font-bold">{formatTaka(subtotal, language)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>{t('deliveryCharge', language)}</span>
              <span className="font-bold">{formatTaka(deliveryCharge, language)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>{t('totalAmount', language)}</span>
              <span className="text-[#fb7701]">{formatTaka(totalAmount, language)}</span>
            </div>

            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full py-3 bg-[#fb7701] hover:bg-[#e65100] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isBn
                  ? 'ক্যাশ অন ডেলিভারিতে চেকআউট'
                  : isAr
                  ? 'إتمام الشراء (الدفع عند الاستلام)'
                  : 'Proceed to Checkout (COD)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
