jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        store.delete(k);
      }),
    },
  };
});

jest.mock('react-native-image-colors', () => ({
  getColors: jest.fn(),
}));

import { getColors } from 'react-native-image-colors';
import {
  getThemePreset,
  THEME_PRESETS,
  type ThemePresetId,
} from '../src/theme/presets';
import {
  DEFAULT_PLAYER_BG,
  DEFAULT_RAW_COLORS,
  ensureVividAccent,
  extractRawSongColors,
} from '../src/theme/songPalette';
import { useUserStore } from '../src/store/useUserStore';

describe('theme presets and user preference', () => {
  beforeEach(() => {
    useUserStore.getState().setThemeId('pulse');
  });

  test('includes pulse, cool, warm, winter, hot, and aurora presets with valid CSS vars', () => {
    const ids = THEME_PRESETS.map((p) => p.id);
    expect(ids).toEqual(['pulse', 'cool', 'warm', 'winter', 'hot', 'aurora']);

    for (const preset of THEME_PRESETS) {
      expect(preset.previewColors).toHaveLength(3);
      expect(preset.colors.background.player).toMatch(/^#[0-9A-F]{6}$/);
      expect(preset.colors.accent.DEFAULT).toMatch(/^#[0-9A-F]{6}$/);
      expect(preset.colors.text.dark).toMatch(/^#[0-9A-F]{6}$/);
      expect(preset.cssVars['--color-bg']).toMatch(/^\d+\s+\d+\s+\d+$/);
      expect(preset.cssVars['--color-accent']).toMatch(/^\d+\s+\d+\s+\d+$/);
      expect(preset.cssVars['--color-text-dark']).toMatch(/^\d+\s+\d+\s+\d+$/);
      expect(preset.gradients.app).toHaveLength(2);
      expect(preset.gradients.search).toHaveLength(3);
      expect(preset.gradients.player).toHaveLength(3);
    }
  });

  test('getThemePreset falls back to pulse for unknown ids', () => {
    expect(getThemePreset('unknown-theme').id).toBe('pulse');
    expect(getThemePreset(null).id).toBe('pulse');
    expect(getThemePreset('winter').id).toBe('winter');
  });

  test('useUserStore updates themeId across presets', () => {
    const targets: ThemePresetId[] = ['cool', 'warm', 'winter', 'hot', 'aurora', 'pulse'];
    for (const id of targets) {
      useUserStore.getState().setThemeId(id);
      expect(useUserStore.getState().themeId).toBe(id);
      expect(getThemePreset(useUserStore.getState().themeId).id).toBe(id);
    }
  });

  test('ensureVividAccent rejects black and fallback colors', () => {
    expect(ensureVividAccent('#000000', '#38BDF8')).toBe('#38BDF8');
    expect(ensureVividAccent(DEFAULT_PLAYER_BG, '#38BDF8')).toBe('#38BDF8');
    expect(ensureVividAccent('#080808')).toBe(DEFAULT_RAW_COLORS.accent);
    expect(ensureVividAccent('#C8F929')).toBe('#C8F929');
  });

  test('extractRawSongColors skips fallback/black accent swatches', async () => {
    (getColors as jest.Mock).mockResolvedValueOnce({
      platform: 'android',
      dominant: '#18241A',
      vibrant: DEFAULT_PLAYER_BG,
      darkVibrant: DEFAULT_PLAYER_BG,
      lightVibrant: DEFAULT_PLAYER_BG,
      lightMuted: DEFAULT_PLAYER_BG,
      muted: DEFAULT_PLAYER_BG,
      darkMuted: DEFAULT_PLAYER_BG,
      average: '#18241A',
    });

    const androidPalette = await extractRawSongColors('https://example.com/dark-art.jpg');
    expect(androidPalette.accent).toBe(DEFAULT_RAW_COLORS.accent);

    (getColors as jest.Mock).mockResolvedValueOnce({
      platform: 'ios',
      background: '#050505',
      primary: '#1E293B',
      secondary: '#38BDF8',
      detail: '#000000',
    });

    const iosPalette = await extractRawSongColors('https://example.com/ios-dark-detail.jpg');
    expect(iosPalette.accent).toBe('#38BDF8');
  });
});
