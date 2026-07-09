import axios from 'axios'
import { getApiErrorMessage } from './apiError'

export const ADMIN_TOKEN_KEY = 'adminAccessToken'

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

adminClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')
    const normalizedError = new Error(
      isTimeout
        ? 'Kiểm tra dữ liệu quá lâu. Hãy thử lại với ít sản phẩm hơn hoặc kiểm tra kết nối.'
        : getApiErrorMessage(error),
    )
    normalizedError.statusCode = error.response?.status
    normalizedError.response = error.response

    return Promise.reject(normalizedError)
  },
)

export const adminApi = {
  loginAdmin(payload) {
    return adminClient.post('/admin/auth/login', payload)
  },

  getMe() {
    return adminClient.get('/admin/auth/me')
  },

  getShops(params = {}) {
    return adminClient.get('/admin/shops', { params })
  },

  getAdminShops(params = {}) {
    return adminClient.get('/admin/shops', { params })
  },

  getAdminShopDetail(shopId) {
    return adminClient.get(`/admin/shops/${shopId}`)
  },

  createAdminShop(payload) {
    return adminClient.post('/admin/shops', payload)
  },

  updateAdminShop(shopId, payload) {
    return adminClient.patch(`/admin/shops/${shopId}`, payload)
  },

  deleteAdminShop(shopId) {
    return adminClient.delete(`/admin/shops/${shopId}`)
  },

  getAdminCategories(shopId, params = {}) {
    return adminClient.get(`/admin/shops/${shopId}/categories`, { params })
  },

  createAdminCategory(shopId, payload) {
    return adminClient.post(`/admin/shops/${shopId}/categories`, payload)
  },

  updateAdminCategory(categoryId, payload) {
    return adminClient.patch(`/admin/categories/${categoryId}`, payload)
  },

  deleteAdminCategory(categoryId) {
    return adminClient.delete(`/admin/categories/${categoryId}`)
  },

  getAdminProducts(shopId, params = {}) {
    return adminClient.get(`/admin/shops/${shopId}/products`, { params })
  },

  createAdminProduct(shopId, payload) {
    return adminClient.post(`/admin/shops/${shopId}/products`, payload)
  },

  updateAdminProduct(productId, payload) {
    return adminClient.patch(`/admin/products/${productId}`, payload)
  },

  deleteAdminProduct(productId) {
    return adminClient.delete(`/admin/products/${productId}`)
  },

  validateProductImport(shopId, payload) {
    return adminClient.post(
      `/admin/shops/${shopId}/products/import-json/validate`,
      payload,
      { timeout: 60000 },
    )
  },

  importProductsJson(shopId, payload) {
    return adminClient.post(
      `/admin/shops/${shopId}/products/import-json`,
      payload,
      { timeout: 60000 },
    )
  },

  updateProductPin(productId, payload) {
    return adminClient.patch(`/admin/products/${productId}/pin`, payload)
  },

  getOrders(params = {}) {
    return adminClient.get('/admin/orders', { params })
  },

  getOrderDetail(orderId) {
    return adminClient.get(`/admin/orders/${orderId}`)
  },

  updateOrderStatus(orderId, status) {
    return adminClient.patch(`/admin/orders/${orderId}/status`, { status })
  },

  updateOrderShipping(orderId, payload) {
    return adminClient.patch(`/admin/orders/${orderId}/shipping`, payload)
  },

  updateOrderHandoff(orderId, payload) {
    return adminClient.patch(`/admin/orders/${orderId}/handoff`, payload)
  },

  updateOrderCommission(orderId, payload) {
    return adminClient.patch(`/admin/orders/${orderId}/commission`, payload)
  },

  updateInternalNote(orderId, internalNote) {
    return adminClient.patch(`/admin/orders/${orderId}/internal-note`, {
      internalNote,
    })
  },

  getReportOverview(params = {}) {
    return adminClient.get('/admin/reports/overview', { params })
  },
}
