class WebRTCService {
  constructor() {
    this.localStream = null;
    this.peerConnections = {};
    this.channelId = null;
    this.userId = null;
    this.socket = null;
  }

  initialize(channelId, userId) {
    this.channelId = channelId;
    this.userId = userId;
    this.socket = require('./socket').socketService.socket;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('webrtc_offer', async (data) => {
      await this.handleOffer(data);
    });

    this.socket.on('webrtc_answer', async (data) => {
      await this.handleAnswer(data);
    });

    this.socket.on('webrtc_ice_candidate', async (data) => {
      await this.handleIceCandidate(data);
    });
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media:', error);
      throw error;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  createPeerConnection(targetSocketId, targetUserId) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.playRemoteAudio(remoteStream, targetSocketId);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('webrtc_ice_candidate', {
          candidate: event.candidate,
          targetSocketId: targetSocketId,
          channelId: this.channelId
        });
      }
    };

    this.peerConnections[targetSocketId] = pc;

    // Create offer
    pc.createOffer().then(offer => {
      return pc.setLocalDescription(offer);
    }).then(() => {
      if (this.socket) {
        this.socket.emit('webrtc_offer', {
          offer: pc.localDescription,
          targetSocketId: targetSocketId,
          channelId: this.channelId
        });
      }
    }).catch(error => {
      console.error('Error creating offer:', error);
    });

    return pc;
  }

  async handleOffer(data) {
    const { offer, senderSocketId } = data;
    const pc = this.createPeerConnection(senderSocketId, null);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.socket) {
      this.socket.emit('webrtc_answer', {
        answer: answer,
        targetSocketId: senderSocketId
      });
    }
  }

  async handleAnswer(data) {
    const { answer, senderSocketId } = data;
    const pc = this.peerConnections[senderSocketId];
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate(data) {
    const { candidate, senderSocketId } = data;
    const pc = this.peerConnections[senderSocketId];
    if (pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  playRemoteAudio(stream, socketId) {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.id = `audio_${socketId}`;
    document.body.appendChild(audio);
  }

  removePeerConnection(socketId) {
    const pc = this.peerConnections[socketId];
    if (pc) {
      pc.close();
      delete this.peerConnections[socketId];
    }

    const audio = document.getElementById(`audio_${socketId}`);
    if (audio) {
      audio.remove();
    }
  }

  toggleMute() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }

  cleanup() {
    this.stopLocalStream();
    Object.keys(this.peerConnections).forEach(socketId => {
      this.removePeerConnection(socketId);
    });
    this.peerConnections = {};
  }
}

export const webrtcService = new WebRTCService();

