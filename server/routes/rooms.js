const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');

// Получить все комнаты пользователя
router.get('/my-rooms', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const db = getDatabase();
    
    const rooms = await new Promise((resolve, reject) => {
      db.all(`
        SELECT r.*, u.username as owner_name,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count
        FROM rooms r
        JOIN users u ON r.owner_id = u.id
        WHERE r.id IN (
          SELECT room_id FROM room_members WHERE user_id = ?
        ) OR r.owner_id = ?
        ORDER BY r.created_at DESC
      `, [userId, userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Создать новую комнату
router.post('/', async (req, res) => {
  try {
    const { name, description, ownerId } = req.body;
    
    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Name and ownerId are required' });
    }

    const db = getDatabase();
    
    const roomId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO rooms (name, description, owner_id)
        VALUES (?, ?, ?)
      `, [name, description || '', ownerId], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Добавляем владельца в участники
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO room_members (room_id, user_id)
        VALUES (?, ?)
      `, [roomId, ownerId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Получаем созданную комнату
    const room = await new Promise((resolve, reject) => {
      db.get(`
        SELECT r.*, u.username as owner_name,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count
        FROM rooms r
        JOIN users u ON r.owner_id = u.id
        WHERE r.id = ?
      `, [roomId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room: ' + error.message });
  }
});

// Присоединиться к комнате
router.post('/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.body.userId || 1;

    const db = getDatabase();

    const room = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO room_members (room_id, user_id)
        VALUES (?, ?)
      `, [roomId, userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Получить информацию о комнате
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const db = getDatabase();

    const room = await new Promise((resolve, reject) => {
      db.get(`
        SELECT r.*, u.username as owner_name,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count
        FROM rooms r
        JOIN users u ON r.owner_id = u.id
        WHERE r.id = ?
      `, [roomId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

module.exports = router;
