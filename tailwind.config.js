/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0B0B14',
        surface: '#151522',
        card: '#1C1C2E',
        elevated: '#25253A',

        primary: '#8B5CF6',
        secondary: '#6366F1',
        accent: '#22D3EE',
        pink: '#EC4899',

        text: '#F8FAFC',
        muted: '#9CA3AF',
        subtle: '#6B7280',

        border: '#2D2D44',

        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
};