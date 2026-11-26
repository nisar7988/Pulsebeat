import { getColors } from 'react-native-image-colors';
import { theme } from './index';

export interface RawSongColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface WidgetThemeColors {
  glassTop: string;
  glassMid: string;
  glassBottom: string;
  glowPrimary: string;
  glowSecondary: string;
  rimStart: string;
  rimEnd: string;
  accent: string;
  accentLight: string;
  onAccent: string;
  labelAccent: string;
  artBorder: string;
}

export const DEFAULT_RAW_COLORS: RawSongColors = {
  primary: theme.colors.primary.dark,
  secondary: theme.colors.secondary.dark,
  accent: theme.colors.accent.DEFAULT,
};

export const DEFAULT_WIDGET_THEME: WidgetThemeColors = {
  glassTop: '#2D4A1F',
  glassMid: '#192A12',
  glassBottom: '#0D1709',
  glowPrimary: '#A3E635',
  glowSecondary: '#84CC16',
  rimStart: '#E5FF75',
  rimEnd: '#D9FF54',
  accent: '#B8F726',
  accentLight: '#E2FF70',
  onAccent: '#0B1309',
  labelAccent: '#A3E635',
  artBorder: '#BEF264',
};

const paletteCache = new Map<string, RawSongColors>();

function normalizeHex(hex: string): string | null {
  if (!hex || !hex.startsWith('#')) return null;
  let clean = hex.slice(1).trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) return null;
  return `#${clean}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return `rgba(40,20,80,${alpha})`;
  const cleanHex = normalized.slice(1);
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function adjustColor(hex: string, percent: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;
  const num = parseInt(normalized.slice(1), 16);
  if (Number.isNaN(num)) return hex;

  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  let b = (num & 0x0000ff) + Math.round(255 * percent);

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getRelativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex);
  if (!normalized) return 0.5;
  const clean = normalized.slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const c = parseInt(clean.substring(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ensureVividAccent(hex: string): string {
  const normalized = normalizeHex(hex) ?? DEFAULT_RAW_COLORS.accent;
  const lum = getRelativeLuminance(normalized);
  if (lum < 0.16) return adjustColor(normalized, 0.32);
  if (lum < 0.28) return adjustColor(normalized, 0.16);
  return normalized;
}

export async function extractRawSongColors(
  imageUrl?: string,
  timeoutMs = 1500,
): Promise<RawSongColors> {
  if (!imageUrl) return DEFAULT_RAW_COLORS;
  const cached = paletteCache.get(imageUrl);
  if (cached) return cached;

  try {
    const result = await Promise.race([
      getColors(imageUrl, {
        fallback: theme.colors.background.player,
        cache: true,
        key: imageUrl,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);

    if (!result) return DEFAULT_RAW_COLORS;

    let primary: string = DEFAULT_RAW_COLORS.primary;
    let secondary: string = DEFAULT_RAW_COLORS.secondary;
    let accent: string = DEFAULT_RAW_COLORS.accent;

    if (result.platform === 'android') {
      primary = result.dominant || result.vibrant || primary;
      secondary = result.darkVibrant || result.average || secondary;
      accent = result.lightVibrant || result.vibrant || accent;
    } else if (result.platform === 'ios') {
      primary = result.primary || primary;
      secondary = result.secondary || secondary;
      accent = result.detail || accent;
    }

    const palette = { primary, secondary, accent };
    paletteCache.set(imageUrl, palette);
    return palette;
  } catch (e) {
    console.log('Error extracting song colors:', e);
    return DEFAULT_RAW_COLORS;
  }
}

export function buildWidgetTheme(raw: RawSongColors): WidgetThemeColors {
  const accent = ensureVividAccent(raw.accent);
  const accentLight = adjustColor(accent, 0.22);
  const labelAccent = adjustColor(accent, 0.12);
  const onAccent = getRelativeLuminance(accent) > 0.42 ? '#0B1309' : '#FFFFFF';

  return {
    glassTop: adjustColor(raw.primary, -0.22),
    glassMid: adjustColor(raw.secondary, -0.38),
    glassBottom: adjustColor(raw.primary, -0.58),
    glowPrimary: accent,
    glowSecondary: ensureVividAccent(raw.secondary),
    rimStart: accentLight,
    rimEnd: accent,
    accent,
    accentLight,
    onAccent,
    labelAccent,
    artBorder: adjustColor(accent, 0.14),
  };
}

export async function getWidgetThemeForArtwork(
  imageUrl?: string,
): Promise<WidgetThemeColors> {
  if (!imageUrl) return DEFAULT_WIDGET_THEME;
  const raw = await extractRawSongColors(imageUrl);
  return buildWidgetTheme(raw);
}
