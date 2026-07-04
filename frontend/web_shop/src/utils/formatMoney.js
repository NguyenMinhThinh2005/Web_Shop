export function formatMoney(value) {
  const amount = Number(value || 0)

  return `${amount.toLocaleString('vi-VN')}đ`
}
