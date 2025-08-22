import { useState, useEffect } from 'react'
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Chip,
  Avatar,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  NotificationsNone,
  Circle,
  Message,
  Home,
  Payment,
  Assignment
} from '@mui/icons-material'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotification } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'

export function NotificationDropdown() {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications()
  const { showError } = useNotification()
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  console.log('NotificationDropdown: Rendered with notifications:', notifications, 'unreadCount:', unreadCount, 'loading:', loading);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    console.log('NotificationDropdown: Notification clicked:', notificationId, 'isRead:', isRead);

    if (!isRead) {
      try {
        console.log('NotificationDropdown: Marking notification as read:', notificationId);
        await markAsRead(notificationId)
        console.log('NotificationDropdown: Successfully marked notification as read');
      } catch (error) {
        console.error('NotificationDropdown: Error marking notification as read:', error)
        showError('Failed to mark notification as read')
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <Message fontSize="small" />
      case 'property':
        return <Home fontSize="small" />
      case 'payment':
        return <Payment fontSize="small" />
      case 'application':
        return <Assignment fontSize="small" />
      default:
        return <NotificationsIcon fontSize="small" />
    }
  }

  // Ensure notifications is always an array
  const safeNotifications = notifications || []
  console.log('NotificationDropdown: Safe notifications array:', safeNotifications);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.1),
            }
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                minWidth: 18,
                height: 18,
              }
            }}
          >
            {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNone />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            width: 360,
            maxHeight: 480,
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                color="primary"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Loading notifications...
              </Typography>
            </Box>
          ) : safeNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsNone sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            safeNotifications.slice(0, 10).map((notification, index) => {
              console.log('NotificationDropdown: Rendering notification:', notification);
              return (
                <Box key={notification._id}>
                  <MenuItem
                    onClick={() => handleNotificationClick(notification._id, notification.read)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      alignItems: 'flex-start',
                      backgroundColor: !notification.read ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                      '&:hover': {
                        backgroundColor: !notification.read 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.action.hover, 0.5),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '0.875rem',
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: !notification.read ? 600 : 400,
                              color: 'text.primary',
                              flex: 1,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Circle sx={{ fontSize: 8, color: 'primary.main', ml: 1, mt: 0.5 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                    />
                  </MenuItem>
                  {index < safeNotifications.length - 1 && (
                    <Divider sx={{ mx: 2 }} />
                  )}
                </Box>
              );
            })
          )}

          {safeNotifications.length > 10 && (
            <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography
                variant="body2"
                color="primary"
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                View all notifications
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  )
}