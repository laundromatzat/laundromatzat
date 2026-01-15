import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },
    },
    extend: {
      screens: {
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },
      colors: {
        // Aura Design System - Premium Brand Colors
        "aura-bg": "#F5F2EB",
        "aura-text-primary": "#2C2A26",
        "aura-text-secondary": "#4B4943",
        "aura-text-tertiary": "#78756F",
        "aura-accent": "#D6D1C7",
        "aura-accent-hover": "#C9C3B8",
        "aura-accent-light": "#E8E5DD",
        "aura-surface": "#FFFFFF",
        "aura-surface-elevated": "#FDFCFA",
        "aura-border": "#E5E2DA",
        "aura-border-light": "#F0EDE5",

        // Semantic Colors
        "aura-success": "#567d65",
        "aura-success-light": "#e3ebe6",
        "aura-warning": "#a88160",
        "aura-warning-light": "#f3efe9",
        "aura-error": "#9a6e51",
        "aura-error-light": "#faf7f5",
        "aura-info": "#4B4943",
        "aura-info-light": "#E8E5DD",

        "brand-primary": "var(--color-bg-canvas)",
        "brand-secondary": "var(--color-bg-panel)",
        "brand-surface": "var(--color-bg-panel)",
        "brand-surface-highlight": "var(--color-border-subtle)",
        "brand-text": "var(--color-text-primary)",
        "brand-text-secondary": "var(--color-text-secondary)",
        "brand-accent": "var(--color-accent-default)",
        "brand-accent-strong": "var(--color-accent-strong)",
        "brand-on-accent": "var(--color-on-accent)",
        "status-success-bg": "var(--color-status-success-bg)",
        "status-success-text": "var(--color-status-success-text)",
        "status-error-bg": "var(--color-status-error-bg)",
        "status-error-text": "var(--color-status-error-text)",
        sage: {
          50: "#f4f7f5",
          100: "#e3ebe6",
          200: "#c5d9cd",
          300: "#9dbba9",
          400: "#769a84",
          500: "#567d65",
          600: "#42624e",
          700: "#364f40",
          800: "#2d3f34",
          900: "#26352d",
        },
        timber: {
          50: "#faf7f5",
          100: "#f3efe9",
          200: "#e6ded4",
          300: "#d2c2b0",
          400: "#bc9f85",
          500: "#a88160",
          600: "#9a6e51",
          700: "#805743",
          800: "#6a493a",
          900: "#563c31",
        },
      },
      fontFamily: {
        sans: [
          '"Inter Variable"',
          "Inter",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      spacing: {
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-5": "24px",
        "space-6": "32px",
        "space-7": "40px",
        "space-8": "56px",
        "space-9": "72px",
      },
      borderRadius: {
        "radius-xs": "4px",
        "radius-sm": "8px",
        "radius-md": "12px",
        "radius-lg": "20px",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-in-up": "slide-in-up 0.4s ease-out both",
        "smooth-in": "smooth-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1) both",
        "glow-pulse": "glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "smooth-in": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(214, 209, 199, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(214, 209, 199, 0.5)" },
        },
      },
      boxShadow: {
        "layer-1": "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.2)",
        // Aura Shadow System
        "aura-xs": "0 1px 2px 0 rgba(44, 42, 38, 0.05)",
        "aura-sm":
          "0 1px 3px 0 rgba(44, 42, 38, 0.1), 0 1px 2px 0 rgba(44, 42, 38, 0.06)",
        "aura-md":
          "0 4px 6px -1px rgba(44, 42, 38, 0.1), 0 2px 4px -1px rgba(44, 42, 38, 0.06)",
        "aura-lg":
          "0 10px 15px -3px rgba(44, 42, 38, 0.1), 0 4px 6px -2px rgba(44, 42, 38, 0.05)",
        "aura-xl":
          "0 20px 25px -5px rgba(44, 42, 38, 0.1), 0 10px 10px -5px rgba(44, 42, 38, 0.04)",
        "aura-2xl": "0 25px 50px -12px rgba(44, 42, 38, 0.25)",
        "aura-glow": "0 0 20px rgba(214, 209, 199, 0.4)",
        "aura-inner": "inset 0 2px 4px 0 rgba(44, 42, 38, 0.06)",
      },
      zIndex: {
        nav: "1200",
        fab: "1350",
        modal: "1400",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
