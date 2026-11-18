import React, { useState } from 'react';
import { CartItem, Product } from '../types';
import {
  ArrowLeft,
  List,
  Trash2,
  ShieldCheck,
  Lock,
  Truck,
  Check,
  ChevronDown,
  ShoppingCart,
  ShoppingBag,
  ChevronRight
} from 'lucide-react';
import { ProductGridCard } from './ProductGridCard';
import {
  SupportedLanguage,
  getCategoryName,
  getProductTitle,
  resolveBaseLang,
  t
} from '../utils/i18n';
import { formatTaka, toBengaliNumber } from '../utils/bengali';

interface TemuCartViewProps {
  cartItems: CartItem[];
  products: Product[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onBackToHome: () => void;
  onProductClick: (product: Product) => void;
  onOrderClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenReviews: (product: Product) => void;
  onOpenTrustTab?: (tab: 'privacy' | 'refund' | 'delivery') => void;
  language?: SupportedLanguage;
}

export const TemuCartView: React.FC<TemuCartViewProps> = ({
  cartItems,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onBackToHome,
  onProductClick,
  onOrderClick,
  onAddToCart,
  onOpenReviews,
  onOpenTrustTab,
  language = 'bn'
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    cartItems.map((item) => item.product.id)
  );
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({});

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const allSelected =
    cartItems.length > 0 && selectedItemIds.length === cartItems.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map((item) => item.product.id));
    }
  };

  const handleToggleItem = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((i) => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const selectedCartItems = cartItems.filter((item) =>
    selectedItemIds.includes(item.product.id)
  );

  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const displayedItems =
    activeTab === 'selected' ? selectedCartItems : cartItems;

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-slate-950 pb-28 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95"
            title={t('back', language)}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {cartItems.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 cursor-pointer text-xs font-bold"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  allSelected
                    ? 'bg-black dark:bg-[#fb7701] text-white'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
              >
                {allSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span>{t('tabAll', language)}</span>
            </button>
          )}
        </div>

        <h1 className="text-base font-black text-slate-950 dark:text-white">
          {t('cart', language)} ({toBengaliNumber(cartItems.length, language)})
        </h1>

        <button
          onClick={onClearCart}
          className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title={t('clearSearchBtn', language)}
        >
          <List className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Free Shipping Top Alert Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
        <div className="flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          <span>{t('specialForYou', language)}</span>
        </div>
        <span className="text-slate-500 text-[11px] font-medium">
          {t('limitedTimeOffers', language)}
        </span>
      </div>

      {/* Filter Tabs: All(N) vs Selected(N) */}
      {cartItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'border-black dark:border-white bg-slate-100 dark:bg-slate-800 text-black dark:text-white font-extrabold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('tabAll', language)} ({toBengaliNumber(cartItems.length, language)})
          </button>
          <button
            onClick={() => setActiveTab('selected')}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
              activeTab === 'selected'
                ? 'border-black dark:border-white bg-slate-100 dark:bg-slate-800 text-black dark:text-white font-extrabold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isBn ? 'সিলেক্টেড' : isAr ? 'المحددة' : 'Selected'} (
            {toBengaliNumber(selectedCartItems.length, language)})
          </button>
        </div>
      )}

      {/* Cart Content */}
      <div className="p-3 space-y-3">
        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingCart className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isBn
                ? 'আপনার শপিং কার্ট খালি'
                : isAr
                ? 'سلة التسوق فارغة'
                : 'Your shopping cart is empty'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBn
                ? 'পছন্দের পণ্যগুলো কার্টে যুক্ত করুন'
                : isAr
                ? 'أضف منتجاتك المفضلة إلى السلة'
                : 'Add your favorite items to your cart'}
            </p>
            <button
              onClick={onBackToHome}
              className="px-6 py-2.5 bg-[#fb7701] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer active:scale-95"
            >
              {isBn ? 'শপিং শুরু করুন' : isAr ? 'ابدأ التسوق' : 'Start Shopping'}
            </button>
          </div>
        ) : (
          displayedItems.map((item) => {
            const isSelected = selectedItemIds.includes(item.product.id);
            const discountPercent = item.product.originalPrice
              ? Math.round(
                  ((item.product.originalPrice - item.product.price) /
                    item.product.originalPrice) *
                    100
                )
              : 40;
            const displayTitle = getProductTitle(item.product, language);
            const hasErr = thumbErrors[item.product.id];

            return (
              <div
                key={item.product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-2.5"
              >
                {/* Item Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.product.id)}
                  className="mt-6 shrink-0 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-black dark:bg-[#fb7701] text-white'
                        : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>

                {/* Product Thumbnail */}
                <div
                  onClick={() => onProductClick(item.product)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer border border-slate-200/60 dark:border-slate-700 flex items-center justify-center"
                >
                  {item.product.image && !hasErr ? (
                    <img
                      src={item.product.image}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                      onError={() =>
                        setThumbErrors((prev) => ({
                          ...prev,
                          [item.product.id]: true
                        }))
                      }
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase mb-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{t('freeShipping', language)}</span>
                    <span className="text-slate-400 font-semibold normal-case truncate">
                      · Market places
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex items-start justify-between gap-1">
                    <h4
                      onClick={() => onProductClick(item.product)}
                      className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:text-[#fb7701]"
                    >
                      {displayTitle}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer shrink-0"
                      title={t('deleteProduct', language)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category chip */}
                  <div className="mt-1 inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    <span>{getCategoryName(item.product.category, language)}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>

                  {/* Price & Quantity Row */}
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                        {formatTaka(item.product.price, language)}
                      </span>
                      {item.product.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatTaka(item.product.originalPrice, language)}
                        </span>
                      )}
                      <span className="text-[9px] font-black text-[#fb7701] bg-orange-50 dark:bg-orange-950/50 px-1 rounded">
                        -{toBengaliNumber(discountPercent, language)}%
                      </span>
                    </div>

                    {/* Quantity Picker */}
                    <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-xs">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(
                            item.product.id,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-white">
                        {toBengaliNumber(item.quantity, language)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Shipping note */}
                  <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'ডেলিভারি: ২-৩ কার্যদিবস (সারা বাংলাদেশ)'
                      : isAr
                      ? 'التوصيل: خلال 2-4 أيام عمل'
                      : 'Delivery: 2-4 business days'}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Trust Guarantee Badges - Interactive */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="grid grid-cols-4 gap-1 text-center">
            <button
              type="button"
              onClick={() => onOpenTrustTab?.('delivery')}
              className="flex flex-col items-center p-1.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-1">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                {t('cashOnDelivery', language)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTrustTab?.('privacy')}
              className="flex flex-col items-center p-1.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-1">
                <Lock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                {t('securePrivacy', language)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTrustTab?.('refund')}
              className="flex flex-col items-center p-1.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-1">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                {t('refundForIssue', language)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTrustTab?.('delivery')}
              className="flex flex-col items-center p-1.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-1">
                <Truck className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                {t('deliveryGuarantee', language)}
              </span>
            </button>
          </div>
        </div>

        {/* Recommended Products 2-Column Feed */}
        <div className="pt-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2.5">
            {isBn ? 'আপনার পছন্দ হতে পারে' : isAr ? 'قد يعجبك أيضاً' : 'You May Also Like'}
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {products.slice(0, 4).map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                language={language}
                onProductClick={onProductClick}
                onOrderClick={onOrderClick}
                onAddToCart={onAddToCart}
                onEditClick={() => {}}
                onDeleteClick={() => {}}
                onReviewClick={onOpenReviews}
                isAdmin={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar */}
      {selectedCartItems.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
              {t('subtotal', language)}
            </span>
            <span className="text-base sm:text-lg font-black text-[#fb7701]">
              {formatTaka(subtotal, language)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="flex-1 max-w-xs py-3 px-5 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:from-[#fa6c00] hover:to-[#ea4500] text-white font-black text-xs sm:text-sm rounded-full shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <span>
              {isBn ? 'চেকআউট' : isAr ? 'إتمام الطلب' : 'Checkout'} (
              {toBengaliNumber(selectedCartItems.length, language)})
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
