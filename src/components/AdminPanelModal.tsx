import React, { useState } from 'react';
import { Product, Order, User, AgentApplication, RefundClaim } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import {
  X,
  Package,
  ShoppingBag,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Store,
  Check,
  AlertCircle,
  Users,
  ArrowLeft,
  Lock,
  KeyRound,
  Mail,
  Truck,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Bot,
  RefreshCw,
  Wallet
} from 'lucide-react';
import {
  isAuthorizedAdminEmail,
  ADMIN_DEFAULT_EMAIL,
  ADMIN_DEFAULT_PASS,
  setCurrentUser
} from '../utils/auth';
import { playOrderAlertSound } from '../utils/orderAlert';
import { exportOrdersToCSV } from '../utils/csvExport';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  products: Product[];
  orders: Order[];
  agentApplications: AgentApplication[];
  onApproveAgent: (applicationId: string) => void;
  onRejectAgent: (applicationId: string) => void;
  onApproveProduct: (productId: string) => void;
  onRejectProduct: (productId: string) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], trackingStep?: 1 | 2 | 3 | 4, cancelReason?: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onAdminLoginSuccess?: (user: User) => void;
  initialTab?: 'analytics' | 'products' | 'orders' | 'agents' | 'approvals' | 'refunds';
  refundClaims?: RefundClaim[];
  onUpdateRefundClaim?: (
    claimId: string,
    status: RefundClaim['status'],
    refundCreditAmount?: number,
    adminNote?: string
  ) => void;
  onOpenSupportAiSetup?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  products,
  orders,
  agentApplications,
  onApproveAgent,
  onRejectAgent,
  onApproveProduct,
  onRejectProduct,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onDeleteOrder,
  onAdminLoginSuccess,
  initialTab = 'analytics',
  refundClaims = [],
  onUpdateRefundClaim,
  onOpenSupportAiSetup
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'agents' | 'approvals' | 'refunds'>(initialTab);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('পণ্যটির বর্তমান স্টক শেষ হয়ে গেছে।');
  const [cancelError, setCancelError] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [refundNotes, setRefundNotes] = useState<Record<string, string>>({});
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});

  const handleExportCSV = (targetOrders: Order[] = orders, filterName = 'all') => {
    if (!targetOrders || targetOrders.length === 0) {
      setExportNotice('ডাউনলোড করার মতো কোনো অর্ডার ডাটা পাওয়া যায়নি।');
      setTimeout(() => setExportNotice(null), 3500);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `marketplaces_customer_orders_${filterName}_${today}.csv`;
    const success = exportOrdersToCSV(targetOrders, fileName);
    if (success) {
      setExportNotice(`সফলভাবে ${targetOrders.length} টি অর্ডারের বুককিপিং CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে!`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Sync initialTab when changed
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Security Gate State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const isVerifiedOwner = currentUser ? isAuthorizedAdminEmail(currentUser.identifier) : false;

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPass = authPassword.trim();

    // STRICT CHECK: ONLY kingriday3@gmail.com
    if (cleanEmail !== ADMIN_DEFAULT_EMAIL.toLowerCase()) {
      setAuthError('অনুমতি নেই! প্রদত্ত জিমেইল আইডিটি এডমিন হিসেবে অনুমোদিত নয়।');
      return;
    }

    if (cleanPass !== ADMIN_DEFAULT_PASS) {
      setAuthError('ভুল এডমিন পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const verifiedAdminUser: User = {
        id: 'user-admin-root',
        name: 'সুপার এডমিন',
        identifier: ADMIN_DEFAULT_EMAIL,
        type: 'email',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(verifiedAdminUser);
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(verifiedAdminUser);
      }
    }, 400);
  };

  // If user is not verified as kingriday3@gmail.com, show strict Owner Gate!
  if (!isVerifiedOwner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header with Back button */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
              title="পেছনে যান"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              সুপার এডমিন ভেরিফিকেশন
            </h3>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed text-center">
              <strong>নিরাপত্তা নীতি:</strong> এই এডমিন কন্ট্রোল প্যানেল শুধুমাত্র অনুমোদিত ওনার বা পরিচালকের জন্য সংরক্ষিত।
            </div>
          </div>

          {authError && (
            <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                এডমিন জিমেইল আইডি (Admin Gmail)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs caret-emerald-600 dark:bg-white dark:text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                এডমিন সিকিউরিটি পাসওয়ার্ড
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="আপনার গোপন এডমিন পাসওয়ার্ড দিন"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs caret-emerald-600 dark:bg-white dark:text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>{isVerifying ? 'ভেরিফাই হচ্ছে...' : 'ভেরিফাই ও এডমিন প্যানেলে প্রবেশ করুন'}</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Analytics
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingRevenue = orders
    .filter((o) => o.status !== 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingAgentCount = agentApplications.filter((a) => a.status === 'pending').length;
  const pendingProductCount = products.filter((p) => p.approvalStatus === 'pending').length;
  const pendingRefundCount = refundClaims.filter((r) => r.status === 'pending').length;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Admin Header with Back Button */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer mr-1"
              title="এডমিন প্যানেল থেকে বের হয়ে শপে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ফিরে যান</span>
            </button>

            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Marketplaces সুপার এডমিন প্যানেল</h3>
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ভেরিফাইড ওনার
                </span>
              </div>
              <p className="text-xs text-slate-400">
                পণ্য, কাস্টমার অর্ডার ও এজেন্ট বিক্রেতা অনুমোদন কন্ট্রোল
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 dark:bg-slate-850 px-4 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ড্যাশবোর্ড ওভারভিউ</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>অর্ডারসমূহ ({toBengaliNumber(orders.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>সকল পণ্য ({toBengaliNumber(products.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'agents'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>এজেন্ট / সেলার অনুমোদন</span>
            {pendingAgentCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {toBengaliNumber(pendingAgentCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'approvals'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>পণ্য অনুমোদন (Pending Products)</span>
            {pendingProductCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                {toBengaliNumber(pendingProductCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'refunds'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিফান্ড ও AI সাপোর্ট</span>
            {pendingRefundCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {toBengaliNumber(pendingRefundCount)}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">ডেলিভারড বিক্রয়</span>
                  <h4 className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                    {formatTaka(totalRevenue)}
                  </h4>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">চলমান অর্ডার মান</span>
                  <h4 className="text-xl font-black text-amber-900 dark:text-amber-100 mt-1">
                    {formatTaka(pendingRevenue)}
                  </h4>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">মোট কাস্টমার অর্ডার</span>
                  <h4 className="text-xl font-black text-blue-900 dark:text-blue-100 mt-1">
                    {toBengaliNumber(orders.length)} টি
                  </h4>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">সেলার এজেন্ট রিকোয়েস্ট</span>
                  <h4 className="text-xl font-black text-purple-900 dark:text-purple-100 mt-1">
                    {toBengaliNumber(agentApplications.length)} জন
                  </h4>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    সুপার এডমিন কুইক অ্যাকশন
                  </h5>
                  <p className="text-xs text-slate-500">
                    সরাসরি নিজের নতুন পণ্য যোগ করুন অথবা এজেন্টদের প্রোডাক্ট অনুমোদন দিন।
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleExportCSV(orders, 'all')}
                    disabled={orders.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    title="বুককিপিং এর জন্য সকল কাস্টমার অর্ডার CSV ডাউনলোড করুন"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export to CSV ({toBengaliNumber(orders.length)})</span>
                  </button>
                  <button
                    onClick={onAddProduct}
                    className="px-4 py-2 bg-[#fb7701] hover:bg-[#e65100] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন পণ্য যোগ করুন</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('agents')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>এজেন্ট অনুমোদন</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Orders List with GPS Maps & Bookkeeping Export */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                    {(['all', 'pending', 'confirmed', 'delivered', 'cancelled'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderFilter(status)}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          orderFilter === status
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {status === 'all' && 'সকল'}
                        {status === 'pending' && 'পেন্ডিং'}
                        {status === 'confirmed' && 'অনুমোদিত'}
                        {status === 'delivered' && 'ডেলিভারড'}
                        {status === 'cancelled' && 'বাতিলকৃত'}
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span>লাইভ রিয়েল-টাইম পুশ সক্রিয়</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Export to CSV Button */}
                  <button
                    type="button"
                    onClick={() => handleExportCSV(filteredOrders, orderFilter)}
                    disabled={orders.length === 0}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    title="বুককিপিং এর জন্য কাস্টমার অর্ডারের ডাটা এক্সেল/CSV ফাইলে ডাউনলোড করুন"
                  >
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    <span>Export to CSV ({toBengaliNumber(filteredOrders.length)})</span>
                  </button>

                  {orderFilter !== 'all' && orders.length > filteredOrders.length && (
                    <button
                      type="button"
                      onClick={() => handleExportCSV(orders, 'all')}
                      className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      title="সকল অর্ডার একসাথে এক্সপোর্ট করুন"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>সকল ({toBengaliNumber(orders.length)})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => playOrderAlertSound()}
                    className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#fb7701] font-bold text-xs rounded-lg border border-orange-200 dark:border-slate-750 flex items-center gap-1 cursor-pointer transition-colors"
                    title="নতুন অর্ডারের বেল সাউন্ড টেস্ট করুন"
                  >
                    <span>🔔 সাউন্ড টেস্ট</span>
                  </button>
                </div>
              </div>

              {/* Export Success Notification Banner */}
              {exportNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{exportNotice}</span>
                  </div>
                  <button
                    onClick={() => setExportNotice(null)}
                    className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  কোনো অর্ডার পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                              {order.customerName}
                            </h5>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.status === 'delivered' || order.trackingStep === 4
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : order.trackingStep === 3
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                  : order.trackingStep === 2
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : order.trackingStep === 1 || order.status === 'confirmed'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {order.status === 'delivered' || order.trackingStep === 4
                                ? '৪. ডেলিভারি সম্পন্ন'
                                : order.trackingStep === 3
                                ? '৩. অন দ্য ওয়ে (ডেলিভারির জন্য প্রস্তুত)'
                                : order.trackingStep === 2
                                ? '২. প্যাকেজিং চলতেছে'
                                : order.trackingStep === 1 || order.status === 'confirmed'
                                ? '১. একসেপ্ট ও অনুমোদিত'
                                : 'অপেক্ষমাণ (নতুন অর্ডার)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`tel:${order.customerPhone}`} className="hover:underline font-mono">
                                {order.customerPhone}
                              </a>
                            </span>
                            <span>·</span>
                            <span>{order.district}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-[#fb7701] block">
                            {formatTaka(order.totalAmount)}
                          </span>
                          <span className="text-[11px] text-slate-400">ক্যাশ অন ডেলিভারি</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                        <strong>পণ্য:</strong> {order.productTitle} (পরিমাণ: {toBengaliNumber(order.quantity)})
                        <br />
                        <strong>ঠিকানা:</strong> {order.deliveryAddress}
                        {order.notes && (
                          <div className="mt-1 text-slate-500">
                            <strong>বিশেষ নোট:</strong> {order.notes}
                          </div>
                        )}
                      </div>

                      {order.location && (
                        <div className="flex items-center gap-2">
                          <a
                            href={order.location.mapUrl || `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>লাইভ GPS লোকেশন গুগল ম্যাপে দেখুন</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Unified Single Order Processing Control */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Truck className="w-4 h-4" />
                            <span>অর্ডার প্রসেসিং কন্ট্রোল (একক অপশন):</span>
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold">
                            ধাপ: {order.trackingStep || (order.status === 'delivered' ? 4 : order.status === 'confirmed' ? 2 : 1)}/৪
                          </span>
                        </div>

                        {/* Single Unified Option: Dropdown + Advance Button */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                          <div className="relative flex-1">
                            <select
                              value={
                                order.status === 'delivered' || order.trackingStep === 4
                                  ? 4
                                  : order.trackingStep === 3
                                  ? 3
                                  : order.trackingStep === 2
                                  ? 2
                                  : order.trackingStep === 1 || order.status === 'confirmed'
                                  ? 1
                                  : 0
                              }
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val === 1) onUpdateOrderStatus(order.id, 'confirmed', 1);
                                else if (val === 2) onUpdateOrderStatus(order.id, 'confirmed', 2);
                                else if (val === 3) onUpdateOrderStatus(order.id, 'confirmed', 3);
                                else if (val === 4) onUpdateOrderStatus(order.id, 'delivered', 4);
                              }}
                              className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 border-2 border-[#fb7701]/40 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#fb7701] cursor-pointer shadow-xs"
                            >
                              <option value={0}>অপেক্ষমাণ (নতুন অর্ডার)</option>
                              <option value={1}>১. একসেপ্ট (গৃহীত ও অনুমোদিত)</option>
                              <option value={2}>২. প্যাকেজিং (প্রসেসিং চলছে)</option>
                              <option value={3}>৩. অন দ্য ওয়ে (ডেলিভারির পথে)</option>
                              <option value={4}>৪. ডেলিভারি সম্পন্ন (সফল)</option>
                            </select>
                          </div>

                          {order.status !== 'delivered' && (
                            <button
                              type="button"
                              onClick={() => {
                                const current = order.trackingStep || (order.status === 'confirmed' ? 2 : 1);
                                if (current < 4) {
                                  const nextStep = (current + 1) as 1 | 2 | 3 | 4;
                                  const newStatus = nextStep === 4 ? 'delivered' : 'confirmed';
                                  onUpdateOrderStatus(order.id, newStatus, nextStep);
                                }
                              }}
                              className="py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>পরবর্তী ধাপে এগিয়ে নিন →</span>
                            </button>
                          )}
                        </div>

                        {/* Order Cancellation Status or Reject Button */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
                          {order.status === 'cancelled' ? (
                            <div className="flex-1 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-2 text-xs text-red-700 dark:text-red-300">
                              <span className="font-extrabold flex items-center gap-1">
                                <span>❌ অর্ডারটি বাতিল করা হয়েছে</span>
                              </span>
                              {order.cancelReason && (
                                <p className="mt-0.5 text-[11px] text-red-600 dark:text-red-400">
                                  <strong>কারণ:</strong> {order.cancelReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingOrder(order);
                                setCancelReasonText('পণ্যটির বর্তমান স্টক শেষ হয়ে গেছে।');
                              }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/80 text-red-600 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>অর্ডার বাতিল / রিজেক্ট করুন</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-mono">আইডি: {order.id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('আপনি কি নিশ্চিত যে এই অর্ডারটি মুছে ফেলতে চান?')) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          মুছে ফেলুন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Products Management */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500">
                  মোট {toBengaliNumber(products.length)}টি পণ্য তালিকাভুক্ত আছে
                </span>
                <button
                  onClick={onAddProduct}
                  className="px-3.5 py-1.5 bg-[#fb7701] hover:bg-[#e65100] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>পণ্য যোগ করুন</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-xs"
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {p.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-[#fb7701]">
                          {formatTaka(p.price)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-medium">
                          বিক্রেতা: {p.sellerName || 'Marketplaces'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Agent & Seller Applications */}
          {activeTab === 'agents' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-900 dark:text-purple-200">
                <h5 className="font-bold flex items-center gap-1.5 mb-1">
                  <Store className="w-4 h-4" />
                  <span>এজেন্ট / সেলার পারমিশন সিস্টেম:</span>
                </h5>
                <p className="text-[11px] leading-relaxed">
                  যারা আপনার অনুমতি নিয়ে নিজস্ব পণ্য বিক্রি করতে চায়, তাদের আবেদন নিচে দেখা যাবে। আপনি "অনুমোদন করুন" বাটনে চাপ দিলেই তারা ভেরিফাইড সেলার হিসেবে পণ্য আপলোড করার অনুমতি পাবে।
                </p>
              </div>

              {agentApplications.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Store className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <span>কোনো এজেন্টের আবেদন এখনো জমা পড়েনি।</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {agentApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                            দোকান: {app.shopName}
                          </h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              app.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.status === 'approved' && 'অনুমোদিত সেলার'}
                            {app.status === 'rejected' && 'বাতিল'}
                            {app.status === 'pending' && 'অনুমোদনের অপেক্ষায়'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          মালিক: <strong>{app.userName}</strong> | ফোন: <a href={`tel:${app.userPhone}`} className="font-mono text-[#fb7701]">{app.userPhone}</a>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          ক্যাটাগরি: {app.shopCategory} | ঠিকানা: {app.address || 'দেওয়া হয়নি'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {app.status !== 'approved' && (
                          <button
                            onClick={() => onApproveAgent(app.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>অনুমোদন করুন</span>
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => onRejectAgent(app.id)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            বাতিল করুন
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Pending Agent Product Approvals */}
          {activeTab === 'approvals' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200">
                <h5 className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>এজেন্টদের পণ্যের মান যাচাই ও লাইভ অনুমোদন:</span>
                </h5>
                <p className="text-[11px] leading-relaxed">
                  এজেন্টরা যেসব নতুন প্রোডাক্ট সাবমিট করবে, সেগুলো সরাসরি মার্কেটে যাবে না। আপনি যাচাই করে "মার্কেটপ্লেসে লাইভ করুন" চাপলেই কেবল সাধারণ ক্রেতারা সেটি কিনতে পারবে।
                </p>
              </div>

              {pendingProductCount === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <span>কোনো পণ্য অনুমোদনের অপেক্ষায় নেই। সকল পণ্য লাইভ আছে!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {products
                    .filter((p) => p.approvalStatus === 'pending')
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-300 dark:border-amber-800 shadow-xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-18 h-18 rounded-xl object-cover shrink-0 bg-slate-100"
                          />
                          <div className="space-y-1 min-w-0">
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {p.title}
                            </h5>
                            <span className="text-xs font-black text-[#fb7701] block">
                              {formatTaka(p.price)}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              বিক্রেতা এজেন্ট: <strong>{p.sellerName || 'এজেন্ট'}</strong> | ক্যাটাগরি: {p.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onApproveProduct(p.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>মার্কেটপ্লেসে লাইভ করুন</span>
                          </button>
                          <button
                            onClick={() => onRejectProduct(p.id)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            বাতিল করুন
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Refund Claims & AI Support Agent Setup */}
          {activeTab === 'refunds' && (
            <div className="space-y-4">
              {/* AI Support Agent Setup Launcher Card */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex items-center justify-between gap-3 flex-wrap shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#fb7701] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-black text-sm">Market places Support Center — এআই এজেন্ট কন্ট্রোল</h5>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      সাপোর্ট এআই-এর নাম, গ্রিটিং, দোকানের নিয়মাবলি, হেল্পলাইন ও WhatsApp নম্বর কাস্টমাইজ করুন।
                    </p>
                  </div>
                </div>
                {onOpenSupportAiSetup && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSupportAiSetup();
                    }}
                    className="px-4 py-2 bg-[#fb7701] hover:bg-[#e65100] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Bot className="w-4 h-4" />
                    <span>AI সাপোর্ট সেটআপ খুলুন</span>
                  </button>
                )}
              </div>

              {/* Refund Claims Management */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200">
                <h5 className="font-bold flex items-center gap-1.5 mb-1">
                  <Wallet className="w-4 h-4" />
                  <span>ক্রেতার রিফান্ড ক্লেইম ও ক্রেডিট ব্যালেন্স অনুমোদন:</span>
                </h5>
                <p className="text-[11px] leading-relaxed">
                  গ্রাহক "Guaranteed refund for any issue" থেকে ক্লেইম জমা দিলে এখানে দেখতে পাবেন। "Approve & Credit Wallet" চাপলে নির্ধারিত টাকা সরাসরি গ্রাহকের Credit Balance-এ জমা হয়ে যাবে।
                </p>
              </div>

              {refundClaims.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <RefreshCw className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                  <span>এখনো কোনো রিফান্ড ক্লেইম জমা পড়েনি।</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {refundClaims.map((claim) => {
                    const amountValue =
                      refundAmounts[claim.id] !== undefined
                        ? refundAmounts[claim.id]
                        : String(claim.requestedAmount || 0);
                    const noteValue =
                      refundNotes[claim.id] !== undefined ? refundNotes[claim.id] : claim.adminNote || '';

                    return (
                      <div
                        key={claim.id}
                        className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {claim.customerName}
                              </span>
                              <span className="text-xs font-mono text-slate-500">{claim.customerPhone}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  claim.status === 'approved' || claim.status === 'resolved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : claim.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {claim.status === 'pending' && 'পেন্ডিং'}
                                {claim.status === 'approved' && 'অনুমোদিত ও ক্রেডিট যুক্ত'}
                                {claim.status === 'resolved' && 'সমাধানকৃত'}
                                {claim.status === 'rejected' && 'বাতিল'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              অর্ডার: <strong className="font-mono">{claim.orderId}</strong> | সমস্যা:{' '}
                              <strong>{claim.issueType}</strong> | চাওয়া হয়েছে:{' '}
                              <strong className="text-[#fb7701]">{formatTaka(claim.requestedAmount)}</strong>
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              {claim.description}
                            </p>
                          </div>
                        </div>

                        {claim.status === 'pending' && onUpdateRefundClaim && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 items-center">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                ওয়ালেট ক্রেডিট পরিমাণ (৳)
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={amountValue}
                                onChange={(e) =>
                                  setRefundAmounts((prev) => ({ ...prev, [claim.id]: e.target.value }))
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                এডমিন নোট (গ্রাহক দেখবে)
                              </label>
                              <input
                                type="text"
                                value={noteValue}
                                onChange={(e) =>
                                  setRefundNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))
                                }
                                placeholder="যেমন: রিফান্ড ওয়ালেটে যুক্ত হয়েছে"
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2 sm:justify-end sm:pt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateRefundClaim(
                                    claim.id,
                                    'approved',
                                    Math.max(0, Number(amountValue) || claim.requestedAmount || 0),
                                    noteValue || 'Approved & credited to wallet balance'
                                  )
                                }
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve & Credit Wallet</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateRefundClaim(
                                    claim.id,
                                    'rejected',
                                    0,
                                    noteValue || 'Claim did not meet refund verification policy'
                                  )
                                }
                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}

                        {claim.status !== 'pending' && claim.adminNote && (
                          <div className="text-[11px] text-slate-500">
                            <strong>এডমিন নোট:</strong> {claim.adminNote}
                            {claim.refundCreditAmount ? ` (${formatTaka(claim.refundCreditAmount)} ক্রেডিট যুক্ত)` : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Marketplaces Super Admin Console · ভেরিফাইড সুরক্ষিত
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ঠিক আছে</span>
          </button>
        </div>

      </div>

      {/* Cancellation Reason Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-extrabold text-sm">অর্ডার বাতিল ও কারণ উল্লেখ</h4>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                গ্রাহক: {cancellingOrder.customerName} ({cancellingOrder.customerPhone})
              </p>
              <p className="text-slate-500">
                পণ্য: {cancellingOrder.productTitle} (মোট: {formatTaka(cancellingOrder.totalAmount)})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                বাতিল করার কারণ নির্বাচন বা লিখুন (গ্রাহক দেখতে পাবেন):
              </label>
              
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {[
                  'পণ্যটির বর্তমান স্টক শেষ হয়ে গেছে।',
                  'প্রদত্ত মোবাইল নম্বরে সংযোগ পাওয়া যায়নি।',
                  'ডেলিভারি ঠিকানা অসম্পূর্ণ বা এলাকা কভারেজের বাইরে।',
                  'গ্রাহকের অনুরোধে অর্ডারটি বাতিল করা হয়েছে।'
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCancelReasonText(reason)}
                    className={`p-2 text-left rounded-lg border text-xs font-medium transition-colors ${
                      cancelReasonText === reason
                        ? 'bg-red-50 border-red-500 text-red-700 font-bold dark:bg-red-950/40 dark:text-red-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    • {reason}
                  </button>
                ))}
              </div>

              <textarea
                value={cancelReasonText}
                onChange={(e) => {
                  setCancelReasonText(e.target.value);
                  if (cancelError) setCancelError('');
                }}
                rows={2}
                placeholder="অন্য কোনো নির্দিষ্ট কারণ লিখুন..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-red-500"
              />
              {cancelError && (
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400">
                  {cancelError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCancelError('');
                  setCancellingOrder(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cancelReasonText.trim()) {
                    setCancelError('দয়া করে বাতিলের একটি কারণ লিখুন।');
                    return;
                  }
                  setCancelError('');
                  onUpdateOrderStatus(cancellingOrder.id, 'cancelled', undefined, cancelReasonText.trim());
                  setCancellingOrder(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                নিশ্চিত বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
