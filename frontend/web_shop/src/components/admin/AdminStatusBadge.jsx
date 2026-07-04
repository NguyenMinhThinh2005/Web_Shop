function AdminStatusBadge({ status }) {
  const value = status || 'active'

  return (
    <span className={`admin-status admin-status--${value}`}>
      {value}
    </span>
  )
}

export default AdminStatusBadge
