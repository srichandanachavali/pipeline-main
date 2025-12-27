// WebRTC Video Chat Application - Production Ready
// Updated: Connect to deployed Render signaling server

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

let localStream = null;
let peerConnection = null;
let signalingSocket = null;
let roomId = null;

const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const joinButton = document.getElementById('join');
const leaveButton = document.getElementById('leave');
const roomInput = document.getElementById('room-id');
const statusDiv = document.getElementById('status');

// Update status message
function updateStatus(message) {
    statusDiv.textContent = message;
    console.log(message);
}

// Initialize local media stream
async function initLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 720 },
                height: { ideal: 1280 },
                facingMode: 'user'
            },
            audio: true
        });

        localVideo.srcObject = localStream;
        updateStatus('Camera and microphone ready');
        return true;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        updateStatus('Error: Could not access camera/microphone');
        return false;
    }
}

// Create peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            updateStatus('Connected to peer');
        }
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignal({
                type: 'ice-candidate',
                candidate: event.candidate,
                room: roomId
            });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        updateStatus(`Connection: ${peerConnection.connectionState}`);
    };
}

// Connect to signaling server (Render)
function connectSignaling() {
    // 🔥 Final production signaling WebSocket
    const WS_URL = 'wss://webrtc-signaling-bylv.onrender.com';

    signalingSocket = new WebSocket(WS_URL);

    signalingSocket.onopen = () => {
        updateStatus('Connected to signaling server');
        sendSignal({ type: 'join', room: roomId });
    };

    signalingSocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        await handleSignalingMessage(data);
    };

    signalingSocket.onerror = () => {
        updateStatus('Signaling error');
    };

    signalingSocket.onclose = () => {
        updateStatus('Disconnected from signaling server');
    };
}

// Send signaling message
function sendSignal(message) {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify(message));
    }
}

// Handle signaling messages
async function handleSignalingMessage(data) {
    switch (data.type) {
        case 'ready':
            await createOffer();
            break;

        case 'offer':
            await handleOffer(data.offer);
            break;

        case 'answer':
            await handleAnswer(data.answer);
            break;

        case 'ice-candidate':
            await handleIceCandidate(data.candidate);
            break;

        case 'peer-left':
            if (remoteVideo.srcObject) {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
                remoteVideo.srcObject = null;
            }
            break;
    }
}

// Signaling handlers
async function createOffer() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    sendSignal({ type: 'offer', offer, room: roomId });
}

async function handleOffer(offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    sendSignal({ type: 'answer', answer, room: roomId });
}

async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleIceCandidate(candidate) {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
        console.error('ICE Error:', error);
    }
}

// UI actions
async function joinCall() {
    roomId = roomInput.value.trim();
    if (!roomId) return alert('Enter room ID');

    joinButton.disabled = true;

    const mediaReady = await initLocalStream();
    if (!mediaReady) {
        joinButton.disabled = false;
        return;
    }

    createPeerConnection();
    connectSignaling();
    leaveButton.disabled = false;
    roomInput.disabled = true;
}

function leaveCall() {
    if (peerConnection) peerConnection.close();
    if (signalingSocket) signalingSocket.close();
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (remoteVideo.srcObject) remoteVideo.srcObject.getTracks().forEach(t => t.stop());

    remoteVideo.srcObject = null;
    localVideo.srcObject = null;

    joinButton.disabled = false;
    leaveButton.disabled = true;
    roomInput.disabled = false;
}

// Events
joinButton.onclick = joinCall;
leaveButton.onclick = leaveCall;
window.addEventListener('beforeunload', leaveCall);
