import React from 'react';
import { Order } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import { X, ShoppingBag, Phone, MapPin, CheckCircle, Clock, Trash2 } from 'lucide-react';

interface OrdersListModalProps {
  orders: Order[];
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onClearAll: () => void;
}

export const OrdersListModal: React.FC<OrdersListModalProps> = ({
  orders,
  onClose,
  onUpdateStatus,
  onDeleteOrder,
  onClearAll
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-lg">
              ক্যাশ অন ডেলিভারি অর্ডারের তালিকা ({toBengaliNumber(orders.length)} টি)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-600">এখনো কোনো অর্ডার জমা পড়েনি।</p>
              <p className="text-xs text-slate-400 mt-1">
                গ্রাহক যখন সরাসরি "ক্যাশ অন ডেলিভারি অর্ডার" বাটনে ক্লিক করবেন, তখন এখানে অর্ডার জমা হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">সর্বশেষ প্রাপ্ত অর্ডারগুলো</span>
                <button
                  onClick={onClearAll}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  সবগুলো মুছুন
                </button>
              </div>

              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                        {ord.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString('bn-BD')} {new Date(ord.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Status Pill Switcher */}
                    <div className="flex items-center gap-2">
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateStatus(ord.id, e.target.value as Order['status'])}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                          ord.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : ord.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="pending">অপেক্ষমান (Pending)</option>
                        <option value="confirmed">অনুমোদিত (Confirmed)</option>
                        <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                      </select>
                      
                      <button
                        onClick={() => onDeleteOrder(ord.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="অর্ডারটি মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{ord.productTitle}</div>
                      <div className="mt-1 text-slate-500">
                        পরিমাণ: {toBengaliNumber(ord.quantity)} টি · ডেলিভারি চার্জ: {formatTaka(ord.deliveryCharge)}
                      </div>
                      <div className="mt-1 font-bold text-emerald-600 text-sm">
                        সর্বমোট বিল: {formatTaka(ord.totalAmount)}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                      <div className="font-semibold text-slate-800">{ord.customerName}</div>
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${ord.customerPhone}`} className="hover:underline font-bold">
                          {toBengaliNumber(ord.customerPhone)}
                        </a>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{ord.deliveryAddress}, {ord.district}</span>
                      </div>
                      {ord.notes && (
                        <div className="text-[11px] text-amber-700 pt-1 border-t border-slate-100">
                          নোট: {ord.notes}
                        </div>
                      )}
                      {ord.location && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-sky-700 font-semibold flex items-center gap-1">
                            📍 GPS: {ord.location.lat.toFixed(4)}, {ord.location.lng.toFixed(4)}
                          </span>
                          <a
                            href={ord.location.mapUrl || `https://www.google.com/maps?q=${ord.location.lat},${ord.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
                          >
                            <span>ম্যাপে লোকেশন</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
