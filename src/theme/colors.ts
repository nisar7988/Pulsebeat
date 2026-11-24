export const colors = {
  background: {
    DEFAULT: '#0B1309',
    surface: '#101C0D',
    card: '#152411',
    elevated: '#1C3017',
    player: '#0A1208',
  },
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
  text: {
    DEFAULT: '#F8FAFC',
    muted: 'rgba(255, 255, 255, 0.70)',
    subtle: 'rgba(255, 255, 255, 0.50)',
    disabled: 'rgba(255, 255, 255, 0.35)',
    dark: '#0B1309',
    lime: '#C8F929',
  },
  glass: {
    border: 'rgba(200, 249, 41, 0.20)',
    borderLight: 'rgba(255, 255, 255, 0.12)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderHeavy: 'rgba(200, 249, 41, 0.55)',
    tint: 'rgba(22, 38, 17, 0.50)',
    tintLight: 'rgba(22, 38, 17, 0.25)',
    tintActive: 'rgba(200, 249, 41, 0.18)',
    tintHeavy: 'rgba(200, 249, 41, 0.28)',
    pill: 'rgba(200, 249, 41, 0.12)',
    fallback: '#101C0D',
    fallbackSearch: '#142510',
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
  playerUi: {
    trackBg: 'rgba(10, 18, 8, 0.85)',
    fan: 'rgba(200, 249, 41, 0.14)',
    ring: 'rgba(200, 249, 41, 0.30)',
  },
} as const;

export const gradients = {
  app: ['#0E190C', '#070E05'],
  search: ['#132210', '#0B1408', '#060B04'],
  player: ['#182A13', '#0E1A0C', '#070C05'],
  orb: ['rgba(200, 249, 41, 0.65)', 'rgba(34, 197, 94, 0.50)'] as [string, string],
  playerOverlay: [
    'rgba(14, 26, 12, 0.60)',
    'rgba(10, 18, 8, 0.85)',
    'rgba(5, 10, 4, 0.95)',
  ] as [string, string, string],
  panel: [
    'rgba(19, 34, 16, 0.94)',
    'rgba(12, 22, 10, 0.97)',
    'rgba(7, 13, 6, 1)',
  ] as [string, string, string],
  lime: ['#D4FF32', '#9CE618'] as [string, string],
};

export type Colors = typeof colors;
export type Gradients = typeof gradients;
