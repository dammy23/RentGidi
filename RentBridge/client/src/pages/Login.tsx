import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"

export function Login() {
  console.log('Login component - rendering')
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Check if user is already authenticated and redirect
  useEffect(() => {
    console.log('Login component - useEffect triggered');
    console.log('Login component - user state:', user);
    console.log('Login component - loading state:', loading);
    console.log('Login component - current pathname:', window.location.pathname);
    
    if (user && !loading) {
      console.log('Login component - user is authenticated, attempting redirect');
      console.log('Login component - user details:', { id: user.id, email: user.email, role: user.role });
      console.log('Login component - about to call navigate to /');
      
      try {
        navigate('/', { replace: true });
        console.log('Login component - navigate call completed successfully');
      } catch (navError) {
        console.error('Login component - navigation error:', navError);
      }
    } else {
      console.log('Login component - not redirecting because:', {
        hasUser: !!user,
        isLoading: loading,
        reason: !user ? 'no user' : loading ? 'still loading' : 'unknown'
      });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Login component - handleSubmit called')
    console.log('Login component - form event:', e)
    console.log('Login component - form submitted')
    e.preventDefault()
    console.log('Login component - preventDefault called')
    setError("")
    setLoading(true)
    console.log('Login component - loading set to true, error cleared')

    try {
      console.log('Login component - attempting login with email:', email)
      console.log('Login component - calling login function from AuthContext')
      
      const loginResult = await login(email, password)
      console.log('Login component - login function returned:', loginResult)
      console.log('Login component - login function completed successfully')

      console.log('Login component - showing success toast')
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      console.log('Login component - about to navigate to home page')
      console.log('Login component - current user state after login:', user)
      
      try {
        navigate('/', { replace: true });
        console.log('Login component - navigation call completed')
      } catch (navError) {
        console.error('Login component - navigation error in handleSubmit:', navError);
      }

    } catch (err) {
      console.error('Login component - login failed:', err)
      console.error('Login component - error type:', typeof err)
      console.error('Login component - error stack:', err.stack)
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      console.log('Login component - error state set to:', errorMessage)
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      console.log('Login component - setting loading to false')
      setLoading(false)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('Login component - button clicked')
    console.log('Login component - button click event:', e)
    console.log('Login component - email value:', email)
    console.log('Login component - password length:', password.length)
    console.log('Login component - loading state:', loading)
  }

  console.log('Login component - current state:', { email, loading, error })
  console.log('Login component - current user from context:', user)
  console.log('Login component - current location:', window.location.href)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign in to your RentBridge account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  console.log('Login component - email changed to:', e.target.value)
                  setEmail(e.target.value)
                }}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  console.log('Login component - password changed (length):', e.target.value.length)
                  setPassword(e.target.value)
                }}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={loading}
              onClick={handleButtonClick}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}