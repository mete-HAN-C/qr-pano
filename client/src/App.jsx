import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import socket from "./socket";
import { copyToClipboard } from "./utils/clipboard";
import QRDisplay from "./components/QRDisplay";
import ClipboardPanel from "./components/ClipboardPanel";

/* ─── App ─────────────────────────────────────────────────────────────────── */

export default function App() {
  const [serverInfo, setServerInfo] = useState(null);   // { ip, port }
  const [qrUrl, setQrUrl]           = useState("");      // full URL for QR
  const [isConnected, setIsConnected] = useState(false);
  const [incomingText, setIncomingText] = useState("");  // last text from other device
  const [history, setHistory]          = useState([]);   // received message log

  /* ── 1. Fetch server info → build QR URL → connect socket ── */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res  = await fetch("/api/info");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();                    // { ip, port }

        if (cancelled) return;
        setServerInfo(data);

        // QR code points to the Vite dev server (port 5173) on the local IP
        setQrUrl(`http://${data.ip}:5173`);

        // Connect socket (autoConnect: false, so we do it manually here)
        socket.connect();
      } catch (err) {
        console.error("[QR-Pano] Failed to fetch /api/info:", err);
        toast.error("Could not reach server. Is it running?", { duration: 6000 });
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  /* ── 2. Socket lifecycle events ── */
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      toast.success("Connected to relay server!", { icon: "⚡", duration: 2000 });
    }

    function onDisconnect(reason) {
      setIsConnected(false);
      toast.error(`Disconnected: ${reason}`, { duration: 3000 });
    }

    function onConnectError(err) {
      console.error("[Socket] connection error", err.message);
      toast.error("Connection error — retrying…", { id: "conn-err" });
    }

    function onClipboardUpdate({ text }) {
      if (!text) return;
      setIncomingText(text);
      setHistory((prev) => [
        { id: Date.now(), text, direction: "in" },
        ...prev,
      ].slice(0, 20));                                   // keep last 20 entries
      toast("New text from other device!", { icon: "📱", duration: 2500 });
    }

    socket.on("connect",          onConnect);
    socket.on("disconnect",       onDisconnect);
    socket.on("connect_error",    onConnectError);
    socket.on("clipboard-update", onClipboardUpdate);

    return () => {
      socket.off("connect",          onConnect);
      socket.off("disconnect",       onDisconnect);
      socket.off("connect_error",    onConnectError);
      socket.off("clipboard-update", onClipboardUpdate);
    };
  }, []);

  /* ── 3. Send text to other devices ── */
  const handleSend = useCallback((text) => {
    socket.emit("clipboard-update", { text });
    setHistory((prev) => [
      { id: Date.now(), text, direction: "out" },
      ...prev,
    ].slice(0, 20));
  }, []);

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="w-full px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg,#00d2ff,#00ff9d)" }}
          >
            📋
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-gradient leading-none">
              QR-Pano
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5 tracking-wide">
              Local Network Clipboard
            </p>
          </div>
        </div>

        {/* Connection status chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: isConnected
              ? "rgba(0,255,157,0.08)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${isConnected
              ? "rgba(0,255,157,0.2)"
              : "var(--border-subtle)"}`,
            color: isConnected ? "#00ff9d" : "var(--text-muted)",
          }}
        >
          <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
          {isConnected
            ? `${serverInfo?.ip ?? "…"}`
            : "Waiting for server"}
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8
                       flex flex-col lg:flex-row gap-6 items-start">

        {/* Left column — QR code */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 animate-slide-up"
          style={{ animationDelay: "0ms" }}
        >
          <QRDisplay url={qrUrl} size={192} />
        </div>

        {/* Right column — clipboard + history */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 animate-slide-up"
          style={{ animationDelay: "80ms" }}
        >
          <ClipboardPanel
            incomingText={incomingText}
            onSend={handleSend}
            isConnected={isConnected}
          />

          {/* History log */}
          {history.length > 0 && (
            <HistoryLog entries={history} />
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full px-6 py-3 text-center text-[11px] text-[var(--text-muted)]"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        QR-Pano · zero persistence · data never leaves your network
      </footer>
    </div>
  );
}

/* ─── History Log ─────────────────────────────────────────────────────────── */

function HistoryLog({ entries }) {
  const copyEntry = async (text) => {
    try {
      await copyToClipboard(text);
      toast.success("Copied!", { icon: "✅" });
    } catch {
      toast.error("Could not copy — try selecting manually.");
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Session History
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full text-[var(--text-muted)]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
        >
          {entries.length} item{entries.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {entries.map((entry) => (
          <div key={entry.id}
            className="message-bubble group flex items-start gap-3 cursor-pointer"
            onClick={() => copyEntry(entry.text)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && copyEntry(entry.text)}
            title="Click to copy"
          >
            {/* Direction badge */}
            <span className="mt-0.5 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: entry.direction === "in" ? "#00d2ff" : "#00ff9d" }}
            >
              {entry.direction === "in" ? "← IN" : "OUT →"}
            </span>

            {/* Text */}
            <p className="flex-1 text-sm text-[var(--text-primary)] leading-relaxed break-all line-clamp-3">
              {entry.text}
            </p>

            {/* Copy icon (appears on hover) */}
            <span className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
