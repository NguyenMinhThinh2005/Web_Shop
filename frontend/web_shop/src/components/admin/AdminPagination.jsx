function AdminPagination({ pagination, onPageChange, onLimitChange }) {
  const page = pagination?.page || 1
  const limit = pagination?.limit || 20
  const total = pagination?.total || 0
  const totalPages = Math.max(pagination?.totalPages || 1, 1)

  return (
    <div className="admin-pagination">
      <span>Tổng: {total}</span>
      <div className="admin-pagination__controls">
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Trước
        </button>
        <strong>
          Page {page} / {totalPages}
        </strong>
        <button
          type="button"
          className="admin-button admin-button--ghost"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Sau
        </button>
        {onLimitChange ? (
          <label>
            Limit
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
            >
              {[10, 20, 50].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  )
}

export default AdminPagination
