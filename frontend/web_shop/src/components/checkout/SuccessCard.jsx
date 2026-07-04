import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, UserRound } from 'lucide-react'

function SuccessCard({ shop, order, shopSlug }) {
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
      <p className="eyebrow">{shop?.name || 'Chú Tám Tân Xe'}</p>
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
      <div className="login-suggestion">
        <UserRound size={26} />
        <div>
          <h2>Tạo tài khoản nhanh?</h2>
          <p>
            Đăng nhập để lần sau đặt nhanh hơn, không cần nhập lại địa chỉ.
            Theo dõi đơn hàng dễ dàng.
          </p>
        </div>
        <div className="success-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              alert('Tính năng đăng nhập khách hàng sẽ làm sau')
            }
          >
            Đăng nhập
          </button>
          <Link className="button button--primary" to={`/shop/${shopSlug}`}>
            Để sau
          </Link>
        </div>
      </div>
      <Link className="button button--secondary" to={`/shop/${shopSlug}`}>
        <ArrowLeft size={18} />
        Quay lại cửa hàng
      </Link>
    </section>
  )
}

export default SuccessCard
