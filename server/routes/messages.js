const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');

// Получить сообщения комнаты
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const db = getDatabase();

    const messages = await new Promise((resolve, reject) => {
      db.all(`
        SELECT m.*, u.username, u.email
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [roomId, limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.reverse()); // Переворачиваем для хронологического порядка
      });
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;

