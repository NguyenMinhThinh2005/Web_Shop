import { Link } from 'react-router-dom'
import {
  Bike,
  MessageCircle,
  Search,
  ShoppingCart,
  Wrench,
} from 'lucide-react'

function hasContact(shop) {
  return Boolean(
    shop?.contact?.messengerUrl ||
      shop?.contact?.zaloUrl ||
      shop?.contact?.hotline,
  )
}

function PublicHeader({
  shop,
  search,
  onSearchChange,
  cartCount,
  onCartOpen,
  onContactOpen,
}) {
  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Link className="brand-mark" to={`/shop/${shop?.slug || ''}`}>
          <span className="brand-mark__icon">
            <Wrench size={22} />
          </span>
          <span>
            <strong>{shop?.name || 'Chú Tám Tân Xe'}</strong>
            <small>
              <Bike size={13} /> Phụ tùng xe máy chuyên nghiệp
            </small>
          </span>
        </Link>

        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên"
          />
        </label>

        <div className="header-actions">
          {hasContact(shop) ? (
            <button
              type="button"
              className="contact-pill"
              onClick={onContactOpen}
            >
              <MessageCircle size={17} />
              Liên hệ tư vấn
            </button>
          ) : null}
          <button type="button" className="cart-button" onClick={onCartOpen}>
            <ShoppingCart size={18} />
            <span>Giỏ hàng</span>
            <strong>{cartCount}</strong>
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicHeader
