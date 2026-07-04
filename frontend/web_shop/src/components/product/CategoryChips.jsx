function CategoryChips({ categories, selectedCategoryId, onSelect }) {
  return (
    <div className="category-chips" aria-label="Danh mục sản phẩm">
      <button
        type="button"
        className={!selectedCategoryId ? 'chip active' : 'chip'}
        onClick={() => onSelect('')}
      >
        Tất cả
      </button>
      {categories.map((category) => (
        <button
          type="button"
          key={category._id}
          className={selectedCategoryId === category._id ? 'chip active' : 'chip'}
          onClick={() => onSelect(category._id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

export default CategoryChips
