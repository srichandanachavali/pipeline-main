# WebRTC Video Chat Application

A simple peer-to-peer video chat application using WebRTC.

## Features

- Real-time video and audio communication
- Peer-to-peer connection using WebRTC
- Room-based system (multiple users can join the same room)
- Full-screen remote video with floating local preview
- Simple and clean UI

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## How to Use

1. Open the application in your browser
2. Enter a room ID (e.g., "room123")
3. Click "Join Call" to start
4. Share the same room ID with another person
5. They should open the app and join the same room
6. You'll be connected via peer-to-peer video chat!

## Using Your Own Signaling Server (Optional)

The app currently uses a public demo signaling server. For production or better reliability:

### Option 1: Run Local Signaling Server

1. Install ws package:
```bash
npm install ws
```

2. Run the signaling server:
```bash
node signaling-server.js
```

3. Update the WebSocket URL in `src/main.js`:
```javascript
const WS_URL = 'ws://localhost:3001';
```

### Option 2: Deploy Your Own Server

Deploy `signaling-server.js` to any Node.js hosting service (Heroku, Railway, Render, etc.) and update the WebSocket URL accordingly.

## Architecture

- **WebRTC**: Handles peer-to-peer video/audio streaming
- **WebSocket**: Signaling server for connection negotiation
- **STUN Servers**: Google's public STUN servers for NAT traversal

## Browser Support

Works in all modern browsers that support WebRTC:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Troubleshooting

**Camera/Microphone not working:**
- Make sure you've granted browser permissions
- Check if another app is using the camera
- Try HTTPS (required for some browsers)

**Can't connect to peer:**
- Both users must be in the same room
- Check if firewall is blocking WebRTC
- Some corporate networks may block peer-to-peer connections

**No video showing:**
- Check browser console for errors
- Verify camera permissions
- Try refreshing the page

## Notes

- This is a simple implementation for demonstration
- For production, consider adding TURN servers for better connectivity
- Add authentication and security measures for production use
- The signaling server is minimal - enhance it for production needs
