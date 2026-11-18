import React, { useState } from 'react';
import { Product } from '../types';
import { X, ShoppingCart, Info } from 'lucide-react';
import { SupportedLanguage, resolveBaseLang, t } from '../utils/i18n';
import { formatTaka, toBengaliNumber } from '../utils/bengali';

interface TemuVariantSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (selectedOptions: { color: string; model: string }) => void;
  language?: SupportedLanguage;
}

const DEFAULT_COLORS = ['🔥 Mixed Color 1', 'Classic Black', 'Navy Blue', 'Silver Gray'];
const DEFAULT_MODELS = [
  'Standard / Universal',
  'S / Compact',
  'M / Medium',
  'L / Large',
  'XL / Extra Large',
  'Galaxy A15 / A25',
  'Galaxy S24 / S25',
  'iPhone 15 / 16 Pro'
];

export const TemuVariantSheet: React.FC<TemuVariantSheetProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
  language = 'bn'
}) => {
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 40;

  const handleSelectOption = () => {
    onConfirm({
      color: selectedColor,
      model: selectedModel || DEFAULT_MODELS[0]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 text-slate-900 dark:text-slate-100">
        {/* Top Handle */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

        {/* Top Product Header Row */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            </div>

            <div>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through font-bold block">
                  {formatTaka(product.originalPrice, language)}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-950 dark:text-white">
                  {formatTaka(product.price, language)}
                </span>
                <span className="text-xs font-black text-[#fb7701] bg-orange-50 dark:bg-orange-950/50 px-1.5 py-0.5 rounded">
                  -{toBengaliNumber(discountPercent, language)}%
                </span>
              </div>

              <div className="mt-1 inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 text-[#fb7701] text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span>
                  {isBn
                    ? 'Market places সেরা অফার মূল্য'
                    : isAr
                    ? 'أفضل سعر على Market places'
                    : 'Best value on Market places'}
                </span>
                <Info className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex flex-col items-center">
              <div className="w-9 h-9 rounded-full border-2 border-emerald-500 text-emerald-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-[8px] font-black text-emerald-600 mt-0.5 whitespace-nowrap">
                {t('freeShipping', language)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Variants Selection */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              {isBn ? 'কালার নির্বাচন করুন' : isAr ? 'اختر اللون' : 'Color'}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {DEFAULT_COLORS.map((col) => {
                const isSelected = selectedColor === col;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-black dark:border-white bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              {isBn ? 'সাইজ / ভ্যারিয়েন্ট' : isAr ? 'المقاس / الطراز' : 'Size / Variant'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_MODELS.map((mod) => {
                const isSelected = selectedModel === mod;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModel(mod)}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-black dark:border-white bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-black shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleSelectOption}
            className="w-full py-3.5 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:from-[#fa6c00] hover:to-[#ea4500] text-white text-sm font-black rounded-full shadow-lg shadow-orange-500/30 cursor-pointer active:scale-95 transition-all text-center"
          >
            {selectedModel
              ? isBn
                ? 'নিশ্চিত করে কার্টে যোগ করুন'
                : isAr
                ? 'تأكيد وإضافة للسلة'
                : 'Confirm & Add to Cart'
              : t('addToCartBtn', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
