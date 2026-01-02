import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Настройка axios для использования токена
const api = axios.create({
  baseURL: API_URL,
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API для комнат
export const getRooms = async (userId) => {
  const response = await api.get(`/rooms/my-rooms?userId=${userId}`);
  return response.data;
};

export const getAllRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData);
  return response.data;
};

export const joinRoom = async (roomId, userId) => {
  const response = await api.post(`/rooms/${roomId}/join`, { userId });
  return response.data;
};

export const getRoomInfo = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

// API для аутентификации
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

