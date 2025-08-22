import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { getProfile, updateProfile, uploadProfilePicture, uploadVerificationDocument } from '@/api/profile'
import { getVerificationStatus } from '@/api/verification'
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react'
import {SERVER_URL}  from '@/config/constants';

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  bio?: string
  address?: string
  occupation?: string
  avatar?: string
  verificationStatus?: string
  isPhoneVerified?: boolean
  isEmailVerified?: boolean
  kycCompleted?: boolean
  verificationDocuments?: Array<{
    type: string
    url: string
    status: string
    uploadedAt: string
  }>
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    address: '',
    occupation: ''
  })

  useEffect(() => {
    fetchProfile()
    fetchVerificationStatus()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      console.log('Profile: Fetching profile data');
      const response = await getProfile()
      console.log('Profile: Full API response:', response);
      console.log('Profile: Response data:', response.data);

      // The backend returns { success: boolean, data: { user: UserProfile } }
      if (response.data && response.data.success && response.data.data && response.data.data.user) {
        const userData = response.data.data.user;
        console.log('Profile: User data extracted:', userData);
        console.log('Profile: Avatar URL from backend:', userData.avatar);
        console.log('Profile: Avatar URL type:', typeof userData.avatar);

        setProfile(userData)
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          address: userData.address || '',
          occupation: userData.occupation || ''
        })
        console.log('Profile: Profile state set successfully');
      } else {
        console.error('Profile: Unexpected response structure:', response);
        throw new Error('Invalid response structure')
      }
    } catch (error) {
      console.error('Profile: Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVerificationStatus = async () => {
    try {
      console.log('Profile: Fetching verification status');
      const response = await getVerificationStatus()
      console.log('Profile: Verification status response:', response);

      if (response.data && response.data.success) {
        const verificationData = response.data.data
        setProfile(prev => prev ? {
          ...prev,
          isPhoneVerified: verificationData.isPhoneVerified,
          isEmailVerified: verificationData.isEmailVerified,
          kycCompleted: verificationData.kycCompleted
        } : null)
      }
    } catch (error) {
      console.error('Profile: Error fetching verification status:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setUpdating(true)
      console.log('Profile: Updating profile with data:', formData);

      const response = await updateProfile(formData)
      console.log('Profile: Update response:', response);

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        await fetchProfile() // Refresh profile data
      }
    } catch (error) {
      console.error('Profile: Error updating profile:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      console.log('Profile: Uploading avatar:', file.name);
      console.log('Profile: File size:', file.size, 'bytes');
      console.log('Profile: File type:', file.type);

      const response = await uploadProfilePicture(file)
      console.log('Profile: Avatar upload response:', response);
      console.log('Profile: Avatar upload response data:', response.data);

      if (response.data && response.data.success) {
        console.log('Profile: Avatar uploaded successfully, new URL:', response.data.data?.avatarUrl);
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        })
        await fetchProfile() // Refresh profile data
      }
    } catch (error) {
      console.error('Profile: Error uploading avatar:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      console.log('Profile: Uploading verification document:', file.name, 'type:', documentType);

      const response = await uploadVerificationDocument(file, documentType)
      console.log('Profile: Document upload response:', response);

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: "Verification document uploaded successfully",
        })
        await fetchProfile() // Refresh profile data
      }
    } catch (error) {
      console.error('Profile: Error uploading document:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload verification document",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Not Verified</Badge>
    }
  }

  const getKYCStatusBadge = () => {
    if (profile?.kycCompleted) {
      return <Badge variant="default" className="bg-green-500"><Shield className="w-3 h-3 mr-1" />KYC Complete</Badge>
    } else if (profile?.isPhoneVerified || profile?.isEmailVerified) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />KYC In Progress</Badge>
    } else {
      return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />KYC Required</Badge>
    }
  }

  const formatDocumentType = (type: string | undefined) => {
    if (!type) return 'Unknown Document'
    return type.replace('_', ' ')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">Unable to load your profile information.</p>
            <Button onClick={fetchProfile}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  // Construct full avatar URL for display
  const avatarUrl = profile.avatar ? `${SERVER_URL}${profile.avatar}` : undefined;
  console.log('Profile: Profile avatar URL from state:', profile.avatar);
  console.log('Profile: Constructed full avatar URL:', avatarUrl);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and verification status</p>
        </div>
        <div className="flex space-x-2">
          {getVerificationStatusBadge(profile.verificationStatus)}
          {getKYCStatusBadge()}
        </div>
      </div>

      {/* KYC Status Card */}
      {!profile.kycCompleted && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Shield className="h-5 w-5" />
              <span>Complete Your Identity Verification</span>
            </CardTitle>
            <CardDescription className="text-orange-600">
              Complete KYC verification to access all platform features including property listings and payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className={`h-4 w-4 ${profile.isPhoneVerified ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-sm ${profile.isPhoneVerified ? 'text-green-600' : 'text-gray-600'}`}>
                    Phone Verified
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className={`h-4 w-4 ${profile.isEmailVerified ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-sm ${profile.isEmailVerified ? 'text-green-600' : 'text-gray-600'}`}>
                    Email Verified
                  </span>
                </div>
              </div>
              <Button onClick={() => navigate('/kyc-verification')} variant="outline">
                Complete KYC
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture and Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarUrl}
                  alt={profile.name}
                  onError={(e) => {
                    console.log('Profile: Avatar image failed to load:', avatarUrl);
                    console.log('Profile: Image error event:', e);
                  }}
                  onLoad={() => {
                    console.log('Profile: Avatar image loaded successfully:', avatarUrl);
                  }}
                />
                <AvatarFallback className="text-lg">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h3 className="font-semibold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="outline" className="mt-1">{profile.role}</Badge>
              </div>

              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Change Picture'}
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Enter your occupation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={updating} className="w-full">
                {updating ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Verification Documents */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Identity Verification</CardTitle>
            <CardDescription>
              Upload your identity documents for account verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {['national_id', 'drivers_license', 'passport'].map((docType) => (
                <div key={docType} className="space-y-2">
                  <Label className="capitalize">{formatDocumentType(docType)}</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentUpload(e, docType)}
                      disabled={uploading}
                      className="hidden"
                      id={`${docType}-upload`}
                    />
                    <Label htmlFor={`${docType}-upload`} className="cursor-pointer">
                      <Button variant="ghost" size="sm" disabled={uploading} asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              ))}
            </div>

            {profile.verificationDocuments && profile.verificationDocuments.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {profile.verificationDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">{formatDocumentType(doc?.type)}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded on {doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      {getVerificationStatusBadge(doc?.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}