import { io } from "socket.io-client";

/**
 * Singleton Socket.io client instance.
 *
 * In dev mode, Vite proxies /socket.io → http://localhost:3001 (see vite.config.js).
 * In production, the Express server serves both the static bundle and Socket.io
 * from the same origin, so no explicit URL is needed.
 *
 * autoConnect: false → we connect manually inside App.jsx after the server
 * info is confirmed, giving us clean control over lifecycle.
 */
const socket = io({
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1500,
  reconnectionDelayMax: 8000,
});

export default socket;
