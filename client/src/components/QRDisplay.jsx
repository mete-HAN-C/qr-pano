import { QRCodeSVG } from "qrcode.react";

/**
 * QRDisplay
 * Props:
 *   url  {string}  — the full URL to encode (e.g. "http://192.168.1.X:5173")
 *   size {number}  — QR code pixel size (default 200)
 */
export default function QRDisplay({ url, size = 200 }) {
  if (!url) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-3 p-8 min-h-[280px]">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent border-neon-blue animate-spin" />
        <p className="text-sm text-[var(--text-muted)] font-medium tracking-wide">
          Detecting local IP…
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col items-center gap-5 p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Scan to connect
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Same Wi-Fi required
        </p>
      </div>

      {/* QR code wrapper with neon glow ring */}
      <div
        className="relative p-4 rounded-2xl animate-pulse-glow"
        style={{
          background: "rgba(255,255,255,0.97)",
          boxShadow:
            "0 0 0 1px rgba(0,210,255,0.3), 0 0 32px rgba(0,210,255,0.25), 0 0 80px rgba(0,210,255,0.08)",
        }}
      >
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#f8f8f8"
          fgColor="#0a0a0a"
          level="M"
          includeMargin={false}
        />

        {/* Corner accent lines */}
        <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-blue rounded-tl-lg" />
        <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-blue rounded-tr-lg" />
        <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-blue rounded-bl-lg" />
        <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-blue rounded-br-lg" />
      </div>

      {/* URL label */}
      <div className="flex flex-col items-center gap-1 w-full">
        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
          URL
        </p>
        <code
          className="text-xs font-mono text-neon-blue break-all text-center px-3 py-1.5 rounded-md"
          style={{ background: "rgba(0,210,255,0.07)", border: "1px solid rgba(0,210,255,0.15)" }}
        >
          {url}
        </code>
      </div>
    </div>
  );
}
