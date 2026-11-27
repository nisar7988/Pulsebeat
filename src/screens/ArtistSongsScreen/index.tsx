import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme } from '../../theme';
import { Song } from '../../types/song';
import { RootStackParamList } from '../../navigation/types';
import {
  getArtistBySearch,
  getArtistDetails,
  getArtistSongs,
  getSongBySearch,
} from '../../service/music';
import {
  decodeHtmlEntities,
  playQueueAndNavigate,
} from '../../service/player';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import { SongCard } from '../HomeScreen/components';

const DEFAULT_AVATAR = 'https://c.saavncdn.com/artists/default_150x150.jpg';

export default function ArtistSongsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'ArtistSongs'>>();
  const { artistId: paramArtistId, artistName, avatar: paramAvatar } = route.params;

  const [resolvedId, setResolvedId] = useState<string | null>(
    paramArtistId && /^\d+$/.test(paramArtistId) ? paramArtistId : null,
  );
  const [displayName, setDisplayName] = useState(decodeHtmlEntities(artistName));
  const [avatarUrl, setAvatarUrl] = useState(paramAvatar || DEFAULT_AVATAR);
  const [totalTracks, setTotalTracks] = useState<number | null>(null);

  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usingSearchFallback, setUsingSearchFallback] = useState(false);

  const seenSongIdsRef = useRef<Set<string>>(new Set());

  const loadInitial = useCallback(async () => {
    setLoading(true);
    seenSongIdsRef.current = new Set();

    try {
      let targetId =
        paramArtistId && /^\d+$/.test(paramArtistId) ? paramArtistId : null;

      if (!targetId && artistName) {
        const searchRes = await getArtistBySearch(artistName, 1, 1);
        const first = searchRes?.data?.results?.[0];
        if (first?.id) {
          targetId = String(first.id);
          if (first.name) {
            setDisplayName(decodeHtmlEntities(String(first.name)));
          }
          const img =
            first.image?.[2]?.url ||
            first.image?.[1]?.url ||
            first.image?.[0]?.url;
          if (img && !paramAvatar) {
            setAvatarUrl(img);
          }
        }
      }

      setResolvedId(targetId);

      if (targetId) {
        const [detailsRes, songsRes] = await Promise.all([
          !paramAvatar ? getArtistDetails(targetId).catch(() => null) : Promise.resolve(null),
          getArtistSongs(targetId, 0),
        ]);

        if (detailsRes?.data) {
          if (detailsRes.data.name) {
            setDisplayName(decodeHtmlEntities(String(detailsRes.data.name)));
          }
          const detailImg =
            detailsRes.data.image?.[2]?.url ||
            detailsRes.data.image?.[1]?.url ||
            detailsRes.data.image?.[0]?.url;
          if (detailImg && !paramAvatar) {
            setAvatarUrl(detailImg);
          }
        }

        const fetched: Song[] = songsRes?.data?.songs || [];
        const total = typeof songsRes?.data?.total === 'number' ? songsRes.data.total : null;
        if (fetched.length > 0) {
          const unique = fetched.filter((s) => {
            if (!s?.id || seenSongIdsRef.current.has(s.id)) return false;
            seenSongIdsRef.current.add(s.id);
            return true;
          });
          setSongs(unique);
          setTotalTracks(total);
          setPage(0);
          setUsingSearchFallback(false);
          setHasMore(
            total !== null ? unique.length < total && fetched.length >= 10 : fetched.length >= 10,
          );
          return;
        }
      }

      // Fallback to paginated song search by artist name
      setUsingSearchFallback(true);
      const searchSongsRes = await getSongBySearch(artistName, 1, 20);
      const rawSongs: Song[] = searchSongsRes?.data?.results || [];
      const unique = rawSongs.filter((s) => {
        if (!s?.id || seenSongIdsRef.current.has(s.id)) return false;
        seenSongIdsRef.current.add(s.id);
        return true;
      });
      setSongs(unique);
      setTotalTracks(
        typeof searchSongsRes?.data?.total === 'number'
          ? searchSongsRes.data.total
          : null,
      );
      setPage(1);
      setHasMore(rawSongs.length >= 20);
    } catch (e) {
      console.log('Error loading artist songs screen:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [artistName, paramArtistId, paramAvatar]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      if (!usingSearchFallback && resolvedId) {
        const res = await getArtistSongs(resolvedId, nextPage);
        const raw: Song[] = res?.data?.songs || [];
        const additions = raw.filter((s) => {
          if (!s?.id || seenSongIdsRef.current.has(s.id)) return false;
          seenSongIdsRef.current.add(s.id);
          return true;
        });
        if (additions.length > 0) {
          setSongs((prev) => [...prev, ...additions]);
        }
        setPage(nextPage);
        setHasMore(raw.length >= 10);
      } else {
        const res = await getSongBySearch(artistName, nextPage, 20);
        const raw: Song[] = res?.data?.results || [];
        const additions = raw.filter((s) => {
          if (!s?.id || seenSongIdsRef.current.has(s.id)) return false;
          seenSongIdsRef.current.add(s.id);
          return true;
        });
        if (additions.length > 0) {
          setSongs((prev) => [...prev, ...additions]);
        }
        setPage(nextPage);
        setHasMore(raw.length >= 20);
      }
    } catch (e) {
      console.log('Load more artist songs error:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [artistName, hasMore, loading, loadingMore, page, resolvedId, usingSearchFallback]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInitial();
  }, [loadInitial]);

  const handlePlaySongAtIndex = useCallback(
    (index: number) => {
      playQueueAndNavigate(navigation, songs, index);
    },
    [navigation, songs],
  );

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={theme.gradients.app}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Top Bar */}
        <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
            className="h-10 w-10 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-text-muted uppercase tracking-widest">
            Artist Catalog
          </Text>
          <View className="h-10 w-10" />
        </View>

        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
            <Text className="text-xs text-text-muted mt-3">
              Loading tracks for {displayName}...
            </Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-36"
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.accent.DEFAULT}
              />
            }
            ListHeaderComponent={
              <View className="px-5 pt-2 pb-4 items-center">
                <View className="w-28 h-28 rounded-full p-1 border-2 border-accent mb-3 overflow-hidden bg-glass-tint">
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                </View>
                <Text
                  className="text-2xl font-extrabold text-white text-center"
                  numberOfLines={2}
                >
                  {displayName}
                </Text>
                <Text className="text-xs text-text-muted mt-1">
                  {totalTracks !== null
                    ? `${totalTracks.toLocaleString()} songs available`
                    : `${songs.length} songs loaded`}
                </Text>

                {songs.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handlePlaySongAtIndex(0)}
                    className="mt-4 flex-row items-center gap-2 bg-accent px-6 py-2.5 rounded-full"
                  >
                    <Feather name="play" size={16} color={theme.colors.text.dark} />
                    <Text className="text-sm font-extrabold text-text-dark">
                      Play All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item, index }) => (
              <SongCard
                song={item}
                onPlay={() => handlePlaySongAtIndex(index)}
              />
            )}
            ListEmptyComponent={
              <View className="mx-5 mt-4 p-6 rounded-2xl border border-glass-border bg-glass-tint items-center">
                <Feather name="music" size={28} color={theme.colors.text.muted} />
                <Text className="text-sm font-semibold text-white mt-2">
                  No songs found
                </Text>
                <Text className="text-xs text-text-muted mt-1 text-center">
                  Pull down to refresh and try again.
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color={theme.colors.accent.DEFAULT} />
                </View>
              ) : undefined
            }
          />
        )}
      </SafeAreaView>

      <GlassMiniPlayer bottomOffsetClass="bottom-6" />
    </View>
  );
}
