import { useMemo, useState } from 'react'
import { BadgeDollarSign, Save } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'
import { formatMoney } from '../../utils/formatMoney'

const COMMISSION_TYPES = ['none', 'percent', 'fixed']
const COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'cancelled']

function toNumber(value) {
  return Number(value || 0)
}

function CommissionPanel({ order, onUpdated, onMessage }) {
  const [form, setForm] = useState(() => ({
    type: order.commission?.type || 'none',
    baseAmount: order.commission?.baseAmount || '',
    rate: order.commission?.rate || 0,
    fixedAmount: order.commission?.fixedAmount || 0,
    expectedAmount: order.commission?.expectedAmount || 0,
    actualAmount: order.commission?.actualAmount || 0,
    status: order.commission?.status || 'pending',
    note: order.commission?.note || '',
    autoCalculate: true,
  }))
  const [saving, setSaving] = useState(false)
  const grandTotal = toNumber(order.money?.grandTotal)

  const previewExpectedAmount = useMemo(() => {
    if (form.type === 'percent') {
      const base =
        toNumber(form.baseAmount) > 0 ? toNumber(form.baseAmount) : grandTotal

      return Math.round((base * toNumber(form.rate)) / 100)
    }

    if (form.type === 'fixed') {
      return toNumber(form.fixedAmount)
    }

    return 0
  }, [form.baseAmount, form.fixedAmount, form.rate, form.type, grandTotal])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveCommission() {
    const payload = {
      type: form.type,
      status: form.status,
      note: form.note,
      actualAmount: toNumber(form.actualAmount),
      autoCalculate: form.autoCalculate,
    }

    if (form.type === 'percent') {
      payload.rate = toNumber(form.rate)
      if (String(form.baseAmount || '').trim()) {
        payload.baseAmount = toNumber(form.baseAmount)
      }
    }

    if (form.type === 'fixed') {
      payload.fixedAmount = toNumber(form.fixedAmount)
    }

    if (!form.autoCalculate) {
      payload.expectedAmount = toNumber(form.expectedAmount)
    }

    setSaving(true)
    try {
      await adminApi.updateOrderCommission(order._id, payload)
      onMessage('Đã lưu hoa hồng')
      await onUpdated()
    } catch (apiError) {
      onMessage(getApiErrorMessage(apiError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-card admin-card--highlight">
      <div className="admin-card__title">
        <h3>
          <BadgeDollarSign size={18} />
          Hoa hồng
        </h3>
      </div>

      <div className="commission-preview">
        <span>Hoa hồng dự kiến</span>
        <strong>
          {formatMoney(
            form.autoCalculate ? previewExpectedAmount : form.expectedAmount,
          )}
        </strong>
      </div>
      {form.type === 'percent' && grandTotal === 0 && !form.baseAmount ? (
        <p className="admin-help">Đơn chưa có giá trị tính hoa hồng.</p>
      ) : null}

      <div className="admin-form-grid admin-form-grid--two">
        <label>
          Loại hoa hồng
          <select
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
          >
            {COMMISSION_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái hoa hồng
          <select
            value={form.status}
            onChange={(event) => updateField('status', event.target.value)}
          >
            {COMMISSION_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {form.type === 'percent' ? (
          <>
            <label>
              Tỷ lệ %
              <input
                type="number"
                min="0"
                value={form.rate}
                onChange={(event) => updateField('rate', event.target.value)}
              />
            </label>
            <label>
              Số tiền tính hoa hồng
              <input
                type="number"
                min="0"
                placeholder="Để trống để dùng tổng đơn"
                value={form.baseAmount}
                onChange={(event) =>
                  updateField('baseAmount', event.target.value)
                }
              />
            </label>
          </>
        ) : null}

        {form.type === 'fixed' ? (
          <label>
            Số cố định
            <input
              type="number"
              min="0"
              value={form.fixedAmount}
              onChange={(event) =>
                updateField('fixedAmount', event.target.value)
              }
            />
          </label>
        ) : null}

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.autoCalculate}
            onChange={(event) =>
              updateField('autoCalculate', event.target.checked)
            }
          />
          <span>Tự tính theo %</span>
        </label>

        {!form.autoCalculate ? (
          <label>
            Hoa hồng dự kiến
            <input
              type="number"
              min="0"
              value={form.expectedAmount}
              onChange={(event) =>
                updateField('expectedAmount', event.target.value)
              }
            />
          </label>
        ) : null}

        <label>
          Đã nhận
          <input
            type="number"
            min="0"
            value={form.actualAmount}
            onChange={(event) => updateField('actualAmount', event.target.value)}
          />
        </label>
        <label className="admin-form-grid__full">
          Ghi chú hoa hồng
          <textarea
            value={form.note}
            onChange={(event) => updateField('note', event.target.value)}
            rows="3"
          />
        </label>
      </div>
      <button
        type="button"
        className="admin-button admin-button--primary"
        onClick={saveCommission}
        disabled={saving}
      >
        <Save size={15} />
        Lưu hoa hồng
      </button>
    </section>
  )
}

export default CommissionPanel
