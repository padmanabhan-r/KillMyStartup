import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        grotesk: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        kill: {
          black: "hsl(var(--kill-black))",
          dim: "hsl(var(--kill-dim))",
          white: "hsl(var(--kill-white))",
          amber: "hsl(var(--kill-amber))",
          red: "hsl(var(--kill-red))",
          "red-deep": "hsl(var(--kill-red-deep))",
          glow: "hsl(var(--kill-glow))",
        },
      },
      transitionDuration: {
        "1500": "1500ms",
        "2000": "2000ms",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "orb-dark": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "30%": { transform: "scale(1.015)", opacity: "0.85" },
          "60%": { transform: "scale(0.985)", opacity: "0.95" },
        },
        "orb-core": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "40%": { transform: "scale(1.1)", opacity: "1" },
          "70%": { transform: "scale(0.9)", opacity: "0.5" },
        },
        "orb-halo": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.4" },
          "50%": { transform: "scale(1.08)", opacity: "0.7" },
        },
        "orb-pulse-red": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        "orb-ring-rotate": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)", filter: "blur(4px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "blob-1": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "20%": { transform: "translate(28%, -22%) scale(1.12)" },
          "45%": { transform: "translate(-18%, 32%) scale(0.88)" },
          "70%": { transform: "translate(-28%, -18%) scale(1.08)" },
          "85%": { transform: "translate(18%, 20%) scale(0.95)" },
        },
        "blob-2": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "30%": { transform: "translate(-30%, 22%) scale(1.15)" },
          "55%": { transform: "translate(22%, -28%) scale(0.85)" },
          "80%": { transform: "translate(15%, 25%) scale(1.1)" },
        },
        "blob-3": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "15%": { transform: "translate(-25%, -28%) scale(1.1)" },
          "40%": { transform: "translate(30%, 15%) scale(0.9)" },
          "65%": { transform: "translate(20%, -22%) scale(1.05)" },
          "82%": { transform: "translate(-20%, 18%) scale(0.92)" },
        },
      },
      animation: {
        "orb-dark": "orb-dark 6s ease-in-out infinite",
        "orb-core": "orb-core 4s ease-in-out infinite",
        "orb-halo": "orb-halo 5s ease-in-out infinite",
        "blob-1": "blob-1 9s ease-in-out infinite",
        "blob-2": "blob-2 12s ease-in-out infinite",
        "blob-3": "blob-3 7s ease-in-out infinite",
        "orb-pulse-red": "orb-pulse-red 0.8s ease-in-out infinite",
        "orb-ring": "orb-ring-rotate 3s linear infinite",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
