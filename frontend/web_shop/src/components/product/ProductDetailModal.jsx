import { useMemo, useState } from 'react'
import { MessageCircle, ShoppingCart, Wrench, X } from 'lucide-react'
import QuantityStepper from '../cart/QuantityStepper'
import { formatMoney } from '../../utils/formatMoney'
import {
  getProductPriceLabel,
  getProductUnitPrice,
} from '../../utils/getProductPrice'

const publicAttributeLabels = {
  vehicleLine: 'Dòng xe',
  brand: 'Thương hiệu',
  color: 'Màu',
  size: 'Kích thước',
  material: 'Chất liệu',
  chainSize: 'Cỡ sên',
  sprocket: 'Thông số nhông/dĩa',
}

const hiddenAttributeKeys = new Set([
  'originalSku',
  'sourceSystem',
  'sourceProductId',
  'sourceCategory',
  'hasBasicInfo',
  'hasMediaInfo',
  'hasPriceInfo',
  'imageCount',
  'mergeNotes',
  'importKey',
  'sourceFiles',
  'raw',
])

function hasContact(shop) {
  return Boolean(
    shop?.contact?.messengerUrl ||
      shop?.contact?.zaloUrl ||
      shop?.contact?.hotline,
  )
}

function getProductImages(product) {
  const seen = new Set()
  return [product.thumbnailUrl, ...(product.images || [])]
    .filter(Boolean)
    .filter((url) => {
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })
}

function getPublicAttributes(attributes = {}) {
  return Object.entries(attributes)
    .filter(([key, value]) => {
      if (hiddenAttributeKeys.has(key)) return false
      if (value === undefined || value === null || value === '') return false
      return Boolean(publicAttributeLabels[key])
    })
    .map(([key, value]) => [publicAttributeLabels[key], value])
}

function ProductDetailModal({ product, shop, onClose, onAdd, onContactOpen }) {
  const [quantity, setQuantity] = useState(1)
  const [imageFailed, setImageFailed] = useState(false)
  const images = useMemo(() => (product ? getProductImages(product) : []), [product])
  const [selectedImage, setSelectedImage] = useState('')

  if (!product) {
    return null
  }

  const activeImage = selectedImage || images[0] || ''
  const priceLabel = getProductPriceLabel(product)
  const unitPrice = getProductUnitPrice(product)
  const publicAttributes = getPublicAttributes(product.attributes || {})

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Đóng chi tiết sản phẩm"
        onClick={onClose}
      />
      <article className="product-modal product-detail-layout">
        <button type="button" className="modal-close" onClick={onClose}>
          <X size={19} />
        </button>
        <div className="product-modal__gallery product-detail-media-section">
          <div className="product-modal__media product-detail-main-image-frame">
            {activeImage && !imageFailed ? (
              <img
                src={activeImage}
                alt={product.name}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="product-placeholder">
                <Wrench size={42} />
                Chưa có ảnh
              </span>
            )}
          </div>
          {images.length > 1 ? (
            <div className="product-modal__thumbs product-detail-gallery">
              {images.map((image) => (
                <button
                  type="button"
                  key={image}
                  className={image === activeImage ? 'is-active' : ''}
                  onClick={() => {
                    setSelectedImage(image)
                    setImageFailed(false)
                  }}
                >
                  <img src={image} alt={product.name} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="product-modal__content product-detail-content-section">
          <p className="sku product-detail-sku">SKU: {product.sku}</p>
          <h2 className="product-detail-title">{product.name}</h2>
          <div className="price-block price-block--large product-detail-price">
            {priceLabel ? (
              <strong>{priceLabel}</strong>
            ) : (
              <strong>{formatMoney(unitPrice)}</strong>
            )}
          </div>
          {product.description || product.shortDescription ? (
            <p className="modal-description product-detail-description">
              {product.description || product.shortDescription}
            </p>
          ) : null}

          {publicAttributes.length ? (
            <div className="spec-table product-detail-public-attributes">
              {publicAttributes.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className="product-detail-action-group">
            <div className="product-quantity-control">
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                onAdd(product, quantity)
                onClose()
              }}
            >
              <ShoppingCart size={18} />
              Thêm vào giỏ
            </button>
            {hasContact(shop) ? (
              <button
                type="button"
                className="button button--secondary"
                onClick={onContactOpen}
              >
                <MessageCircle size={18} />
                Liên hệ tư vấn
              </button>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}

export default ProductDetailModal
