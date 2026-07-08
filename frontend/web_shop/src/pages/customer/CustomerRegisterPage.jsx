import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserRound } from 'lucide-react'
import { useState } from 'react'
import { getApiErrorMessage } from '../../api/apiError'
import { customerApi } from '../../api/customerApi'
import { useCustomerAuth } from '../../context/customerAuth'
import {
  claimLastGuestOrder,
  getLastGuestOrder,
  getLastShopSlug,
} from '../../utils/lastGuestOrder'
import { invalidPhoneMessage, isValidVietnamPhone } from '../../utils/phone'

function getRedirect(search) {
  const redirect = new URLSearchParams(search).get('redirect')
  return redirect && redirect.startsWith('/') ? redirect : '/customer/account'
}

async function claimAndNavigate(navigate, search) {
  const result = await claimLastGuestOrder(customerApi)

  if (result.message) {
    sessionStorage.setItem('customerFlashMessage', result.message)
  }

  navigate(result.message ? '/customer/orders' : getRedirect(search), {
    replace: true,
  })
}

function CustomerRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useCustomerAuth()
  const lastGuestOrder = getLastGuestOrder()
  const [form, setForm] = useState({
    fullName: '',
    phone: lastGuestOrder?.phone || '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSubmitError('')
  }

  function validate() {
    const nextErrors = {}

    if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ tên'
    if (!isValidVietnamPhone(form.phone)) nextErrors.phone = invalidPhoneMessage
    if (form.password.length < 8) {
      nextErrors.password = 'Mật khẩu tối thiểu 8 ký tự'
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận chưa khớp'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSubmitError('')

    try {
      await register({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      })
      await claimAndNavigate(navigate, location.search)
    } catch (apiError) {
      setSubmitError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="customer-page">
      <form className="customer-auth-card" onSubmit={handleSubmit}>
        <div className="customer-auth-card__icon">
          <UserRound size={24} />
        </div>
        <p className="eyebrow">Tài khoản khách hàng</p>
        <h1>Đăng ký tài khoản</h1>
        {lastGuestOrder ? (
          <p className="customer-muted">
            Dùng đúng số điện thoại vừa đặt để lưu đơn vào tài khoản.
          </p>
        ) : null}
        <label>
          Họ tên *
          <input
            value={form.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            autoComplete="name"
          />
          {errors.fullName ? <small>{errors.fullName}</small> : null}
        </label>
        <label>
          Số điện thoại *
          <input
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            autoComplete="tel"
          />
          {errors.phone ? <small>{errors.phone}</small> : null}
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Mật khẩu *
          <span className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {errors.password ? <small>{errors.password}</small> : null}
        </label>
        <label>
          Xác nhận mật khẩu *
          <span className="password-field">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(event) =>
                updateField('confirmPassword', event.target.value)
              }
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={
                showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
              }
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {errors.confirmPassword ? (
            <small>{errors.confirmPassword}</small>
          ) : null}
        </label>
        {submitError ? <div className="inline-error">{submitError}</div> : null}
        <button className="button button--primary button--full" disabled={loading}>
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
        <p className="customer-auth-card__switch">
          Đã có tài khoản?{' '}
          <Link to={`/customer/login${location.search}`}>Đăng nhập</Link>
        </p>
        <Link
          className="button button--ghost button--full"
          to={`/shop/${getLastShopSlug()}`}
        >
          Tiếp tục mua hàng
        </Link>
      </form>
    </main>
  )
}

export default CustomerRegisterPage
