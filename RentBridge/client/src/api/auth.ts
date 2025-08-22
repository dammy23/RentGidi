import api from './api'

// Description: Login user
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { success: boolean, data: { accessToken: string, refreshToken: string, user: object } }
export const login = async (email: string, password: string) => {
  console.log('AuthAPI - login function called with email:', email)
  console.log('AuthAPI - about to make API request to /api/auth/login')
  
  try {
    const requestData = { email, password }
    console.log('AuthAPI - request data:', { email, passwordLength: password.length })
    
    const response = await api.post('/api/auth/login', requestData)
    console.log('AuthAPI - received response from login API')
    console.log('AuthAPI - response status:', response.status)
    console.log('AuthAPI - response data:', response.data)
    console.log('AuthAPI - response data type:', typeof response.data)
    
    if (response.data) {
      console.log('AuthAPI - response data keys:', Object.keys(response.data))
      if (response.data.data) {
        console.log('AuthAPI - response.data.data keys:', Object.keys(response.data.data))
        console.log('AuthAPI - has accessToken:', !!response.data.data.accessToken)
        console.log('AuthAPI - has refreshToken:', !!response.data.data.refreshToken)
        console.log('AuthAPI - has user:', !!response.data.data.user)
        if (response.data.data.user) {
          console.log('AuthAPI - user data:', response.data.data.user)
        }
      }
    }
    
    return response
  } catch (error) {
    console.error('AuthAPI - login error:', error)
    console.error('AuthAPI - error response:', error?.response)
    console.error('AuthAPI - error response data:', error?.response?.data)
    console.error('AuthAPI - error response status:', error?.response?.status)
    throw new Error(error?.response?.data?.message || error.message)
  }
}

// Description: Register user
// Endpoint: POST /api/auth/register
// Request: { name: string, email: string, password: string, role: string }
// Response: { success: boolean, data: { accessToken: string, user: object } }
export const register = async (userData: { name: string; email: string; password: string; role: string }) => {
  console.log('AuthAPI - register function called')
  
  try {
    console.log('AuthAPI - making register API request')
    const response = await api.post('/api/auth/register', userData)
    console.log('AuthAPI - register response:', response.data)
    return response
  } catch (error) {
    console.error('AuthAPI - register error:', error)
    throw new Error(error?.response?.data?.message || error.message)
  }
}

// Description: Logout user
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean, message: string }
export const logout = async () => {
  console.log('AuthAPI - logout function called')
  
  try {
    console.log('AuthAPI - making logout API request')
    const response = await api.post('/api/auth/logout')
    console.log('AuthAPI - logout response:', response.data)
    return response
  } catch (error) {
    console.error('AuthAPI - logout error:', error)
    // Don't throw error for logout as it should always succeed locally
    return { data: { success: true, message: 'Logged out locally' } }
  }
}