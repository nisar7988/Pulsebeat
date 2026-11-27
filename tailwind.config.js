/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          elevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          player: 'rgb(var(--color-bg-player) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        card: 'rgb(var(--color-bg-card) / <alpha-value>)',
        elevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          neon: 'rgb(var(--color-primary-neon) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          dark: 'rgb(var(--color-secondary-dark) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          lime: 'rgb(var(--color-accent) / <alpha-value>)',
          pink: 'rgb(var(--color-accent) / <alpha-value>)',
          cyan: 'rgb(var(--color-accent-cyan) / <alpha-value>)',
          glow: 'rgb(var(--color-accent) / <alpha-value>)',
        },
        lime: 'rgb(var(--color-accent) / <alpha-value>)',
        pink: 'rgb(var(--color-accent) / <alpha-value>)',

        text: {
          DEFAULT: '#F8FAFC',
          muted: 'rgba(255, 255, 255, 0.70)',
          subtle: 'rgba(255, 255, 255, 0.50)',
          disabled: 'rgba(255, 255, 255, 0.35)',
          dark: 'rgb(var(--color-text-dark) / <alpha-value>)',
          lime: 'rgb(var(--color-accent) / <alpha-value>)',
        },
        muted: 'rgba(255, 255, 255, 0.70)',
        subtle: 'rgba(255, 255, 255, 0.50)',

        glass: {
          border: 'rgb(var(--color-accent) / 0.20)',
          'border-light': 'rgba(255, 255, 255, 0.12)',
          'border-subtle': 'rgba(255, 255, 255, 0.08)',
          'border-heavy': 'rgb(var(--color-accent) / 0.55)',
          tint: 'rgb(var(--color-glass-tint) / 0.50)',
          'tint-light': 'rgb(var(--color-glass-tint) / 0.25)',
          'tint-active': 'rgb(var(--color-accent) / 0.18)',
          'tint-heavy': 'rgb(var(--color-accent) / 0.28)',
          pill: 'rgb(var(--color-accent) / 0.12)',
          fallback: 'rgb(var(--color-bg-surface) / <alpha-value>)',
          'fallback-search': 'rgb(var(--color-bg-card) / <alpha-value>)',
        },

        border: {
          DEFAULT: 'rgb(var(--color-accent) / 0.16)',
          light: 'rgba(255, 255, 255, 0.12)',
        },

        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#38BDF8',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '27px',
        '5xl': '32px',
      },
    },
  },
  plugins: [],
};
