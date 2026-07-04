import { useState } from 'react'
import { Send, Save } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'

const HANDOFF_STATUSES = ['not_sent', 'sent']

function HandoffPanel({ order, onUpdated, onMessage }) {
  const [form, setForm] = useState(() => ({
    status: order.handoff?.status || 'not_sent',
    note: order.handoff?.note || '',
  }))
  const [saving, setSaving] = useState(false)

  async function saveHandoff() {
    setSaving(true)
    try {
      await adminApi.updateOrderHandoff(order._id, form)
      onMessage('Đã lưu trạng thái gửi thông tin')
      await onUpdated()
    } catch (apiError) {
      onMessage(getApiErrorMessage(apiError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card__title">
        <h3>
          <Send size={18} />
          Gửi thông tin xử lý
        </h3>
      </div>
      <p className="admin-help">
        Dùng để đánh dấu bạn đã gửi mã vận đơn/thông tin đơn cho bên xử lý hàng.
      </p>
      <div className="admin-form-grid">
        <label>
          Trạng thái
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            {HANDOFF_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ghi chú
          <textarea
            value={form.note}
            onChange={(event) =>
              setForm((current) => ({ ...current, note: event.target.value }))
            }
            rows="3"
          />
        </label>
      </div>
      <button
        type="button"
        className="admin-button admin-button--ghost"
        onClick={saveHandoff}
        disabled={saving}
      >
        <Save size={15} />
        Lưu trạng thái gửi thông tin
      </button>
    </section>
  )
}

export default HandoffPanel
