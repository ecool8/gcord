const express = require('express');
const router = express.Router();
const { Channel, Server, ServerMember } = require('../models');
const { verifyToken } = require('./auth');

// Get channels for server
router.get('/server/:serverId', verifyToken, async (req, res) => {
  try {
    // Check if user is member
    const isMember = await ServerMember.findOne({
      where: {
        serverId: req.params.serverId,
        userId: req.userId
      }
    });

    const server = await Server.findByPk(req.params.serverId);
    if (server && server.ownerId !== req.userId && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const channels = await Channel.findAll({
      where: { serverId: req.params.serverId },
      order: [['position', 'ASC']]
    });

    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Failed to get channels' });
  }
});

// Create channel
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, type, serverId, position } = req.body;

    if (!name || !serverId) {
      return res.status(400).json({ error: 'Name and serverId are required' });
    }

    // Check if user is owner or admin
    const server = await Server.findByPk(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const member = await ServerMember.findOne({
      where: {
        serverId: serverId,
        userId: req.userId
      }
    });

    if (server.ownerId !== req.userId && (!member || member.role === 'member')) {
      return res.status(403).json({ error: 'Only owners and admins can create channels' });
    }

    const channel = await Channel.create({
      name,
      type: type || 'text',
      serverId,
      position: position || 0
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Get channel by ID
router.get('/:channelId', verifyToken, async (req, res) => {
  try {
    const channel = await Channel.findByPk(req.params.channelId, {
      include: [
        {
          model: Server,
          as: 'server',
          include: [
            {
              model: ServerMember,
              where: { userId: req.userId },
              required: false
            }
          ]
        }
      ]
    });

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

    const server = await Server.findByPk(channel.serverId);
    if (server.ownerId !== req.userId && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Failed to get channel' });
  }
});

module.exports = router;

