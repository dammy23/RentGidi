import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '@/api/auth'
import api from '@/api/api'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  verificationStatus?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  console.log('AuthProvider - rendering with user:', user)
  console.log('AuthProvider - loading state:', loading)

  useEffect(() => {
    console.log('AuthProvider - useEffect triggered to check existing auth')
    
    const checkExistingAuth = async () => {
      console.log('AuthProvider - checking existing authentication')
      
      const accessToken = localStorage.getItem('accessToken')
      console.log('AuthProvider - accessToken from localStorage:', accessToken ? 'exists' : 'not found')
      console.log('AuthProvider - accessToken length:', accessToken?.length)
      
      if (accessToken) {
        console.log('AuthProvider - found access token, attempting to fetch user profile from API')
        
        try {
          // Instead of decoding token, fetch current user profile from API
          const response = await api.get('/api/auth/me')
          console.log('AuthProvider - API response for current user:', response.data)
          
          if (response.data && response.data.success && response.data.data.user) {
            const userData = response.data.data.user
            console.log('AuthProvider - extracted user data from API:', userData)
            setUser(userData)
            console.log('AuthProvider - user state set from API')
          } else {
            console.log('AuthProvider - invalid API response, removing tokens')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
          }
        } catch (error) {
          console.error('AuthProvider - error fetching user profile:', error)
          console.log('AuthProvider - removing invalid tokens from localStorage')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      } else {
        console.log('AuthProvider - no access token found')
      }
      
      console.log('AuthProvider - setting loading to false')
      setLoading(false)
    }

    checkExistingAuth()
  }, [])

  const login = async (email: string, password: string) => {
    console.log('AuthContext - login function called with email:', email)
    
    try {
      console.log('AuthContext - calling API login')
      const response = await apiLogin(email, password)
      console.log('AuthContext - API login response:', response)
      console.log('AuthContext - API login response data:', response.data)
      
      if (response.data && response.data.success) {
        console.log('AuthContext - login successful, extracting tokens and user data')
        
        const { accessToken, refreshToken, user: userData } = response.data.data
        console.log('AuthContext - extracted tokens and user data:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          userData
        })
        
        // Store tokens
        console.log('AuthContext - storing tokens in localStorage')
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        
        // Set user state
        console.log('AuthContext - setting user state:', userData)
        setUser(userData)
        console.log('AuthContext - user state set successfully')
        
        return response.data
      } else {
        console.error('AuthContext - login response indicates failure:', response.data)
        throw new Error(response.data?.message || 'Login failed')
      }
    } catch (error) {
      console.error('AuthContext - login error:', error)
      console.error('AuthContext - login error type:', typeof error)
      console.error('AuthContext - login error message:', error.message)
      console.error('AuthContext - login error stack:', error.stack)
      throw error
    }
  }

  const register = async (userData: any) => {
    console.log('AuthContext - register function called with userData:', userData)
    
    try {
      console.log('AuthContext - calling API register')
      const response = await apiRegister(userData)
      console.log('AuthContext - API register response:', response)
      
      if (response.data && response.data.success) {
        console.log('AuthContext - registration successful')
        
        const { accessToken, user: registeredUser } = response.data.data
        console.log('AuthContext - extracted access token and user data:', {
          hasAccessToken: !!accessToken,
          registeredUser
        })
        
        // Store only access token for registration
        console.log('AuthContext - storing access token in localStorage')
        localStorage.setItem('accessToken', accessToken)
        
        // Set user state
        console.log('AuthContext - setting user state after registration:', registeredUser)
        setUser(registeredUser)
        console.log('AuthContext - user state set successfully after registration')
        
        return response.data
      } else {
        console.error('AuthContext - registration response indicates failure:', response.data)
        throw new Error(response.data?.message || 'Registration failed')
      }
    } catch (error) {
      console.error('AuthContext - registration error:', error)
      throw error
    }
  }

  const logout = () => {
    console.log('AuthContext - logout function called')
    
    try {
      console.log('AuthContext - calling API logout')
      apiLogout()
    } catch (error) {
      console.error('AuthContext - API logout error:', error)
    }
    
    console.log('AuthContext - clearing localStorage tokens')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    console.log('AuthContext - setting user state to null')
    setUser(null)
    console.log('AuthContext - logout completed')
  }

  const contextValue = {
    user,
    loading,
    login,
    register,
    logout
  }

  console.log('AuthProvider - providing context value:', {
    hasUser: !!user,
    loading,
    userEmail: user?.email,
    userRole: user?.role
  })

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}