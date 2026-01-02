import React from 'react';
import './ChannelList.css';

function ChannelList({ channels, selectedChannel, onChannelSelect }) {
  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice' || c.type === 'video');

  return (
    <div className="channel-list">
      {textChannels.length > 0 && (
        <div className="channel-category">
          <div className="category-header">
            <span>📝 ТЕКСТОВЫЕ КАНАЛЫ</span>
          </div>
          {textChannels.map(channel => (
            <div
              key={channel.id}
              className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
              onClick={() => onChannelSelect(channel)}
            >
              <span className="channel-icon">#</span>
              <span className="channel-name">{channel.name}</span>
            </div>
          ))}
        </div>
      )}

      {voiceChannels.length > 0 && (
        <div className="channel-category">
          <div className="category-header">
            <span>🎤 ГОЛОСОВЫЕ КАНАЛЫ</span>
          </div>
          {voiceChannels.map(channel => (
            <div
              key={channel.id}
              className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
              onClick={() => onChannelSelect(channel)}
            >
              <span className="channel-icon">🔊</span>
              <span className="channel-name">{channel.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChannelList;

