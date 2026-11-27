import { useEffect, useMemo, useState } from 'react';
import { useAppTheme } from '../theme';
import {
  adjustColor,
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

export function useSongTheme(imageUrl: string | undefined): PlayerTheme {
  const { theme } = useAppTheme();
  const baseTheme = useMemo<PlayerTheme>(
    () => ({
      primary: theme.colors.primary.dark,
      secondary: theme.colors.secondary.dark,
      accent: theme.colors.accent.DEFAULT,
      accentColor: theme.colors.accent.DEFAULT,
      background: theme.colors.background.player,
      backgroundOverlay: [...theme.gradients.playerOverlay],
      panelGradient: [...theme.gradients.panel],
      orbGradient: [...theme.gradients.orb],
      progressColor: theme.colors.accent.DEFAULT,
      trackColor: theme.colors.playerUi.trackBg,
      dotColor: theme.colors.accent.DEFAULT,
      glowColor: theme.colors.accent.glow,
      fanColor: theme.colors.playerUi.fan,
      ringColor: theme.colors.playerUi.ring,
    }),
    [theme],
  );
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
  return baseTheme;
}
