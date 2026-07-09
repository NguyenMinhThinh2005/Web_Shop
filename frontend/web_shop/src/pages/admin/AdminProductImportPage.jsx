import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileJson, Trash2, Upload } from 'lucide-react'
import { ADMIN_TOKEN_KEY, adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminModal from '../../components/admin/AdminModal'
import { formatMoney } from '../../utils/formatMoney'

function parseImportText(value) {
  try {
    const parsed = JSON.parse(value)

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.products)) {
      throw new Error('Không tìm thấy mảng products trong JSON.')
    }

    return parsed
  } catch (error) {
    if (error.message === 'Không tìm thấy mảng products trong JSON.') {
      throw error
    }

    throw new Error(
      'JSON không hợp lệ. Kiểm tra dấu phẩy, ngoặc {} hoặc dấu ngoặc kép.',
      { cause: error },
    )
  }
}

function prettyJson(value) {
  return JSON.stringify(value, null, 2)
}

function getShopSlugMismatch(payload, shop) {
  if (!payload?.shopSlug || !shop?.slug || payload.shopSlug === shop.slug) {
    return null
  }

  return {
    jsonShopSlug: payload.shopSlug,
    currentShopSlug: shop.slug,
    message: `JSON này đang để shopSlug = ${payload.shopSlug}, nhưng bạn đang import vào shop ${shop.slug}.`,
    hint: `Hãy đổi shopSlug trong JSON thành ${shop.slug} hoặc mở đúng shop để import.`,
  }
}

function getImportErrorMessage(apiError) {
  const response = apiError?.response?.data

  if (response?.code === 'SHOP_SLUG_MISMATCH') {
    return `${response.message} ${response.hint || ''}`.trim()
  }

  return getApiErrorMessage(apiError)
}

function SummaryGrid({ summary }) {
  if (!summary) return null

  const items = [
    ['Tổng', summary.total],
    ['Hợp lệ', summary.valid],
    ['Tạo mới', summary.created],
    ['Cập nhật', summary.updated],
    ['Bỏ qua/Lỗi', summary.skipped],
    ['Danh mục tạo mới', summary.categoriesCreated?.length || summary.categoriesToCreate?.length || 0],
  ]

  return (
    <div className="admin-import-summary">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value || 0}</strong>
        </div>
      ))}
    </div>
  )
}

function PreviewTable({ summary }) {
  if (!summary?.preview?.length) return null

  return (
    <div className="admin-table-wrap">
      <table className="admin-table report-table">
        <thead>
          <tr>
            <th>importKey</th>
            <th>SKU</th>
            <th>Tên</th>
            <th>Danh mục</th>
            <th>Giá / mode</th>
            <th>Status</th>
            <th>Action</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {summary.preview.map((row, index) => (
            <tr key={`${row.importKey || 'row'}-${index}`}>
              <td>{row.importKey || '-'}</td>
              <td>{row.sku || '-'}</td>
              <td>
                <strong>{row.name || '-'}</strong>
              </td>
              <td>{row.categoryName || '-'}</td>
              <td>
                {row.priceMode === 'fixed' ? formatMoney(row.price) : row.price}
                <span className="admin-table-subtext">{row.priceMode}</span>
              </td>
              <td>{row.status}</td>
              <td>
                <span className={`admin-badge admin-badge--${row.action}`}>
                  {row.action}
                </span>
              </td>
              <td>{row.message || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminProductImportPage() {
  const { shopId } = useParams()
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDirtyAfterValidate, setIsDirtyAfterValidate] = useState(false)
  const [confirmImportOpen, setConfirmImportOpen] = useState(false)

  const parsedPayload = useMemo(() => {
    if (!jsonText.trim()) return null

    try {
      return parseImportText(jsonText)
    } catch {
      return null
    }
  }, [jsonText])

  const shopSlugMismatch = useMemo(
    () => getShopSlugMismatch(parsedPayload, shop),
    [parsedPayload, shop],
  )

  const canImport = useMemo(
    () =>
      Boolean(
        summary &&
          !isDirtyAfterValidate &&
          (summary.errors || []).length === 0 &&
          summary.valid > 0 &&
          !shopSlugMismatch,
      ),
    [isDirtyAfterValidate, shopSlugMismatch, summary],
  )

  const handleAuthError = useCallback((apiError) => {
    if (apiError.statusCode === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      navigate('/admin/login', { replace: true })
      return true
    }

    return false
  }, [navigate])

  useEffect(() => {
    let mounted = true

    async function loadShop() {
      try {
        const response = await adminApi.getAdminShopDetail(shopId)
        if (mounted) setShop(response.data.shop)
      } catch (apiError) {
        if (handleAuthError(apiError)) return
        if (mounted) setError(getApiErrorMessage(apiError))
      }
    }

    loadShop()

    return () => {
      mounted = false
    }
  }, [handleAuthError, shopId])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    setJsonText(text)
    setSummary(null)
    setError('')
    setIsDirtyAfterValidate(false)
  }

  function handleTextChange(value) {
    setJsonText(value)
    setError('')
    if (summary) {
      setIsDirtyAfterValidate(true)
    }
  }

  function useCurrentShopSlug() {
    if (!shop?.slug) return

    try {
      const payload = parseImportText(jsonText)
      payload.shopSlug = shop.slug
      setJsonText(prettyJson(payload))
      setError('')
      setIsDirtyAfterValidate(true)
    } catch (parseError) {
      setError(parseError.message)
    }
  }

  async function validateImport() {
    setLoading(true)
    setError('')

    try {
      const payload = parseImportText(jsonText)
      const response = await adminApi.validateProductImport(shopId, payload)
      setSummary(response.data.summary)
      setIsDirtyAfterValidate(false)
      setToast('Đã kiểm tra dữ liệu')
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getImportErrorMessage(apiError))
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  async function commitImport() {
    if (!canImport) return

    setLoading(true)
    setError('')
    setConfirmImportOpen(false)

    try {
      const payload = parseImportText(jsonText)
      const response = await adminApi.importProductsJson(shopId, payload)
      setSummary(response.data.summary)
      setIsDirtyAfterValidate(false)
      setToast('Đã nhập sản phẩm')
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getImportErrorMessage(apiError))
      setToast('Không nhập được sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  function clearContent() {
    setJsonText('')
    setSummary(null)
    setError('')
    setIsDirtyAfterValidate(false)
  }

  return (
    <AdminLayout title="Import sản phẩm JSON" loading={loading}>
      <section className="admin-catalog-header">
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => navigate(`/admin/shops/${shopId}/catalog`)}
        >
          <ArrowLeft size={16} />
          Về catalog
        </button>
        <div>
          <p className="admin-eyebrow">Catalog import</p>
          <h2>Import sản phẩm bằng JSON</h2>
          <span>
            Dán JSON đã được chuẩn hóa hoặc chọn file .json. Hệ thống sẽ kiểm
            tra trước khi nhập.
          </span>
        </div>
        <Link
          className="admin-button admin-button--ghost"
          to={`/admin/shops/${shopId}/catalog`}
        >
          Về catalog
        </Link>
      </section>

      {error ? <div className="admin-error">{error}</div> : null}
      {shopSlugMismatch ? (
        <div className="admin-warning">
          <strong>{shopSlugMismatch.message}</strong>
          <p>{shopSlugMismatch.hint}</p>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={useCurrentShopSlug}
          >
            Dùng shop hiện tại
          </button>
        </div>
      ) : null}
      {isDirtyAfterValidate ? (
        <div className="admin-state">
          Dữ liệu đã thay đổi, vui lòng kiểm tra lại trước khi nhập.
        </div>
      ) : null}

      <section className="admin-card report-section admin-import-layout">
        <div className="admin-import-editor">
          <div className="admin-card__title">
            <h3>
              <FileJson size={18} />
              Nội dung JSON
            </h3>
            <label className="admin-file-button">
              <Upload size={16} />
              Chọn file .json
              <input type="file" accept=".json,application/json" onChange={handleFile} />
            </label>
          </div>
          <textarea
            className="admin-textarea admin-import-textarea"
            value={jsonText}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder="{&#10;  &quot;schemaVersion&quot;: &quot;1.0&quot;,&#10;  &quot;products&quot;: []&#10;}"
          />
          <div className="admin-action-row">
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={validateImport}
              disabled={loading || !jsonText.trim()}
            >
              Kiểm tra dữ liệu
            </button>
            <button
              type="button"
              className="admin-button admin-button--dark"
              onClick={() => setConfirmImportOpen(true)}
              disabled={loading || !canImport}
            >
              Nhập sản phẩm
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={clearContent}
              disabled={loading || (!jsonText && !summary)}
            >
              <Trash2 size={16} />
              Xóa nội dung
            </button>
          </div>
        </div>

        <SummaryGrid summary={summary} />
        {summary?.errors?.length ? (
          <div className="admin-error">
            Có {summary.errors.length} dòng lỗi. Vui lòng sửa trước khi nhập.
          </div>
        ) : null}
        {summary?.warnings?.length ? (
          <div className="admin-state">
            Có {summary.warnings.length} cảnh báo. Ảnh lỗi URL sẽ bị bỏ qua.
          </div>
        ) : null}
        <PreviewTable summary={summary} />
      </section>

      {confirmImportOpen ? (
        <AdminModal
          title="Xác nhận nhập sản phẩm"
          onClose={() => setConfirmImportOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => setConfirmImportOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={commitImport}
                disabled={loading}
              >
                Nhập sản phẩm
              </button>
            </>
          }
        >
          <div className="admin-confirm-copy">
            <p>
              Hệ thống sẽ tạo mới hoặc cập nhật sản phẩm theo dữ liệu đã kiểm
              tra.
            </p>
            <SummaryGrid summary={summary} />
          </div>
        </AdminModal>
      ) : null}

      {toast ? <div className="admin-toast">{toast}</div> : null}
    </AdminLayout>
  )
}

export default AdminProductImportPage
