import React, { useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import { vars } from 'nativewind';
import { useUserStore } from '../store/useUserStore';
import {
  getThemePreset,
  THEME_PRESETS,
  type ThemePresetDefinition,
  type ThemePresetId,
} from './presets';
import { spacing } from './spacing';
import { typography } from './typography';
import { borderRadius } from './borderRadius';

export function getActiveThemePreset(): ThemePresetDefinition {
  return getThemePreset(useUserStore.getState().themeId);
}

export function useAppTheme() {
  const themeId = useUserStore((state) => state.themeId);
  const setThemeId = useUserStore((state) => state.setThemeId);

  const preset = useMemo(() => getThemePreset(themeId), [themeId]);
  const themeVars = useMemo(() => vars(preset.cssVars), [preset]);
  const activeTheme = useMemo(
    () => ({
      colors: preset.colors,
      gradients: preset.gradients,
      spacing,
      typography,
      borderRadius,
    }),
    [preset],
  );

  return {
    theme: activeTheme,
    themeId: preset.id as ThemePresetId,
    preset,
    presets: THEME_PRESETS,
    setThemeId,
    themeVars,
  };
}

export const ThemedContainer: React.FC<ViewProps> = ({
  style,
  children,
  ...rest
}) => {
  const { themeVars } = useAppTheme();
  return (
    <View style={[themeVars, style]} {...rest}>
      {children}
    </View>
  );
};
