class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  connect(userId: string, token: string) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket: Connection already in progress, skipping');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket: Already connected, skipping');
      return;
    }

    console.log('WebSocket: Attempting to connect for user:', userId);
    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      console.log('WebSocket: Current location:', window.location.href);
      console.log('WebSocket: Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket: Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Authenticate
        this.send({
          type: 'authenticate',
          userId: userId,
          token: token
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket: Received message:', data);

          switch (data.type) {
            case 'connection_established':
              console.log('WebSocket: Connection established');
              break;
            case 'authenticated':
              console.log('WebSocket: Authentication successful');
              break;
            case 'notification':
              console.log('WebSocket: New notification received:', data.data);
              window.dispatchEvent(new CustomEvent('websocket-notification', {
                detail: data.data
              }));
              break;
            case 'unread_count_update':
              console.log('WebSocket: Unread count update:', data.data);
              window.dispatchEvent(new CustomEvent('websocket-unread-count', {
                detail: data.data
              }));
              break;
            case 'error':
              console.error('WebSocket: Server error:', data.message);
              break;
            default:
              console.log('WebSocket: Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('WebSocket: Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket: Connection closed:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;

        if (this.shouldReconnect) {
          this.attemptReconnect(userId, token);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket: Connection error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection:', error);
      this.isConnecting = false;
      if (this.shouldReconnect) {
        this.attemptReconnect(userId, token);
      }
    }
  }

  private attemptReconnect(userId: string, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.shouldReconnect) {
      this.reconnectAttempts++;
      console.log(`WebSocket: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.reconnectTimeout = setTimeout(() => {
        this.connect(userId, token);
      }, this.reconnectInterval);
    } else {
      console.error('WebSocket: Max reconnection attempts reached or reconnection disabled');
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket: Sending message:', data);
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket: Cannot send message, connection not open. ReadyState:', this.ws?.readyState);
    }
  }

  disconnect() {
    console.log('WebSocket: Disconnecting');
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  getConnectionState() {
    return {
      readyState: this.ws?.readyState,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      shouldReconnect: this.shouldReconnect
    };
  }
}

export const websocketClient = new WebSocketClient();