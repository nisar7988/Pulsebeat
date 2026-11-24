import React, { type PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';

export default function GradientBackground({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        pointerEvents="none"
        colors={theme.gradients.app}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
