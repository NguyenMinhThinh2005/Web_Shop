import { useNavigate } from 'react-router-dom'
import { ADMIN_TOKEN_KEY } from '../../api/adminApi'
import AdminHeader from './AdminHeader'

function AdminLayout({ title, children, onRefresh, loading }) {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <AdminHeader
        title={title}
        onLogout={handleLogout}
        onRefresh={onRefresh}
        loading={loading}
      />
      {children}
    </div>
  )
}

export default AdminLayout
