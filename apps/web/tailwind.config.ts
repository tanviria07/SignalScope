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
          DEFAULT: "#fafaf9",
          muted: "#f5f5f4",
          border: "#e7e5e4",
        },
        ink: {
          DEFAULT: "#1c1917",
          muted: "#57534e",
          faint: "#78716c",
        },
        accent: {
          DEFAULT: "#0d9488",
          dim: "#115e59",
        },
      },
    },
  },
  plugins: [],
};

export default config;
