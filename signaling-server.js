// Simple WebRTC Signaling Server
// Run with: node signaling-server.js

import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const PORT = 3001;
const rooms = new Map();

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    let currentRoom = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join':
                    currentRoom = data.room;
                    
                    if (!rooms.has(currentRoom)) {
                        rooms.set(currentRoom, []);
                    }
                    
                    const room = rooms.get(currentRoom);
                    room.push(ws);
                    
                    console.log(`Client joined room: ${currentRoom} (${room.length} peers)`);
                    
                    // Notify other peers in the room
                    room.forEach(client => {
                        if (client !== ws && client.readyState === 1) {
                            client.send(JSON.stringify({ type: 'ready' }));
                        }
                    });
                    break;

                case 'offer':
                case 'answer':
                case 'ice-candidate':
                    // Forward to other peers in the room
                    if (currentRoom && rooms.has(currentRoom)) {
                        rooms.get(currentRoom).forEach(client => {
                            if (client !== ws && client.readyState === 1) {
                                client.send(JSON.stringify(data));
                            }
                        });
                    }
                    break;

                case 'leave':
                    handleLeave(ws, currentRoom);
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        handleLeave(ws, currentRoom);
    });
});

function handleLeave(ws, roomId) {
    if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const index = room.indexOf(ws);
        
        if (index !== -1) {
            room.splice(index, 1);
            console.log(`Client left room: ${roomId} (${room.length} peers remaining)`);
            
            // Notify other peers
            room.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ type: 'peer-left' }));
                }
            });
            
            // Clean up empty rooms
            if (room.length === 0) {
                rooms.delete(roomId);
            }
        }
    }
}

server.listen(PORT, () => {
    console.log(`WebRTC Signaling Server running on port ${PORT}`);
    console.log(`WebSocket URL: ws://localhost:${PORT}`);
});
