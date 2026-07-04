import ProductCard from './ProductCard'

function ProductGrid({ products, loading, hasSearch, onAdd, onDetail }) {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="empty-state product-empty">
        <h3>
          {hasSearch
            ? 'Không tìm thấy sản phẩm phù hợp.'
            : 'Shop chưa có sản phẩm.'}
        </h3>
        <p>
          {hasSearch
            ? 'Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.'
            : 'Bạn có thể quay lại sau khi shop cập nhật catalog.'}
        </p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onAdd={onAdd}
          onDetail={onDetail}
        />
      ))}
    </div>
  )
}

export default ProductGrid
