import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { useUserStore } from '../../store';
import { RootStackParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    selectedLanguages,
    selectedGenres,
    selectedArtists,
    resetPreferences,
  } = useUserStore();

  const [highQualityAudio, setHighQualityAudio] = useState(true);
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [offlineSync, setOfflineSync] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleRestartOnboarding = () => {
    Alert.alert(
      'Reset Music Preferences',
      'Would you like to restart onboarding and re-tune your favorite languages, genres, and artists?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Re-tune',
          style: 'destructive',
          onPress: () => {
            resetPreferences();
            navigation.navigate('Onboarding');
          },
        },
      ],
    );
  };

  const handleClearCache = () => {
    setCacheCleared(true);
    Alert.alert('Cache Cleared', 'Freed 1.4 GB of temporary audio cache files.');
  };

  const stats = [
    { label: 'Hours Played', value: '148h', icon: 'clock' },
    { label: 'Saved Tracks', value: '382', icon: 'heart' },
    { label: 'Vibe Match', value: '98%', icon: 'activity' },
    { label: 'Followed', value: String(selectedArtists.length || 6), icon: 'users' },
  ];

  const equalizerBars = [
    { height: 36, active: true },
    { height: 58, active: true },
    { height: 42, active: true },
    { height: 68, active: true },
    { height: 84, active: true },
    { height: 62, active: true },
    { height: 48, active: true },
    { height: 74, active: true },
    { height: 38, active: true },
    { height: 52, active: true },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Background Gradient */}
      <LinearGradient
        colors={theme.gradients.app}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pt-3 pb-48"
        >
          {/* Top Bar */}
          <View className="px-5 mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-extrabold text-white">Your Profile</Text>
              <Text className="text-xs text-text-muted mt-0.5">Listener ID: #PB-9824</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRestartOnboarding}
              className="h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass-tint"
            >
              <Feather name="settings" size={18} color={theme.colors.accent.DEFAULT} />
            </TouchableOpacity>
          </View>

          {/* Hero Profile Banner */}
          <View className="mx-5 mb-5 overflow-hidden rounded-3xl border border-glass-border p-5 bg-glass-tint relative">
            <LinearGradient
              colors={['rgba(200, 249, 41, 0.18)', 'rgba(16, 28, 13, 0.75)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View className="flex-row items-center gap-4">
              {/* Avatar with Neon Ring & Online Equalizer Badge */}
              <View className="relative">
                <View className="h-20 w-20 rounded-2xl p-0.5 border-2 border-accent shadow-lg shadow-accent/60 overflow-hidden bg-background">
                  <Image
                    source={{
                      uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHmW_RbpBSeQbez1ubni6PzyPMMhrhPEsJO-pKxs_fTw&s=10',
                    }}
                    className="h-full w-full rounded-2xl"
                    resizeMode="cover"
                  />
                </View>
                <View className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent items-center justify-center border-2 border-background shadow-sm shadow-accent/50">
                  <Feather name="zap" size={12} color={theme.colors.text.dark} />
                </View>
              </View>

              {/* Name & Badge */}
              <View className="flex-1 justify-center">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold text-white">Alex Mercer</Text>
                  <View className="rounded-full bg-accent/25 border border-accent/60 px-2 py-0.5">
                    <Text className="text-[10px] font-extrabold text-accent">VIP PRO</Text>
                  </View>
                </View>
                <Text className="text-xs text-text-muted mt-0.5">@alex_mercer • Lossless Tier</Text>
                <View className="mt-2 flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <Text className="text-[11px] font-semibold text-accent">Dolby Atmos Active</Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View className="mt-5 pt-4 border-t border-glass-border flex-row items-center justify-between">
              {stats.map((s, idx) => (
                <View key={s.label} className="items-center flex-1">
                  <Text className="text-lg font-extrabold text-accent">{s.value}</Text>
                  <Text className="text-[10px] font-medium text-text-muted mt-0.5">{s.label}</Text>
                  {idx < stats.length - 1 && (
                    <View className="absolute right-0 top-1 h-6 w-[1px] bg-glass-border opacity-40" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Music Persona / Vibe DNA Card */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-5 bg-glass-tint relative overflow-hidden">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Feather name="activity" size={16} color={theme.colors.accent.DEFAULT} />
                <Text className="text-sm font-bold text-white uppercase tracking-wider">
                  Listening Vibe DNA
                </Text>
              </View>
              <View className="rounded-full bg-accent/20 border border-accent/50 px-2.5 py-0.5">
                <Text className="text-[11px] font-bold text-accent">Top 1% Listener</Text>
              </View>
            </View>

            <Text className="text-xs text-text-muted mb-4">
              Your acoustic profile is dominated by heavy basslines, late-night lo-fi grooves, and ambient synth textures.
            </Text>

            {/* Visual Equalizer Spectrum */}
            <View className="flex-row items-end justify-between h-20 px-2 py-2 rounded-2xl bg-black/40 border border-glass-border mb-4">
              {equalizerBars.map((bar, i) => (
                <View
                  key={i}
                  className="w-4 rounded-full bg-accent shadow-sm shadow-accent/50"
                  style={{ height: bar.height }}
                />
              ))}
            </View>

            {/* Top Genres Breakdown */}
            <View className="flex-row flex-wrap gap-2">
              {(selectedGenres.length > 0 ? selectedGenres : ['Lo-Fi', 'Pop', 'Electronic', 'Hip-Hop']).map(
                (genre, idx) => (
                  <View
                    key={genre}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-glass-border bg-glass-tint"
                  >
                    <View
                      className={`h-2 w-2 rounded-full ${
                        idx === 0 ? 'bg-accent' : 'bg-white/40'
                      }`}
                    />
                    <Text className="text-xs font-semibold text-white capitalize">{genre}</Text>
                    <Text className="text-[10px] text-text-muted">
                      {idx === 0 ? '45%' : idx === 1 ? '30%' : '15%'}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>

          {/* Followed Artists Showcase */}
          <View className="mb-5">
            <View className="px-5 mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">Your Star Lineup</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleRestartOnboarding}>
                <Text className="text-xs font-bold text-accent">Edit lineup</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5 gap-3"
            >
              {(selectedArtists.length > 0
                ? selectedArtists
                : ['Arijit Singh', 'The Weeknd', 'Taylor Swift', 'Diljit Dosanjh', 'Dua Lipa']
              ).map((artist, idx) => (
                <View
                  key={artist}
                  className="w-24 items-center p-3 rounded-2xl border border-glass-border bg-glass-tint"
                >
                  <View className="h-14 w-14 rounded-full p-0.5 border border-accent bg-accent/20 items-center justify-center mb-2 relative">
                    <Feather name="mic" size={20} color={theme.colors.accent.DEFAULT} />
                    <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-accent items-center justify-center">
                      <Feather name="check" size={9} color={theme.colors.text.dark} />
                    </View>
                  </View>
                  <Text className="text-xs font-bold text-white text-center" numberOfLines={1}>
                    {artist}
                  </Text>
                  <Text className="text-[10px] text-text-muted mt-0.5">#{idx + 1} Artist</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Audio Quality & Engine Settings */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <Text className="text-sm font-bold text-white mb-3">Audio & Playback Engine</Text>

            {/* Lossless 320kbps Stream */}
            <View className="flex-row items-center justify-between py-2 border-b border-glass-border">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 rounded-xl bg-accent items-center justify-center shadow-sm shadow-accent/40">
                  <Feather name="disc" size={18} color={theme.colors.text.dark} />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white">Hi-Res 320 kbps Streaming</Text>
                  <Text className="text-xs text-text-muted">Master quality audio bitrates</Text>
                </View>
              </View>
              <Switch
                value={highQualityAudio}
                onValueChange={setHighQualityAudio}
                trackColor={{ false: '#334155', true: theme.colors.accent.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Spatial Audio */}
            <View className="flex-row items-center justify-between py-2.5 border-b border-glass-border">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 items-center justify-center">
                  <Feather name="radio" size={18} color={theme.colors.accent.DEFAULT} />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white">3D Spatial Simulation</Text>
                  <Text className="text-xs text-text-muted">Surround sound enhancement</Text>
                </View>
              </View>
              <Switch
                value={spatialAudio}
                onValueChange={setSpatialAudio}
                trackColor={{ false: '#334155', true: theme.colors.accent.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Smart Offline Sync */}
            <View className="flex-row items-center justify-between py-2.5">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 items-center justify-center">
                  <Feather name="download-cloud" size={18} color={theme.colors.accent.DEFAULT} />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white">Smart Auto-Cache</Text>
                  <Text className="text-xs text-text-muted">Pre-load favorite tracks offline</Text>
                </View>
              </View>
              <Switch
                value={offlineSync}
                onValueChange={setOfflineSync}
                trackColor={{ false: '#334155', true: theme.colors.accent.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Storage & Maintenance */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-white">Storage & Cache</Text>
              <Text className="text-xs font-semibold text-accent">
                {cacheCleared ? '0.0 MB Used' : '1.4 GB / 64 GB'}
              </Text>
            </View>

            <View className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-3">
              <View
                className="h-full bg-accent rounded-full"
                style={{ width: cacheCleared ? '2%' : '24%' }}
              />
            </View>

            <View className="flex-row items-center justify-between gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClearCache}
                className="flex-1 py-2.5 rounded-xl border border-glass-border bg-white/10 items-center justify-center"
              >
                <Text className="text-xs font-semibold text-white">Clear Cache</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRestartOnboarding}
                className="flex-1 py-2.5 rounded-xl border border-accent/50 bg-accent/15 items-center justify-center"
              >
                <Text className="text-xs font-bold text-accent">Re-tune Vibes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Languages Chips */}
          <View className="mx-5 mb-6">
            <Text className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Active Regional Languages
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(selectedLanguages.length > 0 ? selectedLanguages : ['English', 'Hindi', 'Punjabi']).map(
                (lang) => (
                  <View
                    key={lang}
                    className="px-3.5 py-1 rounded-full border border-accent bg-accent/20"
                  >
                    <Text className="text-xs font-bold text-accent capitalize">{lang}</Text>
                  </View>
                ),
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating Glass Mini Player */}
      <GlassMiniPlayer />
    </View>
  );
}
