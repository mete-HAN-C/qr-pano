/**
 * copyToClipboard — works on both HTTPS/localhost AND plain HTTP (local network)
 *
 * IMPORTANT: This function is intentionally NOT async.
 * iOS Safari and Android Chrome require execCommand('copy') to run
 * synchronously within the original user-gesture (click/touch) call stack.
 * Using async/await — even with no real awaits — hands control back to the
 * event loop and the browser drops the gesture context, making execCommand
 * silently no-op while still returning true.
 *
 * We use an explicit Promise so callers can still await/then it, while
 * keeping execCommand itself synchronous.
 */
export function copyToClipboard(text) {
  // ── Preferred: modern Clipboard API (localhost / HTTPS) ──
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  // ── Fallback: execCommand — must stay synchronous for mobile gesture context ──
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // Must be in the viewport (not -9999px) for some mobile browsers to
    // recognize the selection. Opacity 0 keeps it invisible.
    Object.assign(textarea.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "2em",
      height: "2em",
      padding: "0",
      border: "none",
      outline: "none",
      boxShadow: "none",
      background: "transparent",
      opacity: "0",
      fontSize: "16px", // prevent iOS auto-zoom on focus
    });

    document.body.appendChild(textarea);
    textarea.focus();

    // Both select() and setSelectionRange() for maximum iOS Safari compat
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    try {
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) {
        resolve();
      } else {
        reject(new Error("execCommand('copy') returned false."));
      }
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
}

