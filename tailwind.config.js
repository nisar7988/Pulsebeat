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
          DEFAULT: '#0B1309',
          surface: '#101C0D',
          card: '#152411',
          elevated: '#1C3017',
          player: '#0A1208',
        },
        surface: '#101C0D',
        card: '#152411',
        elevated: '#1C3017',

        primary: {
          DEFAULT: '#C8F929',
          dark: '#94C312',
          light: '#D6FF50',
          neon: '#CEFB02',
        },
        secondary: {
          DEFAULT: '#22C55E',
          dark: '#166534',
          light: '#4ADE80',
        },
        accent: {
          DEFAULT: '#C8F929',
          lime: '#C8F929',
          pink: '#C8F929',
          cyan: '#34D399',
          glow: '#C8F929',
        },
        lime: '#C8F929',
        pink: '#C8F929',

        text: {
          DEFAULT: '#F8FAFC',
          muted: 'rgba(255, 255, 255, 0.70)',
          subtle: 'rgba(255, 255, 255, 0.50)',
          disabled: 'rgba(255, 255, 255, 0.35)',
          dark: '#0B1309',
          lime: '#C8F929',
        },
        muted: 'rgba(255, 255, 255, 0.70)',
        subtle: 'rgba(255, 255, 255, 0.50)',

        glass: {
          border: 'rgba(200, 249, 41, 0.20)',
          'border-light': 'rgba(255, 255, 255, 0.12)',
          'border-subtle': 'rgba(255, 255, 255, 0.08)',
          'border-heavy': 'rgba(200, 249, 41, 0.55)',
          tint: 'rgba(22, 38, 17, 0.50)',
          'tint-light': 'rgba(22, 38, 17, 0.25)',
          'tint-active': 'rgba(200, 249, 41, 0.18)',
          'tint-heavy': 'rgba(200, 249, 41, 0.28)',
          pill: 'rgba(200, 249, 41, 0.12)',
          fallback: '#101C0D',
          'fallback-search': '#142510',
        },

        border: {
          DEFAULT: 'rgba(200, 249, 41, 0.16)',
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
