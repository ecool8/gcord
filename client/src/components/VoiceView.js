import React, { useState, useEffect } from 'react';
import './VoiceView.css';
import { socketService } from '../services/socket';
import { webrtcService } from '../services/webrtc';

function VoiceView({ channel, user }) {
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    socketService.joinVoiceChannel(channel.id);
    webrtcService.initialize(channel.id, user.id);

    const handleUserJoined = (data) => {
      if (data.userId !== user.id) {
        setParticipants(prev => [...prev, data]);
        webrtcService.createPeerConnection(data.socketId, data.userId);
      }
    };

    const handleUserLeft = (data) => {
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      webrtcService.removePeerConnection(data.socketId);
    };

    socketService.on('user_joined_voice', handleUserJoined);
    socketService.on('user_left_voice', handleUserLeft);

    return () => {
      socketService.leaveVoiceChannel(channel.id);
      webrtcService.cleanup();
      socketService.off('user_joined_voice', handleUserJoined);
      socketService.off('user_left_voice', handleUserLeft);
    };
  }, [channel, user]);

  const handleConnect = async () => {
    try {
      await webrtcService.startLocalStream();
      setIsConnected(true);
      socketService.joinVoiceChannel(channel.id);
    } catch (error) {
      console.error('Error connecting to voice:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const handleDisconnect = () => {
    webrtcService.stopLocalStream();
    setIsConnected(false);
    socketService.leaveVoiceChannel(channel.id);
  };

  const handleToggleMute = () => {
    webrtcService.toggleMute();
    setIsMuted(!isMuted);
  };

  return (
    <div className="voice-view">
      <div className="voice-header">
        <div className="channel-header">
          <span className="channel-icon">🔊</span>
          <h2>{channel.name}</h2>
        </div>
      </div>

      <div className="voice-content">
        <div className="voice-participants">
          <div className="participant local">
            <div className="participant-avatar">{user.username[0].toUpperCase()}</div>
            <div className="participant-info">
              <div className="participant-name">Вы</div>
              <div className="participant-status">{isMuted ? '🔇 Выключен' : '🎤 Включен'}</div>
            </div>
          </div>
          {participants.map(participant => (
            <div key={participant.socketId} className="participant">
              <div className="participant-avatar">?</div>
              <div className="participant-info">
                <div className="participant-name">Пользователь {participant.userId}</div>
                <div className="participant-status">🎤 Говорит</div>
              </div>
            </div>
          ))}
        </div>

        <div className="voice-controls">
          {!isConnected ? (
            <button className="btn-connect" onClick={handleConnect}>
              Подключиться
            </button>
          ) : (
            <>
              <button className={`btn-mute ${isMuted ? 'muted' : ''}`} onClick={handleToggleMute}>
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button className="btn-disconnect" onClick={handleDisconnect}>
                Отключиться
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceView;

