// WebRTC для аудио комнаты
let localStream = null;
let peerConnections = {};
let isAudioRoomActive = false;
let isMuted = false;

// STUN серверы для WebRTC
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Вход в аудио комнату
async function joinAudioRoom() {
    if (!currentRoomId || !socket) {
        alert('Сначала выберите комнату');
        return;
    }

    try {
        // Запрашиваем доступ к микрофону
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            video: false 
        });

        isAudioRoomActive = true;
        isMuted = false;
        
        // Показываем аудио комнату
        document.getElementById('audioRoom').style.display = 'block';
        document.getElementById('audioRoomBtn').innerHTML = '<span>🔴 В аудио комнате</span>';
        document.getElementById('audioRoomBtn').classList.add('active');

        // Уведомляем сервер о входе в аудио комнату
        socket.emit('join_audio_room', { roomId: currentRoomId, userId: currentUserId });

        // Получаем список участников и создаем соединения
        setupWebRTCHandlers();

        console.log('✅ Joined audio room');
    } catch (error) {
        console.error('Error joining audio room:', error);
        alert('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.');
    }
}

// Выход из аудио комнаты
function leaveAudioRoom() {
    if (!isAudioRoomActive) return;

    // Останавливаем локальный поток
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Закрываем все peer connections
    Object.values(peerConnections).forEach(pc => {
        pc.close();
    });
    peerConnections = {};

    // Скрываем аудио комнату
    document.getElementById('audioRoom').style.display = 'none';
    document.getElementById('audioRoomBtn').innerHTML = '<span>🎤 Войти в аудио</span>';
    document.getElementById('audioRoomBtn').classList.remove('active');

    // Уведомляем сервер
    if (socket) {
        socket.emit('leave_audio_room', { roomId: currentRoomId });
    }

    isAudioRoomActive = false;
    updateAudioParticipants();
}

// Переключение аудио комнаты
function toggleAudioRoom() {
    if (isAudioRoomActive) {
        leaveAudioRoom();
    } else {
        joinAudioRoom();
    }
}

// Настройка обработчиков WebRTC
function setupWebRTCHandlers() {
    if (!socket) return;

    // Получение предложения от другого пользователя
    socket.on('audio_offer', async (data) => {
        const { offer, senderSocketId } = data;
        
        try {
            const pc = createPeerConnection(senderSocketId);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('audio_answer', {
                answer: answer,
                targetSocketId: senderSocketId
            });
        } catch (error) {
            console.error('Error handling audio offer:', error);
        }
    });

    // Получение ответа от другого пользователя
    socket.on('audio_answer', async (data) => {
        const { answer, senderSocketId } = data;
        const pc = peerConnections[senderSocketId];
        
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error('Error handling audio answer:', error);
            }
        }
    });

    // Получение ICE candidate
    socket.on('audio_ice_candidate', async (data) => {
        const { candidate, senderSocketId } = data;
        const pc = peerConnections[senderSocketId];
        
        if (pc && candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        }
    });

    // Пользователь присоединился к аудио комнате
    socket.on('user_joined_audio', async (data) => {
        const { socketId, userId, username } = data;
        if (socketId === socket.id) return; // Игнорируем себя
        
        await createPeerConnectionForUser(socketId, userId, username);
    });

    // Пользователь покинул аудио комнату
    socket.on('user_left_audio', (data) => {
        const { socketId } = data;
        removePeerConnection(socketId);
    });
}

// Создание peer connection для пользователя
async function createPeerConnectionForUser(targetSocketId, userId, username) {
    const pc = createPeerConnection(targetSocketId);
    
    // Добавляем локальный поток
    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    }

    // Создаем offer
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('audio_offer', {
            offer: offer,
            targetSocketId: targetSocketId
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }

    // Добавляем участника в UI
    addAudioParticipant(userId, username, targetSocketId);
}

// Создание peer connection
function createPeerConnection(targetSocketId) {
    const pc = new RTCPeerConnection(rtcConfiguration);
    
    // Обработка входящего аудио потока
    pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteStream) {
            playRemoteAudio(remoteStream, targetSocketId);
        }
    };

    // Обработка ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('audio_ice_candidate', {
                candidate: event.candidate,
                targetSocketId: targetSocketId
            });
        }
    };

    // Обработка изменения состояния соединения
    pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${targetSocketId}:`, pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            removePeerConnection(targetSocketId);
        }
    };

    peerConnections[targetSocketId] = pc;
    return pc;
}

// Воспроизведение удаленного аудио
function playRemoteAudio(stream, socketId) {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.id = `audio_${socketId}`;
    document.body.appendChild(audio);
}

// Удаление peer connection
function removePeerConnection(socketId) {
    const pc = peerConnections[socketId];
    if (pc) {
        pc.close();
        delete peerConnections[socketId];
    }

    // Удаляем аудио элемент
    const audio = document.getElementById(`audio_${socketId}`);
    if (audio) {
        audio.remove();
    }

    // Удаляем участника из UI
    removeAudioParticipant(socketId);
}

// Добавление участника в UI
function addAudioParticipant(userId, username, socketId) {
    const participants = document.getElementById('audioParticipants');
    const existing = document.getElementById(`participant_${socketId}`);
    if (existing) return; // Уже добавлен
    
    const participant = document.createElement('div');
    participant.className = 'participant';
    participant.id = `participant_${socketId}`;
    const avatar = username ? username[0].toUpperCase() : '?';
    const name = username || 'Unknown';
    participant.innerHTML = `
        <div class="participant-avatar">${avatar}</div>
        <div class="participant-info">
            <div class="participant-name">${name}</div>
            <div class="participant-status">🎤 Говорит</div>
        </div>
    `;
    participants.appendChild(participant);
}

// Удаление участника из UI
function removeAudioParticipant(socketId) {
    const participant = document.getElementById(`participant_${socketId}`);
    if (participant) {
        participant.remove();
    }
}

// Обновление списка участников
function updateAudioParticipants() {
    // Локальный участник всегда отображается
    const localName = currentUser ? currentUser.username : 'Вы';
    document.getElementById('localParticipantName').textContent = localName;
    document.getElementById('micStatus').textContent = isMuted ? '🔇 Выключен' : '🎤 Включен';
}

// Переключение микрофона
function toggleMute() {
    if (!localStream) return;

    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
    });

    const muteBtn = document.getElementById('muteBtn');
    muteBtn.textContent = isMuted ? '🎤' : '🔇';
    muteBtn.title = isMuted ? 'Включить микрофон' : 'Выключить микрофон';
    
    updateAudioParticipants();
}

