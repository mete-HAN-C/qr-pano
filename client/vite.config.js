import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Make Vite listen on all interfaces so phones on the same LAN can reach it
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // Forward /api/* requests to the Express server in dev mode
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // Forward Socket.io handshake requests to the Express server
      "/socket.io": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: true, // enable WebSocket proxying
      },
    },
  },
});
