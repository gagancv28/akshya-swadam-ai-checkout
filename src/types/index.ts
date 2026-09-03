// ── Shared TypeScript types across the app ──────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price_in_paise: number;
  stock_quantity: number;
  image_emoji: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ParsedCartItem {
  product_id: string;
  quantity: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cartUpdate?: ParsedCartItem[];
}

export interface GeminiCartResponse {
  intent: 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'checkout' | 'other';
  items: ParsedCartItem[];
  message: string;
  confidence: number;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  aiItems: ParsedCartItem[];
  serverValidatedAmount: number;
  aiClaimedAmount?: number;
  amountMatch: boolean;
}
