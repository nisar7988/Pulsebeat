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

import {
  getThemePreset,
  THEME_PRESETS,
  type ThemePresetId,
} from '../src/theme/presets';
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
});
