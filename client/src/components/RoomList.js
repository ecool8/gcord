import React from 'react';
import './RoomList.css';

function RoomList({ rooms, onJoinRoom, currentUserId }) {
  if (rooms.length === 0) {
    return (
      <div className="empty-state">
        <h2>Нет доступных комнат</h2>
        <p>Создайте первую комнату, чтобы начать общение!</p>
      </div>
    );
  }

  return (
    <div className="room-list">
      <h2 className="room-list-title">Мои комнаты</h2>
      <div className="rooms-grid">
        {rooms.map(room => (
          <div key={room.id} className="room-card">
            <div className="room-header">
              <h3 className="room-name">{room.name}</h3>
              {room.owner_id === currentUserId && (
                <span className="owner-badge">Владелец</span>
              )}
            </div>
            {room.description && (
              <p className="room-description">{room.description}</p>
            )}
            <div className="room-info">
              <span className="room-owner">👤 {room.owner_name}</span>
              {room.member_count > 0 && (
                <span className="room-members">
                  👥 {room.member_count} участников
                </span>
              )}
            </div>
            <div className="room-actions">
              <button
                className="btn btn-join"
                onClick={() => onJoinRoom(room.id)}
              >
                Присоединиться
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomList;

