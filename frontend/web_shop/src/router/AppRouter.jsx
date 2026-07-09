import { Navigate, Route, Routes } from 'react-router-dom'
import { ADMIN_TOKEN_KEY } from '../api/adminApi'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import AdminOrdersPage from '../pages/admin/AdminOrdersPage'
import AdminProductImportPage from '../pages/admin/AdminProductImportPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
import AdminShopCatalogPage from '../pages/admin/AdminShopCatalogPage'
import AdminShopsPage from '../pages/admin/AdminShopsPage'
import CustomerAccountPage from '../pages/customer/CustomerAccountPage'
import CustomerAddressesPage from '../pages/customer/CustomerAddressesPage'
import CustomerLoginPage from '../pages/customer/CustomerLoginPage'
import CustomerOrderDetailPage from '../pages/customer/CustomerOrderDetailPage'
import CustomerOrdersPage from '../pages/customer/CustomerOrdersPage'
import CustomerRegisterPage from '../pages/customer/CustomerRegisterPage'
import CheckoutPage from '../pages/public/CheckoutPage'
import NotFoundPage from '../pages/public/NotFoundPage'
import ShopPage from '../pages/public/ShopPage'
import SuccessPage from '../pages/public/SuccessPage'
import { useCustomerAuth } from '../context/customerAuth'

function RequireAdmin({ children }) {
  if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function RequireCustomer({ children }) {
  const { isAuthenticated, loading } = useCustomerAuth()

  if (loading) {
    return <main className="page-state">Đang kiểm tra tài khoản...</main>
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/customer/login?redirect=${encodeURIComponent(
          window.location.pathname,
        )}`}
        replace
      />
    )
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
      <Route
        path="/admin/shops/:shopId/import-products"
        element={
          <RequireAdmin>
            <AdminProductImportPage />
          </RequireAdmin>
        }
      />
      <Route path="/shop/:slug" element={<ShopPage />} />
      <Route path="/shop/:slug/products/:productSlug" element={<ShopPage />} />
      <Route path="/shop/:slug/checkout" element={<CheckoutPage />} />
      <Route path="/shop/:slug/success" element={<SuccessPage />} />
      <Route path="/customer/login" element={<CustomerLoginPage />} />
      <Route path="/customer/register" element={<CustomerRegisterPage />} />
      <Route
        path="/customer/account"
        element={
          <RequireCustomer>
            <CustomerAccountPage />
          </RequireCustomer>
        }
      />
      <Route
        path="/customer/orders"
        element={
          <RequireCustomer>
            <CustomerOrdersPage />
          </RequireCustomer>
        }
      />
      <Route
        path="/customer/orders/:orderId"
        element={
          <RequireCustomer>
            <CustomerOrderDetailPage />
          </RequireCustomer>
        }
      />
      <Route
        path="/customer/addresses"
        element={
          <RequireCustomer>
            <CustomerAddressesPage />
          </RequireCustomer>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
