import React, { useState } from 'react';
import { Order } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import { SupportedLanguage, getDistrictLabel, resolveBaseLang, t } from '../utils/i18n';
import { CheckCircle, Copy, Check, MessageCircle, X } from 'lucide-react';

interface OrderConfirmationModalProps {
  order: Order;
  onClose: () => void;
  language?: SupportedLanguage;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  language = 'bn'
}) => {
  const [copied, setCopied] = useState(false);

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const orderText = `📋 Market places Order Memo:
${t('orderId', language)} ${order.id}
${order.productTitle} (x${toBengaliNumber(order.quantity, language)})
${t('totalAmount', language)} ${formatTaka(order.totalAmount, language)} (${t('cashOnDelivery', language)})
${order.customerName} | ${order.customerPhone}
${order.deliveryAddress}, ${getDistrictLabel(order.district, language)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappNotifyUrl = `https://wa.me/8801700000000?text=${encodeURIComponent(
    `${t('orderSuccess', language)}\n${orderText}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
        {/* Top Success Banner */}
        <div className="bg-emerald-600 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold">{t('orderSuccess', language)}</h3>
          <p className="text-xs text-emerald-100 mt-1">
            {t('orderId', language)}{' '}
            <span className="font-mono font-semibold text-white tracking-wider">{order.id}</span>
          </p>
        </div>

        {/* Invoice Summary */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm space-y-2.5">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-500 dark:text-slate-400">
                {isBn ? 'পণ্যের নাম:' : isAr ? 'المنتج:' : 'Item:'}
              </span>
              <span className="font-bold text-slate-800 dark:text-white text-right max-w-[200px] truncate">
                {order.productTitle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {isBn ? 'পরিমাণ:' : isAr ? 'الكمية:' : 'Quantity:'}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {toBengaliNumber(order.quantity, language)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t('deliveryCharge', language)}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatTaka(order.deliveryCharge, language)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-base font-bold text-slate-900 dark:text-white">
              <span>{t('totalAmount', language)}</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatTaka(order.totalAmount, language)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>{isBn ? 'পেমেন্ট পদ্ধতি:' : isAr ? 'طريقة الدفع:' : 'Payment:'}</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {t('cashOnDelivery', language)}
              </span>
            </div>
          </div>

          {/* Customer details */}
          <div className="text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/40">
            <div className="font-bold text-slate-800 dark:text-white mb-1">
              {t('deliveryAddress', language)}:
            </div>
            <div>
              {order.customerName} ({toBengaliNumber(order.customerPhone, language)})
            </div>
            <div className="mt-0.5 text-slate-500 dark:text-slate-400">
              {order.deliveryAddress}, {getDistrictLabel(order.district, language)}
            </div>
            {order.notes && <div className="mt-1 text-slate-500">{order.notes}</div>}
          </div>

          {/* Action buttons */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>
                {copied
                  ? isBn
                    ? 'মেমো কপি হয়েছে'
                    : isAr
                    ? 'تم النسخ'
                    : 'Copied'
                  : isBn
                  ? 'রসিদ কপি করুন'
                  : isAr
                  ? 'نسخ الفاتورة'
                  : 'Copy Receipt'}
              </span>
            </button>
            <a
              href={whatsappNotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold rounded-lg transition-colors text-center"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('whatsappOrder', language)}</span>
            </a>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isBn
                  ? 'ঠিক আছে, শপিং চালিয়ে যান'
                  : isAr
                  ? 'حسناً، متابعة التسوق'
                  : 'OK, Continue Shopping'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
