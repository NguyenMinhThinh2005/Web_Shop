import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut,
  MapPin,
  PackageCheck,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import { useCustomerAuth } from '../../context/customerAuth'
import { getLastShopSlug } from '../../utils/lastGuestOrder'

function CustomerAccountPage() {
  const navigate = useNavigate()
  const { customer, logout } = useCustomerAuth()

  async function handleLogout() {
    await logout()
    navigate('/customer/login', { replace: true })
  }

  return (
    <main className="customer-page">
      <section className="customer-panel">
        <div className="customer-panel__header">
          <div className="customer-auth-card__icon">
            <UserRound size={24} />
          </div>
          <div>
            <p className="eyebrow">Tài khoản</p>
            <h1>Xin chào, {customer?.fullName || 'khách hàng'}</h1>
            <p className="customer-muted">{customer?.phone}</p>
            {customer?.email ? (
              <p className="customer-muted">{customer.email}</p>
            ) : null}
          </div>
        </div>

        <div className="customer-action-grid">
          <Link className="customer-action-card" to="/customer/orders">
            <PackageCheck size={24} />
            <strong>Đơn của tôi</strong>
            <span>Xem lại đơn đã đặt trong tài khoản này.</span>
          </Link>
          <Link className="customer-action-card" to="/customer/addresses">
            <MapPin size={24} />
            <strong>Địa chỉ giao hàng</strong>
            <span>Lưu địa chỉ để lần sau đặt nhanh hơn.</span>
          </Link>
          <Link
            className="customer-action-card"
            to={`/shop/${getLastShopSlug()}`}
          >
            <ShoppingBag size={24} />
            <strong>Tiếp tục mua hàng</strong>
            <span>Quay lại cửa hàng gần nhất bạn vừa xem.</span>
          </Link>
          <button
            type="button"
            className="customer-action-card"
            onClick={handleLogout}
          >
            <LogOut size={24} />
            <strong>Đăng xuất</strong>
            <span>Thoát khỏi tài khoản khách hàng.</span>
          </button>
        </div>
      </section>
    </main>
  )
}

export default CustomerAccountPage
