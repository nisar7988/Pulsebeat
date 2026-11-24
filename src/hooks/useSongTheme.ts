import { useEffect, useState } from 'react';
import { getColors } from 'react-native-image-colors';
import { theme } from '../theme';

export interface PlayerTheme {
  primary: string;
  secondary: string;
  accent: string;
  accentColor: string;
  background: string;
  backgroundOverlay: [string, string, string];
  panelGradient: [string, string, string];
  orbGradient: [string, string];
  progressColor: string;
  trackColor: string;
  dotColor: string;
  glowColor: string;
  fanColor: string;
  ringColor: string;
}

const DEFAULT_THEME: PlayerTheme = {
  primary: theme.colors.primary.dark,
  secondary: theme.colors.secondary.dark,
  accent: theme.colors.accent.DEFAULT,
  accentColor: theme.colors.accent.DEFAULT,
  background: theme.colors.background.player,
  backgroundOverlay: [...theme.gradients.playerOverlay],
  panelGradient: [...theme.gradients.panel],
  orbGradient: [...theme.gradients.orb],
  progressColor: theme.colors.text.DEFAULT,
  trackColor: theme.colors.playerUi.trackBg,
  dotColor: theme.colors.text.DEFAULT,
  glowColor: theme.colors.accent.glow,
  fanColor: theme.colors.playerUi.fan,
  ringColor: theme.colors.playerUi.ring,
};

/**
 * Converts a hex string (#RRGGBB or #RGB) to rgba() format with custom opacity.
 */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(40,20,80,${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Darkens or lightens a hex color by a factor (-1.0 to 1.0).
 */
function adjustColor(hex: string, percent: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(c => c + c)
      .join('');
  }
  let num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  let b = (num & 0x0000ff) + Math.round(255 * percent);

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function useSongTheme(imageUrl: string | undefined): PlayerTheme {
  const [themeState, setThemeState] = useState<PlayerTheme>(DEFAULT_THEME);

  useEffect(() => {
    if (!imageUrl) return;

    let isMounted = true;

    const extractColors = async () => {
      try {
        const result = await getColors(imageUrl, {
          fallback: theme.colors.background.player,
          cache: true,
          key: imageUrl,
        });

        if (!isMounted) return;

        let primaryHex: string = theme.colors.primary.dark;
        let secondaryHex: string = theme.colors.secondary.dark;
        let accentHex: string = theme.colors.accent.DEFAULT;

        if (result.platform === 'android') {
          primaryHex = result.dominant || result.vibrant || primaryHex;
          secondaryHex = result.darkVibrant || result.average || secondaryHex;
          accentHex = result.lightVibrant || result.vibrant || accentHex;
        } else if (result.platform === 'ios') {
          primaryHex = result.primary || primaryHex;
          secondaryHex = result.secondary || secondaryHex;
          accentHex = result.detail || accentHex;
        }

        const bgDark = adjustColor(primaryHex, -0.45);
        const bgMid = adjustColor(secondaryHex, -0.35);
        const bgDeep = adjustColor(primaryHex, -0.6);

        const panel1 = hexToRgba(primaryHex, 0.92);
        const panel2 = hexToRgba(secondaryHex, 0.96);
        const panel3 = adjustColor(secondaryHex, 0.2);

        const orb1 = hexToRgba(accentHex, 0.75);
        const orb2 = hexToRgba(secondaryHex, 0.75);

        const fan = hexToRgba(primaryHex, 0.28);
        const ring = hexToRgba(primaryHex, 0.45);

        setThemeState({
          primary: primaryHex,
          secondary: secondaryHex,
          accent: accentHex,
          accentColor: accentHex,
          background: bgDark,
          backgroundOverlay: [
            hexToRgba(bgMid, 0.55),
            hexToRgba(bgDark, 0.45),
            hexToRgba(bgDeep, 0.9),
          ],
          panelGradient: [panel1, panel2, panel3],
          orbGradient: [orb1, orb2],
          progressColor: '#ffffff',
          trackColor: hexToRgba(bgDeep, 0.75),
          dotColor: '#ffffff',
          glowColor: accentHex,
          fanColor: fan,
          ringColor: ring,
        });
      } catch (e) {
        console.log('Error extracting song colors:', e);
      }
    };

    extractColors();

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return themeState;
}
