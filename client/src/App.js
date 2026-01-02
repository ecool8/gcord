import React, { useState, useEffect } from 'react';
import './App.css';
import RoomList from './components/RoomList';
import CreateRoomModal from './components/CreateRoomModal';
import LoginModal from './components/LoginModal';
import { getRooms, createRoom, joinRoom } from './services/api';

function App() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Загружаем пользователя из localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentUserId(userData.id);
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadRooms();
    } else {
      setLoading(false);
    }
  }, [currentUserId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await getRooms(currentUserId);
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (roomData) => {
    if (!currentUserId) {
      alert('Пожалуйста, войдите в систему для создания комнаты');
      setShowLoginModal(true);
      return;
    }
    
    try {
      const newRoom = await createRoom({
        ...roomData,
        ownerId: currentUserId,
      });
      setRooms([newRoom, ...rooms]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Ошибка при создании комнаты: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleJoinRoom = async (roomId) => {
    if (!currentUserId) {
      alert('Пожалуйста, войдите в систему для присоединения к комнате');
      setShowLoginModal(true);
      return;
    }

    try {
      const result = await joinRoom(roomId, currentUserId);
      if (result.joinUrl) {
        window.open(result.joinUrl, '_blank');
      }
      await loadRooms();
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Ошибка при присоединении к комнате: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentUserId(null);
    setRooms([]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 Analog Discord</h1>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-info">👤 {user.username}</span>
              <button 
                className="btn btn-secondary"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </>
          ) : (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowLoginModal(true)}
            >
              Войти
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (!currentUserId) {
                setShowLoginModal(true);
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            + Создать комнату
          </button>
        </div>
      </header>

      <main className="App-main">
        {!currentUserId ? (
          <div className="welcome-screen">
            <h2>Добро пожаловать в Analog Discord!</h2>
            <p>Войдите в систему, чтобы увидеть свои комнаты и создать новые</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowLoginModal(true)}
              style={{ marginTop: '1rem' }}
            >
              Войти или Зарегистрироваться
            </button>
          </div>
        ) : loading ? (
          <div className="loading">Загрузка комнат...</div>
        ) : (
          <RoomList 
            rooms={rooms} 
            onJoinRoom={handleJoinRoom}
            currentUserId={currentUserId}
          />
        )}
      </main>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(userData) => {
            setUser(userData);
            setCurrentUserId(userData.id);
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;

