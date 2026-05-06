import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef9e7",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        brutal: {
          yellow: "#FFD700",
          pink: "#FF6B9D",
          cyan: "#00D4FF",
          lime: "#BFFF00",
          orange: "#FF8C42",
          purple: "#B388FF",
          bg: "#FFF8E7",
          dark: "#1a1a2e",
        },
      },
      boxShadow: {
        brutal: "2px 2px 0px 0px #000000",
        "brutal-sm": "1px 1px 0px 0px #000000",
        "brutal-lg": "3px 3px 0px 0px #000000",
        "brutal-hover": "3px 3px 0px 0px #000000",
        "brutal-active": "1px 1px 0px 0px #000000",
        "brutal-white": "2px 2px 0px 0px #ffffff",
        "brutal-white-sm": "1px 1px 0px 0px #ffffff",
      },
      borderWidth: {
        3: "3px",
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      translate: {
        "brutal": "2px",
        "brutal-sm": "1px",
      },
    },
  },
  plugins: [],
} satisfies Config;
