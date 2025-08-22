import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Shield,
  Zap,
  Wifi,
  Home,
  Phone,
  Mail,
  AlertCircle,
  CreditCard
} from "lucide-react"
import { getPropertyById } from "@/api/properties"
import { submitApplication, getApplications } from "@/api/applications"
import { createHoldingDeposit } from "@/api/payments"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import { useForm } from "react-hook-form"
import { ContactLandlordDialog } from "@/components/ContactLandlordDialog"
import { PropertyImageCarousel } from "@/components/PropertyImageCarousel"

export function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [showHoldingDepositDialog, setShowHoldingDepositDialog] = useState(false)
  const [submittingApplication, setSubmittingApplication] = useState(false)
  const [submittingDeposit, setSubmittingDeposit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(false)

  console.log('PropertyDetails: Component rendered with property ID:', id)
  console.log('PropertyDetails: User:', user)

  const form = useForm({
    defaultValues: {
      moveInDate: "",
      monthlyIncome: "",
      employmentStatus: "",
      employer: "",
      previousLandlordName: "",
      previousLandlordPhone: "",
      previousLandlordEmail: "",
      referenceName: "",
      referenceRelationship: "",
      referencePhone: "",
      referenceEmail: "",
      additionalNotes: ""
    }
  })

  const depositForm = useForm({
    defaultValues: {
      amount: "",
      paymentMethod: "",
      expirationHours: "48"
    }
  })

  useEffect(() => {
    console.log('PropertyDetails: useEffect triggered with ID:', id)
    if (id) {
      if (id.length !== 24) {
        console.log('PropertyDetails: Invalid property ID format:', id)
        setError("Invalid property ID format. Must be 24 characters.");
        setLoading(false);
        return;
      }
      fetchProperty();
      if (user?.role === 'tenant') {
        checkExistingApplication();
      }
    } else {
      console.log('PropertyDetails: No property ID provided')
      setError('No property ID provided');
      setLoading(false);
    }
  }, [id, user])

  const fetchProperty = async () => {
    try {
      console.log('PropertyDetails: Fetching property with ID:', id)
      console.log('PropertyDetails: About to call getPropertyById API')
      const response = await getPropertyById(id!)
      console.log('PropertyDetails: API response received:', response)
      console.log('PropertyDetails: Response type:', typeof response)
      console.log('PropertyDetails: Response keys:', response ? Object.keys(response) : 'null response')

      if (response && response.data) {
        console.log('PropertyDetails: Property data found:', response.data)
        console.log('PropertyDetails: Property ID in response:', response.data._id)
        console.log('PropertyDetails: Property title in response:', response.data.title)
        console.log('PropertyDetails: Property images:', response.data.images)
        setProperty(response.data)
        setError(null)
      } else if (response && response.property) {
        console.log('PropertyDetails: Property found in response.property:', response.property)
        setProperty(response.property)
        setError(null)
      } else {
        console.log('PropertyDetails: No property data in response, response structure:', response)
        setError('Property data not found in response')
      }
    } catch (error: any) {
      console.error('PropertyDetails: Error fetching property:', error)
      console.error('PropertyDetails: Error type:', typeof error)
      console.error('PropertyDetails: Error message:', error.message)
      console.error('PropertyDetails: Error stack:', error.stack)
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      console.log('PropertyDetails: Setting loading to false')
      setLoading(false)
    }
  }

  const checkExistingApplication = async () => {
    try {
      setCheckingApplication(true)
      const response = await getApplications()
      const existingApplication = response.applications.find(
        (app: any) => app.property?._id === id && app.status !== 'withdrawn'
      )
      setHasApplied(!!existingApplication)
    } catch (error: any) {
      console.error('Error checking existing application:', error)
    } finally {
      setCheckingApplication(false)
    }
  }

  const handleApplyForRent = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to apply for this property",
        variant: "destructive",
      })
      navigate('/login')
      return
    }

    if (user.role !== 'tenant') {
      toast({
        title: "Access denied",
        description: "Only tenants can apply for rental properties",
        variant: "destructive",
      })
      return
    }

    if (hasApplied) {
      toast({
        title: "Already applied",
        description: "You have already submitted an application for this property",
        variant: "destructive",
      })
      return
    }

    setShowApplicationDialog(true)
  }

  const handlePlaceHoldingDeposit = () => {
    console.log('PropertyDetails: Place holding deposit clicked')
    console.log('PropertyDetails: Current property:', property)
    console.log('PropertyDetails: Current user:', user)

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place a holding deposit",
        variant: "destructive",
      })
      navigate('/login')
      return
    }

    if (user.role !== 'tenant') {
      toast({
        title: "Access denied",
        description: "Only tenants can place holding deposits",
        variant: "destructive",
      })
      return
    }

    setShowHoldingDepositDialog(true)
  }

  const onSubmitApplication = async (data: any) => {
    try {
      setSubmittingApplication(true)

      const applicationData = {
        propertyId: property._id,
        moveInDate: data.moveInDate,
        monthlyIncome: parseFloat(data.monthlyIncome),
        employmentStatus: data.employmentStatus,
        employer: data.employer,
        previousLandlord: {
          name: data.previousLandlordName,
          phone: data.previousLandlordPhone,
          email: data.previousLandlordEmail
        },
        references: data.referenceName ? [{
          name: data.referenceName,
          relationship: data.referenceRelationship,
          phone: data.referencePhone,
          email: data.referenceEmail
        }] : [],
        additionalNotes: data.additionalNotes
      }

      await submitApplication(applicationData)

      toast({
        title: "Application submitted",
        description: "Your rental application has been submitted successfully",
      })

      setShowApplicationDialog(false)
      setHasApplied(true)
      navigate('/applications')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmittingApplication(false)
    }
  }

  const onSubmitHoldingDeposit = async (data: any) => {
    try {
      console.log('PropertyDetails: Submitting holding deposit with form data:', data)
      console.log('PropertyDetails: Property ID to use:', property._id)

      setSubmittingDeposit(true)

      const depositData = {
        propertyId: property._id,
        amount: parseFloat(data.amount),
        paymentMethod: data.paymentMethod,
        expirationHours: parseInt(data.expirationHours)
      }

      console.log('PropertyDetails: Final deposit data to send:', depositData)

      const response = await createHoldingDeposit(depositData)
      console.log('PropertyDetails: Holding deposit response:', response)

      toast({
        title: "Holding deposit placed",
        description: "Your holding deposit has been placed successfully",
      })

      setShowHoldingDepositDialog(false)
    } catch (error: any) {
      console.error('PropertyDetails: Error placing holding deposit:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmittingDeposit(false)
    }
  }

  console.log('PropertyDetails: Before render - loading:', loading, 'error:', error, 'property:', !!property)

  if (loading) {
    console.log('PropertyDetails: Rendering loading state')
    return <div className="p-12 text-center">Loading...</div>
  }

  if (error || !property) {
    console.log('PropertyDetails: Rendering error state - error:', error, 'property exists:', !!property)
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
        <p className="text-red-600">{error}</p>
        <Button onClick={() => navigate("/search")} className="mt-4">
          Browse All Properties
        </Button>
      </div>
    )
  }

  console.log('PropertyDetails: Rendering property details for:', property.title)
  console.log('PropertyDetails: Property images for carousel:', property.images)

  const amenityIcons: Record<string, any> = {
    parking: Car,
    security: Shield,
    generator: Zap,
    wifi: Wifi,
  }

  return (
    <div className="space-y-8">
      {/* Property Image Carousel */}
      <PropertyImageCarousel
        images={property.images || []}
        propertyTitle={property.title}
        className="w-full"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold">{property.title}</h1>
          <p className="flex items-center text-gray-600">
            <MapPin className="h-5 w-5 mr-2" />
            {property.location}
          </p>
          <p className="text-2xl font-bold text-blue-600">₦{property.price?.toLocaleString()}/month</p>

          {/* Property Details */}
          <div className="flex gap-6 text-gray-600">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            {property.squareFootage && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{property.squareFootage} sq ft</span>
              </div>
            )}
          </div>

          {/* Property Status Debug Info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Property Debug Info:</h3>
            <p>ID: {property._id}</p>
            <p>Status: {property.status}</p>
            <p>Owner ID: {property.owner?._id}</p>
            <p>Owner Name: {property.owner?.name}</p>
            <p>Owner Email: {property.owner?.email}</p>
            <p>Current User ID: {user?._id}</p>
            <p>Current User Role: {user?.role}</p>
            <p>Is Owner: {property.owner?._id === user?._id ? 'Yes' : 'No'}</p>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{property.description || "No description available."}</p>
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string, index: number) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || Home
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        <span>{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarImage src={property.owner?.avatar} />
                  <AvatarFallback>{property.owner?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{property.owner?.name}</h4>
                  <p className="text-sm text-gray-600">Owner</p>
                </div>
              </div>

              <div className="space-y-2">
                <ContactLandlordDialog
                  landlordId={property.owner?._id}
                  propertyId={property._id}
                  propertyTitle={property.title}
                />

                {user?.role === "tenant" && (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handlePlaceHoldingDeposit}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Place Holding Deposit
                    </Button>

                    {!hasApplied && !checkingApplication && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleApplyForRent}
                      >
                        Apply for Rent
                      </Button>
                    )}

                    {hasApplied && (
                      <div className="w-full p-3 bg-gray-100 rounded-md text-center text-sm text-gray-600">
                        You have already applied for this property
                      </div>
                    )}

                    {checkingApplication && (
                      <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
                        Checking...
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Apply for Rental</DialogTitle>
            <DialogDescription>Fill out this application to apply for {property.title}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitApplication)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="moveInDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Move-in Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Income (₦)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter your monthly income" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self-employed">Self-employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer/Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter employer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Previous Landlord Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="previousLandlordName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Previous landlord name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousLandlordPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousLandlordEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referenceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Reference name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenceRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Friend, Colleague" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referencePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenceEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information you'd like to share..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowApplicationDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingApplication}>
                  {submittingApplication ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Holding Deposit Dialog */}
      <Dialog open={showHoldingDepositDialog} onOpenChange={setShowHoldingDepositDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Place Holding Deposit</DialogTitle>
            <DialogDescription>Secure this property with a holding deposit</DialogDescription>
          </DialogHeader>

          <Form {...depositForm}>
            <form onSubmit={depositForm.handleSubmit(onSubmitHoldingDeposit)} className="space-y-6">
              <FormField
                control={depositForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Amount (₦)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter deposit amount" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={depositForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paystack">Paystack</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={depositForm.control}
                name="expirationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Expiration (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="48" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowHoldingDepositDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingDeposit} className="bg-green-600 hover:bg-green-700">
                  {submittingDeposit ? "Processing..." : "Place Deposit"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}