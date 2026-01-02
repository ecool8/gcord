const User = require('./User');
const Server = require('./Server');
const Channel = require('./Channel');
const Message = require('./Message');
const ServerMember = require('./ServerMember');

// Define associations
User.hasMany(Server, { foreignKey: 'ownerId', as: 'ownedServers' });
Server.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Server.hasMany(Channel, { foreignKey: 'serverId', as: 'channels' });
Channel.belongsTo(Server, { foreignKey: 'serverId', as: 'server' });

User.hasMany(Message, { foreignKey: 'userId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Channel.hasMany(Message, { foreignKey: 'channelId', as: 'messages' });
Message.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

// Many-to-many: Users and Servers
User.belongsToMany(Server, { 
  through: ServerMember, 
  foreignKey: 'userId',
  as: 'servers' 
});
Server.belongsToMany(User, { 
  through: ServerMember, 
  foreignKey: 'serverId',
  as: 'members' 
});

module.exports = {
  User,
  Server,
  Channel,
  Message,
  ServerMember
};

