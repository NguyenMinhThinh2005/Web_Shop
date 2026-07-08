import axios from 'axios'
import { getApiErrorMessage } from './apiError'

export const CUSTOMER_TOKEN_KEY = 'customerAccessToken'

const customerClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

customerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

customerClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalizedError = new Error(getApiErrorMessage(error))
    normalizedError.statusCode = error.response?.status

    return Promise.reject(normalizedError)
  },
)

export function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY)
}

export const customerApi = {
  registerCustomer(payload) {
    return customerClient.post('/customer/auth/register', payload)
  },

  loginCustomer(payload) {
    return customerClient.post('/customer/auth/login', payload)
  },

  getCustomerMe() {
    return customerClient.get('/customer/auth/me')
  },

  logoutCustomer() {
    return customerClient.post('/customer/auth/logout')
  },

  getCustomerAddresses() {
    return customerClient.get('/customer/addresses')
  },

  createCustomerAddress(payload) {
    return customerClient.post('/customer/addresses', payload)
  },

  updateCustomerAddress(addressId, payload) {
    return customerClient.patch(`/customer/addresses/${addressId}`, payload)
  },

  deleteCustomerAddress(addressId) {
    return customerClient.delete(`/customer/addresses/${addressId}`)
  },

  getCustomerOrders(params = {}) {
    return customerClient.get('/customer/orders', { params })
  },

  getCustomerOrderDetail(orderId) {
    return customerClient.get(`/customer/orders/${orderId}`)
  },

  claimCustomerOrder(payload) {
    return customerClient.post('/customer/orders/claim', payload)
  },
}
