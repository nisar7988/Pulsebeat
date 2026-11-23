import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutRectangle, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';

const ICONS: Record<string, string> = {
  Home: 'home',
  Profile: 'user',
  Search: 'search',
};

const ITEM_SIZE = 54;
const GAP = 10;
const PADDING = 8;

const GlassTabBar = ({ state, navigation }: BottomTabBarProps) => {
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
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.pill}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={25}
          overlayColor="transparent"
          reducedTransparencyFallbackColor="#6f5df0"
        />
        <View style={styles.tint} />

        {/* sliding indicator */}
        {activeLayout && (
          <Animated.View
            style={[
              styles.indicator,
              {
                top: activeLayout.y,
                width: activeLayout.width,
                height: activeLayout.height,
                borderRadius: activeLayout.height / 2,
                transform: [{ translateX }],
              },
            ]}
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
              style={styles.item}
              onLayout={(e) => {
                const { layout } = e.nativeEvent;
                setLayouts((prev) => ({ ...prev, [index]: layout }));
              }}
            >
              <Feather
                name={ICONS[route.name] ?? 'circle'}
                size={24}
                color={focused ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                style={styles.icon}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PADDING,
    gap: GAP,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default GlassTabBar;