import React, { useState, useEffect } from 'react';
import './MainApp.css';
import Sidebar from './Sidebar';
import ServerView from './ServerView';
import { getMyServers } from '../services/api';
import { socketService } from '../services/socket';

function MainApp({ user, onLogout }) {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
    socketService.connect(user.id, localStorage.getItem('token'));
    
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  const loadServers = async () => {
    try {
      const data = await getMyServers();
      setServers(data);
      if (data.length > 0 && !selectedServer) {
        setSelectedServer(data[0]);
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerSelect = (server) => {
    setSelectedServer(server);
    setSelectedChannel(null);
    socketService.joinServer(server.id);
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    socketService.joinChannel(channel.id);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка серверов...</p>
      </div>
    );
  }

  return (
    <div className="main-app">
      <Sidebar
        user={user}
        servers={servers}
        selectedServer={selectedServer}
        onServerSelect={handleServerSelect}
        onLogout={onLogout}
      />
      {selectedServer ? (
        <ServerView
          server={selectedServer}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          user={user}
        />
      ) : (
        <div className="no-server-selected">
          <h2>Выберите сервер</h2>
          <p>Выберите сервер из списка слева или создайте новый</p>
        </div>
      )}
    </div>
  );
}

export default MainApp;

