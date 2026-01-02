const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/sequelize');

const Channel = sequelize.define('Channel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100],
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM('text', 'voice', 'video'),
    allowNull: false,
    defaultValue: 'text'
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
  position: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'channels',
  timestamps: true
});

module.exports = Channel;

