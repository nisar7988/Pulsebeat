import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { Song } from '../../types/song';
import { playSong } from '../../service/player';
import { getPlaylistBySearch, getSongsByGenre } from '../../service/music';
import { useCurrentSongStore, useUserStore } from '../../store';
import { AppTabParamList, RootStackParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import { SongCard } from '../HomeScreen/components';

interface PlaylistPreview {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  songCount?: number;
}

const FILTER_TABS = ['All', 'Playlists', 'Liked', 'Recent'];

export default function LibraryScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const { selectedGenres } = useUserStore();
  const currentSong = useCurrentSongStore((state) => state.currentSong);

  const [activeFilter, setActiveFilter] = useState('All');
  const [playlists, setPlaylists] = useState<PlaylistPreview[]>([]);
  const [recentTracks, setRecentTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handlePlaySong = (song: Song) => {
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    if (parent) {
      parent.navigate('Player', { song });
    } else {
      (navigation as any).navigate('Player', { song });
    }

    useCurrentSongStore.getState().setCurrentSong(song);
    playSong(song).catch((e) => {
      console.log('Error playing song from Library:', e);
    });
  };

  const loadLibraryContent = useCallback(async () => {
    try {
      const preferredGenre = selectedGenres[0] || 'chill';
      const [playlistRes, songsRes] = await Promise.allSettled([
        getPlaylistBySearch(preferredGenre),
        getSongsByGenre(preferredGenre, 1, 8),
      ]);

      if (playlistRes.status === 'fulfilled') {
        const rawPlaylists = playlistRes.value?.data?.results || [];
        const formatted: PlaylistPreview[] = rawPlaylists.slice(0, 6).map((item: any) => ({
          id: String(item.id),
          title: item.title || item.name || 'Curated Vibes',
          subtitle: `${item.songCount || 20} songs • Playlist`,
          image:
            item.image?.[2]?.url ||
            item.image?.[1]?.url ||
            item.image?.[0]?.url ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
          songCount: item.songCount,
        }));
        setPlaylists(formatted);
      }

      if (songsRes.status === 'fulfilled') {
        const rawSongs: Song[] = songsRes.value?.data?.results || [];
        setRecentTracks(rawSongs);
      }
    } catch (err) {
      console.log('Error loading library feed:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedGenres]);

  useEffect(() => {
    loadLibraryContent();
  }, [loadLibraryContent]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLibraryContent();
  };

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent.DEFAULT}
            />
          }
        >
          {/* Header */}
          <View className="px-5 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-extrabold tracking-tight text-white">
                Your Library
              </Text>
              <Text className="mt-0.5 text-xs text-text-muted">
                Playlists, favorites, and listening history
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Search')}
              className="h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass-tint"
            >
              <Feather name="search" size={18} color={theme.colors.accent.DEFAULT} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-5 pb-4 gap-2"
          >
            {FILTER_TABS.map((tab) => {
              const isSelected = activeFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.75}
                  onPress={() => setActiveFilter(tab)}
                  className={`px-4 py-1.5 rounded-full border ${
                    isSelected
                      ? 'border-accent bg-accent/25'
                      : 'border-white/15 bg-white/10'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-accent' : 'text-white/70'
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isLoading && !refreshing ? (
            <View className="py-24 items-center justify-center">
              <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
              <Text className="text-xs text-white/60 mt-3 font-medium">
                Loading your music library...
              </Text>
            </View>
          ) : (
            <>
              {/* Liked Songs Hero Card */}
              {(activeFilter === 'All' || activeFilter === 'Liked') && (
                <View className="px-5 mb-5">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (recentTracks.length > 0) {
                        handlePlaySong(recentTracks[0]);
                      }
                    }}
                    className="overflow-hidden rounded-3xl border border-glass-border p-4 bg-glass-tint relative"
                  >
                    <LinearGradient
                      colors={['rgba(200, 249, 41, 0.22)', 'rgba(22, 38, 17, 0.45)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3.5">
                        <View className="h-14 w-14 rounded-2xl bg-accent items-center justify-center shadow-md shadow-accent/50">
                          <Feather name="heart" size={26} color={theme.colors.text.dark} />
                        </View>
                        <View>
                          <Text className="text-lg font-bold text-white">Liked Songs</Text>
                          <Text className="text-xs text-text-muted mt-0.5">
                            {recentTracks.length + 12} saved tracks
                          </Text>
                        </View>
                      </View>

                      <View className="h-10 w-10 rounded-full bg-accent items-center justify-center shadow-sm shadow-accent/50">
                        <Feather name="play" size={16} color={theme.colors.text.dark} className="ml-0.5" />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Playlists Horizontal Row */}
              {(activeFilter === 'All' || activeFilter === 'Playlists') && playlists.length > 0 && (
                <View className="mb-6">
                  <View className="px-5 mb-2.5 flex-row items-center justify-between">
                    <Text className="text-base font-bold text-white">Saved Playlists</Text>
                    <Text className="text-xs text-accent font-semibold">{playlists.length} collections</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="px-5 gap-3.5"
                  >
                    {playlists.map((playlist) => (
                      <TouchableOpacity
                        key={playlist.id}
                        activeOpacity={0.85}
                        className="w-36"
                      >
                        <View className="w-36 h-36 rounded-2xl overflow-hidden border border-glass-border bg-glass-tint relative">
                          <Image
                            source={{ uri: playlist.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                          <View className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-accent items-center justify-center shadow-sm shadow-accent/50">
                            <Feather name="music" size={14} color={theme.colors.text.dark} />
                          </View>
                        </View>
                        <Text className="text-sm font-semibold text-white mt-2" numberOfLines={1}>
                          {playlist.title}
                        </Text>
                        <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                          {playlist.subtitle}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Recently Played / Saved Tracks */}
              {(activeFilter === 'All' || activeFilter === 'Recent') && (
                <View className="mb-4">
                  <View className="px-5 mb-1.5 flex-row items-center justify-between">
                    <Text className="text-base font-bold text-white">Recently Played</Text>
                    <Text className="text-xs text-text-muted font-medium">Updated today</Text>
                  </View>

                  {recentTracks.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      onPlay={handlePlaySong}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Floating Glass Mini Player */}
      <GlassMiniPlayer fallbackSong={currentSong || recentTracks[0]} />
    </View>
  );
}
