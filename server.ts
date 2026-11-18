import 'dotenv/config';
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS } from './src/data/initialProducts';
import type {
  Product,
  Order,
  AgentApplication,
  User,
  WalletAccount,
  RefundClaim,
  SupportAgentConfig
} from './src/types';

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const ADMIN_EMAIL = 'kingriday3@gmail.com';
const ADMIN_DEFAULT_PASS = process.env.ADMIN_DEFAULT_PASS || 'Hridoy9400?';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

interface StoredUser extends User {
  passwordHash: string;
  verified?: boolean;
}

interface OtpRecord {
  target: string; // normalized email or phone
  rawTarget: string;
  channel: 'gmail' | 'phone';
  codeHash: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  permissionGranted: boolean;
  verificationToken?: string;
  createdAt: number;
}

interface StoreState {
  products: Product[];
  orders: Order[];
  agents: AgentApplication[];
  users: StoredUser[];
  wallets: Record<string, WalletAccount>;
  refunds: RefundClaim[];
  supportConfig: SupportAgentConfig;
}

function defaultSupportConfig(): SupportAgentConfig {
  return {
    enabled: true,
    agentName: 'Market places AI Agent',
    greetingBn:
      'হ্যালো! আমি Market places AI সাপোর্ট এজেন্ট। আপনার অর্ডার ট্র্যাকিং, ডেলিভারি গ্যারান্টি, রিফান্ড ক্লেইম বা ক্রেডিট ব্যালেন্স নিয়ে যেকোনো প্রশ্ন করুন!',
    greetingEn:
      'Hello! I am the Market places AI Support Agent. Ask me about order tracking, delivery guarantee, guaranteed refunds, credit balance, or any product!',
    customInstructions:
      'You are the official customer support AI agent for Market places online shopping marketplace. Be polite, concise, trustworthy, and helpful. Delivery SLA: Inside Dhaka 24-48 hours, Nationwide 64 districts 2-4 business days, Cash on Delivery (pay after checking parcel). Buyer Protection: 30-day & 7-day guaranteed full refund or free replacement for any damaged, wrong, or undelivered issue. Customers can claim promotional bonuses into their Protected Wallet Credit Balance and apply credits at checkout. Always respond in the exact language the customer writes in or their selected app language.',
    supportPhone: '01700000000',
    supportWhatsapp: '8801700000000',
    updatedAt: new Date().toISOString()
  };
}

function normalizeWalletKey(raw?: string): string {
  const cleaned = (raw || 'guest-default').trim().toLowerCase();
  return cleaned || 'guest-default';
}

function getOrCreateWallet(state: StoreState, rawKey?: string): WalletAccount {
  const key = normalizeWalletKey(rawKey);
  if (!state.wallets[key]) {
    state.wallets[key] = {
      walletKey: key,
      balance: 0,
      claimedPromos: [],
      transactions: [],
      updatedAt: new Date().toISOString()
    };
  }
  return state.wallets[key];
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('880') && cleaned.length >= 13) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

function isEmailAddress(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

function normalizeIdentifier(raw: string, channel?: 'gmail' | 'phone'): { key: string; type: 'email' | 'phone' } {
  const trimmed = raw.trim();
  if (channel === 'gmail' || isEmailAddress(trimmed)) {
    return { key: trimmed.toLowerCase(), type: 'email' };
  }
  return { key: normalizePhone(trimmed), type: 'phone' };
}

function hashSecret(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

function maskTarget(raw: string, type: 'email' | 'phone'): string {
  if (type === 'email') {
    const [local, domain] = raw.trim().split('@');
    if (!domain) return raw;
    const prefix = local.slice(0, 2);
    return `${prefix}***@${domain}`;
  }
  const clean = raw.replace(/\D/g, '');
  if (clean.length < 5) return raw;
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

function defaultStore(): StoreState {
  return {
    products: INITIAL_PRODUCTS,
    orders: [],
    agents: [
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
    ],
    users: [
      {
        id: 'user-admin-root',
        name: 'সুপার এডমিন',
        identifier: ADMIN_EMAIL,
        type: 'email',
        role: 'admin',
        verified: true,
        createdAt: new Date().toISOString(),
        passwordHash: ADMIN_DEFAULT_PASS
      }
    ],
    wallets: {},
    refunds: [],
    supportConfig: defaultSupportConfig()
  };
}

function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      const fallback = defaultStore();
      const users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : fallback.users;
      // Guarantee strict admin privilege only on ADMIN_EMAIL
      const sanitizedUsers: StoredUser[] = users.map((u): StoredUser => {
        if (u.identifier.trim().toLowerCase() === ADMIN_EMAIL) {
          return { ...u, role: 'admin', passwordHash: ADMIN_DEFAULT_PASS, verified: true };
        }
        return { ...u, role: u.role === 'admin' ? 'customer' : u.role };
      });
      if (!sanitizedUsers.some((u) => u.identifier.trim().toLowerCase() === ADMIN_EMAIL)) {
        sanitizedUsers.unshift(fallback.users[0]);
      }

      return {
        products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : fallback.products,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        agents: Array.isArray(parsed.agents) && parsed.agents.length > 0 ? parsed.agents : fallback.agents,
        users: sanitizedUsers,
        wallets: parsed.wallets && typeof parsed.wallets === 'object' ? parsed.wallets : {},
        refunds: Array.isArray(parsed.refunds) ? parsed.refunds : [],
        supportConfig:
          parsed.supportConfig && typeof parsed.supportConfig === 'object'
            ? { ...defaultSupportConfig(), ...parsed.supportConfig }
            : defaultSupportConfig()
      };
    }
  } catch (err) {
    console.warn('Could not read store.json, starting fresh:', err);
  }
  const initial = defaultStore();
  saveStore(initial);
  return initial;
}

function saveStore(state: StoreState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store.json:', err);
  }
}

let store: StoreState = loadStore();
const otpRecords = new Map<string, OtpRecord>();

// SSE Clients registry
const sseClients = new Set<Response>();

function broadcastSSE(eventName: string, payload: unknown) {
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function getEmailGatewayStatus(): {
  configured: boolean;
  provider: 'gmail_smtp' | 'smtp' | 'resend' | 'none';
} {
  if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.trim()) {
    return { configured: true, provider: 'gmail_smtp' };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return { configured: true, provider: 'smtp' };
  }
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return { configured: true, provider: 'resend' };
  }
  return { configured: false, provider: 'none' };
}

function formatSpacedOtp(code: string): string {
  const clean = code.replace(/\D/g, '').slice(0, 6);
  if (clean.length === 6) {
    return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  }
  return clean;
}

function formatOtpTimestamp(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function buildOtpEmailHtml(code: string): string {
  const spacedCode = formatSpacedOtp(code);
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0d0e11;padding:28px 16px;color:#ffffff">
    <div style="max-width:440px;margin:0 auto;background:#141519;border-radius:20px;padding:28px 22px;border:1px solid #262830">
      <div style="text-align:center;font-size:28px;font-weight:800;letter-spacing:-0.3px;color:#e5e7eb;margin-bottom:22px">verification code</div>
      <div style="background:#202229;border-radius:16px;padding:16px 18px;margin-bottom:24px;border:1px solid #2d3039">
        <table role="presentation" style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding-bottom:14px;border-bottom:1px solid #2f323c">
              <div style="font-size:12px;color:#9ca3af;margin-bottom:3px">Registering for</div>
              <div style="font-size:16px;font-weight:700;color:#ffffff">Market places ID</div>
            </td>
            <td style="padding-bottom:14px;border-bottom:1px solid #2f323c;text-align:right;vertical-align:middle">
              <div style="display:inline-block;width:40px;height:40px;line-height:40px;text-align:center;background:#fb7701;border-radius:10px;font-size:20px;font-weight:900;color:#ffffff">M</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px">
              <div style="font-size:12px;color:#9ca3af;margin-bottom:3px">From</div>
              <div style="font-size:15px;font-weight:700;color:#ffffff">Market places Store</div>
            </td>
            <td style="padding-top:14px;text-align:right;vertical-align:middle">
              <span style="display:inline-block;padding:5px 10px;background:#059669;border-radius:6px;font-size:11px;font-weight:700;color:#ffffff">VERIFIED</span>
            </td>
          </tr>
        </table>
      </div>
      <p style="text-align:center;color:#e5e7eb;font-size:16px;line-height:1.5;margin:0 0 8px">If you requested to register a Market places ID, use the code below.</p>
      <p style="text-align:center;color:#9ca3af;font-size:13px;line-height:1.5;margin:0 0 22px">নতুন Market places একাউন্ট ভেরিফাই করতে নিচের ৬-ডিজিটের কোডটি ব্যবহার করুন।</p>
      <div style="text-align:center;margin:0 0 22px">
        <span style="display:inline-block;background:#2979ff;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:2px;padding:14px 36px;border-radius:14px">${spacedCode}</span>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:13px;line-height:1.6;margin:0 0 22px">If you didn't request to create a new Market places ID, you can safely ignore this email. Valid for 5 minutes.</p>
      <div style="border-top:1px solid #262830;padding-top:14px;font-size:12px;color:#9ca3af;text-align:center">
        Terms of Service &nbsp;·&nbsp; Privacy Policy
      </div>
    </div>
  </div>`;
}

async function dispatchExternalOtp(
  channel: 'gmail' | 'phone',
  rawTarget: string,
  code: string,
  fallbackEmail?: string
): Promise<{
  deliveryChannel: 'email_gateway' | 'sms_gateway' | 'not_configured' | 'failed';
  deliveredTo?: string;
  error?: string;
}> {
  const emailTarget =
    channel === 'gmail'
      ? rawTarget.trim()
      : fallbackEmail && isEmailAddress(fallbackEmail)
      ? fallbackEmail.trim()
      : '';

  if (emailTarget) {
    const html = buildOtpEmailHtml(code);
    const spaced = formatSpacedOtp(code);
    const text = `Market places Verification Code: ${spaced}\nThis code expires in 5 minutes. Never share it with anyone.`;
    const subject = `Market places Verification Code: ${spaced}`;

    // 2. Gmail SMTP (App Password) -> Works reliably for ANY customer Gmail inbox
    const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
    const gmailUser = (process.env.GMAIL_USER || ADMIN_EMAIL).trim();
    if (gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass
          }
        });
        await transporter.sendMail({
          from: `Market places <${gmailUser}>`,
          to: emailTarget,
          subject,
          text,
          html
        });
        return { deliveryChannel: 'email_gateway', deliveredTo: emailTarget };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gmail SMTP authentication failed';
        console.error('Gmail SMTP OTP delivery failed:', msg);
        return {
          deliveryChannel: 'failed',
          error: `Gmail SMTP error: ${msg}. Please verify GMAIL_USER and GMAIL_APP_PASSWORD in Secrets.`
        };
      }
    }

    // 3. Generic Custom SMTP Server
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const port = Number(process.env.SMTP_PORT || 465);
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST.trim(),
          port,
          secure: port === 465,
          auth: {
            user: process.env.SMTP_USER.trim(),
            pass: process.env.SMTP_PASS
          }
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || `Market places <${process.env.SMTP_USER.trim()}>`,
          to: emailTarget,
          subject,
          text,
          html
        });
        return { deliveryChannel: 'email_gateway', deliveredTo: emailTarget };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'SMTP delivery failed';
        console.error('Custom SMTP OTP delivery failed:', msg);
        return { deliveryChannel: 'failed', error: `SMTP error: ${msg}` };
      }
    }

    // 4. Resend API
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Market places <onboarding@resend.dev>',
            to: [emailTarget],
            subject,
            html
          })
        });
        if (res.ok) {
          return { deliveryChannel: 'email_gateway', deliveredTo: emailTarget };
        }
        const errBody = await res.json().catch(() => ({})) as { message?: string };
        const msg = errBody?.message || `Resend HTTP ${res.status}`;
        console.error('Resend OTP delivery rejected:', msg);
        return {
          deliveryChannel: 'failed',
          error: `Email service error: ${msg}`
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Resend network error';
        console.error('Resend OTP delivery error:', msg);
        return { deliveryChannel: 'failed', error: msg };
      }
    }
  }

  // 5. Twilio SMS for mobile phone verification
  if (
    channel === 'phone' &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      let e164 = rawTarget.replace(/\D/g, '');
      if (e164.startsWith('01') && e164.length === 11) {
        e164 = `+88${e164}`;
      } else if (!e164.startsWith('+')) {
        e164 = `+${e164}`;
      }
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const body = new URLSearchParams({
        To: e164,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: `OTP: ${code}\nUse this code to register your Market places account.\n${formatOtpTimestamp()}`
      });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        }
      );
      if (res.ok) return { deliveryChannel: 'sms_gateway', deliveredTo: e164 };
    } catch (err) {
      console.warn('Twilio SMS OTP delivery failed:', err);
    }
  }

  return {
    deliveryChannel: 'not_configured',
    error:
      'লাইভ ইমেইল কোড পাঠানোর জন্য সার্ভারের Settings > Secrets এ GMAIL_USER এবং GMAIL_APP_PASSWORD (অথবা RESEND_API_KEY) যুক্ত করা প্রয়োজন।'
  };
}

function toPublicUser(u: StoredUser): User {
  const { passwordHash: _, ...rest } = u;
  return rest;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, status: 'online', serverTime: new Date().toISOString() });
  });

  // Bootstrap initial state for zero-lag sync across all phones/devices
  app.get('/api/bootstrap', (_req: Request, res: Response) => {
    res.json({
      products: store.products,
      orders: store.orders,
      agents: store.agents,
      refunds: store.refunds,
      supportConfig: store.supportConfig,
      serverTime: new Date().toISOString()
    });
  });

  // Real-time Server-Sent Events stream (instant order notification to admin & customer)
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, serverTime: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // --- ORDERS API (Instant zero-delay delivery) ---
  app.post('/api/orders', (req: Request, res: Response) => {
    const incoming = req.body as Order;
    if (!incoming || !incoming.customerName || !incoming.customerPhone || !incoming.deliveryAddress) {
      res.status(400).json({ error: 'Missing required order fields' });
      return;
    }

    const order: Order = {
      ...incoming,
      id: incoming.id || `ORD-${Date.now().toString().slice(-6)}`,
      status: incoming.status || 'pending',
      trackingStep: incoming.trackingStep || 1,
      createdAt: incoming.createdAt || new Date().toISOString()
    };

    if (!store.orders.some((o) => o.id === order.id)) {
      // Atomic wallet credit redemption if customer applied credit balance
      if (order.creditUsed && order.creditUsed > 0 && order.walletKey) {
        const wallet = getOrCreateWallet(store, order.walletKey);
        const applied = Math.min(wallet.balance, Math.max(0, Math.round(order.creditUsed)));
        if (applied > 0) {
          wallet.balance = Math.max(0, wallet.balance - applied);
          wallet.transactions.unshift({
            id: `TXN-${Date.now()}`,
            type: 'debit',
            amount: applied,
            reason: `Order credit discount (#${order.id})`,
            orderId: order.id,
            createdAt: new Date().toISOString()
          });
          wallet.updatedAt = new Date().toISOString();
          order.creditUsed = applied;
          broadcastSSE('wallet:updated', wallet);
        } else {
          order.creditUsed = 0;
        }
      }

      store.orders = [order, ...store.orders];
      saveStore(store);
      broadcastSSE('order:created', order);
    }

    res.status(201).json({ ok: true, order });
  });

  app.patch('/api/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, trackingStep, cancelReason } = req.body as Partial<Order>;
    let updatedOrder: Order | null = null;

    store.orders = store.orders.map((o) => {
      if (o.id !== id) return o;
      const nextStatus = status || o.status;
      const newStep = trackingStep || (nextStatus === 'delivered' ? 4 : nextStatus === 'confirmed' ? 2 : 1);
      updatedOrder = {
        ...o,
        status: nextStatus,
        trackingStep: nextStatus === 'cancelled' ? undefined : newStep,
        cancelReason: nextStatus === 'cancelled' ? cancelReason : o.cancelReason
      };
      return updatedOrder;
    });

    if (!updatedOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    saveStore(store);
    broadcastSSE('order:updated', updatedOrder);
    res.json({ ok: true, order: updatedOrder });
  });

  app.delete('/api/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    store.orders = store.orders.filter((o) => o.id !== id);
    saveStore(store);
    broadcastSSE('order:deleted', { id });
    res.json({ ok: true, id });
  });

  // --- PRODUCTS API ---
  app.post('/api/products', (req: Request, res: Response) => {
    const incoming = req.body as Product;
    if (!incoming || !incoming.title) {
      res.status(400).json({ error: 'Invalid product payload' });
      return;
    }
    const product: Product = {
      ...incoming,
      updatedAt: incoming.updatedAt || new Date().toISOString()
    };
    const idx = store.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      store.products[idx] = product;
    } else {
      store.products = [product, ...store.products];
    }
    saveStore(store);
    broadcastSSE('products:updated', store.products);
    res.json({ ok: true, products: store.products });
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body as Partial<Product>;
    store.products = store.products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: updates.updatedAt || new Date().toISOString() } : p
    );
    saveStore(store);
    broadcastSSE('products:updated', store.products);
    res.json({ ok: true, products: store.products });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    store.products = store.products.filter((p) => p.id !== id);
    saveStore(store);
    broadcastSSE('products:updated', store.products);
    res.json({ ok: true, products: store.products });
  });

  // --- AGENTS API ---
  app.post('/api/agents', (req: Request, res: Response) => {
    const appData = req.body as AgentApplication;
    store.agents = [appData, ...store.agents];
    saveStore(store);
    broadcastSSE('agents:updated', store.agents);
    res.status(201).json({ ok: true, agents: store.agents });
  });

  app.patch('/api/agents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as { status: AgentApplication['status'] };
    store.agents = store.agents.map((a) => (a.id === id ? { ...a, status } : a));
    saveStore(store);
    broadcastSSE('agents:updated', store.agents);
    res.json({ ok: true, agents: store.agents });
  });

  // --- OTP & VERIFIED AUTH API ---
  app.get('/api/auth/email-status', async (req: Request, res: Response) => {
    const emailStatus = getEmailGatewayStatus();
    const smsConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
    );
    let smtpVerified: boolean | undefined;
    let verifyError: string | undefined;
    if (req.query.verify === '1' && emailStatus.provider === 'gmail_smtp') {
      const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
      const gmailUser = (process.env.GMAIL_USER || ADMIN_EMAIL).trim();
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: gmailUser, pass: gmailPass }
        });
        await transporter.verify();
        smtpVerified = true;
      } catch (err) {
        smtpVerified = false;
        verifyError = err instanceof Error ? err.message : 'SMTP verification failed';
      }
    }
    res.json({
      ok: true,
      emailConfigured: emailStatus.configured,
      provider: emailStatus.provider,
      smsConfigured,
      ...(typeof smtpVerified === 'boolean' ? { smtpVerified } : {}),
      ...(verifyError ? { verifyError } : {})
    });
  });

  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    const { identifier, channel, otpEmail } = req.body as {
      identifier?: string;
      channel?: 'gmail' | 'phone';
      otpEmail?: string;
    };
    if (!identifier || !identifier.trim()) {
      res.status(400).json({ error: 'Identifier is required' });
      return;
    }

    const chosenChannel: 'gmail' | 'phone' = channel === 'phone' ? 'phone' : 'gmail';
    const { key, type } = normalizeIdentifier(identifier, chosenChannel);

    if (chosenChannel === 'gmail' && !isEmailAddress(identifier)) {
      res.status(400).json({ error: 'Invalid Gmail address' });
      return;
    }
    if (chosenChannel === 'phone' && key.length < 11) {
      res.status(400).json({ error: 'Invalid phone number (minimum 11 digits)' });
      return;
    }
    if (otpEmail && otpEmail.trim() && !isEmailAddress(otpEmail)) {
      res.status(400).json({ error: 'Invalid Gmail address for OTP delivery' });
      return;
    }

    const smsConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
    );
    if (chosenChannel === 'phone' && !smsConfigured && (!otpEmail || !otpEmail.trim())) {
      res.status(400).json({
        error: 'মোবাইল নম্বর ভেরিফিকেশনের ৬-ডিজিটের কোড পেতে আপনার সচল Gmail এড্রেসটি দিন।'
      });
      return;
    }

    // Check duplicate existing user
    const existing = store.users.find((u) => {
      if (u.type === 'email' && type === 'email') return u.identifier.toLowerCase() === key;
      if (u.type === 'phone' && type === 'phone') return normalizePhone(u.identifier) === key;
      return u.identifier.toLowerCase() === key;
    });
    if (existing) {
      res.status(409).json({ error: 'Account already exists for this Gmail or phone number. Please log in.' });
      return;
    }

    // Rate-limit resend to 20s
    const prev = otpRecords.get(key);
    if (prev && Date.now() - prev.createdAt < 20000) {
      const waitSec = Math.ceil((20000 - (Date.now() - prev.createdAt)) / 1000);
      res.status(429).json({ error: `Please wait ${waitSec}s before requesting a new code.` });
      return;
    }

    const code = String(crypto.randomInt(100000, 999999));
    const record: OtpRecord = {
      target: key,
      rawTarget: identifier.trim(),
      channel: chosenChannel,
      codeHash: hashSecret(code),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      verified: false,
      permissionGranted: true,
      createdAt: Date.now()
    };
    otpRecords.set(key, record);

    const dispatch = await dispatchExternalOtp(
      chosenChannel,
      identifier.trim(),
      code,
      otpEmail?.trim()
    );

    if (dispatch.deliveryChannel === 'not_configured') {
      otpRecords.delete(key);
      res.status(503).json({
        gatewayNotConfigured: true,
        error: dispatch.error
      });
      return;
    }

    if (dispatch.deliveryChannel === 'failed') {
      otpRecords.delete(key);
      res.status(502).json({
        error: dispatch.error || 'Could not deliver verification code to your Gmail inbox. Please try again.'
      });
      return;
    }

    const displayTarget =
      dispatch.deliveredTo && dispatch.deliveryChannel === 'email_gateway'
        ? maskTarget(dispatch.deliveredTo, 'email')
        : maskTarget(identifier.trim(), type);

    res.json({
      ok: true,
      channel: chosenChannel,
      deliveryChannel: dispatch.deliveryChannel,
      emailConfigured: getEmailGatewayStatus().configured,
      maskedTarget: displayTarget,
      deliveredTo: dispatch.deliveredTo || (otpEmail?.trim() || undefined),
      sentAt: formatOtpTimestamp(),
      expiresInSeconds: 300
    });
  });

  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    const { identifier, channel, code } = req.body as {
      identifier?: string;
      channel?: 'gmail' | 'phone';
      code?: string;
    };
    if (!identifier || !code) {
      res.status(400).json({ error: 'Verification code is required' });
      return;
    }

    const chosenChannel: 'gmail' | 'phone' = channel === 'phone' ? 'phone' : 'gmail';
    const { key } = normalizeIdentifier(identifier, chosenChannel);
    const record = otpRecords.get(key);

    if (!record) {
      res.status(404).json({ error: 'No active verification code found. Please request a new code.' });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otpRecords.delete(key);
      res.status(410).json({ error: 'Verification code expired. Please resend a new code.' });
      return;
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      otpRecords.delete(key);
      res.status(429).json({ error: 'Too many invalid attempts. Please request a new code.' });
      return;
    }

    if (hashSecret(code.trim()) !== record.codeHash) {
      res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    record.verified = true;
    record.verificationToken = token;

    res.json({ ok: true, verificationToken: token });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, identifier, password, channel, verificationToken } = req.body as {
      name?: string;
      identifier?: string;
      password?: string;
      channel?: 'gmail' | 'phone';
      verificationToken?: string;
    };

    if (!name || !name.trim() || !identifier || !password || password.length < 6) {
      res.status(400).json({ error: 'Valid name, contact, and 6+ character password are required' });
      return;
    }

    const chosenChannel: 'gmail' | 'phone' = channel === 'phone' ? 'phone' : 'gmail';
    const { key, type } = normalizeIdentifier(identifier, chosenChannel);
    const record = otpRecords.get(key);

    if (
      !record ||
      !record.verified ||
      !verificationToken ||
      record.verificationToken !== verificationToken
    ) {
      res.status(403).json({
        error: 'Please verify your 6-digit code from your inbox before creating an account.'
      });
      return;
    }

    const cleanIdentifier = type === 'email' ? identifier.trim().toLowerCase() : normalizePhone(identifier.trim());

    if (store.users.some((u) => u.identifier.toLowerCase() === cleanIdentifier)) {
      res.status(409).json({ error: 'Account already exists. Please sign in.' });
      return;
    }

    const isAdmin = cleanIdentifier.toLowerCase() === ADMIN_EMAIL;
    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      identifier: cleanIdentifier,
      type,
      role: isAdmin ? 'admin' : 'customer',
      verified: true,
      createdAt: new Date().toISOString(),
      passwordHash: password.trim()
    };

    store.users.push(newUser);
    saveStore(store);
    otpRecords.delete(key);

    res.status(201).json({ ok: true, user: toPublicUser(newUser) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body as { identifier?: string; password?: string };
    if (!identifier || !password) {
      res.status(400).json({ error: 'Identifier and password are required' });
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();
    const isEmail = isEmailAddress(cleanId);
    const normalizedPhone = !isEmail ? normalizePhone(cleanId) : '';

    const found = store.users.find((u) => {
      if (isEmail && u.type === 'email') return u.identifier.toLowerCase() === cleanId;
      if (!isEmail && u.type === 'phone') {
        const storedPhone = normalizePhone(u.identifier);
        return storedPhone === normalizedPhone || storedPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(storedPhone);
      }
      return u.identifier.toLowerCase() === cleanId;
    });

    if (!found) {
      res.status(401).json({ error: 'No account found with this Gmail or mobile number.' });
      return;
    }

    if (found.passwordHash !== cleanPass) {
      res.status(401).json({ error: 'Incorrect password.' });
      return;
    }

    res.json({ ok: true, user: toPublicUser(found) });
  });

  app.patch('/api/auth/profile', (req: Request, res: Response) => {
    const { id, identifier, updates } = req.body as { id?: string; identifier?: string; updates?: Partial<User> };
    if (!updates) {
      res.status(400).json({ error: 'Missing profile updates' });
      return;
    }

    let updatedUser: StoredUser | null = null;
    store.users = store.users.map((u) => {
      if ((id && u.id === id) || (identifier && u.identifier.toLowerCase() === identifier.toLowerCase())) {
        const isOwner = u.identifier.toLowerCase() === ADMIN_EMAIL;
        updatedUser = {
          ...u,
          ...updates,
          role: isOwner ? 'admin' : u.role
        };
        return updatedUser;
      }
      return u;
    });

    if (updatedUser) {
      saveStore(store);
      res.json({ ok: true, user: toPublicUser(updatedUser) });
    } else {
      res.json({ ok: true });
    }
  });

  // --- CREDIT BALANCE / WALLET API ---
  const PROMO_BONUS_CATALOG: Record<string, { amount: number; label: string }> = {
    PROMO_250: { amount: 250, label: 'Special Promotional Bonus Credit' },
    FREE_GIFT_50: { amount: 50, label: "Today's Free Gift Bonus Credit" },
    WELCOME_100: { amount: 100, label: 'Welcome Shopping Credit Bonus' }
  };

  app.get('/api/wallet', (req: Request, res: Response) => {
    const walletKey = typeof req.query.walletKey === 'string' ? req.query.walletKey : 'guest-default';
    const wallet = getOrCreateWallet(store, walletKey);
    res.json({ ok: true, wallet });
  });

  app.post('/api/wallet/claim', (req: Request, res: Response) => {
    const { walletKey, promoId } = req.body as { walletKey?: string; promoId?: string };
    const promo = promoId ? PROMO_BONUS_CATALOG[promoId] : undefined;
    if (!promo || !promoId) {
      res.status(400).json({ error: 'Invalid promotional bonus code.' });
      return;
    }

    const wallet = getOrCreateWallet(store, walletKey);
    if (wallet.claimedPromos.includes(promoId)) {
      res.status(409).json({ error: 'This promotional credit has already been claimed.', wallet });
      return;
    }

    wallet.balance += promo.amount;
    wallet.claimedPromos.push(promoId);
    wallet.transactions.unshift({
      id: `TXN-${Date.now()}`,
      type: 'credit',
      amount: promo.amount,
      reason: promo.label,
      promoId,
      createdAt: new Date().toISOString()
    });
    wallet.updatedAt = new Date().toISOString();

    saveStore(store);
    broadcastSSE('wallet:updated', wallet);
    res.json({ ok: true, wallet, creditedAmount: promo.amount });
  });

  app.post('/api/wallet/adjust', (req: Request, res: Response) => {
    const { walletKey, amount, reason, adminEmail } = req.body as {
      walletKey?: string;
      amount?: number;
      reason?: string;
      adminEmail?: string;
    };
    if ((adminEmail || '').trim().toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin authorization required.' });
      return;
    }
    const numericAmount = Number(amount || 0);
    if (!walletKey || !numericAmount) {
      res.status(400).json({ error: 'Wallet key and valid amount required.' });
      return;
    }

    const wallet = getOrCreateWallet(store, walletKey);
    wallet.balance = Math.max(0, wallet.balance + numericAmount);
    wallet.transactions.unshift({
      id: `TXN-${Date.now()}`,
      type: numericAmount >= 0 ? 'credit' : 'debit',
      amount: Math.abs(numericAmount),
      reason: reason?.trim() || 'Admin Credit Adjustment',
      createdAt: new Date().toISOString()
    });
    wallet.updatedAt = new Date().toISOString();

    saveStore(store);
    broadcastSSE('wallet:updated', wallet);
    res.json({ ok: true, wallet });
  });

  // --- GUARANTEED REFUND CLAIMS API ---
  app.get('/api/refunds', (_req: Request, res: Response) => {
    res.json({ ok: true, refunds: store.refunds });
  });

  app.post('/api/refunds', (req: Request, res: Response) => {
    const incoming = req.body as Partial<RefundClaim>;
    if (!incoming.orderId?.trim() || !incoming.customerPhone?.trim() || !incoming.description?.trim()) {
      res.status(400).json({ error: 'Order ID, phone number, and issue description are required.' });
      return;
    }

    const claim: RefundClaim = {
      id: `RFD-${Date.now().toString().slice(-6)}`,
      orderId: incoming.orderId.trim(),
      customerName: incoming.customerName?.trim() || 'Customer',
      customerPhone: incoming.customerPhone.trim(),
      walletKey: normalizeWalletKey(incoming.walletKey || incoming.customerPhone),
      issueType: incoming.issueType || 'damaged',
      description: incoming.description.trim(),
      requestedAmount: Math.max(0, Number(incoming.requestedAmount || 0)),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    store.refunds = [claim, ...store.refunds];
    saveStore(store);
    broadcastSSE('refund:created', claim);
    res.status(201).json({ ok: true, claim });
  });

  app.patch('/api/refunds/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNote, refundCreditAmount, adminEmail } = req.body as {
      status?: RefundClaim['status'];
      adminNote?: string;
      refundCreditAmount?: number;
      adminEmail?: string;
    };

    if ((adminEmail || '').trim().toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin authorization required.' });
      return;
    }

    let updatedClaim: RefundClaim | null = null;
    store.refunds = store.refunds.map((c) => {
      if (c.id !== id) return c;
      updatedClaim = {
        ...c,
        status: status || c.status,
        adminNote: adminNote !== undefined ? adminNote : c.adminNote,
        refundCreditAmount: refundCreditAmount !== undefined ? refundCreditAmount : c.refundCreditAmount
      };
      return updatedClaim;
    });

    if (!updatedClaim) {
      res.status(404).json({ error: 'Refund claim not found.' });
      return;
    }

    // If approved with credit refund amount, immediately credit customer wallet
    const claimRef = updatedClaim as RefundClaim;
    if (claimRef.status === 'approved' && refundCreditAmount && refundCreditAmount > 0) {
      const wallet = getOrCreateWallet(store, claimRef.walletKey);
      wallet.balance += Number(refundCreditAmount);
      wallet.transactions.unshift({
        id: `TXN-${Date.now()}`,
        type: 'credit',
        amount: Number(refundCreditAmount),
        reason: `Guaranteed Refund Payout (#${claimRef.orderId})`,
        orderId: claimRef.orderId,
        createdAt: new Date().toISOString()
      });
      wallet.updatedAt = new Date().toISOString();
      broadcastSSE('wallet:updated', wallet);
    }

    saveStore(store);
    broadcastSSE('refund:updated', updatedClaim);
    res.json({ ok: true, claim: updatedClaim });
  });

  // --- SUPPORT CENTER AI AGENT API (Server-side @google/genai) ---
  app.get('/api/support/config', (_req: Request, res: Response) => {
    res.json({ ok: true, supportConfig: store.supportConfig });
  });

  app.put('/api/support/config', (req: Request, res: Response) => {
    const { config, adminEmail } = req.body as {
      config?: Partial<SupportAgentConfig>;
      adminEmail?: string;
    };
    if ((adminEmail || '').trim().toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin authorization required.' });
      return;
    }
    if (!config) {
      res.status(400).json({ error: 'Support agent config payload required.' });
      return;
    }

    store.supportConfig = {
      ...store.supportConfig,
      ...config,
      updatedAt: new Date().toISOString()
    };
    saveStore(store);
    broadcastSSE('support:config', store.supportConfig);
    res.json({ ok: true, supportConfig: store.supportConfig });
  });

  app.post('/api/support/chat', async (req: Request, res: Response) => {
    const { message, history, language, customerContext } = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'assistant'; text: string }>;
      language?: string;
      customerContext?: {
        name?: string;
        creditBalance?: number;
        recentOrders?: Array<{ id: string; productTitle: string; status: string; totalAmount: number }>;
      };
    };

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const cfg = store.supportConfig;
    if (!cfg.enabled) {
      res.status(503).json({
        error: 'The AI Support Agent is currently paused by store administration. Please contact the helpline directly.'
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in Settings > Secrets yet. Please add it to enable live AI Support Agent responses.'
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          timeout: 15000,
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const catalogDigest = store.products
        .slice(0, 12)
        .map((p) => `- ${p.title} (${p.price} BDT${p.originalPrice ? `, original ${p.originalPrice}` : ''}, category: ${p.category})`)
        .join('\n');

      const ordersDigest =
        customerContext?.recentOrders && customerContext.recentOrders.length > 0
          ? customerContext.recentOrders
              .slice(0, 5)
              .map((o) => `Order #${o.id}: ${o.productTitle} | Status: ${o.status} | Total: ${o.totalAmount} BDT`)
              .join('\n')
          : 'No recent orders on this session.';

      const conversationContext = (history || [])
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Customer' : cfg.agentName}: ${m.text}`)
        .join('\n');

      const systemInstruction = `You are "${cfg.agentName}", the official customer service AI assistant for Market places e-commerce.
Store Owner Instructions: ${cfg.customInstructions}
Helpline Phone: ${cfg.supportPhone} | WhatsApp: ${cfg.supportWhatsapp}
Current User Language Code: ${language || 'bn'} (Always reply fluently and naturally in the language the customer uses or their selected language code).
Customer Name: ${customerContext?.name || 'Valued Customer'}
Customer Wallet Credit Balance: ${customerContext?.creditBalance ?? 0} BDT
Customer Recent Orders:
${ordersDigest}

Featured Catalog Snapshot:
${catalogDigest}

Keep replies concise, clear, empathetic, and structured with short bullet points when listing steps (e.g. how to claim refund, track order, apply credit balance at checkout). Never invent fake order IDs or external promises.`;

      const prompt = conversationContext
        ? `${conversationContext}\nCustomer: ${message.trim()}`
        : message.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction
        }
      });

      const replyText = (response.text ?? '').trim();
      if (!replyText) {
        res.status(502).json({ error: 'Support AI returned an empty response. Please try again.' });
        return;
      }

      res.json({
        ok: true,
        reply: replyText,
        agentName: cfg.agentName
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach AI Support service';
      console.error('Gemini Support AI error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  // Static / Vite dev setup
  if (process.env.NODE_ENV !== 'production') {
    process.env.DISABLE_HMR = process.env.DISABLE_HMR || 'true';
    app.get('/@vite/client', (_req: Request, res: Response) => {
      res.type('application/javascript');
      res.send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {}
  };
}
export function injectQuery(url) { return url; }
export class ErrorOverlay {}
`);
    });
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Market places server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
