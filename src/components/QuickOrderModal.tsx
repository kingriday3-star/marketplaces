import React, { useState } from 'react';
import type { Product, Order, User, OrderLocation } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import { DISTRICTS } from '../data/initialProducts';
import {
  SupportedLanguage,
  t,
  getProductTitle,
  getProductDescription,
  getDistrictLabel,
  resolveBaseLang
} from '../utils/i18n';
import {
  X,
  ArrowLeft,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
  Navigation,
  ExternalLink,
  LocateFixed,
  AlertCircle
} from 'lucide-react';

interface QuickOrderModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: (order: Order) => void;
  currentUser?: User | null;
  walletBalance?: number;
  walletKey?: string;
  language?: SupportedLanguage;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  product,
  onClose,
  onSuccess,
  currentUser,
  walletBalance = 0,
  walletKey = 'guest-default',
  language = 'bn'
}) => {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.type === 'phone' ? currentUser.identifier : ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [useWalletCredit, setUseWalletCredit] = useState(false);

  // GPS Location Tracking State
  const [detectedLocation, setDetectedLocation] = useState<OrderLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  // Delivery charge logic: 80 for Dhaka, 130 for outside Dhaka
  const deliveryCharge = district.includes('ঢাকার ভিতরে') ? 80 : 130;
  const subtotal = product.price * quantity;
  const rawTotal = subtotal + deliveryCharge;
  const creditApplied = useWalletCredit && walletBalance > 0 ? Math.min(walletBalance, rawTotal) : 0;
  const totalAmount = Math.max(0, rawTotal - creditApplied);

  // Handle GPS detection
  const handleDetectGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg({
        text: isBn
          ? 'আপনার ব্রাউজারে জিপিএস সুবিধা সমর্থিত নয়। দয়া করে নিচে ঠিকানা লিখুন।'
          : isAr
          ? 'خدمة تحديد المواقع غير مدعومة في متصفحك. يرجى كتابة العنوان يدوياً.'
          : 'GPS is not supported in your browser. Please enter your delivery address manually.',
        isError: true
      });
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatusMsg({ text: t('gpsDetecting', language) });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        const loc: OrderLocation = {
          lat,
          lng,
          accuracy,
          mapUrl
        };

        setDetectedLocation(loc);
        setIsDetectingLocation(false);
        setLocationStatusMsg({
          text: `${t('gpsSuccess', language)} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        });

        if (!deliveryAddress.trim()) {
          setDeliveryAddress(`[GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}] `);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        let errorText = isBn
          ? 'লোকেশন পাওয়া যায়নি। ব্রাউজারের লোকেশন পারমিশন এলাউ করুন।'
          : isAr
          ? 'تعذر الحصول على الموقع. يرجى تفعيل إذن الموقع أو كتابة العنوان.'
          : 'Unable to fetch location. Please allow permission or enter your address manually.';
        if (error.code === error.PERMISSION_DENIED) {
          errorText = isBn
            ? 'লোকেশন পারমিশন বন্ধ আছে। অনুগ্রহ করে পারমিশন চালু করুন অথবা সরাসরি ঠিকানা লিখুন।'
            : isAr
            ? 'تم رفض إذن الموقع. يرجى تفعيله من الإعدادات أو كتابة العنوان.'
            : 'Location permission denied. Enable location access or type your address.';
        }
        setLocationStatusMsg({ text: errorText, isError: true });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Instantaneous zero-lag order submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError(
        isBn
          ? 'অনুগ্রহ করে আপনার নাম লিখুন'
          : isAr
          ? 'يرجى إدخال اسمك الكامل'
          : 'Please enter your full name'
      );
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setFormError(
        isBn
          ? 'সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)'
          : isAr
          ? 'يرجى إدخال رقم هاتف صحيح'
          : 'Please enter a valid mobile phone number'
      );
      return;
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      setFormError(
        isBn
          ? 'অনুগ্রহ করে বিস্তারিত ডেলিভারি ঠিকানা প্রদান করুন'
          : isAr
          ? 'يرجى إدخال عنوان التوصيل بالتفصيل'
          : 'Please enter your detailed delivery address'
      );
      return;
    }

    setSubmitting(true);

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price,
      quantity,
      deliveryCharge,
      totalAmount,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      district,
      notes: notes.trim(),
      paymentMethod: 'cod',
      status: 'pending',
      trackingStep: 1,
      location: detectedLocation
        ? {
            ...detectedLocation,
            address: `${deliveryAddress.trim()}, ${district}`
          }
        : undefined,
      createdAt: new Date().toISOString(),
      customerId: currentUser?.id,
      creditUsed: creditApplied > 0 ? creditApplied : undefined,
      walletKey: creditApplied > 0 ? walletKey : undefined
    };

    // Zero artificial delay: deliver instantaneously to real-time sync + admin
    onSuccess(newOrder);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title={t('back', language)}
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              {t('quickOrder', language)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={t('close', language)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Summary Bar */}
        <div className="p-4 sm:p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-100/60 dark:border-emerald-800/40 flex items-center gap-4">
          <img
            src={product.image}
            alt={getProductTitle(product, language)}
            className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1">
              {getProductTitle(product, language)}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {getProductDescription(product, language)}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('price', language)}:{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatTaka(product.price, language)}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>{isBn ? 'পরিমাণ:' : isAr ? 'الكمية:' : 'Quantity:'}</span>
              <div className="inline-flex items-center border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900 dark:text-white">
                  {toBengaliNumber(quantity, language)}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2.5 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('customerName', language)}</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={isBn ? 'যেমন: মোঃ সাকিব হোসেন' : isAr ? 'أدخل اسمك الكامل' : 'e.g. Full Name'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('customerPhone', language)}</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="017xxxxxxxx / +880..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('deliveryArea', language)}</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {DISTRICTS.map((dist, idx) => (
                  <option key={idx} value={dist}>
                    {getDistrictLabel(dist, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('orderNotes', language)}
              </label>
              <input
                type="text"
                placeholder={isBn ? 'যেমন: সাইজ L, বিশেষ সময়' : isAr ? 'مثال: المقاس أو الموعد' : 'e.g. Size, time'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* GPS Location Tracker */}
          <div className="bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
              <div className="flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-[#0284c7] dark:text-sky-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {t('gpsDetectLocation', language)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDetectGPSLocation}
                disabled={isDetectingLocation}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Navigation
                  className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`}
                />
                <span>
                  {isDetectingLocation
                    ? t('gpsDetecting', language)
                    : t('gpsDetectLocation', language)}
                </span>
              </button>
            </div>

            {locationStatusMsg && (
              <div
                className={`text-xs p-2 rounded-lg mt-1 font-medium ${
                  locationStatusMsg.isError
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-sky-100/70 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700'
                }`}
              >
                {locationStatusMsg.text}
              </div>
            )}

            {detectedLocation && (
              <div className="mt-2.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-sky-200 dark:border-sky-700/60 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">GPS: </span>
                    <span>
                      {detectedLocation.lat.toFixed(5)}, {detectedLocation.lng.toFixed(5)}
                    </span>
                  </div>
                </div>
                <a
                  href={detectedLocation.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0 bg-sky-50 dark:bg-sky-950/60 px-2 py-1 rounded"
                >
                  <span>{t('viewOnMap', language)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('deliveryAddress', language)}</span> <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder={
                isBn
                  ? 'যেমন: বাড়ি ১২, রোড ৫, সেক্টর ৩, উত্তরা, ঢাকা'
                  : isAr
                  ? 'مثال: الشارع، الحي، رقم المنزل، المدينة'
                  : 'e.g. House 12, Road 5, Sector 3, City'
              }
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Apply Credit Balance Toggle */}
          {walletBalance > 0 && (
            <label className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 cursor-pointer text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isBn
                  ? `ওয়ালেট ক্রেডিট ব্যবহার করুন (${formatTaka(walletBalance, language)})`
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

          {/* Pricing Summary */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>
                {t('subtotal', language)} ({toBengaliNumber(quantity, language)})
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatTaka(subtotal, language)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>{t('deliveryCharge', language)}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatTaka(deliveryCharge, language)}
              </span>
            </div>
            {creditApplied > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>{isBn ? 'ক্রেডিট ডিসকাউন্ট' : 'Credit Applied'}</span>
                <span>-{formatTaka(creditApplied, language)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
              <span>{t('totalAmount', language)}</span>
              <span className="text-base text-emerald-600 dark:text-emerald-400 font-black">
                {formatTaka(totalAmount, language)}
              </span>
            </div>
          </div>

          {/* Trust reassurance */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('cashOnDeliveryPromise', language)}</span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('close', language)}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('confirmOrder', language)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
