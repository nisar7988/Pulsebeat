import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import LinearGradient from 'react-native-linear-gradient';
import { theme, useAppTheme } from '../../theme';

type AnimatedBootSplashProps = {
  ready?: boolean;
  onAnimationEnd: () => void;
};

const EQUALIZER_BARS = [
  { minHeight: 10, maxHeight: 24, delay: 0 },
  { minHeight: 14, maxHeight: 34, delay: 120 },
  { minHeight: 18, maxHeight: 40, delay: 240 },
  { minHeight: 14, maxHeight: 32, delay: 160 },
  { minHeight: 10, maxHeight: 22, delay: 80 },
];

export default function AnimatedBootSplash({
  ready = true,
  onAnimationEnd,
}: AnimatedBootSplashProps) {
  const { theme: activeTheme, preset } = useAppTheme();
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const ring1Scale = useRef(new Animated.Value(0.85)).current;
  const ring1Opacity = useRef(new Animated.Value(0.45)).current;
  const ring2Scale = useRef(new Animated.Value(0.85)).current;
  const ring2Opacity = useRef(new Animated.Value(0.3)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(12)).current;
  const barScales = useRef(
    EQUALIZER_BARS.map(() => new Animated.Value(0.45)),
  ).current;

  useEffect(() => {
    const brandIn = Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(brandTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const pulseRing1 = Animated.loop(
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 1.65,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseRing2 = Animated.loop(
      Animated.sequence([
        Animated.delay(450),
        Animated.parallel([
          Animated.timing(ring2Scale, {
            toValue: 1.9,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const barAnimations = barScales.map((val, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(EQUALIZER_BARS[idx].delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 320,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.4,
            duration: 320,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    brandIn.start();
    pulseRing1.start();
    pulseRing2.start();
    barAnimations.forEach((anim) => anim.start());

    return () => {
      pulseRing1.stop();
      pulseRing2.stop();
      barAnimations.forEach((anim) => anim.stop());
    };
  }, [
    brandOpacity,
    brandTranslateY,
    barScales,
    ring1Opacity,
    ring1Scale,
    ring2Opacity,
    ring2Scale,
  ]);

  const { container, logo } = BootSplash.useHideAnimation({
    ready,
    manifest: require('../../../assets/bootsplash/manifest.json'),
    logo: require('../../../assets/bootsplash/logo.png'),
    statusBarTranslucent: true,
    navigationBarTranslucent: true,
    animate: () => {
      Animated.sequence([
        Animated.delay(650),
        Animated.spring(logoScale, {
          toValue: 1.08,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 380,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(containerScale, {
            toValue: 1.06,
            duration: 380,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onAnimationEnd();
      });
    },
  });

  return (
    <Animated.View
      {...container}
      style={[
        container.style,
        styles.container,
        {
          backgroundColor: activeTheme.colors.background.DEFAULT,
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={activeTheme.gradients.bootSplash}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow & pulsing beat rings centered behind the BootSplash logo */}
      <View pointerEvents="none" style={styles.ringsAnchor}>
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: `rgba(${preset.rgb.accent.replace(/\s+/g, ', ')}, 0.08)`,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: `rgba(${preset.rgb.accent.replace(/\s+/g, ', ')}, 0.55)`,
              opacity: ring1Opacity,
              transform: [{ scale: ring1Scale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRingOuter,
            {
              borderColor: `rgba(${preset.rgb.secondary.replace(/\s+/g, ', ')}, 0.45)`,
              opacity: ring2Opacity,
              transform: [{ scale: ring2Scale }],
            },
          ]}
        />
      </View>

      {/* Pixel-aligned BootSplash logo */}
      <Animated.Image
        {...logo}
        style={[
          logo.style,
          {
            transform: [{ scale: logoScale }],
          },
        ]}
      />

      {/* Wordmark & animated equalizer positioned below center */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.brandContainer,
          {
            opacity: brandOpacity,
            transform: [{ translateY: brandTranslateY }],
          },
        ]}
      >
        <View style={styles.equalizerRow}>
          {EQUALIZER_BARS.map((bar, index) => (
            <Animated.View
              key={index}
              style={[
                styles.equalizerBar,
                {
                  backgroundColor: activeTheme.colors.primary.DEFAULT,
                  height: bar.maxHeight,
                  transform: [{ scaleY: barScales[index] }],
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmarkWhite}>Pulse</Text>
          <Text style={[styles.wordmarkLime, { color: activeTheme.colors.primary.DEFAULT }]}>
            Beat
          </Text>
        </View>
        <Text style={styles.tagline}>FEEL THE RHYTHM</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.DEFAULT,
  },
  ringsAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(200, 249, 41, 0.08)',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(200, 249, 41, 0.55)',
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  brandContainer: {
    position: 'absolute',
    bottom: 92,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 6,
    marginBottom: 18,
  },
  equalizerBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkWhite: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: theme.colors.text.DEFAULT,
  },
  wordmarkLime: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: theme.colors.primary.DEFAULT,
  },
  tagline: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3.5,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
