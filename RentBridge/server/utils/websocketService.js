const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
  }

  initialize(server) {
    console.log('WebSocketService: Initializing WebSocket server');

    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws, req) => {
      console.log('WebSocketService: New WebSocket connection from:', req.socket.remoteAddress);

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!ws.userId) {
          console.log('WebSocketService: Connection timeout - no authentication received');
          ws.close(1008, 'Authentication timeout');
        }
      }, 30000); // 30 seconds to authenticate

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('WebSocketService: Received message type:', data.type);
          this.handleMessage(ws, data, connectionTimeout);
        } catch (error) {
          console.error('WebSocketService: Error parsing message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', (code, reason) => {
        console.log('WebSocketService: Connection closed:', code, reason.toString());
        clearTimeout(connectionTimeout);
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocketService: WebSocket error:', error);
        clearTimeout(connectionTimeout);
        this.removeClient(ws);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to RentBridge notifications'
      }));
    });

    this.wss.on('error', (error) => {
      console.error('WebSocketService: Server error:', error);
    });

    console.log('WebSocketService: WebSocket server initialized on path /ws');
  }

  async handleMessage(ws, data, connectionTimeout) {
    console.log('WebSocketService: Handling message type:', data.type);

    switch (data.type) {
      case 'authenticate':
        await this.authenticateClient(ws, data.userId, data.token, connectionTimeout);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.log('WebSocketService: Unknown message type:', data.type);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }

  async authenticateClient(ws, userId, token, connectionTimeout) {
    console.log('WebSocketService: Authenticating client for user:', userId);

    if (!userId || !token) {
      console.log('WebSocketService: Missing userId or token');
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'User ID and token required for authentication' 
      }));
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('WebSocketService: Token verified for user:', decoded.userId);

      if (decoded.userId !== userId) {
        console.log('WebSocketService: Token userId mismatch');
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Token does not match provided user ID' 
        }));
        return;
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        console.log('WebSocketService: User not found:', userId);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'User not found' 
        }));
        return;
      }

      // Clear authentication timeout
      clearTimeout(connectionTimeout);

      // Store client connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }

      this.clients.get(userId).add(ws);
      ws.userId = userId;
      ws.userRole = user.role;

      console.log('WebSocketService: Client authenticated successfully for user:', userId);
      ws.send(JSON.stringify({
        type: 'authenticated',
        message: 'Successfully authenticated',
        userId,
        role: user.role
      }));

    } catch (error) {
      console.error('WebSocketService: Authentication failed:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Authentication failed: ' + error.message 
      }));
    }
  }

  removeClient(ws) {
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId).delete(ws);

      // Clean up empty sets
      if (this.clients.get(ws.userId).size === 0) {
        this.clients.delete(ws.userId);
      }

      console.log('WebSocketService: Removed client for user:', ws.userId);
    }
  }

  async broadcastToUser(userId, type, data) {
    console.log('WebSocketService: Broadcasting to user:', userId, 'type:', type);

    if (!this.clients.has(userId)) {
      console.log('WebSocketService: No active connections for user:', userId);
      return false;
    }

    const userConnections = this.clients.get(userId);
    const message = JSON.stringify({ 
      type, 
      data, 
      timestamp: new Date().toISOString() 
    });
    let sentCount = 0;

    // Create a copy of the set to avoid modification during iteration
    const connections = Array.from(userConnections);
    
    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          sentCount++;
        } catch (error) {
          console.error('WebSocketService: Error sending message to client:', error);
          this.removeClient(ws);
        }
      } else {
        console.log('WebSocketService: Removing closed connection for user:', userId);
        this.removeClient(ws);
      }
    }

    console.log('WebSocketService: Sent message to', sentCount, 'connections for user:', userId);
    return sentCount > 0;
  }

  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  getConnectionCount() {
    let total = 0;
    for (const connections of this.clients.values()) {
      total += connections.size;
    }
    return total;
  }

  getServerStats() {
    return {
      connectedUsers: this.getConnectedUsers().length,
      totalConnections: this.getConnectionCount(),
      serverRunning: !!this.wss
    };
  }
}

// Export singleton instance
const websocketService = new WebSocketService();

module.exports = {
  initialize: (server) => websocketService.initialize(server),
  broadcastToUser: (userId, type, data) => websocketService.broadcastToUser(userId, type, data),
  getConnectedUsers: () => websocketService.getConnectedUsers(),
  getConnectionCount: () => websocketService.getConnectionCount(),
  getServerStats: () => websocketService.getServerStats()
};