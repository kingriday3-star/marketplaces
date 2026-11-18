/**
 * Real-time Order Alert, Sound Chime & Cross-Tab Synchronizer
 * Uses Web Audio API for zero-dependency, crystal-clear order chime
 * and BroadcastChannel for instant multi-tab sync.
 */

import { Order } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a pleasant e-commerce cash register / order ding chime
 */
export function playOrderAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic Chord (Major Pentatonic sparkle: C6, E6, G6, C7)
    const notes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });

    // Hardware vibration on Android/mobile if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([120, 60, 200]);
    }
  } catch (err) {
    console.warn('Could not play order audio alert:', err);
  }
}

// Broadcast Channel for live cross-tab communication
const CHANNEL_NAME = 'marketplaces_realtime_orders_v1';
let channel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
}

/**
 * Broadcast an incoming order to all components, tabs and admin panel
 */
export function broadcastNewOrder(order: Order) {
  // 1. Play sound chime immediately
  playOrderAlertSound();

  // 2. Dispatch custom DOM event in current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('marketplaces:new_order', { detail: order }));
  }

  // 3. Post to BroadcastChannel for any other tabs (e.g. Admin opened in another tab)
  if (channel) {
    try {
      channel.postMessage({ type: 'NEW_ORDER', order });
    } catch {
      // ignore
    }
  }
}

/**
 * Broadcast an updated order (e.g. status changed, tracking step updated, or cancelled with reason)
 */
export function broadcastOrderUpdate(order: Order) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('marketplaces:order_updated', { detail: order }));
  }
  if (channel) {
    try {
      channel.postMessage({ type: 'ORDER_UPDATED', order });
    } catch {
      // ignore
    }
  }
}

/**
 * Broadcast full products catalog update (so all guest & customer tabs get new pictures and descriptions instantly)
 */
export function broadcastProductsUpdate(products: any[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('marketplaces:products_updated', { detail: products }));
  }
  if (channel) {
    try {
      channel.postMessage({ type: 'PRODUCTS_UPDATED', products });
    } catch {
      // ignore
    }
  }
}

/**
 * Subscribe to real-time incoming orders from anywhere
 */
export function subscribeToNewOrders(
  onNewOrder: (order: Order) => void,
  onOrderUpdated?: (order: Order) => void,
  onProductsUpdated?: (products: any[]) => void
): () => void {
  const handleNewOrderEvent = (event: Event) => {
    const custom = event as CustomEvent<Order>;
    if (custom.detail) {
      onNewOrder(custom.detail);
    }
  };

  const handleOrderUpdatedEvent = (event: Event) => {
    const custom = event as CustomEvent<Order>;
    if (custom.detail && onOrderUpdated) {
      onOrderUpdated(custom.detail);
    }
  };

  const handleProductsUpdatedEvent = (event: Event) => {
    const custom = event as CustomEvent<any[]>;
    if (custom.detail && onProductsUpdated) {
      onProductsUpdated(custom.detail);
    }
  };

  const handleChannelMsg = (event: MessageEvent) => {
    if (!event.data) return;
    if (event.data.type === 'NEW_ORDER' && event.data.order) {
      onNewOrder(event.data.order);
    } else if (event.data.type === 'ORDER_UPDATED' && event.data.order && onOrderUpdated) {
      onOrderUpdated(event.data.order);
    } else if (event.data.type === 'PRODUCTS_UPDATED' && event.data.products && onProductsUpdated) {
      onProductsUpdated(event.data.products);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('marketplaces:new_order', handleNewOrderEvent);
    window.addEventListener('marketplaces:order_updated', handleOrderUpdatedEvent);
    window.addEventListener('marketplaces:products_updated', handleProductsUpdatedEvent);
  }

  if (channel) {
    channel.addEventListener('message', handleChannelMsg);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('marketplaces:new_order', handleNewOrderEvent);
      window.removeEventListener('marketplaces:order_updated', handleOrderUpdatedEvent);
      window.removeEventListener('marketplaces:products_updated', handleProductsUpdatedEvent);
    }
    if (channel) {
      channel.removeEventListener('message', handleChannelMsg);
    }
  };
}
