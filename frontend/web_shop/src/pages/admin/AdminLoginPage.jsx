import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { ADMIN_TOKEN_KEY, adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
      navigate('/admin/orders', { replace: true })
    }
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await adminApi.loginAdmin({ email, password })
      localStorage.setItem(ADMIN_TOKEN_KEY, response.data.accessToken)
      navigate('/admin/orders', { replace: true })
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-card__icon">
          <LockKeyhole size={24} />
        </div>
        <h1>Đăng nhập quản trị</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <div className="admin-error">{error}</div> : null}
        <button
          type="submit"
          className="admin-button admin-button--dark admin-button--wide"
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  )
}

export default AdminLoginPage
