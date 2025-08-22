import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  DollarSign,
  Download,
  Filter,
  Search,
  CreditCard,
  Home,
  AlertCircle
} from "lucide-react"
import { getPaymentHistory } from "@/api/payments"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"

interface Payment {
  _id: string
  type: 'rent' | 'deposit' | 'holding_deposit' | 'maintenance' | 'other'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  date: string
  property?: {
    _id: string
    title: string
    location: string
  }
  description?: string
  paymentMethod?: string
  transactionId?: string
  createdAt: string
}

export function PaymentHistory() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  console.log('PaymentHistory: Component rendered')
  console.log('PaymentHistory: User:', user)

  useEffect(() => {
    console.log('PaymentHistory: useEffect triggered')
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      console.log('PaymentHistory: Starting fetchPaymentHistory function')
      console.log('PaymentHistory: Current user:', user)
      setLoading(true)
      setError(null)

      console.log('PaymentHistory: About to call getPaymentHistory API')
      const response = await getPaymentHistory()
      console.log('PaymentHistory: getPaymentHistory response received:', response)
      console.log('PaymentHistory: Response structure check:', {
        hasData: !!response.data,
        hasPayments: !!response.payments,
        dataType: typeof response.data,
        paymentsType: typeof response.payments,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        paymentsLength: Array.isArray(response.payments) ? response.payments.length : 'not array'
      })

      // Check both possible response structures
      let paymentsArray = [];
      if (response.data && Array.isArray(response.data)) {
        console.log('PaymentHistory: Using response.data as payments array')
        paymentsArray = response.data;
      } else if (response.payments && Array.isArray(response.payments)) {
        console.log('PaymentHistory: Using response.payments as payments array')
        paymentsArray = response.payments;
      } else {
        console.log('PaymentHistory: No valid payments array found in response')
        console.log('PaymentHistory: Full response object keys:', Object.keys(response))
      }

      console.log('PaymentHistory: Final payments array:', paymentsArray)
      console.log('PaymentHistory: Final payments count:', paymentsArray.length)
      
      setPayments(paymentsArray)
    } catch (error: any) {
      console.error('PaymentHistory: Error in fetchPaymentHistory:', error)
      console.error('PaymentHistory: Error message:', error.message)
      console.error('PaymentHistory: Error stack:', error.stack)
      setError(error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch payment history"
      })
    } finally {
      console.log('PaymentHistory: Setting loading to false')
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'refunded':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'rent':
        return 'default'
      case 'deposit':
        return 'secondary'
      case 'holding_deposit':
        return 'outline'
      case 'maintenance':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatPaymentType = (type: string) => {
    switch (type) {
      case 'holding_deposit':
        return 'Holding Deposit'
      case 'rent':
        return 'Rent Payment'
      case 'deposit':
        return 'Security Deposit'
      case 'maintenance':
        return 'Maintenance Fee'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesType = typeFilter === "all" || payment.type === typeFilter

    let matchesDate = true
    if (dateFilter !== "all") {
      const paymentDate = new Date(payment.date)
      const now = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = paymentDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= monthAgo
          break
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= yearAgo
          break
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate
  })

  const totalAmount = filteredPayments.reduce((sum, payment) => {
    if (payment.status === 'completed') {
      return sum + payment.amount
    }
    return sum
  }, 0)

  const handleExportPayments = () => {
    console.log('PaymentHistory: Exporting payments')
    
    const csvContent = [
      ['Date', 'Type', 'Property', 'Amount', 'Status', 'Transaction ID', 'Description'].join(','),
      ...filteredPayments.map(payment => [
        new Date(payment.date).toLocaleDateString(),
        formatPaymentType(payment.type),
        payment.property?.title || 'N/A',
        `₦${payment.amount.toLocaleString()}`,
        payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
        payment.transactionId || 'N/A',
        payment.description || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: "Payment history has been exported to CSV"
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Payment History</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <Button onClick={fetchPaymentHistory} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">Track all your rental payments and transactions</p>
        </div>
        <Button onClick={handleExportPayments} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status === 'failed').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rent">Rent Payment</SelectItem>
                <SelectItem value="deposit">Security Deposit</SelectItem>
                <SelectItem value="holding_deposit">Holding Deposit</SelectItem>
                <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            {filteredPayments.length} of {payments.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">
                {payments.length === 0 
                  ? "You haven't made any payments yet."
                  : "No payments match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(payment.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(payment.date).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(payment.type)}>
                          {formatPaymentType(payment.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.property ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{payment.property.title}</span>
                            <span className="text-xs text-gray-500">{payment.property.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">₦{payment.amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {payment.transactionId || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {payment.description || 'No description'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}