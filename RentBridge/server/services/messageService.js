const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Property = require('../models/Property');

class MessageService {
  async sendMessage(senderId, receiverId, listingId, content, messageType = 'text') {
    console.log('MessageService: Sending message from', senderId, 'to', receiverId, 'about listing', listingId);

    try {
      // Verify sender and receiver exist
      const [sender, receiver] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId)
      ]);

      if (!sender || !receiver) {
        throw new Error('Sender or receiver not found');
      }

      // Verify property exists
      const property = await Property.findById(listingId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
        property: listingId
      }).populate('participants', 'name email avatar role');

      if (!conversation) {
        console.log('MessageService: Creating new conversation for listing:', listingId);
        conversation = new Conversation({
          participants: [senderId, receiverId],
          property: listingId,
          lastMessageAt: new Date()
        });
        await conversation.save();
        await conversation.populate('participants', 'name email avatar role');
      }

      // Create message
      const message = new Message({
        conversation: conversation._id,
        sender: senderId,
        recipient: receiverId,
        property: listingId,
        content: content.trim(),
        messageType,
        isRead: false
      });

      await message.save();

      // Update conversation with last message
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      console.log('MessageService: Message sent successfully with ID', message._id);

      return {
        message: await message.populate('sender', 'name email avatar role'),
        conversation
      };
    } catch (error) {
      console.error('MessageService: Error sending message:', error);
      throw error;
    }
  }

  async getConversationByListing(listingId, userId, page = 1, limit = 50) {
    console.log('MessageService: Getting conversation for listing', listingId, 'user', userId);

    try {
      // Verify property exists
      const property = await Property.findById(listingId).populate('owner', 'name email avatar role');
      if (!property) {
        throw new Error('Property not found');
      }

      // Find conversation for this listing involving the user
      const conversation = await Conversation.findOne({
        participants: userId,
        property: listingId
      })
      .populate('participants', 'name email avatar role')
      .populate('property', 'title images address owner');

      if (!conversation) {
        // Return empty conversation structure
        return {
          messages: [],
          conversation: null,
          property,
          pagination: {
            page: 1,
            limit,
            total: 0,
            pages: 0
          }
        };
      }

      // Get messages with pagination
      const skip = (page - 1) * limit;
      const messages = await Message.find({
        conversation: conversation._id
      })
      .populate('sender', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      // Reverse to show oldest first
      messages.reverse();

      const totalMessages = await Message.countDocuments({
        conversation: conversation._id
      });

      console.log('MessageService: Found', messages.length, 'messages in conversation');

      return {
        messages,
        conversation,
        property,
        pagination: {
          page,
          limit,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      };
    } catch (error) {
      console.error('MessageService: Error getting conversation:', error);
      throw error;
    }
  }

  async getUserConversationsList(userId) {
    console.log('MessageService: Getting conversations list for user', userId);

    try {
      const conversations = await Conversation.find({
        participants: userId,
        isActive: true
      })
      .populate('participants', 'name email avatar role')
      .populate('property', 'title images address owner')
      .populate('lastMessage', 'content createdAt')
      .sort({ lastMessageAt: -1 });

      // Calculate unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
          const unreadCount = await Message.countDocuments({
            conversation: conversation._id,
            recipient: userId,
            isRead: false
          });

          // Get the other participant (not the current user)
          const otherParticipant = conversation.participants.find(
            p => p._id.toString() !== userId
          );

          return {
            _id: conversation._id,
            listingId: conversation.property._id,
            property: conversation.property,
            otherParticipant,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCount
          };
        })
      );

      console.log('MessageService: Found', conversationsWithUnread.length, 'conversations');
      return conversationsWithUnread;
    } catch (error) {
      console.error('MessageService: Error getting conversations list:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId, userId) {
    console.log('MessageService: Marking message as read', messageId, 'by user', userId);

    try {
      const message = await Message.findOne({
        _id: messageId,
        recipient: userId
      });

      if (!message) {
        throw new Error('Message not found or access denied');
      }

      if (!message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
        await message.save();
        console.log('MessageService: Message marked as read');
      }

      return message;
    } catch (error) {
      console.error('MessageService: Error marking message as read:', error);
      throw error;
    }
  }

  async markConversationMessagesAsRead(conversationId, userId) {
    console.log('MessageService: Marking all messages as read in conversation', conversationId, 'for user', userId);

    try {
      // Verify user is participant in conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Mark all unread messages as read
      const result = await Message.updateMany({
        conversation: conversationId,
        recipient: userId,
        isRead: false
      }, {
        isRead: true,
        readAt: new Date()
      });

      console.log('MessageService: Marked', result.modifiedCount, 'messages as read');
      return result;
    } catch (error) {
      console.error('MessageService: Error marking conversation messages as read:', error);
      throw error;
    }
  }
}

module.exports = new MessageService();