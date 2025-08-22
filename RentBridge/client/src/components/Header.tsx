import { Link } from 'react-router-dom'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Badge,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material'
import { 
  Notifications as NotificationsIcon, 
  AccountCircle, 
  Logout, 
  Person,
  Home as HomeIcon
} from '@mui/icons-material'
import { useState } from 'react'
import { ThemeToggleMui } from './ui/theme-toggle-mui'
import { NotificationDropdown } from './NotificationDropdown'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/contexts/NotificationContext'
import {SERVER_URL}  from '@/config/constants';

export function Header() {
  const { user, logout } = useAuth()
  const { showSuccess } = useNotification()
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)


  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    console.log('Header: Logout clicked');
    logout()
    showSuccess('Logged out successfully')
    handleClose()
  }
console.log('Header: Avatar URL before processing:', user);
  // Construct full avatar URL
  const avatarUrl = user?.avatar ? `${SERVER_URL}${user.avatar}` : undefined;

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            component={Link}
            to="/"
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.1),
              }
            }}
          >
            <HomeIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none',
              background: 'linear-gradient(45deg, #ffffff 30%, #e0e7ff 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              '&:hover': {
                textShadow: '0 0 8px rgba(255,255,255,0.3)',
              }
            }}
          >
            RentBridge
          </Typography>
        </Box>

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* Theme Toggle */}
          <ThemeToggleMui />

          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                }
              }}
            >
              <Avatar 
                src={avatarUrl}
                alt={user?.name}
                
                  
                sx={{ 
                  width: 32, 
                  height: 32,
                  border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    borderColor: theme.palette.common.white,
                  }
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 8,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            
            <MenuItem component={Link} to="/profile">
              <Person sx={{ mr: 2, fontSize: 20 }} />
              Profile
            </MenuItem>
            
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
              <Logout sx={{ mr: 2, fontSize: 20 }} />
              Log out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}