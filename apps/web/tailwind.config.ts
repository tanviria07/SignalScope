import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#f7f8fa",
          panel: "#ffffff",
          muted: "#f2f4f7",
          subtle: "#eef1f5",
          border: "#e3e7ee",
          strong: "#cfd7e3",
        },
        ink: {
          DEFAULT: "#111827",
          soft: "#1f2937",
          muted: "#4b5563",
          faint: "#6b7280",
        },
        accent: {
          DEFAULT: "#0f766e",
          dim: "#115e59",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16,24,40,0.06), 0 1px 1px rgba(16,24,40,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
