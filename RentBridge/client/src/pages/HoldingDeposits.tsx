import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  MapPin
} from "lucide-react"
import { getHoldingDeposits, updateHoldingDeposit } from "@/api/payments"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import { useForm } from "react-hook-form"

export function HoldingDeposits() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [updating, setUpdating] = useState(false)

  console.log('HoldingDeposits: Component rendered')
  console.log('HoldingDeposits: User:', user)

  const form = useForm({
    defaultValues: {
      status: "",
      notes: ""
    }
  })

  useEffect(() => {
    console.log('HoldingDeposits: useEffect triggered')
    if (!user) {
      console.log('HoldingDeposits: No user found, redirecting to login')
      navigate('/login')
      return
    }

    if (user.role !== 'tenant' && user.role !== 'landlord') {
      console.log('HoldingDeposits: Invalid user role:', user.role)
      toast({
        title: "Access denied",
        description: "You don't have permission to view this page",
        variant: "destructive",
      })
      navigate('/')
      return
    }

    fetchHoldingDeposits()
  }, [user, navigate])

  const fetchHoldingDeposits = async () => {
    try {
      console.log('HoldingDeposits: Fetching holding deposits')
      setLoading(true)
      const response = await getHoldingDeposits()
      console.log('HoldingDeposits: Deposits fetched successfully:', response)
      setDeposits(response.deposits || [])
    } catch (error: any) {
      console.error('HoldingDeposits: Error fetching deposits:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch holding deposits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDeposit = (deposit: any) => {
    console.log('HoldingDeposits: Opening update dialog for deposit:', deposit._id)
    setSelectedDeposit(deposit)
    form.reset({
      status: deposit.status,
      notes: deposit.notes || ""
    })
    setShowUpdateDialog(true)
  }

  const onSubmitUpdate = async (data: any) => {
    try {
      console.log('HoldingDeposits: Updating deposit with data:', data)
      console.log('HoldingDeposits: Selected deposit:', selectedDeposit)
      setUpdating(true)

      const updateData = {
        status: data.status,
        notes: data.notes
      }

      console.log('HoldingDeposits: Formatted update data:', updateData)
      const response = await updateHoldingDeposit(selectedDeposit._id, updateData)
      console.log('HoldingDeposits: Deposit updated successfully:', response)

      toast({
        title: "Success",
        description: "Holding deposit updated successfully"
      })

      setShowUpdateDialog(false)
      setSelectedDeposit(null)
      fetchHoldingDeposits() // Refresh the list
    } catch (error: any) {
      console.error('HoldingDeposits: Error updating deposit:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update holding deposit",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, text: "Pending" },
      approved: { variant: "default" as const, icon: CheckCircle, text: "Approved" },
      rejected: { variant: "destructive" as const, icon: XCircle, text: "Rejected" },
      expired: { variant: "outline" as const, icon: AlertCircle, text: "Expired" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Holding Deposits</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Holding Deposits</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'tenant' 
              ? 'Manage your property holding deposits'
              : 'Review and manage holding deposits from tenants'
            }
          </p>
        </div>
        {user?.role === 'tenant' && (
          <Button onClick={() => navigate('/search')} className="bg-blue-600 hover:bg-blue-700">
            <Home className="h-4 w-4 mr-2" />
            Browse Properties
          </Button>
        )}
      </div>

      {deposits.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Holding Deposits</h3>
            <p className="text-gray-600 mb-6">
              {user?.role === 'tenant' 
                ? "You haven't placed any holding deposits yet."
                : "No holding deposits have been submitted for your properties."
              }
            </p>
            {user?.role === 'tenant' && (
              <Button onClick={() => navigate('/search')} className="bg-blue-600 hover:bg-blue-700">
                Browse Properties
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {deposits.map((deposit) => (
            <Card key={deposit._id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      {deposit.property?.title || 'Property'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {deposit.property?.location || 'Location not available'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(deposit.status)}
                    {isExpired(deposit.expiresAt) && deposit.status === 'pending' && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">{formatCurrency(deposit.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="font-semibold">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Expires</p>
                      <p className="font-semibold">
                        {new Date(deposit.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {user?.role === 'tenant' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold capitalize">{deposit.paymentMethod}</p>
                    </div>
                    {deposit.tenant && (
                      <div>
                        <p className="text-sm text-gray-600">Tenant</p>
                        <p className="font-semibold">{deposit.tenant.name}</p>
                      </div>
                    )}
                  </div>
                )}

                {user?.role === 'landlord' && deposit.tenant && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tenant</p>
                      <p className="font-semibold">{deposit.tenant.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-semibold">{deposit.tenant.email}</p>
                    </div>
                  </div>
                )}

                {deposit.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{deposit.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Last updated: {new Date(deposit.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {deposit.property && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/properties/${deposit.property._id}`)}
                      >
                        View Property
                      </Button>
                    )}
                    {user?.role === 'landlord' && deposit.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateDeposit(deposit)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Update Deposit Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Update Holding Deposit</DialogTitle>
            <DialogDescription>
              Review and update the status of this holding deposit
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add any notes about this deposit..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUpdateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? "Updating..." : "Update Deposit"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}