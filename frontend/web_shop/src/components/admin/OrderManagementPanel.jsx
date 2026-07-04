import { useState } from 'react'
import { Save } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'

const ORDER_STATUSES = [
  'new',
  'confirmed',
  'shipping_created',
  'handoff_sent',
  'shipping',
  'delivered',
  'commission_pending',
  'commission_paid',
  'completed',
  'cancelled',
  'returned',
]

const SHIPPING_CARRIERS = [
  'none',
  'viettel_post',
  'ghn',
  'ghtk',
  'jtexpress',
  'other',
]

const SHIPPING_STATUSES = [
  'not_created',
  'created',
  'shipping',
  'delivered',
  'failed',
  'returned',
  'cancelled',
]

function OrderManagementPanel({ order, onUpdated, onMessage }) {
  const [status, setStatus] = useState(() => order.status || 'new')
  const [shipping, setShipping] = useState(() => ({
    carrier: 'none',
    trackingCode: order.shipping?.trackingCode || '',
    shippingFee: order.shipping?.shippingFee || 0,
    status: order.shipping?.status || 'not_created',
    note: order.shipping?.note || '',
    ...order.shipping,
  }))
  const [saving, setSaving] = useState('')

  async function saveStatus() {
    setSaving('status')
    try {
      await adminApi.updateOrderStatus(order._id, status)
      onMessage('Đã cập nhật trạng thái')
      await onUpdated()
    } catch (apiError) {
      onMessage(getApiErrorMessage(apiError))
    } finally {
      setSaving('')
    }
  }

  async function saveShipping() {
    setSaving('shipping')
    try {
      await adminApi.updateOrderShipping(order._id, {
        ...shipping,
        shippingFee: Number(shipping.shippingFee || 0),
      })
      onMessage('Đã lưu vận đơn')
      await onUpdated()
    } catch (apiError) {
      onMessage(getApiErrorMessage(apiError))
    } finally {
      setSaving('')
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card__title">
        <h3>Quản lý trạng thái</h3>
      </div>

      <div className="admin-form-grid">
        <label>
          Trạng thái đơn
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {ORDER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="admin-button admin-button--primary"
        onClick={saveStatus}
        disabled={saving === 'status'}
      >
        <Save size={15} />
        Cập nhật trạng thái
      </button>

      <div className="admin-subpanel">
        <div>
          <h4>Vận đơn thủ công</h4>
          <p>Nhập sau khi bạn đã tạo vận đơn bên ngoài.</p>
        </div>
        <div className="admin-form-grid admin-form-grid--two">
          <label>
            Đơn vị vận chuyển
            <select
              value={shipping.carrier}
              onChange={(event) =>
                setShipping((current) => ({
                  ...current,
                  carrier: event.target.value,
                }))
              }
            >
              {SHIPPING_CARRIERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mã vận đơn
            <input
              value={shipping.trackingCode}
              onChange={(event) =>
                setShipping((current) => ({
                  ...current,
                  trackingCode: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Phí vận chuyển
            <input
              type="number"
              min="0"
              value={shipping.shippingFee}
              onChange={(event) =>
                setShipping((current) => ({
                  ...current,
                  shippingFee: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Trạng thái vận đơn
            <select
              value={shipping.status}
              onChange={(event) =>
                setShipping((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              {SHIPPING_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-form-grid__full">
            Ghi chú vận đơn
            <textarea
              value={shipping.note}
              onChange={(event) =>
                setShipping((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
              rows="3"
            />
          </label>
        </div>
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={saveShipping}
          disabled={saving === 'shipping'}
        >
          <Save size={15} />
          Lưu vận đơn
        </button>
      </div>
    </section>
  )
}

export default OrderManagementPanel
