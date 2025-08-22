import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export function VerificationError() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const type = searchParams.get('type')
  const message = searchParams.get('message') || 'Verification failed'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">
            Verification Failed
          </CardTitle>
          <CardDescription>
            {type === 'email' 
              ? 'There was an issue verifying your email address.'
              : 'Verification could not be completed.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{decodeURIComponent(message)}</p>
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/kyc-verification')} 
              className="w-full"
            >
              Try Again
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