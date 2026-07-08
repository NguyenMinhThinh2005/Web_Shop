export const invalidPhoneMessage =
  'Số điện thoại chưa hợp lệ. Vui lòng nhập số Việt Nam, ví dụ 0912345678.'

export function normalizePhone(value) {
  return String(value || '').trim().replace(/\D/g, '')
}

export function isValidVietnamPhone(value) {
  const trimmed = String(value || '').trim()
  const digits = normalizePhone(trimmed)

  if (!trimmed || digits.length < 10 || digits.length > 11) {
    return false
  }

  if (/^(\d)\1+$/.test(digits)) {
    return false
  }

  if (digits.startsWith('0')) {
    return digits.length === 10
  }

  if (digits.startsWith('84')) {
    return digits.length === 11
  }

  return false
}
