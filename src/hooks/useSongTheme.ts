import { useEffect, useState } from 'react';
import {
  adjustColor,
  DEFAULT_PLAYER_BG,
  DEFAULT_RAW_COLORS,
  extractRawSongColors,
  hexToRgba,
} from '../theme/songPalette';

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
  primary: DEFAULT_RAW_COLORS.primary,
  secondary: DEFAULT_RAW_COLORS.secondary,
  accent: DEFAULT_RAW_COLORS.accent,
  accentColor: DEFAULT_RAW_COLORS.accent,
  background: DEFAULT_PLAYER_BG,
  backgroundOverlay: [
    'rgba(14, 26, 12, 0.60)',
    'rgba(10, 18, 8, 0.85)',
    'rgba(5, 10, 4, 0.95)',
  ],
  panelGradient: [
    'rgba(19, 34, 16, 0.94)',
    'rgba(12, 22, 10, 0.97)',
    'rgba(7, 13, 6, 1)',
  ],
  orbGradient: ['rgba(200, 249, 41, 0.65)', 'rgba(34, 197, 94, 0.50)'],
  progressColor: DEFAULT_RAW_COLORS.accent,
  trackColor: 'rgba(10, 18, 8, 0.85)',
  dotColor: DEFAULT_RAW_COLORS.accent,
  glowColor: DEFAULT_RAW_COLORS.accent,
  fanColor: 'rgba(200, 249, 41, 0.14)',
  ringColor: 'rgba(200, 249, 41, 0.30)',
};

export function useSongTheme(imageUrl: string | undefined): PlayerTheme {
  const [extractedTheme, setExtractedTheme] = useState<{
    imageUrl: string;
    theme: PlayerTheme;
  } | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    let isMounted = true;

    const timer = setTimeout(async () => {
      const { primary: primaryHex, secondary: secondaryHex, accent: accentHex } =
        await extractRawSongColors(imageUrl, 4000);

      if (!isMounted) return;

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

      setExtractedTheme({
        imageUrl,
        theme: {
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
          progressColor: accentHex,
          trackColor: hexToRgba(bgDeep, 0.75),
          dotColor: accentHex,
          glowColor: accentHex,
          fanColor: fan,
          ringColor: ring,
        },
      });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [imageUrl]);

  if (extractedTheme && extractedTheme.imageUrl === imageUrl) {
    return extractedTheme.theme;
  }
  return DEFAULT_THEME;
}
