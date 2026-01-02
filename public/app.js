// Определяем API URL в зависимости от окружения
const API_URL = window.location.origin + '/api';
let socket = null;
let currentUser = null;
let currentUserId = null;
let currentRoomId = null;
let isLoginMode = true;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    connectSocket();
});

// Загрузка пользователя из localStorage
function loadUser() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            currentUserId = currentUser.id;
            updateUI();
            loadRooms();
        } catch (e) {
            console.error('Error loading user:', e);
        }
    }
}

// Подключение к WebSocket
function connectSocket() {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.hostname;
    const port = window.location.port || '5000';
    const socketUrl = `${protocol}//${host}:${port}`;
    
    socket = io(socketUrl);
    
    socket.on('connect', () => {
        console.log('✅ Connected to server');
        if (currentRoomId) {
            socket.emit('join_room', { roomId: currentRoomId, userId: currentUserId });
        }
    });

    socket.on('room_joined', (data) => {
        console.log('Joined room:', data.roomId);
    });

    socket.on('new_message', (message) => {
        addMessageToChat(message);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        // Выходим из аудио комнаты при отключении
        if (typeof leaveAudioRoom === 'function') {
            leaveAudioRoom();
        }
    });
}

// Обновление UI
function updateUI() {
    if (currentUser) {
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('createRoomBtn').style.display = 'block';
    } else {
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('createRoomBtn').style.display = 'none';
    }
}

// Загрузка комнат
async function loadRooms() {
    if (!currentUserId) return;

    try {
        const response = await fetch(`${API_URL}/rooms/my-rooms?userId=${currentUserId}`);
        if (!response.ok) throw new Error('Failed to load rooms');
        
        const rooms = await response.json();
        displayRooms(rooms);
    } catch (error) {
        console.error('Error loading rooms:', error);
        document.getElementById('roomsList').innerHTML = '<div class="empty-state">Ошибка загрузки комнат</div>';
    }
}

// Отображение комнат
function displayRooms(rooms) {
    const roomsList = document.getElementById('roomsList');
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<div class="empty-state">Нет комнат. Создайте первую!</div>';
        return;
    }

    roomsList.innerHTML = rooms.map(room => `
        <div class="room-item ${room.id === currentRoomId ? 'active' : ''}" onclick="selectRoom(${room.id}, '${escapeHtml(room.name)}')">
            <div class="room-item-name">${escapeHtml(room.name)}</div>
            ${room.description ? `<div class="room-item-description">${escapeHtml(room.description)}</div>` : ''}
        </div>
    `).join('');
}

// Выбор комнаты
async function selectRoom(roomId, roomName) {
    // Выходим из предыдущей аудио комнаты, если была активна
    if (isAudioRoomActive && typeof leaveAudioRoom === 'function') {
        leaveAudioRoom();
    }
    
    currentRoomId = roomId;
    
    // Обновляем активную комнату в списке
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.room-item')?.classList.add('active');

    // Показываем интерфейс чата
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputContainer').style.display = 'flex';
    document.getElementById('currentRoomName').textContent = roomName;
    document.getElementById('audioRoomBtn').style.display = 'block';
    
    // Присоединяемся к комнате через WebSocket
    if (socket) {
        socket.emit('join_room', { roomId, userId: currentUserId });
    }

    // Загружаем сообщения
    await loadMessages(roomId);
}

// Загрузка сообщений
async function loadMessages(roomId) {
    try {
        const response = await fetch(`${API_URL}/messages/room/${roomId}`);
        if (!response.ok) throw new Error('Failed to load messages');
        
        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('chatMessages').innerHTML = '<div class="error-message">Ошибка загрузки сообщений</div>';
    }
}

// Отображение сообщений
function displayMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<div class="welcome-message"><p>Пока нет сообщений. Начните общение!</p></div>';
        return;
    }

    chatMessages.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
    scrollToBottom();
}

// Добавление нового сообщения в чат
function addMessageToChat(message) {
    if (message.room_id !== currentRoomId) return;
    
    const chatMessages = document.getElementById('chatMessages');
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const messageHTML = createMessageHTML(message);
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

// Создание HTML сообщения
function createMessageHTML(message) {
    const date = new Date(message.created_at);
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const avatar = message.username ? message.username[0].toUpperCase() : '?';
    
    return `
        <div class="message">
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${escapeHtml(message.username || 'Unknown')}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${escapeHtml(message.content)}</div>
            </div>
        </div>
    `;
}

// Отправка сообщения
function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !currentRoomId || !socket) return;
    
    socket.emit('send_message', {
        roomId: currentRoomId,
        userId: currentUserId,
        content: content,
        username: currentUser.username
    });
    
    input.value = '';
}

// Обработка нажатия Enter
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Прокрутка вниз
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Вход/Регистрация
async function handleLogin(event) {
    event.preventDefault();
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';

    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const username = document.getElementById('usernameInput').value;

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Обработка...';

    try {
        const url = isLoginMode ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
        const body = isLoginMode 
            ? { email, password }
            : { username, email, password };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка авторизации');
        }

        currentUser = data.user;
        currentUserId = data.user.id;
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Переподключаемся к WebSocket с новым пользователем
        if (socket) {
            socket.disconnect();
        }
        connectSocket();
        
        hideLoginModal();
        updateUI();
        loadRooms();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Создание комнаты
async function handleCreateRoom(event) {
    event.preventDefault();
    
    if (!currentUserId) {
        alert('Пожалуйста, войдите в систему');
        showLoginModal();
        return;
    }

    const name = document.getElementById('roomName').value;
    const description = document.getElementById('roomDescription').value;

    try {
        const response = await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                description,
                ownerId: currentUserId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка создания комнаты');
        }

        hideCreateModal();
        document.getElementById('roomName').value = '';
        document.getElementById('roomDescription').value = '';
        loadRooms();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Выход
function logout() {
    currentUser = null;
    currentUserId = null;
    currentRoomId = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    if (socket) {
        socket.disconnect();
    }
    
    updateUI();
    document.getElementById('roomsList').innerHTML = '<div class="empty-state">Войдите, чтобы увидеть комнаты</div>';
    document.getElementById('chatHeader').style.display = 'none';
    document.getElementById('chatInputContainer').style.display = 'none';
    document.getElementById('audioRoomBtn').style.display = 'none';
    document.getElementById('chatMessages').innerHTML = '<div class="welcome-message"><h2>Добро пожаловать в Analog Discord!</h2><p>Войдите в систему и выберите комнату для общения</p></div>';
    
    // Выходим из аудио комнаты при выходе
    if (isAudioRoomActive && typeof leaveAudioRoom === 'function') {
        leaveAudioRoom();
    }
}

// Модальные окна
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('errorMessage').style.display = 'none';
}

function showCreateModal() {
    if (!currentUserId) {
        showLoginModal();
        return;
    }
    document.getElementById('createModal').classList.add('active');
}

function hideCreateModal() {
    document.getElementById('createModal').classList.remove('active');
}

function toggleLoginMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('loginModalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleBtn = document.getElementById('toggleModeBtn');
    const usernameGroup = document.getElementById('usernameGroup');

    if (isLoginMode) {
        title.textContent = 'Вход';
        submitBtn.textContent = 'Войти';
        toggleBtn.textContent = 'Регистрация';
        usernameGroup.style.display = 'none';
    } else {
        title.textContent = 'Регистрация';
        submitBtn.textContent = 'Зарегистрироваться';
        toggleBtn.textContent = 'Вход';
        usernameGroup.style.display = 'block';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

