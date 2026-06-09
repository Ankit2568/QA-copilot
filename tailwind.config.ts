import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        bg: {
          DEFAULT: "#09090b",
          subtle: "#0c0c0f",
          surface: "#111114",
          elevated: "#16161a",
        },
        border: {
          DEFAULT: "#1f1f24",
          subtle: "#18181c",
          strong: "#2a2a31",
        },
        fg: {
          DEFAULT: "#fafafa",
          muted: "#a1a1aa",
          subtle: "#71717a",
          faint: "#52525b",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          hover: "#a78bfa",
          subtle: "#1f1530",
        },
        tool: {
          analyze: "#3b82f6",
          edge: "#8b5cf6",
          exploratory: "#10b981",
          playwright: "#f59e0b",
        },
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.15), transparent 60%)",
        "hero-glow":
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.25), transparent 70%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.4), 0 8px 32px -8px rgba(139,92,246,0.3)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.03)",
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
