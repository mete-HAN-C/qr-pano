const os = require("os");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const { randomUUID } = require("crypto");

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

/** Maximum upload size in bytes (default: 500 MB, override with MAX_FILE_SIZE env var) */
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || String(500 * 1024 * 1024), 10);

// ─── Zero-persistence file store (RAM only) ──────────────────────────────────
/**
 * Map<token: string, { buffer: Buffer, filename: string, mimetype: string, size: number }>
 *
 * Each entry is a one-shot: it is deleted immediately after the first
 * successful download, so it never accumulates and can never be retrieved twice.
 */
const fileStore = new Map();

// ─── Multer (memoryStorage — no disk writes ever) ────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

app.use(
  cors({
    origin: "*", // allow Vite dev server + mobile browsers on the local network
    methods: ["GET", "POST"],
  })
);

/** Health / info endpoint used by the React app to fetch the local IP for QR code generation. */
app.get("/api/info", (_req, res) => {
  res.json({ ip: LOCAL_IP, port: PORT });
});

// ─── File Upload ─────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 *
 * Accepts a single multipart/form-data field "file".
 * Stores the buffer in RAM under a UUID token.
 * Broadcasts a "file-available" Socket.io event to all OTHER clients.
 *
 * Response: { token, filename, size, mimetype }
 */
app.post("/api/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      // Multer errors (wrong content-type, size limit, etc.) → 400
      return res.status(400).json({ error: err.message || "Upload error." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const token = randomUUID();
    const { originalname: filename, mimetype, size, buffer } = req.file;

    // Store in RAM — never touches the disk
    fileStore.set(token, { buffer, filename, mimetype, size });

    console.log(`  📤 File uploaded   [${filename}] ${(size / 1024).toFixed(1)} KB  token=${token}`);

    // Broadcast to all other connected sockets
    io.emit("file-available", { token, filename, size, mimetype });

    return res.json({ token, filename, size, mimetype });
  });
});


// ─── File Download (one-shot) ────────────────────────────────────────────────

/**
 * GET /api/download/:token
 *
 * Serves the file for the given token exactly once, then deletes it from RAM.
 * Any subsequent request for the same token returns 404.
 */
app.get("/api/download/:token", (req, res) => {
  const entry = fileStore.get(req.params.token);

  if (!entry) {
    return res.status(404).json({ error: "File not found or already downloaded." });
  }

  const { buffer, filename, mimetype, size } = entry;

  // One-shot: delete immediately before sending so concurrent requests also 404
  fileStore.delete(req.params.token);

  console.log(`  📥 File downloaded [${filename}] ${(size / 1024).toFixed(1)} KB  token=${req.params.token}`);

  res.set({
    "Content-Type": mimetype || "application/octet-stream",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    "Content-Length": size,
    // Prevent any caching — file no longer exists after this response
    "Cache-Control": "no-store",
  });

  return res.send(buffer);
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
  console.log(`${GREEN}  Max file    : ${BOLD}${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB${RESET}`);
  console.log(`${GREEN}  ────────────────────────────────────────${RESET}`);
  console.log("");
});

// Export for testing (Supertest needs the httpServer / app)
module.exports = { app, httpServer, fileStore };
