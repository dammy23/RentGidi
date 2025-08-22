import { useAuth } from "@/contexts/AuthContext"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Container,
  Paper,
  IconButton,
  Fade,
  Grow
} from '@mui/material'
import {
  Business,
  Search,
  Message,
  Assignment,
  TrendingUp,
  People,
  Star,
  Add,
  CheckCircle,
  Warning
} from '@mui/icons-material'
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getHomeStats } from "@/api/dashboard"
import { useNotification } from "@/contexts/NotificationContext"
import { motion } from 'framer-motion'

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showError } = useNotification()
  const theme = useTheme()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHomeStats()
  }, [])

  const fetchHomeStats = async () => {
    try {
      console.log('Fetching home stats')
      const response = await getHomeStats()
      setStats(response.stats)
    } catch (error) {
      console.error('Error fetching home stats:', error)
      showError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const quickActions = user?.role === 'landlord'
    ? [
        {
          title: 'Add Property',
          description: 'List a new property',
          icon: Business,
          href: '/properties/create',
          color: theme.palette.primary.main,
          gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
        },
        {
          title: 'View Messages',
          description: 'Check tenant inquiries',
          icon: Message,
          href: '/messages',
          color: theme.palette.success.main,
          gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
        },
        {
          title: 'Applications',
          description: 'Review applications',
          icon: Assignment,
          href: '/applications',
          color: theme.palette.secondary.main,
          gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
        },
        {
          title: 'Properties',
          description: 'Manage your listings',
          icon: Business,
          href: '/properties',
          color: theme.palette.warning.main,
          gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
        },
      ]
    : [
        {
          title: 'Search Properties',
          description: 'Find your next home',
          icon: Search,
          href: '/search',
          color: theme.palette.primary.main,
          gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
        },
        {
          title: 'My Applications',
          description: 'Track applications',
          icon: Assignment,
          href: '/applications',
          color: theme.palette.secondary.main,
          gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
        },
        {
          title: 'Messages',
          description: 'Chat with landlords',
          icon: Message,
          href: '/messages',
          color: theme.palette.success.main,
          gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
        },
        {
          title: 'Saved Properties',
          description: 'View favorites',
          icon: Star,
          href: '/search?tab=saved',
          color: theme.palette.warning.main,
          gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
        },
      ]

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ height: 120 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, bgcolor: 'grey.200', borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ width: '60%', height: 16, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }} />
                      <Box sx={{ width: '40%', height: 12, bgcolor: 'grey.200', borderRadius: 1 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Welcome Section */}
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            p: 4,
            borderRadius: 3,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                  Welcome back, {user?.name}!
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  {user?.role === 'landlord'
                    ? 'Manage your properties and connect with tenants'
                    : 'Find your perfect home in Nigeria'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Chip
                    icon={user?.verificationStatus === 'verified' ? <CheckCircle /> : <Warning />}
                    label={user?.verificationStatus === 'verified' ? 'Verified Account' : 'Verification Pending'}
                    color={user?.verificationStatus === 'verified' ? 'success' : 'warning'}
                    sx={{
                      bgcolor: alpha(theme.palette.common.white, 0.2),
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                  <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'capitalize' }}>
                    {user?.role} Account
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {user?.role === 'landlord' ? (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={500}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Properties
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                            <Business />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                          {stats.totalProperties}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stats.activeListings} active listings
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={700}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Applications
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                            <Assignment />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                          {stats.totalApplications}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stats.pendingApplications} pending review
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={900}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Messages
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                            <Message />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 1 }}>
                          {stats.unreadMessages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          unread messages
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={1100}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Monthly Revenue
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                            <TrendingUp />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 1 }}>
                          ₦{stats.monthlyRevenue?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          +{stats.revenueGrowth}% from last month
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={500}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Saved Properties
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                            <Star />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 1 }}>
                          {stats.savedProperties}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          properties in wishlist
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={700}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Applications
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                            <Assignment />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                          {stats.myApplications}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stats.pendingApplications} pending
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={900}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Messages
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                            <Message />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                          {stats.unreadMessages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          unread messages
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Grow in timeout={1100}>
                    <Card sx={{ height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-4px)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Available Properties
                          </Typography>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                            <Business />
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 1 }}>
                          {stats.availableProperties}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          in your area
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease-in-out',
                        background: action.gradient,
                        color: 'white',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          boxShadow: theme.shadows[12],
                        },
                      }}
                      onClick={() => navigate(action.href)}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: alpha(theme.palette.common.white, 0.2),
                            color: 'white',
                            mx: 'auto',
                            mb: 2,
                            transition: 'all 0.3s ease-in-out',
                          }}
                        >
                          <Icon fontSize="large" />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              )
            })}
          </Grid>
        </Box>

        {/* Verification Notice */}
        {user?.verificationStatus !== 'verified' && (
          <Fade in timeout={1000}>
            <Card
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                    <Warning />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.warning.dark, mb: 1 }}>
                      Complete Your Verification
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {user?.verificationStatus === 'pending'
                        ? 'Your identity verification is being processed. This usually takes 24-48 hours.'
                        : 'Complete your identity verification to access all platform features.'}
                    </Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => navigate('/profile')}
                      sx={{ textTransform: 'none' }}
                    >
                      {user?.verificationStatus === 'pending' ? 'Check Status' : 'Start Verification'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}
      </motion.div>
    </Container>
  )
}