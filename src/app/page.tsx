'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Product, CartItem, ChatMessage, ParsedCartItem, AuditEntry } from '@/types';
import { supabase } from '@/lib/supabase';
import CartPanel from '@/components/CartPanel';
import ChatWindow from '@/components/ChatWindow';
import MasalaPacket from '@/components/MasalaPacket';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  image?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Decorative background packets config
const BG_PACKETS = [
  { variant: 'red'     as const, size: 90,  top: '8%',  left: '3%',  delay: '0s',    duration: '7s'  },
  { variant: 'gold'    as const, size: 70,  top: '55%', left: '5%',  delay: '1.5s',  duration: '8.5s' },
  { variant: 'saffron' as const, size: 80,  top: '30%', left: '88%', delay: '3s',    duration: '6.5s' },
  { variant: 'green'   as const, size: 60,  top: '72%', left: '85%', delay: '0.8s',  duration: '9s'  },
  { variant: 'red'     as const, size: 55,  top: '15%', left: '78%', delay: '2.2s',  duration: '7.5s' },
  { variant: 'gold'    as const, size: 100, top: '60%', left: '45%', delay: '4s',    duration: '10s' },
];

export default function HomePage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [auditLog, setAuditLog]     = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toast, setToast]           = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ orderId: string; amount: number } | null>(null);
  const rzpScriptRef = useRef(false);

  // ── Load products from Supabase ──────────────────────────
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock_quantity', 0);
      if (!error && data) setProducts(data as Product[]);
    }
    loadProducts();
  }, []);

  // ── Load Razorpay script once ────────────────────────────
  useEffect(() => {
    if (rzpScriptRef.current) return;
    rzpScriptRef.current = true;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ── Welcome message ──────────────────────────────────────
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: "🙏 Namaskaram! I'm Meena, your Akshaya Swadam shopping assistant.\n\nI can help you pick the freshest spices. Just tell me what you need — in English, Tamil, Telugu, or Hindi!\n\nFor example: \"I need 2 packs of garam masala and one rasam powder\"",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // ── Show toast ───────────────────────────────────────────
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Apply AI cart updates ────────────────────────────────
  const applyCartUpdate = useCallback(
    (items: ParsedCartItem[], intent: string) => {
      if (!items.length) return;

      setCart(prev => {
        const updated = [...prev];

        for (const item of items) {
          const product = products.find(p => p.id === item.product_id);
          if (!product) continue;

          const existingIdx = updated.findIndex(c => c.product.id === item.product_id);

          if (intent === 'remove_from_cart') {
            if (existingIdx >= 0) updated.splice(existingIdx, 1);
          } else {
            if (existingIdx >= 0) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                quantity: updated[existingIdx].quantity + item.quantity,
              };
            } else {
              updated.push({ product, quantity: item.quantity });
            }
          }
        }

        return updated;
      });
    },
    [products]
  );

  // ── Send chat message ────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: messages.slice(-6).map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Chat failed');

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          cartUpdate: data.items,
        };
        setMessages(prev => [...prev, assistantMsg]);

        // Apply cart update
        if (data.items?.length && data.intent !== 'other') {
          applyCartUpdate(data.items, data.intent);
          const names = data.items
            .map((i: ParsedCartItem) => products.find(p => p.id === i.product_id)?.name)
            .filter(Boolean)
            .join(', ');
          if (names && data.intent === 'add_to_cart') {
            showToast(`🛒 Added to cart: ${names}`, 'success');
          }
        }

        // Append audit entry
        if (data.auditEntry) {
          setAuditLog(prev => [data.auditEntry, ...prev].slice(0, 5));
        }
      } catch (err) {
        console.error(err);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "Sorry, something went wrong on my end. Please try again in a moment!",
            timestamp: new Date(),
          },
        ]);
        showToast('Failed to reach assistant', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, products, applyCartUpdate, showToast]
  );

  // ── Cart manipulation ────────────────────────────────────
  const updateQty = useCallback((productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ── Checkout ─────────────────────────────────────────────
  const handleCheckout = useCallback(async () => {
    if (!cart.length || isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      const items = cart.map(c => ({
        product_id: c.product.id,
        quantity: c.quantity,
      }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      const { orderId, amount, currency, keyId, dbOrderId } = data;

      // Open Razorpay modal
      const options: RazorpayOptions = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount,
        currency,
        name: 'Akshaya Swadam',
        description: `Order of ${cart.length} item${cart.length > 1 ? 's' : ''}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          // Verify payment on server
          try {
            const verifyRes = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                db_order_id: dbOrderId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              setPaymentSuccess({ orderId: response.razorpay_order_id, amount });
              clearCart();
            } else {
              showToast('Payment verification failed. Contact support.', 'error');
            }
          } catch {
            showToast('Verification error. Please contact support.', 'error');
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#C8280A' },
        modal: {
          ondismiss: () => showToast('Payment cancelled', 'info'),
        },
      };

      if (!window.Razorpay) {
        showToast('Payment gateway loading... please retry in a second.', 'error');
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Checkout failed', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart, isCheckingOut, clearCart, showToast]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price_in_paise * item.quantity, 0);

  const [mobileTab, setMobileTab]   = useState<'chat' | 'cart'>('chat');
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Duplicate products array for seamless marquee loop
  const marqueeProducts = [...products, ...products];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="site-header" role="banner">
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true">🌶️</div>
          <div className="header-title">
            <h1>Akshaya Swadam</h1>
            <span>Authentic South-Indian Spices</span>
          </div>
        </div>
        <span className="header-badge">🧪 Test Mode</span>
      </header>

      {/* Catalog strip — auto-scrolling marquee */}
      <div className="catalog-strip-outer" role="navigation" aria-label="Product catalog">
        <div className="catalog-strip">
          {marqueeProducts.map((p, idx) => (
            <div key={`${p.id}-${idx}`} className="catalog-chip">
              <span aria-hidden="true">{p.image_emoji}</span>
              {p.name} — ₹{(p.price_in_paise / 100).toFixed(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Tab Bar (< 768px) */}
      <nav className="mobile-tab-bar" aria-label="Mobile navigation">
        <button
          className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileTab('chat')}
          aria-label="Chat assistant tab"
        >
          💬 Chat Guide
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
          onClick={() => setMobileTab('cart')}
          aria-label="Cart tab"
        >
          🛒 Cart
          {totalItemCount > 0 && (
            <span className="mobile-cart-badge">{totalItemCount}</span>
          )}
        </button>
      </nav>

      {/* Main 2-col grid */}
      <main className={`main-grid mobile-show-${mobileTab}`} id="main-content" style={{ position: 'relative' }}>
        {/* Floating Mini Cart Bar on Mobile when chatting */}
        {totalItemCount > 0 && mobileTab === 'chat' && (
          <div className="mobile-floating-cart-bar">
            <div className="mini-cart-info">
              <span className="mini-cart-count">🛒 {totalItemCount} item{totalItemCount > 1 ? 's' : ''}</span>
              <span className="mini-cart-price">₹{(cartTotal / 100).toFixed(2)}</span>
            </div>
            <button
              className="mini-cart-view-btn"
              onClick={() => setMobileTab('cart')}
              id="mobile-view-cart-btn"
            >
              View Cart →
            </button>
          </div>
        )}

        {/* Decorative floating masala packets behind chat */}
        <div className="spice-bg" aria-hidden="true">
          {BG_PACKETS.map((pkt, i) => (
            <div
              key={i}
              className="spice-bg-packet"
              style={{ top: pkt.top, left: pkt.left }}
            >
              <MasalaPacket
                variant={pkt.variant}
                size={pkt.size}
                animationDelay={pkt.delay}
                animationDuration={pkt.duration}
              />
            </div>
          ))}

          {/* Rising spice particle dots */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="spice-particle"
              style={{
                width: `${4 + (i % 3) * 2}px`,
                height: `${4 + (i % 3) * 2}px`,
                background: ['#C8280A', '#FF8C00', '#FFE03A', '#D84020'][i % 4],
                bottom: `${10 + i * 10}%`,
                left: `${8 + i * 11}%`,
                opacity: 0.25,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          products={products}
        />
        <CartPanel
          cart={cart}
          products={products}
          auditLog={auditLog}
          isCheckingOut={isCheckingOut}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
          cartTotal={cartTotal}
        />
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          className={`toast show ${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✗ '}
          {toast.text}
        </div>
      )}

      {/* Payment success overlay */}
      {paymentSuccess && (
        <div className="payment-success" role="dialog" aria-modal="true" aria-label="Payment successful">
          <div className="success-card">
            <span className="success-icon">🎉</span>
            <h2>Order Placed!</h2>
            <p>
              Payment of <strong>₹{(paymentSuccess.amount / 100).toFixed(2)}</strong> confirmed.
              <br />
              <small style={{ color: 'var(--brown-light)', fontSize: '0.72rem' }}>
                Order ID: {paymentSuccess.orderId}
              </small>
            </p>
            <p style={{ fontSize: '0.8rem', marginBottom: 20 }}>
              Your Akshaya Swadam spices will be dispatched shortly. 🙏
            </p>
            <button
              className="pay-btn"
              onClick={() => {
                setPaymentSuccess(null);
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: "🎉 Your order is confirmed! Thank you for shopping with Akshaya Swadam. Your fresh spices will be on their way soon. Is there anything else I can help you with?",
                    timestamp: new Date(),
                  },
                ]);
              }}
              id="close-success-btn"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
