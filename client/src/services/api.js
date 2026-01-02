import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Servers
export const getMyServers = async () => {
  const response = await api.get('/servers/my-servers');
  return response.data;
};

export const createServer = async (name, description) => {
  const response = await api.post('/servers', { name, description });
  return response.data;
};

export const getServer = async (serverId) => {
  const response = await api.get(`/servers/${serverId}`);
  return response.data;
};

export const joinServer = async (serverId) => {
  const response = await api.post(`/servers/${serverId}/join`);
  return response.data;
};

// Channels
export const getChannels = async (serverId) => {
  const response = await api.get(`/channels/server/${serverId}`);
  return response.data;
};

export const createChannel = async (name, type, serverId, position) => {
  const response = await api.post('/channels', { name, type, serverId, position });
  return response.data;
};

export const getChannel = async (channelId) => {
  const response = await api.get(`/channels/${channelId}`);
  return response.data;
};

// Messages
export const getMessages = async (channelId, limit = 50, offset = 0) => {
  const response = await api.get(`/messages/channel/${channelId}`, {
    params: { limit, offset }
  });
  return response.data;
};

export const createMessage = async (content, channelId) => {
  const response = await api.post('/messages', { content, channelId });
  return response.data;
};

export default api;
