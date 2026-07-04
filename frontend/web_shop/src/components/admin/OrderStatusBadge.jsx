const STATUS_LABELS = {
  new: 'Mới',
  confirmed: 'Đã xác nhận',
  shipping_created: 'Đã tạo vận đơn',
  handoff_sent: 'Đã gửi xử lý',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  commission_pending: 'Chờ hoa hồng',
  commission_paid: 'Đã trả hoa hồng',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  returned: 'Hoàn trả',
}

function OrderStatusBadge({ status }) {
  const value = status || 'new'

  return (
    <span className={`admin-badge admin-badge--${value}`}>
      {STATUS_LABELS[value] || value}
    </span>
  )
}

export default OrderStatusBadge
