import React, { useState } from 'react';
import { User, Product, AgentApplication } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import {
  X,
  ArrowLeft,
  Store,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Phone,
  Mail,
  MapPin,
  Upload,
  ShoppingBag,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { CATEGORIES } from '../data/initialProducts';

interface AgentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  agentApplication: AgentApplication | null;
  onSubmitApplication: (app: Omit<AgentApplication, 'id' | 'createdAt' | 'status'>) => void;
  agentProducts: Product[];
  onAddAgentProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewCount' | 'sellerRole' | 'approvalStatus'>) => void;
  onOpenLogin: () => void;
}

export const AgentPortalModal: React.FC<AgentPortalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  agentApplication,
  onSubmitApplication,
  agentProducts,
  onAddAgentProduct,
  onOpenLogin
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'add-product' | 'my-products'>('status');

  // Application form state
  const [shopName, setShopName] = useState('');
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userPhone, setUserPhone] = useState(currentUser?.type === 'phone' ? currentUser.identifier : '');
  const [userEmail, setUserEmail] = useState(currentUser?.type === 'email' ? currentUser.identifier : '');
  const [shopCategory, setShopCategory] = useState(CATEGORIES[1] || 'পোশাক ও ফ্যাশন');
  const [address, setAddress] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [applyError, setApplyError] = useState('');

  // New Product form state for Agent
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1] || 'পোশাক ও ফ্যাশন');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [stockStatus, setStockStatus] = useState<Product['stockStatus']>('in_stock');
  const [productSuccess, setProductSuccess] = useState(false);
  const [productError, setProductError] = useState('');

  if (!isOpen) return null;

  const isApproved = agentApplication?.status === 'approved' || currentUser?.isApprovedAgent || currentUser?.role === 'agent';
  const isPending = agentApplication?.status === 'pending';

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !userPhone.trim() || !userName.trim()) {
      setApplyError('দয়া করে আপনার নাম, দোকানের নাম এবং মোবাইল নম্বর দিন।');
      return;
    }
    setApplyError('');

    onSubmitApplication({
      userId: currentUser?.id || `user-${Date.now()}`,
      userName: userName.trim(),
      userPhone: userPhone.trim(),
      userEmail: userEmail.trim(),
      shopName: shopName.trim(),
      shopCategory,
      address: address.trim()
    });

    setApplicationSubmitted(true);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !image.trim()) {
      setProductError('দয়া করে পণ্যের নাম, মূল্য এবং ছবির লিঙ্ক দিন।');
      return;
    }
    setProductError('');

    onAddAgentProduct({
      title: title.trim(),
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: image.trim(),
      description: description.trim() || `${title} - আসল পণ্য, হোম ডেলিভারি ও ক্যাশ অন ডেলিভারিতে পাওয়া যাচ্ছে।`,
      sellerPhone: userPhone || currentUser?.identifier || '01700000000',
      whatsappNumber: userPhone || currentUser?.identifier || '8801700000000',
      stockStatus,
      sellerName: agentApplication?.shopName || currentUser?.shopName || 'ভেরিফাইড এজেন্ট',
      sellerId: currentUser?.id,
      badge: 'এজেন্ট পণ্য'
    });

    setProductSuccess(true);
    setTitle('');
    setPrice('');
    setOriginalPrice('');
    setImage('');
    setDescription('');
    setTimeout(() => {
      setProductSuccess(false);
      setActiveTab('my-products');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header with Back button */}
        <div className="bg-gradient-to-r from-[#fb7701] to-[#ff5000] text-white p-4 sm:p-5 relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title="পেছনে যান"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>সেলার ও এজেন্ট পোর্টাল</span>
                {isApproved && (
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>অনুমোদিত সেলার</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-orange-100">
                Marketplaces-এ আপনার নিজস্ব পণ্য বিক্রি করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* If user is NOT logged in */}
          {!currentUser && (
            <div className="p-4 bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#fb7701] mx-auto" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                সেলার হতে প্রথমে আপনার অ্যাকাউন্ট দিয়ে লগইন করুন
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                জিমেইল অথবা ফোন নম্বর দিয়ে লগইন করে সেলার হিসেবে আবেদন করুন। এডমিন অনুমোদনের পর আপনি নিজের পণ্য বিক্রি করতে পারবেন।
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="px-6 py-2.5 bg-[#fb7701] hover:bg-[#e65100] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                লগইন বা রেজিস্টার করুন
              </button>
            </div>
          )}

          {/* If user is logged in but NOT an approved agent and not yet applied */}
          {currentUser && !isApproved && !isPending && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 rounded-2xl">
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Marketplaces-এ সেলার / এজেন্ট হিসেবে কাজ করার নিয়ম:</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  নিচের ফর্মটি পূরণ করে সেলার হিসেবে আবেদন করুন। আমাদের সুপার এডমিন আপনার আবেদনটি যাচাই করে অনুমোদন দিলেই আপনি সরাসরি নিজের পণ্য আপলোড করে বিক্রি শুরু করতে পারবেন। প্রতিটি পণ্য বিক্রির টাকা ও অর্ডার সরাসরি আপনার কাছে পৌঁছাবে।
                </p>
              </div>

              <form onSubmit={handleApply} className="space-y-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                {applyError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      আপনার নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="পুরো নাম লিখুন"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      দোকান বা ব্র্যান্ডের নাম (Shop Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="যেমন: রহিম স্টোর / ফ্যাশন পয়েন্ট"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      যোগাযোগের ফোন নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="০১৭১১..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      দোকানের প্রধান ক্যাটাগরি
                    </label>
                    <select
                      value={shopCategory}
                      onChange={(e) => setShopCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                    >
                      {CATEGORIES.filter((c) => c !== 'সব পণ্য').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    দোকান বা ব্যবসার ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="মার্কেট বা এলাকার ঠিকানা..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#fb7701] hover:bg-[#e65100] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>এডমিনের কাছে সেলার অনুমোদনের আবেদন পাঠান</span>
                </button>
              </form>
            </div>
          )}

          {/* If applied and PENDING */}
          {currentUser && isPending && (
            <div className="p-6 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
              <Clock className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
              <h4 className="font-bold text-base text-amber-900 dark:text-amber-300">
                আপনার সেলার আবেদনটি এডমিনের অনুমোদনের অপেক্ষায় রয়েছে
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                দোকানের নাম: <strong>{agentApplication?.shopName}</strong> | ফোন: <strong>{agentApplication?.userPhone}</strong>
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-slate-700 text-[11px] text-slate-500">
                সুপার এডমিন তার অ্যাডমিন প্যানেল থেকে আপনার আবেদনটি পর্যালোচনা করে অনুমোদন করলেই আপনি এখানে পণ্য আপলোড করতে পারবেন।
              </div>
            </div>
          )}

          {/* If APPROVED: Full Agent Dashboard! */}
          {currentUser && isApproved && (
            <div className="space-y-4">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <button
                  onClick={() => setActiveTab('my-products')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'my-products'
                      ? 'bg-[#fb7701] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  আমার পণ্যসমূহ ({toBengaliNumber(agentProducts.length)})
                </button>

                <button
                  onClick={() => setActiveTab('add-product')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'add-product'
                      ? 'bg-[#fb7701] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ নতুন পণ্য আপলোড</span>
                </button>
              </div>

              {/* TAB 1: Add New Product Form */}
              {activeTab === 'add-product' && (
                <form onSubmit={handleCreateProduct} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {productError && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{productError}</span>
                    </div>
                  )}
                  {productSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>পণ্যটি সফলভাবে সাবমিট হয়েছে! এডমিন অনুমোদন করলেই এটি সরাসরি মার্কেটে দেখা যাবে।</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      পণ্যের নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="যেমন: প্রিমিয়াম কটন শার্ট / ব্লুটুথ হেডফোন"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        ক্যাটাগরি *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                      >
                        {CATEGORIES.filter((c) => c !== 'সব পণ্য').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        স্টক অবস্থা
                      </label>
                      <select
                        value={stockStatus}
                        onChange={(e) => setStockStatus(e.target.value as Product['stockStatus'])}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                      >
                        <option value="in_stock">ইন স্টক (উপলব্ধ)</option>
                        <option value="limited">সীমিত স্টক</option>
                        <option value="preorder">প্রি-অর্ডার</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        বিক্রয় মূল্য (টাকা) *
                      </label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="৳৭৫০"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        পূর্বের মূল্য / ডিসকাউন্ট মূল্য (ঐচ্ছিক)
                      </label>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="৳৯৫০"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      পণ্যের ছবির লিঙ্ক (Image URL) *
                    </label>
                    <input
                      type="url"
                      required
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      পণ্যের বিবরণ
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="পণ্যটির বিশেষ বৈশিষ্ট্য এবং গুণগত মান..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-[#fb7701]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#fb7701] hover:bg-[#e65100] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>পণ্যটি এডমিনের অনুমোদনের জন্য সাবমিট করুন</span>
                  </button>
                </form>
              )}

              {/* TAB 2: My Products List */}
              {activeTab === 'my-products' && (
                <div className="space-y-3">
                  {agentProducts.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">
                        আপনার এখনো কোনো পণ্য নেই। "+ নতুন পণ্য আপলোড" এ চাপ দিয়ে পণ্য যোগ করুন।
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {agentProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 shadow-xs"
                        >
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {p.title}
                            </h5>
                            <span className="text-[11px] font-bold text-[#fb7701] block">
                              {formatTaka(p.price)}
                            </span>
                            <div className="mt-1 flex items-center gap-2">
                              {p.approvalStatus === 'approved' ? (
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>লাইভ মার্কেটে আছে</span>
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>এডমিন অনুমোদনের অপেক্ষায়</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Marketplaces মাল্টি-ভেন্ডর এজেন্ট সিস্টেম
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
