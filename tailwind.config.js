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
          DEFAULT: '#0B0B14',
          surface: '#151522',
          card: '#1C1C2E',
          elevated: '#25253A',
          player: '#1c1160',
        },
        surface: '#151522',
        card: '#1C1C2E',
        elevated: '#25253A',

        primary: {
          DEFAULT: '#8B5CF6',
          dark: '#3723c8',
          light: '#A78BFA',
        },
        secondary: {
          DEFAULT: '#6366F1',
          dark: '#6928be',
          light: '#818CF8',
        },
        accent: {
          DEFAULT: '#ff6aa9',
          pink: '#EC4899',
          cyan: '#22D3EE',
          glow: '#ff66ff',
        },
        pink: '#EC4899',

        text: {
          DEFAULT: '#F8FAFC',
          muted: 'rgba(255, 255, 255, 0.70)',
          subtle: 'rgba(255, 255, 255, 0.50)',
          disabled: 'rgba(255, 255, 255, 0.35)',
          dark: '#1d1040',
        },
        muted: 'rgba(255, 255, 255, 0.70)',
        subtle: 'rgba(255, 255, 255, 0.50)',

        glass: {
          border: 'rgba(255, 255, 255, 0.45)',
          'border-light': 'rgba(255, 255, 255, 0.20)',
          'border-subtle': 'rgba(255, 255, 255, 0.12)',
          'border-heavy': 'rgba(255, 255, 255, 0.80)',
          tint: 'rgba(255, 255, 255, 0.12)',
          'tint-light': 'rgba(255, 255, 255, 0.08)',
          'tint-active': 'rgba(255, 255, 255, 0.26)',
          'tint-heavy': 'rgba(255, 255, 255, 0.42)',
          pill: 'rgba(255, 255, 255, 0.13)',
          fallback: '#6f5df0',
          'fallback-search': '#7b78f8',
        },

        border: {
          DEFAULT: '#2D2D44',
          light: 'rgba(255, 255, 255, 0.15)',
        },

        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
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
