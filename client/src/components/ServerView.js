import React, { useState, useEffect } from 'react';
import './ServerView.css';
import ChannelList from './ChannelList';
import ChatView from './ChatView';
import VoiceView from './VoiceView';

function ServerView({ server, selectedChannel, onChannelSelect, user }) {
  const [channels, setChannels] = useState(server.channels || []);

  useEffect(() => {
    setChannels(server.channels || []);
  }, [server]);

  const handleChannelSelect = (channel) => {
    onChannelSelect(channel);
  };

  return (
    <div className="server-view">
      <div className="channels-sidebar">
        <div className="server-header">
          <h2>{server.name}</h2>
        </div>
        <ChannelList
          channels={channels}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
        />
      </div>
      <div className="main-content">
        {selectedChannel ? (
          selectedChannel.type === 'text' ? (
            <ChatView channel={selectedChannel} user={user} />
          ) : (
            <VoiceView channel={selectedChannel} user={user} />
          )
        ) : (
          <div className="no-channel-selected">
            <h2>Выберите канал</h2>
            <p>Выберите канал из списка слева</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServerView;

