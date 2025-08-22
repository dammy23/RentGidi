import api from './api'

// Description: Get home dashboard statistics
// Endpoint: GET /api/dashboard/stats
// Request: {}
// Response: { stats: { totalProperties: number, activeListings: number, totalApplications: number, pendingApplications: number, unreadMessages: number, monthlyRevenue: number, revenueGrowth: number, savedProperties: number, myApplications: number, availableProperties: number } }
export const getHomeStats = async () => {
  try {
    const response = await api.get('/api/dashboard/stats')
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message)
  }
}

// Description: Get detailed dashboard data
// Endpoint: GET /api/dashboard/data
// Request: {}
// Response: { data: { totalProperties: number, occupancyRate: number, monthlyRevenue: number, revenueGrowth: number, pendingApplications: number, totalViews: number, recentApplications: Array, recentMessages: Array, topProperties: Array, savedProperties: number, totalApplications: number, unreadMessages: number, scheduledViewings: number, myApplications: Array, recommendedProperties: Array } }
export const getDashboardData = async () => {
  try {
    const response = await api.get('/api/dashboard/data')
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message)
  }
}