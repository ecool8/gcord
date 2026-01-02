const { Message, Channel, ServerMember, User } = require('../models');
const jwt = require('jsonwebtoken');

function setupSocketIO(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id} (User ID: ${socket.userId})`);

    // Join server room
    socket.on('join_server', async (data) => {
      const { serverId } = data;
      if (serverId) {
        socket.join(`server_${serverId}`);
        console.log(`User ${socket.userId} joined server ${serverId}`);
      }
    });

    // Leave server room
    socket.on('leave_server', (data) => {
      const { serverId } = data;
      if (serverId) {
        socket.leave(`server_${serverId}`);
        console.log(`User ${socket.userId} left server ${serverId}`);
      }
    });

    // Join channel room
    socket.on('join_channel', async (data) => {
      const { channelId } = data;
      if (channelId) {
        socket.join(`channel_${channelId}`);
        console.log(`User ${socket.userId} joined channel ${channelId}`);
      }
    });

    // Leave channel room
    socket.on('leave_channel', (data) => {
      const { channelId } = data;
      if (channelId) {
        socket.leave(`channel_${channelId}`);
        console.log(`User ${socket.userId} left channel ${channelId}`);
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { content, channelId } = data;

        if (!content || !channelId) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Verify access
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        const isMember = await ServerMember.findOne({
          where: {
            serverId: channel.serverId,
            userId: socket.userId
          }
        });

        if (channel.type !== 'text') {
          socket.emit('error', { message: 'Messages can only be sent to text channels' });
          return;
        }

        // Create message
        const message = await Message.create({
          content,
          channelId,
          userId: socket.userId
        });

        const messageWithUser = await Message.findByPk(message.id, {
          include: [
            {
              model: require('../models').User,
              as: 'user',
              attributes: ['id', 'username', 'avatar']
            }
          ]
        });

        // Broadcast to channel
        io.to(`channel_${channelId}`).emit('new_message', messageWithUser);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // WebRTC signaling for voice/video channels
    socket.on('webrtc_offer', (data) => {
      socket.to(data.targetSocketId).emit('webrtc_offer', {
        offer: data.offer,
        senderSocketId: socket.id,
        channelId: data.channelId
      });
    });

    socket.on('webrtc_answer', (data) => {
      socket.to(data.targetSocketId).emit('webrtc_answer', {
        answer: data.answer,
        senderSocketId: socket.id
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      socket.to(data.targetSocketId).emit('webrtc_ice_candidate', {
        candidate: data.candidate,
        senderSocketId: socket.id
      });
    });

    // User joined voice/video channel
    socket.on('join_voice_channel', async (data) => {
      const { channelId } = data;
      if (channelId) {
        socket.join(`voice_channel_${channelId}`);
        
        // Get user info
        const user = await User.findByPk(socket.userId, {
          attributes: ['id', 'username', 'avatar']
        });
        
        socket.to(`voice_channel_${channelId}`).emit('user_joined_voice', {
          socketId: socket.id,
          userId: socket.userId,
          username: user?.username
        });
      }
    });

    // User left voice/video channel
    socket.on('leave_voice_channel', (data) => {
      const { channelId } = data;
      if (channelId) {
        socket.to(`voice_channel_${channelId}`).emit('user_left_voice', {
          socketId: socket.id
        });
        socket.leave(`voice_channel_${channelId}`);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocketIO };
