import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './constants*.ts',
    './types.ts',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
    extend: {
      screens: {
        xs: '0px',
        sm: '480px',
        md: '768px',
        lg: '1024px',
        xl: '1440px',
      },
      colors: {
        'brand-primary': 'var(--color-bg-canvas)',
        'brand-secondary': 'var(--color-bg-panel)',
        'brand-surface': 'var(--color-bg-panel)',
        'brand-surface-highlight': 'var(--color-border-subtle)',
        'brand-text': 'var(--color-text-primary)',
        'brand-text-secondary': 'var(--color-text-secondary)',
        'brand-accent': 'var(--color-accent-default)',
        'brand-accent-strong': 'var(--color-accent-strong)',
        'brand-on-accent': 'var(--color-on-accent)',
        'status-success-bg': 'var(--color-status-success-bg)',
        'status-success-text': 'var(--color-status-success-text)',
        'status-error-bg': 'var(--color-status-error-bg)',
        'status-error-text': 'var(--color-status-error-text)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '24px',
        'space-6': '32px',
        'space-7': '40px',
        'space-8': '56px',
        'space-9': '72px',
      },
      borderRadius: {
        'radius-xs': '4px',
        'radius-sm': '8px',
        'radius-md': '12px',
        'radius-lg': '20px',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-in-up': 'slide-in-up 0.4s ease-out both',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'layer-1': '0 8px 24px rgba(0,0,0,0.24)',
      },
      zIndex: {
        nav: '1200',
        fab: '1350',
        modal: '1400',
      },
    },
  },
  plugins: [],
};

export default config;
