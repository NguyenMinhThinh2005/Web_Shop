import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeDollarSign,
  CheckCircle2,
  Clock,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { ADMIN_TOKEN_KEY, adminApi } from '../../api/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'
import OrderStatusBadge from '../../components/admin/OrderStatusBadge'
import { formatDate } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'

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

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => String(value || '').trim()),
  )
}

function AdminReportsPage() {
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [filters, setFilters] = useState({
    shopId: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    commissionStatus: '',
  })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query = useMemo(() => compactParams(filters), [filters])

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

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await adminApi.getReportOverview(query)
      setReport(response.data)
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }, [handleAuthError, query])

  useEffect(() => {
    let mounted = true

    async function loadBase() {
      try {
        const [shopResponse, reportResponse] = await Promise.all([
          adminApi.getShops(),
          adminApi.getReportOverview(query),
        ])

        if (!mounted) return

        setShops(shopResponse.data.shops || [])
        setReport(reportResponse.data)
      } catch (apiError) {
        if (handleAuthError(apiError)) return
        if (mounted) setError(apiError.message)
      }
    }

    loadBase()

    return () => {
      mounted = false
    }
  }, [handleAuthError, query])

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function openOrder(orderCode) {
    navigate(`/admin/orders?orderCode=${encodeURIComponent(orderCode)}`)
  }

  const summaryCards = [
    {
      label: 'Tổng đơn',
      value: report?.summary?.totalOrders || 0,
      icon: ShoppingBag,
    },
    {
      label: 'Doanh số',
      value: formatMoney(report?.summary?.totalRevenue),
      icon: Wallet,
    },
    {
      label: 'Giá trị đơn trung bình',
      value: formatMoney(report?.summary?.averageOrderValue),
      icon: TrendingUp,
    },
    {
      label: 'Hoa hồng dự kiến',
      value: formatMoney(report?.summary?.commissionExpected),
      icon: BadgeDollarSign,
    },
    {
      label: 'Hoa hồng đã nhận',
      value: formatMoney(report?.summary?.commissionPaid),
      icon: CheckCircle2,
    },
    {
      label: 'Hoa hồng còn chờ',
      value: formatMoney(report?.summary?.commissionPending),
      icon: Clock,
    },
  ]

  return (
    <AdminLayout
      title="Báo cáo bán hàng"
      onRefresh={loadReport}
      loading={loading}
    >
      <section className="admin-page-intro">
        <p>Theo dõi đơn hàng, doanh số và hoa hồng theo từng shop.</p>
      </section>

      <section className="admin-filter-bar admin-filter-bar--reports">
        <label>
          Shop
          <select
            value={filters.shopId}
            onChange={(event) => updateFilter('shopId', event.target.value)}
          >
            <option value="">Tất cả shop</option>
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Từ ngày
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
          />
        </label>
        <label>
          Trạng thái đơn
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'Tất cả'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hoa hồng
          <select
            value={filters.commissionStatus}
            onChange={(event) =>
              updateFilter('commissionStatus', event.target.value)
            }
          >
            {COMMISSION_STATUSES.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'Tất cả'}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={loadReport}
          disabled={loading}
        >
          Lọc
        </button>
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={loadReport}
          disabled={loading}
        >
          Làm mới
        </button>
      </section>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="report-summary-grid">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <article className="report-summary-card" key={label}>
            <span>
              <Icon size={18} />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-card report-section">
        <div className="admin-card__title">
          <h3>
            <PackageCheck size={18} />
            Theo shop
          </h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table report-table">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Slug</th>
                <th>Tổng đơn</th>
                <th>Doanh số</th>
                <th>Hoa hồng dự kiến</th>
                <th>Hoa hồng đã nhận</th>
                <th>Hoa hồng còn chờ</th>
              </tr>
            </thead>
            <tbody>
              {(report?.byShop || []).map((row) => (
                <tr key={row.shopId}>
                  <td>
                    <strong>{row.shopName || '-'}</strong>
                  </td>
                  <td>{row.shopSlug || '-'}</td>
                  <td>{row.totalOrders}</td>
                  <td>{formatMoney(row.totalRevenue)}</td>
                  <td>{formatMoney(row.commissionExpected)}</td>
                  <td>{formatMoney(row.commissionPaid)}</td>
                  <td>{formatMoney(row.commissionPending)}</td>
                </tr>
              ))}
              {(report?.byShop || []).length === 0 ? (
                <tr>
                  <td colSpan="7">Chưa có dữ liệu theo shop.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-status-grid">
        {(report?.byStatus || []).map((row) => (
          <article className="admin-card report-status-card" key={row.status}>
            <OrderStatusBadge status={row.status} />
            <strong>{row.count} đơn</strong>
            <span>{formatMoney(row.revenue)}</span>
          </article>
        ))}
        {(report?.byStatus || []).length === 0 ? (
          <article className="admin-card report-status-card">
            <strong>Chưa có dữ liệu trạng thái</strong>
            <span>Thử đổi bộ lọc hoặc làm mới báo cáo.</span>
          </article>
        ) : null}
      </section>

      <section className="admin-card report-section">
        <div className="admin-card__title">
          <h3>Đơn gần đây</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table report-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Shop</th>
                <th>Khách</th>
                <th>SĐT</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hoa hồng</th>
                <th>Ngày tạo</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(report?.recentOrders || []).map((order) => (
                <tr key={order._id}>
                  <td>
                    <strong>{order.orderCode}</strong>
                  </td>
                  <td>{order.shopName || '-'}</td>
                  <td>{order.customerName || '-'}</td>
                  <td>{order.customerPhone || '-'}</td>
                  <td>{formatMoney(order.grandTotal)}</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td>{formatMoney(order.commissionExpected)}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-button admin-button--ghost"
                      onClick={() => openOrder(order.orderCode)}
                    >
                      Xem đơn
                    </button>
                  </td>
                </tr>
              ))}
              {(report?.recentOrders || []).length === 0 ? (
                <tr>
                  <td colSpan="9">Chưa có đơn gần đây.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}

export default AdminReportsPage
