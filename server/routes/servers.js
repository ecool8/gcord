const express = require('express');
const router = express.Router();
const { Server, ServerMember, Channel, User } = require('../models');
const { verifyToken } = require('./auth');
const { Op } = require('sequelize');

// Get user's servers
router.get('/my-servers', verifyToken, async (req, res) => {
  try {
    // Get servers where user is owner or member
    const memberServers = await ServerMember.findAll({
      where: { userId: req.userId },
      include: [{ model: Server, as: 'server' }]
    });
    
    const ownedServers = await Server.findAll({
      where: { ownerId: req.userId }
    });

    const serverIds = [
      ...ownedServers.map(s => s.id),
      ...memberServers.map(m => m.server?.id).filter(Boolean)
    ];

    const servers = await Server.findAll({
      where: {
        id: serverIds.length > 0 ? { [Op.in]: serverIds } : [-1]
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Channel,
          as: 'channels',
          attributes: ['id', 'name', 'type', 'position'],
          separate: true,
          order: [['position', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(servers);
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Failed to get servers' });
  }
});

// Create server
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    // Create server
    const server = await Server.create({
      name,
      description,
      ownerId: req.userId
    });

    // Add owner as member
    await ServerMember.create({
      serverId: server.id,
      userId: req.userId,
      role: 'owner'
    });

    // Create default channels
    await Channel.create({
      name: 'general',
      type: 'text',
      serverId: server.id,
      position: 0
    });

    await Channel.create({
      name: 'voice',
      type: 'voice',
      serverId: server.id,
      position: 1
    });

    // Get server with relations
    const serverWithData = await Server.findByPk(server.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Channel,
          as: 'channels',
          attributes: ['id', 'name', 'type', 'position'],
          order: [['position', 'ASC']]
        }
      ]
    });

    res.status(201).json(serverWithData);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Failed to create server' });
  }
});

// Get server by ID
router.get('/:serverId', verifyToken, async (req, res) => {
  try {
    const server = await Server.findByPk(req.params.serverId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Channel,
          as: 'channels',
          attributes: ['id', 'name', 'type', 'position'],
          separate: true,
          order: [['position', 'ASC']]
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'avatar', 'status'],
          through: { attributes: ['role'] }
        }
      ]
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if user is member
    const isMember = await ServerMember.findOne({
      where: {
        serverId: server.id,
        userId: req.userId
      }
    });

    if (!isMember && server.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(server);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Failed to get server' });
  }
});

// Join server
router.post('/:serverId/join', verifyToken, async (req, res) => {
  try {
    const server = await Server.findByPk(req.params.serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if already member
    const existingMember = await ServerMember.findOne({
      where: {
        serverId: server.id,
        userId: req.userId
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member' });
    }

    // Add as member
    await ServerMember.create({
      serverId: server.id,
      userId: req.userId,
      role: 'member'
    });

    res.json({ message: 'Successfully joined server' });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Failed to join server' });
  }
});

module.exports = router;

