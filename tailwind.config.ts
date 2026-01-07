import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // UI8/Tran Mau Tri Tam inspired gray palette
        gray: {
          50: "#FAFBFC",
          100: "#F5F6F8",
          200: "#EAEDF2",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#737D8C", // Body text default
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#1A1F2B", // Headings
        },
        // Primary brand color - use sparingly
        primary: {
          50: "#F0F5FF",
          100: "#E0EBFF",
          200: "#C7DBFF",
          300: "#A3C4FF",
          400: "#7AABFF",
          500: "#4B8FFF", // Brand color
          600: "#3B7AE8",
          700: "#2B65D1",
          800: "#1B50BA",
          900: "#0B3BA3",
        },
        // Semantic colors
        success: {
          50: "#F0FDF4",
          500: "#22C55E",
          600: "#16A34A",
        },
        warning: {
          50: "#FFFBEB",
          500: "#F59E0B",
          600: "#D97706",
        },
        error: {
          50: "#FEF2F2",
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      spacing: {
        // 8px grid system
        "4.5": "18px",
        "18": "72px",
        "22": "88px",
      },
      fontSize: {
        base: ["15px", { lineHeight: "1.7" }],
        lg: ["17px", { lineHeight: "1.7" }],
        xl: ["20px", { lineHeight: "1.5" }],
        "2xl": ["24px", { lineHeight: "1.4" }],
        "3xl": ["30px", { lineHeight: "1.3" }],
        "4xl": ["36px", { lineHeight: "1.2" }],
        "5xl": ["48px", { lineHeight: "1.1" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      borderRadius: {
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(26,31,43,0.04)",
        sm: "0 2px 4px -1px rgba(26,31,43,0.06)",
        md: "0 4px 6px -1px rgba(26,31,43,0.10), 0 2px 4px -1px rgba(26,31,43,0.06)",
        lg: "0 10px 15px -3px rgba(26,31,43,0.10), 0 4px 6px -2px rgba(26,31,43,0.05)",
        xl: "0 20px 25px -5px rgba(26,31,43,0.10), 0 10px 10px -5px rgba(26,31,43,0.04)",
        glow: "0 0 0 8px rgba(75,143,255,0.2)",
        "glow-red": "0 0 0 8px rgba(239,68,68,0.2)",
      },
      animation: {
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-right": "slide-right 0.3s ease-out",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-right": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
