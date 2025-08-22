const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const auth = require('./middleware/auth');

console.log('NotificationRoutes: Loading notification routes');

// Create a new notification
router.post('/', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/notifications - Create notification request from user:', req.user.id);

  try {
    const { recipientId, title, message, type, data, priority } = req.body;

    // Validation
    if (!recipientId || !title || !message || !type) {
      return res.status(400).json({
        error: 'Recipient ID, title, message, and type are required'
      });
    }

    const validTypes = ['message', 'application', 'payment', 'property', 'system', 'agreement'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid notification type'
      });
    }

    const senderInfo = {
      senderId: req.user.id
    };

    const notification = await notificationService.createNotification(
      recipientId,
      title,
      message,
      type,
      senderInfo,
      data || {},
      priority || 'normal'
    );

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      error: error.message || 'Failed to create notification'
    });
  }
});

// Get user's notifications with pagination
router.get('/', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/notifications - Get notifications for user:', req.user.id);

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getUserNotifications(
      req.user.id,
      page,
      limit,
      unreadOnly
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      error: error.message || 'Failed to get notifications'
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth.authenticateToken, async (req, res) => {
  console.log('PUT /api/notifications/:id/read - Mark notification as read:', req.params.id);

  try {
    const notification = await notificationService.markNotificationAsRead(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: error.message || 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth.authenticateToken, async (req, res) => {
  console.log('PUT /api/notifications/mark-all-read - Mark all notifications as read for user:', req.user.id);

  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: error.message || 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', auth.authenticateToken, async (req, res) => {
  console.log('DELETE /api/notifications/:id - Delete notification:', req.params.id);

  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete notification'
    });
  }
});

// Get unread count
router.get('/unread-count', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/notifications/unread-count - Get unread count for user:', req.user.id);

  try {
    const result = await notificationService.getUserNotifications(req.user.id, 1, 1, true);

    res.json({
      success: true,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      error: error.message || 'Failed to get unread count'
    });
  }
});

module.exports = router;