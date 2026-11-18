/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Product,
  Order,
  User,
  AppTheme,
  AgentApplication,
  CartItem,
  WalletAccount,
  RefundClaim,
  SupportAgentConfig
} from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './data/initialProducts';
import { Header } from './components/Header';
import { ProductGridCard } from './components/ProductGridCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { TemuSearchModal } from './components/TemuSearchModal';
import { QuickOrderModal } from './components/QuickOrderModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { ProductFormModal } from './components/ProductFormModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AgentPortalModal } from './components/AgentPortalModal';
import { CartDrawer } from './components/CartDrawer';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { ProductReviewsModal } from './components/ProductReviewsModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineBlocker, testLiveInternetConnection } from './components/OfflineBlocker';
import { AppBottomNav } from './components/AppBottomNav';
import { UserProfileModal } from './components/UserProfileModal';
import { TemuCategoriesView } from './components/TemuCategoriesView';
import { TemuYouView } from './components/TemuYouView';
import { TemuCartView } from './components/TemuCartView';
import { TemuVariantSheet } from './components/TemuVariantSheet';
import { TemuMessagesModal, MessagesSubSection } from './components/TemuMessagesModal';
import { TemuSettingsModal } from './components/TemuSettingsModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { TrustProtectionModal, TrustProtectionTab } from './components/TrustProtectionModal';
import { SupportCenterModal } from './components/SupportCenterModal';
import { getCurrentUser, setCurrentUser, isAuthorizedAdminEmail } from './utils/auth';
import { formatTaka, toBengaliNumber } from './utils/bengali';
import { SupportedLanguage, getSavedLanguage, saveLanguage, t, getProductTitle, isRtlLanguage, getBadgeLabel } from './utils/i18n';
import { useBackNavigation, ModalKey } from './utils/useBackNavigation';
import { broadcastNewOrder, broadcastOrderUpdate, broadcastProductsUpdate, subscribeToNewOrders, playOrderAlertSound } from './utils/orderAlert';
import {
  fetchBootstrapState,
  getWalletKey,
  fetchWallet,
  claimPromoCredit,
  updateRefundClaim,
  pushOrderToServer,
  updateOrderOnServer,
  deleteOrderOnServer,
  saveProductOnServer,
  updateProductOnServer,
  deleteProductOnServer,
  submitAgentOnServer,
  updateAgentOnServer,
  connectRealtimeStream
} from './utils/realtimeClient';
import {
  Zap,
  Star,
  Flame,
  Clock,
  ChevronRight,
  TrendingUp,
  ThumbsUp,
  Sparkles,
  ShoppingBag,
  Store,
  ShieldCheck,
  CheckCircle2,
  Download,
  Share2,
  Search,
  X,
  Wifi,
  WifiOff,
  ArrowLeft,
  BellRing,
  Smartphone
} from 'lucide-react';

const STORAGE_KEY_PRODUCTS = 'marketplaces_products_v2';
const STORAGE_KEY_ORDERS = 'marketplaces_orders_v2';
const STORAGE_KEY_AGENTS = 'marketplaces_agents_v2';
const STORAGE_KEY_CART = 'marketplaces_cart_v2';
const STORAGE_THEME = 'marketplaces_theme_v2';

export default function App() {
  // Language & Theme State
  const [language, setLanguage] = useState<SupportedLanguage>(() => getSavedLanguage());
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
    }
  }, [language]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem(STORAGE_THEME, nextTheme);
    } catch {}
  };

  // Products State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Agent Applications State
  const [agentApplications, setAgentApplications] = useState<AgentApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AGENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      {
        id: 'agent-app-demo',
        userId: 'agent-101',
        userName: 'রফিকুল ইসলাম',
        userPhone: '01811223344',
        userEmail: 'rafiq@shop.com',
        shopName: 'রফিক গ্যাজেট জোন',
        shopCategory: 'গ্যাজেট ও ইলেকট্রনিক্স',
        address: 'দোকান ১২, মোতালেব প্লাজা, ঢাকা',
        status: 'approved',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(agentApplications));
    } catch {}
  }, [agentApplications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  // Filters & Sub-Tabs matching Temu screenshot
  const [selectedCategory, setSelectedCategory] = useState<string>('সব পণ্য');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'deals' | '5-star' | 'best-selling'>('all');

  // Network Connectivity Status (Strict Online-Only enforcement)
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // 1. Initial active online test on mount
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
    } else {
      testLiveInternetConnection().then((connected) => {
        setIsOnline(connected);
      });
    }

    // 2. Real-time online/offline event handlers
    const handleOnline = async () => {
      const live = await testLiveInternetConnection();
      if (live) {
        setIsOnline(true);
        setShowOnlineToast(true);
        setTimeout(() => setShowOnlineToast(false), 3500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Periodic lightweight connectivity check (zero mobile lag, no network choking)
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const [activeNavTab, setActiveNavTab] = useState<'home' | 'categories' | 'you' | 'cart'>('home');
  const [variantSheetProduct, setVariantSheetProduct] = useState<Product | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [productModalState, setProductModalState] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAgentPortalOpen, setIsAgentPortalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [recentLiveOrder, setRecentLiveOrder] = useState<Order | null>(null);
  const [showLiveOrderBanner, setShowLiveOrderBanner] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
    method: 'gmail' | 'phone';
  }>({
    isOpen: false,
    mode: 'login',
    method: 'gmail'
  });

  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [messagesSection, setMessagesSection] = useState<MessagesSubSection>('inbox');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [trustModalState, setTrustModalState] = useState<{
    isOpen: boolean;
    tab: TrustProtectionTab;
  }>({ isOpen: false, tab: 'privacy' });
  const [isSupportCenterOpen, setIsSupportCenterOpen] = useState(false);

  const isAnyModalOpen =
    isSearchModalOpen ||
    !!detailProduct ||
    !!quickOrderProduct ||
    !!reviewProduct ||
    !!confirmedOrder ||
    isCartOpen ||
    isAgentPortalOpen ||
    isAdminPanelOpen ||
    isCustomerOrdersOpen ||
    isUserProfileOpen ||
    isDownloadModalOpen ||
    isMenuDrawerOpen ||
    authModalConfig.isOpen ||
    productModalState.isOpen ||
    !!variantSheetProduct ||
    isMessagesOpen ||
    isSettingsOpen ||
    isLanguageSelectorOpen ||
    trustModalState.isOpen ||
    isSupportCenterOpen;

  // Dispatcher to close a modal by key (called on popstate / back button)
  const handleCloseModalByKey = useCallback((key: ModalKey) => {
    switch (key) {
      case 'search_modal':
        setIsSearchModalOpen(false);
        break;
      case 'product_detail':
        setDetailProduct(null);
        break;
      case 'menu_drawer':
        setIsMenuDrawerOpen(false);
        break;
      case 'admin_panel':
        setIsAdminPanelOpen(false);
        break;
      case 'agent_portal':
        setIsAgentPortalOpen(false);
        break;
      case 'quick_order':
        setQuickOrderProduct(null);
        break;
      case 'order_confirmation':
        setConfirmedOrder(null);
        break;
      case 'product_form':
        setProductModalState({ isOpen: false, product: null });
        break;
      case 'auth_modal':
        setAuthModalConfig((prev) => ({ ...prev, isOpen: false }));
        break;
      case 'customer_orders':
        setIsCustomerOrdersOpen(false);
        break;
      case 'user_profile':
        setIsUserProfileOpen(false);
        break;
      case 'review_modal':
        setReviewProduct(null);
        break;
      case 'cart_drawer':
        setIsCartOpen(false);
        break;
      case 'download_modal':
        setIsDownloadModalOpen(false);
        break;
      case 'variant_sheet':
        setVariantSheetProduct(null);
        break;
      case 'messages_modal':
        setIsMessagesOpen(false);
        break;
      case 'settings_modal':
        setIsSettingsOpen(false);
        break;
      case 'language_selector':
        setIsLanguageSelectorOpen(false);
        break;
      case 'trust_protection':
        setTrustModalState((prev) => ({ ...prev, isOpen: false }));
        break;
      case 'support_center':
        setIsSupportCenterOpen(false);
        break;
    }
  }, []);

  // Back Navigation Hook: handles phone back button, Android navigation bar, swipe back gestures
  const {
    pushModal,
    popModal,
    showExitToast
  } = useBackNavigation({
    onCloseModal: handleCloseModalByKey,
    isAnyModalOpen,
    onRootBack: () => {
      if (activeNavTab !== 'home') {
        setActiveNavTab('home');
        return true;
      }
      return false;
    }
  });

  // Dedicated helper to ensure only ONE main modal or overlay is visible at a time
  const closeAllOverlays = useCallback(() => {
    setIsSearchModalOpen(false);
    setIsUserProfileOpen(false);
    setIsCustomerOrdersOpen(false);
    setIsCartOpen(false);
    setIsAdminPanelOpen(false);
    setIsAgentPortalOpen(false);
    setIsDownloadModalOpen(false);
    setIsMenuDrawerOpen(false);
    setDetailProduct(null);
    setQuickOrderProduct(null);
    setReviewProduct(null);
    setConfirmedOrder(null);
    setVariantSheetProduct(null);
    setIsMessagesOpen(false);
    setIsSettingsOpen(false);
    setIsLanguageSelectorOpen(false);
    setTrustModalState((prev) => ({ ...prev, isOpen: false }));
    setIsSupportCenterOpen(false);
  }, []);

  const openVariantSheet = (prod: Product) => {
    closeAllOverlays();
    setVariantSheetProduct(prod);
    pushModal('variant_sheet');
  };
  const closeVariantSheet = () => {
    popModal('variant_sheet');
  };

  const openMessages = (section: MessagesSubSection = 'inbox') => {
    closeAllOverlays();
    setMessagesSection(section);
    setIsMessagesOpen(true);
    pushModal('messages_modal');
  };
  const closeMessages = () => {
    popModal('messages_modal');
  };

  const openTrustTab = (tab: TrustProtectionTab) => {
    closeAllOverlays();
    setTrustModalState({ isOpen: true, tab });
    pushModal('trust_protection');
  };
  const closeTrustTab = () => {
    popModal('trust_protection');
  };

  const openSupportCenter = () => {
    closeAllOverlays();
    setIsSupportCenterOpen(true);
    pushModal('support_center');
  };
  const closeSupportCenter = () => {
    popModal('support_center');
  };

  const openSettings = () => {
    closeAllOverlays();
    setIsSettingsOpen(true);
    pushModal('settings_modal');
  };
  const closeSettings = () => {
    popModal('settings_modal');
  };

  const openLanguageSelector = () => {
    setIsLanguageSelectorOpen(true);
    pushModal('language_selector');
  };
  const closeLanguageSelector = () => {
    popModal('language_selector');
  };

  // Dedicated Open & Close Handlers that keep React State & Browser History in exact sync:
  const openMenuDrawer = () => {
    closeAllOverlays();
    setIsMenuDrawerOpen(true);
    pushModal('menu_drawer');
  };
  const closeMenuDrawer = () => {
    popModal('menu_drawer');
  };

  const openAdminPanel = () => {
    closeAllOverlays();
    setIsAdminPanelOpen(true);
    pushModal('admin_panel');
  };
  const closeAdminPanel = () => {
    popModal('admin_panel');
  };

  const openAgentPortal = () => {
    closeAllOverlays();
    setIsAgentPortalOpen(true);
    pushModal('agent_portal');
  };
  const closeAgentPortal = () => {
    popModal('agent_portal');
  };

  const openSearchModal = () => {
    closeAllOverlays();
    setIsSearchModalOpen(true);
    pushModal('search_modal');
  };
  const closeSearchModal = () => {
    popModal('search_modal');
  };

  const openProductDetail = (prod: Product) => {
    closeAllOverlays();
    setDetailProduct(prod);
    pushModal('product_detail');
  };
  const closeProductDetail = () => {
    popModal('product_detail');
  };

  const openQuickOrder = (prod: Product) => {
    closeAllOverlays();
    setQuickOrderProduct(prod);
    pushModal('quick_order');
  };
  const closeQuickOrder = () => {
    popModal('quick_order');
  };

  const openConfirmedOrder = (order: Order) => {
    closeAllOverlays();
    setConfirmedOrder(order);
    pushModal('order_confirmation');
  };
  const closeConfirmedOrder = () => {
    popModal('order_confirmation');
  };

  const openProductForm = (product: Product | null = null) => {
    setProductModalState({ isOpen: true, product });
    pushModal('product_form');
  };
  const closeProductForm = () => {
    popModal('product_form');
  };

  const openAuth = (mode: 'login' | 'register' = 'login', method: 'gmail' | 'phone' = 'gmail') => {
    setAuthModalConfig({ isOpen: true, mode, method });
    pushModal('auth_modal');
  };
  const closeAuth = () => {
    popModal('auth_modal');
  };

  const openCustomerOrders = () => {
    closeAllOverlays();
    setIsCustomerOrdersOpen(true);
    pushModal('customer_orders');
  };
  const closeCustomerOrders = () => {
    popModal('customer_orders');
  };

  const openReviewModal = (prod: Product) => {
    closeAllOverlays();
    setReviewProduct(prod);
    pushModal('review_modal');
  };
  const closeReviewModal = () => {
    popModal('review_modal');
  };

  const openCart = () => {
    closeAllOverlays();
    setIsCartOpen(true);
    pushModal('cart_drawer');
  };
  const closeCart = () => {
    popModal('cart_drawer');
  };

  const openDownloadModal = () => {
    closeAllOverlays();
    setIsDownloadModalOpen(true);
    pushModal('download_modal');
  };
  const closeDownloadModal = () => {
    popModal('download_modal');
  };

  const openUserProfile = () => {
    closeAllOverlays();
    setActiveNavTab('you');
    setIsUserProfileOpen(true);
    pushModal('user_profile');
  };
  const closeUserProfile = () => {
    popModal('user_profile');
  };

  // User Authentication - Strictly kingriday3@gmail.com for admin
  const [currentUser, setCurrentUserSession] = useState<User | null>(() => getCurrentUser());
  const isAdmin = currentUser ? isAuthorizedAdminEmail(currentUser.identifier) : false;
  const walletKey = useMemo(() => getWalletKey(currentUser), [currentUser]);

  // Persistent Wallet, Refund Claims & AI Support Config State
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [refundClaims, setRefundClaims] = useState<RefundClaim[]>([]);
  const [supportConfig, setSupportConfig] = useState<SupportAgentConfig>({
    enabled: true,
    agentName: 'Market places AI Assistant',
    greetingBn:
      'হ্যালো! আমি Market places Support Assistant। আপনার অর্ডার ট্র্যাকিং, ডেলিভারি গ্যারান্টি, রিফান্ড ক্লেইম বা ওয়ালেট ক্রেডিট সম্পর্কে যেকোনো প্রশ্ন করুন।',
    greetingEn:
      'Hello! I am Market places Support Assistant. Ask me anything about order tracking, delivery guarantee, refund claims, or wallet credits.',
    customInstructions:
      'Always respond politely, honor nationwide 24-72h COD delivery guarantee, 50-day refund policy, and never expose admin credentials.',
    supportPhone: '+880 1700-000000',
    supportWhatsapp: '+880 1700-000000',
    updatedAt: new Date().toISOString()
  });

  // Load wallet whenever walletKey changes
  useEffect(() => {
    let active = true;
    fetchWallet(walletKey).then((w) => {
      if (active && w) setWallet(w);
    });
    return () => {
      active = false;
    };
  }, [walletKey]);

  // Real-time Order Stream & Product Sync Listener (Cross-Tab Broadcast + Server SSE Cross-Device)
  useEffect(() => {
    let mounted = true;

    const syncProductsIntoActiveViews = (incomingProducts: Product[]) => {
      setProducts(incomingProducts);
      const map = new Map(incomingProducts.map((p) => [p.id, p]));
      setDetailProduct((prev) => (prev && map.has(prev.id) ? map.get(prev.id)! : prev));
      setQuickOrderProduct((prev) => (prev && map.has(prev.id) ? map.get(prev.id)! : prev));
      setVariantSheetProduct((prev) => (prev && map.has(prev.id) ? map.get(prev.id)! : prev));
      setCartItems((prev) =>
        prev.map((item) => (map.has(item.product.id) ? { ...item, product: map.get(item.product.id)! } : item))
      );
    };

    const hydrateFromServer = () => {
      fetchBootstrapState().then((data) => {
        if (!mounted || !data) return;
        if (Array.isArray(data.products) && data.products.length > 0) {
          syncProductsIntoActiveViews(data.products);
        }
        if (Array.isArray(data.orders)) {
          setOrders((prev) => {
            const map = new Map<string, Order>();
            data.orders.forEach((o) => map.set(o.id, o));
            prev.forEach((o) => {
              if (!map.has(o.id)) map.set(o.id, o);
            });
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
        if (Array.isArray(data.agents) && data.agents.length > 0) {
          setAgentApplications(data.agents);
        }
        if (Array.isArray(data.refunds)) {
          setRefundClaims(data.refunds);
        }
        if (data.supportConfig) {
          setSupportConfig(data.supportConfig);
        }
      });
    };

    // 1. Hydrate latest products, orders, agents, refunds & support config from Express server DB
    hydrateFromServer();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        hydrateFromServer();
      }
    };
    window.addEventListener('focus', hydrateFromServer);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // 2. Live SSE push stream for zero-lag order, wallet, refund & catalog updates
    const disconnectSSE = connectRealtimeStream({
      onOrderCreated: (incomingOrder: Order) => {
        setOrders((prev) => {
          if (prev.some((o) => o.id === incomingOrder.id)) return prev;
          return [incomingOrder, ...prev];
        });
        setRecentLiveOrder(incomingOrder);
        setShowLiveOrderBanner(true);
        if (isAuthorizedAdminEmail(getCurrentUser()?.identifier)) {
          playOrderAlertSound();
        }
        setTimeout(() => setShowLiveOrderBanner(false), 8000);
      },
      onOrderUpdated: (updatedOrder: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      },
      onOrderDeleted: (orderId: string) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      },
      onProductsUpdated: (incomingProducts: Product[]) => {
        if (Array.isArray(incomingProducts) && incomingProducts.length > 0) {
          syncProductsIntoActiveViews(incomingProducts);
        }
      },
      onAgentsUpdated: (incomingAgents: AgentApplication[]) => {
        if (Array.isArray(incomingAgents)) {
          setAgentApplications(incomingAgents);
        }
      },
      onWalletUpdated: (incomingWallet: WalletAccount) => {
        const activeKey = getWalletKey(getCurrentUser());
        if (incomingWallet.walletKey === activeKey) {
          setWallet(incomingWallet);
        }
      },
      onRefundCreated: (claim: RefundClaim) => {
        setRefundClaims((prev) => (prev.some((c) => c.id === claim.id) ? prev : [claim, ...prev]));
      },
      onRefundUpdated: (claim: RefundClaim) => {
        setRefundClaims((prev) => prev.map((c) => (c.id === claim.id ? claim : c)));
      },
      onSupportConfigUpdated: (cfg: SupportAgentConfig) => {
        setSupportConfig(cfg);
      }
    });

    // 3. Local same-browser BroadcastChannel fallback
    const unsubscribe = subscribeToNewOrders(
      (incomingOrder: Order) => {
        setOrders((prev) => {
          if (prev.some((o) => o.id === incomingOrder.id)) return prev;
          return [incomingOrder, ...prev];
        });
        setRecentLiveOrder(incomingOrder);
        setShowLiveOrderBanner(true);
        setTimeout(() => setShowLiveOrderBanner(false), 8000);
      },
      (updatedOrder: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      },
      (incomingProducts: Product[]) => {
        if (Array.isArray(incomingProducts) && incomingProducts.length > 0) {
          syncProductsIntoActiveViews(incomingProducts);
        }
      }
    );

    return () => {
      mounted = false;
      window.removeEventListener('focus', hydrateFromServer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      disconnectSSE();
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserSession(null);
  };

  const handleClaimFreeGift = async (): Promise<boolean> => {
    const res = await claimPromoCredit(walletKey, 'FREE_GIFT_50');
    if (res.wallet) {
      setWallet(res.wallet);
    }
    return res.ok;
  };

  const handleUpdateRefundClaim = async (
    claimId: string,
    status: RefundClaim['status'],
    refundCreditAmount?: number,
    adminNote?: string
  ) => {
    const res = await updateRefundClaim(claimId, {
      status,
      refundCreditAmount,
      adminNote,
      adminEmail: currentUser?.identifier || ''
    });
    if (res.ok && res.claim) {
      setRefundClaims((prev) => prev.map((c) => (c.id === res.claim!.id ? res.claim! : c)));
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    openCart();
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Orders - Instant Real-Time Zero-Lag Push to Server & Admin Panel
  const handleOrderSuccess = (newOrder: Order) => {
    setOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });

    // Zero-lag push to backend server (pushes SSE event immediately to admin's devices)
    void pushOrderToServer(newOrder).then(() => {
      if (newOrder.creditUsed && newOrder.creditUsed > 0) {
        fetchWallet(walletKey).then((w) => {
          if (w) setWallet(w);
        });
      }
    });

    // Broadcast instantly to local browser tabs
    broadcastNewOrder(newOrder);

    // Show instant live notification banner
    setRecentLiveOrder(newOrder);
    setShowLiveOrderBanner(true);
    setTimeout(() => setShowLiveOrderBanner(false), 8000);

    if (quickOrderProduct) {
      closeQuickOrder();
    }
    if (isCartOpen) {
      closeCart();
    }
    openConfirmedOrder(newOrder);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: Order['status'],
    trackingStep?: 1 | 2 | 3 | 4,
    cancelReason?: string
  ) => {
    const computedStep =
      trackingStep || (status === 'delivered' ? 4 : status === 'confirmed' ? 2 : 1);

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updated: Order = {
          ...o,
          status,
          trackingStep: status === 'cancelled' ? undefined : computedStep,
          cancelReason: status === 'cancelled' ? cancelReason : o.cancelReason
        };
        broadcastOrderUpdate(updated);
        return updated;
      })
    );

    void updateOrderOnServer(orderId, {
      status,
      trackingStep: status === 'cancelled' ? undefined : computedStep,
      cancelReason
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    void deleteOrderOnServer(orderId);
  };

  // Product CRUD (Immediate local update + Server persistence & SSE broadcast to all phones/web/links)
  const handleSaveProduct = (product: Product) => {
    const stampedProduct: Product = {
      ...product,
      updatedAt: product.updatedAt || new Date().toISOString()
    };

    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === stampedProduct.id);
      let next: Product[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = stampedProduct;
      } else {
        next = [stampedProduct, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {}
      broadcastProductsUpdate(next);
      return next;
    });

    setDetailProduct((prev) => (prev && prev.id === stampedProduct.id ? stampedProduct : prev));
    setQuickOrderProduct((prev) => (prev && prev.id === stampedProduct.id ? stampedProduct : prev));
    setVariantSheetProduct((prev) => (prev && prev.id === stampedProduct.id ? stampedProduct : prev));
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === stampedProduct.id ? { ...item, product: stampedProduct } : item))
    );

    void saveProductOnServer(stampedProduct).then((serverProducts) => {
      if (serverProducts && serverProducts.length > 0) {
        setProducts(serverProducts);
      }
    });
    closeProductForm();
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {}
      broadcastProductsUpdate(next);
      return next;
    });
    void deleteProductOnServer(productId);
  };

  // Agent Multi-Vendor Operations
  const handleApplyAgent = (appData: Omit<AgentApplication, 'id' | 'createdAt' | 'status'>) => {
    const newApp: AgentApplication = {
      ...appData,
      id: `agent-app-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setAgentApplications((prev) => [newApp, ...prev]);
    void submitAgentOnServer(newApp);
  };

  const handleApproveAgent = (applicationId: string) => {
    setAgentApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: 'approved' } : a))
    );
    void updateAgentOnServer(applicationId, 'approved');
  };

  const handleRejectAgent = (applicationId: string) => {
    setAgentApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: 'rejected' } : a))
    );
    void updateAgentOnServer(applicationId, 'rejected');
  };

  const handleAddAgentProduct = (
    productData: Omit<Product, 'id' | 'rating' | 'reviewCount' | 'sellerRole' | 'approvalStatus'>
  ) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-agent-${Date.now()}`,
      rating: 5.0,
      reviewCount: 1,
      sellerRole: 'agent',
      approvalStatus: 'pending'
    };
    setProducts((prev) => [newProduct, ...prev]);
    void saveProductOnServer(newProduct);
  };

  const handleApproveProduct = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, approvalStatus: 'approved' } : p))
    );
    void updateProductOnServer(productId, { approvalStatus: 'approved' });
  };

  const handleRejectProduct = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, approvalStatus: 'rejected' } : p))
    );
    void updateProductOnServer(productId, { approvalStatus: 'rejected' });
  };

  // Filtered Products for Catalog
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      // Normal users only see approved products or admin products
      if (isAdmin) return true;
      return p.approvalStatus === 'approved' || !p.approvalStatus;
    });

    // Category filter
    if (selectedCategory !== 'সব পণ্য') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    // Secondary sub-tab filter (All | Deals | 5-Star Rated | Best-Selling Items)
    if (activeSubTab === 'deals') {
      list = list.filter((p) => p.lightningDeal || (p.badge && p.badge.includes('SALE')));
    } else if (activeSubTab === '5-star') {
      list = list.filter((p) => (p.rating || 5) >= 4.8);
    } else if (activeSubTab === 'best-selling') {
      list = list.filter((p) => p.soldCount || (p.badge && p.badge.includes('বিক্রয়')));
    }

    return list;
  }, [products, selectedCategory, searchQuery, activeSubTab, isAdmin]);

  // Lightning Deals List for Horizontal Carousel
  const lightningDeals = useMemo(() => {
    return products.filter((p) => p.lightningDeal || (p.badge && p.badge.includes('SALE'))).slice(0, 8);
  }, [products]);

  // Current user's agent application
  const myAgentApplication = useMemo(() => {
    if (!currentUser) return null;
    return agentApplications.find(
      (a) => a.userId === currentUser.id || a.userPhone === currentUser.identifier || a.userEmail === currentUser.identifier
    ) || null;
  }, [agentApplications, currentUser]);

  const myAgentProducts = useMemo(() => {
    if (!currentUser) return [];
    return products.filter((p) => p.sellerId === currentUser.id);
  }, [products, currentUser]);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f7f7f7] text-slate-900'}`}>
      
      {activeNavTab === 'home' && (
        <>
          {/* 1. Authentic TEMU Header matching user screenshot */}
          <Header
            currentUser={currentUser}
            onLoginClick={() => openAuth('login', 'gmail')}
            onLogoutClick={handleLogout}
            onAdminPanelClick={openAdminPanel}
            onAgentPortalClick={openAgentPortal}
            onMyOrdersClick={openCustomerOrders}
            onUserProfileClick={() => {
              closeAllOverlays();
              setActiveNavTab('you');
            }}
            onCartClick={() => {
              closeAllOverlays();
              setActiveNavTab('cart');
            }}
            onDownloadClick={openDownloadModal}
            cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            orderCount={orders.length}
        onSelectCategory={setSelectedCategory}
        activeCategory={selectedCategory}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        language={language}
        onLanguageChange={handleLanguageChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        onProductSelect={openQuickOrder}
        isOnline={isOnline}
        isMenuDrawerOpen={isMenuDrawerOpen}
        onOpenMenuDrawer={openMenuDrawer}
        onCloseMenuDrawer={closeMenuDrawer}
        onSearchClick={openSearchModal}
        onOpenLanguageSelector={openLanguageSelector}
        onOpenPrivacy={() => openTrustTab('privacy')}
        onOpenGuarantee={(tab) => openTrustTab(tab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-5 py-3 sm:py-4">
        
        {/* 2. Lightning deals section */}
        <section className="mb-4 bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-black dark:text-white fill-black dark:fill-white" />
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-1 cursor-pointer">
                <span>{t('lightningDeals', language)}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('limitedTimeOffers', language)}
            </span>
          </div>

          {/* Horizontal scroll cards */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {lightningDeals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => openProductDetail(deal)}
                className="w-36 sm:w-44 shrink-0 bg-[#fafafa] dark:bg-slate-800/80 rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-700/80 cursor-pointer hover:shadow-md transition-all group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <img
                    src={deal.image}
                    alt={getProductTitle(deal, language)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {deal.stockLeft && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {t('onlyLeft', language)}: {toBengaliNumber(deal.stockLeft, language)}
                    </span>
                  )}
                  {deal.badge && (
                    <span className="absolute top-1.5 left-1.5 bg-[#d9261c] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                      {getBadgeLabel(deal.badge, language)}
                    </span>
                  )}
                </div>

                {/* Price and sold info */}
                <div className="p-2 sm:p-2.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs sm:text-sm font-black text-[#fb7701]">
                      {formatTaka(deal.price, language)}
                    </span>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold truncate">
                      {deal.soldCount
                        ? `${deal.soldCount.replace(/\s*sold/i, '').trim()} ${t('sold', language)}`
                        : `${toBengaliNumber('8.7', language)}K+ ${t('sold', language)}`}
                    </span>
                  </div>

                  {/* Stock progress bar with timer icon */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-slate-900 dark:bg-slate-300 rounded-full" />
                    </div>
                    <Clock className="w-2.5 h-2.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Secondary Sub-Filter Row */}
        <section className="mb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none whitespace-nowrap text-xs sm:text-sm font-bold pb-2">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`relative py-1 cursor-pointer transition-colors ${
                activeSubTab === 'all'
                  ? 'text-slate-950 dark:text-white font-extrabold'
                  : 'text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white font-bold'
              }`}
            >
              <span>{t('tabAll', language)}</span>
              {activeSubTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 dark:bg-white rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('deals')}
              className={`relative py-1 flex items-center gap-1 cursor-pointer transition-colors ${
                activeSubTab === 'deals'
                  ? 'text-slate-950 dark:text-white font-extrabold'
                  : 'text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white font-bold'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{t('tabDeals', language)}</span>
              {activeSubTab === 'deals' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 dark:bg-white rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('5-star')}
              className={`relative py-1 flex items-center gap-1 cursor-pointer transition-colors ${
                activeSubTab === '5-star'
                  ? 'text-slate-950 dark:text-white font-extrabold'
                  : 'text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white font-bold'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>{t('tab5Star', language)}</span>
              {activeSubTab === '5-star' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 dark:bg-white rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('best-selling')}
              className={`relative py-1 flex items-center gap-1 cursor-pointer transition-colors ${
                activeSubTab === 'best-selling'
                  ? 'text-slate-950 dark:text-white font-extrabold'
                  : 'text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white font-bold'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{t('tabBestSelling', language)}</span>
              {activeSubTab === 'best-selling' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 dark:bg-white rounded-full" />
              )}
            </button>
          </div>
        </section>

        {/* 4. 2-Column Product Grid */}
        <section id="product-catalog-section">
          {/* Active Search Status Banner with Clear Button */}
          {searchQuery.trim() && (
            <div className="mb-3.5 p-3 bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#fb7701]" />
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {t('searchFoundForPrefix', language)} ‘{searchQuery}’ —{' '}
                  {toBengaliNumber(filteredProducts.length, language)} {t('itemsFoundSuffix', language)}
                </span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-slate-600 text-[#fb7701] font-bold rounded-xl border border-orange-200 dark:border-slate-600 flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                title={t('clearSearch', language)}
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('clearSearchBtn', language)}</span>
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {t('noCategoryProducts', language)}
              </h4>
              <button
                onClick={() => {
                  setSelectedCategory('সব পণ্য');
                  setSearchQuery('');
                  setActiveSubTab('all');
                }}
                className="px-5 py-2 bg-[#fb7701] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {t('viewAllProducts', language)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((product) => (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  language={language}
                  onProductClick={openProductDetail}
                  onOrderClick={openQuickOrder}
                  onAddToCart={openVariantSheet}
                  onEditClick={(p) => openProductForm(p)}
                  onDeleteClick={handleDeleteProduct}
                  onReviewClick={openReviewModal}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </>
  )}

  {/* 2. Authentic Categories Page matching Screenshots 5 & 6 */}
  {activeNavTab === 'categories' && (
    <div className="flex-1 pb-20">
      <TemuCategoriesView
        products={products}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setActiveNavTab('home');
        }}
        onOpenSearch={openSearchModal}
        language={language}
      />
    </div>
  )}

  {/* 3. Authentic You / Profile Page matching Screenshot 7 */}
  {activeNavTab === 'you' && (
    <div className="flex-1 pb-20">
      <TemuYouView
        currentUser={currentUser}
        orders={orders}
        products={products}
        onOpenOrders={openCustomerOrders}
        onOpenSettings={openSettings}
        onOpenMessages={() => openMessages('inbox')}
        onOpenProductDetail={openProductDetail}
        onQuickOrder={openQuickOrder}
        onAddToCart={openVariantSheet}
        onOpenReviews={openReviewModal}
        onOpenLogin={() => openAuth('login', 'gmail')}
        isAdmin={isAdmin}
        onOpenAdminPanel={openAdminPanel}
        onOpenDownload={openDownloadModal}
        onOpenWallet={() => openMessages('wallet')}
        onOpenSupportCenter={openSupportCenter}
        onClaimFreeGift={handleClaimFreeGift}
        walletBalance={wallet?.balance || 0}
        freeGiftClaimed={Boolean(wallet?.claimedPromos?.includes('FREE_GIFT_50'))}
        language={language}
      />
    </div>
  )}

  {/* 4. Authentic Cart Page matching Screenshots 1 & 3 */}
  {activeNavTab === 'cart' && (
    <div className="flex-1 pb-20">
      <TemuCartView
        cartItems={cartItems}
        products={products}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckout={openCart}
        onBackToHome={() => setActiveNavTab('home')}
        onProductClick={openProductDetail}
        onOrderClick={openQuickOrder}
        onAddToCart={openVariantSheet}
        onOpenReviews={openReviewModal}
        onOpenTrustTab={openTrustTab}
        language={language}
      />
    </div>
  )}

  {/* Floating Shopping Cart Trigger on Home if cart has items */}
  {activeNavTab === 'home' && cartItems.length > 0 && !isCartOpen && (
    <button
      onClick={() => setActiveNavTab('cart')}
      className="fixed bottom-20 right-4 z-40 bg-[#fb7701] hover:bg-[#e65100] text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce cursor-pointer"
      title={t('cart', language)}
    >
      <ShoppingBag className="w-6 h-6" />
      <span className="font-black text-xs">
        {toBengaliNumber(cartItems.reduce((sum, item) => sum + item.quantity, 0), language)}{' '}
        {t('itemsCountLabel', language)}
      </span>
    </button>
  )}

  {/* Floating Super Admin Control Dashboard Shortcut */}
  {isAdmin && (
    <button
      onClick={openAdminPanel}
      className="fixed bottom-20 left-4 z-40 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:brightness-110 text-white px-3.5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-emerald-300/80 cursor-pointer active:scale-95 transition-all text-xs font-black backdrop-blur-md"
      title={t('adminDashboard', language)}
    >
      <ShieldCheck className="w-4 h-4 text-white" />
      <span>{t('navAdmin', language)}</span>
      {orders.filter((o) => o.status === 'pending').length > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
          {toBengaliNumber(orders.filter((o) => o.status === 'pending').length, language)}
        </span>
      )}
    </button>
  )}

  {/* Mobile Bottom Navigation Bar (Matches Temu 4 Tabs: Home, Categories, You, Cart) */}
  <AppBottomNav
    currentUser={currentUser}
    orderCount={orders.length}
    cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
    language={language}
    activeTab={activeNavTab}
    onTabChange={(tab) => {
      closeAllOverlays();
      setActiveNavTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}
  />

  {/* Temu Variant Selection Bottom Sheet matching Screenshot 2 */}
  <TemuVariantSheet
    isOpen={!!variantSheetProduct}
    onClose={closeVariantSheet}
    product={variantSheetProduct}
    onConfirm={() => {
      if (variantSheetProduct) {
        handleAddToCart(variantSheetProduct);
        closeVariantSheet();
      }
    }}
    language={language}
  />

      {/* MODALS - All with Step-by-Step Hardware Back Button & Gesture Support */}

      {/* Temu Full-Screen Search Modal matching user screenshot */}
      <TemuSearchModal
        isOpen={isSearchModalOpen}
        onClose={closeSearchModal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        onProductClick={(prod) => {
          closeSearchModal();
          openProductDetail(prod);
        }}
        onOrderClick={(prod) => {
          closeSearchModal();
          openQuickOrder(prod);
        }}
        onAddToCart={handleAddToCart}
        language={language}
      />

      {/* Product Detail Modal with Gallery, Reviews & Step-by-Step Back Navigation */}
      <ProductDetailModal
        isOpen={!!detailProduct}
        product={detailProduct}
        onClose={closeProductDetail}
        onOrderNow={(prod) => {
          closeProductDetail();
          openQuickOrder(prod);
        }}
        onAddToCart={handleAddToCart}
        onOpenReviews={(prod) => {
          closeProductDetail();
          openReviewModal(prod);
        }}
        language={language}
      />

      {/* Cart Drawer & Checkout */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        cartItems={cartItems}
        language={language}
        walletBalance={wallet?.balance || 0}
        walletKey={walletKey}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckoutSuccess={handleOrderSuccess}
      />

      {/* 1-Tap Quick Cash on Delivery Order Modal */}
      {quickOrderProduct && (
        <QuickOrderModal
          onClose={closeQuickOrder}
          product={quickOrderProduct}
          language={language}
          onSuccess={handleOrderSuccess}
          currentUser={currentUser}
          walletBalance={wallet?.balance || 0}
          walletKey={walletKey}
        />
      )}

      {/* Order Confirmation modal */}
      {confirmedOrder && (
        <OrderConfirmationModal
          onClose={closeConfirmedOrder}
          order={confirmedOrder}
          language={language}
        />
      )}

      {/* Agent & Multi-Vendor Seller Portal Modal */}
      <AgentPortalModal
        isOpen={isAgentPortalOpen}
        onClose={closeAgentPortal}
        currentUser={currentUser}
        agentApplication={myAgentApplication}
        onSubmitApplication={handleApplyAgent}
        agentProducts={myAgentProducts}
        onAddAgentProduct={handleAddAgentProduct}
        onOpenLogin={() => openAuth('login', 'gmail')}
      />

      {/* Super Admin Control Panel Modal (Strictly kingriday3@gmail.com) */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={closeAdminPanel}
        currentUser={currentUser}
        products={products}
        orders={orders}
        agentApplications={agentApplications}
        onApproveAgent={handleApproveAgent}
        onRejectAgent={handleRejectAgent}
        onApproveProduct={handleApproveProduct}
        onRejectProduct={handleRejectProduct}
        onAddProduct={() => openProductForm(null)}
        onEditProduct={(p) => openProductForm(p)}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        onAdminLoginSuccess={(adminUser) => setCurrentUserSession(adminUser)}
        refundClaims={refundClaims}
        onUpdateRefundClaim={handleUpdateRefundClaim}
        onOpenSupportAiSetup={openSupportCenter}
      />

      {/* Product Add / Edit Modal for Admin */}
      {productModalState.isOpen && (
        <ProductFormModal
          onClose={closeProductForm}
          onSave={handleSaveProduct}
          product={productModalState.product}
        />
      )}

      {/* User Login & Registration Modal */}
      <AuthModal
        isOpen={authModalConfig.isOpen}
        onClose={closeAuth}
        initialMode={authModalConfig.mode}
        initialMethod={authModalConfig.method}
        onAuthSuccess={(user: User) => {
          setCurrentUserSession(user);
          setCurrentUser(user);
        }}
        language={language}
      />

      {/* Customer Orders History Modal (Matches Screenshots 1 & 2) */}
      <CustomerOrdersModal
        isOpen={isCustomerOrdersOpen}
        onClose={closeCustomerOrders}
        currentUser={currentUser}
        orders={orders}
        products={products}
        onReorderProduct={(title) => {
          const match = products.find((p) => p.title === title || p.titleEn === title);
          if (match) {
            handleAddToCart(match);
          }
        }}
        language={language}
      />

      {/* Temu Messages, Promotions & Credit Balance Wallet Modal */}
      <TemuMessagesModal
        isOpen={isMessagesOpen}
        initialSection={messagesSection}
        onClose={closeMessages}
        products={products}
        wallet={wallet}
        walletKey={walletKey}
        onWalletUpdated={(updatedWallet) => setWallet(updatedWallet)}
        onOpenProductDetail={openProductDetail}
        onQuickOrder={openQuickOrder}
        onAddToCart={openVariantSheet}
        onOpenReviews={openReviewModal}
        onOpenOrders={() => {
          closeMessages();
          openCustomerOrders();
        }}
        onOpenSupportCenter={openSupportCenter}
        onOpenTrustTab={openTrustTab}
        language={language}
      />

      {/* Temu Settings Modal */}
      <TemuSettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        currentUser={currentUser}
        onLogout={handleLogout}
        language={language}
        onOpenLanguageSelector={openLanguageSelector}
        isAdmin={isAdmin}
        onOpenAdminPanel={openAdminPanel}
        onOpenTrustTab={openTrustTab}
      />

      {/* Security & Privacy / Guaranteed Refund / Delivery Guarantee Modal */}
      <TrustProtectionModal
        isOpen={trustModalState.isOpen}
        initialTab={trustModalState.tab}
        onClose={closeTrustTab}
        currentUser={currentUser}
        walletKey={walletKey}
        orders={orders}
        refundClaims={refundClaims}
        onRefundSubmitted={(claim) =>
          setRefundClaims((prev) => (prev.some((c) => c.id === claim.id) ? prev : [claim, ...prev]))
        }
        onOpenOrders={openCustomerOrders}
        onOpenSupport={openSupportCenter}
        language={language}
      />

      {/* Market places Support Center with Editable Store AI Agent */}
      <SupportCenterModal
        isOpen={isSupportCenterOpen}
        onClose={closeSupportCenter}
        currentUser={currentUser}
        isAdmin={isAdmin}
        orders={orders}
        walletBalance={wallet?.balance || 0}
        supportConfig={supportConfig}
        onConfigUpdated={(cfg) => setSupportConfig(cfg)}
        onOpenOrders={openCustomerOrders}
        onOpenRefundCenter={() => openTrustTab('refund')}
        onOpenDeliveryGuarantee={() => openTrustTab('delivery')}
        onOpenWallet={() => openMessages('wallet')}
        language={language}
      />

      {/* 108+ World Languages Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageSelectorOpen}
        onClose={closeLanguageSelector}
        currentLanguage={language}
        onSelectLanguage={handleLanguageChange}
      />

      {/* User Profile Modal (Full Customer/Admin Profile with Edit & Order Stats) */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={closeUserProfile}
        currentUser={currentUser}
        orders={orders}
        products={products}
        onOpenOrders={() => {
          closeUserProfile();
          openCustomerOrders();
        }}
        onOpenSearch={openSearchModal}
        onOpenAdminPanel={isAdmin ? openAdminPanel : undefined}
        onOpenAgentPortal={openAgentPortal}
        onOpenDownload={openDownloadModal}
        onOpenMessages={() => openMessages('inbox')}
        onOpenSettings={openSettings}
        onOpenProductDetail={openProductDetail}
        onQuickOrder={openQuickOrder}
        onAddToCart={openVariantSheet}
        onOpenReviews={openReviewModal}
        onLogout={handleLogout}
        onOpenLogin={() => openAuth('login', 'gmail')}
        onUserUpdated={(updated) => setCurrentUserSession(updated)}
        language={language}
      />

      {/* 5-Star Product Reviews & Ratings Modal */}
      {reviewProduct && (
        <ProductReviewsModal
          isOpen={!!reviewProduct}
          onClose={closeReviewModal}
          product={reviewProduct}
          currentUser={currentUser}
          language={language}
          onReviewAdded={() => {}}
        />
      )}

      {/* PWA & Share Modal */}
      <PWAInstallModal
        isOpen={isDownloadModalOpen}
        onClose={closeDownloadModal}
        products={products}
        language={language}
      />

      {/* Real-Time Live Order Alert Banner (Direct Instant Push Notification) */}
      {showLiveOrderBanner && recentLiveOrder && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000002] max-w-md w-[92vw] bg-slate-900/98 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border-2 border-[#fb7701] backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#fb7701] flex items-center justify-center text-white shrink-0 animate-bounce shadow">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse">
                  {language === 'bn' ? 'নতুন অর্ডার!' : 'New Order!'}
                </span>
                <span className="text-xs font-bold truncate">{recentLiveOrder.customerName}</span>
              </div>
              <div className="text-[11px] text-slate-300 truncate">
                {recentLiveOrder.productTitle} • <span className="text-amber-400 font-bold">{formatTaka(recentLiveOrder.totalAmount, language)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin ? (
              <button
                onClick={() => {
                  setShowLiveOrderBanner(false);
                  openAdminPanel();
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow transition-colors"
              >
                {language === 'bn' ? 'অর্ডার দেখুন' : 'View Order'}
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowLiveOrderBanner(false);
                  openCustomerOrders();
                }}
                className="px-2.5 py-1.5 bg-[#fb7701] hover:bg-[#e65100] text-white text-[11px] font-bold rounded-lg cursor-pointer shadow transition-colors"
              >
                {language === 'bn' ? 'ট্র্যাকিং' : 'Track'}
              </button>
            )}
            <button
              onClick={() => setShowLiveOrderBanner(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Phone Back Button Double-Tap Exit Guard Toast */}
      {showExitToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000000] bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <ArrowLeft className="w-4 h-4 text-[#fb7701]" />
          <span>{t('exitPrompt', language)}</span>
        </div>
      )}

      {/* Strict Online-Only Blocking Overlay - Completely blocks app usage when disconnected */}
      {!isOnline && (
        <OfflineBlocker
          language={language}
          onRetrySuccess={() => {
            setIsOnline(true);
            setShowOnlineToast(true);
            setTimeout(() => setShowOnlineToast(false), 3500);
          }}
        />
      )}

      {/* Live Internet Restored Toast Notification */}
      {showOnlineToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000000] bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top duration-300 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{t('onlineSyncMode', language)}</span>
        </div>
      )}

    </div>
  );
}
