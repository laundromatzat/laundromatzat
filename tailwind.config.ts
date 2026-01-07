import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./constants*.ts",
    "./types.ts",
  ],
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
        "aura-bg": "#F5F2EB",
        "aura-text-primary": "#2C2A26",
        "aura-text-secondary": "#4B4943",
        "aura-accent": "#D6D1C7",
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
      },
      boxShadow: {
        "layer-1": "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.2)",
      },
      zIndex: {
        nav: "1200",
        fab: "1350",
        modal: "1400",
      },
    },
  },
  plugins: [],
};

export default config;
