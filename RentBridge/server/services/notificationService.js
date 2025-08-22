const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const { broadcastToUser } = require('../utils/websocketService');

class NotificationService {
  async createNotification(recipientId, title, message, type, senderInfo = null, additionalData = {}, priority = 'normal') {
    console.log('NotificationService: Creating notification for user', recipientId);

    try {
      // Verify recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Create notification
      const notification = new Notification({
        recipient: recipientId,
        sender: senderInfo?.senderId || null,
        title: title.trim(),
        message: message.trim(),
        type,
        data: additionalData,
        priority,
        read: false
      });

      await notification.save();
      await notification.populate('sender', 'name email avatar role');

      console.log('NotificationService: Notification created with ID', notification._id);

      // Send real-time notification via WebSocket
      try {
        await broadcastToUser(recipientId, 'notification', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          createdAt: notification.timeAgo,
          sender: notification.sender,
          data: notification.data,
          priority: notification.priority
        });
        console.log('NotificationService: WebSocket notification sent to user', recipientId);
      } catch (wsError) {
        console.error('NotificationService: WebSocket notification failed:', wsError.message);
        // Don't throw error - WebSocket failure shouldn't break notification creation
      }

      // Send email notification
      try {
        await this.sendEmailNotification(recipient, notification);
        notification.emailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
        console.log('NotificationService: Email notification sent to', recipient.email);
      } catch (emailError) {
        console.error('NotificationService: Email notification failed:', emailError.message);
        // Don't throw error - Email failure shouldn't break notification creation
      }

      return notification;
    } catch (error) {
      console.error('NotificationService: Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    console.log('NotificationService: Getting notifications for user', userId, 'page', page, 'limit', limit);

    try {
      const skip = (page - 1) * limit;
      const query = { recipient: userId };
      
      if (unreadOnly) {
        query.read = false;
      }

      const [notifications, totalCount] = await Promise.all([
        Notification.find(query)
          .populate('sender', 'name email avatar role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const unreadCount = await Notification.countDocuments({ 
        recipient: userId, 
        read: false 
      });

      console.log('NotificationService: Found', notifications.length, 'notifications for user');

      return {
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        unreadCount
      };
    } catch (error) {
      console.error('NotificationService: Error getting notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    console.log('NotificationService: Marking notification as read', notificationId, 'by user', userId);

    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
        console.log('NotificationService: Notification marked as read');

        // Broadcast updated unread count via WebSocket
        try {
          const unreadCount = await Notification.countDocuments({ 
            recipient: userId, 
            read: false 
          });
          
          await broadcastToUser(userId, 'unread_count_update', { unreadCount });
        } catch (wsError) {
          console.error('NotificationService: WebSocket unread count update failed:', wsError.message);
        }
      }

      return notification;
    } catch (error) {
      console.error('NotificationService: Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId) {
    console.log('NotificationService: Marking all notifications as read for user', userId);

    try {
      const result = await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true, readAt: new Date() }
      );

      console.log('NotificationService: Marked', result.modifiedCount, 'notifications as read');

      // Broadcast updated unread count via WebSocket
      try {
        await broadcastToUser(userId, 'unread_count_update', { unreadCount: 0 });
      } catch (wsError) {
        console.error('NotificationService: WebSocket unread count update failed:', wsError.message);
      }

      return result;
    } catch (error) {
      console.error('NotificationService: Error marking all notifications as read:', error);
      throw error;
    }
  }

  async sendEmailNotification(recipient, notification) {
    const emailSubject = `RentBridge: ${notification.title}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">RentBridge Notification</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">${notification.title}</h3>
          <p style="color: #475569; line-height: 1.6;">${notification.message}</p>
          ${notification.data && Object.keys(notification.data).length > 0 ? 
            `<div style="margin-top: 15px; padding: 10px; background-color: #e2e8f0; border-radius: 4px;">
              <small style="color: #64748b;">Additional details available in your dashboard.</small>
            </div>` : ''
          }
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in RentBridge
          </a>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>This is an automated notification from RentBridge. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    await sendEmail(recipient.email, emailSubject, emailBody);
  }

  async deleteNotification(notificationId, userId) {
    console.log('NotificationService: Deleting notification', notificationId, 'for user', userId);

    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipient: userId
      });

      if (result.deletedCount === 0) {
        throw new Error('Notification not found or access denied');
      }

      console.log('NotificationService: Notification deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('NotificationService: Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();