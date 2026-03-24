import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";

/* ─── File type → emoji helper ──────────────────────────────────────────── */
function fileIcon(mime = "") {
  if (mime.startsWith("image/"))  return "🖼️";
  if (mime.startsWith("video/"))  return "🎬";
  if (mime.startsWith("audio/"))  return "🎵";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z")) return "🗜️";
  if (mime.startsWith("text/"))   return "📝";
  return "📦";
}

function formatBytes(bytes = 0) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * FileTransferPanel
 *
 * Props:
 *   isConnected {boolean} — whether Socket.io is live
 */
export default function FileTransferPanel({ isConnected }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress]         = useState(0); // 0-100
  const [sending, setSending]           = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const inputRef = useRef(null);

  /* ── File selection ── */
  const selectFile = useCallback((file) => {
    if (!file) return;
    setSelectedFile(file);
    setProgress(0);
  }, []);

  const onFileChange = (e) => selectFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true);  };
  const onDragLeave = ()  => setDragOver(false);

  /* ── Upload via XHR (for real progress events) ── */
  const handleSend = () => {
    if (!selectedFile || !isConnected || sending) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        toast.success(`"${selectedFile.name}" sent!`, { icon: "📡" });
        setSelectedFile(null);
        setProgress(0);
      } else {
        toast.error(`Upload failed (${xhr.status}).`);
      }
      setSending(false);
    });

    xhr.addEventListener("error", () => {
      toast.error("Network error during upload.");
      setSending(false);
    });

    xhr.open("POST", "/api/upload");
    setSending(true);
    setProgress(0);
    xhr.send(formData);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="glass-card flex flex-col gap-4 p-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
            File Transfer
          </h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Zero persistence · RAM only · one-shot download
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
        >
          <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="File drop zone"
        className="upload-zone"
        data-drag={dragOver ? "active" : undefined}
        onClick={() => !sending && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !sending && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={onFileChange}
          aria-label="File input"
        />

        {selectedFile ? (
          /* File chip */
          <div className="file-chip">
            <span className="text-2xl" aria-hidden="true">
              {fileIcon(selectedFile.type)}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {formatBytes(selectedFile.size)} · {selectedFile.type || "unknown type"}
              </span>
            </div>
          </div>
        ) : (
          /* Idle state */
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="text-3xl" aria-hidden="true">📂</span>
            <p className="text-sm text-[var(--text-secondary)]">
              Drop a file here or <span style={{ color: "var(--neon-blue)" }}>click to browse</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Photos, videos, PDFs, documents — up to 500 MB
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {sending && (
        <div className="progress-track" aria-label={`Upload progress ${progress}%`}>
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <span className="text-[11px] text-[var(--text-muted)] mt-1 self-end tabular-nums">
            {progress}%
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          className="btn-primary flex-1"
          onClick={handleSend}
          disabled={!isConnected || !selectedFile || sending}
          title={!isConnected ? "Not connected" : !selectedFile ? "Select a file first" : "Send file"}
          aria-label="Send file"
        >
          <UploadIcon />
          {sending ? `Sending… ${progress}%` : "Send File"}
        </button>

        {selectedFile && !sending && (
          <button className="btn-ghost" onClick={handleClear} title="Clear selection" aria-label="Clear file selection">
            <ClearIcon />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Icons ── */
function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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
