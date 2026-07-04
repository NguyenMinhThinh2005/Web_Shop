import { ExternalLink, X } from 'lucide-react'
import { formatDate } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'
import CommissionPanel from './CommissionPanel'
import HandoffPanel from './HandoffPanel'
import InternalNotePanel from './InternalNotePanel'
import OrderCustomerCard from './OrderCustomerCard'
import OrderItemsCard from './OrderItemsCard'
import OrderManagementPanel from './OrderManagementPanel'
import OrderStatusBadge from './OrderStatusBadge'

const activityTypeLabels = {
  status_updated: 'Cập nhật trạng thái',
  shipping_updated: 'Cập nhật vận đơn',
  handoff_updated: 'Cập nhật gửi thông tin',
  commission_updated: 'Cập nhật hoa hồng',
  internal_note_updated: 'Cập nhật ghi chú',
}

function getOrderShop(order) {
  if (order.shop) return order.shop
  if (order.shopId && typeof order.shopId === 'object') return order.shopId
  if (order.shopName || order.shopSlug) {
    return {
      name: order.shopName,
      slug: order.shopSlug,
    }
  }

  return null
}

function OrderShopCard({ shop }) {
  return (
    <section className="admin-card order-shop-card">
      <div className="admin-card__title">
        <h3>Shop</h3>
        {shop?.slug ? (
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => window.open(`/shop/${shop.slug}`, '_blank')}
          >
            <ExternalLink size={15} />
            Mở shop
          </button>
        ) : null}
      </div>
      <div className="admin-info-grid">
        <span>Shop</span>
        <strong>{shop?.name || 'Không rõ shop'}</strong>
        <span>Slug</span>
        <strong>{shop?.slug || '-'}</strong>
      </div>
    </section>
  )
}

function OrderActivityLogs({ logs = [] }) {
  return (
    <section className="admin-card order-activity">
      <div className="admin-card__title">
        <h3>Lịch sử thao tác</h3>
      </div>
      {logs.length === 0 ? (
        <p className="admin-help">Chưa có lịch sử thao tác.</p>
      ) : (
        <div className="order-activity__list">
          {logs.map((log, index) => (
            <article
              className="order-activity__item"
              key={`${log.createdAt || index}-${log.type || 'log'}`}
            >
              <div>
                <span className="admin-badge">
                  {activityTypeLabels[log.type] || log.type || 'Thao tác'}
                </span>
                <strong>{log.message || activityTypeLabels[log.type]}</strong>
                {log.actorName ? <small>{log.actorName}</small> : null}
              </div>
              <time>{formatDate(log.createdAt)}</time>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function OrderDetailDrawer({
  order,
  loading,
  error,
  onClose,
  onRefresh,
  onMessage,
}) {
  const shop = order ? getOrderShop(order) : null

  return (
    <aside className={`order-drawer ${order || loading ? 'is-open' : ''}`}>
      <div className="order-drawer__header">
        <div>
          <p className="admin-eyebrow">Chi tiết đơn</p>
          <h2>{order?.orderCode || 'Đang tải...'}</h2>
        </div>
        <button
          type="button"
          className="admin-icon-button"
          onClick={onClose}
          aria-label="Đóng chi tiết"
        >
          <X size={18} />
        </button>
      </div>

      {loading ? <div className="admin-state">Đang tải chi tiết...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}

      {order ? (
        <div className="order-drawer__body">
          <section className="admin-card admin-summary">
            <div>
              <span>Mã đơn</span>
              <strong>{order.orderCode}</strong>
            </div>
            <div>
              <span>Thời gian</span>
              <strong>{formatDate(order.createdAt)}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div>
              <span>Tổng tiền</span>
              <strong>{formatMoney(order.money?.grandTotal)}</strong>
            </div>
            <div>
              <span>Thanh toán</span>
              <strong>{order.payment?.method || '-'}</strong>
            </div>
            <div>
              <span>Shop</span>
              <strong>{shop?.name || 'Không rõ shop'}</strong>
            </div>
            <div>
              <span>Slug</span>
              <strong>{shop?.slug || '-'}</strong>
            </div>
          </section>

          <OrderShopCard shop={shop} />
          <OrderCustomerCard order={order} onCopied={onMessage} />
          <OrderItemsCard order={order} />
          <OrderManagementPanel
            key={`management-${order._id}-${order.updatedAt}`}
            order={order}
            onUpdated={onRefresh}
            onMessage={onMessage}
          />
          <HandoffPanel
            key={`handoff-${order._id}-${order.updatedAt}`}
            order={order}
            onUpdated={onRefresh}
            onMessage={onMessage}
          />
          <CommissionPanel
            key={`commission-${order._id}-${order.updatedAt}`}
            order={order}
            onUpdated={onRefresh}
            onMessage={onMessage}
          />
          <InternalNotePanel
            key={`note-${order._id}-${order.updatedAt}`}
            order={order}
            onUpdated={onRefresh}
            onMessage={onMessage}
          />
          <OrderActivityLogs logs={order.activityLogs || []} />
        </div>
      ) : null}
    </aside>
  )
}

export default OrderDetailDrawer
