import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutRectangle, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { LiquidGlassBackdrop, rgbTokenToCommaList } from './LiquidGlassBackdrop';

export const GLASS_TAB_BAR_HEIGHT = 62;

export const getSafeBottomOffset = (bottomInset: number) =>
  Math.max(bottomInset, 16);

const ICONS: Record<string, string> = {
  Home: 'home',
  Search: 'search',
  Library: 'music',
  Profile: 'user',
};

const GlassTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { theme, preset } = useAppTheme();
  const { bottom: safeBottomInset } = useSafeAreaInsets();
  const bottomOffset = getSafeBottomOffset(safeBottomInset);
  const [layouts, setLayouts] = useState<Record<number, LayoutRectangle>>({});
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const activeLayout = layouts[state.index];
    if (!activeLayout) return;

    Animated.spring(translateX, {
      toValue: activeLayout.x,
      useNativeDriver: true,
      damping: 16,
      stiffness: 160,
      mass: 0.8,
    }).start();
  }, [state.index, layouts, translateX]);

  const activeLayout = layouts[state.index];
  const bgRgb = rgbTokenToCommaList(preset.rgb.bg);
  const scrimHeight = bottomOffset + GLASS_TAB_BAR_HEIGHT + 12;

  return (
    <View
      className="absolute left-0 right-0 bottom-0 items-center"
      style={{ paddingBottom: bottomOffset }}
      pointerEvents="box-none"
    >
      {/* Smooth ambient bottom scrim so scrolling cards beside the pill fade cleanly */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          `rgba(${bgRgb}, 0)`,
          `rgba(${bgRgb}, 0.42)`,
          `rgba(${bgRgb}, 0.82)`,
          `rgba(${bgRgb}, 0.94)`,
          `rgba(${bgRgb}, 0.98)`,
        ]}
        locations={[0, 0.18, 0.42, 0.68, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.bottomScrim, { height: scrimHeight }]}
      />

      <View
        className="flex-row overflow-hidden border border-glass-border"
        style={styles.pill}
      >
        <LiquidGlassBackdrop />

        {/* sliding indicator */}
        {activeLayout && (
          <Animated.View
            className="absolute bg-accent/20 border border-accent/40"
            style={{
              top: activeLayout.y,
              width: activeLayout.width,
              height: activeLayout.height,
              borderRadius: activeLayout.height / 2,
              transform: [{ translateX }],
            }}
          />
        )}

        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabButton}
              className="items-center justify-center"
              onLayout={(e) => {
                const { layout } = e.nativeEvent;
                setLayouts((prev) => ({ ...prev, [index]: layout }));
              }}
            >
              <Feather
                name={ICONS[route.name] ?? 'circle'}
                size={22}
                color={focused ? theme.colors.accent.DEFAULT : theme.colors.text.muted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  pill: {
    padding: 6,
    gap: 8,
    borderRadius: 31,
  },
  tabButton: {
    width: 48,
    height: 48,
  },
});

export default GlassTabBar;
