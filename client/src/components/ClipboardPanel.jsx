import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { copyToClipboard } from "../utils/clipboard";

/**
 * ClipboardPanel
 *
 * Props:
 *   incomingText  {string}    — text pushed from the other device (via Socket.io in App.jsx)
 *   onSend        {function}  — called with the current textarea value when user clicks "Send"
 *   isConnected   {boolean}   — whether the Socket.io connection is live
 */
export default function ClipboardPanel({ incomingText = "", onSend, isConnected }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  /* ── Sync incoming text from the other device ── */
  useEffect(() => {
    if (incomingText !== "") {
      setText(incomingText);
      // Auto-focus so the user notices the update
      textareaRef.current?.focus();
    }
  }, [incomingText]);

  /* ── Handlers ── */
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Nothing to send — type something first.");
      return;
    }
    onSend?.(trimmed);
    toast.success("Sent to other device!", { icon: "📡" });
  };

  const handleCopy = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Nothing to copy.");
      return;
    }
    try {
      await copyToClipboard(trimmed);
      toast.success("Copied to clipboard!", { icon: "✅" });
    } catch {
      toast.error("Could not copy — try selecting text manually.");
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter → Send
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = text.length;

  return (
    <div className="glass-card flex flex-col gap-4 p-6 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
            Clipboard
          </h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Type here · sync is instant
          </p>
        </div>

        {/* Connection badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
        >
          <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="input-neon w-full min-h-[180px] p-4 leading-relaxed"
          placeholder="Paste or type text, links, codes…&#10;&#10;Press Ctrl + Enter to send."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          aria-label="Clipboard text area"
        />

        {/* Char counter */}
        {charCount > 0 && (
          <span
            className="absolute bottom-3 right-3 text-[10px] tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            {charCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Send */}
        <button
          className="btn-primary flex-1"
          onClick={handleSend}
          disabled={!isConnected || !text.trim()}
          title={!isConnected ? "Not connected to server" : "Send (Ctrl+Enter)"}
        >
          <SendIcon />
          Send
        </button>

        {/* Copy */}
        <button
          className="btn-ghost"
          onClick={handleCopy}
          disabled={!text.trim()}
          title="Copy to clipboard"
        >
          <CopyIcon />
          Copy
        </button>

        {/* Clear */}
        {text && (
          <button
            className="btn-ghost"
            onClick={() => setText("")}
            title="Clear"
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-[11px] text-[var(--text-muted)] text-center -mt-1">
        <kbd className="px-1.5 py-0.5 rounded text-[10px]"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-muted)" }}
        >Ctrl</kbd>
        {" + "}
        <kbd className="px-1.5 py-0.5 rounded text-[10px]"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-muted)" }}
        >↵</kbd>
        {" to send quickly"}
      </p>
    </div>
  );
}

/* ── Inline SVG icons (no external dep needed) ─────────────────────────── */
function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
