import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Filter, Search } from 'lucide-react'
import { ADMIN_TOKEN_KEY, adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPagination from '../../components/admin/AdminPagination'
import OrderDetailDrawer from '../../components/admin/OrderDetailDrawer'
import OrderTable from '../../components/admin/OrderTable'

const ORDER_STATUSES = [
  '',
  'new',
  'confirmed',
  'shipping_created',
  'handoff_sent',
  'processing',
  'shipping',
  'delivered',
  'commission_pending',
  'commission_paid',
  'completed',
  'cancelled',
  'returned',
]

const COMMISSION_STATUSES = ['', 'pending', 'approved', 'paid', 'cancelled']
const HANDOFF_STATUSES = ['', 'not_sent', 'sent']

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => String(value || '').trim()),
  )
}

function AdminOrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    orderCode: searchParams.get('orderCode') || '',
    phone: '',
    status: '',
    commissionStatus: '',
    handoffStatus: '',
    trackingCode: '',
  })
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [toast, setToast] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })

  const query = useMemo(
    () =>
      compactParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      }),
    [filters, pagination.limit, pagination.page],
  )

  const handleAuthError = useCallback(
    (apiError) => {
      if (apiError.statusCode === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        navigate('/admin/login', { replace: true })
        return true
      }

      return false
    },
    [navigate],
  )

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await adminApi.getOrders(query)
      setOrders(response.data.orders || [])
      setPagination((current) => ({
        ...current,
        ...(response.data.pagination || {
          total: response.data.orders?.length || 0,
          totalPages: 1,
        }),
      }))
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }, [handleAuthError, query])

  const loadOrderDetail = useCallback(
    async (orderId) => {
      if (!orderId) return

      setDetailLoading(true)
      setDetailError('')
      try {
        const response = await adminApi.getOrderDetail(orderId)
        setSelectedOrder(response.data.order)
      } catch (apiError) {
        if (handleAuthError(apiError)) return
        setDetailError(getApiErrorMessage(apiError))
      } finally {
        setDetailLoading(false)
      }
    },
    [handleAuthError],
  )

  useEffect(() => {
    let mounted = true

    async function run() {
      setLoading(true)
      setError('')
      try {
        const response = await adminApi.getOrders(query)
        if (mounted) {
          setOrders(response.data.orders || [])
          setPagination((current) => ({
            ...current,
            ...(response.data.pagination || {
              total: response.data.orders?.length || 0,
              totalPages: 1,
            }),
          }))
        }
      } catch (apiError) {
        if (handleAuthError(apiError)) return
        if (mounted) setError(getApiErrorMessage(apiError))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [handleAuthError, query])

  useEffect(() => {
    if (!toast) return undefined

    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
    setPagination((current) => ({ ...current, page: 1 }))
  }

  function updatePage(page) {
    setPagination((current) => ({ ...current, page }))
  }

  function updateLimit(limit) {
    setPagination((current) => ({ ...current, page: 1, limit }))
  }

  async function handleSelectOrder(orderId) {
    setSelectedOrderId(orderId)
    await loadOrderDetail(orderId)
  }

  async function refreshCurrentOrder() {
    await Promise.all([loadOrders(), loadOrderDetail(selectedOrderId)])
  }

  function handleMessage(message) {
    setToast(message)
  }

  return (
    <AdminLayout
      title="Quản lý đơn hàng"
      onRefresh={loadOrders}
      loading={loading}
    >
      <section className="admin-filter-bar">
        <div className="admin-filter-bar__title">
          <Filter size={18} />
          Bộ lọc
        </div>
        <label>
          <Search size={15} />
          <input
            placeholder="Mã đơn"
            value={filters.orderCode}
            onChange={(event) => updateFilter('orderCode', event.target.value)}
          />
        </label>
        <label>
          <input
            placeholder="SĐT khách"
            value={filters.phone}
            onChange={(event) => updateFilter('phone', event.target.value)}
          />
        </label>
        <label>
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'Tất cả trạng thái'}
              </option>
            ))}
          </select>
        </label>
        <label>
          <select
            value={filters.commissionStatus}
            onChange={(event) =>
              updateFilter('commissionStatus', event.target.value)
            }
          >
            {COMMISSION_STATUSES.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'Hoa hồng'}
              </option>
            ))}
          </select>
        </label>
        <label>
          <select
            value={filters.handoffStatus}
            onChange={(event) =>
              updateFilter('handoffStatus', event.target.value)
            }
          >
            {HANDOFF_STATUSES.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'Gửi thông tin'}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            placeholder="Mã vận đơn"
            value={filters.trackingCode}
            onChange={(event) =>
              updateFilter('trackingCode', event.target.value)
            }
          />
        </label>
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={loadOrders}
          disabled={loading}
        >
          Refresh
        </button>
      </section>

      {error ? <div className="admin-error">{error}</div> : null}

      <div
        className={`admin-orders-layout ${
          selectedOrder || detailLoading ? 'has-detail' : ''
        }`}
      >
        <div className="admin-list-stack">
          <OrderTable
            orders={orders}
            loading={loading}
            selectedOrderId={selectedOrderId}
            onSelect={handleSelectOrder}
          />
          <AdminPagination
            pagination={pagination}
            onPageChange={updatePage}
            onLimitChange={updateLimit}
          />
        </div>
        <OrderDetailDrawer
          order={selectedOrder}
          loading={detailLoading}
          error={detailError}
          onClose={() => {
            setSelectedOrder(null)
            setSelectedOrderId('')
          }}
          onRefresh={refreshCurrentOrder}
          onMessage={handleMessage}
        />
      </div>

      {toast ? <div className="admin-toast">{toast}</div> : null}
    </AdminLayout>
  )
}

export default AdminOrdersPage
