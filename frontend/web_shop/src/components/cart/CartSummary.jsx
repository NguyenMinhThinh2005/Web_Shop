import { formatMoney } from '../../utils/formatMoney'

function CartSummary({ subtotal }) {
  return (
    <div className="cart-summary">
      <div>
        <span>Tạm tính</span>
        <strong>{formatMoney(subtotal)}</strong>
      </div>
    </div>
  )
}

export default CartSummary
