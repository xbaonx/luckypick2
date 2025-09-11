import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.message || 'An error occurred'
    
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    } else {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api
