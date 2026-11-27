import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import { useUserStore } from '../../store';
import MUSIC_API from '../../config/api';

const NTFY_SHOUTOUT_URL = MUSIC_API.shoutout;
const SHOUTOUT_STORAGE_KEY = 'pulsebeat-developer-shoutout-sent';
const GITHUB_REPO_API = MUSIC_API.githubRepo;

const DEVELOPER = {
  name: 'Nisar Ahmed',
  handle: '@nisar7988',
  role: 'Creator & Developer',
  tagline: 'Audio Xperiences.',
  githubUrl: 'https://github.com/nisar7988',
  repoUrl: 'https://github.com/nisar7988/Pulsebeat',
  appVersion: '0.0.1',
};

const HIGHLIGHTS = [
  {
    icon: 'headphones' as const,
    title: 'Pure Audio Engine',
    detail: 'Background playback, lock-screen controls & widget sync',
  },
  {
    icon: 'zap' as const,
    title: 'Fluid Motion',
    detail: 'Reanimated 4 transitions & adaptive song-tinted glass UI',
  },
  {
    icon: 'cpu' as const,
    title: 'Local-First Vault',
    detail: 'Zero clutter — playlists, stats & likes stay on your device',
  },
];


export default function DeveloperScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const profileName = useUserStore((state) => state.profileName);
  const profileHandle = useUserStore((state) => state.profileHandle);

  const [shoutoutSent, setShoutoutSent] = useState(false);
  const [sendingShoutout, setSendingShoutout] = useState(false);
  const [note, setNote] = useState('');
  const [starCount, setStarCount] = useState<number | null>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const kudosScale = useSharedValue(1);

  useEffect(() => {
    AsyncStorage.getItem(SHOUTOUT_STORAGE_KEY)
      .then((val) => {
        if (val === '1') setShoutoutSent(true);
      })
      .catch(() => {});

    if (GITHUB_REPO_API) {
      fetch(GITHUB_REPO_API)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (typeof data?.stargazers_count === 'number') {
            setStarCount(data.stargazers_count);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.16, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulseOpacity, pulseScale]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const kudosButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kudosScale.value }],
  }));

  const handleDropShoutout = useCallback(async () => {
    if (shoutoutSent || sendingShoutout) return;
    if (!NTFY_SHOUTOUT_URL) {
      Alert.alert(
        'Shoutout Unavailable',
        'Shoutout endpoint is not configured in environment settings.',
      );
      return;
    }
    setSendingShoutout(true);
    try {
      const sender = `${profileName || 'PulseBeat Listener'} (${profileHandle || '@pulsebeat'})`;
      const trimmedNote = note.trim();
      const body = trimmedNote
        ? `${sender}: "${trimmedNote}"`
        : `${sender} sent you a shoutout from PulseBeat!`;

      const res = await fetch(NTFY_SHOUTOUT_URL, {
        method: 'POST',
        headers: {
          Title: 'New PulseBeat Shoutout!',
          Tags: 'headphones,green_heart',
        },
        body,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      await AsyncStorage.setItem(SHOUTOUT_STORAGE_KEY, '1').catch(() => {});
      setShoutoutSent(true);
      setNote('');
      kudosScale.value = withSequence(
        withSpring(0.92, { damping: 12, stiffness: 300 }),
        withSpring(1.04, { damping: 10, stiffness: 260 }),
        withSpring(1, { damping: 14, stiffness: 240 }),
      );
    } catch {
      Alert.alert(
        'Shoutout Failed',
        'Could not deliver your shoutout right now. Check your internet connection and try again.',
      );
    } finally {
      setSendingShoutout(false);
    }
  }, [kudosScale, note, profileHandle, profileName, sendingShoutout, shoutoutSent]);

  const openExternalUrl = useCallback(async (url: string, label: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unable to Open', `Could not open ${label} on this device.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to Open', `Could not open ${label} right now.`);
    }
  }, []);

 

  const kudosFeedback = shoutoutSent
    ? 'Delivered directly to Nisar! Thanks for the support.'
    : 'Sends an instant notification to the developer';

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={theme.gradients.app}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
            className="h-10 w-10 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1 mx-3">
            <Text className="text-xl font-extrabold text-white">
              Developer Shoutout
            </Text>
            <Text className="text-xs text-text-muted">
              The creator behind PulseBeat
            </Text>
          </View>
          <View className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1">
            <Text className="text-[11px] font-bold text-accent">
              v{DEVELOPER.appVersion}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pt-2 pb-44"
        >
          {/* Developer Hero Card */}
          <View className="mx-5 mb-5 overflow-hidden rounded-3xl border border-glass-border p-5 bg-glass-tint relative">
            <LinearGradient
              colors={theme.gradients.cardHighlight}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View className="items-center">
              <View className="relative items-center justify-center mb-3.5">
                <Animated.View
                  style={pulseRingStyle}
                  className="absolute h-24 w-24 rounded-3xl border-2 border-accent"
                />
                <View className="h-24 w-24 rounded-3xl border-2 border-accent bg-background items-center justify-center">
                  <Feather
                    name="terminal"
                    size={36}
                    color={theme.colors.accent.DEFAULT}
                  />
                </View>
                <View className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-accent items-center justify-center border-2 border-background">
                  <Feather name="code" size={13} color={theme.colors.text.dark} />
                </View>
              </View>

              <View className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 mb-2 flex-row items-center gap-1.5">
                <Feather name="award" size={12} color={theme.colors.accent.DEFAULT} />
                <Text className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  {DEVELOPER.role}
                </Text>
              </View>

              <Text className="text-2xl font-extrabold text-white">
                {DEVELOPER.name}
              </Text>
              <Text className="text-xs font-semibold text-accent mt-0.5">
                {DEVELOPER.handle}
              </Text>
              <Text className="text-xs text-text-muted text-center mt-2.5 leading-5 px-2">
                {DEVELOPER.tagline}
              </Text>
            </View>

            {/* Interactive Shoutout / Kudos Button */}
            <View className="mt-5 pt-4 border-t border-glass-border items-center">
              {!shoutoutSent && (
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Optional quick note (e.g. Love the player!)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  maxLength={120}
                  className="w-full rounded-xl border border-glass-border bg-white/5 px-3.5 py-2.5 text-xs text-white mb-3"
                />
              )}
              <Animated.View style={kudosButtonStyle} className="w-full">
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={shoutoutSent || sendingShoutout}
                  onPress={handleDropShoutout}
                  className={`w-full py-3 px-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                    shoutoutSent
                      ? 'bg-accent/20 border border-accent/50'
                      : 'bg-accent'
                  }`}
                >
                  {sendingShoutout ? (
                    <ActivityIndicator size="small" color={theme.colors.text.dark} />
                  ) : (
                    <Feather
                      name={shoutoutSent ? 'check-circle' : 'heart'}
                      size={16}
                      color={shoutoutSent ? theme.colors.accent.DEFAULT : theme.colors.text.dark}
                    />
                  )}
                  <Text
                    className={`text-sm font-extrabold ${
                      shoutoutSent ? 'text-accent' : 'text-text-dark'
                    }`}
                  >
                    {sendingShoutout
                      ? 'Sending Shoutout...'
                      : shoutoutSent
                      ? 'Shoutout Received!'
                      : 'Send a Shoutout'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              <Text className="text-[11px] text-text-muted mt-2 text-center">
                {kudosFeedback}
              </Text>
            </View>
          </View>

          {/* Note from the Builder */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="h-8 w-8 rounded-xl bg-accent/15 border border-accent/30 items-center justify-center">
                <Feather name="music" size={15} color={theme.colors.accent.DEFAULT} />
              </View>
              <Text className="text-sm font-bold text-white">
                Why PulseBeat Exists
              </Text>
            </View>
            <Text className="text-xs text-text-muted leading-5">
              Built from scratch with late-night playlists and a love for clean
              UI. PulseBeat focuses on speed, tactile glass visuals, and pure
              uninterrupted listening — designed and engineered solo by{' '}
              <Text className="text-accent font-semibold">{DEVELOPER.name}</Text>.
            </Text>
          </View>

          {/* Engineering Highlights */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <Text className="text-sm font-bold text-white mb-3">
              Craft & Architecture
            </Text>

            <View className="gap-3 mb-4">
              {HIGHLIGHTS.map((item) => (
                <View key={item.title} className="flex-row items-start gap-3">
                  <View className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/35 items-center justify-center mt-0.5">
                    <Feather
                      name={item.icon}
                      size={16}
                      color={theme.colors.accent.DEFAULT}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-white">
                      {item.title}
                    </Text>
                    <Text className="text-[11px] text-text-muted mt-0.5 leading-4">
                      {item.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

          </View>

          {/* Connect & Support */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <Text className="text-sm font-bold text-white mb-3">
              Connect & Show Support
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openExternalUrl(DEVELOPER.githubUrl, 'GitHub')}
              className="flex-row items-center justify-between py-2.5"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 items-center justify-center">
                  <Feather name="github" size={17} color={theme.colors.accent.DEFAULT} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">GitHub</Text>
                  <Text className="text-xs text-text-muted" numberOfLines={1}>
                    github.com/nisar7988
                  </Text>
                </View>
              </View>
              <Feather name="external-link" size={16} color={theme.colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openExternalUrl(DEVELOPER.repoUrl, 'PulseBeat Repo')}
              className="flex-row items-center justify-between py-2.5 border-t border-glass-border"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 items-center justify-center">
                  <Feather name="star" size={17} color={theme.colors.accent.DEFAULT} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    Star PulseBeat on GitHub
                  </Text>
                  <Text className="text-xs text-text-muted" numberOfLines={1}>
                    nisar7988/Pulsebeat
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                {starCount !== null && (
                  <View className="flex-row items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5">
                    <Feather name="star" size={11} color={theme.colors.accent.DEFAULT} />
                    <Text className="text-xs font-bold text-accent">{starCount}</Text>
                  </View>
                )}
                <Feather name="external-link" size={16} color={theme.colors.text.muted} />
              </View>
            </TouchableOpacity>          
          </View>

          <Text className="text-center text-[11px] text-text-subtle px-6">
            Crafted with dedication by {DEVELOPER.name} • PulseBeat v{DEVELOPER.appVersion}
          </Text>
        </ScrollView>
      </SafeAreaView>

      <GlassMiniPlayer bottomOffsetClass="bottom-6" />
    </View>
  );
}
