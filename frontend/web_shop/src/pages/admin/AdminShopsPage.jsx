import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, ExternalLink, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { ADMIN_TOKEN_KEY, adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminModal from '../../components/admin/AdminModal'
import AdminPagination from '../../components/admin/AdminPagination'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'

function emptyShopForm() {
  return {
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    campaignId: '',
    status: 'active',
    contact: {
      hotline: '',
      zaloUrl: '',
      messengerUrl: '',
    },
    staff: {
      staffId: '',
      staffName: '',
      staffPhone: '',
      staffZalo: '',
      staffMessenger: '',
    },
  }
}

function toShopForm(shop) {
  return {
    ...emptyShopForm(),
    name: shop.name || '',
    slug: shop.slug || '',
    description: shop.description || '',
    logoUrl: shop.logoUrl || '',
    bannerUrl: shop.bannerUrl || '',
    campaignId: shop.campaignId || '',
    status: shop.status || 'active',
    contact: {
      hotline: shop.contact?.hotline || '',
      zaloUrl: shop.contact?.zaloUrl || '',
      messengerUrl: shop.contact?.messengerUrl || '',
    },
    staff: {
      staffId: shop.staff?.staffId || '',
      staffName: shop.staff?.staffName || '',
      staffPhone: shop.staff?.staffPhone || '',
      staffZalo: shop.staff?.staffZalo || '',
      staffMessenger: shop.staff?.staffMessenger || '',
    },
  }
}

function cleanNestedObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => String(value || '').trim()),
  )
}

function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isValidUrl(value) {
  if (!String(value || '').trim()) return true

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function isValidVietnamPhone(value) {
  const trimmed = String(value || '').trim()
  const digits = trimmed.replace(/\D/g, '')

  if (!trimmed) return true
  if (digits.length < 10 || digits.length > 11) return false
  if (/^(\d)\1+$/.test(digits)) return false
  if (digits.startsWith('0')) return digits.length === 10
  if (digits.startsWith('84')) return digits.length === 11

  return false
}

function getFriendlyError(message) {
  if (/slug/i.test(message || '') && /exist|already/i.test(message || '')) {
    return 'Slug này đã tồn tại, vui lòng chọn slug khác.'
  }

  return message || 'Không lưu được dữ liệu'
}

function AdminShopsPage() {
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [shopModalOpen, setShopModalOpen] = useState(false)
  const [editingShop, setEditingShop] = useState(null)
  const [form, setForm] = useState(emptyShopForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })

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

  const loadShops = useCallback(async () => {
      setLoading(true)
      setError('')
      try {
      const response = await adminApi.getAdminShops({
        page: pagination.page,
        limit: pagination.limit,
      })
      setShops(response.data.shops || [])
      setPagination((current) => ({
        ...current,
        ...(response.data.pagination || {
          total: response.data.shops?.length || 0,
          totalPages: 1,
        }),
      }))
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }, [handleAuthError, pagination.limit, pagination.page])

  useEffect(() => {
    let mounted = true

    async function run() {
      setLoading(true)
      setError('')
      try {
        const response = await adminApi.getAdminShops({
          page: pagination.page,
          limit: pagination.limit,
        })
        if (mounted) {
          setShops(response.data.shops || [])
          setPagination((current) => ({
            ...current,
            ...(response.data.pagination || {
              total: response.data.shops?.length || 0,
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
  }, [handleAuthError, pagination.limit, pagination.page])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  function publicUrl(shop) {
    return `${window.location.origin}/shop/${shop.slug}`
  }

  async function copyPublicUrl(shop) {
    try {
      await navigator.clipboard.writeText(publicUrl(shop))
      setToast('Đã copy public URL')
    } catch {
      setToast('Không copy được')
    }
  }

  function openCreateModal() {
    setEditingShop(null)
    setForm(emptyShopForm())
    setFormError('')
    setShopModalOpen(true)
  }

  function openEditModal(shop) {
    setEditingShop(shop)
    setForm(toShopForm(shop))
    setFormError('')
    setShopModalOpen(true)
  }

  function closeModal() {
    setEditingShop(null)
    setForm(emptyShopForm())
    setFormError('')
    setShopModalOpen(false)
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateNested(section, field, value) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  function updateName(value) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.slug ? current.slug : normalizeSlug(value),
    }))
  }

  function buildPayload() {
    const slug = normalizeSlug(form.slug)

    if (!form.name.trim()) {
      throw new Error('Vui lòng nhập tên shop')
    }

    if (!form.status) {
      throw new Error('Vui lòng chọn trạng thái')
    }

    if (form.slug.trim() && !slug) {
      throw new Error('Slug chỉ dùng chữ thường, số và dấu gạch ngang')
    }

    if (!isValidUrl(form.logoUrl)) {
      throw new Error('Logo URL không hợp lệ.')
    }

    if (!isValidUrl(form.bannerUrl)) {
      throw new Error('Banner URL không hợp lệ.')
    }

    if (!isValidVietnamPhone(form.contact.hotline)) {
      throw new Error('Hotline chưa hợp lệ. Vui lòng nhập số Việt Nam.')
    }

    if (!isValidVietnamPhone(form.staff.staffPhone)) {
      throw new Error('Số điện thoại tư vấn viên chưa hợp lệ.')
    }

    if (!isValidUrl(form.staff.staffZalo)) {
      throw new Error('Zalo URL không hợp lệ.')
    }

    if (!isValidUrl(form.staff.staffMessenger)) {
      throw new Error('Messenger URL không hợp lệ.')
    }

    if (!isValidUrl(form.contact.messengerUrl)) {
      throw new Error('Messenger URL không hợp lệ')
    }

    if (!isValidUrl(form.contact.zaloUrl)) {
      throw new Error('Zalo URL không hợp lệ')
    }

    if (
      form.contact.hotline.trim() &&
      !/^[0-9+\s]+$/.test(form.contact.hotline.trim())
    ) {
      throw new Error('Hotline chỉ nhận số, khoảng trắng và dấu +')
    }

    return {
      name: form.name.trim(),
      slug: slug || undefined,
      description: form.description.trim(),
      logoUrl: form.logoUrl.trim(),
      bannerUrl: form.bannerUrl.trim(),
      campaignId: form.campaignId.trim(),
      status: form.status,
      contact: cleanNestedObject(form.contact),
      staff: cleanNestedObject(form.staff),
      sheetConfig: { enabled: false, syncMode: 'manual' },
    }
  }

  async function saveShop(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFormError('')
    try {
      const payload = buildPayload()
      if (editingShop) {
        await adminApi.updateAdminShop(editingShop._id, payload)
        setToast('Đã cập nhật shop')
      } else {
        await adminApi.createAdminShop(payload)
        setToast('Đã tạo shop')
      }
      closeModal()
      await loadShops()
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setFormError(getFriendlyError(getApiErrorMessage(apiError)))
    } finally {
      setSaving(false)
    }
  }

  async function deleteShop(shop) {
    if (!window.confirm(`Tạm ẩn shop "${shop.name}"?`)) return

    setLoading(true)
    try {
      await adminApi.deleteAdminShop(shop._id)
      setToast('Đã tạm ẩn shop')
      await loadShops()
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Quản lý shop" onRefresh={loadShops} loading={loading}>
      <section className="admin-page-intro admin-page-intro--actions">
        <p>Tạo và quản lý các storefront bán hàng.</p>
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={openCreateModal}
        >
          <Plus size={16} />
          Tạo shop mới
        </button>
      </section>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-card report-section">
        <div className="admin-card__title">
          <h3>
            <Store size={18} />
            Danh sách shop
          </h3>
        </div>
        {loading ? <div className="admin-state">Đang tải shop...</div> : null}
        <div className="admin-table-wrap">
          <table className="admin-table report-table">
            <thead>
              <tr>
                <th>Tên shop</th>
                <th>Slug</th>
                <th>Trạng thái</th>
                <th>Hotline</th>
                <th>Campaign</th>
                <th>Public URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop._id}>
                  <td>
                    <strong>{shop.name}</strong>
                  </td>
                  <td>{shop.slug}</td>
                  <td>
                    <AdminStatusBadge status={shop.status} />
                  </td>
                  <td>{shop.contact?.hotline ? 'Có hotline' : 'Chưa có'}</td>
                  <td>{shop.campaignId || '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-link-button"
                      onClick={() => copyPublicUrl(shop)}
                    >
                      <Copy size={15} />
                      Copy URL
                    </button>
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="admin-button admin-button--primary"
                        onClick={() => navigate(`/admin/shops/${shop._id}/catalog`)}
                      >
                        Quản lý sản phẩm
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => window.open(publicUrl(shop), '_blank')}
                        aria-label="Mở shop"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => openEditModal(shop)}
                        aria-label="Sửa shop"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button admin-icon-button--danger"
                        onClick={() => deleteShop(shop)}
                        aria-label="Tạm ẩn shop"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 ? (
          <AdminPagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
        ) : null}
      </section>

      {shopModalOpen ? (
        <AdminModal
          title={editingShop ? 'Sửa shop' : 'Tạo shop mới'}
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={closeModal}
              >
                Hủy
              </button>
              <button
                type="submit"
                form="shop-form"
                className="admin-button admin-button--primary"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu shop'}
              </button>
            </>
          }
        >
          <form id="shop-form" className="admin-form-stack" onSubmit={saveShop}>
            <fieldset>
              <legend>Thông tin chính</legend>
              <div className="admin-form-grid admin-form-grid--two">
                <label>
                  Tên shop *
                  <input
                    value={form.name}
                    onChange={(event) => updateName(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Slug
                  <input
                    value={form.slug}
                    onChange={(event) =>
                      updateField('slug', normalizeSlug(event.target.value))
                    }
                    placeholder="Tự tạo từ tên nếu để trống"
                  />
                </label>
                <label className="admin-form-grid__full">
                  Mô tả
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField('description', event.target.value)
                    }
                    rows="3"
                  />
                </label>
                <label>
                  Campaign ID
                  <input
                    value={form.campaignId}
                    onChange={(event) =>
                      updateField('campaignId', event.target.value)
                    }
                  />
                </label>
                <label>
                  Trạng thái
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField('status', event.target.value)
                    }
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Liên hệ</legend>
              <div className="admin-form-grid admin-form-grid--two">
                <label>
                  Messenger URL
                  <input
                    value={form.contact.messengerUrl}
                    onChange={(event) =>
                      updateNested('contact', 'messengerUrl', event.target.value)
                    }
                  />
                </label>
                <label>
                  Zalo URL
                  <input
                    value={form.contact.zaloUrl}
                    onChange={(event) =>
                      updateNested('contact', 'zaloUrl', event.target.value)
                    }
                  />
                </label>
                <label>
                  Hotline
                  <input
                    value={form.contact.hotline}
                    onChange={(event) =>
                      updateNested('contact', 'hotline', event.target.value)
                    }
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Vận hành nội bộ</legend>
              <div className="admin-form-grid admin-form-grid--two">
                {Object.keys(form.staff).map((field) => (
                  <label key={field}>
                    {field}
                    <input
                      value={form.staff[field]}
                      onChange={(event) =>
                        updateNested('staff', field, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Hiển thị</legend>
              <div className="admin-form-grid admin-form-grid--two">
                <label>
                  Logo URL
                  <input
                    value={form.logoUrl}
                    onChange={(event) =>
                      updateField('logoUrl', event.target.value)
                    }
                  />
                </label>
                <label>
                  Banner URL
                  <input
                    value={form.bannerUrl}
                    onChange={(event) =>
                      updateField('bannerUrl', event.target.value)
                    }
                  />
                </label>
              </div>
            </fieldset>
            {formError ? <div className="admin-error">{formError}</div> : null}
          </form>
        </AdminModal>
      ) : null}

      {toast ? <div className="admin-toast">{toast}</div> : null}
    </AdminLayout>
  )
}

export default AdminShopsPage
