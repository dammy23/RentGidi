import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Shield } from 'lucide-react'

export function VerificationSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  const type = searchParams.get('type')
  const kycCompleted = searchParams.get('kyc') === 'true'

  useEffect(() => {
    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1)
      } else {
        navigate(kycCompleted ? '/dashboard' : '/kyc-verification')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, navigate, kycCompleted])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              {kycCompleted ? (
                <Shield className="h-8 w-8 text-green-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">
            {type === 'email' ? 'Email Verified!' : 'Verification Successful!'}
          </CardTitle>
          <CardDescription>
            {kycCompleted 
              ? 'Your KYC verification is now complete. You have full access to all platform features.'
              : 'Your email has been successfully verified. Please complete your phone verification to finish KYC.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Redirecting in {countdown} seconds...
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate(kycCompleted ? '/dashboard' : '/kyc-verification')} 
              className="w-full"
            >
              {kycCompleted ? 'Go to Dashboard' : 'Continue KYC Verification'}
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline" 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}