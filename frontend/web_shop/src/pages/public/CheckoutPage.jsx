import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { getApiErrorMessage } from '../../api/apiError'
import { publicApi } from '../../api/publicApi'
import CheckoutForm from '../../components/checkout/CheckoutForm'
import OrderSummary from '../../components/checkout/OrderSummary'
import { CartProvider, useCart } from '../../store/cartStore'

const invalidPhoneMessage =
  'Số điện thoại chưa hợp lệ. Vui lòng nhập số Việt Nam, ví dụ 0912345678.'

const initialForm = {
  name: '',
  phone: '',
  province: '',
  address: '',
  preferredContactTime: 'Gọi ngay khi có thể',
  note: '',
}

function isValidVietnamPhone(value) {
  const trimmed = String(value || '').trim()
  const digits = trimmed.replace(/\D/g, '')

  if (!trimmed || digits.length < 10 || digits.length > 11) {
    return false
  }

  if (/^(\d)\1+$/.test(digits)) {
    return false
  }

  if (digits.startsWith('0')) {
    return digits.length === 10
  }

  if (digits.startsWith('84')) {
    return digits.length === 11
  }

  return false
}

function CheckoutContent() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const [shop, setShop] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadShop() {
      try {
        const response = await publicApi.getShop(slug)
        if (mounted) setShop(response.data.shop)
      } catch (error) {
        if (mounted) setSubmitError(getApiErrorMessage(error))
      }
    }

    loadShop()

    return () => {
      mounted = false
    }
  }, [slug])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function validate() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập họ tên'
    if (!isValidVietnamPhone(form.phone)) nextErrors.phone = invalidPhoneMessage
    if (!form.address.trim()) nextErrors.address = 'Vui lòng nhập địa chỉ'
    if (items.length === 0) nextErrors.cart = 'Giỏ hàng đang trống'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event?.preventDefault()
    if (submitting || !validate()) return

    setSubmitting(true)
    setSubmitError('')

    try {
      const searchParams = new URLSearchParams(window.location.search)
      const payload = {
        shopSlug: slug,
        pageUrl: window.location.href,
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: [form.address.trim(), form.province.trim()]
            .filter(Boolean)
            .join(', '),
          note: form.note.trim(),
          preferredContactTime: form.preferredContactTime,
        },
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod: 'consult_later',
        source: {
          utmSource: searchParams.get('utm_source') || '',
          utmCampaign:
            searchParams.get('utm_campaign') || shop?.campaignId || '',
          userAgent: navigator.userAgent,
        },
      }

      const response = await publicApi.createOrder(payload)
      const order = response.data.order

      localStorage.setItem(`lastOrder:${slug}`, JSON.stringify(order))
      clearCart()
      navigate(`/shop/${slug}/success`, { state: { order } })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link className="brand-mark" to={`/shop/${slug}`}>
          <span className="brand-mark__icon">CT</span>
          <span>
            <strong>{shop?.name || 'Cửa hàng'}</strong>
            <small>Quay lại cửa hàng</small>
          </span>
        </Link>
      </header>
      <main className="container checkout-main">
        <section className="checkout-title">
          <p className="eyebrow">Đặt hàng</p>
          <h1>Đặt Hàng Nhanh</h1>
          <p>
            Để lại thông tin, shop sẽ liên hệ xác nhận đơn trong thời gian sớm
            nhất.
          </p>
        </section>

        {items.length === 0 ? (
          <section className="empty-state checkout-empty">
            <ShoppingCart size={42} />
            <h2>Giỏ hàng đang trống</h2>
            <p>Hãy quay lại shop để chọn sản phẩm trước khi đặt hàng.</p>
            <Link className="button button--primary" to={`/shop/${slug}`}>
              Quay lại shop
            </Link>
          </section>
        ) : (
          <>
            {errors.cart ? <div className="inline-error">{errors.cart}</div> : null}
            {submitError ? <div className="inline-error">{submitError}</div> : null}

            <form className="checkout-grid" onSubmit={handleSubmit}>
              <CheckoutForm form={form} errors={errors} onChange={updateField} />
              <OrderSummary
                items={items}
                subtotal={subtotal}
                submitLabel="Gửi đơn hàng"
                submitting={submitting}
                onSubmit={handleSubmit}
              />
            </form>
          </>
        )}
      </main>
    </div>
  )
}

function CheckoutPage() {
  const { slug } = useParams()

  return (
    <CartProvider key={slug} shopSlug={slug}>
      <CheckoutContent />
    </CartProvider>
  )
}

export default CheckoutPage
