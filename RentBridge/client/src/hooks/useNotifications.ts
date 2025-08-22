import { useState, useEffect } from 'react'
import { getNotifications, markNotificationAsRead, getUnreadCount } from '@/api/notifications'
import { useToast } from './useToast'

interface Notification {
  _id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  type: string
  sender?: {
    _id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  data?: any
  priority: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log('useNotifications: Hook initialized, fetching notifications and unread count');
    fetchNotifications()
    fetchUnreadCount()

    // Listen for WebSocket notifications
    const handleNewNotification = (event: CustomEvent) => {
      console.log('useNotifications: Received new notification via WebSocket:', event.detail);
      const newNotification = event.detail;
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for new notification
      toast({
        title: newNotification.title,
        description: newNotification.message,
      });
    };

    const handleUnreadCountUpdate = (event: CustomEvent) => {
      console.log('useNotifications: Received unread count update via WebSocket:', event.detail);
      setUnreadCount(event.detail.unreadCount);
    };

    window.addEventListener('websocket-notification', handleNewNotification as EventListener);
    window.addEventListener('websocket-unread-count', handleUnreadCountUpdate as EventListener);

    return () => {
      window.removeEventListener('websocket-notification', handleNewNotification as EventListener);
      window.removeEventListener('websocket-unread-count', handleUnreadCountUpdate as EventListener);
    };
  }, [toast])

  const fetchNotifications = async (page = 1, limit = 20) => {
    try {
      setLoading(true)
      console.log('useNotifications: Fetching notifications with page:', page, 'limit:', limit);
      const response = await getNotifications(page, limit)
      console.log('useNotifications: Received response:', response);
      console.log('useNotifications: Response data:', response.data);
      
      if (response.data && response.data.notifications) {
        console.log('useNotifications: Setting notifications:', response.data.notifications);
        setNotifications(response.data.notifications)
        setUnreadCount(response.data.unreadCount || 0)
      } else {
        console.warn('useNotifications: Unexpected response structure:', response);
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('useNotifications: Error fetching notifications:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      console.log('useNotifications: Fetching unread count');
      const response = await getUnreadCount()
      console.log('useNotifications: Unread count response:', response);
      
      if (response.data && typeof response.data.unreadCount === 'number') {
        console.log('useNotifications: Setting unread count:', response.data.unreadCount);
        setUnreadCount(response.data.unreadCount)
      } else {
        console.warn('useNotifications: Unexpected unread count response:', response);
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('useNotifications: Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('useNotifications: Marking notification as read:', notificationId);
      await markNotificationAsRead(notificationId)
      console.log('useNotifications: Successfully marked notification as read');
      
      setNotifications(prev => {
        const updated = prev.map(n => n._id === notificationId ? { ...n, read: true } : n);
        console.log('useNotifications: Updated notifications state:', updated);
        return updated;
      })
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log('useNotifications: Updated unread count:', newCount);
        return newCount;
      })
    } catch (error) {
      console.error('useNotifications: Error marking notification as read:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refetch: fetchNotifications,
    fetchUnreadCount
  }
}