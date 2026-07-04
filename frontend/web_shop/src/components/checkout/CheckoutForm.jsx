import { PackageCheck } from 'lucide-react'

function CheckoutForm({ form, errors, onChange }) {
  return (
    <section className="checkout-card">
      <div className="checkout-card__header">
        <p className="eyebrow">Thông tin</p>
        <h2>
          <PackageCheck size={22} />
          Thông tin giao hàng
        </h2>
      </div>
      <div className="form-grid">
        <label>
          <span>Họ tên *</span>
          <input
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
            placeholder="Nhập họ tên"
          />
          {errors.name ? <small>{errors.name}</small> : null}
        </label>
        <label>
          <span>Số điện thoại *</span>
          <input
            value={form.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            placeholder="Nhập số điện thoại liên hệ"
          />
          {errors.phone ? <small>{errors.phone}</small> : null}
        </label>
        <label>
          <span>Tỉnh/Thành</span>
          <input
            value={form.province}
            onChange={(event) => onChange('province', event.target.value)}
            placeholder="Ví dụ: TP.HCM"
          />
        </label>
        <label>
          <span>Thời gian tiện nghe máy</span>
          <select
            value={form.preferredContactTime}
            onChange={(event) =>
              onChange('preferredContactTime', event.target.value)
            }
          >
            <option>Gọi ngay khi có thể</option>
            <option>Buổi sáng</option>
            <option>Buổi chiều</option>
            <option>Buổi tối</option>
          </select>
        </label>
      </div>
      <label className="field-full">
        <span>Địa chỉ cụ thể *</span>
        <input
          value={form.address}
          onChange={(event) => onChange('address', event.target.value)}
          placeholder="Số nhà, tên đường, phường/xã"
        />
        {errors.address ? <small>{errors.address}</small> : null}
      </label>
      <label className="field-full">
        <span>Ghi chú đơn hàng</span>
        <textarea
          value={form.note}
          onChange={(event) => onChange('note', event.target.value)}
          placeholder="Ví dụ: giao buổi sáng, gọi trước khi giao"
          rows={4}
        />
      </label>
    </section>
  )
}

export default CheckoutForm
