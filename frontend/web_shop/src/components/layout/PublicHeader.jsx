import { Link } from 'react-router-dom'
import {
  Bike,
  LogOut,
  MessageCircle,
  Search,
  ShoppingCart,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useCustomerAuth } from '../../context/customerAuth'

function hasContact(shop) {
  return Boolean(
    shop?.contact?.messengerUrl ||
      shop?.contact?.zaloUrl ||
      shop?.contact?.hotline,
  )
}

function getCustomerLabel(customer) {
  return customer?.fullName?.split(' ')?.at(-1) || 'Tài khoản'
}

function PublicHeader({
  shop,
  search,
  onSearchChange,
  cartCount,
  onCartOpen,
  onContactOpen,
}) {
  const { customer, isAuthenticated, logout } = useCustomerAuth()

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
          {isAuthenticated ? (
            <div className="account-menu">
              <Link className="contact-pill account-pill" to="/customer/account">
                <UserRound size={17} />
                {getCustomerLabel(customer)}
              </Link>
              <div className="account-menu__dropdown">
                <Link to="/customer/account">Tài khoản</Link>
                <Link to="/customer/orders">Đơn của tôi</Link>
                <Link to="/customer/addresses">Địa chỉ</Link>
                <button type="button" onClick={logout}>
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link className="contact-pill account-pill" to="/customer/login">
              <UserRound size={17} />
              Tài khoản
            </Link>
          )}
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
