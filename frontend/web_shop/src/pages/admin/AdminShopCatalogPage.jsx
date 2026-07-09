import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  PackageCheck,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Tags,
  Trash2,
  Upload,
} from 'lucide-react'
import { ADMIN_TOKEN_KEY, adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminModal from '../../components/admin/AdminModal'
import AdminPagination from '../../components/admin/AdminPagination'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import { formatMoney } from '../../utils/formatMoney'

const EMPTY_CATEGORY = {
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
  status: 'active',
}

const EMPTY_PRODUCT = {
  name: '',
  sku: '',
  slug: '',
  priceMode: 'fixed',
  price: 0,
  salePrice: '',
  status: 'active',
  thumbnailUrl: '',
  imagesText: '',
  categoryIds: [],
  shortDescription: '',
  description: '',
  isFeatured: false,
  sortOrder: 0,
  attributesText: '',
}

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => String(value || '').trim()),
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

function friendlyCatalogError(message) {
  const normalizedMessage = message || ''

  if (/sku/i.test(normalizedMessage) && /exist|already|duplicate/i.test(normalizedMessage)) {
    return 'SKU này đã tồn tại trong shop, vui lòng đổi SKU khác.'
  }

  if (/slug/i.test(normalizedMessage) && /exist|already|duplicate/i.test(normalizedMessage)) {
    return 'Slug sản phẩm đã tồn tại, vui lòng đổi slug khác.'
  }

  if (/sku/i.test(message || '') && /exist|already|duplicate/i.test(message || '')) {
    return 'SKU này đã tồn tại, vui lòng chọn SKU khác.'
  }

  if (/slug/i.test(message || '') && /exist|already|duplicate/i.test(message || '')) {
    return 'Slug này đã tồn tại, vui lòng chọn slug khác.'
  }

  return message || 'Không lưu được dữ liệu'
}

function parseImageUrls(value) {
  const seen = new Set()
  const urls = []

  String(value || '')
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean)
    .forEach((url, index) => {
      if (!isValidUrl(url)) {
        throw new Error(`URL ảnh dòng ${index + 1} không hợp lệ`)
      }

      if (!seen.has(url)) {
        seen.add(url)
        urls.push(url)
      }
    })

  return urls
}

function productToForm(product) {
  return {
    ...EMPTY_PRODUCT,
    name: product.name || '',
    sku: product.sku || '',
    slug: product.slug || '',
    priceMode: product.priceMode || 'fixed',
    price: product.price || 0,
    salePrice: product.salePrice ?? '',
    status: product.status || 'active',
    thumbnailUrl: product.thumbnailUrl || '',
    imagesText: (product.images || []).join('\n'),
    categoryIds: (product.categoryIds || []).map(String),
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    isFeatured: Boolean(product.isFeatured),
    sortOrder: product.sortOrder || 0,
    attributesText: product.attributes
      ? JSON.stringify(product.attributes, null, 2)
      : '',
  }
}

function categoryToForm(category) {
  return {
    ...EMPTY_CATEGORY,
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || '',
    sortOrder: category.sortOrder || 0,
    status: category.status || 'active',
  }
}

function AdminShopCatalogPage() {
  const { shopId } = useParams()
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeTab, setActiveTab] = useState('categories')
  const [filters, setFilters] = useState({
    q: '',
    categoryId: '',
    status: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [categoryModal, setCategoryModal] = useState(null)
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY)
  const [productModal, setProductModal] = useState(null)
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [pinModal, setPinModal] = useState(null)
  const [pinOrder, setPinOrder] = useState(1)
  const [modalError, setModalError] = useState('')
  const [saving, setSaving] = useState(false)
  const [categoryPagination, setCategoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [productPagination, setProductPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })

  const productQuery = useMemo(() => compactParams(filters), [filters])
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [String(category._id), category])),
    [categories],
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

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [shopResponse, categoryResponse, productResponse] =
        await Promise.all([
          adminApi.getAdminShopDetail(shopId),
          adminApi.getAdminCategories(shopId, {
            page: categoryPagination.page,
            limit: categoryPagination.limit,
          }),
          adminApi.getAdminProducts(shopId, {
            ...productQuery,
            page: productPagination.page,
            limit: productPagination.limit,
          }),
        ])

      setShop(shopResponse.data.shop)
      setCategories(categoryResponse.data.categories || [])
      setProducts(productResponse.data.products || [])
      setCategoryPagination((current) => ({
        ...current,
        ...(categoryResponse.data.pagination || {
          total: categoryResponse.data.categories?.length || 0,
          totalPages: 1,
        }),
      }))
      setProductPagination((current) => ({
        ...current,
        ...(productResponse.data.pagination || {
          total: productResponse.data.products?.length || 0,
          totalPages: 1,
        }),
      }))
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }, [
    categoryPagination.limit,
    categoryPagination.page,
    handleAuthError,
    productPagination.limit,
    productPagination.page,
    productQuery,
    shopId,
  ])

  useEffect(() => {
    let mounted = true

    async function run() {
      setLoading(true)
      setError('')
      try {
        const [shopResponse, categoryResponse, productResponse] =
          await Promise.all([
            adminApi.getAdminShopDetail(shopId),
            adminApi.getAdminCategories(shopId, {
              page: categoryPagination.page,
              limit: categoryPagination.limit,
            }),
            adminApi.getAdminProducts(shopId, {
              ...productQuery,
              page: productPagination.page,
              limit: productPagination.limit,
            }),
          ])

        if (!mounted) return

        setShop(shopResponse.data.shop)
        setCategories(categoryResponse.data.categories || [])
        setProducts(productResponse.data.products || [])
        setCategoryPagination((current) => ({
          ...current,
          ...(categoryResponse.data.pagination || {
            total: categoryResponse.data.categories?.length || 0,
            totalPages: 1,
          }),
        }))
        setProductPagination((current) => ({
          ...current,
          ...(productResponse.data.pagination || {
            total: productResponse.data.products?.length || 0,
            totalPages: 1,
          }),
        }))
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
  }, [
    categoryPagination.limit,
    categoryPagination.page,
    handleAuthError,
    productPagination.limit,
    productPagination.page,
    productQuery,
    shopId,
  ])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  function publicShopUrl() {
    return shop ? `${window.location.origin}/shop/${shop.slug}` : ''
  }

  async function copyShopUrl() {
    try {
      await navigator.clipboard.writeText(publicShopUrl())
      setToast('Đã copy link shop')
    } catch {
      setToast('Không copy được')
    }
  }

  function updateCategoryField(field, value) {
    setCategoryForm((current) => ({ ...current, [field]: value }))
  }

  function updateProductField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }))
  }

  function updateProductFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
    setProductPagination((current) => ({ ...current, page: 1 }))
  }

  function updateCategoryPage(page) {
    setCategoryPagination((current) => ({ ...current, page }))
  }

  function updateProductPage(page) {
    setProductPagination((current) => ({ ...current, page }))
  }

  function updateCategoryName(value) {
    setCategoryForm((current) => ({
      ...current,
      name: value,
      slug: current.slug ? current.slug : normalizeSlug(value),
    }))
  }

  function updateProductName(value) {
    setProductForm((current) => ({
      ...current,
      name: value,
      slug: current.slug ? current.slug : normalizeSlug(value),
    }))
  }

  function toggleProductCategory(categoryId) {
    setProductForm((current) => {
      const hasCategory = current.categoryIds.includes(categoryId)
      return {
        ...current,
        categoryIds: hasCategory
          ? current.categoryIds.filter((id) => id !== categoryId)
          : [...current.categoryIds, categoryId],
      }
    })
  }

  async function saveCategory(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setModalError('')
    try {
      const slug = normalizeSlug(categoryForm.slug)
      if (!categoryForm.name.trim()) {
        throw new Error('Vui lòng nhập tên danh mục')
      }
      if (categoryForm.slug.trim() && !slug) {
        throw new Error('Slug chỉ dùng chữ thường, số và dấu gạch ngang')
      }
      if (Number.isNaN(Number(categoryForm.sortOrder))) {
        throw new Error('Sort order phải là số')
      }
      const payload = {
        name: categoryForm.name.trim(),
        slug: slug || undefined,
        description: categoryForm.description.trim(),
        sortOrder: Number(categoryForm.sortOrder || 0),
        status: categoryForm.status,
      }

      if (categoryModal?.mode === 'edit') {
        await adminApi.updateAdminCategory(categoryModal.category._id, payload)
        setToast('Đã cập nhật danh mục')
      } else {
        await adminApi.createAdminCategory(shopId, payload)
        setToast('Đã tạo danh mục')
      }

      setCategoryModal(null)
      await loadCatalog()
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setModalError(friendlyCatalogError(getApiErrorMessage(apiError)))
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Tạm ẩn danh mục "${category.name}"?`)) return

    setLoading(true)
    try {
      await adminApi.deleteAdminCategory(category._id)
      setToast('Đã tạm ẩn danh mục')
      await loadCatalog()
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  function buildProductPayload() {
    let attributes = {}
    const attributesText = productForm.attributesText.trim()
    const slug = normalizeSlug(productForm.slug)
    const sku = productForm.sku.trim().toUpperCase()
    const price = Number(productForm.price || 0)
    const salePrice =
      String(productForm.salePrice).trim() === ''
        ? null
        : Number(productForm.salePrice || 0)

    if (!productForm.name.trim()) {
      throw new Error('Vui lòng nhập tên sản phẩm')
    }

    if (!sku) {
      throw new Error('Vui lòng nhập SKU')
    }

    if (productForm.slug.trim() && !slug) {
      throw new Error('Slug chỉ dùng chữ thường, số và dấu gạch ngang')
    }

    if (!productForm.priceMode) {
      throw new Error('Vui lòng chọn priceMode')
    }

    if (productForm.priceMode === 'fixed') {
      if (Number.isNaN(price) || price < 0) {
        throw new Error('Giá phải là số lớn hơn hoặc bằng 0')
      }
      if (salePrice !== null && (Number.isNaN(salePrice) || salePrice < 0)) {
        throw new Error('Giá sale phải là số lớn hơn hoặc bằng 0')
      }
      if (salePrice !== null && salePrice > price) {
        throw new Error('Giá sale không được lớn hơn giá gốc')
      }
    }

    if (!isValidUrl(productForm.thumbnailUrl)) {
      throw new Error('Thumbnail URL không hợp lệ')
    }

    const images = parseImageUrls(productForm.imagesText)
    const thumbnailUrl = productForm.thumbnailUrl.trim() || images[0] || ''

    if (attributesText) {
      try {
        attributes = JSON.parse(attributesText)
      } catch {
        throw new Error('Thông số / thuộc tính JSON không hợp lệ')
      }
    }

    return {
      name: productForm.name.trim(),
      sku,
      slug: slug || undefined,
      priceMode: productForm.priceMode,
      price,
      salePrice,
      status: productForm.status,
      thumbnailUrl,
      images,
      categoryIds: productForm.categoryIds,
      shortDescription: productForm.shortDescription.trim(),
      description: productForm.description.trim(),
      isFeatured: productForm.isFeatured,
      sortOrder: Number(productForm.sortOrder || 0),
      attributes,
    }
  }

  async function saveProduct(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setModalError('')
    try {
      const payload = buildProductPayload()

      if (productModal?.mode === 'edit') {
        await adminApi.updateAdminProduct(productModal.product._id, payload)
        setToast('Đã cập nhật sản phẩm')
      } else {
        await adminApi.createAdminProduct(shopId, payload)
        setToast('Đã tạo sản phẩm')
      }

      setProductModal(null)
      await loadCatalog()
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setModalError(friendlyCatalogError(getApiErrorMessage(apiError)))
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Tạm ẩn sản phẩm "${product.name}"?`)) return

    setLoading(true)
    try {
      await adminApi.deleteAdminProduct(product._id)
      setToast('Đã tạm ẩn sản phẩm')
      await loadCatalog()
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  async function updateProductPin(product, isPinned, pinnedOrderValue = 0) {
    const pinnedOrder = isPinned ? Number(pinnedOrderValue || 0) : 0

    if (isPinned && Number.isNaN(pinnedOrder)) {
      setError('Thứ tự pin phải là số')
      return
    }

    setLoading(true)
    setError('')
    try {
      await adminApi.updateProductPin(product._id, {
        isPinned,
        pinnedOrder,
      })
      setToast(isPinned ? 'Đã pin sản phẩm' : 'Đã bỏ pin sản phẩm')
      setPinModal(null)
      await loadCatalog()
    } catch (apiError) {
      if (handleAuthError(apiError)) return
      setError(getApiErrorMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  function openCategoryCreate() {
    setCategoryForm(EMPTY_CATEGORY)
    setModalError('')
    setCategoryModal({ mode: 'create' })
  }

  function openCategoryEdit(category) {
    setCategoryForm(categoryToForm(category))
    setModalError('')
    setCategoryModal({ mode: 'edit', category })
  }

  function openProductCreate() {
    setProductForm(EMPTY_PRODUCT)
    setModalError('')
    setProductModal({ mode: 'create' })
  }

  function openProductEdit(product) {
    setProductForm(productToForm(product))
    setModalError('')
    setProductModal({ mode: 'edit', product })
  }

  return (
    <AdminLayout title="Quản lý catalog" onRefresh={loadCatalog} loading={loading}>
      <section className="admin-catalog-header">
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => navigate('/admin/shops')}
        >
          <ArrowLeft size={16} />
          Về danh sách shop
        </button>
        <div>
          <p className="admin-eyebrow">Shop</p>
          <h2>{shop?.name || 'Đang tải...'}</h2>
          <span>{shop?.slug || '-'}</span>
        </div>
        <div className="admin-action-row">
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => window.open(publicShopUrl(), '_blank')}
            disabled={!shop}
          >
            <ExternalLink size={16} />
            Mở public shop
          </button>
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={copyShopUrl}
            disabled={!shop}
          >
            <Copy size={16} />
            Copy link shop
          </button>
        </div>
      </section>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-card report-section">
        <div className="admin-tabs">
          <button
            type="button"
            className={activeTab === 'categories' ? 'is-active' : ''}
            onClick={() => setActiveTab('categories')}
          >
            <Tags size={16} />
            Danh mục
          </button>
          <button
            type="button"
            className={activeTab === 'products' ? 'is-active' : ''}
            onClick={() => setActiveTab('products')}
          >
            <PackageCheck size={16} />
            Sản phẩm
          </button>
        </div>

        {activeTab === 'categories' ? (
          <div className="admin-tab-panel">
            <div className="admin-card__title">
              <h3>Danh mục</h3>
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={openCategoryCreate}
              >
                <Plus size={16} />
                Tạo danh mục
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table report-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Slug</th>
                    <th>Sort</th>
                    <th>Trạng thái</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>
                        <strong>{category.name}</strong>
                      </td>
                      <td>{category.slug}</td>
                      <td>{category.sortOrder}</td>
                      <td>
                        <AdminStatusBadge status={category.status} />
                      </td>
                      <td>
                        <div className="admin-action-row">
                          <button
                            type="button"
                            className="admin-icon-button"
                            onClick={() => openCategoryEdit(category)}
                            aria-label="Sửa danh mục"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-button admin-icon-button--danger"
                            onClick={() => deleteCategory(category)}
                            aria-label="Tạm ẩn danh mục"
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
            <AdminPagination
              pagination={categoryPagination}
              onPageChange={updateCategoryPage}
            />
          </div>
        ) : (
          <div className="admin-tab-panel">
            <div className="admin-card__title">
              <h3>Sản phẩm</h3>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => navigate(`/admin/shops/${shopId}/import-products`)}
              >
                <Upload size={16} />
                Import JSON
              </button>
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={openProductCreate}
              >
                <Plus size={16} />
                Tạo sản phẩm
              </button>
            </div>

            <div className="admin-filter-bar admin-filter-bar--catalog">
              <label>
                Tìm kiếm
                <input
                  value={filters.q}
                  onChange={(event) =>
                    updateProductFilter('q', event.target.value)
                  }
                  placeholder="Tên hoặc SKU"
                />
              </label>
              <label>
                Danh mục
                <select
                  value={filters.categoryId}
                  onChange={(event) =>
                    updateProductFilter('categoryId', event.target.value)
                  }
                >
                  <option value="">Tất cả</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Trạng thái
                <select
                  value={filters.status}
                  onChange={(event) =>
                    updateProductFilter('status', event.target.value)
                  }
                >
                  <option value="">Tất cả</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="draft">draft</option>
                </select>
              </label>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table report-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên</th>
                    <th>SKU</th>
                    <th>Giá</th>
                    <th>Mode</th>
                    <th>Danh mục</th>
                    <th>Trạng thái</th>
                    <th>Featured</th>
                    <th>Pin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="admin-product-thumb">
                          {product.thumbnailUrl ? (
                            <img src={product.thumbnailUrl} alt={product.name} />
                          ) : (
                            <PackageCheck size={18} />
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.sku}</td>
                      <td>
                        {product.priceMode === 'fixed'
                          ? formatMoney(product.salePrice ?? product.price)
                          : '-'}
                      </td>
                      <td>{product.priceMode}</td>
                      <td>
                        {(product.categoryIds || [])
                          .map((id) => categoryById.get(String(id))?.name)
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                      <td>
                        <AdminStatusBadge status={product.status} />
                      </td>
                      <td>{product.isFeatured ? 'Có' : '-'}</td>
                      <td>
                        {product.isPinned ? (
                          <span className="admin-badge admin-badge--pinned">
                            Đang pin #{product.pinnedOrder || 0}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="admin-action-row">
                          <button
                            type="button"
                            className="admin-icon-button"
                            onClick={() => openProductEdit(product)}
                            aria-label="Sửa sản phẩm"
                          >
                            <Pencil size={16} />
                          </button>
                          {product.slug && shop ? (
                            <button
                              type="button"
                              className="admin-icon-button"
                              onClick={() =>
                                window.open(
                                  `${window.location.origin}/shop/${shop.slug}/products/${product.slug}`,
                                  '_blank',
                                )
                              }
                              aria-label="Mở sản phẩm"
                            >
                              <ExternalLink size={16} />
                            </button>
                          ) : null}
                          {product.isPinned ? (
                            <button
                              type="button"
                              className="admin-icon-button"
                              onClick={() => setPinModal({ mode: 'unpin', product })}
                              aria-label="Bỏ pin sản phẩm"
                            >
                              <PinOff size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-icon-button"
                              onClick={() => {
                                setPinOrder(product.pinnedOrder || 1)
                                setPinModal({ mode: 'pin', product })
                              }}
                              aria-label="Pin lên đầu"
                            >
                              <Pin size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-icon-button admin-icon-button--danger"
                            onClick={() => deleteProduct(product)}
                            aria-label="Tạm ẩn sản phẩm"
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
            <AdminPagination
              pagination={productPagination}
              onPageChange={updateProductPage}
              onLimitChange={(limit) =>
                setProductPagination((current) => ({
                  ...current,
                  page: 1,
                  limit,
                }))
              }
            />
          </div>
        )}
      </section>

      {categoryModal ? (
        <AdminModal
          title={
            categoryModal.mode === 'edit' ? 'Sửa danh mục' : 'Tạo danh mục'
          }
          onClose={() => setCategoryModal(null)}
          footer={
            <>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => setCategoryModal(null)}
              >
                Hủy
              </button>
              <button
                type="submit"
                form="category-form"
                className="admin-button admin-button--primary"
                disabled={saving}
              >
                Lưu danh mục
              </button>
            </>
          }
        >
          <form
            id="category-form"
            className="admin-form-stack"
            onSubmit={saveCategory}
          >
            <fieldset>
              <legend>Thông tin chính</legend>
              <div className="admin-form-grid admin-form-grid--two">
                <label>
                  Tên danh mục *
                  <input
                    value={categoryForm.name}
                    onChange={(event) =>
                      updateCategoryName(event.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  Slug
                  <input
                    value={categoryForm.slug}
                    onChange={(event) =>
                      updateCategoryField('slug', normalizeSlug(event.target.value))
                    }
                    placeholder="Tự tạo từ tên nếu để trống"
                  />
                </label>
                <label>
                  Sort order
                  <input
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={(event) =>
                      updateCategoryField('sortOrder', event.target.value)
                    }
                  />
                </label>
                <label>
                  Trạng thái
                  <select
                    value={categoryForm.status}
                    onChange={(event) =>
                      updateCategoryField('status', event.target.value)
                    }
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
                <label className="admin-form-grid__full">
                  Mô tả
                  <textarea
                    value={categoryForm.description}
                    onChange={(event) =>
                      updateCategoryField('description', event.target.value)
                    }
                    rows="3"
                  />
                </label>
              </div>
            </fieldset>
            {modalError ? <div className="admin-error">{modalError}</div> : null}
          </form>
        </AdminModal>
      ) : null}

      {productModal ? (
        <AdminModal
          title={productModal.mode === 'edit' ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}
          onClose={() => setProductModal(null)}
          footer={
            <>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => setProductModal(null)}
              >
                Hủy
              </button>
              <button
                type="submit"
                form="product-form"
                className="admin-button admin-button--primary"
                disabled={saving}
              >
                Lưu sản phẩm
              </button>
            </>
          }
        >
          <form
            id="product-form"
            className="admin-form-stack"
            onSubmit={saveProduct}
          >
            <fieldset>
              <legend>Thông tin chính</legend>
              <div className="admin-form-grid admin-form-grid--two">
                <label>
                  Tên sản phẩm *
                  <input
                    value={productForm.name}
                    onChange={(event) =>
                      updateProductName(event.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  SKU *
                  <input
                    value={productForm.sku}
                    onChange={(event) =>
                      updateProductField('sku', event.target.value.trim().toUpperCase())
                    }
                    required
                  />
                </label>
                <label>
                  Slug
                  <input
                    value={productForm.slug}
                    onChange={(event) =>
                      updateProductField('slug', normalizeSlug(event.target.value))
                    }
                    placeholder="Tự tạo từ tên nếu để trống"
                  />
                </label>
                <label>
                  Trạng thái
                  <select
                    value={productForm.status}
                    onChange={(event) =>
                      updateProductField('status', event.target.value)
                    }
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="draft">draft</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Giá và hiển thị</legend>
              <div className="admin-form-grid admin-form-grid--two">
                <label>
                  Price mode
                  <select
                    value={productForm.priceMode}
                    onChange={(event) =>
                      updateProductField('priceMode', event.target.value)
                    }
                  >
                    <option value="fixed">fixed</option>
                    <option value="contact">contact</option>
                    <option value="hidden">hidden</option>
                  </select>
                </label>
                <label>
                  Giá
                  <input
                    type="number"
                    min="0"
                    value={productForm.price}
                    onChange={(event) =>
                      updateProductField('price', event.target.value)
                    }
                  />
                </label>
                <label>
                  Giá sale
                  <input
                    type="number"
                    min="0"
                    value={productForm.salePrice}
                    onChange={(event) =>
                      updateProductField('salePrice', event.target.value)
                    }
                  />
                </label>
                <label>
                  Sort order
                  <input
                    type="number"
                    value={productForm.sortOrder}
                    onChange={(event) =>
                      updateProductField('sortOrder', event.target.value)
                    }
                  />
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(event) =>
                      updateProductField('isFeatured', event.target.checked)
                    }
                  />
                  <span>Sản phẩm nổi bật</span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Danh mục</legend>
              {categories.length === 0 ? (
                <div className="admin-state">
                  Chưa có danh mục. Hãy tạo danh mục trước.
                </div>
              ) : (
                <div className="admin-check-grid">
                  {categories.map((category) => (
                    <label key={category._id}>
                      <input
                        type="checkbox"
                        checked={productForm.categoryIds.includes(category._id)}
                        onChange={() => toggleProductCategory(category._id)}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>Ảnh bằng URL</legend>
              <div className="admin-form-grid admin-form-grid--two">
                <label>
                  Thumbnail URL
                  <input
                    value={productForm.thumbnailUrl}
                    onChange={(event) =>
                      updateProductField('thumbnailUrl', event.target.value)
                    }
                  />
                </label>
                <label className="admin-form-grid__full">
                  Images, mỗi dòng 1 URL
                  <textarea
                    value={productForm.imagesText}
                    onChange={(event) =>
                      updateProductField('imagesText', event.target.value)
                    }
                    rows="4"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Mô tả</legend>
              <div className="admin-form-grid">
                <label>
                  Mô tả ngắn
                  <input
                    value={productForm.shortDescription}
                    onChange={(event) =>
                      updateProductField('shortDescription', event.target.value)
                    }
                  />
                </label>
                <label>
                  Mô tả chi tiết
                  <textarea
                    value={productForm.description}
                    onChange={(event) =>
                      updateProductField('description', event.target.value)
                    }
                    rows="4"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Thông số / thuộc tính JSON</legend>
              <textarea
                className="admin-textarea"
                value={productForm.attributesText}
                onChange={(event) =>
                  updateProductField('attributesText', event.target.value)
                }
                placeholder={'{\n  "dòng xe": "Wave, Dream",\n  "chất liệu": "Thép"\n}'}
                rows="6"
              />
            </fieldset>
            {modalError ? <div className="admin-error">{modalError}</div> : null}
          </form>
        </AdminModal>
      ) : null}

      {pinModal ? (
        <AdminModal
          title={
            pinModal.mode === 'pin'
              ? 'Pin sản phẩm'
              : 'Bỏ pin sản phẩm?'
          }
          onClose={() => setPinModal(null)}
          footer={
            <>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => setPinModal(null)}
              >
                Hủy
              </button>
              {pinModal.mode === 'pin' ? (
                <button
                  type="button"
                  className="admin-button admin-button--primary"
                  onClick={() =>
                    updateProductPin(pinModal.product, true, pinOrder)
                  }
                  disabled={saving || loading}
                >
                  Lưu pin
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-button admin-button--primary"
                  onClick={() => updateProductPin(pinModal.product, false)}
                  disabled={saving || loading}
                >
                  Bỏ pin
                </button>
              )}
            </>
          }
        >
          {pinModal.mode === 'pin' ? (
            <div className="admin-form-grid">
              <p className="admin-help">
                Sản phẩm: <strong>{pinModal.product.name}</strong>
              </p>
              <label>
                Thứ tự pin
                <input
                  type="number"
                  min="0"
                  value={pinOrder}
                  onChange={(event) => setPinOrder(event.target.value)}
                />
              </label>
            </div>
          ) : (
            <p className="admin-help">
              Bỏ pin sản phẩm <strong>{pinModal.product.name}</strong>?
            </p>
          )}
        </AdminModal>
      ) : null}

      {toast ? <div className="admin-toast">{toast}</div> : null}
    </AdminLayout>
  )
}

export default AdminShopCatalogPage
