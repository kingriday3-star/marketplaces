import { User } from '../types';

interface StoredUserAccount extends User {
  passwordHash: string;
}

const STORAGE_USERS = 'marketplaces_users_v2';
const STORAGE_CURRENT_SESSION = 'marketplaces_session_v2';

export const ADMIN_DEFAULT_EMAIL = 'kingriday3@gmail.com';
export const ADMIN_DEFAULT_PASS = 'Hridoy9400?';

export function isAuthorizedAdminEmail(identifier?: string | null): boolean {
  if (!identifier) return false;
  return identifier.trim().toLowerCase() === ADMIN_DEFAULT_EMAIL.toLowerCase();
}

const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'user-admin-root',
    name: 'সুপার এডমিন',
    identifier: ADMIN_DEFAULT_EMAIL,
    type: 'email',
    role: 'admin',
    createdAt: new Date().toISOString(),
    passwordHash: ADMIN_DEFAULT_PASS
  }
];

export function getStoredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;
        parsed.forEach((u: StoredUserAccount) => {
          if (isAuthorizedAdminEmail(u.identifier)) {
            u.role = 'admin';
            if (u.passwordHash !== ADMIN_DEFAULT_PASS) {
              u.passwordHash = ADMIN_DEFAULT_PASS;
              modified = true;
            }
          } else if (u.role === 'admin') {
            u.role = 'customer';
            modified = true;
          }
        });
        if (modified) {
          saveStoredUsers(parsed);
        }
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: StoredUserAccount[]) {
  try {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_SESSION);
    if (raw) {
      return JSON.parse(raw) as User;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setCurrentUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_CURRENT_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_CURRENT_SESSION);
    }
  } catch {
    // ignore
  }
}

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('880') && cleaned.length >= 13) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

export function isEmailAddress(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

export interface SendOtpResult {
  ok: boolean;
  channel?: 'gmail' | 'phone';
  deliveryChannel?: 'email_gateway' | 'sms_gateway';
  emailConfigured?: boolean;
  maskedTarget?: string;
  deliveredTo?: string;
  sentAt?: string;
  expiresInSeconds?: number;
  gatewayNotConfigured?: boolean;
  error?: string;
}

export async function fetchAuthEmailStatus(): Promise<{
  emailConfigured: boolean;
  provider: 'gmail_smtp' | 'smtp' | 'resend' | 'none';
  smsConfigured: boolean;
}> {
  try {
    const res = await fetch('/api/auth/email-status', { cache: 'no-store' });
    if (!res.ok) return { emailConfigured: false, provider: 'none', smsConfigured: false };
    return await res.json();
  } catch {
    return { emailConfigured: false, provider: 'none', smsConfigured: false };
  }
}

export async function sendSignupOtp(
  identifier: string,
  channel: 'gmail' | 'phone',
  otpEmail?: string
): Promise<SendOtpResult> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, channel, otpEmail })
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        gatewayNotConfigured: Boolean(data.gatewayNotConfigured),
        error: data.error || 'Could not send verification code'
      };
    }
    return data as SendOtpResult;
  } catch {
    return { ok: false, error: 'Network error while sending verification code' };
  }
}

export async function verifySignupOtp(
  identifier: string,
  channel: 'gmail' | 'phone',
  code: string
): Promise<{ ok: boolean; verificationToken?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, channel, code })
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Invalid verification code' };
    }
    return { ok: true, verificationToken: data.verificationToken };
  } catch {
    return { ok: false, error: 'Network error verifying code' };
  }
}

export async function registerWithOtpServer(
  name: string,
  identifier: string,
  password: string,
  channel: 'gmail' | 'phone',
  verificationToken: string
): Promise<{ user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, identifier, password, channel, verificationToken })
    });
    const data = await res.json();
    if (!res.ok || !data.user) {
      return { error: data.error || 'Registration failed' };
    }

    const user = data.user as User;
    const users = getStoredUsers();
    if (!users.some((u) => u.identifier.toLowerCase() === user.identifier.toLowerCase())) {
      users.push({ ...user, passwordHash: password.trim() });
      saveStoredUsers(users);
    }
    setCurrentUser(user);
    return { user };
  } catch {
    return { error: 'Network error during registration' };
  }
}

export async function authenticateWithServer(
  identifier: string,
  password: string
): Promise<{ user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      const user = data.user as User;
      setCurrentUser(user);
      return { user };
    }
    if (res.status === 401) {
      // Fallback check local cache in case user registered offline earlier
      const localResult = authenticateUser(identifier, password);
      if (localResult.user) return localResult;
      return { error: data.error || 'Invalid login credentials' };
    }
    return { error: data.error || 'Login failed' };
  } catch {
    return authenticateUser(identifier, password);
  }
}

export function authenticateUser(identifier: string, password: string): { user?: User; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  const users = getStoredUsers();

  const isEmail = isEmailAddress(cleanId);
  const normalizedPhone = !isEmail ? normalizePhoneNumber(cleanId) : '';

  const found = users.find((u) => {
    if (isEmail && u.type === 'email') {
      return u.identifier.toLowerCase() === cleanId;
    }
    if (!isEmail && u.type === 'phone') {
      const storedPhone = normalizePhoneNumber(u.identifier);
      return storedPhone === normalizedPhone || storedPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(storedPhone);
    }
    return u.identifier.toLowerCase() === cleanId;
  });

  if (!found) {
    return { error: 'এই জিমেইল বা মোবাইল নম্বরে কোনো একাউন্ট পাওয়া যায়নি। দয়া করে সাইনআপ করুন।' };
  }

  if (found.passwordHash !== cleanPass) {
    return { error: 'পাসওয়ার্ডটি ভুল হয়েছে। পুনরায় চেষ্টা করুন।' };
  }

  const { passwordHash: _, ...publicUser } = found;
  setCurrentUser(publicUser);
  return { user: publicUser };
}

export function registerNewUser(
  name: string,
  identifier: string,
  password: string
): { user?: User; error?: string } {
  const cleanName = name.trim();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanName) {
    return { error: 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' };
  }

  if (cleanPass.length < 6) {
    return { error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  }

  const isEmail = isEmailAddress(cleanId);
  const isPhone = !isEmail && cleanId.replace(/\D/g, '').length >= 11;

  if (!isEmail && !isPhone) {
    return { error: 'সঠিক জিমেইল (যেমন: name@gmail.com) অথবা সঠিক মোবাইল নম্বর দিন।' };
  }

  const users = getStoredUsers();

  const existing = users.find((u) => u.identifier.toLowerCase() === cleanId);
  if (existing) {
    return { error: 'এই জিমেইল বা নম্বর দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা রয়েছে। লগইন করুন।' };
  }

  const isAdmin = isAuthorizedAdminEmail(cleanId);

  const newUser: StoredUserAccount = {
    id: `user-${Date.now()}`,
    name: cleanName,
    identifier: cleanId,
    type: isEmail ? 'email' : 'phone',
    role: isAdmin ? 'admin' : 'customer',
    createdAt: new Date().toISOString(),
    passwordHash: cleanPass
  };

  users.push(newUser);
  saveStoredUsers(users);

  const { passwordHash: _, ...publicUser } = newUser;
  setCurrentUser(publicUser);
  return { user: publicUser };
}

export function updateUserProfile(updates: Partial<User>): User | null {
  const current = getCurrentUser();
  if (!current) return null;

  const updated: User = {
    ...current,
    ...updates,
    role: isAuthorizedAdminEmail(current.identifier) ? 'admin' : (updates.role || current.role)
  };

  setCurrentUser(updated);

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === current.id || u.identifier.toLowerCase() === current.identifier.toLowerCase());
  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...updates,
      role: isAuthorizedAdminEmail(current.identifier) ? 'admin' : (updates.role || users[index].role)
    };
    saveStoredUsers(users);
  }

  // Sync profile update to server in background
  fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: current.id, identifier: current.identifier, updates })
  }).catch(() => {});

  return updated;
}
