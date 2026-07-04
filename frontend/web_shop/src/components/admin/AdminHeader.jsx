import { NavLink } from 'react-router-dom'
import { BarChart3, LogOut, PackageCheck, RefreshCw, Store } from 'lucide-react'

function AdminHeader({ title, onLogout, onRefresh, loading }) {
  return (
    <header className="admin-header">
      <div>
        <p className="admin-eyebrow">Admin</p>
        <h1>{title}</h1>
      </div>
      <div className="admin-header__actions">
        <nav className="admin-nav" aria-label="Admin navigation">
          <NavLink to="/admin/orders">
            <PackageCheck size={16} />
            Đơn hàng
          </NavLink>
          <NavLink to="/admin/reports">
            <BarChart3 size={16} />
            Báo cáo
          </NavLink>
          <NavLink to="/admin/shops">
            <Store size={16} />
            Shop
          </NavLink>
        </nav>
        {onRefresh ? (
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        ) : null}
        <button
          type="button"
          className="admin-button admin-button--dark"
          onClick={onLogout}
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </header>
  )
}

export default AdminHeader
