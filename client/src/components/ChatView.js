import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import { getMessages, createMessage } from '../services/api';
import { socketService } from '../services/socket';

function ChatView({ channel, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    const handleNewMessage = (message) => {
      if (message.channelId === channel.id) {
        setMessages(prev => [...prev, message]);
      }
    };

    socketService.on('new_message', handleNewMessage);

    return () => {
      socketService.off('new_message', handleNewMessage);
    };
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await getMessages(channel.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await socketService.sendMessage(newMessage, channel.id);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Ошибка отправки сообщения');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="chat-view">
        <div className="chat-loading">Загрузка сообщений...</div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="channel-header">
          <span className="channel-icon">#</span>
          <h2>{channel.name}</h2>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>Пока нет сообщений. Начните общение!</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className="message">
              <div className="message-avatar">
                {message.user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-username">{message.user?.username || 'Unknown'}</span>
                  <span className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="message-text">{message.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder={`Написать в #${channel.name}`}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="send-button">Отправить</button>
      </form>
    </div>
  );
}

export default ChatView;

