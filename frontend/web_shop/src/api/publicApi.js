import axiosClient from './axiosClient'

export const publicApi = {
  getShop(slug) {
    return axiosClient.get(`/public/shops/${slug}`)
  },

  getCategories(slug) {
    return axiosClient.get(`/public/shops/${slug}/categories`)
  },

  getProducts(slug, params = {}) {
    return axiosClient.get(`/public/shops/${slug}/products`, { params })
  },

  getProductDetail(slug, productSlug) {
    return axiosClient.get(`/public/shops/${slug}/products/${productSlug}`)
  },

  createOrder(payload) {
    return axiosClient.post('/public/orders', payload)
  },
}
