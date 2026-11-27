import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { theme } from '../../theme';
import { Song } from '../../types/song';
import {
  getSongArtistName,
  getSongArtwork,
  getSongTitle,
  playQueueAndNavigate,
} from '../../service/player';
import { getPlaylistBySearch, getPlaylistDetails } from '../../service/music';
import {
  useCurrentSongStore,
  useDownloadStore,
  useListeningStore,
  useUserStore,
  UserPlaylist,
} from '../../store';
import { AppTabParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import DownloadButton from '../../components/ui/DownloadButton';
import {
  clearAllDownloads,
  formatBytes,
  removeDownloadedSong,
} from '../../service/download';
import PlaylistDetailModal, {
  ActivePlaylistDetail,
} from './components/PlaylistDetailModal';

interface CuratedPlaylistPreview {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

const FILTER_TABS = ['All', 'Downloads', 'Playlists', 'Liked', 'Recent'] as const;
type FilterTab = (typeof FILTER_TABS)[number];
const LIKED_PLAYLIST_ID = 'liked-songs';
const DOWNLOADED_PLAYLIST_ID = 'downloaded-songs';

export default function LibraryScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const { selectedGenres } = useUserStore();
  const currentSong = useCurrentSongStore((state) => state.currentSong);

  const {
    likedSongs,
    recentPlays,
    playlists: localPlaylists,
    toggleLikeSong,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    openPlaylistModal,
  } = useListeningStore();

  const downloads = useDownloadStore((state) => state.downloads);
  const downloadOrder = useDownloadStore((state) => state.downloadOrder);

  const downloadedRecords = useMemo(() => {
    const orderedIds = downloadOrder.filter((id) => Boolean(downloads[id]));
    const extraIds = Object.keys(downloads).filter(
      (id) => !downloadOrder.includes(id),
    );
    return [...orderedIds, ...extraIds]
      .map((id) => downloads[id])
      .filter(Boolean);
  }, [downloadOrder, downloads]);

  const downloadedSongs = useMemo(
    () => downloadedRecords.map((r) => r.song),
    [downloadedRecords],
  );

  const totalDownloadBytes = useMemo(
    () => downloadedRecords.reduce((sum, r) => sum + (r.fileSize || 0), 0),
    [downloadedRecords],
  );

  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [curatedPlaylists, setCuratedPlaylists] = useState<CuratedPlaylistPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [detailPlaylist, setDetailPlaylist] =
    useState<ActivePlaylistDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCuratedPlaylists = useCallback(async () => {
    try {
      const preferredGenre = selectedGenres[0] || 'chill';
      const playlistRes = await getPlaylistBySearch(preferredGenre);
      const rawPlaylists = playlistRes?.data?.results || [];
      const formatted: CuratedPlaylistPreview[] = rawPlaylists
        .slice(0, 8)
        .map((item: any) => ({
          id: String(item.id),
          title: item.title || item.name || 'Curated Vibes',
          subtitle: `${item.songCount || 20} songs • Curated`,
          image:
            item.image?.[2]?.url ||
            item.image?.[1]?.url ||
            item.image?.[0]?.url ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        }));
      setCuratedPlaylists(formatted);
    } catch (err) {
      console.log('Error loading curated playlists:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedGenres]);

  useEffect(() => {
    loadCuratedPlaylists();
  }, [loadCuratedPlaylists]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCuratedPlaylists();
  };

  const openLocalPlaylist = (pl: UserPlaylist) => {
    setDetailLoading(false);
    setDetailPlaylist({
      id: pl.id,
      title: pl.name,
      subtitle: `${pl.songs.length} tracks`,
      image: pl.songs[0] ? getSongArtwork(pl.songs[0]) : undefined,
      isLocal: true,
      songs: pl.songs,
    });
  };

  const openLikedPlaylist = () => {
    setDetailLoading(false);
    setDetailPlaylist({
      id: LIKED_PLAYLIST_ID,
      title: 'Liked Songs',
      subtitle: `${likedSongs.length} tracks`,
      badgeLabel: 'Favorites Playlist',
      image: likedSongs[0] ? getSongArtwork(likedSongs[0]) : undefined,
      isLocal: true,
      isBuiltIn: true,
      songs: likedSongs,
    });
  };

  const openDownloadedPlaylist = () => {
    setDetailLoading(false);
    setDetailPlaylist({
      id: DOWNLOADED_PLAYLIST_ID,
      title: 'Downloaded Songs',
      subtitle: `${downloadedSongs.length} offline tracks`,
      badgeLabel: 'Offline Library',
      image: downloadedSongs[0] ? getSongArtwork(downloadedSongs[0]) : undefined,
      isLocal: true,
      isBuiltIn: true,
      songs: downloadedSongs,
    });
  };

  const handleClearAllDownloads = () => {
    if (downloadedSongs.length === 0) return;
    Alert.alert(
      'Clear All Downloads',
      `Delete all ${downloadedSongs.length} downloaded songs (${formatBytes(totalDownloadBytes)}) from your device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => clearAllDownloads(),
        },
      ],
    );
  };

  const openCuratedPlaylist = async (pl: CuratedPlaylistPreview) => {
    setDetailPlaylist({
      id: pl.id,
      title: pl.title,
      subtitle: pl.subtitle,
      image: pl.image,
      isLocal: false,
      songs: [],
    });
    setDetailLoading(true);
    try {
      const res = await getPlaylistDetails(pl.id);
      const songs: Song[] = res?.data?.songs || [];
      setDetailPlaylist((prev) =>
        prev && prev.id === pl.id ? { ...prev, songs } : prev,
      );
    } catch (err) {
      console.log('Error fetching playlist details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveCuratedPlaylist = (pl: ActivePlaylistDetail) => {
    const created = createPlaylist(pl.title);
    pl.songs.forEach((song) => addSongToPlaylist(created.id, song));
    Alert.alert('Saved to Library', `"${pl.title}" was saved to your local playlists.`);
  };

  const openAddToPlaylist = (song: Song) => {
    openPlaylistModal(song);
  };

  const openNewPlaylist = () => {
    openPlaylistModal(null);
  };

  // Keep detail modal in sync if user renames or removes a song from Liked Songs, Downloads, or a local playlist
  const syncedDetailPlaylist = detailPlaylist?.isLocal
    ? detailPlaylist.id === LIKED_PLAYLIST_ID
      ? {
          ...detailPlaylist,
          subtitle: `${likedSongs.length} tracks`,
          songs: likedSongs,
          image: likedSongs[0] ? getSongArtwork(likedSongs[0]) : undefined,
        }
      : detailPlaylist.id === DOWNLOADED_PLAYLIST_ID
      ? {
          ...detailPlaylist,
          subtitle: `${downloadedSongs.length} offline tracks`,
          songs: downloadedSongs,
          image: downloadedSongs[0] ? getSongArtwork(downloadedSongs[0]) : undefined,
        }
      : (() => {
          const latest = localPlaylists.find((p) => p.id === detailPlaylist.id);
          return latest
            ? {
                ...detailPlaylist,
                title: latest.name,
                subtitle: `${latest.songs.length} tracks`,
                songs: latest.songs,
                image: latest.songs[0] ? getSongArtwork(latest.songs[0]) : undefined,
              }
            : detailPlaylist;
        })()
    : detailPlaylist;

  const handleRemovePlaylistSong = (playlistId: string, songId: string) => {
    if (playlistId === LIKED_PLAYLIST_ID) {
      const target = likedSongs.find((s) => s.id === songId);
      if (target) {
        toggleLikeSong(target);
      }
      return;
    }
    if (playlistId === DOWNLOADED_PLAYLIST_ID) {
      const target = downloadedSongs.find((s) => s.id === songId);
      if (target) {
        Alert.alert(
          'Remove Download',
          `Remove "${getSongTitle(target)}" from offline downloads?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => removeDownloadedSong(songId),
            },
          ],
        );
      }
      return;
    }
    removeSongFromPlaylist(playlistId, songId);
  };

  const renderSongRow = (
    song: Song,
    queue: Song[],
    index: number,
    showUnlike = false,
    extraSubtitle?: string,
  ) => (
    <TouchableOpacity
      key={`${song.id}-${index}`}
      activeOpacity={0.85}
      onPress={() => playQueueAndNavigate(navigation, queue, index)}
      className="mx-5 mb-2.5 flex-row items-center rounded-2xl border border-glass-border bg-glass-tint p-2.5"
    >
      <Image
        source={{ uri: getSongArtwork(song) }}
        className="w-12 h-12 rounded-xl mr-3"
        resizeMode="cover"
      />
      <View className="flex-1 pr-2">
        <Text className="text-sm font-bold text-white" numberOfLines={1}>
          {getSongTitle(song)}
        </Text>
        <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
          {extraSubtitle ? `${getSongArtistName(song)} • ${extraSubtitle}` : getSongArtistName(song)}
        </Text>
      </View>

      <DownloadButton song={song} size="md" variant="ghost" className="mr-1" />

      <TouchableOpacity
        onPress={() => openAddToPlaylist(song)}
        className="h-9 w-9 items-center justify-center"
      >
        <Feather name="plus-circle" size={18} color="rgba(255,255,255,0.65)" />
      </TouchableOpacity>

      {showUnlike && (
        <TouchableOpacity
          onPress={() => toggleLikeSong(song)}
          className="h-9 w-9 items-center justify-center"
        >
          <Feather name="heart" size={17} color={theme.colors.accent.DEFAULT} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

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
                {downloadedSongs.length} offline • {localPlaylists.length + 1} playlists • {likedSongs.length} liked
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openNewPlaylist}
                className="h-10 px-3 flex-row items-center gap-1 rounded-full border border-accent/40 bg-accent/15"
              >
                <Feather name="plus" size={16} color={theme.colors.accent.DEFAULT} />
                <Text className="text-xs font-bold text-accent">New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Search')}
                className="h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass-tint"
              >
                <Feather name="search" size={18} color={theme.colors.accent.DEFAULT} />
              </TouchableOpacity>
            </View>
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

          {/* Downloaded Songs Hero Card */}
          {(activeFilter === 'All' || activeFilter === 'Downloads') && (
            <View className="px-5 mb-4">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={
                  activeFilter === 'All'
                    ? openDownloadedPlaylist
                    : undefined
                }
                className="overflow-hidden rounded-3xl border border-glass-border p-4 bg-glass-tint relative"
              >
                <LinearGradient
                  colors={['rgba(52, 211, 153, 0.20)', 'rgba(22, 38, 17, 0.45)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                    <View className="h-14 w-14 rounded-2xl bg-accent/20 border border-accent/50 items-center justify-center">
                      <Feather
                        name="download"
                        size={24}
                        color={theme.colors.accent.DEFAULT}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-white">
                        Downloads
                      </Text>
                      <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                        {downloadedSongs.length === 0
                          ? 'Tap download on any song to play offline'
                          : `${downloadedSongs.length} offline ${downloadedSongs.length === 1 ? 'track' : 'tracks'} • ${formatBytes(totalDownloadBytes)}`}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={downloadedSongs.length === 0}
                    onPress={() =>
                      playQueueAndNavigate(navigation, downloadedSongs, 0)
                    }
                    className={`h-10 w-10 rounded-full items-center justify-center ${
                      downloadedSongs.length > 0 ? 'bg-accent' : 'bg-white/10'
                    }`}
                  >
                    <Feather
                      name="play"
                      size={16}
                      color={
                        downloadedSongs.length > 0
                          ? theme.colors.text.dark
                          : '#FFFFFF'
                      }
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Downloaded Songs List */}
          {activeFilter === 'Downloads' && (
            <View className="mb-6">
              {downloadedRecords.length > 0 && (
                <View className="px-5 mb-2.5 flex-row items-center justify-between">
                  <Text className="text-base font-bold text-white">
                    Offline Tracks
                  </Text>
                  <TouchableOpacity onPress={handleClearAllDownloads}>
                    <Text className="text-xs text-red-400 font-semibold">
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {downloadedRecords.length === 0 ? (
                <View className="mx-5 p-5 rounded-2xl border border-glass-border bg-glass-tint items-center">
                  <View className="h-12 w-12 rounded-full bg-accent/15 border border-accent/35 items-center justify-center mb-2.5">
                    <Feather
                      name="download"
                      size={20}
                      color={theme.colors.accent.DEFAULT}
                    />
                  </View>
                  <Text className="text-sm font-semibold text-white mb-1">
                    No Downloaded Songs Yet
                  </Text>
                  <Text className="text-xs text-text-muted text-center">
                    Tap the download icon on any track or playlist to save songs for offline listening.
                  </Text>
                </View>
              ) : (
                downloadedRecords.map((record, idx) =>
                  renderSongRow(
                    record.song,
                    downloadedSongs,
                    idx,
                    false,
                    formatBytes(record.fileSize),
                  ),
                )
              )}
            </View>
          )}

          {/* Liked Songs Hero Card */}
          {(activeFilter === 'All' || activeFilter === 'Liked') && (
            <View className="px-5 mb-5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openLikedPlaylist}
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
                    <View className="h-14 w-14 rounded-2xl bg-accent items-center justify-center">
                      <Feather name="heart" size={26} color={theme.colors.text.dark} />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-white">Liked Songs</Text>
                      <Text className="text-xs text-text-muted mt-0.5">
                        {likedSongs.length === 0
                          ? 'Tap heart on any song to save'
                          : `${likedSongs.length} saved ${likedSongs.length === 1 ? 'track' : 'tracks'}`}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={likedSongs.length === 0}
                    onPress={() => playQueueAndNavigate(navigation, likedSongs, 0)}
                    className={`h-10 w-10 rounded-full items-center justify-center ${
                      likedSongs.length > 0 ? 'bg-accent' : 'bg-white/10'
                    }`}
                  >
                    <Feather
                      name="play"
                      size={16}
                      color={likedSongs.length > 0 ? theme.colors.text.dark : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Liked Songs List */}
          {activeFilter === 'Liked' && (
            <View className="mb-6">
              {likedSongs.length === 0 ? (
                <View className="mx-5 p-5 rounded-2xl border border-glass-border bg-glass-tint items-center">
                  <Text className="text-sm font-semibold text-white mb-1">
                    No Liked Songs Yet
                  </Text>
                  <Text className="text-xs text-text-muted text-center">
                    Open the Player and tap the heart icon to build your favorites collection.
                  </Text>
                </View>
              ) : (
                likedSongs.map((song, idx) =>
                  renderSongRow(song, likedSongs, idx, true),
                )
              )}
            </View>
          )}

          {/* Your Custom Playlists */}
          {(activeFilter === 'All' || activeFilter === 'Playlists') && (
            <View className="mb-6">
              <View className="px-5 mb-2.5 flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">Your Playlists</Text>
                <TouchableOpacity onPress={openNewPlaylist}>
                  <Text className="text-xs text-accent font-semibold">+ Create</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-5 gap-3.5"
              >
                {/* Built-in Liked Songs Playlist Card */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={openLikedPlaylist}
                  className="w-36"
                >
                  <View className="w-36 h-36 rounded-2xl overflow-hidden border border-accent/40 bg-accent/15 items-center justify-center relative">
                    {likedSongs[0] ? (
                      <Image
                        source={{ uri: getSongArtwork(likedSongs[0]) }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Feather
                        name="heart"
                        size={34}
                        color={theme.colors.accent.DEFAULT}
                      />
                    )}
                    <View className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/65 border border-accent/40 items-center justify-center">
                      <Feather name="heart" size={13} color={theme.colors.accent.DEFAULT} />
                    </View>
                    <View className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-accent items-center justify-center">
                      <Feather name="play" size={14} color={theme.colors.text.dark} />
                    </View>
                  </View>
                  <Text className="text-sm font-semibold text-white mt-2" numberOfLines={1}>
                    Liked Songs
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    {likedSongs.length} {likedSongs.length === 1 ? 'track' : 'tracks'}
                  </Text>
                </TouchableOpacity>

                {localPlaylists.map((pl) => (
                  <TouchableOpacity
                    key={pl.id}
                    activeOpacity={0.85}
                    onPress={() => openLocalPlaylist(pl)}
                    className="w-36"
                  >
                    <View className="w-36 h-36 rounded-2xl overflow-hidden border border-glass-border bg-glass-tint items-center justify-center relative">
                      {pl.songs[0] ? (
                        <Image
                          source={{ uri: getSongArtwork(pl.songs[0]) }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Feather
                          name="music"
                          size={34}
                          color={theme.colors.accent.DEFAULT}
                        />
                      )}
                      <View className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-accent items-center justify-center">
                        <Feather name="play" size={14} color={theme.colors.text.dark} />
                      </View>
                    </View>
                    <Text className="text-sm font-semibold text-white mt-2" numberOfLines={1}>
                      {pl.name}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      {pl.songs.length} {pl.songs.length === 1 ? 'track' : 'tracks'}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={openNewPlaylist}
                  className="w-36 h-36 rounded-2xl border border-dashed border-accent/45 bg-accent/10 items-center justify-center p-3"
                >
                  <View className="h-11 w-11 rounded-full bg-accent/20 items-center justify-center mb-2">
                    <Feather name="plus" size={22} color={theme.colors.accent.DEFAULT} />
                  </View>
                  <Text className="text-xs font-bold text-accent text-center">
                    Create Playlist
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Curated Collections (Tap to inspect & play real tracks) */}
          {(activeFilter === 'All' || activeFilter === 'Playlists') && (
            <View className="mb-6">
              <View className="px-5 mb-2.5 flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">Curated For You</Text>
                <Text className="text-xs text-text-muted">Tap to open</Text>
              </View>

              {isLoading && !refreshing ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color={theme.colors.accent.DEFAULT} />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 gap-3.5"
                >
                  {curatedPlaylists.map((playlist) => (
                    <TouchableOpacity
                      key={playlist.id}
                      activeOpacity={0.85}
                      onPress={() => openCuratedPlaylist(playlist)}
                      className="w-36"
                    >
                      <View className="w-36 h-36 rounded-2xl overflow-hidden border border-glass-border bg-glass-tint relative">
                        <Image
                          source={{ uri: playlist.image }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                        <View className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-accent items-center justify-center">
                          <Feather name="list" size={14} color={theme.colors.text.dark} />
                        </View>
                      </View>
                      <Text
                        className="text-sm font-semibold text-white mt-2"
                        numberOfLines={1}
                      >
                        {playlist.title}
                      </Text>
                      <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                        {playlist.subtitle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Real Recently Played */}
          {(activeFilter === 'All' || activeFilter === 'Recent') && (
            <View className="mb-4">
              <View className="px-5 mb-2.5 flex-row items-center justify-between">
                <Text className="text-base font-bold text-white">Recently Played</Text>
                {recentPlays.length > 0 && (
                  <Text className="text-xs text-accent font-semibold">
                    {recentPlays.length} tracks
                  </Text>
                )}
              </View>

              {recentPlays.length === 0 ? (
                <View className="mx-5 p-5 rounded-2xl border border-glass-border bg-glass-tint flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-xl bg-accent/15 items-center justify-center">
                    <Feather name="clock" size={18} color={theme.colors.accent.DEFAULT} />
                  </View>
                  <Text className="text-xs text-text-muted flex-1">
                    Songs you listen to will appear here automatically.
                  </Text>
                </View>
              ) : (
                recentPlays.map((song, idx) =>
                  renderSongRow(song, recentPlays, idx, false),
                )
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <PlaylistDetailModal
        playlist={syncedDetailPlaylist}
        loading={detailLoading}
        onClose={() => setDetailPlaylist(null)}
        onPlayAll={(songs, startIndex) =>
          playQueueAndNavigate(navigation, songs, startIndex)
        }
        onRemoveSong={handleRemovePlaylistSong}
        onRenamePlaylist={renamePlaylist}
        onDeletePlaylist={deletePlaylist}
        onSaveCuratedPlaylist={handleSaveCuratedPlaylist}
      />

      <GlassMiniPlayer fallbackSong={currentSong || recentPlays[0] || likedSongs[0]} />
    </View>
  );
}
