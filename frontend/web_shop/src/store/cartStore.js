import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getProductUnitPrice } from '../utils/getProductPrice'

const CartContext = createContext(null)

function getCartKey(shopSlug) {
  return `cart:${shopSlug || 'default'}`
}

function toCartItem(product, quantity) {
  const unitPrice = getProductUnitPrice(product)

  return {
    productId: product._id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    image: product.thumbnailUrl || product.images?.[0] || '',
    priceMode: product.priceMode,
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
  }
}

function normalizeItem(item) {
  const quantity = Math.max(1, Number(item.quantity || 1))

  return {
    ...item,
    quantity,
    lineTotal: Number(item.unitPrice || 0) * quantity,
  }
}

export function CartProvider({ shopSlug, children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(getCartKey(shopSlug)))
      return Array.isArray(stored) ? stored.map(normalizeItem) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (shopSlug) {
      localStorage.setItem(getCartKey(shopSlug), JSON.stringify(items))
    }
  }, [items, shopSlug])

  const addProduct = useCallback((product, quantity = 1) => {
    const safeQuantity = Math.max(1, Number(quantity || 1))

    setItems((current) => {
      const existing = current.find((item) => item.productId === product._id)

      if (existing) {
        return current.map((item) =>
          item.productId === product._id
            ? normalizeItem({
                ...item,
                quantity: item.quantity + safeQuantity,
              })
            : item,
        )
      }

      return [...current, toCartItem(product, safeQuantity)]
    })
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity || 1))

    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? normalizeItem({ ...item, quantity: safeQuantity })
          : item,
      ),
    )
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      items,
      subtotal,
      itemCount,
      addProduct,
      updateQuantity,
      removeItem,
      clearCart,
    }
  }, [addProduct, clearCart, items, removeItem, updateQuantity])

  return createElement(CartContext.Provider, { value }, children)
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
