import { useState } from "react";
import toast from "react-hot-toast";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
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
 * IncomingFile
 *
 * Props:
 *   file { token, filename, size, mimetype }
 *   onDismiss {function} — called after successful download
 */
export default function IncomingFile({ file, onDismiss }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone]               = useState(false);

  if (!file) return null;

  const { token, filename, size, mimetype } = file;

  const handleDownload = async () => {
    if (downloading || done) return;
    setDownloading(true);

    try {
      const res = await fetch(`/api/download/${token}`);

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      // Stream the response as a blob and trigger native save dialog
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`"${filename}" downloaded!`, { icon: "✅" });
      setDone(true);

      // Auto-dismiss after a short delay so the user sees the ✅ state
      setTimeout(() => onDismiss?.(), 1800);
    } catch (err) {
      console.error("[IncomingFile] download error:", err);
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="glass-card p-5 flex items-center gap-4 animate-slide-up"
      style={{
        borderColor: done
          ? "rgba(0,255,157,0.25)"
          : "rgba(0,210,255,0.2)",
        boxShadow: done
          ? "0 0 24px rgba(0,255,157,0.08)"
          : "0 0 24px rgba(0,210,255,0.08)",
      }}
      aria-label={`Incoming file: ${filename}`}
    >
      {/* Icon */}
      <span className="text-3xl flex-shrink-0" aria-hidden="true">
        {done ? "✅" : fileIcon(mimetype)}
      </span>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--neon-blue)" }}
          >
            ← Incoming
          </span>
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={filename}>
          {filename}
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {formatBytes(size)} · {mimetype || "unknown type"}
        </p>
      </div>

      {/* Download button */}
      {!done && (
        <button
          className="btn-primary flex-shrink-0"
          onClick={handleDownload}
          disabled={downloading}
          title="Download file"
          aria-label={`Download ${filename}`}
        >
          <DownloadIcon />
          {downloading ? "…" : "Save"}
        </button>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
