const fallbackMessage = 'Có lỗi xảy ra, vui lòng thử lại.'

export function getApiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallbackMessage
  )
}
