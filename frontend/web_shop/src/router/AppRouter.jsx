import { Navigate, Route, Routes } from 'react-router-dom'
import { ADMIN_TOKEN_KEY } from '../api/adminApi'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import AdminOrdersPage from '../pages/admin/AdminOrdersPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
import AdminShopCatalogPage from '../pages/admin/AdminShopCatalogPage'
import AdminShopsPage from '../pages/admin/AdminShopsPage'
import CheckoutPage from '../pages/public/CheckoutPage'
import NotFoundPage from '../pages/public/NotFoundPage'
import ShopPage from '../pages/public/ShopPage'
import SuccessPage from '../pages/public/SuccessPage'

function RequireAdmin({ children }) {
  if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop/chu-tam-tan-xe-test" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/orders"
        element={
          <RequireAdmin>
            <AdminOrdersPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <RequireAdmin>
            <AdminReportsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/shops"
        element={
          <RequireAdmin>
            <AdminShopsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/shops/:shopId/catalog"
        element={
          <RequireAdmin>
            <AdminShopCatalogPage />
          </RequireAdmin>
        }
      />
      <Route path="/shop/:slug" element={<ShopPage />} />
      <Route path="/shop/:slug/products/:productSlug" element={<ShopPage />} />
      <Route path="/shop/:slug/checkout" element={<CheckoutPage />} />
      <Route path="/shop/:slug/success" element={<SuccessPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
