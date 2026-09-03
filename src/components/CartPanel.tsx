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
              color: 'var(--brown-mid)',
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              fontWeight: 600,
              textDecoration: 'underline',
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
          <div className="cart-empty-icon" aria-hidden="true">🫙</div>
          <h3>Your cart is empty</h3>
          <p>
            Chat with Meena to add your favourite Akshaya Swadam spices!
            <br />
            Try: <em style={{ color: 'var(--orange)' }}>"Add 2 garam masala"</em>
          </p>
        </div>
      ) : (
        <ul className="cart-items-list" role="list" aria-label="Cart items">
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

      {/* Audit trail */}
      {auditLog.length > 0 && (
        <div className="audit-section" aria-label="Audit trail">
          <h3>🔍 Audit Trail</h3>
          {auditLog.map((entry, i) => (
            <div key={i} className="audit-entry" role="note">
              <strong>{new Date(entry.timestamp).toLocaleTimeString('en-IN')}</strong>
              {' · '}{entry.action}
              {' · '}Server-validated: <strong>₹{(entry.serverValidatedAmount / 100).toFixed(2)}</strong>
              {' · '}{entry.aiItems.length} item(s)
            </div>
          ))}
        </div>
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
            color: 'var(--brown-light)',
            marginTop: 8,
          }}>
            🔒 Secured by Razorpay · Test Mode · No real charges
          </p>
        </div>
      )}
    </aside>
  );
}
