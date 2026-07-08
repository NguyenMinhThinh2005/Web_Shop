import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { customerApi } from '../../api/customerApi'
import { formatDate } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'
import { getLastShopSlug } from '../../utils/lastGuestOrder'

function CustomerOrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadOrder() {
      setLoading(true)
      setError('')

      try {
        const response = await customerApi.getCustomerOrderDetail(orderId)
        if (mounted) setOrder(response.data.order)
      } catch (apiError) {
        if (mounted) setError(apiError.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadOrder()

    return () => {
      mounted = false
    }
  }, [orderId])

  const shopSlug = order?.shop?.slug || getLastShopSlug()

  return (
    <main className="customer-page">
      <section className="customer-panel">
        <div className="customer-form-actions customer-form-actions--top">
          <Link className="button button--ghost" to="/customer/orders">
            <ArrowLeft size={16} />
            Quay lại đơn của tôi
          </Link>
          <Link className="button button--secondary" to={`/shop/${shopSlug}`}>
            <ShoppingBag size={16} />
            Tiếp tục mua hàng
          </Link>
        </div>

        {loading ? <div className="page-state">Đang tải chi tiết đơn...</div> : null}
        {error ? <div className="inline-error">{error}</div> : null}

        {order ? (
          <div className="customer-detail">
            <div className="customer-list-header">
              <div>
                <p className="eyebrow">Chi tiết đơn</p>
                <h1>{order.orderCode}</h1>
                <p className="customer-muted">{formatDate(order.createdAt)}</p>
              </div>
              <span className="customer-status-badge">{order.status}</span>
            </div>

            <div className="customer-detail-grid">
              <section>
                <h2>Shop</h2>
                <p>{order.shop?.name || 'Shop'}</p>
                {order.shop?.slug ? <p className="customer-muted">{order.shop.slug}</p> : null}
              </section>
              <section>
                <h2>Thông tin nhận hàng</h2>
                <p>{order.customer?.name}</p>
                <p>{order.customer?.phone}</p>
                <p>{order.customer?.address}</p>
                {order.customer?.note ? <p>{order.customer.note}</p> : null}
              </section>
              <section>
                <h2>Vận đơn</h2>
                <p>Trạng thái: {order.shipping?.status || '-'}</p>
                {order.shipping?.trackingCode ? (
                  <p>Mã vận đơn: {order.shipping.trackingCode}</p>
                ) : null}
              </section>
            </div>

            <section className="customer-items">
              <h2>Sản phẩm</h2>
              {order.items?.map((item) => (
                <div className="customer-item-row" key={`${item.sku}-${item.name}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>SKU: {item.sku}</p>
                    <p>SL: {item.quantity}</p>
                  </div>
                  <strong>{formatMoney(item.lineTotal)}</strong>
                </div>
              ))}
              <div className="customer-total-row">
                <span>Tổng dự kiến</span>
                <strong>{formatMoney(order.money?.grandTotal)}</strong>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default CustomerOrderDetailPage
