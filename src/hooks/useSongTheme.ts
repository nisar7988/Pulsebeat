import { useEffect, useState } from 'react';
import { getColors } from 'react-native-image-colors';

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
  primary: '#3723c8',
  secondary: '#6928be',
  accent: '#ff6aa9',
  accentColor: '#ff6aa9',
  background: '#1c1160',
  backgroundOverlay: ['rgba(25,35,140,0.55)', 'rgba(60,30,170,0.45)', 'rgba(70,25,150,0.9)'],
  panelGradient: ['rgba(55,35,200,0.92)', 'rgba(105,40,190,0.96)', 'rgba(165,60,190,1)'],
  orbGradient: ['rgba(255,80,220,0.75)', 'rgba(110,60,255,0.75)'],
  progressColor: '#ffffff',
  trackColor: 'rgba(15, 8, 50, 0.75)',
  dotColor: '#ffffff',
  glowColor: '#ff66ff',
  fanColor: 'rgba(20,10,90,0.28)',
  ringColor: 'rgba(25,10,80,0.45)',
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
  const [theme, setTheme] = useState<PlayerTheme>(DEFAULT_THEME);

  useEffect(() => {
    if (!imageUrl) return;

    let isMounted = true;

    const extractColors = async () => {
      try {
        const result = await getColors(imageUrl, {
          fallback: '#1c1160',
          cache: true,
          key: imageUrl,
        });

        if (!isMounted) return;

        let primaryHex = '#3723c8';
        let secondaryHex = '#6928be';
        let accentHex = '#ff6aa9';
        let backgroundHex = '#1c1160';

        if (result.platform === 'android') {
          primaryHex = result.vibrant || result.dominant || '#3723c8';
          secondaryHex = result.darkVibrant || result.muted || '#6928be';
          accentHex = result.lightVibrant || result.vibrant || '#ff6aa9';
          backgroundHex = result.darkMuted || result.average || '#1c1160';
        } else if (result.platform === 'ios') {
          primaryHex = result.primary || '#3723c8';
          secondaryHex = result.secondary || '#6928be';
          accentHex = result.detail || '#ff6aa9';
          backgroundHex = result.background || '#1c1160';
        } else {
          // Web fallback
          const webRes = result as any;
          primaryHex = webRes.vibrant || webRes.dominant || '#3723c8';
          secondaryHex = webRes.darkVibrant || webRes.muted || '#6928be';
          accentHex = webRes.lightVibrant || '#ff6aa9';
          backgroundHex = webRes.darkMuted || '#1c1160';
        }

        // Build rich harmonious gradients based on extracted tones
        const darkBase = adjustColor(backgroundHex, -0.3);
        const midTone = adjustColor(primaryHex, -0.15);
        const vibrantTone = primaryHex;
        const brightTone = accentHex;

        const newTheme: PlayerTheme = {
          primary: primaryHex,
          secondary: secondaryHex,
          accent: accentHex,
          accentColor: accentHex,
          background: darkBase,
          backgroundOverlay: [
            hexToRgba(primaryHex, 0.55),
            hexToRgba(secondaryHex, 0.5),
            hexToRgba(darkBase, 0.92),
          ],
          panelGradient: [
            hexToRgba(midTone, 0.94),
            hexToRgba(secondaryHex, 0.96),
            hexToRgba(vibrantTone, 1),
          ],
          orbGradient: [
            hexToRgba(brightTone, 0.8),
            hexToRgba(secondaryHex, 0.8),
          ],
          progressColor: '#ffffff',
          trackColor: hexToRgba(darkBase, 0.75),
          dotColor: brightTone,
          glowColor: brightTone,
          fanColor: hexToRgba(darkBase, 0.35),
          ringColor: hexToRgba(darkBase, 0.5),
        };

        setTheme(newTheme);
      } catch (err) {
        console.log('Error extracting image colors:', err);
      }
    };

    extractColors();

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return theme;
}
