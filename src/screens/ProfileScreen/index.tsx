import React, { useMemo, useState } from 'react';
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
import TrackPlayer, { RepeatMode } from 'react-native-track-player';

import { theme } from '../../theme';
import {
  useUserStore,
  useListeningStore,
  AudioQuality,
} from '../../store';
import { RootStackParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import {
  getSongArtistName,
  getSongArtwork,
  getSongTitle,
  navigateAndPlaySong,
} from '../../service/player';
import EditProfileModal, { AVATAR_PRESETS } from './components/EditProfileModal';

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Punjabi',
  'Tamil',
  'Telugu',
  'Spanish',
  'Korean',
  'Japanese',
  'French',
  'German',
  'Arabic',
  'Bengali',
];

const AVAILABLE_GENRES = [
  'Pop',
  'Lo-Fi',
  'Electronic',
  'Hip-Hop',
  'Bollywood',
  'R&B',
  'Indie',
  'Rock',
  'Chill',
  'Acoustic',
  'Workout',
  'Jazz',
];

const QUALITY_OPTIONS: Array<{
  key: AudioQuality;
  label: string;
  bitrate: string;
}> = [
  { key: 'high', label: 'High', bitrate: '320 kbps' },
  { key: 'medium', label: 'Balanced', bitrate: '160 kbps' },
  { key: 'low', label: 'Saver', bitrate: '96 kbps' },
];

function formatListeningDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${Math.max(1, totalMinutes)}m`;
  const hours = totalMinutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    selectedLanguages,
    selectedGenres,
    selectedArtists,
    artistNames,
    profileName,
    profileHandle,
    avatarId,
    joinedAt,
    audioQuality,
    autoPlay,
    repeatByDefault,
    toggleLanguage,
    toggleGenre,
    updateProfile,
    setAudioQuality,
    setAutoPlay,
    setRepeatByDefault,
    resetPreferences,
  } = useUserStore();

  const {
    likedSongs,
    recentPlays,
    playCounts,
    artistPlayCounts,
    totalListeningSeconds,
    clearHistory,
  } = useListeningStore();

  const [editModalVisible, setEditModalVisible] = useState(false);

  const avatarPreset = useMemo(
    () => AVATAR_PRESETS.find((p) => p.id === avatarId) ?? AVATAR_PRESETS[0],
    [avatarId],
  );

  const totalPlays = useMemo(
    () => Object.values(playCounts).reduce((sum, entry) => sum + entry.count, 0),
    [playCounts],
  );

  const topPlayedTracks = useMemo(() => {
    return Object.values(playCounts)
      .sort((a, b) => b.count - a.count || b.lastPlayedAt - a.lastPlayedAt)
      .slice(0, 10);
  }, [playCounts]);

  const topArtists = useMemo(() => {
    const entries = Object.entries(artistPlayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, badge: `${count} plays` }));

    if (entries.length > 0) return entries;
    return selectedArtists.map((id, idx) => ({
      name: artistNames[id] || id,
      badge: `#${idx + 1} Pick`,
    }));
  }, [artistPlayCounts, artistNames, selectedArtists]);

  const memberSince = useMemo(() => {
    const date = new Date(joinedAt || Date.now());
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [joinedAt]);

  const handleToggleRepeatDefault = async (value: boolean) => {
    setRepeatByDefault(value);
    try {
      await TrackPlayer.setRepeatMode(value ? RepeatMode.Track : RepeatMode.Off);
    } catch {
      // Ignore if player isn't initialized yet; initializePlayer applies it on startup
    }
  };

  const handleRestartOnboarding = () => {
    Alert.alert(
      'Reset Music Preferences',
      'Restart onboarding to re-tune your favorite languages, genres, and artists? Your liked songs and play history will stay.',
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

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Listening History',
      'This will reset your play counts, recent tracks, and listening time. Liked songs and preferences will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ],
    );
  };

  const stats = [
    { label: 'Listening', value: formatListeningDuration(totalListeningSeconds) },
    { label: 'Plays', value: String(totalPlays) },
    { label: 'Liked', value: String(likedSongs.length) },
    { label: 'Artists', value: String(selectedArtists.length) },
  ];

  return (
    <View className="flex-1 bg-background">
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
              <Text className="text-xs text-text-muted mt-0.5">
                Local Vault • Member since {memberSince}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setEditModalVisible(true)}
              className="h-10 px-3.5 flex-row items-center gap-1.5 rounded-full border border-glass-border bg-glass-tint"
            >
              <Feather name="edit-2" size={14} color={theme.colors.accent.DEFAULT} />
              <Text className="text-xs font-bold text-accent">Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Profile Banner */}
          <View className="mx-5 mb-5 overflow-hidden rounded-3xl border border-glass-border p-5 bg-glass-tint relative">
            <LinearGradient
              colors={['rgba(200, 249, 41, 0.16)', 'rgba(16, 28, 13, 0.78)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setEditModalVisible(true)}
                className="relative"
              >
                <View className="h-20 w-20 rounded-2xl border-2 border-accent bg-background items-center justify-center">
                  <Feather
                    name={avatarPreset.icon}
                    size={34}
                    color={theme.colors.accent.DEFAULT}
                  />
                </View>
                <View className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent items-center justify-center border-2 border-background">
                  <Feather name="edit-3" size={11} color={theme.colors.text.dark} />
                </View>
              </TouchableOpacity>

              <View className="flex-1 justify-center">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold text-white" numberOfLines={1}>
                    {profileName}
                  </Text>
                </View>
                <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                  {profileHandle} • Offline-First
                </Text>
                <View className="mt-2 flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-accent" />
                  <Text className="text-[11px] font-semibold text-accent">
                    {QUALITY_OPTIONS.find((q) => q.key === audioQuality)?.bitrate} Stream Active
                  </Text>
                </View>
              </View>
            </View>

            {/* Real Stats Grid */}
            <View className="mt-5 pt-4 border-t border-glass-border flex-row items-center justify-between">
              {stats.map((s, idx) => (
                <View key={s.label} className="items-center flex-1">
                  <Text className="text-lg font-extrabold text-accent">{s.value}</Text>
                  <Text className="text-[10px] font-medium text-text-muted mt-0.5">
                    {s.label}
                  </Text>
                  {idx < stats.length - 1 && (
                    <View className="absolute right-0 top-1 h-6 w-[1px] bg-glass-border opacity-40" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Most Played / Recent Tracks */}
          <View className="mb-5">
            <View className="px-5 mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">
                {topPlayedTracks.length > 0 ? 'Most Played' : 'Recently Played'}
              </Text>
              <Text className="text-xs text-text-muted">
                {recentPlays.length} in history
              </Text>
            </View>

            {topPlayedTracks.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-5 gap-3"
              >
                {topPlayedTracks.map(({ song, count }) => (
                  <TouchableOpacity
                    key={song.id}
                    activeOpacity={0.85}
                    onPress={() => navigateAndPlaySong(navigation, song)}
                    className="w-32"
                  >
                    <View className="w-32 h-32 rounded-2xl overflow-hidden border border-glass-border bg-glass-tint relative">
                      <Image
                        source={{ uri: getSongArtwork(song) }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 border border-accent/40">
                        <Text className="text-[10px] font-bold text-accent">
                          {count}×
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-xs font-bold text-white mt-1.5"
                      numberOfLines={1}
                    >
                      {getSongTitle(song)}
                    </Text>
                    <Text className="text-[11px] text-text-muted" numberOfLines={1}>
                      {getSongArtistName(song)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="mx-5 p-4 rounded-2xl border border-glass-border bg-glass-tint flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-xl bg-accent/15 items-center justify-center">
                  <Feather name="headphones" size={18} color={theme.colors.accent.DEFAULT} />
                </View>
                <Text className="text-xs text-text-muted flex-1">
                  Play tracks from Home or Search to build your real local listening stats here.
                </Text>
              </View>
            )}
          </View>

          {/* Liked Songs */}
          {likedSongs.length > 0 && (
            <View className="mb-5">
              <View className="px-5 mb-3 flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">Liked Songs</Text>
                <Text className="text-xs font-bold text-accent">
                  {likedSongs.length} saved
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-5 gap-3"
              >
                {likedSongs.slice(0, 12).map((song) => (
                  <TouchableOpacity
                    key={song.id}
                    activeOpacity={0.85}
                    onPress={() => navigateAndPlaySong(navigation, song)}
                    className="w-28"
                  >
                    <View className="w-28 h-28 rounded-2xl overflow-hidden border border-glass-border bg-glass-tint relative">
                      <Image
                        source={{ uri: getSongArtwork(song) }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute bottom-1.5 right-1.5 h-6 w-6 rounded-full bg-accent items-center justify-center">
                        <Feather name="heart" size={12} color={theme.colors.text.dark} />
                      </View>
                    </View>
                    <Text
                      className="text-xs font-bold text-white mt-1.5"
                      numberOfLines={1}
                    >
                      {getSongTitle(song)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Top / Followed Artists */}
          {topArtists.length > 0 && (
            <View className="mb-5">
              <View className="px-5 mb-3 flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">
                  {Object.keys(artistPlayCounts).length > 0
                    ? 'Your Top Artists'
                    : 'Followed Artists'}
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={handleRestartOnboarding}>
                  <Text className="text-xs font-bold text-accent">Re-tune</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-5 gap-3"
              >
                {topArtists.map((artist) => (
                  <View
                    key={artist.name}
                    className="w-24 items-center p-3 rounded-2xl border border-glass-border bg-glass-tint"
                  >
                    <View className="h-12 w-12 rounded-full border border-accent bg-accent/15 items-center justify-center mb-2">
                      <Feather name="mic" size={18} color={theme.colors.accent.DEFAULT} />
                    </View>
                    <Text
                      className="text-xs font-bold text-white text-center"
                      numberOfLines={1}
                    >
                      {artist.name}
                    </Text>
                    <Text className="text-[10px] text-accent mt-0.5">{artist.badge}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Audio & Playback Engine (Persisted & Wired) */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <Text className="text-sm font-bold text-white mb-3">
              Audio & Playback Engine
            </Text>

            <Text className="text-xs text-text-muted mb-2">Streaming Bitrate</Text>
            <View className="flex-row gap-2 mb-4">
              {QUALITY_OPTIONS.map((opt) => {
                const active = audioQuality === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.8}
                    onPress={() => setAudioQuality(opt.key)}
                    className={`flex-1 py-2.5 px-2 rounded-xl border items-center ${
                      active
                        ? 'border-accent bg-accent/20'
                        : 'border-glass-border bg-white/5'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        active ? 'text-accent' : 'text-white'
                      }`}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-[10px] text-text-muted mt-0.5">
                      {opt.bitrate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row items-center justify-between py-2.5 border-t border-glass-border">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 items-center justify-center">
                  <Feather name="repeat" size={17} color={theme.colors.accent.DEFAULT} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    Repeat Track by Default
                  </Text>
                  <Text className="text-xs text-text-muted">
                    Loop current song automatically
                  </Text>
                </View>
              </View>
              <Switch
                value={repeatByDefault}
                onValueChange={handleToggleRepeatDefault}
                trackColor={{ false: '#334155', true: theme.colors.accent.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center justify-between py-2.5 border-t border-glass-border">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 items-center justify-center">
                  <Feather name="play-circle" size={17} color={theme.colors.accent.DEFAULT} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    Auto-Play Queue
                  </Text>
                  <Text className="text-xs text-text-muted">
                    Continue playback seamlessly
                  </Text>
                </View>
              </View>
              <Switch
                value={autoPlay}
                onValueChange={setAutoPlay}
                trackColor={{ false: '#334155', true: theme.colors.accent.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Interactive Languages & Genres */}
          <View className="mx-5 mb-5 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <Text className="text-sm font-bold text-white mb-1">
              Languages & Genres
            </Text>
            <Text className="text-xs text-text-muted mb-3">
              Tap to customize your Home & Search feed
            </Text>

            <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Languages
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const active = selectedLanguages.some(
                  (l) => l.toLowerCase() === lang.toLowerCase(),
                );
                return (
                  <TouchableOpacity
                    key={lang}
                    activeOpacity={0.8}
                    onPress={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full border ${
                      active
                        ? 'border-accent bg-accent/20'
                        : 'border-glass-border bg-white/5'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-accent' : 'text-text-muted'
                      }`}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Genres
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {AVAILABLE_GENRES.map((genre) => {
                const active = selectedGenres.some(
                  (g) => g.toLowerCase() === genre.toLowerCase(),
                );
                return (
                  <TouchableOpacity
                    key={genre}
                    activeOpacity={0.8}
                    onPress={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full border ${
                      active
                        ? 'border-accent bg-accent/20'
                        : 'border-glass-border bg-white/5'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-accent' : 'text-text-muted'
                      }`}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Local Storage & Data */}
          <View className="mx-5 mb-6 rounded-3xl border border-glass-border p-4 bg-glass-tint">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-white">Local Data</Text>
              <Text className="text-xs font-semibold text-accent">
                {likedSongs.length} Liked • {recentPlays.length} Recent
              </Text>
            </View>
            <Text className="text-xs text-text-muted mb-3">
              All stats, liked tracks, and audio settings are stored locally on your device.
            </Text>

            <View className="flex-row items-center justify-between gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClearHistory}
                className="flex-1 py-2.5 rounded-xl border border-glass-border bg-white/10 items-center justify-center"
              >
                <Text className="text-xs font-semibold text-white">Clear History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRestartOnboarding}
                className="flex-1 py-2.5 rounded-xl border border-accent/50 bg-accent/15 items-center justify-center"
              >
                <Text className="text-xs font-bold text-accent">Reset Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <EditProfileModal
        visible={editModalVisible}
        initialName={profileName}
        initialHandle={profileHandle}
        initialAvatarId={avatarId}
        onClose={() => setEditModalVisible(false)}
        onSave={updateProfile}
      />

      <GlassMiniPlayer />
    </View>
  );
}
