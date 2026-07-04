import { PackageCheck } from 'lucide-react'
import { formatMoney } from '../../utils/formatMoney'

function OrderItemsCard({ order }) {
  return (
    <section className="admin-card">
      <div className="admin-card__title">
        <h3>Sản phẩm</h3>
      </div>
      <div className="admin-items">
        {(order.items || []).map((item) => (
          <div className="admin-item" key={`${item.sku}-${item.name}`}>
            <div className="admin-item__image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <PackageCheck size={22} />
              )}
            </div>
            <div>
              <strong>{item.name}</strong>
              <span>SKU: {item.sku || '-'}</span>
            </div>
            <div className="admin-item__money">
              <span>x {item.quantity}</span>
              <strong>{formatMoney(item.lineTotal)}</strong>
              <small>{formatMoney(item.unitPrice)} / sản phẩm</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default OrderItemsCard
