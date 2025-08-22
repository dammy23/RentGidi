import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  receiver: {
    _id: string;
  };
  listingId: string;
  createdAt: string;
  isRead: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
  listingId: string;
}

class SocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  connect(token: string, userId: string) {
    console.log('SocketClient: Attempting to connect for user:', userId);

    if (!token || !userId) {
      console.error('SocketClient: Missing token or userId');
      return;
    }

    try {
      // Use the same host as the current page for Socket.IO connection
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const host = window.location.host;
      const socketUrl = `${protocol}//${host}`;
      
      console.log('SocketClient: Connecting to:', socketUrl);

      this.socket = io(`${socketUrl}/chat`, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        console.log('SocketClient: Connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Authenticate
        console.log('SocketClient: Sending authentication for user:', userId);
        this.socket?.emit('authenticate', { token, userId });
      });

      this.socket.on('authenticated', (data) => {
        console.log('SocketClient: Authenticated:', data);
        window.dispatchEvent(new CustomEvent('socket-authenticated', { detail: data }));
      });

      this.socket.on('auth_error', (error) => {
        console.error('SocketClient: Authentication error:', error);
        window.dispatchEvent(new CustomEvent('socket-auth-error', { detail: error }));
      });

      this.socket.on('receiveMessage', (message: Message) => {
        console.log('SocketClient: Received message:', message);
        window.dispatchEvent(new CustomEvent('socket-message-received', { detail: message }));
      });

      this.socket.on('messageRead', (data) => {
        console.log('SocketClient: Message read:', data);
        window.dispatchEvent(new CustomEvent('socket-message-read', { detail: data }));
      });

      this.socket.on('userTyping', (data: TypingUser) => {
        console.log('SocketClient: User typing:', data);
        window.dispatchEvent(new CustomEvent('socket-user-typing', { detail: data }));
      });

      this.socket.on('userStoppedTyping', (data) => {
        console.log('SocketClient: User stopped typing:', data);
        window.dispatchEvent(new CustomEvent('socket-user-stopped-typing', { detail: data }));
      });

      this.socket.on('roomJoined', (data) => {
        console.log('SocketClient: Joined room:', data);
        window.dispatchEvent(new CustomEvent('socket-room-joined', { detail: data }));
      });

      this.socket.on('room_error', (error) => {
        console.error('SocketClient: Room error:', error);
        window.dispatchEvent(new CustomEvent('socket-room-error', { detail: error }));
      });

      this.socket.on('message_error', (error) => {
        console.error('SocketClient: Message error:', error);
        window.dispatchEvent(new CustomEvent('socket-message-error', { detail: error }));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('SocketClient: Disconnected:', reason);
        this.isConnected = false;
        window.dispatchEvent(new CustomEvent('socket-disconnected', { detail: { reason } }));
      });

      this.socket.on('connect_error', (error) => {
        console.error('SocketClient: Connection error:', error);
        window.dispatchEvent(new CustomEvent('socket-connect-error', { detail: error }));
      });

    } catch (error) {
      console.error('SocketClient: Failed to create connection:', error);
    }
  }

  joinRoom(listingId: string) {
    if (this.socket && this.isConnected) {
      console.log('SocketClient: Joining room for listing:', listingId);
      this.socket.emit('joinRoom', { listingId });
    } else {
      console.warn('SocketClient: Cannot join room, not connected');
    }
  }

  sendMessage(listingId: string, receiverId: string, content: string) {
    if (this.socket && this.isConnected) {
      console.log('SocketClient: Sending message to listing:', listingId);
      this.socket.emit('sendMessage', { listingId, receiverId, content });
    } else {
      console.warn('SocketClient: Cannot send message, not connected');
      throw new Error('Not connected to chat server');
    }
  }

  markAsRead(messageId: string) {
    if (this.socket && this.isConnected) {
      console.log('SocketClient: Marking message as read:', messageId);
      this.socket.emit('markAsRead', { messageId });
    } else {
      console.warn('SocketClient: Cannot mark as read, not connected');
    }
  }

  startTyping(listingId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { listingId });
    }
  }

  stopTyping(listingId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('stopTyping', { listingId });
    }
  }

  disconnect() {
    console.log('SocketClient: Disconnecting');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();