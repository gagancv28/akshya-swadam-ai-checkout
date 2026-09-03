'use client';

import type { CartItem, Product, AuditEntry } from '@/types';

interface Props {
  cart: CartItem[];
  products: Product[];
  auditLog: AuditEntry[];
  isCheckingOut: boolean;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  cartTotal: number;
}

export default function CartPanel({
  cart,
  auditLog,
  isCheckingOut,
  onUpdateQty,
  onRemove,
  onClearCart,
  onCheckout,
  cartTotal,
}: Props) {
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const gst       = Math.round(cartTotal * 0.05); // 5% GST illustration
  const grandTotal = cartTotal + gst;

  return (
    <aside className="cart-panel" aria-label="Shopping cart">
      {/* Header */}
      <div className="cart-panel-header">
        <h2>
          🛒 Your Cart
          {itemCount > 0 && (
            <span className="cart-count-badge" aria-label={`${itemCount} items`}>
              {itemCount}
            </span>
          )}
        </h2>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.72rem',
              color: 'rgba(200,150,80,0.75)',
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              fontWeight: 600,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(200,150,80,0.4)',
            }}
            aria-label="Clear all items from cart"
            id="clear-cart-btn"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Items */}
      {cart.length === 0 ? (
        <div className="cart-empty" role="status">
          {/* Animated masala packets */}
          <div className="cart-empty-packets" aria-hidden="true">
            <div style={{
              display: 'inline-block',
              animation: 'float-packet 7s ease-in-out infinite',
              animationDelay: '0s',
              '--sway-start': '-7deg',
              '--sway-mid': '0deg',
              '--sway-end': '7deg',
            } as React.CSSProperties}>
              <svg width="58" height="84" viewBox="0 0 80 116" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 6px 16px rgba(200,40,10,0.35))' }}>
                <defs>
                  <linearGradient id="ec-body-r" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B1A07" /><stop offset="35%" stopColor="#C8280A" /><stop offset="55%" stopColor="#E8401A" /><stop offset="80%" stopColor="#C8280A" /><stop offset="100%" stopColor="#8B1A07" />
                  </linearGradient>
                  <linearGradient id="ec-foil-r" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C8A800" /><stop offset="40%" stopColor="#FFE03A" /><stop offset="60%" stopColor="white" stopOpacity="0.6" /><stop offset="80%" stopColor="#FFE03A" /><stop offset="100%" stopColor="#C8A800" />
                  </linearGradient>
                  <clipPath id="ec-clip-r"><path d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z" /></clipPath>
                </defs>
                <path d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z" fill="url(#ec-body-r)" />
                <rect x="6" y="4" width="68" height="22" rx="4" fill="url(#ec-foil-r)" />
                <rect x="6" y="100" width="68" height="14" rx="4" fill="url(#ec-foil-r)" />
                <rect x="12" y="34" width="56" height="62" rx="5" fill="#FFF8E7" stroke="#FFE03A" strokeWidth="1.5" clipPath="url(#ec-clip-r)" />
                <text x="40" y="58" textAnchor="middle" fontSize="14">🌶️</text>
                <text x="40" y="72" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#2D1B00" fontFamily="sans-serif">AKSHAYA</text>
                <text x="40" y="79" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#C8280A" fontFamily="sans-serif">SWADAM</text>
                <text x="40" y="90" textAnchor="middle" fontSize="4" fill="#5C3D11" fontFamily="sans-serif" fillOpacity="0.7">100g</text>
              </svg>
            </div>
            <div style={{
              display: 'inline-block',
              animation: 'float-packet 8.5s ease-in-out infinite',
              animationDelay: '1.2s',
              '--sway-start': '5deg',
              '--sway-mid': '-2deg',
              '--sway-end': '-9deg',
            } as React.CSSProperties}>
              <svg width="48" height="70" viewBox="0 0 80 116" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 6px 16px rgba(212,160,23,0.35))' }}>
                <defs>
                  <linearGradient id="ec-body-g" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9A7010" /><stop offset="35%" stopColor="#D4A017" /><stop offset="55%" stopColor="#F0B820" /><stop offset="80%" stopColor="#D4A017" /><stop offset="100%" stopColor="#9A7010" />
                  </linearGradient>
                  <linearGradient id="ec-foil-g" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B1A07" /><stop offset="40%" stopColor="#C8280A" /><stop offset="60%" stopColor="white" stopOpacity="0.5" /><stop offset="80%" stopColor="#C8280A" /><stop offset="100%" stopColor="#8B1A07" />
                  </linearGradient>
                  <clipPath id="ec-clip-g"><path d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z" /></clipPath>
                </defs>
                <path d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z" fill="url(#ec-body-g)" />
                <rect x="6" y="4" width="68" height="22" rx="4" fill="url(#ec-foil-g)" />
                <rect x="6" y="100" width="68" height="14" rx="4" fill="url(#ec-foil-g)" />
                <rect x="12" y="34" width="56" height="62" rx="5" fill="#FFF8E7" stroke="#C8280A" strokeWidth="1.5" clipPath="url(#ec-clip-g)" />
                <text x="40" y="58" textAnchor="middle" fontSize="14">🌿</text>
                <text x="40" y="72" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#2D1B00" fontFamily="sans-serif">AKSHAYA</text>
                <text x="40" y="79" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#D4A017" fontFamily="sans-serif">SWADAM</text>
                <text x="40" y="90" textAnchor="middle" fontSize="4" fill="#5C3D11" fontFamily="sans-serif" fillOpacity="0.7">50g</text>
              </svg>
            </div>
            <div style={{
              display: 'inline-block',
              animation: 'float-packet 6s ease-in-out infinite',
              animationDelay: '2.5s',
              '--sway-start': '-4deg',
              '--sway-mid': '3deg',
              '--sway-end': '8deg',
            } as React.CSSProperties}>
              <svg width="52" height="76" viewBox="0 0 80 116" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 6px 16px rgba(232,93,4,0.35))' }}>
                <defs>
                  <linearGradient id="ec-body-s" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#B04000" /><stop offset="35%" stopColor="#E85D04" /><stop offset="55%" stopColor="#FF7A20" /><stop offset="80%" stopColor="#E85D04" /><stop offset="100%" stopColor="#B04000" />
                  </linearGradient>
                  <linearGradient id="ec-foil-s" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C8A800" /><stop offset="40%" stopColor="#FFE03A" /><stop offset="60%" stopColor="white" stopOpacity="0.6" /><stop offset="80%" stopColor="#FFE03A" /><stop offset="100%" stopColor="#C8A800" />
                  </linearGradient>
                  <clipPath id="ec-clip-s"><path d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z" /></clipPath>
                </defs>
                <path d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z" fill="url(#ec-body-s)" />
                <rect x="6" y="4" width="68" height="22" rx="4" fill="url(#ec-foil-s)" />
                <rect x="6" y="100" width="68" height="14" rx="4" fill="url(#ec-foil-s)" />
                <rect x="12" y="34" width="56" height="62" rx="5" fill="#FFF8E7" stroke="#FFE03A" strokeWidth="1.5" clipPath="url(#ec-clip-s)" />
                <text x="40" y="58" textAnchor="middle" fontSize="14">🌾</text>
                <text x="40" y="72" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#2D1B00" fontFamily="sans-serif">AKSHAYA</text>
                <text x="40" y="79" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#E85D04" fontFamily="sans-serif">SWADAM</text>
                <text x="40" y="90" textAnchor="middle" fontSize="4" fill="#5C3D11" fontFamily="sans-serif" fillOpacity="0.7">75g</text>
              </svg>
            </div>
          </div>
          <h3>Your cart is empty</h3>
          <p>
            Chat with Meena to add your favourite Akshaya Swadam spices!
            <br />
            Try: <em style={{ color: 'var(--orange)' }}>"Add 2 garam masala"</em>
          </p>
        </div>
      ) : (
        <ul className="cart-items-list" data-lenis-prevent role="list" aria-label="Cart items">
          {cart.map(item => (
            <li key={item.product.id} className="cart-item" role="listitem">
              <span className="cart-item-emoji" aria-hidden="true">
                {item.product.image_emoji}
              </span>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.product.name}</div>
                <div className="cart-item-price">
                  ₹{(item.product.price_in_paise / 100).toFixed(2)} each ·{' '}
                  <strong>₹{((item.product.price_in_paise * item.quantity) / 100).toFixed(2)}</strong>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="cart-item-qty">
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQty(item.product.id, -1)}
                  aria-label={`Decrease quantity of ${item.product.name}`}
                  id={`decrease-${item.product.id}`}
                >
                  −
                </button>
                <span className="qty-num" aria-label={`Quantity: ${item.quantity}`}>
                  {item.quantity}
                </span>
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQty(item.product.id, 1)}
                  aria-label={`Increase quantity of ${item.product.name}`}
                  id={`increase-${item.product.id}`}
                >
                  +
                </button>
              </div>

              {/* Remove */}
              <button
                className="remove-btn"
                onClick={() => onRemove(item.product.id)}
                aria-label={`Remove ${item.product.name} from cart`}
                id={`remove-${item.product.id}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}



      {/* Footer / checkout */}
      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-summary" aria-label="Order summary">
            <div className="summary-row">
              <span>Subtotal ({itemCount} item{itemCount > 1 ? 's' : ''})</span>
              <span>₹{(cartTotal / 100).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>GST (5%)</span>
              <span>₹{(gst / 100).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span style={{ color: 'var(--orange)', fontWeight: 700 }}>FREE</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{(grandTotal / 100).toFixed(2)}</span>
            </div>
          </div>

          <button
            className="pay-btn"
            onClick={onCheckout}
            disabled={isCheckingOut || cart.length === 0}
            id="pay-with-razorpay-btn"
            aria-label={`Pay ₹${(grandTotal / 100).toFixed(2)} with Razorpay`}
          >
            {isCheckingOut ? (
              <>⏳ Processing…</>
            ) : (
              <>
                <span>Pay ₹{(cartTotal / 100).toFixed(2)} with Razorpay</span>
              </>
            )}
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.68rem',
            color: 'rgba(160,130,70,0.65)',
            marginTop: 8,
          }}>
            🔒 Secured by Razorpay · Test Mode · No real charges
          </p>
        </div>
      )}
    </aside>
  );
}
