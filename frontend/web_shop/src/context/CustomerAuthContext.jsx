import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CUSTOMER_TOKEN_KEY,
  customerApi,
  getCustomerToken,
} from '../api/customerApi'
import { CustomerAuthContext } from './customerAuth'

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [token, setToken] = useState(() => getCustomerToken())
  const [loading, setLoading] = useState(Boolean(getCustomerToken()))

  const clearAuth = useCallback(() => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY)
    setToken(null)
    setCustomer(null)
  }, [])

  const applyAuthResponse = useCallback((data) => {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.accessToken)
    setToken(data.accessToken)
    setCustomer(data.user)
    return data
  }, [])

  const refreshMe = useCallback(async () => {
    const currentToken = getCustomerToken()

    if (!currentToken) {
      clearAuth()
      setLoading(false)
      return null
    }

    setLoading(true)
    try {
      const response = await customerApi.getCustomerMe()
      setCustomer(response.data.user)
      setToken(currentToken)
      return response.data.user
    } catch {
      clearAuth()
      return null
    } finally {
      setLoading(false)
    }
  }, [clearAuth])

  useEffect(() => {
    queueMicrotask(() => {
      refreshMe()
    })
  }, [refreshMe])

  const login = useCallback(async (payload) => {
    const response = await customerApi.loginCustomer(payload)
    return applyAuthResponse(response.data)
  }, [applyAuthResponse])

  const register = useCallback(async (payload) => {
    const response = await customerApi.registerCustomer(payload)
    return applyAuthResponse(response.data)
  }, [applyAuthResponse])

  const logout = useCallback(async () => {
    try {
      if (getCustomerToken()) {
        await customerApi.logoutCustomer()
      }
    } finally {
      clearAuth()
    }
  }, [clearAuth])

  const value = useMemo(
    () => ({
      customer,
      token,
      isAuthenticated: Boolean(token && customer),
      loading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [customer, token, loading, login, register, logout, refreshMe],
  )

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}
