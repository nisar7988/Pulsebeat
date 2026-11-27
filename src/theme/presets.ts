export type ThemePresetId =
  | 'pulse'
  | 'cool'
  | 'warm'
  | 'winter'
  | 'hot'
  | 'aurora';

export interface ThemeRgbTokens {
  bg: string;
  bgSurface: string;
  bgCard: string;
  bgElevated: string;
  bgPlayer: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryNeon: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  accentCyan: string;
  textDark: string;
  glassTint: string;
}

export interface AppThemeColors {
  background: {
    DEFAULT: string;
    surface: string;
    card: string;
    elevated: string;
    player: string;
  };
  primary: {
    DEFAULT: string;
    dark: string;
    light: string;
    neon: string;
  };
  secondary: {
    DEFAULT: string;
    dark: string;
    light: string;
  };
  accent: {
    DEFAULT: string;
    lime: string;
    pink: string;
    cyan: string;
    glow: string;
  };
  text: {
    DEFAULT: string;
    muted: string;
    subtle: string;
    disabled: string;
    dark: string;
    lime: string;
  };
  glass: {
    border: string;
    borderLight: string;
    borderSubtle: string;
    borderHeavy: string;
    tint: string;
    tintLight: string;
    tintActive: string;
    tintHeavy: string;
    pill: string;
    fallback: string;
    fallbackSearch: string;
  };
  border: {
    DEFAULT: string;
    light: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  playerUi: {
    trackBg: string;
    fan: string;
    ring: string;
  };
}

export interface AppThemeGradients {
  app: [string, string];
  search: [string, string, string];
  player: [string, string, string];
  orb: [string, string];
  playerOverlay: [string, string, string];
  panel: [string, string, string];
  lime: [string, string];
  bootSplash: [string, string, string];
  headerSheen: [string, string, string];
  cardHighlight: [string, string];
  cardSecondaryHighlight: [string, string];
}

export interface ThemePresetDefinition {
  id: ThemePresetId;
  name: string;
  tagline: string;
  icon: 'zap' | 'droplet' | 'sun' | 'cloud-snow' | 'thermometer' | 'moon';
  previewColors: [string, string, string];
  rgb: ThemeRgbTokens;
  colors: AppThemeColors;
  gradients: AppThemeGradients;
  cssVars: Record<string, string>;
}

function rgbToCss(rgb: string): string {
  const parts = rgb
    .trim()
    .split(/\s+/)
    .map((n) => Math.max(0, Math.min(255, Number(n) || 0)));
  if (parts.length !== 3) return '#C8F929';
  return `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function rgbToRgba(rgb: string, alpha: number): string {
  return `rgba(${rgb.replace(/\s+/g, ', ')}, ${alpha})`;
}

function createPreset(config: {
  id: ThemePresetId;
  name: string;
  tagline: string;
  icon: ThemePresetDefinition['icon'];
  previewColors: [string, string, string];
  rgb: ThemeRgbTokens;
  gradients: {
    app: [string, string];
    search: [string, string, string];
    player: [string, string, string];
    bootSplash: [string, string, string];
    lime: [string, string];
  };
}): ThemePresetDefinition {
  const { rgb, gradients } = config;
  const accentHex = rgbToCss(rgb.accent);
  const secondaryHex = rgbToCss(rgb.secondary);
  const bgDefault = rgbToCss(rgb.bg);
  const bgSurface = rgbToCss(rgb.bgSurface);
  const bgCard = rgbToCss(rgb.bgCard);
  const bgElevated = rgbToCss(rgb.bgElevated);
  const bgPlayer = rgbToCss(rgb.bgPlayer);

  const colors: AppThemeColors = {
    background: {
      DEFAULT: bgDefault,
      surface: bgSurface,
      card: bgCard,
      elevated: bgElevated,
      player: bgPlayer,
    },
    primary: {
      DEFAULT: rgbToCss(rgb.primary),
      dark: rgbToCss(rgb.primaryDark),
      light: rgbToCss(rgb.primaryLight),
      neon: rgbToCss(rgb.primaryNeon),
    },
    secondary: {
      DEFAULT: secondaryHex,
      dark: rgbToCss(rgb.secondaryDark),
      light: rgbToCss(rgb.secondaryLight),
    },
    accent: {
      DEFAULT: accentHex,
      lime: accentHex,
      pink: accentHex,
      cyan: rgbToCss(rgb.accentCyan),
      glow: accentHex,
    },
    text: {
      DEFAULT: '#F8FAFC',
      muted: 'rgba(255, 255, 255, 0.70)',
      subtle: 'rgba(255, 255, 255, 0.50)',
      disabled: 'rgba(255, 255, 255, 0.35)',
      dark: rgbToCss(rgb.textDark),
      lime: accentHex,
    },
    glass: {
      border: rgbToRgba(rgb.accent, 0.2),
      borderLight: 'rgba(255, 255, 255, 0.12)',
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      borderHeavy: rgbToRgba(rgb.accent, 0.55),
      tint: rgbToRgba(rgb.glassTint, 0.5),
      tintLight: rgbToRgba(rgb.glassTint, 0.25),
      tintActive: rgbToRgba(rgb.accent, 0.18),
      tintHeavy: rgbToRgba(rgb.accent, 0.28),
      pill: rgbToRgba(rgb.accent, 0.12),
      fallback: bgSurface,
      fallbackSearch: bgCard,
    },
    border: {
      DEFAULT: rgbToRgba(rgb.accent, 0.16),
      light: 'rgba(255, 255, 255, 0.12)',
    },
    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#38BDF8',
    },
    playerUi: {
      trackBg: rgbToRgba(rgb.bgPlayer, 0.85),
      fan: rgbToRgba(rgb.accent, 0.14),
      ring: rgbToRgba(rgb.accent, 0.3),
    },
  };

  const fullGradients: AppThemeGradients = {
    app: gradients.app,
    search: gradients.search,
    player: gradients.player,
    orb: [rgbToRgba(rgb.accent, 0.65), rgbToRgba(rgb.secondary, 0.5)],
    playerOverlay: [
      rgbToRgba(rgb.bgSurface, 0.6),
      rgbToRgba(rgb.bgPlayer, 0.85),
      rgbToRgba(rgb.bg, 0.95),
    ],
    panel: [
      rgbToRgba(rgb.bgCard, 0.94),
      rgbToRgba(rgb.bgSurface, 0.97),
      bgPlayer,
    ],
    lime: gradients.lime,
    bootSplash: gradients.bootSplash,
    headerSheen: [
      'rgba(255, 255, 255, 0.22)',
      rgbToRgba(rgb.accent, 0.08),
      rgbToRgba(rgb.bgSurface, 0.7),
    ],
    cardHighlight: [
      rgbToRgba(rgb.accent, 0.2),
      rgbToRgba(rgb.glassTint, 0.52),
    ],
    cardSecondaryHighlight: [
      rgbToRgba(rgb.accentCyan, 0.22),
      rgbToRgba(rgb.glassTint, 0.52),
    ],
  };

  const cssVars: Record<string, string> = {
    '--color-bg': rgb.bg,
    '--color-bg-surface': rgb.bgSurface,
    '--color-bg-card': rgb.bgCard,
    '--color-bg-elevated': rgb.bgElevated,
    '--color-bg-player': rgb.bgPlayer,
    '--color-primary': rgb.primary,
    '--color-primary-dark': rgb.primaryDark,
    '--color-primary-light': rgb.primaryLight,
    '--color-primary-neon': rgb.primaryNeon,
    '--color-secondary': rgb.secondary,
    '--color-secondary-dark': rgb.secondaryDark,
    '--color-secondary-light': rgb.secondaryLight,
    '--color-accent': rgb.accent,
    '--color-accent-cyan': rgb.accentCyan,
    '--color-text-dark': rgb.textDark,
    '--color-glass-tint': rgb.glassTint,
  };

  return {
    id: config.id,
    name: config.name,
    tagline: config.tagline,
    icon: config.icon,
    previewColors: config.previewColors,
    rgb,
    colors,
    gradients: fullGradients,
    cssVars,
  };
}

export const THEME_PRESETS: ThemePresetDefinition[] = [
  createPreset({
    id: 'pulse',
    name: 'Pulse Neon',
    tagline: 'Electric lime & forest',
    icon: 'zap',
    previewColors: ['#0E190C', '#152411', '#C8F929'],
    rgb: {
      bg: '11 19 9',
      bgSurface: '16 28 13',
      bgCard: '21 36 17',
      bgElevated: '28 48 23',
      bgPlayer: '10 18 8',
      primary: '200 249 41',
      primaryDark: '148 195 18',
      primaryLight: '214 255 80',
      primaryNeon: '206 251 2',
      secondary: '34 197 94',
      secondaryDark: '22 101 52',
      secondaryLight: '74 222 128',
      accent: '200 249 41',
      accentCyan: '52 211 153',
      textDark: '11 19 9',
      glassTint: '22 38 17',
    },
    gradients: {
      app: ['#0E190C', '#070E05'],
      search: ['#132210', '#0B1408', '#060B04'],
      player: ['#182A13', '#0E1A0C', '#070C05'],
      bootSplash: ['#0B1309', '#12220E', '#0B1309'],
      lime: ['#D4FF32', '#9CE618'],
    },
  }),
  createPreset({
    id: 'cool',
    name: 'Cool',
    tagline: 'Deep sapphire & cyan',
    icon: 'droplet',
    previewColors: ['#07111C', '#112538', '#38BDF8'],
    rgb: {
      bg: '7 17 28',
      bgSurface: '12 27 42',
      bgCard: '17 37 56',
      bgElevated: '23 49 74',
      bgPlayer: '6 14 23',
      primary: '56 189 248',
      primaryDark: '14 165 233',
      primaryLight: '125 211 252',
      primaryNeon: '34 211 238',
      secondary: '45 212 191',
      secondaryDark: '15 118 110',
      secondaryLight: '94 234 212',
      accent: '56 189 248',
      accentCyan: '45 212 191',
      textDark: '6 19 31',
      glassTint: '16 36 56',
    },
    gradients: {
      app: ['#0C1C2E', '#050B12'],
      search: ['#10253B', '#091522', '#050A10'],
      player: ['#122B45', '#0A1826', '#050B12'],
      bootSplash: ['#07111C', '#0F2438', '#07111C'],
      lime: ['#7DD3FC', '#0284C7'],
    },
  }),
  createPreset({
    id: 'warm',
    name: 'Warm',
    tagline: 'Golden amber & espresso',
    icon: 'sun',
    previewColors: ['#160F08', '#2C1E10', '#F59E0B'],
    rgb: {
      bg: '22 15 8',
      bgSurface: '33 22 11',
      bgCard: '44 30 16',
      bgElevated: '56 39 22',
      bgPlayer: '18 12 6',
      primary: '245 158 11',
      primaryDark: '217 119 6',
      primaryLight: '252 211 77',
      primaryNeon: '251 191 36',
      secondary: '251 146 60',
      secondaryDark: '194 65 12',
      secondaryLight: '253 186 116',
      accent: '245 158 11',
      accentCyan: '251 146 60',
      textDark: '26 16 4',
      glassTint: '42 28 14',
    },
    gradients: {
      app: ['#24180C', '#100A05'],
      search: ['#2B1C0E', '#181008', '#0D0804'],
      player: ['#332110', '#1C1208', '#0D0804'],
      bootSplash: ['#160F08', '#2A1C0E', '#160F08'],
      lime: ['#FCD34D', '#D97706'],
    },
  }),
  createPreset({
    id: 'winter',
    name: 'Winter',
    tagline: 'Glacier ice & frost',
    icon: 'cloud-snow',
    previewColors: ['#0B1520', '#172B40', '#A5F3FC'],
    rgb: {
      bg: '11 21 32',
      bgSurface: '17 32 48',
      bgCard: '23 43 64',
      bgElevated: '30 55 82',
      bgPlayer: '8 16 24',
      primary: '165 243 252',
      primaryDark: '103 232 249',
      primaryLight: '207 250 254',
      primaryNeon: '186 230 253',
      secondary: '147 197 253',
      secondaryDark: '59 130 246',
      secondaryLight: '191 219 254',
      accent: '165 243 252',
      accentCyan: '147 197 253',
      textDark: '8 24 32',
      glassTint: '22 40 60',
    },
    gradients: {
      app: ['#142638', '#09121C'],
      search: ['#193047', '#0E1B29', '#070D14'],
      player: ['#1C3650', '#0F1E2E', '#070D14'],
      bootSplash: ['#0B1520', '#16293D', '#0B1520'],
      lime: ['#CFFAFE', '#67E8F9'],
    },
  }),
  createPreset({
    id: 'hot',
    name: 'Hot',
    tagline: 'Crimson ember & coral',
    icon: 'thermometer',
    previewColors: ['#17090B', '#2F1217', '#FF4D5A'],
    rgb: {
      bg: '23 9 11',
      bgSurface: '35 13 17',
      bgCard: '47 18 23',
      bgElevated: '61 24 30',
      bgPlayer: '18 7 9',
      primary: '255 77 90',
      primaryDark: '225 29 72',
      primaryLight: '253 164 175',
      primaryNeon: '255 59 77',
      secondary: '251 113 133',
      secondaryDark: '190 18 60',
      secondaryLight: '254 205 211',
      accent: '255 77 90',
      accentCyan: '251 146 60',
      textDark: '255 255 255',
      glassTint: '44 16 21',
    },
    gradients: {
      app: ['#270E13', '#100608'],
      search: ['#2F1117', '#19090C', '#0C0406'],
      player: ['#38141B', '#1E0A0E', '#0C0406'],
      bootSplash: ['#17090B', '#2E1116', '#17090B'],
      lime: ['#FB7185', '#E11D48'],
    },
  }),
  createPreset({
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Electric violet & dusk',
    icon: 'moon',
    previewColors: ['#10091B', '#23143A', '#C084FC'],
    rgb: {
      bg: '16 9 27',
      bgSurface: '25 14 42',
      bgCard: '35 20 58',
      bgElevated: '46 27 75',
      bgPlayer: '12 7 20',
      primary: '192 132 252',
      primaryDark: '168 85 247',
      primaryLight: '216 180 254',
      primaryNeon: '217 70 239',
      secondary: '232 121 249',
      secondaryDark: '162 28 175',
      secondaryLight: '240 171 252',
      accent: '192 132 252',
      accentCyan: '232 121 249',
      textDark: '20 9 33',
      glassTint: '33 18 54',
    },
    gradients: {
      app: ['#1B102E', '#0B0614'],
      search: ['#221438', '#120A1F', '#090510'],
      player: ['#291844', '#160C25', '#090510'],
      bootSplash: ['#10091B', '#22133B', '#10091B'],
      lime: ['#D8B4FE', '#9333EA'],
    },
  }),
];

export const THEME_PRESET_MAP: Record<ThemePresetId, ThemePresetDefinition> = {
  pulse: THEME_PRESETS[0],
  cool: THEME_PRESETS[1],
  warm: THEME_PRESETS[2],
  winter: THEME_PRESETS[3],
  hot: THEME_PRESETS[4],
  aurora: THEME_PRESETS[5],
};

export function getThemePreset(themeId?: string | null): ThemePresetDefinition {
  if (themeId && themeId in THEME_PRESET_MAP) {
    return THEME_PRESET_MAP[themeId as ThemePresetId];
  }
  return THEME_PRESET_MAP.pulse;
}
