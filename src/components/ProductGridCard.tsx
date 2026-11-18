import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import {
  SupportedLanguage,
  getProductTitle,
  getProductDescription,
  getBadgeLabel,
  getCategoryName,
  resolveBaseLang,
  t
} from '../utils/i18n';
import { getProductRatingStats } from '../utils/reviews';
import { ShoppingBag, ShoppingCart, Edit3, Trash2, Star, Zap, Truck } from 'lucide-react';

interface ProductGridCardProps {
  product: Product;
  onOrderClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onEditClick: (product: Product) => void;
  onDeleteClick: (productId: string) => void;
  onReviewClick?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  isAdmin?: boolean;
  language?: SupportedLanguage;
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  onOrderClick,
  onAddToCart,
  onEditClick,
  onDeleteClick,
  onReviewClick,
  onProductClick,
  isAdmin = false,
  language = 'bn'
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [product.image]);
  const stats = getProductRatingStats(product.id);
  const displayTitle = getProductTitle(product, language);
  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 40;

  const fallbackSoldCount = ((product.id.charCodeAt(product.id.length - 1) * 37) % 3500) + 450;
  const soldText = product.soldCount
    ? `${product.soldCount.replace(/\s*sold/i, '').trim()} ${t('sold', language)}`
    : `${toBengaliNumber(fallbackSoldCount, language)}+ ${t('sold', language)}`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group text-slate-900 dark:text-slate-100">
      <div>
        {/* Product Image Box */}
        <div
          onClick={() => onProductClick && onProductClick(product)}
          className="relative aspect-square bg-[#f8f8f8] dark:bg-slate-800 overflow-hidden flex items-center justify-center cursor-pointer"
        >
          {!imageError && product.image ? (
            <img
              src={product.image}
              alt={displayTitle}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-orange-50/50 dark:bg-slate-800 text-orange-400">
              <ShoppingBag className="w-10 h-10 opacity-50 mb-1" />
              <span className="text-xs font-semibold text-center line-clamp-1">
                {getCategoryName(product.category, language)}
              </span>
            </div>
          )}

          {/* Top-Left Discount Badge */}
          <div className="absolute top-2 left-2 bg-[#d9261c] text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm pointer-events-none">
            <span>-{toBengaliNumber(discountPercent, language)}%</span>
          </div>

          {/* Top-Right Free Delivery Badge */}
          <div className="absolute top-2 right-2 bg-emerald-600/95 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 pointer-events-none">
            <Truck className="w-2.5 h-2.5 shrink-0" />
            <span>{t('freeDelivery', language)}</span>
          </div>

          {/* Floating Rating Tag on Image Bottom */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onReviewClick) onReviewClick(product);
            }}
            className="absolute bottom-2 left-2 bg-black/75 hover:bg-black/90 backdrop-blur-xs text-amber-300 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{toBengaliNumber(stats.average, language)}</span>
            <span className="text-[10px] text-slate-300">
              ({toBengaliNumber(stats.count, language)})
            </span>
          </button>

          {/* Stock Left tag */}
          {product.stockLeft && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none">
              {t('onlyLeft', language)}: {toBengaliNumber(product.stockLeft, language)}
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="p-3">
          {/* Tags row: 11.11 SALE / Local / Agent Verified */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="bg-[#d9261c] text-white text-[9px] font-black px-1 py-0.2 rounded">
              {getBadgeLabel('11.11 SALE', language)}
            </span>
            <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 text-[9px] font-bold px-1 py-0.2 rounded">
              {getBadgeLabel('Local', language)}
            </span>
            {product.sellerName && product.sellerName !== 'Marketplaces Official' && (
              <span className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-bold px-1 py-0.2 rounded">
                {product.sellerName}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onProductClick && onProductClick(product)}
            className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm line-clamp-2 mb-1 leading-snug group-hover:text-[#fb7701] transition-colors cursor-pointer"
          >
            {displayTitle}
          </h3>

          {/* Description snippet in selected language */}
          <p
            onClick={() => onProductClick && onProductClick(product)}
            className="text-[11px] text-slate-700 dark:text-slate-200 line-clamp-1 mb-1.5 leading-snug font-medium cursor-pointer"
          >
            {getProductDescription(product, language)}
          </p>

          {/* Price and Sold Count Row */}
          <div className="flex items-baseline justify-between gap-1 mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-[#fb7701]">
                {formatTaka(product.price, language)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-through font-bold">
                  {formatTaka(product.originalPrice, language)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold truncate">
              {soldText}
            </span>
          </div>

          {/* Admin editing actions */}
          {isAdmin && (
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between text-xs mb-2 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500">
                {t('navAdmin', language)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditClick(product)}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title={t('editProduct', language)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteClick(product.id)}
                  className="p-1 text-slate-500 hover:text-red-500 cursor-pointer"
                  title={t('deleteProduct', language)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Add to Cart & Buy Now */}
      <div className="p-3 pt-0 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onAddToCart && onAddToCart(product)}
          className="flex items-center justify-center gap-1 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#fb7701] text-xs font-bold py-2 px-1.5 rounded-xl border border-orange-200 dark:border-slate-700 transition-colors cursor-pointer"
          title={t('addToCartBtn', language)}
        >
          <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isBn ? '+ কার্ট' : t('addToCartBtn', language)}</span>
        </button>

        <button
          onClick={() => onOrderClick(product)}
          className="flex items-center justify-center gap-1 bg-[#fb7701] hover:bg-[#e65100] active:scale-95 text-white text-xs font-bold py-2 px-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
          <span className="truncate">{t('quickOrderBtn', language)}</span>
        </button>
      </div>
    </div>
  );
};
