# QR-Pano 📋

> **Local Network Clipboard & File Transfer** — Instantly share text, links, and files between your devices over Wi-Fi using a QR code. No cloud, no database, no account required.

---

## ✨ What is QR-Pano?

QR-Pano is a privacy-first, real-time data sharing tool that works entirely on your local network. Scan the QR code with your phone and instantly sync text or transfer files — all traffic stays on your LAN and nothing is ever written to disk.

### Features

| Feature | Description |
|---|---|
| 🔍 **Auto IP Detection** | Server automatically detects your local Wi-Fi IP and displays it in the terminal |
| 📱 **QR Code Access** | Scan the on-screen QR code to open the app on your phone instantly |
| ⚡ **Real-Time Text Sync** | Text typed on any device is instantly broadcast to all others via Socket.io |
| 📦 **File Transfer** | Send any file (photo, video, PDF, doc…) to other devices over LAN |
| 🔒 **Zero Persistence** | Files are held in RAM only — deleted the moment they are downloaded (one-shot) |
| 📋 **One-Click Copy** | Each message has a copy button to push it to the device's clipboard |
| 🌑 **Glassmorphism UI** | Dark theme with neon accents — looks great on both desktop and mobile |
| 🧪 **Automated Tests** | Jest + Supertest (server) and Vitest + RTL (client) test suites included |

---

## 🗂️ Project Structure

```
qr-pano-app/
├── client/                         # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── __tests__/          # Vitest + React Testing Library
│       │   ├── ClipboardPanel.jsx
│       │   ├── FileTransferPanel.jsx   ← new
│       │   ├── IncomingFile.jsx        ← new
│       │   └── QRDisplay.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── socket.js
│       └── test-setup.js
├── server/
│   ├── __tests__/
│   │   └── upload.test.js          # Jest + Supertest integration tests
│   └── index.js
├── package.json                    # Root workspace — runs both with `npm run dev`
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- All devices must be connected to **the same Wi-Fi network**

### 1. Install Dependencies

```bash
# From the project root — installs root, server, and client deps in one shot
npm run install:all
```

### 2. Start the Development Servers

```bash
npm run dev
```

This starts **both** backend and frontend simultaneously:

- **Server** → `http://localhost:3001`
- **Client** → `http://localhost:5173`

### 3. Open the App

1. Open `http://localhost:5173` in your **desktop** browser.
2. Scan the QR code with your **phone's camera**.
3. Both devices are now connected — share text or send files instantly!

---

## ⚙️ How It Works

```
┌──────────────┐        WebSocket (Socket.io)        ┌──────────────┐
│   Desktop    │ ──────────────────────────────────► │    Mobile    │
│   Browser    │ ◄────────────────────────────────── │   Browser    │
└──────┬───────┘                                      └──────┬───────┘
       │                                                     │
       └────────────────────┬────────────────────────────────┘
                            │
                   ┌────────▼──────────┐
                   │   Express Server   │
                   │   (RAM only)      │  ← nothing written to disk
                   │   Port: 3001      │
                   └───────────────────┘
```

### Text Sharing
The server is a pure relay — `clipboard-update` events are broadcast to every other connected client. Nothing is stored.

### File Transfer (Zero Persistence)
1. **Sender** picks a file → `POST /api/upload` (multipart) → stored in RAM under a UUID token → `file-available` socket event broadcast to all other clients.
2. **Receiver** sees the incoming file card → clicks **Save** → `GET /api/download/:token` → file served, **token deleted immediately** (one-shot).
3. A second request for the same token returns `404`. The file is gone.

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** — HTTP + REST endpoints
- **Socket.io** — real-time WebSocket relay
- **multer** (`memoryStorage`) — zero-disk file ingestion
- **cors** — cross-origin support for Vite dev server

### Frontend
- **React** (via **Vite**) — component UI
- **Tailwind CSS** — utility-first styling + glassmorphism design tokens
- **qrcode.react** — in-browser QR code rendering
- **react-hot-toast** — toast notifications
- **socket.io-client** — WebSocket connection

### Testing
- **Jest** + **Supertest** — server integration tests
- **Vitest** + **React Testing Library** + **jest-dom** — component unit tests

---

## 🧪 Running Tests

```bash
# Server tests (Jest + Supertest)
cd server && npm test

# Client tests (Vitest + RTL)
cd client && npx vitest run
```

---

## 🔒 Privacy

QR-Pano is designed with privacy as a first principle:

- **No database** — zero data persistence.
- **No cloud** — all traffic stays on your local network.
- **No accounts** — no sign-up, no tracking.
- Text stays in memory for the session; files are deleted from RAM immediately after download.

---

## 📄 License

MIT © 2026 — Feel free to use this in your own projects.
