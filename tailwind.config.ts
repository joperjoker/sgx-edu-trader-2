import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sgx-canvas": "#F8FAFC",
        "sgx-surface": "#FFFFFF",
        "sgx-subtle": "#F1F5F9",
        "sgx-border": "#E2E8F0",
        "sgx-ink": "#0F172A",
        "sgx-slate": "#475569",
        "sgx-muted": "#64748B",
        "sgx-blue": "#0052FF",
        "sgx-teal": "#0EA5E9",
        "sgx-bull": "#059669",
        "sgx-bull-ink": "#047857",
        "sgx-bull-tint": "#ECFDF5",
        "sgx-bear": "#E11D48",
        "sgx-bear-ink": "#BE123C",
        "sgx-bear-tint": "#FFF1F2",
        "sgx-amber": "#D97706",
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "flash-bull": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgba(5, 150, 105, 0.16)" },
        },
        "flash-bear": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgba(225, 29, 72, 0.16)" },
        },
      },
      animation: {
        "fade-in": "fade-in 350ms ease-out forwards",
        "scale-in": "scale-in 200ms ease-out forwards",
        "fade-up": "fade-up 300ms ease-out both",
        "flash-bull": "flash-bull 450ms ease-out",
        "flash-bear": "flash-bear 450ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
