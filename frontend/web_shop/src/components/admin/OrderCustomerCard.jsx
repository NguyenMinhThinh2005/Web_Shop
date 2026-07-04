import { Clipboard, Copy } from 'lucide-react'
import { formatMoney } from '../../utils/formatMoney'

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

function buildOrderText(order) {
  const shop = getOrderShop(order)
  const items = order.items || []
  const itemLines = items
    .map((item) => `- ${item.sku || '-'} - ${item.name} x ${item.quantity}`)
    .join('\n')

  return [
    `Shop: ${shop?.name || 'Không rõ shop'}`,
    `Mã đơn: ${order.orderCode || '-'}`,
    `Khách: ${order.customer?.name || '-'}`,
    `SĐT: ${order.customer?.phone || '-'}`,
    `Địa chỉ: ${order.customer?.address || '-'}`,
    'Sản phẩm:',
    itemLines || '-',
    `Tổng dự kiến: ${formatMoney(order.money?.grandTotal)}`,
    `Ghi chú khách: ${order.customer?.note || '-'}`,
  ].join('\n')
}

function OrderCustomerCard({ order, onCopied }) {
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
      onCopied('Đã copy')
    } catch {
      onCopied('Không copy được')
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card__title">
        <h3>Khách hàng</h3>
      </div>
      <div className="admin-info-grid">
        <span>Tên</span>
        <strong>{order.customer?.name || '-'}</strong>
        <span>SĐT</span>
        <strong>{order.customer?.phone || '-'}</strong>
        <span>Địa chỉ</span>
        <strong>{order.customer?.address || '-'}</strong>
        <span>Giờ liên hệ</span>
        <strong>{order.customer?.preferredContactTime || '-'}</strong>
        <span>Ghi chú khách</span>
        <strong>{order.customer?.note || '-'}</strong>
      </div>
      <div className="admin-action-row">
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => copyText(order.customer?.phone || '')}
        >
          <Copy size={15} />
          Copy SĐT
        </button>
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => copyText(order.customer?.address || '')}
        >
          <Copy size={15} />
          Copy địa chỉ
        </button>
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={() => copyText(buildOrderText(order))}
        >
          <Clipboard size={15} />
          Copy thông tin đơn
        </button>
      </div>
    </section>
  )
}

export default OrderCustomerCard
