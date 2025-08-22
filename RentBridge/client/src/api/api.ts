import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request interceptor - making request to:', config.url)
    console.log('API Request interceptor - request method:', config.method)
    console.log('API Request interceptor - request data:', config.data)

    const token = localStorage.getItem('accessToken')
    if (token) {
      console.log('API Request interceptor - adding token to request')
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.log('API Request interceptor - no token found in localStorage')
    }
    return config
  },
  (error) => {
    console.error('API Request interceptor - request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response interceptor - successful response from:', response.config.url)
    console.log('API Response interceptor - response status:', response.status)
    console.log('API Response interceptor - response data:', response.data)
    return response
  },
  async (error) => {
    console.error('API Response interceptor - error response:', error)
    console.error('API Response interceptor - error status:', error.response?.status)
    console.error('API Response interceptor - error data:', error.response?.data)

    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('API Response interceptor - attempting token refresh')
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          console.log('API Response interceptor - no refresh token found, redirecting to login')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        console.log('API Response interceptor - making refresh token request')
        console.log('API Response interceptor - refresh token being sent:', refreshToken ? 'TOKEN_EXISTS' : 'TOKEN_MISSING')
        console.log('API Response interceptor - refresh token length:', refreshToken ? refreshToken.length : 'N/A')

        const response = await axios.post('/api/auth/refresh', {
          refreshToken
        })
        console.log('API Response interceptor - refresh token response:', response.data)
        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        localStorage.setItem('accessToken', accessToken)
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }

        console.log('API Response interceptor - tokens refreshed, retrying original request')
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('API Response interceptor - refresh token failed:', refreshError)
        console.error('API Response interceptor - refresh error response:', refreshError?.response?.data)
        
        // Check if the refresh token has invalid signature or is otherwise invalid
        if (refreshError?.response?.status === 401 || 
            refreshError?.response?.data?.error?.includes('invalid signature') ||
            refreshError?.response?.data?.error?.includes('JsonWebTokenError') ||
            refreshError?.response?.data?.error?.includes('jwt malformed') ||
            refreshError?.response?.data?.error?.includes('invalid token')) {
          console.log('API Response interceptor - refresh token is invalid, clearing all tokens and redirecting to login')
        }
        
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api