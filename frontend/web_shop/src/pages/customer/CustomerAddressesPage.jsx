import { Link } from 'react-router-dom'
import { MapPin, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { customerApi } from '../../api/customerApi'
import { getLastShopSlug } from '../../utils/lastGuestOrder'
import { invalidPhoneMessage, isValidVietnamPhone } from '../../utils/phone'

const emptyForm = {
  receiverName: '',
  phone: '',
  province: '',
  addressLine: '',
  note: '',
  isDefault: false,
}

function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadAddresses() {
    setLoading(true)
    try {
      const response = await customerApi.getCustomerAddresses()
      setAddresses(response.data.addresses || [])
    } catch (apiError) {
      setSubmitError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadAddresses()
    })
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSubmitError('')
  }

  function validate() {
    const nextErrors = {}

    if (!form.receiverName.trim()) {
      nextErrors.receiverName = 'Vui lòng nhập tên người nhận'
    }
    if (!isValidVietnamPhone(form.phone)) nextErrors.phone = invalidPhoneMessage
    if (!form.addressLine.trim()) {
      nextErrors.addressLine = 'Vui lòng nhập địa chỉ'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function editAddress(address) {
    setEditingId(address._id)
    setForm({
      receiverName: address.receiverName || '',
      phone: address.phone || '',
      province: address.province || '',
      addressLine: address.addressLine || '',
      note: address.note || '',
      isDefault: Boolean(address.isDefault),
    })
    setErrors({})
    setSubmitError('')
  }

  function resetForm() {
    setEditingId('')
    setForm(emptyForm)
    setErrors({})
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSubmitError('')

    try {
      const payload = {
        ...form,
        receiverName: form.receiverName.trim(),
        phone: form.phone.trim(),
        province: form.province.trim(),
        addressLine: form.addressLine.trim(),
        note: form.note.trim(),
      }

      if (editingId) {
        await customerApi.updateCustomerAddress(editingId, payload)
      } else {
        await customerApi.createCustomerAddress(payload)
      }

      resetForm()
      await loadAddresses()
    } catch (apiError) {
      setSubmitError(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteAddress(addressId) {
    setSubmitError('')
    try {
      await customerApi.deleteCustomerAddress(addressId)
      resetForm()
      await loadAddresses()
    } catch (apiError) {
      setSubmitError(apiError.message)
    }
  }

  return (
    <main className="customer-page">
      <section className="customer-panel">
        <div className="customer-list-header">
          <div>
            <p className="eyebrow">Tài khoản</p>
            <h1>Địa chỉ giao hàng</h1>
          </div>
          <div className="customer-form-actions">
            <Link className="button button--ghost" to="/customer/account">
              Quay lại tài khoản
            </Link>
            <Link className="button button--ghost" to="/customer/orders">
              Đơn của tôi
            </Link>
            <Link
              className="button button--secondary"
              to={`/shop/${getLastShopSlug()}`}
            >
              Tiếp tục mua hàng
            </Link>
          </div>
        </div>

        {submitError ? <div className="inline-error">{submitError}</div> : null}

        <div className="customer-address-layout">
          <form className="customer-address-form" onSubmit={handleSubmit}>
            <h2>{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h2>
            <label>
              Người nhận *
              <input
                value={form.receiverName}
                onChange={(event) =>
                  updateField('receiverName', event.target.value)
                }
              />
              {errors.receiverName ? <small>{errors.receiverName}</small> : null}
            </label>
            <label>
              Số điện thoại *
              <input
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
              {errors.phone ? <small>{errors.phone}</small> : null}
            </label>
            <label>
              Tỉnh/Thành
              <input
                value={form.province}
                onChange={(event) => updateField('province', event.target.value)}
              />
            </label>
            <label>
              Địa chỉ *
              <input
                value={form.addressLine}
                onChange={(event) =>
                  updateField('addressLine', event.target.value)
                }
              />
              {errors.addressLine ? <small>{errors.addressLine}</small> : null}
            </label>
            <label>
              Ghi chú
              <textarea
                value={form.note}
                onChange={(event) => updateField('note', event.target.value)}
                rows={3}
              />
            </label>
            <label className="customer-checkbox">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) =>
                  updateField('isDefault', event.target.checked)
                }
              />
              <span>Đặt làm địa chỉ mặc định</span>
            </label>
            <div className="customer-form-actions">
              <button className="button button--primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={resetForm}
              >
                Hủy
              </button>
            </div>
          </form>

          <div className="customer-address-list">
            {loading ? <p>Đang tải địa chỉ...</p> : null}
            {!loading && addresses.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <MapPin size={34} />
                <h2>Bạn chưa lưu địa chỉ nào.</h2>
                <p>Thêm địa chỉ để lần sau đặt hàng nhanh hơn.</p>
              </div>
            ) : null}
            {addresses.map((address) => (
              <article className="customer-address-card" key={address._id}>
                <MapPin size={20} />
                <div>
                  <strong>{address.receiverName}</strong>
                  {address.isDefault ? <span>Mặc định</span> : null}
                  <p>{address.phone}</p>
                  <p>
                    {[address.addressLine, address.province]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {address.note ? <p>{address.note}</p> : null}
                  <div className="customer-form-actions">
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => editAddress(address)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => deleteAddress(address._id)}
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default CustomerAddressesPage
