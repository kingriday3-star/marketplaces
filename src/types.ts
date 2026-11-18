export interface Product {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  price: number;
  originalPrice?: number;
  sellerPhone: string;
  whatsappNumber: string;
  description: string;
  descriptionEn?: string;
  image: string;
  features?: string[];
  stockStatus: 'in_stock' | 'limited' | 'preorder';
  badge?: string;
  unit?: string;
  rating?: number;
  reviewCount?: number;
  soldCount?: string; // e.g. "8.7K+ sold"
  stockLeft?: number; // e.g. 11
  lightningDeal?: boolean;
  sellerId?: string;
  sellerName?: string;
  sellerRole?: 'admin' | 'agent';
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  updatedAt?: string;
}

export interface OrderLocation {
  lat: number;
  lng: number;
  address?: string;
  mapUrl?: string;
  accuracy?: number;
}

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  deliveryCharge: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  district: string;
  notes?: string;
  paymentMethod: 'cod' | 'bkash' | 'nagad';
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  cancelReason?: string;
  trackingStep?: 1 | 2 | 3 | 4; // 1: Placed, 2: Packed, 3: On The Way, 4: Delivered
  location?: OrderLocation;
  createdAt: string;
  customerId?: string;
  sellerId?: string;
  creditUsed?: number;
  walletKey?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  promoId?: string;
  orderId?: string;
  createdAt: string;
}

export interface WalletAccount {
  walletKey: string;
  balance: number;
  claimedPromos: string[];
  transactions: WalletTransaction[];
  updatedAt: string;
}

export interface RefundClaim {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  walletKey: string;
  issueType: 'damaged' | 'wrong_item' | 'not_delivered' | 'quality_issue' | 'other';
  description: string;
  requestedAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  adminNote?: string;
  refundCreditAmount?: number;
  createdAt: string;
}

export interface SupportAgentConfig {
  enabled: boolean;
  agentName: string;
  greetingBn: string;
  greetingEn: string;
  customInstructions: string;
  supportPhone: string;
  supportWhatsapp: string;
  updatedAt: string;
}

export interface SupportChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userPhone?: string;
  userIdentifier?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
  likes?: number;
}

export type UserRole = 'admin' | 'agent' | 'customer';

export interface User {
  id: string;
  name: string;
  identifier: string; // Email or Phone
  type: 'email' | 'phone';
  role: UserRole;
  shopName?: string;
  isApprovedAgent?: boolean;
  avatar?: string;
  address?: string;
  district?: string;
  alternatePhone?: string;
  notes?: string;
  createdAt: string;
}

export interface AgentApplication {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  shopName: string;
  shopCategory: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ViewMode = 'showcase' | 'grid';
export type AppTheme = 'light' | 'dark';
