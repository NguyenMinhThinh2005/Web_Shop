import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, PackageCheck, UserRound } from 'lucide-react'
import { useCustomerAuth } from '../../context/customerAuth'

function buildClaimUrl(path, order) {
  const params = new URLSearchParams({
    redirect: '/customer/orders',
  })

  if (order?.orderCode) {
    params.set('claimOrderCode', order.orderCode)
  }

  return `${path}?${params.toString()}`
}

function SuccessAccountCard({
  icon,
  title,
  subtitle,
  actions,
}) {
  return (
    <div className="success-account-card">
      <div className="success-account-icon">{icon}</div>
      <div className="success-account-content">
        <h2 className="success-account-title">{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="success-account-actions">{actions}</div>
    </div>
  )
}

function SuccessCard({ shop, order, shopSlug }) {
  const { isAuthenticated } = useCustomerAuth()
  const [hideAccountCard, setHideAccountCard] = useState(false)

  if (!order) {
    return (
      <section className="success-card">
        <div className="success-icon">!</div>
        <h1>Không tìm thấy thông tin đơn vừa đặt.</h1>
        <Link className="button button--primary" to={`/shop/${shopSlug}`}>
          Quay lại cửa hàng
        </Link>
      </section>
    )
  }

  return (
    <section className="success-card">
      <p className="eyebrow">{shop?.name || 'Cửa hàng'}</p>
      <div className="success-icon">
        <CheckCircle2 size={46} />
      </div>
      <h1>Đặt hàng thành công!</h1>
      <p>
        Đơn đã được gửi, tư vấn viên sẽ liên hệ xác nhận trong thời gian sớm
        nhất.
      </p>
      <div className="order-code-box">
        <span>Mã đơn hàng</span>
        <strong>{order.orderCode}</strong>
      </div>

      {isAuthenticated ? (
        <SuccessAccountCard
          icon={<PackageCheck size={24} />}
          title="Đơn đã được lưu vào tài khoản của bạn."
          subtitle=""
          actions={
            <>
              <Link className="button button--primary" to="/customer/orders">
                Xem đơn của tôi
              </Link>
              <Link className="button button--ghost" to={`/shop/${shopSlug}`}>
                Tiếp tục mua hàng
              </Link>
            </>
          }
        />
      ) : null}

      {!isAuthenticated && !hideAccountCard ? (
        <SuccessAccountCard
          icon={<UserRound size={24} />}
          title="Lần sau đặt nhanh hơn"
          subtitle="Lưu thông tin và xem lại đơn."
          actions={
            <>
              <Link
                className="button button--primary"
                to={buildClaimUrl('/customer/register', order)}
              >
                Đăng ký
              </Link>
              <Link
                className="button button--ghost"
                to={buildClaimUrl('/customer/login', order)}
              >
                Đăng nhập
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setHideAccountCard(true)}
              >
                Để sau
              </button>
            </>
          }
        />
      ) : null}

      <Link className="button button--secondary" to={`/shop/${shopSlug}`}>
        <ArrowLeft size={18} />
        Quay lại cửa hàng
      </Link>
    </section>
  )
}

export default SuccessCard
