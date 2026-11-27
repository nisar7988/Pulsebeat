import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme';

export interface LiquidGlassBackdropProps {
  blurAmount?: number;
  sheenColors?: [string, string, string];
  sheenLocations?: [number, number, number];
}

const DEFAULT_SHEEN_COLORS: [string, string, string] = [
  'rgba(255, 255, 255, 0.20)',
  'rgba(255, 255, 255, 0.05)',
  'rgba(255, 255, 255, 0.01)',
];
const DEFAULT_SHEEN_LOCATIONS: [number, number, number] = [0, 0.45, 1];

export function rgbTokenToCommaList(rgbToken: string): string {
  return rgbToken.trim().replace(/\s+/g, ', ');
}

export const LiquidGlassBackdrop: React.FC<LiquidGlassBackdropProps> = React.memo(
  ({
    blurAmount = 25,
    sheenColors = DEFAULT_SHEEN_COLORS,
    sheenLocations = DEFAULT_SHEEN_LOCATIONS,
  }) => {
    const { theme, preset } = useAppTheme();
    const bgSurfaceRgb = rgbTokenToCommaList(preset.rgb.bgSurface);
    const glassTintRgb = rgbTokenToCommaList(preset.rgb.glassTint);

    return (
      <>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={blurAmount}
          overlayColor={
            Platform.OS === 'android'
              ? `rgba(${bgSurfaceRgb}, 0.62)`
              : 'transparent'
          }
          reducedTransparencyFallbackColor={theme.colors.glass.fallback}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: `rgba(${glassTintRgb}, ${
                Platform.OS === 'ios' ? 0.36 : 0.2
              })`,
            },
          ]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={sheenColors}
          locations={sheenLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </>
    );
  },
);

export default LiquidGlassBackdrop;
