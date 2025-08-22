import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import {
  sendSMSVerificationCode,
  verifySMSCode,
  sendEmailVerificationLink,
  getVerificationStatus,
  verifyBVN,
  verifyBankAccount,
  getBanksList
} from '@/api/verification'
import { updateProfile } from '@/api/profile'
import { CheckCircle, Clock, AlertCircle, Phone, Mail, Building2, CreditCard } from 'lucide-react'
import { Stepper, Step, StepLabel, StepContent, Box, Chip, Typography, LinearProgress } from '@mui/material'

interface VerificationStatus {
  isPhoneVerified: boolean
  isEmailVerified: boolean
  kycCompleted: boolean
  hasPhone: boolean
  hasEmail: boolean
  role: string
  // Landlord-specific fields
  isBvnVerified?: boolean
  isAccountVerified?: boolean
  hasBvn?: boolean
  hasAccount?: boolean
  bvnData?: {
    firstName: string
    lastName: string
    phoneNumber: string
  }
  accountData?: {
    accountName: string
    bankCode: string
  }
}

interface Bank {
  id: number
  name: string
  code: string
  slug: string
  currency: string
  type: string
}

export function KYCVerification() {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [bvn, setBvn] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [banks, setBanks] = useState<Bank[]>([])
  const [smsLoading, setSmsLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [bvnLoading, setBvnLoading] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [bvnVerificationResult, setBvnVerificationResult] = useState<any>(null)
  const [accountVerificationResult, setAccountVerificationResult] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchVerificationStatus()
    if (user?.role === 'landlord') {
      fetchBanksList()
    }
  }, [user])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true)
      console.log('KYCVerification: Fetching verification status')
      const response = await getVerificationStatus()
      console.log('KYCVerification: Verification status response:', response)

      if (response.data && response.data.success) {
        const status = response.data.data
        setVerificationStatus(status)

        // Set phone number from user if available
        if (user?.phone) {
          setPhoneNumber(user.phone)
        }

        // Set verification results if available
        if (status.bvnData) {
          setBvnVerificationResult(status.bvnData)
        }
        if (status.accountData) {
          setAccountVerificationResult(status.accountData)
        }

        // Determine active step based on verification status and role
        if (!status.hasPhone) {
          setActiveStep(0) // Phone number input
        } else if (!status.isPhoneVerified) {
          setActiveStep(1) // Phone verification
        } else if (!status.isEmailVerified) {
          setActiveStep(2) // Email verification
        } else if (status.role === 'landlord' && !status.isBvnVerified) {
          setActiveStep(3) // BVN verification (landlords only)
        } else if (status.role === 'landlord' && !status.isAccountVerified) {
          setActiveStep(4) // Account verification (landlords only)
        } else {
          setActiveStep(status.role === 'landlord' ? 5 : 3) // Complete
        }
      }
    } catch (error) {
      console.error('KYCVerification: Error fetching verification status:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load verification status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBanksList = async () => {
    try {
      console.log('KYCVerification: Fetching banks list')
      const response = await getBanksList()
      console.log('KYCVerification: Banks list response:', response)

      if (response.data && response.data.success) {
        setBanks(response.data.data)
      }
    } catch (error) {
      console.error('KYCVerification: Error fetching banks list:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load banks list",
        variant: "destructive",
      })
    }
  }

  const handlePhoneNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      console.log('KYCVerification: Updating phone number:', phoneNumber)

      // Update user profile with phone number
      await updateProfile({ phone: phoneNumber })

      toast({
        title: "Success",
        description: "Phone number updated successfully",
      })

      setActiveStep(1)
      await fetchVerificationStatus()
    } catch (error) {
      console.error('KYCVerification: Error updating phone number:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update phone number",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendSMSCode = async () => {
    try {
      setSmsLoading(true)
      console.log('KYCVerification: Sending SMS verification code')

      const response = await sendSMSVerificationCode()
      console.log('KYCVerification: SMS code sent response:', response)

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        })
        setCountdown(60) // 60 second countdown
      }
    } catch (error) {
      console.error('KYCVerification: Error sending SMS code:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS code",
        variant: "destructive",
      })
    } finally {
      setSmsLoading(false)
    }
  }

  const handleVerifySMSCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!smsCode.trim() || smsCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      })
      return
    }

    try {
      setVerifyingCode(true)
      console.log('KYCVerification: Verifying SMS code')

      const response = await verifySMSCode(smsCode)
      console.log('KYCVerification: SMS verification response:', response)

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        })

        setSmsCode('')
        setActiveStep(2)
        await fetchVerificationStatus()
      }
    } catch (error) {
      console.error('KYCVerification: Error verifying SMS code:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to verify SMS code",
        variant: "destructive",
      })
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleSendEmailVerification = async () => {
    try {
      setEmailLoading(true)
      console.log('KYCVerification: Sending email verification link')

      const response = await sendEmailVerificationLink()
      console.log('KYCVerification: Email verification sent response:', response)

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        })
      }
    } catch (error) {
      console.error('KYCVerification: Error sending email verification:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const handleVerifyBVN = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bvn.trim() || bvn.length !== 11 || !/^\d{11}$/.test(bvn)) {
      toast({
        title: "Error",
        description: "Please enter a valid 11-digit BVN",
        variant: "destructive",
      })
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first name and last name",
        variant: "destructive",
      })
      return
    }

    try {
      setBvnLoading(true)
      console.log('KYCVerification: Verifying BVN')

      const response = await verifyBVN(bvn, firstName, lastName, dateOfBirth)
      console.log('KYCVerification: BVN verification response:', response)

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        })

        setBvnVerificationResult(response.data.data.verificationData)

        if (response.data.data.kycCompleted) {
          setActiveStep(5)
        } else {
          setActiveStep(4)
        }

        await fetchVerificationStatus()
      }
    } catch (error) {
      console.error('KYCVerification: Error verifying BVN:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to verify BVN",
        variant: "destructive",
      })
    } finally {
      setBvnLoading(false)
    }
  }

  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accountNumber.trim() || accountNumber.length !== 10 || !/^\d{10}$/.test(accountNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit account number",
        variant: "destructive",
      })
      return
    }

    if (!selectedBank) {
      toast({
        title: "Error",
        description: "Please select a bank",
        variant: "destructive",
      })
      return
    }

    try {
      setAccountLoading(true)
      console.log('KYCVerification: Verifying bank account')

      const response = await verifyBankAccount(accountNumber, selectedBank)
      console.log('KYCVerification: Account verification response:', response)

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        })

        setAccountVerificationResult(response.data.data.verificationData)

        if (response.data.data.kycCompleted) {
          setActiveStep(5)
        }

        await fetchVerificationStatus()
      }
    } catch (error) {
      console.error('KYCVerification: Error verifying account:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to verify bank account",
        variant: "destructive",
      })
    } finally {
      setAccountLoading(false)
    }
  }

  const getVerificationBadge = (isVerified: boolean, label: string) => {
    if (isVerified) {
      return <Chip icon={<CheckCircle />} label={`${label} Verified`} color="success" size="small" />;
    }
    return <Chip icon={<Clock />} label={`${label} Pending`} color="warning" size="small" />;
  };

  const getTotalSteps = () => {
    return user?.role === 'landlord' ? 5 : 3
  }

  const getProgressValue = () => {
    return (activeStep / getTotalSteps()) * 100
  }

  if (loading && !verificationStatus) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading verification status...</p>
          </div>
        </div>
      </div>
    )
  }

  if (verificationStatus?.kycCompleted) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">KYC Verification Complete!</CardTitle>
            <CardDescription>
              Your identity has been successfully verified. You now have full access to all platform features.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center space-x-4 flex-wrap gap-2">
              {getVerificationBadge(verificationStatus.isPhoneVerified, 'Phone')}
              {getVerificationBadge(verificationStatus.isEmailVerified, 'Email')}
              {user?.role === 'landlord' && verificationStatus.isBvnVerified &&
                getVerificationBadge(verificationStatus.isBvnVerified, 'BVN')}
              {user?.role === 'landlord' && verificationStatus.isAccountVerified &&
                getVerificationBadge(verificationStatus.isAccountVerified, 'Account')}
            </div>

            {user?.role === 'landlord' && bvnVerificationResult && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Verified BVN Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-left">
                  <div><strong>First Name:</strong> {bvnVerificationResult.firstName}</div>
                  <div><strong>Last Name:</strong> {bvnVerificationResult.lastName}</div>
                  <div><strong>Phone Number:</strong> {bvnVerificationResult.phoneNumber}</div>
                </CardContent>
              </Card>
            )}

            {user?.role === 'landlord' && accountVerificationResult && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Verified Bank Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-left">
                  <div><strong>Account Name:</strong> {accountVerificationResult.accountName}</div>
                  <div><strong>Account Number:</strong> {accountVerificationResult.accountNumber}</div>
                  <div><strong>Bank:</strong> {banks.find(b => b.code === accountVerificationResult.bankCode)?.name}</div>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Identity Verification (KYC)</h1>
          <p className="text-muted-foreground">
            Complete your identity verification to access all platform features
            {user?.role === 'landlord' && ' (Enhanced verification required for landlords)'}
          </p>
          <LinearProgress
            variant="determinate"
            value={getProgressValue()}
            className="mt-4"
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 0: Phone Number Input */}
              <Step>
                <StepLabel>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </div>
                </StepLabel>
                <StepContent>
                  <form onSubmit={handlePhoneNumberSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter your phone number (e.g., 08012345678)"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        We'll send a verification code to this number
                      </p>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Continue'}
                    </Button>
                  </form>
                </StepContent>
              </Step>

              {/* Step 1: Phone Verification */}
              <Step>
                <StepLabel>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Verify Phone Number</span>
                    {verificationStatus?.isPhoneVerified && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </StepLabel>
                <StepContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        We'll send a 6-digit verification code to: <strong>{phoneNumber}</strong>
                      </p>
                    </div>

                    <Button
                      onClick={handleSendSMSCode}
                      disabled={smsLoading || countdown > 0}
                      variant="outline"
                    >
                      {smsLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Send SMS Code'}
                    </Button>

                    <form onSubmit={handleVerifySMSCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="smsCode">Verification Code</Label>
                        <Input
                          id="smsCode"
                          type="text"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                        />
                      </div>
                      <Button type="submit" disabled={verifyingCode || smsCode.length !== 6}>
                        {verifyingCode ? 'Verifying...' : 'Verify Code'}
                      </Button>
                    </form>
                  </div>
                </StepContent>
              </Step>

              {/* Step 2: Email Verification */}
              <Step>
                <StepLabel>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Verify Email Address</span>
                    {verificationStatus?.isEmailVerified && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </StepLabel>
                <StepContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        We'll send a verification link to: <strong>{user?.email}</strong>
                      </p>
                    </div>

                    <Button
                      onClick={handleSendEmailVerification}
                      disabled={emailLoading}
                      variant="outline"
                    >
                      {emailLoading ? 'Sending...' : 'Send Verification Email'}
                    </Button>

                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Check your email</p>
                          <p className="text-sm text-blue-600">
                            Click the verification link in your email to complete this step.
                            The link expires in 24 hours.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={fetchVerificationStatus}
                      variant="ghost"
                      size="sm"
                    >
                      Refresh Status
                    </Button>
                  </div>
                </StepContent>
              </Step>

              {/* Step 3: BVN Verification (Landlords Only) */}
              {user?.role === 'landlord' && (
                <Step>
                  <StepLabel>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>Verify BVN (Bank Verification Number)</span>
                      {verificationStatus?.isBvnVerified && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  </StepLabel>
                  <StepContent>
                    <form onSubmit={handleVerifyBVN} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                        <Input
                          id="bvn"
                          type="text"
                          value={bvn}
                          onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          placeholder="Enter your 11-digit BVN"
                          maxLength={11}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter your 11-digit Bank Verification Number
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>

                      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Secure Verification</p>
                            <p className="text-sm text-yellow-600">
                              Your BVN will be securely verified using the official BVNVerify service.
                              This information is encrypted and used only for identity verification.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={bvnLoading}>
                        {bvnLoading ? 'Verifying...' : 'Verify BVN'}
                      </Button>
                    </form>

                    {bvnVerificationResult && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg text-green-600">✓ BVN Verified Successfully</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div><strong>First Name:</strong> {bvnVerificationResult.firstName}</div>
                          <div><strong>Last Name:</strong> {bvnVerificationResult.lastName}</div>
                          <div><strong>Phone Number:</strong> {bvnVerificationResult.phoneNumber}</div>
                        </CardContent>
                      </Card>
                    )}
                  </StepContent>
                </Step>
              )}

              {/* Step 4: Account Verification (Landlords Only) */}
              {user?.role === 'landlord' && (
                <Step>
                  <StepLabel>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Verify Bank Account</span>
                      {verificationStatus?.isAccountVerified && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  </StepLabel>
                  <StepContent>
                    <form onSubmit={handleVerifyAccount} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Bank Account Number</Label>
                        <Input
                          id="accountNumber"
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Enter your bank account number"
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter your bank account number
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="selectedBank">Bank</Label>
                        <Select value={selectedBank} onValueChange={setSelectedBank}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.code}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" disabled={accountLoading}>
                        {accountLoading ? 'Verifying...' : 'Verify Account'}
                      </Button>
                    </form>

                    {accountVerificationResult && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg text-green-600">✓ Account Verified Successfully</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div><strong>Account Name:</strong> {accountVerificationResult.accountName}</div>
                          <div><strong>Account Number:</strong> {accountVerificationResult.accountNumber}</div>
                          <div><strong>Bank:</strong> {banks.find(b => b.code === accountVerificationResult.bankCode)?.name}</div>
                        </CardContent>
                      </Card>
                    )}
                  </StepContent>
                </Step>
              )}
            </Stepper>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}