import { MessageCircle, ShoppingCart } from 'lucide-react'

function MobileStickyBar({ cartCount, onCartOpen, onContactOpen }) {
  return (
    <div className="mobile-sticky-bar">
      <button
        type="button"
        className="button button--secondary"
        onClick={onContactOpen}
      >
        <MessageCircle size={18} />
        Tư vấn
      </button>
      <button type="button" className="button button--primary" onClick={onCartOpen}>
        <ShoppingCart size={18} />
        Giỏ hàng ({cartCount})
      </button>
    </div>
  )
}

export default MobileStickyBar
