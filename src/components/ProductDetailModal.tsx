import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import {
  SupportedLanguage,
  getCategoryName,
  getProductTitle,
  getProductDescription,
  resolveBaseLang,
  t
} from '../utils/i18n';
import { getProductRatingStats } from '../utils/reviews';
import {
  X,
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  Zap,
  ShoppingCart,
  CheckCircle2,
  Share2,
  Sparkles,
  Check
} from 'lucide-react';

interface ProductDetailModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onOrderNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenReviews: (product: Product) => void;
  language?: SupportedLanguage;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  product,
  onClose,
  onOrderNow,
  onAddToCart,
  onOpenReviews,
  language = 'bn'
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [product?.image]);

  if (!isOpen || !product) return null;

  const title = getProductTitle(product, language);
  const description = getProductDescription(product, language);
  const categoryName = getCategoryName(product.category, language);
  const stats = getProductRatingStats(product.id);
  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 40;

  const soldText = product.soldCount
    ? `${product.soldCount.replace(/\s*sold/i, '').trim()} ${t('sold', language)}`
    : `${toBengaliNumber('8.7', language)}K+ ${t('sold', language)}`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleAddAndNotify = () => {
    onAddToCart(product);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-3 max-h-[94vh] flex flex-col text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-3.5 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
            title={t('back', language)}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <span className="text-xs font-bold text-slate-300 truncate max-w-[180px] sm:max-w-[260px]">
            {categoryName}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title={t('share', language)}
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title={t('close', language)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* HD Product Image Showcase */}
          <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {!imageError && product.image ? (
              <img
                src={product.image}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400">
                <Sparkles className="w-12 h-12 mb-2 text-[#fb7701]" />
                <span className="text-sm font-semibold">{categoryName}</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className="bg-[#d9261c] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                -{toBengaliNumber(discountPercent, language)}%
              </span>
              <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>{t('freeDelivery', language)}</span>
              </span>
            </div>

            {/* Rating pill on image */}
            <button
              type="button"
              onClick={() => onOpenReviews(product)}
              className="absolute bottom-3 right-3 bg-black/80 hover:bg-black backdrop-blur-xs text-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{toBengaliNumber(stats.average, language)}</span>
              <span className="text-slate-300">
                ({toBengaliNumber(stats.count, language)} {t('reviewsCount', language)})
              </span>
            </button>
          </div>

          {/* Pricing & Sold status */}
          <div className="p-4 bg-orange-50/70 dark:bg-slate-800/80 rounded-2xl border border-orange-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-800 dark:text-slate-200 block font-bold">
                {t('specialForYou', language)}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-[#fb7701]">
                  {formatTaka(product.price, language)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-slate-500 dark:text-slate-400 line-through font-bold">
                    {formatTaka(product.originalPrice, language)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                {t('cashOnDelivery', language)}
              </span>
              <span className="text-[11px] text-slate-700 dark:text-slate-300 block mt-1 font-bold">
                {soldText}
              </span>
            </div>
          </div>

          {/* Product Title */}
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white leading-snug">
              {title}
            </h2>
          </div>

          {/* Product Full Description */}
          <div className="p-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {isBn
                ? 'পণ্যের বিবরণ ও বিস্তারিত:'
                : isAr
                ? 'وصف وتفاصيل المنتج:'
                : 'Product Description:'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
              {description}
            </p>
          </div>

          {/* Features list if available */}
          {product.features && product.features.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-950 dark:text-white">
                {isBn
                  ? 'বিশেষ বৈশিষ্ট্যসমূহ:'
                  : isAr
                  ? 'المميزات الرئيسية:'
                  : 'Key Features:'}
              </h4>
              <ul className="space-y-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery & Trust Reassurance */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="leading-tight font-medium">
                {t('cashOnDeliveryPromise', language)}
              </span>
            </div>

            <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center gap-2 text-sky-900 dark:text-sky-200">
              <Truck className="w-5 h-5 text-sky-600 shrink-0" />
              <span className="leading-tight font-medium">
                {t('deliveryGuarantee', language)}
              </span>
            </div>
          </div>

          {/* Added to cart toast notification */}
          {addedNotice && (
            <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg animate-in fade-in duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isBn
                  ? 'পণ্যটি সফলভাবে শপিং কার্টে যোগ হয়েছে!'
                  : isAr
                  ? 'تمت إضافة المنتج إلى سلة التسوق!'
                  : 'Item added to your shopping cart!'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Fixed Action Bar: Add to Cart + Order Now */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleAddAndNotify}
            className="py-3 px-3 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#fb7701] font-bold text-xs sm:text-sm rounded-2xl border-2 border-orange-300 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t('addToCartBtn', language)}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOrderNow(product);
            }}
            className="py-3 px-4 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:from-[#fa6c00] hover:to-[#ea4500] active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{t('quickOrder', language)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
