import { Eye } from 'lucide-react'
import { formatDate } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'
import OrderStatusBadge from './OrderStatusBadge'

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

function OrderTable({ orders, loading, selectedOrderId, onSelect }) {
  if (loading) {
    return <div className="admin-state">Đang tải danh sách đơn...</div>
  }

  if (!orders.length) {
    return <div className="admin-state">Chưa có đơn phù hợp bộ lọc.</div>
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Shop</th>
            <th>Thời gian</th>
            <th>Khách hàng</th>
            <th>SĐT khách</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Hoa hồng</th>
            <th>Ghi chú nhanh</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const shop = getOrderShop(order)

            return (
              <tr
                key={order._id}
                className={selectedOrderId === order._id ? 'is-selected' : ''}
                onClick={() => onSelect(order._id)}
              >
                <td>
                  <strong>{order.orderCode}</strong>
                </td>
                <td>
                  <strong>{shop?.name || 'Không rõ shop'}</strong>
                  {shop?.slug ? (
                    <small className="admin-table-subtext">
                      /shop/{shop.slug}
                    </small>
                  ) : null}
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{order.customer?.name || '-'}</td>
                <td>{order.customer?.phone || '-'}</td>
                <td>{formatMoney(order.money?.grandTotal)}</td>
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td>
                  <span className="admin-muted">
                    {order.commission?.status || 'pending'}
                  </span>
                </td>
                <td>
                  <span className="admin-note-preview">
                    {order.internalNote || order.customer?.note || '-'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-icon-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(order._id)
                    }}
                    aria-label="Xem chi tiết đơn"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default OrderTable
