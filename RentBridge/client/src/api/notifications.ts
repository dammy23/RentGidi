import api from './api'

// Description: Get user notifications
// Endpoint: GET /api/notifications
// Request: { page?: number, limit?: number, unreadOnly?: boolean }
// Response: { success: boolean, notifications: Array<{ _id: string, title: string, message: string, read: boolean, createdAt: string, type: string, sender?: object, data?: object, priority: string }>, pagination: object, unreadCount: number }
export const getNotifications = (page = 1, limit = 20, unreadOnly = false) => {
  console.log('NotificationAPI: getNotifications called with page:', page, 'limit:', limit, 'unreadOnly:', unreadOnly);
  
  // Uncomment the below lines to make an actual API call
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unreadOnly: 'true' })
    });
    console.log('NotificationAPI: Making request to /api/notifications with params:', params.toString());
    return api.get(`/api/notifications?${params}`);
  } catch (error) {
    console.error('NotificationAPI: Error in getNotifications:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Mark notification as read
// Endpoint: PUT /api/notifications/:id/read
// Request: {}
// Response: { success: boolean, message: string, notification: object }
export const markNotificationAsRead = (notificationId: string) => {
  console.log('NotificationAPI: markNotificationAsRead called with ID:', notificationId);
  
  // Uncomment the below lines to make an actual API call
  try {
    console.log('NotificationAPI: Making request to mark notification as read:', notificationId);
    return api.put(`/api/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('NotificationAPI: Error in markNotificationAsRead:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Create a new notification
// Endpoint: POST /api/notifications
// Request: { recipientId: string, title: string, message: string, type: string, data?: object, priority?: string }
// Response: { success: boolean, message: string, notification: object }
export const createNotification = (data: { recipientId: string; title: string; message: string; type: string; data?: object; priority?: string }) => {
  console.log('NotificationAPI: createNotification called with data:', data);
  
  try {
    console.log('NotificationAPI: Making request to create notification');
    return api.post('/api/notifications', data);
  } catch (error) {
    console.error('NotificationAPI: Error in createNotification:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Mark all notifications as read
// Endpoint: PUT /api/notifications/mark-all-read
// Request: {}
// Response: { success: boolean, message: string, modifiedCount: number }
export const markAllNotificationsAsRead = () => {
  console.log('NotificationAPI: markAllNotificationsAsRead called');
  
  try {
    console.log('NotificationAPI: Making request to mark all notifications as read');
    return api.put('/api/notifications/mark-all-read');
  } catch (error) {
    console.error('NotificationAPI: Error in markAllNotificationsAsRead:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Delete notification
// Endpoint: DELETE /api/notifications/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deleteNotification = (notificationId: string) => {
  console.log('NotificationAPI: deleteNotification called with ID:', notificationId);
  
  try {
    console.log('NotificationAPI: Making request to delete notification:', notificationId);
    return api.delete(`/api/notifications/${notificationId}`);
  } catch (error) {
    console.error('NotificationAPI: Error in deleteNotification:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
}

// Description: Get unread notifications count
// Endpoint: GET /api/notifications/unread-count
// Request: {}
// Response: { success: boolean, unreadCount: number }
export const getUnreadCount = () => {
  console.log('NotificationAPI: getUnreadCount called');
  
  try {
    console.log('NotificationAPI: Making request to get unread count');
    return api.get('/api/notifications/unread-count');
  } catch (error) {
    console.error('NotificationAPI: Error in getUnreadCount:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
}