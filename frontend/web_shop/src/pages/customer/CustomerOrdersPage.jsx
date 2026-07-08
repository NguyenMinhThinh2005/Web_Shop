import { Link } from 'react-router-dom'
import { PackageCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { customerApi } from '../../api/customerApi'
import { formatDate } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'
import { getLastShopSlug } from '../../utils/lastGuestOrder'

function CustomerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flashMessage, setFlashMessage] = useState(() => {
    const message = sessionStorage.getItem('customerFlashMessage') || ''
    sessionStorage.removeItem('customerFlashMessage')
    return message
  })

  async function loadOrders(page = 1) {
    setLoading(true)
    setError('')

    try {
      const response = await customerApi.getCustomerOrders({ page, limit: 10 })
      setOrders(response.data.orders || [])
      setPagination(response.data.pagination || { page, totalPages: 1 })
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadOrders(1)
    })
  }, [])

  return (
    <main className="customer-page">
      <section className="customer-panel">
        <div className="customer-list-header">
          <div>
            <p className="eyebrow">Tài khoản</p>
            <h1>Đơn của tôi</h1>
          </div>
          <div className="customer-form-actions">
            <Link className="button button--ghost" to="/customer/account">
              Tài khoản
            </Link>
            <Link
              className="button button--secondary"
              to={`/shop/${getLastShopSlug()}`}
            >
              Tiếp tục mua hàng
            </Link>
          </div>
        </div>

        {flashMessage ? (
          <button
            type="button"
            className="inline-success"
            onClick={() => setFlashMessage('')}
          >
            {flashMessage}
          </button>
        ) : null}
        {error ? <div className="inline-error">{error}</div> : null}
        {loading ? <div className="page-state">Đang tải đơn hàng...</div> : null}
        {!loading && orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={42} />
            <h2>Bạn chưa có đơn hàng nào trong tài khoản này.</h2>
            <p>
              Nếu từng đặt hàng khi chưa đăng nhập, hãy dùng đúng số điện thoại
              đã đặt.
            </p>
            <Link
              className="button button--primary"
              to={`/shop/${getLastShopSlug()}`}
            >
              Tiếp tục mua hàng
            </Link>
          </div>
        ) : null}

        <div className="customer-order-list">
          {orders.map((order) => (
            <article className="customer-order-card" key={order._id}>
              <div>
                <strong>{order.orderCode}</strong>
                <p>{order.shop?.name || 'Shop'}</p>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div>
                <span className="customer-status-badge">{order.status}</span>
                <p>{order.items?.length || 0} sản phẩm</p>
              </div>
              <div className="customer-order-card__actions">
                <strong>{formatMoney(order.money?.grandTotal)}</strong>
                <Link
                  className="button button--secondary"
                  to={`/customer/orders/${order._id}`}
                >
                  <PackageCheck size={16} />
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>

        {pagination.totalPages > 1 ? (
          <div className="customer-pagination">
            <button
              className="button button--ghost"
              disabled={pagination.page <= 1}
              onClick={() => loadOrders(pagination.page - 1)}
            >
              Trước
            </button>
            <strong>
              Trang {pagination.page} / {pagination.totalPages}
            </strong>
            <button
              className="button button--ghost"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadOrders(pagination.page + 1)}
            >
              Sau
            </button>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default CustomerOrdersPage
