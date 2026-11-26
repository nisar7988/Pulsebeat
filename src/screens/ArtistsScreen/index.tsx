import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import {
  ApiArtist,
  getArtistBySearch,
  getPopularArtists,
} from '../../service/music';
import { decodeHtmlEntities } from '../../service/player';
import { useUserStore } from '../../store';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';

const DEFAULT_AVATAR = 'https://c.saavncdn.com/artists/default_150x150.jpg';
const BROWSE_QUERY = 'singer';
const PAGE_LIMIT = 18;

function mapApiArtists(rawList: any[]): ApiArtist[] {
  return rawList
    .filter((item) => item?.id && item?.name)
    .map((item) => ({
      id: String(item.id),
      name: decodeHtmlEntities(String(item.name)),
      role: decodeHtmlEntities(String(item.role || 'Artist')),
      genre: decodeHtmlEntities(String(item.role || 'Artist')),
      avatar:
        item.image?.[2]?.url ||
        item.image?.[1]?.url ||
        item.image?.[0]?.url ||
        DEFAULT_AVATAR,
    }));
}

export default function ArtistsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const selectedLanguages = useUserStore((state) => state.selectedLanguages);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    seenIdsRef.current = new Set();
    try {
      const initialList: ApiArtist[] = [];
      if (!debouncedQuery) {
        const popular = await getPopularArtists(selectedLanguages);
        for (const a of popular) {
          if (!seenIdsRef.current.has(a.id)) {
            seenIdsRef.current.add(a.id);
            initialList.push({ ...a, name: decodeHtmlEntities(a.name) });
          }
        }
      }

      const searchTerm = debouncedQuery || BROWSE_QUERY;
      const res = await getArtistBySearch(searchTerm, 1, PAGE_LIMIT);
      const raw = res?.data?.results || [];
      const mapped = mapApiArtists(raw);
      for (const a of mapped) {
        if (!seenIdsRef.current.has(a.id)) {
          seenIdsRef.current.add(a.id);
          initialList.push(a);
        }
      }
      setArtists(initialList);
      setPage(1);
      setHasMore(raw.length >= PAGE_LIMIT);
    } catch (e) {
      console.log('Error loading artists screen:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedQuery, selectedLanguages]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const searchTerm = debouncedQuery || BROWSE_QUERY;
      const res = await getArtistBySearch(searchTerm, nextPage, PAGE_LIMIT);
      const raw = res?.data?.results || [];
      const mapped = mapApiArtists(raw);
      const additions: ApiArtist[] = [];
      for (const a of mapped) {
        if (!seenIdsRef.current.has(a.id)) {
          seenIdsRef.current.add(a.id);
          additions.push(a);
        }
      }
      if (additions.length > 0) {
        setArtists((prev) => [...prev, ...additions]);
      }
      setPage(nextPage);
      setHasMore(raw.length >= PAGE_LIMIT);
    } catch (e) {
      console.log('Load more artists error:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedQuery, hasMore, loading, loadingMore, page]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInitial();
  }, [loadInitial]);

  const renderArtist = useCallback(
    ({ item }: { item: ApiArtist }) => (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('ArtistSongs', {
            artistId: item.id,
            artistName: item.name,
            avatar: item.avatar,
          })
        }
        className="flex-1 max-w-[32%] p-3 rounded-2xl border border-glass-border bg-glass-tint items-center"
      >
        <View className="w-20 h-20 rounded-full p-0.5 border-2 border-accent/60 mb-2 overflow-hidden">
          <Image
            source={{ uri: item.avatar || DEFAULT_AVATAR }}
            className="w-full h-full rounded-full"
            resizeMode="cover"
          />
        </View>
        <Text className="text-xs font-bold text-white text-center" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-[10px] text-text-muted text-center mt-0.5 capitalize" numberOfLines={1}>
          {item.role || 'Artist'}
        </Text>
      </TouchableOpacity>
    ),
    [navigation],
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
            <Text className="text-xl font-extrabold text-white">All Artists</Text>
            <Text className="text-xs text-text-muted">
              Tap any artist to explore their songs
            </Text>
          </View>
          <View className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1">
            <Text className="text-[11px] font-bold text-accent">
              {artists.length}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-3">
          <View className="h-11 flex-row items-center gap-2.5 rounded-2xl border border-glass-border bg-glass-tint px-3.5">
            <Feather name="search" size={16} color={theme.colors.accent.DEFAULT} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search artists..."
              placeholderTextColor={theme.colors.text.muted}
              className="flex-1 py-0 text-sm text-white"
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
            <Text className="text-xs text-text-muted mt-3">
              Loading artists...
            </Text>
          </View>
        ) : (
          <FlatList
            data={artists}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            numColumns={3}
            renderItem={renderArtist}
            columnWrapperClassName="gap-2.5 justify-start"
            contentContainerClassName="px-5 pt-1 pb-36 gap-3"
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            initialNumToRender={12}
            maxToRenderPerBatch={9}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.accent.DEFAULT}
              />
            }
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Feather name="users" size={32} color={theme.colors.text.muted} />
                <Text className="text-sm font-semibold text-white mt-3">
                  No artists found
                </Text>
                <Text className="text-xs text-text-muted mt-1">
                  Try searching with a different name.
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
