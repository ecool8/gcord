const { getDatabase } = require('../database/db');

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Присоединение к комнате
    socket.on('join_room', async (data) => {
      const { roomId, userId } = data;
      
      if (roomId) {
        socket.join(`room_${roomId}`);
        console.log(`User ${userId} joined room ${roomId}`);
        
        // Уведомляем других пользователей в комнате
        socket.to(`room_${roomId}`).emit('user_joined', { userId, socketId: socket.id });
        
        // Отправляем подтверждение
        socket.emit('room_joined', { roomId });
      }
    });

    // Покидание комнаты
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.to(`room_${roomId}`).emit('user_left', { socketId: socket.id });
        socket.leave(`room_${roomId}`);
        console.log(`User left room ${roomId}`);
      }
    });

    // WebRTC signaling для аудио комнаты
    socket.on('audio_offer', (data) => {
      socket.to(data.targetSocketId).emit('audio_offer', {
        offer: data.offer,
        senderSocketId: socket.id
      });
    });

    socket.on('audio_answer', (data) => {
      socket.to(data.targetSocketId).emit('audio_answer', {
        answer: data.answer,
        senderSocketId: socket.id
      });
    });

    socket.on('audio_ice_candidate', (data) => {
      socket.to(data.targetSocketId).emit('audio_ice_candidate', {
        candidate: data.candidate,
        senderSocketId: socket.id
      });
    });

    // Отправка сообщения
    socket.on('send_message', async (data) => {
      const { roomId, userId, content, username } = data;

      if (!roomId || !userId || !content) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      try {
        const db = getDatabase();
        
        // Сохраняем сообщение в базу данных
        const messageId = await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO messages (room_id, user_id, content)
            VALUES (?, ?, ?)
          `, [roomId, userId, content], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });

        // Получаем полную информацию о сообщении
        const message = await new Promise((resolve, reject) => {
          db.get(`
            SELECT m.*, u.username, u.email
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
          `, [messageId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        // Отправляем сообщение всем в комнате
        io.to(`room_${roomId}`).emit('new_message', message);
        
        console.log(`Message sent in room ${roomId} by user ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Вход в аудио комнату
    socket.on('join_audio_room', (data) => {
      const { roomId, userId } = data;
      if (roomId) {
        socket.join(`audio_room_${roomId}`);
        // Уведомляем других пользователей
        socket.to(`audio_room_${roomId}`).emit('user_joined_audio', {
          socketId: socket.id,
          userId: userId,
          username: 'User' // Можно получить из базы данных
        });
        console.log(`User ${userId} joined audio room ${roomId}`);
      }
    });

    // Выход из аудио комнаты
    socket.on('leave_audio_room', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.to(`audio_room_${roomId}`).emit('user_left_audio', {
          socketId: socket.id
        });
        socket.leave(`audio_room_${roomId}`);
        console.log(`User left audio room ${roomId}`);
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });
}

module.exports = { setupSocketIO };

