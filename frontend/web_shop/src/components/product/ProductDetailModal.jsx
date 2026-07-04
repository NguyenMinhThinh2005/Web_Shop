import { useState } from 'react'
import { MessageCircle, ShoppingCart, Wrench, X } from 'lucide-react'
import QuantityStepper from '../cart/QuantityStepper'
import { formatMoney } from '../../utils/formatMoney'
import {
  getProductPriceLabel,
  getProductUnitPrice,
} from '../../utils/getProductPrice'

function hasContact(shop) {
  return Boolean(
    shop?.contact?.messengerUrl ||
      shop?.contact?.zaloUrl ||
      shop?.contact?.hotline,
  )
}

function ProductDetailModal({ product, shop, onClose, onAdd, onContactOpen }) {
  const [quantity, setQuantity] = useState(1)
  const [imageFailed, setImageFailed] = useState(false)

  if (!product) {
    return null
  }

  const image = product.thumbnailUrl || product.images?.[0]
  const priceLabel = getProductPriceLabel(product)
  const unitPrice = getProductUnitPrice(product)
  const attributes = product.attributes || {}

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Đóng chi tiết sản phẩm"
        onClick={onClose}
      />
      <article className="product-modal">
        <button type="button" className="modal-close" onClick={onClose}>
          <X size={19} />
        </button>
        <div className="product-modal__media">
          {image && !imageFailed ? (
            <img
              src={image}
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
        <div className="product-modal__content">
          <p className="sku">SKU: {product.sku}</p>
          <h2>{product.name}</h2>
          <div className="price-block price-block--large">
            {priceLabel ? (
              <strong>{priceLabel}</strong>
            ) : (
              <strong>{formatMoney(unitPrice)}</strong>
            )}
          </div>
          {product.description || product.shortDescription ? (
            <p className="modal-description">
              {product.description || product.shortDescription}
            </p>
          ) : null}

          {Object.keys(attributes).length ? (
            <div className="spec-table">
              {Object.entries(attributes).map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className="modal-actions">
            <QuantityStepper value={quantity} onChange={setQuantity} />
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
