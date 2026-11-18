import React, { useState } from 'react';
import { Product } from '../types';
import { formatTaka, toBengaliNumber, buildWhatsAppOrderUrl } from '../utils/bengali';
import { getProductRatingStats, getProductReviews } from '../utils/reviews';
import { SupportedLanguage, t } from '../utils/i18n';
import {
  Phone,
  MessageCircle,
  ShoppingBag,
  Edit3,
  Trash2,
  CheckCircle,
  ShieldCheck,
  Copy,
  Check,
  Star,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOrderClick: (product: Product) => void;
  onEditClick: (product: Product) => void;
  onDeleteClick: (productId: string) => void;
  onReviewClick?: (product: Product) => void;
  isAdmin?: boolean;
  compact?: boolean;
  language?: SupportedLanguage;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOrderClick,
  onEditClick,
  onDeleteClick,
  onReviewClick,
  isAdmin = false,
  compact = false,
  language = 'bn'
}) => {
  const [imageError, setImageError] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const stats = getProductRatingStats(product.id);
  const reviews = getProductReviews(product.id);
  const latestReview = reviews.length > 0 ? reviews[0] : null;

  const whatsappUrl = buildWhatsAppOrderUrl(product.whatsappNumber || product.sellerPhone, product.title, product.price);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(product.sellerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const isStacked = compact;

  return (
    <div className={`product-card group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-200 flex flex-col ${
      isStacked ? '' : 'sm:flex-row-reverse'
    } overflow-hidden mb-6 text-slate-900 dark:text-slate-100`}>
      
      {/* ডান পাশের সেকশন (ছবি ও টাইটেল) - Right Section */}
      <div className={`right-section ${isStacked ? 'w-full' : 'sm:w-5/12 sm:border-l'} bg-slate-50/70 dark:bg-slate-800/40 p-5 sm:p-6 flex flex-col items-center justify-center border-b sm:border-b-0 border-slate-200/80 dark:border-slate-800 text-center relative`}>
        {/* Subtle Category & Badge */}
        <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="text-slate-600 dark:text-slate-400">{product.category}</span>
          {product.badge && (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
              {product.badge}
            </span>
          )}
        </div>

        {/* Product Image with Fallback */}
        <div className="w-full max-w-[240px] aspect-[4/3] rounded-lg overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-xs mb-3 flex items-center justify-center">
          {!imageError && product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400">
              <ShoppingBag className="w-10 h-10 mb-1 opacity-60 text-slate-600 dark:text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">{product.category}</span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <h2 className="product-title text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight mb-1.5 max-w-sm">
          {product.title}
        </h2>

        {/* Rating Star Badge under title */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= Math.round(stats.average)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {stats.average}
          </span>
          <button
            onClick={() => onReviewClick && onReviewClick(product)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 underline underline-offset-2 ml-1"
          >
            ({toBengaliNumber(stats.count)} রিভিউ)
          </button>
        </div>

        {/* Stock & Unit indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            {product.stockStatus === 'limited' ? 'সীমিত স্টক আছে' : 'স্টকে এভেইলেবল'}
          </span>
          {product.unit && (
            <>
              <span aria-hidden="true">·</span>
              <span>প্রতি {product.unit}</span>
            </>
          )}
        </div>

        {/* Quick Edit/Delete Actions for store manager (Admin only) */}
        {isAdmin && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 w-full flex items-center justify-center gap-3 text-xs text-slate-400">
            <button
              onClick={() => onEditClick(product)}
              className="flex items-center gap-1 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors py-1 px-2 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              title="তথ্য সম্পাদনা করুন"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => onDeleteClick(product.id)}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
              title="পণ্য মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছুন</span>
            </button>
          </div>
        )}
      </div>

      {/* বাম পাশের সেকশন (দাম, ফোন নম্বর ও বিবরণ) - Left Section in row-reverse */}
      <div className={`left-section ${isStacked ? 'w-full' : 'sm:w-7/12'} p-5 sm:p-7 flex flex-col justify-between`}>
        <div>
          {/* Price Tag with optional discount */}
          <div className="price-tag flex items-baseline gap-2.5 mb-2.5">
            <span className="text-2xl font-black text-[#fb7701] tracking-tight">
              মূল্য: {formatTaka(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm line-through text-slate-400 dark:text-slate-500 font-medium">
                {formatTaka(product.originalPrice)}
              </span>
            )}
            {product.originalPrice && (
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                ছাড়: {formatTaka(product.originalPrice - product.price)}
              </span>
            )}
          </div>

          {/* Seller Phone Section with direct tel and copy action */}
          <div className="seller-phone flex items-center flex-wrap gap-2 text-sm sm:text-base text-[#fb7701] font-medium mb-3">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold">
              <Phone className="w-4 h-4 text-[#fb7701]" />
              কল করুন:
            </span>
            <a
              href={`tel:${product.sellerPhone}`}
              className="text-[#fb7701] hover:text-[#fa6000] font-black tracking-wide transition-colors"
            >
              {toBengaliNumber(product.sellerPhone)}
            </a>
            <button
              onClick={handleCopyPhone}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title="নম্বর কপি করুন"
            >
              {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Product Description */}
          <p className="product-description text-slate-600 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-4">
            {product.description}
          </p>

          {/* Key Features Bullet list */}
          {product.features && product.features.length > 0 && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          )}

          {/* Customer Reviews Section directly inside Card */}
          <div className="mb-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  ক্রেতাদের মতামত ও রিভিউ
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-100/70 dark:bg-amber-900/40 px-1.5 py-0.2 rounded">
                  ★ {stats.average} / ৫
                </span>
              </div>

              <button
                type="button"
                onClick={() => onReviewClick && onReviewClick(product)}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
              >
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>রিভিউ ও ৫-স্টার দিন</span>
              </button>
            </div>

            {latestReview ? (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>{latestReview.userName}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ ভেরিফাইড</span>
                  </span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= latestReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="line-clamp-2 italic text-[11px] text-slate-600 dark:text-slate-400">
                  "{latestReview.comment}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                এখনও কোনো রিভিউ যুক্ত হয়নি। প্রথম মতামত দিন!
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons: WhatsApp direct order + Cash on Delivery */}
        <div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Main WhatsApp order button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="buy-btn inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa4f] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm sm:text-base text-center"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20" />
              <span>হোয়াটসঅ্যাপে অর্ডার করুন</span>
            </a>

            {/* Instant Cash on Delivery / সরাসরি অর্ডার বাটন */}
            <button
              onClick={() => onOrderClick(product)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:from-[#fa6c00] hover:to-[#ea4500] text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm text-center"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ক্যাশ অন ডেলিভারি অর্ডার</span>
            </button>
          </div>

          {/* Trust marker */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন</span>
          </div>
        </div>
      </div>

    </div>
  );
};
