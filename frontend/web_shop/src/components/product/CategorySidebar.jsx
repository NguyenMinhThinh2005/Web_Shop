function CategorySidebar({ categories, selectedCategoryId, onSelect }) {
  return (
    <aside className="category-sidebar">
      <p className="eyebrow">Danh mục</p>
      <button
        type="button"
        className={!selectedCategoryId ? 'category-link active' : 'category-link'}
        onClick={() => onSelect('')}
      >
        Tất cả
      </button>
      {categories.map((category) => (
        <button
          type="button"
          key={category._id}
          className={
            selectedCategoryId === category._id
              ? 'category-link active'
              : 'category-link'
          }
          onClick={() => onSelect(category._id)}
        >
          {category.name}
        </button>
      ))}
    </aside>
  )
}

export default CategorySidebar
