import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(userId, token) {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
    
    this.socket = io(socketUrl, {
      auth: {
        token,
        userId
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinServer(serverId) {
    if (this.socket) {
      this.socket.emit('join_server', { serverId });
    }
  }

  leaveServer(serverId) {
    if (this.socket) {
      this.socket.emit('leave_server', { serverId });
    }
  }

  joinChannel(channelId) {
    if (this.socket) {
      this.socket.emit('join_channel', { channelId });
    }
  }

  leaveChannel(channelId) {
    if (this.socket) {
      this.socket.emit('leave_channel', { channelId });
    }
  }

  sendMessage(content, channelId) {
    if (this.socket) {
      this.socket.emit('send_message', { content, channelId });
    }
  }

  joinVoiceChannel(channelId) {
    if (this.socket) {
      this.socket.emit('join_voice_channel', { channelId });
    }
  }

  leaveVoiceChannel(channelId) {
    if (this.socket) {
      this.socket.emit('leave_voice_channel', { channelId });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      }
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();

