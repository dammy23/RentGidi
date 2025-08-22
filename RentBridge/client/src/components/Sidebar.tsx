import { Link, useLocation } from "react-router-dom"
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
  useTheme,
  alpha,
  Fab
} from '@mui/material'
import {
  Home,
  BarChart,
  Search,
  Business,
  Message,
  Assignment,
  Person,
  CreditCard,
  Add,
  AttachMoney,
  History,
  Description
} from '@mui/icons-material'
import { useAuth } from "@/contexts/AuthContext"

const navigation = [
  { name: "Home", href: "/", icon: Home, roles: ["tenant", "landlord", "admin"] },
  { name: "Dashboard", href: "/dashboard", icon: BarChart, roles: ["tenant", "landlord", "admin"] },
  { name: "Search Properties", href: "/search", icon: Search, roles: ["tenant"] },
  { name: "My Properties", href: "/properties", icon: Business, roles: ["landlord"] },
  { name: "Messages", href: "/messages", icon: Message, roles: ["tenant", "landlord"] },
  { name: "Applications", href: "/applications", icon: Assignment, roles: ["tenant", "landlord"] },
  { name: "Rental Agreements", href: "/rental-agreements", icon: Description, roles: ["tenant", "landlord"] },
  { name: "Holding Deposits", href: "/profile/holding-deposits", icon: AttachMoney, roles: ["tenant"] },
  { name: "Payments", href: "/payments", icon: CreditCard, roles: ["tenant"] },
  { name: "Payment History", href: "/profile/payment-history", icon: History, roles: ["tenant"] },
  { name: "Profile", href: "/profile", icon: Person, roles: ["tenant", "landlord", "admin"] },
]

const drawerWidth = 240

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const theme = useTheme()

  const filteredNavigation = navigation.filter(item =>
    user?.role && item.roles.includes(user.role)
  )

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Section */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Business sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            RentBridge
          </Typography>
        </Box>
        {user?.role && (
          <Chip
            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        )}
      </Box>

      {/* Add Property FAB for Landlords */}
      {user?.role === "landlord" && (
        <Box sx={{ p: 2 }}>
          <Fab
            component={Link}
            to="/properties/create"
            variant="extended"
            size="medium"
            color="primary"
            sx={{
              width: '100%',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <Add sx={{ mr: 1 }} />
            Add Property
          </Fab>
        </Box>
      )}

      {/* Navigation List */}
      <List sx={{ flex: 1, px: 1 }}>
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          
          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.href}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: isActive 
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.action.hover, 0.8),
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  '&::before': isActive ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '0 2px 2px 0',
                  } : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    minWidth: 40,
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* User Info Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Person sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Signed in as
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}