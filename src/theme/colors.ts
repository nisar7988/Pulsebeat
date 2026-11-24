export const colors = {
  background: {
    DEFAULT: '#0B0B14',
    surface: '#151522',
    card: '#1C1C2E',
    elevated: '#25253A',
    player: '#1c1160',
  },
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
  text: {
    DEFAULT: '#F8FAFC',
    muted: 'rgba(255, 255, 255, 0.70)',
    subtle: 'rgba(255, 255, 255, 0.50)',
    disabled: 'rgba(255, 255, 255, 0.35)',
    dark: '#1d1040',
  },
  glass: {
    border: 'rgba(255, 255, 255, 0.45)',
    borderLight: 'rgba(255, 255, 255, 0.20)',
    borderSubtle: 'rgba(255, 255, 255, 0.12)',
    borderHeavy: 'rgba(255, 255, 255, 0.80)',
    tint: 'rgba(255, 255, 255, 0.12)',
    tintLight: 'rgba(255, 255, 255, 0.08)',
    tintActive: 'rgba(255, 255, 255, 0.26)',
    tintHeavy: 'rgba(255, 255, 255, 0.42)',
    pill: 'rgba(255, 255, 255, 0.13)',
    fallback: '#6f5df0',
    fallbackSearch: '#7b78f8',
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
  playerUi: {
    trackBg: 'rgba(15, 8, 50, 0.75)',
    fan: 'rgba(20, 10, 90, 0.28)',
    ring: 'rgba(25, 10, 80, 0.45)',
  },
} as const;

export const gradients = {
  app: ['#3b82f6', '#8b5cf6'],
  search: ['#4a7bf7', '#7b79f8', '#b882fa'],
  player: ['#3723c8', '#6928be', '#a53cbe'],
  orb: ['rgba(255, 80, 220, 0.75)', 'rgba(110, 60, 255, 0.75)'] as [string, string],
  playerOverlay: [
    'rgba(25, 35, 140, 0.55)',
    'rgba(60, 30, 170, 0.45)',
    'rgba(70, 25, 150, 0.90)',
  ] as [string, string, string],
  panel: [
    'rgba(55, 35, 200, 0.92)',
    'rgba(105, 40, 190, 0.96)',
    'rgba(165, 60, 190, 1)',
  ] as [string, string, string],
};

export type Colors = typeof colors;
export type Gradients = typeof gradients;
