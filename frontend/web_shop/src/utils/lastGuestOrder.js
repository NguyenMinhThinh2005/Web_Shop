const LAST_GUEST_ORDER_KEY = 'lastGuestOrder'
const LAST_SHOP_SLUG_KEY = 'lastShopSlug'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function saveLastShopSlug(shopSlug) {
  if (shopSlug) {
    localStorage.setItem(LAST_SHOP_SLUG_KEY, shopSlug)
  }
}

export function getLastShopSlug() {
  return localStorage.getItem(LAST_SHOP_SLUG_KEY) || 'chu-tam-tan-xe-demo'
}

export function saveLastGuestOrder(order) {
  if (!order?.orderCode || !order?.phone || !order?.shopSlug) return

  localStorage.setItem(
    LAST_GUEST_ORDER_KEY,
    JSON.stringify({
      orderCode: order.orderCode,
      phone: order.phone,
      shopSlug: order.shopSlug,
      createdAt: order.createdAt || new Date().toISOString(),
    }),
  )
  saveLastShopSlug(order.shopSlug)
}

export function getLastGuestOrder() {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_GUEST_ORDER_KEY))

    if (!value?.orderCode || !value?.phone) {
      return null
    }

    const createdAt = new Date(value.createdAt || 0)

    if (
      Number.isNaN(createdAt.getTime()) ||
      Date.now() - createdAt.getTime() > MAX_AGE_MS
    ) {
      clearLastGuestOrder()
      return null
    }

    return value
  } catch {
    clearLastGuestOrder()
    return null
  }
}

export function clearLastGuestOrder() {
  localStorage.removeItem(LAST_GUEST_ORDER_KEY)
}

export async function claimLastGuestOrder(customerApi) {
  const lastGuestOrder = getLastGuestOrder()

  if (!lastGuestOrder) {
    return { claimed: false, message: '' }
  }

  try {
    await customerApi.claimCustomerOrder({
      orderCode: lastGuestOrder.orderCode,
      phone: lastGuestOrder.phone,
    })
    clearLastGuestOrder()

    return {
      claimed: true,
      message: 'Đơn vừa đặt đã được lưu vào tài khoản.',
    }
  } catch {
    return {
      claimed: false,
      message:
        'Tài khoản đã tạo nhưng số điện thoại không khớp với đơn vừa đặt, nên đơn chưa được lưu vào tài khoản.',
    }
  }
}
