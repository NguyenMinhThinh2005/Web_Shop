import { useState } from 'react'
import { PackageCheck, Plus, Wrench } from 'lucide-react'
import { formatMoney } from '../../utils/formatMoney'
import {
  getProductPriceLabel,
  getProductUnitPrice,
} from '../../utils/getProductPrice'

function ProductImage({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = product.thumbnailUrl || product.images?.[0]

  if (!image || imageFailed) {
    return (
      <span className="product-placeholder">
        <Wrench size={34} />
        Chưa có ảnh
      </span>
    )
  }

  return (
    <img
      src={image}
      alt={product.name}
      onError={() => setImageFailed(true)}
    />
  )
}

function ProductCard({ product, onAdd, onDetail }) {
  const priceLabel = getProductPriceLabel(product)
  const unitPrice = getProductUnitPrice(product)
  const hasSale =
    product.priceMode === 'fixed' &&
    typeof product.salePrice === 'number' &&
    product.salePrice >= 0 &&
    product.price > product.salePrice

  return (
    <article className="product-card">
      <button
        type="button"
        className="product-card__image"
        onClick={() => onDetail(product)}
      >
        <ProductImage product={product} />
      </button>
      <div className="product-card__body">
        <div>
          <p className="sku">SKU: {product.sku}</p>
          <h3>{product.name}</h3>
          {product.shortDescription ? (
            <p className="product-card__desc">{product.shortDescription}</p>
          ) : null}
        </div>
        {product.tags?.length ? (
          <div className="tag-row">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="product-card__footer">
          <div className="price-block">
            {priceLabel ? (
              <strong>{priceLabel}</strong>
            ) : (
              <>
                <strong>{formatMoney(unitPrice)}</strong>
                {hasSale ? <small>{formatMoney(product.price)}</small> : null}
              </>
            )}
          </div>
          <div className="product-card__actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => onDetail(product)}
            >
              <PackageCheck size={16} />
              Chi tiết
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onAdd(product)}
            >
              <Plus size={16} />
              Thêm
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
