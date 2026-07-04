import { Minus, Plus } from 'lucide-react'

function QuantityStepper({ value, onChange, min = 1 }) {
  const quantity = Math.max(min, Number(value || min))

  return (
    <div className="quantity-stepper" aria-label="Chọn số lượng">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        aria-label="Giảm số lượng"
      >
        <Minus size={16} />
      </button>
      <span>{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label="Tăng số lượng"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

export default QuantityStepper
