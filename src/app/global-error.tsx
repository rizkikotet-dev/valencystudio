"use client";

/**
 * Last-resort boundary — renders when the root layout itself fails, so it
 * carries its own <html>/<body> and inline styles (globals.css may not load).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#101012",
          color: "#f4f3f1",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          display: "flex",
          minHeight: "100svh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p style={{ color: "#f97316", fontSize: 11, letterSpacing: "0.3em" }}>
            CRITICAL ERROR · GALAT KRITIS
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "16px 0 8px" }}>
            The site failed to start
          </h1>
          <p style={{ color: "#a8a29e", fontSize: 13, lineHeight: 1.6 }}>
            Situs gagal dimuat. / Muat ulang halaman untuk mencoba lagi.
          </p>
          {error.digest ? (
            <p style={{ color: "#78716c", fontSize: 11, marginTop: 12 }}>
              digest: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#f97316",
              color: "#101012",
              border: "none",
              borderRadius: 6,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload · Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
