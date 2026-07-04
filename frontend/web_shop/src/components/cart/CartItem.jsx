import { useState } from 'react'
import { PackageCheck, Trash2 } from 'lucide-react'
import QuantityStepper from './QuantityStepper'
import { formatMoney } from '../../utils/formatMoney'

function CartItem({ item, onQuantityChange, onRemove }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article className="cart-item">
      <div className="cart-item__image">
        {item.image && !imageFailed ? (
          <img
            src={item.image}
            alt={item.name}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PackageCheck size={24} />
        )}
      </div>
      <div className="cart-item__body">
        <div className="cart-item__top">
          <div>
            <p className="cart-item__name">{item.name}</p>
            <p className="cart-item__sku">SKU: {item.sku}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={`Xóa ${item.name}`}
            onClick={onRemove}
          >
            <Trash2 size={17} />
          </button>
        </div>
        <div className="cart-item__bottom">
          <QuantityStepper value={item.quantity} onChange={onQuantityChange} />
          <strong>{formatMoney(item.lineTotal)}</strong>
        </div>
      </div>
    </article>
  )
}

export default CartItem
