import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Violet "Q" app icon, mirrors the Sidebar branding. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
          color: "#ffffff",
          fontSize: 42,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.04em",
          borderRadius: 12,
        }}
      >
        Q
      </div>
    ),
    { ...size }
  );
}
