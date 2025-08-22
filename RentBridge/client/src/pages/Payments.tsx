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
  Plus,
  Eye,
  Download
} from "lucide-react"
import { getPayments, createPayment, getPaymentById } from "@/api/payments"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import { useForm } from "react-hook-form"

export function Payments() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  console.log('Payments: Component rendered')
  console.log('Payments: User role:', user?.role)
  console.log('Payments: User ID:', user?._id)

  const form = useForm({
    defaultValues: {
      type: "",
      amount: "",
      description: "",
      dueDate: "",
      paymentMethod: ""
    }
  })

  useEffect(() => {
    console.log('Payments: useEffect triggered')
    if (user) {
      fetchPayments()
    }
  }, [user])

  const fetchPayments = async () => {
    try {
      console.log('Payments: Fetching payments')
      setLoading(true)
      const response = await getPayments()
      console.log('Payments: Payments fetched successfully:', response)
      setPayments(response.payments || [])
    } catch (error: any) {
      console.error('Payments: Error fetching payments:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch payments"
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmitPayment = async (data: any) => {
    try {
      console.log('Payments: Submitting payment with data:', data)
      setSubmittingPayment(true)

      const paymentData = {
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod
      }

      console.log('Payments: Formatted payment data:', paymentData)
      const response = await createPayment(paymentData)
      console.log('Payments: Payment created successfully:', response)

      toast({
        title: "Payment created",
        description: "Payment has been created successfully"
      })

      setShowCreateDialog(false)
      form.reset()
      fetchPayments() // Refresh the list
    } catch (error: any) {
      console.error('Payments: Error creating payment:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create payment"
      })
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleViewDetails = async (paymentId: string) => {
    try {
      console.log('Payments: Viewing payment details for ID:', paymentId)
      const response = await getPaymentById(paymentId)
      console.log('Payments: Payment details fetched:', response)
      setSelectedPayment(response.payment)
      setShowDetailsDialog(true)
    } catch (error: any) {
      console.error('Payments: Error fetching payment details:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch payment details"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rent':
        return <DollarSign className="h-4 w-4" />
      case 'deposit':
        return <CreditCard className="h-4 w-4" />
      case 'holding_deposit':
        return <CreditCard className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage your rental payments and transactions</p>
        </div>
        {user?.role === 'tenant' && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        )}
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View and manage all your payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600 mb-4">You haven't made any payments yet.</p>
              {user?.role === 'tenant' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Payment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getTypeIcon(payment.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {payment.description || `${payment.type} Payment`}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>₦{payment.amount?.toLocaleString()}</span>
                        <span>•</span>
                        <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                        {payment.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(payment.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(payment._id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Create New Payment</DialogTitle>
            <DialogDescription>
              Create a new payment record
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rent">Rent Payment</SelectItem>
                        <SelectItem value="deposit">Security Deposit</SelectItem>
                        <SelectItem value="holding_deposit">Holding Deposit</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Payment description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingPayment}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submittingPayment ? "Creating..." : "Create Payment"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View detailed information about this payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status</span>
                {getStatusBadge(selectedPayment.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Type</span>
                <span className="capitalize">{selectedPayment.type?.replace('_', ' ')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Amount</span>
                <span className="font-semibold">₦{selectedPayment.amount?.toLocaleString()}</span>
              </div>

              {selectedPayment.description && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Description</span>
                  <span>{selectedPayment.description}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Created</span>
                <span>{new Date(selectedPayment.createdAt).toLocaleDateString()}</span>
              </div>

              {selectedPayment.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Due Date</span>
                  <span>{new Date(selectedPayment.dueDate).toLocaleDateString()}</span>
                </div>
              )}

              {selectedPayment.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Payment Method</span>
                  <span className="capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}