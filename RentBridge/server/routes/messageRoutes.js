const express = require('express');
const router = express.Router();
const messageService = require('../services/messageService');

console.log('MessageRoutes: About to import auth middleware');
const auth = require('./middleware/auth');
console.log('MessageRoutes: Auth imported:', auth);
console.log('MessageRoutes: Auth.authenticateToken type:', typeof auth.authenticateToken);

// Get conversation history by listing ID
router.get('/:listingId', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/messages/:listingId - Get conversation for listing:', req.params.listingId);

  try {
    const { listingId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await messageService.getConversationByListing(
      listingId,
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      error: error.message || 'Failed to get conversation'
    });
  }
});

// Send a new message
router.post('/', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/messages - Send message request from user:', req.user.id);

  try {
    const { listingId, receiverId, content } = req.body;

    if (!listingId || !receiverId || !content) {
      return res.status(400).json({
        error: 'Listing ID, receiver ID, and message content are required'
      });
    }

    const result = await messageService.sendMessage(
      req.user.id,
      receiverId,
      listingId,
      content.trim(),
      'text'
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: result.message._id,
      data: result
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: error.message || 'Failed to send message'
    });
  }
});

// Mark message as read
router.patch('/:id/read', auth.authenticateToken, async (req, res) => {
  console.log('PATCH /api/messages/:id/read - Mark message as read:', req.params.id);

  try {
    const message = await messageService.markMessageAsRead(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      error: error.message || 'Failed to mark message as read'
    });
  }
});

// Get user's conversations (for sidebar)
router.get('/conversations/list', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/messages/conversations/list - Get conversations for user:', req.user.id);

  try {
    const conversations = await messageService.getUserConversationsList(req.user.id);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      error: error.message || 'Failed to get conversations'
    });
  }
});

module.exports = router;