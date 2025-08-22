import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  User,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react"
import { getApplications, updateApplicationStatus } from "@/api/applications"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import { formatDistanceToNow } from "date-fns"

export function Applications() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      console.log('Fetching applications')
      const response = await getApplications()
      setApplications(response.applications)
    } catch (error: any) {
      console.error('Error fetching applications:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, status: string) => {
    try {
      console.log('Updating application status:', applicationId, status)
      const response = await updateApplicationStatus(applicationId, status)

      setApplications(prev =>
        prev.map(app =>
          app._id === applicationId ? { ...app, status } : app
        )
      )

      toast({
        title: "Status updated",
        description: response.message,
      })
    } catch (error: any) {
      console.error('Error updating application status:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredApplications = applications.filter(application => {
    if (activeTab === "all") return true
    return application.status === activeTab
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Applications
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.role === 'landlord'
            ? 'Review and manage rental applications'
            : 'Track your rental applications'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter(a => a.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({applications.filter(a => a.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter(a => a.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredApplications.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-500">
                  {user?.role === 'landlord'
                    ? "No rental applications have been submitted yet."
                    : "You haven't submitted any applications yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application._id}
                  application={application}
                  userRole={user?.role}
                  onStatusUpdate={handleStatusUpdate}
                  onViewDetails={() => setSelectedApplication(application)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the complete application information
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <ApplicationDetails
              application={selectedApplication}
              userRole={user?.role}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApplicationCard({ application, userRole, onStatusUpdate, onViewDetails }: {
  application: any
  userRole?: string
  onStatusUpdate: (id: string, status: string) => void
  onViewDetails: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {userRole === 'landlord' && (
              <Avatar className="h-12 w-12">
                <AvatarImage src={application.tenant?.avatar} />
                <AvatarFallback>
                  {application.tenant?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {userRole === 'landlord' ? application.tenant?.name : application.property?.title}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {userRole === 'landlord' ? application.property?.location : application.property?.address}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ₦{application.property?.price?.toLocaleString()}/month
                </div>
              </div>
            </div>
          </div>
          <Badge className={getStatusColor(application.status)}>
            {getStatusIcon(application.status)}
            <span className="ml-1 capitalize">{application.status}</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {application.documents && application.documents.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Documents
              </Button>
            )}
          </div>

          {userRole === 'landlord' && application.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onStatusUpdate(application._id, 'rejected')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onStatusUpdate(application._id, 'approved')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationDetails({ application, userRole, onStatusUpdate }: {
  application: any
  userRole?: string
  onStatusUpdate: (id: string, status: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Applicant Info */}
      {userRole === 'landlord' && (
        <div>
          <h4 className="font-semibold mb-3">Applicant Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p>{application.tenant?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{application.tenant?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p>{application.tenant?.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
              <p className="capitalize">{application.applicationData?.employmentStatus || 'Not provided'}</p>
            </div>
            {application.applicationData?.employer && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employer</label>
                <p>{application.applicationData.employer}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Monthly Income</label>
              <p>₦{application.applicationData?.monthlyIncome?.toLocaleString() || 'Not provided'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Property Info */}
      <div>
        <h4 className="font-semibold mb-3">Property Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Property</label>
            <p>{application.property?.title}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Monthly Rent</label>
            <p>₦{application.property?.price?.toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Location</label>
            <p>{application.property?.location}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Move-in Date</label>
            <p>{application.applicationData?.moveInDate ? new Date(application.applicationData.moveInDate).toLocaleDateString() : 'Flexible'}</p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {application.applicationData?.additionalNotes && (
        <div>
          <h4 className="font-semibold mb-3">Additional Notes</h4>
          <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
            {application.applicationData.additionalNotes}
          </p>
        </div>
      )}

      {/* References */}
      {application.applicationData?.references && application.applicationData.references.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">References</h4>
          <div className="space-y-3">
            {application.applicationData.references.map((reference: any, index: number) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {reference.name}
                  </div>
                  <div>
                    <span className="font-medium">Relationship:</span> {reference.relationship}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {reference.phone}
                  </div>
                  {reference.email && (
                    <div>
                      <span className="font-medium">Email:</span> {reference.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {userRole === 'landlord' && application.status === 'pending' && (
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onStatusUpdate(application._id, 'rejected')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject Application
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => onStatusUpdate(application._id, 'approved')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Application
          </Button>
        </div>
      )}
    </div>
  )
}