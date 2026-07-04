export function getProductUnitPrice(product) {
  if (!product || product.priceMode !== 'fixed') {
    return 0
  }

  if (typeof product.salePrice === 'number' && product.salePrice >= 0) {
    return product.salePrice
  }

  return product.price || 0
}

export function getProductPriceLabel(product) {
  if (!product) {
    return ''
  }

  if (product.priceMode === 'hidden') {
    return 'Liên hệ'
  }

  if (product.priceMode === 'contact') {
    return 'Tư vấn báo giá'
  }

  return null
}
