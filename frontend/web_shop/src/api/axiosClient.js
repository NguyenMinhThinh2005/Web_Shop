import axios from 'axios'
import { getApiErrorMessage } from './apiError'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(new Error(getApiErrorMessage(error))),
)

export default axiosClient
