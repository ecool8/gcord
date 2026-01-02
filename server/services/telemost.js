const axios = require('axios');

class TelemostService {
  constructor() {
    // API endpoint для Яндекс Телемост
    // В реальном приложении это будет из переменных окружения
    this.baseURL = process.env.TELEMOST_API_URL || 'https://telemost.yandex.ru/api/v1';
    this.apiKey = process.env.TELEMOST_API_KEY || '';
  }

  /**
   * Создает новую комнату в Яндекс Телемост
   * @param {Object} options - Параметры комнаты
   * @param {string} options.waitingRoomLevel - Уровень доступа (PUBLIC, AUTHENTICATED, PRIVATE)
   * @param {Array} options.cohosts - Список соорганизаторов (опционально)
   * @returns {Promise<Object>} - Информация о созданной комнате
   */
  async createRoom(options = {}) {
    try {
      const { waitingRoomLevel = 'PUBLIC', cohosts = [] } = options;

      const requestBody = {
        waiting_room_level: waitingRoomLevel,
      };

      if (cohosts.length > 0) {
        requestBody.cohosts = cohosts.map(email => ({ email }));
      }

      const response = await axios.post(
        `${this.baseURL}/conferences`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
        joinUrl: response.data.join_url,
        waitingRoomLevel: response.data.waiting_room_level,
      };
    } catch (error) {
      console.error('Error creating Telemost room:', error.response?.data || error.message);
      
      // Если API недоступен, возвращаем мок-данные для разработки
      if (!this.apiKey || error.response?.status === 401) {
        console.warn('Using mock Telemost room (API key not configured)');
        return this.createMockRoom();
      }
      
      throw new Error(`Failed to create Telemost room: ${error.message}`);
    }
  }

  /**
   * Получает информацию о комнате
   * @param {string} roomId - ID комнаты в Телемост
   * @returns {Promise<Object>} - Информация о комнате
   */
  async getRoomInfo(roomId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/conferences/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting Telemost room info:', error.response?.data || error.message);
      throw new Error(`Failed to get Telemost room info: ${error.message}`);
    }
  }

  /**
   * Создает мок-комнату для разработки (когда API ключ не настроен)
   * Генерирует уникальную ссылку для создания встречи
   * @returns {Object} - Данные комнаты с ссылкой на создание встречи
   */
  createMockRoom() {
    // Генерируем уникальный ID для комнаты
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Яндекс Телемост создает встречу автоматически при первом открытии ссылки
    // Генерируем уникальный ID для встречи (формат: случайная строка из букв и цифр)
    // Длина должна быть достаточной для уникальности
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let uniqueId = '';
    for (let i = 0; i < 12; i++) {
      uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Создаем ссылку на встречу в Яндекс Телемост
    // При первом открытии этой ссылки Яндекс Телемост автоматически создаст новую встречу
    const joinUrl = `https://telemost.yandex.ru/j/${uniqueId}`;
    
    console.log('Created mock Telemost room with URL:', joinUrl);
    
    return {
      id: roomId,
      joinUrl: joinUrl,
      waitingRoomLevel: 'PUBLIC',
      isMock: true, // Флаг, что это тестовая комната
    };
  }
}

module.exports = new TelemostService();

