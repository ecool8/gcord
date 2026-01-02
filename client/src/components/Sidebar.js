import React, { useState } from 'react';
import './Sidebar.css';
import { createServer } from '../services/api';

function Sidebar({ user, servers, selectedServer, onServerSelect, onLogout }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serverName, setServerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    setLoading(true);
    try {
      const newServer = await createServer(serverName, '');
      onServerSelect(newServer);
      setShowCreateModal(false);
      setServerName('');
      window.location.reload(); // Reload to get updated server list
    } catch (error) {
      console.error('Error creating server:', error);
      alert('Ошибка создания сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">{user.username[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="username">{user.username}</div>
            <div className="user-status online">Online</div>
          </div>
        </div>
        <button className="btn-icon" onClick={onLogout} title="Выйти">
          ⚙️
        </button>
      </div>

      <div className="servers-list">
        <div className="servers-header">
          <h3>Серверы</h3>
          <button className="btn-add-server" onClick={() => setShowCreateModal(true)}>
            +
          </button>
        </div>
        {servers.map(server => (
          <div
            key={server.id}
            className={`server-item ${selectedServer?.id === server.id ? 'active' : ''}`}
            onClick={() => onServerSelect(server)}
            title={server.name}
          >
            {server.name[0].toUpperCase()}
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Создать сервер</h2>
            <form onSubmit={handleCreateServer}>
              <div className="form-group">
                <label>Название сервера</label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Введите название"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;

