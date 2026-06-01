import { io, Socket } from 'socket.io-client';

// Connect directly to root since Vite proxies /socket.io requests
export const socket: Socket = io(window.location.origin, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('Successfully connected to RoadWatch WebSocket server! Connection ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('Disconnected from RoadWatch WebSocket server. Reason:', reason);
});
