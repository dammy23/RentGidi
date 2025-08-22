import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Save,
  Eye,
  MapPin,
  Bed,
  Bath,
  Square
} from "lucide-react"
import { getProperties, createListing } from "@/api/properties"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"

export function CreateListing() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const propertyId = searchParams.get('propertyId')

  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [listingData, setListingData] = useState({
    propertyId: propertyId || '',
    monthlyRent: '',
    securityDeposit: '',
    availableFrom: '',
    leaseDuration: '12',
    description: '',
    specialTerms: ''
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (propertyId && properties.length > 0) {
      const property = properties.find(p => p._id === propertyId)
      if (property) {
        setSelectedProperty(property)
        setListingData(prev => ({
          ...prev,
          propertyId: propertyId,
          monthlyRent: property.price?.toString() || ''
        }))
      }
    }
  }, [propertyId, properties])

  const fetchProperties = async () => {
    try {
      console.log('Fetching properties for listing creation')
      const response = await getProperties()
      // Filter properties that don't have active listings
      const availableProperties = response.properties.filter(
        (property: any) => property.status !== 'active' && property.status !== 'rented'
      )
      setProperties(availableProperties)
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find(p => p._id === propertyId)
    setSelectedProperty(property)
    setListingData(prev => ({
      ...prev,
      propertyId,
      monthlyRent: property?.price?.toString() || ''
    }))
  }

  const handleInputChange = (field: string, value: string) => {
    setListingData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateListing = async () => {
    if (!selectedProperty || !listingData.monthlyRent || !listingData.availableFrom) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      console.log('Creating listing with data:', listingData)
      
      const response = await createListing({
        ...listingData,
        monthlyRent: parseInt(listingData.monthlyRent),
        securityDeposit: listingData.securityDeposit ? parseInt(listingData.securityDeposit) : undefined
      })

      toast({
        title: "Listing created",
        description: "Your property listing has been created successfully",
      })

      navigate('/properties')
    } catch (error) {
      console.error('Error creating listing:', error)
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/properties')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Listing
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a rental listing for your property
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Selection */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Select Property
              </CardTitle>
              <CardDescription>
                Choose which property you want to create a listing for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <Select 
                  value={listingData.propertyId} 
                  onValueChange={handlePropertySelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property._id} value={property._id}>
                        <div className="flex items-center gap-2">
                          <span>{property.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {property.location}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {properties.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No properties available for listing</p>
                  <p className="text-sm">All your properties already have active listings</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/properties/create')}
                  >
                    Add New Property
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listing Details */}
          {selectedProperty && (
            <>
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing & Terms
                  </CardTitle>
                  <CardDescription>
                    Set the rental price and lease terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRent">Monthly Rent (₦) *</Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        placeholder="1500000"
                        value={listingData.monthlyRent}
                        onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="securityDeposit">Security Deposit (₦)</Label>
                      <Input
                        id="securityDeposit"
                        type="number"
                        placeholder="Optional"
                        value={listingData.securityDeposit}
                        onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availableFrom">Available From *</Label>
                      <Input
                        id="availableFrom"
                        type="date"
                        value={listingData.availableFrom}
                        onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leaseDuration">Lease Duration (months)</Label>
                      <Select 
                        value={listingData.leaseDuration} 
                        onValueChange={(value) => handleInputChange('leaseDuration', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                          <SelectItem value="18">18 months</SelectItem>
                          <SelectItem value="24">24 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>
                    Provide additional details about the rental
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Listing Description</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      placeholder="Add any specific details about this rental listing..."
                      value={listingData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialTerms">Special Terms & Conditions</Label>
                    <Textarea
                      id="specialTerms"
                      rows={3}
                      placeholder="Any special requirements or terms for tenants..."
                      value={listingData.specialTerms}
                      onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Preview */}
          {selectedProperty && (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Property Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={selectedProperty.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'}
                  alt={selectedProperty.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                <div>
                  <h3 className="font-semibold">{selectedProperty.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedProperty.location}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-blue-600" />
                    <span>{selectedProperty.bedrooms}BR</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-green-600" />
                    <span>{selectedProperty.bathrooms}BA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square className="h-4 w-4 text-purple-600" />
                    <span>{selectedProperty.squareFootage} sq ft</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Rent:</span>
                    <span className="font-semibold">
                      ₦{listingData.monthlyRent ? parseInt(listingData.monthlyRent).toLocaleString() : '0'}
                    </span>
                  </div>
                  {listingData.securityDeposit && (
                    <div className="flex justify-between text-sm">
                      <span>Security Deposit:</span>
                      <span className="font-semibold">
                        ₦{parseInt(listingData.securityDeposit).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Lease Duration:</span>
                    <span className="font-semibold">{listingData.leaseDuration} months</span>
                  </div>
                  {listingData.availableFrom && (
                    <div className="flex justify-between text-sm">
                      <span>Available From:</span>
                      <span className="font-semibold">
                        {new Date(listingData.availableFrom).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 space-y-3">
              <Button
                onClick={handleCreateListing}
                disabled={creating || !selectedProperty}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {creating ? "Creating..." : "Create Listing"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/properties')}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Listing Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 space-y-2">
              <p>• Set competitive rental prices</p>
              <p>• Be clear about lease terms</p>
              <p>• Respond quickly to inquiries</p>
              <p>• Keep property information updated</p>
              <p>• Consider market rates in your area</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}