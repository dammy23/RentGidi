import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react"
import { useEffect, useState } from "react"
import { getDashboardData } from "@/api/dashboard"
import { useToast } from "@/hooks/useToast"
import { Progress } from "@/components/ui/progress"

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data')
      const response = await getDashboardData()
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <Badge variant="outline" className="text-sm">
          {user?.role === 'landlord' ? 'Landlord Portal' : 'Tenant Portal'}
        </Badge>
      </div>

      {user?.role === 'landlord' ? (
        <LandlordDashboard data={dashboardData} />
      ) : (
        <TenantDashboard data={dashboardData} />
      )}
    </div>
  )
}

function LandlordDashboard({ data }: { data: any }) {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.occupancyRate || 0}% occupancy rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{data?.monthlyRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.revenueGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data?.pendingApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              pending review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Views</CardTitle>
            <Eye className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recentApplications?.map((application: any) => (
              <div key={application._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{application.applicantName}</p>
                  <p className="text-sm text-muted-foreground">{application.propertyTitle}</p>
                </div>
                <Badge variant={application.status === 'pending' ? 'secondary' : 'default'}>
                  {application.status}
                </Badge>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">No recent applications</p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/applications')}
            >
              View All Applications
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recentMessages?.map((message: any) => (
              <div key={message._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{message.senderName}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{message.createdAt}</p>
                </div>
                {!message.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">No recent messages</p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/messages')}
            >
              View All Messages
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.topProperties?.map((property: any) => (
              <div key={property._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">{property.title}</p>
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{property.views} views</p>
                  <p className="text-sm text-muted-foreground">{property.inquiries} inquiries</p>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">No property data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TenantDashboard({ data }: { data: any }) {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Properties</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.savedProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              in your wishlist
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.pendingApplications || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data?.unreadMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              unread messages
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewings</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.scheduledViewings || 0}</div>
            <p className="text-xs text-muted-foreground">
              scheduled this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Status */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.myApplications?.map((application: any) => (
            <div key={application._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <img
                  src={application.propertyImage}
                  alt={application.propertyTitle}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <p className="font-medium">{application.propertyTitle}</p>
                  <p className="text-sm text-muted-foreground">{application.location}</p>
                  <p className="text-sm text-muted-foreground">Applied {application.appliedDate}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    application.status === 'approved' ? 'default' :
                    application.status === 'rejected' ? 'destructive' : 'secondary'
                  }
                >
                  {application.status}
                </Badge>
                {application.status === 'approved' && (
                  <p className="text-xs text-green-600 mt-1">Next: Sign Agreement</p>
                )}
              </div>
            </div>
          )) || (
            <p className="text-muted-foreground text-center py-4">No applications yet</p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/applications')}
          >
            View All Applications
          </Button>
        </CardContent>
      </Card>

      {/* Recommended Properties */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.recommendedProperties?.map((property: any) => (
              <div
                key={property._id}
                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigate(`/properties/${property._id}`)}
              >
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-32 rounded-lg object-cover mb-3"
                />
                <h3 className="font-medium">{property.title}</h3>
                <p className="text-sm text-muted-foreground">{property.location}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">₦{property.price?.toLocaleString()}/month</p>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4 col-span-2">No recommendations available</p>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate('/search')}
          >
            Browse All Properties
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}