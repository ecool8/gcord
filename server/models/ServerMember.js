const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/sequelize');

const ServerMember = sequelize.define('ServerMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'server_id',
    references: {
      model: 'servers',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    defaultValue: 'member'
  }
}, {
  tableName: 'server_members',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['server_id', 'user_id']
    }
  ]
});

module.exports = ServerMember;

