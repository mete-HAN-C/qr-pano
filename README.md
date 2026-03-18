# QR-Pano 📋

> **Local Network Clipboard** — Instantly share text and links between your computer and mobile device over Wi-Fi using a QR code. No cloud, no database, no account required.

---

## ✨ What is QR-Pano?

QR-Pano is a privacy-first, real-time clipboard sharing tool that works entirely on your local network. You scan a QR code with your phone, and from that point on, anything you type on your computer instantly appears on your phone — and vice versa.

### Core Features

| Feature | Description |
|---|---|
| 🔍 **Automatic IP Detection** | The server automatically detects your local Wi-Fi IP address and displays it in the terminal |
| 📱 **QR Code Access** | A QR code is shown in the browser — scan it to open the app on your phone instantly |
| ⚡ **Real-Time Sync** | Text typed on any device is instantly broadcast to all others via Socket.io |
| 📋 **One-Click Copy** | Each message has a copy button to push it to the device's clipboard |
| 🔒 **Zero Persistence** | No database, no logs — data lives only in memory and disappears when the server stops |
| 🌑 **Dark Mode UI** | Glassmorphism dark theme with neon accents — looks great on both desktop and mobile |

---

## 🗂️ Project Structure

```
qr-pano-app/
├── client/          # React + Vite frontend (Tailwind CSS, qrcode.react, react-hot-toast)
├── server/          # Node.js + Express + Socket.io backend
├── package.json     # Root workspace — runs both with `npm run dev`
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- Your computer and phone must be connected to **the same Wi-Fi network**

### 1. Install Dependencies

```bash
# From the project root — installs root, server, and client deps in one shot
npm run install:all
```

### 2. Start the Development Servers

```bash
npm run dev
```

This command starts **both** the backend and frontend simultaneously using `concurrently`:

- **Server** → `http://localhost:3001`
- **Client** → `http://localhost:5173`

### 3. Open the App

1. Open `http://localhost:5173` in your **desktop** browser.
2. A QR code will be displayed on screen encoding your local network URL (e.g., `http://192.168.1.X:5173`).
3. Scan the QR code with your **phone's camera**.
4. Both devices are now synced — type on one, see it on the other instantly!

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
                   ┌────────▼────────┐
                   │  Express Server  │
                   │  (In-Memory)    │
                   │  Port: 3001     │
                   └─────────────────┘
```

1. **Backend** (`/server`) — Express serves the Socket.io endpoint. When a `clipboard:update` event arrives from any client, it is immediately re-broadcast to all other connected clients. Nothing is stored.
2. **Frontend** (`/client`) — React app connects to the Socket.io server over WebSocket. It reads the server's local IP from an API endpoint (`/api/info`) and uses it to generate the QR code.

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** — lightweight HTTP + API server
- **Socket.io** — bi-directional real-time WebSocket communication
- **cors** — allows the Vite dev server to communicate with Express

### Frontend
- **React** (via **Vite**) — fast, component-based UI
- **Tailwind CSS** — utility-first styling
- **qrcode.react** — renders the QR code in-browser
- **react-hot-toast** — elegant toast notifications
- **socket.io-client** — connects to the backend WebSocket

---

## 🔒 Privacy

QR-Pano is designed with privacy as a first principle:

- **No database** — zero data persistence.
- **No cloud** — all traffic stays on your local network.
- **No accounts** — no sign-up, no tracking.
- Data exists only in RAM for the duration of the session.

---

## 📄 License

MIT © 2026 — Feel free to use this in your own projects.
