import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "QA Copilot — your senior QA engineer, on demand";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamic OG image used for social previews (Twitter / OG). */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.45), transparent 70%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage:
                "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
              color: "#ffffff",
              fontSize: 44,
              fontWeight: 800,
              borderRadius: 16,
              letterSpacing: "-0.04em",
            }}
          >
            Q
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              QA Copilot
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#a1a1aa",
                marginTop: 2,
              }}
            >
              AI testing dashboard · Gemini · Zod-validated
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 1040,
            }}
          >
            <div style={{ display: "flex" }}>Your senior QA engineer,</div>
            <div
              style={{
                display: "flex",
                backgroundImage:
                  "linear-gradient(90deg, #c4b5fd 0%, #f0abfc 50%, #fda4af 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              on demand.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#a1a1aa",
              lineHeight: 1.35,
              maxWidth: 1000,
            }}
          >
            Coverage reports · Edge cases · Exploratory charters · Runnable Playwright specs.
          </div>
        </div>

        {/* Footer chips */}
        <div style={{ display: "flex", gap: 14 }}>
          {["Analyze", "Edge Cases", "Exploratory", "Playwright"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(139,92,246,0.45)",
                backgroundColor: "rgba(139,92,246,0.10)",
                color: "#c4b5fd",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
