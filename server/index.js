const os = require("os");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the first non-internal IPv4 address found on any network interface.
 * Prefers interfaces whose name starts with "Wi-Fi" / "wlan" / "en" (Wi-Fi),
 * but falls back to any available LAN address so it works on both Windows and
 * Linux/macOS.
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        candidates.push({ name, address: addr.address });
      }
    }
  }

  // Prefer Wi-Fi interfaces by name (Windows: "Wi-Fi", Linux: "wlan", macOS: "en0")
  const wifi = candidates.find(({ name }) =>
    /wi-fi|wlan|en\d/i.test(name)
  );

  return (wifi || candidates[0])?.address || "127.0.0.1";
}

// ─── Config ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
const LOCAL_IP = getLocalIP();

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

app.use(
  cors({
    origin: "*", // allow Vite dev server + mobile browsers on the local network
    methods: ["GET"],
  })
);

/** Health / info endpoint used by the React app to fetch the local IP for QR code generation. */
app.get("/api/info", (_req, res) => {
  res.json({ ip: LOCAL_IP, port: PORT });
});

// ─── HTTP + Socket.io ────────────────────────────────────────────────────────

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`  🔗 Client connected    [${socket.id}]  total: ${io.engine.clientsCount}`);

  /**
   * clipboard-update
   * Payload: { text: string }
   *
   * The server acts as a pure relay — it broadcasts the payload to every
   * OTHER connected client and never stores anything.
   */
  socket.on("clipboard-update", (payload) => {
    console.log(`  📋 clipboard-update from [${socket.id}] → broadcasting to others`);
    socket.broadcast.emit("clipboard-update", payload);
  });

  socket.on("disconnect", () => {
    console.log(`  ❌ Client disconnected [${socket.id}]  total: ${io.engine.clientsCount}`);
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

httpServer.listen(PORT, "0.0.0.0", () => {
  const GREEN  = "\x1b[32m";
  const CYAN   = "\x1b[36m";
  const BOLD   = "\x1b[1m";
  const RESET  = "\x1b[0m";

  console.log("");
  console.log(`${BOLD}${GREEN}  ✅ QR-Pano server is running!${RESET}`);
  console.log(`${GREEN}  ────────────────────────────────────────${RESET}`);
  console.log(`${GREEN}  Local IP    : ${BOLD}${LOCAL_IP}${RESET}`);
  console.log(`${GREEN}  Port        : ${BOLD}${PORT}${RESET}`);
  console.log(`${CYAN}  QR URL      : ${BOLD}http://${LOCAL_IP}:5173${RESET}`);
  console.log(`${GREEN}  API info    : ${BOLD}http://${LOCAL_IP}:${PORT}/api/info${RESET}`);
  console.log(`${GREEN}  ────────────────────────────────────────${RESET}`);
  console.log("");
});
