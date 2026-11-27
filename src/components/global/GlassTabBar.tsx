import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutRectangle, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';

export const GLASS_TAB_BAR_HEIGHT = 72;

export const getSafeBottomOffset = (bottomInset: number) =>
  Math.max(bottomInset + 7, 20);

const ICONS: Record<string, string> = {
  Home: 'home',
  Search: 'search',
  Library: 'music',
  Profile: 'user',
};

const GlassTabBar = ({ state, navigation, insets }: BottomTabBarProps) => {
  const { theme, preset } = useAppTheme();
  const { bottom: safeBottomInset } = useSafeAreaInsets();
  const bottomOffset = getSafeBottomOffset(
    Math.max(insets?.bottom ?? 0, safeBottomInset),
  );
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

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: bottomOffset }}
      pointerEvents="box-none"
    >
      <View className="flex-row rounded-[36px] overflow-hidden border border-glass-border p-2 gap-2.5">
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={25}
            overlayColor="transparent"
            reducedTransparencyFallbackColor={theme.colors.glass.fallback}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: `rgba(${preset.rgb.bgSurface.replace(/\s+/g, ', ')}, 0.92)`,
              },
            ]}
          />
        )}
        <View className="absolute inset-0 bg-glass-tint" />

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
              className="w-[54px] h-[54px] items-center justify-center"
              onLayout={(e) => {
                const { layout } = e.nativeEvent;
                setLayouts((prev) => ({ ...prev, [index]: layout }));
              }}
            >
              <Feather
                name={ICONS[route.name] ?? 'circle'}
                size={24}
                color={focused ? theme.colors.accent.DEFAULT : theme.colors.text.muted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default GlassTabBar;
