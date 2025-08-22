const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.clients = new Map(); // userId -> Set of socket connections
    this.rooms = new Map(); // listingId -> Set of userIds
  }

  initialize(server) {
    console.log('SocketService: Initializing Socket.IO server');

    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:5173", "https://preview-17grg4pk.ui.pythagora.ai"],
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    // Chat namespace
    const chatNamespace = this.io.of('/chat');

    chatNamespace.on('connection', (socket) => {
      console.log('SocketService: New chat connection:', socket.id);

      socket.on('authenticate', async (data) => {
        console.log('SocketService: Authentication request received:', { userId: data.userId, hasToken: !!data.token });
        try {
          await this.authenticateSocket(socket, data.token, data.userId);
        } catch (error) {
          console.error('SocketService: Authentication failed:', error);
          socket.emit('auth_error', { message: 'Authentication failed: ' + error.message });
        }
      });

      socket.on('joinRoom', (data) => {
        this.handleJoinRoom(socket, data.listingId);
      });

      socket.on('sendMessage', async (data) => {
        try {
          await this.handleSendMessage(socket, data);
        } catch (error) {
          console.error('SocketService: Error sending message:', error);
          socket.emit('message_error', { message: 'Failed to send message' });
        }
      });

      socket.on('markAsRead', async (data) => {
        try {
          await this.handleMarkAsRead(socket, data);
        } catch (error) {
          console.error('SocketService: Error marking as read:', error);
        }
      });

      socket.on('typing', (data) => {
        this.handleTyping(socket, data);
      });

      socket.on('stopTyping', (data) => {
        this.handleStopTyping(socket, data);
      });

      socket.on('disconnect', () => {
        console.log('SocketService: Chat connection disconnected:', socket.id);
        this.removeSocket(socket);
      });
    });

    console.log('SocketService: Socket.IO server initialized with chat namespace');
  }

  async authenticateSocket(socket, token, userId) {
    console.log('SocketService: Authenticating socket for user:', userId);
    
    if (!token || !userId) {
      throw new Error('No token or userId provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('SocketService: Token decoded:', { decodedUserId: decoded.userId, providedUserId: userId });
      
      if (decoded.userId !== userId) {
        throw new Error('Token userId does not match provided userId');
      }

      const user = await User.findById(userId).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;

      // Store socket connection
      if (!this.clients.has(socket.userId)) {
        this.clients.set(socket.userId, new Set());
      }
      this.clients.get(socket.userId).add(socket);

      socket.emit('authenticated', {
        userId: socket.userId,
        role: socket.userRole,
        name: socket.userName
      });

      console.log('SocketService: Socket authenticated successfully for user:', socket.userId);
    } catch (error) {
      console.error('SocketService: Authentication error:', error);
      throw new Error('Invalid token: ' + error.message);
    }
  }

  handleJoinRoom(socket, listingId) {
    if (!socket.userId || !listingId) {
      socket.emit('room_error', { message: 'Authentication required to join room' });
      return;
    }

    const roomName = `listing_${listingId}`;
    socket.join(roomName);

    // Track room membership
    if (!this.rooms.has(listingId)) {
      this.rooms.set(listingId, new Set());
    }
    this.rooms.get(listingId).add(socket.userId);

    socket.emit('roomJoined', { listingId, roomName });
    console.log('SocketService: User', socket.userId, 'joined room:', roomName);
  }

  async handleSendMessage(socket, data) {
    const { listingId, receiverId, content } = data;

    if (!socket.userId || !listingId || !receiverId || !content) {
      socket.emit('message_error', { message: 'Missing required fields' });
      return;
    }

    // Import here to avoid circular dependency
    const messageService = require('../services/messageService');

    try {
      const result = await messageService.sendMessage(
        socket.userId,
        receiverId,
        listingId,
        content.trim(),
        'text'
      );

      const roomName = `listing_${listingId}`;

      // Broadcast to room
      this.io.of('/chat').to(roomName).emit('receiveMessage', {
        _id: result.message._id,
        content: result.message.content,
        sender: {
          _id: socket.userId,
          name: socket.userName,
          role: socket.userRole
        },
        receiver: {
          _id: receiverId
        },
        listingId,
        createdAt: result.message.createdAt,
        isRead: false
      });

      console.log('SocketService: Message sent to room:', roomName);
    } catch (error) {
      socket.emit('message_error', { message: error.message });
    }
  }

  async handleMarkAsRead(socket, data) {
    const { messageId } = data;

    if (!socket.userId || !messageId) {
      return;
    }

    // Import here to avoid circular dependency
    const messageService = require('../services/messageService');

    try {
      await messageService.markMessageAsRead(messageId, socket.userId);

      // Notify sender that message was read
      const userSockets = this.clients.get(socket.userId);
      if (userSockets) {
        userSockets.forEach(userSocket => {
          userSocket.emit('messageRead', { messageId });
        });
      }

      console.log('SocketService: Message marked as read:', messageId);
    } catch (error) {
      console.error('SocketService: Error marking message as read:', error);
    }
  }

  handleTyping(socket, data) {
    const { listingId } = data;
    if (!socket.userId || !listingId) return;

    const roomName = `listing_${listingId}`;
    socket.to(roomName).emit('userTyping', {
      userId: socket.userId,
      userName: socket.userName,
      listingId
    });
  }

  handleStopTyping(socket, data) {
    const { listingId } = data;
    if (!socket.userId || !listingId) return;

    const roomName = `listing_${listingId}`;
    socket.to(roomName).emit('userStoppedTyping', {
      userId: socket.userId,
      listingId
    });
  }

  removeSocket(socket) {
    if (socket.userId && this.clients.has(socket.userId)) {
      this.clients.get(socket.userId).delete(socket);

      // Clean up empty sets
      if (this.clients.get(socket.userId).size === 0) {
        this.clients.delete(socket.userId);
      }

      // Remove from rooms
      for (const [listingId, userIds] of this.rooms.entries()) {
        userIds.delete(socket.userId);
        if (userIds.size === 0) {
          this.rooms.delete(listingId);
        }
      }

      console.log('SocketService: Removed socket for user:', socket.userId);
    }
  }

  // Broadcast to specific user across all their connections
  async broadcastToUser(userId, event, data) {
    console.log('SocketService: Broadcasting to user:', userId, 'event:', event);

    if (!this.clients.has(userId)) {
      console.log('SocketService: No active connections for user:', userId);
      return false;
    }

    const userSockets = this.clients.get(userId);
    let sentCount = 0;

    for (const socket of userSockets) {
      if (socket.connected) {
        try {
          socket.emit(event, data);
          sentCount++;
        } catch (error) {
          console.error('SocketService: Error sending to socket:', error);
          this.removeSocket(socket);
        }
      } else {
        this.removeSocket(socket);
      }
    }

    console.log('SocketService: Sent to', sentCount, 'connections for user:', userId);
    return sentCount > 0;
  }

  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  getConnectionCount() {
    let total = 0;
    for (const sockets of this.clients.values()) {
      total += sockets.size;
    }
    return total;
  }
}

// Export singleton instance
const socketService = new SocketService();

module.exports = {
  initialize: (server) => socketService.initialize(server),
  broadcastToUser: (userId, event, data) => socketService.broadcastToUser(userId, event, data),
  getConnectedUsers: () => socketService.getConnectedUsers(),
  getConnectionCount: () => socketService.getConnectionCount()
};