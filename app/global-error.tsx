"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") console.error("[qa-copilot] global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            padding: 28,
            border: "1px solid #1f1f24",
            borderRadius: 16,
            background: "#111114",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>QA Copilot crashed</h1>
          <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 16 }}>
            {error.message || "A fatal error occurred."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "#8b5cf6",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
