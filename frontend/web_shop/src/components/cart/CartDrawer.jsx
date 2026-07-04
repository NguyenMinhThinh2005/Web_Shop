import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ShoppingCart, X } from 'lucide-react'
import CartItem from './CartItem'
import CartSummary from './CartSummary'
import { useCart } from '../../store/cartStore'

function CartDrawer({ open, onClose, shopSlug }) {
  const navigate = useNavigate()
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  if (!open) {
    return null
  }

  return (
    <div className="drawer-shell" role="presentation">
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Đóng giỏ hàng"
        onClick={onClose}
      />
      <aside className="cart-drawer" aria-label="Giỏ hàng của bạn">
        <header className="cart-drawer__header">
          <div>
            <p className="eyebrow">Giỏ hàng</p>
            <h2>
              <ShoppingCart size={22} /> Giỏ hàng của bạn
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="cart-drawer__notice">
          <ShieldCheck size={18} />
          Đặt hàng nhanh chóng, bảo mật. Không cần tài khoản.
        </div>

        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={44} />
              <h3>Giỏ hàng đang trống</h3>
              <p>
                Chọn sản phẩm phù hợp rồi quay lại đây để đặt hàng nhanh.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onQuantityChange={(quantity) =>
                  updateQuantity(item.productId, quantity)
                }
                onRemove={() => removeItem(item.productId)}
              />
            ))
          )}
        </div>

        <footer className="cart-drawer__footer">
          <CartSummary subtotal={subtotal} />
          <button
            type="button"
            className="button button--primary button--full"
            disabled={items.length === 0}
            onClick={() => navigate(`/shop/${shopSlug}/checkout`)}
          >
            Tiếp tục đặt hàng
          </button>
          <button
            type="button"
            className="button button--ghost button--full"
            onClick={onClose}
          >
            Chọn thêm sản phẩm
          </button>
        </footer>
      </aside>
    </div>
  )
}

export default CartDrawer
