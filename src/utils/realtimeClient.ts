import type {
  Product,
  Order,
  AgentApplication,
  WalletAccount,
  RefundClaim,
  SupportAgentConfig,
  User
} from '../types';

export interface BootstrapPayload {
  products: Product[];
  orders: Order[];
  agents: AgentApplication[];
  refunds?: RefundClaim[];
  supportConfig?: SupportAgentConfig;
  serverTime: string;
}

const GUEST_WALLET_STORAGE_KEY = 'marketplaces_guest_wallet_key';

export function getWalletKey(currentUser: User | null): string {
  if (currentUser?.identifier) {
    return currentUser.identifier.trim().toLowerCase();
  }
  if (typeof window !== 'undefined') {
    let existing = localStorage.getItem(GUEST_WALLET_STORAGE_KEY);
    if (!existing) {
      existing = `guest-${Math.random().toString(36).slice(2, 10)}`;
      try {
        localStorage.setItem(GUEST_WALLET_STORAGE_KEY, existing);
      } catch {}
    }
    return existing;
  }
  return 'guest-default';
}

export async function fetchBootstrapState(): Promise<BootstrapPayload | null> {
  try {
    const res = await fetch('/api/bootstrap', { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as BootstrapPayload;
  } catch {
    return null;
  }
}

export async function fetchWallet(walletKey: string): Promise<WalletAccount | null> {
  try {
    const res = await fetch(`/api/wallet?walletKey=${encodeURIComponent(walletKey)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.wallet || null;
  } catch {
    return null;
  }
}

export async function claimPromoCredit(
  walletKey: string,
  promoId: 'PROMO_250' | 'FREE_GIFT_50' | 'WELCOME_100'
): Promise<{ ok: boolean; wallet?: WalletAccount; creditedAmount?: number; error?: string }> {
  try {
    const res = await fetch('/api/wallet/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletKey, promoId })
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, wallet: data.wallet, error: data.error || 'Could not claim bonus' };
    }
    return { ok: true, wallet: data.wallet, creditedAmount: data.creditedAmount };
  } catch {
    return { ok: false, error: 'Network error while claiming credit' };
  }
}

export async function adjustWalletCredit(
  walletKey: string,
  amount: number,
  reason: string,
  adminEmail: string
): Promise<{ ok: boolean; wallet?: WalletAccount; error?: string }> {
  try {
    const res = await fetch('/api/wallet/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletKey, amount, reason, adminEmail })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, wallet: data.wallet };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function submitRefundClaim(
  payload: Omit<RefundClaim, 'id' | 'status' | 'createdAt'>
): Promise<{ ok: boolean; claim?: RefundClaim; error?: string }> {
  try {
    const res = await fetch('/api/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Failed to submit refund request' };
    return { ok: true, claim: data.claim };
  } catch {
    return { ok: false, error: 'Network error submitting refund request' };
  }
}

export async function updateRefundClaim(
  claimId: string,
  payload: {
    status: RefundClaim['status'];
    adminNote?: string;
    refundCreditAmount?: number;
    adminEmail: string;
  }
): Promise<{ ok: boolean; claim?: RefundClaim; error?: string }> {
  try {
    const res = await fetch(`/api/refunds/${encodeURIComponent(claimId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, claim: data.claim };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function updateSupportConfig(
  config: Partial<SupportAgentConfig>,
  adminEmail: string
): Promise<{ ok: boolean; supportConfig?: SupportAgentConfig; error?: string }> {
  try {
    const res = await fetch('/api/support/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, adminEmail })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, supportConfig: data.supportConfig };
  } catch {
    return { ok: false, error: 'Network error updating support config' };
  }
}

export async function sendSupportAiMessage(payload: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  language: string;
  customerContext?: {
    name?: string;
    creditBalance?: number;
    recentOrders?: Array<{ id: string; productTitle: string; status: string; totalAmount: number }>;
  };
}): Promise<{ ok: boolean; reply?: string; agentName?: string; error?: string }> {
  try {
    const res = await fetch('/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Support AI unavailable right now' };
    }
    return { ok: true, reply: data.reply, agentName: data.agentName };
  } catch {
    return { ok: false, error: 'Network error connecting to Support AI' };
  }
}

export async function pushOrderToServer(order: Order): Promise<Order | null> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order || order;
  } catch {
    return null;
  }
}

export async function updateOrderOnServer(
  orderId: string,
  payload: { status: Order['status']; trackingStep?: 1 | 2 | 3 | 4; cancelReason?: string }
): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order || null;
  } catch {
    return null;
  }
}

export async function deleteOrderOnServer(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveProductOnServer(product: Product): Promise<Product[] | null> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : null;
  } catch {
    return null;
  }
}

export async function updateProductOnServer(productId: string, updates: Partial<Product>): Promise<Product[] | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : null;
  } catch {
    return null;
  }
}

export async function deleteProductOnServer(productId: string): Promise<Product[] | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : null;
  } catch {
    return null;
  }
}

export async function submitAgentOnServer(agent: AgentApplication): Promise<AgentApplication[] | null> {
  try {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.agents) ? data.agents : null;
  } catch {
    return null;
  }
}

export async function updateAgentOnServer(
  agentId: string,
  status: AgentApplication['status']
): Promise<AgentApplication[] | null> {
  try {
    const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.agents) ? data.agents : null;
  } catch {
    return null;
  }
}

export interface RealtimeHandlers {
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onOrderDeleted?: (id: string) => void;
  onProductsUpdated?: (products: Product[]) => void;
  onAgentsUpdated?: (agents: AgentApplication[]) => void;
  onWalletUpdated?: (wallet: WalletAccount) => void;
  onRefundCreated?: (claim: RefundClaim) => void;
  onRefundUpdated?: (claim: RefundClaim) => void;
  onSupportConfigUpdated?: (config: SupportAgentConfig) => void;
  onConnected?: () => void;
}

export function connectRealtimeStream(handlers: RealtimeHandlers): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let es: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const connect = () => {
    if (closed) return;
    try {
      es = new EventSource('/api/events');

      es.addEventListener('connected', () => {
        handlers.onConnected?.();
      });

      es.addEventListener('order:created', (e) => {
        try {
          const order = JSON.parse((e as MessageEvent).data) as Order;
          handlers.onOrderCreated?.(order);
        } catch {}
      });

      es.addEventListener('order:updated', (e) => {
        try {
          const order = JSON.parse((e as MessageEvent).data) as Order;
          handlers.onOrderUpdated?.(order);
        } catch {}
      });

      es.addEventListener('order:deleted', (e) => {
        try {
          const payload = JSON.parse((e as MessageEvent).data) as { id: string };
          if (payload?.id) handlers.onOrderDeleted?.(payload.id);
        } catch {}
      });

      es.addEventListener('products:updated', (e) => {
        try {
          const products = JSON.parse((e as MessageEvent).data) as Product[];
          if (Array.isArray(products)) handlers.onProductsUpdated?.(products);
        } catch {}
      });

      es.addEventListener('agents:updated', (e) => {
        try {
          const agents = JSON.parse((e as MessageEvent).data) as AgentApplication[];
          if (Array.isArray(agents)) handlers.onAgentsUpdated?.(agents);
        } catch {}
      });

      es.addEventListener('wallet:updated', (e) => {
        try {
          const wallet = JSON.parse((e as MessageEvent).data) as WalletAccount;
          if (wallet?.walletKey) handlers.onWalletUpdated?.(wallet);
        } catch {}
      });

      es.addEventListener('refund:created', (e) => {
        try {
          const claim = JSON.parse((e as MessageEvent).data) as RefundClaim;
          if (claim?.id) handlers.onRefundCreated?.(claim);
        } catch {}
      });

      es.addEventListener('refund:updated', (e) => {
        try {
          const claim = JSON.parse((e as MessageEvent).data) as RefundClaim;
          if (claim?.id) handlers.onRefundUpdated?.(claim);
        } catch {}
      });

      es.addEventListener('support:config', (e) => {
        try {
          const config = JSON.parse((e as MessageEvent).data) as SupportAgentConfig;
          if (config) handlers.onSupportConfigUpdated?.(config);
        } catch {}
      });

      es.onerror = () => {
        if (es) {
          es.close();
          es = null;
        }
        if (!closed && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 2000);
        }
      };
    } catch {
      if (!closed && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, 3000);
      }
    }
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (es) es.close();
  };
}
