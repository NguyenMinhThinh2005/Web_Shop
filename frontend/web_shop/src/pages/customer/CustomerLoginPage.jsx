import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { getApiErrorMessage } from '../../api/apiError'
import { customerApi } from '../../api/customerApi'
import { useCustomerAuth } from '../../context/customerAuth'
import {
  claimLastGuestOrder,
  getLastShopSlug,
} from '../../utils/lastGuestOrder'

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

function CustomerLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useCustomerAuth()
  const [form, setForm] = useState({ phoneOrEmail: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(form)
      await claimAndNavigate(navigate, location.search)
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="customer-page">
      <form className="customer-auth-card" onSubmit={handleSubmit}>
        <div className="customer-auth-card__icon">
          <LogIn size={24} />
        </div>
        <p className="eyebrow">Tài khoản khách hàng</p>
        <h1>Đăng nhập tài khoản</h1>
        <label>
          Số điện thoại hoặc email
          <input
            value={form.phoneOrEmail}
            onChange={(event) => updateField('phoneOrEmail', event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Mật khẩu
          <span className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              autoComplete="current-password"
              required
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
        </label>
        {error ? <div className="inline-error">{error}</div> : null}
        <button className="button button--primary button--full" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        <p className="customer-auth-card__switch">
          Chưa có tài khoản?{' '}
          <Link to={`/customer/register${location.search}`}>Đăng ký</Link>
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

export default CustomerLoginPage
