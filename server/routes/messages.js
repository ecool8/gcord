const express = require('express');
const router = express.Router();
const { Message, Channel, User, ServerMember } = require('../models');
const { verifyToken } = require('./auth');

// Get messages for channel
router.get('/channel/:channelId', verifyToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const channel = await Channel.findByPk(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check access
    const isMember = await ServerMember.findOne({
      where: {
        serverId: channel.serverId,
        userId: req.userId
      }
    });

    const server = await require('../models').Server.findByPk(channel.serverId);
    if (server.ownerId !== req.userId && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.findAll({
      where: { channelId: req.params.channelId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Create message
router.post('/', verifyToken, async (req, res) => {
  try {
    const { content, channelId } = req.body;

    if (!content || !channelId) {
      return res.status(400).json({ error: 'Content and channelId are required' });
    }

    const channel = await Channel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check access
    const isMember = await ServerMember.findOne({
      where: {
        serverId: channel.serverId,
        userId: req.userId
      }
    });

    const server = await require('../models').Server.findByPk(channel.serverId);
    if (server.ownerId !== req.userId && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Text channels only for messages
    if (channel.type !== 'text') {
      return res.status(400).json({ error: 'Messages can only be sent to text channels' });
    }

    const message = await Message.create({
      content,
      channelId,
      userId: req.userId
    });

    const messageWithUser = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });

    res.status(201).json(messageWithUser);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

module.exports = router;
