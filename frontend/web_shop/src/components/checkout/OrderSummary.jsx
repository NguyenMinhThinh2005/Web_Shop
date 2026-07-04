import { Send } from 'lucide-react'
import { formatMoney } from '../../utils/formatMoney'

function OrderSummary({ items, subtotal, submitLabel, submitting, onSubmit }) {
  return (
    <aside className="order-summary">
      <div className="order-summary__header">
        <p className="eyebrow">Đơn hàng</p>
        <h2>Tóm tắt đơn hàng</h2>
      </div>
      <div className="order-summary__items">
        {items.map((item) => (
          <div className="summary-item" key={item.productId}>
            <div className="summary-item__image">
              {item.image ? <img src={item.image} alt={item.name} /> : <span>Ảnh</span>}
            </div>
            <div>
              <strong>{item.name}</strong>
              <p>SL: {item.quantity}</p>
            </div>
            <span>{formatMoney(item.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="summary-totals">
        <div>
          <span>Tạm tính</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <div>
          <span>Phí giao hàng</span>
          <strong>Chưa tính</strong>
        </div>
        <div className="summary-total">
          <span>Tổng dự kiến</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
      </div>
      <button
        type="submit"
        className="button button--primary button--full"
        disabled={submitting || items.length === 0}
        onClick={onSubmit}
      >
        <Send size={18} />
        {submitting ? 'Đang gửi đơn...' : submitLabel}
      </button>
    </aside>
  )
}

export default OrderSummary
