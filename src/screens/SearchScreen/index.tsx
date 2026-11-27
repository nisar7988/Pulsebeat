import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme } from '../../theme';
import { Song } from '../../types/song';
import {
  getAlbumBySearch,
  getAlbumDetails,
  getArtistBySearch,
  getArtistSongs,
  getPlaylistBySearch,
  getPlaylistDetails,
  getSongBySearch,
  getSongsByLanguage,
} from '../../service/music';
import {
  decodeHtmlEntities,
  navigateAndPlaySong,
  playQueueAndNavigate,
} from '../../service/player';
import { useListeningStore, useUserStore } from '../../store';
import { RootStackParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import { SongCard } from '../HomeScreen/components';
import PlaylistDetailModal, {
  ActivePlaylistDetail,
} from '../LibraryScreen/components/PlaylistDetailModal';

type SearchScope = 'Songs' | 'Artists' | 'Albums' | 'Playlists';
const SEARCH_SCOPES: SearchScope[] = ['Songs', 'Artists', 'Albums', 'Playlists'];

interface CollectionSearchItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  kind: 'artist' | 'album' | 'playlist';
}

const MOODS = [
  'All',
  'Trending',
  'Pop',
  'Romantic',
  'Party',
  'Lo-Fi',
  'Punjabi',
  'Hip Hop',
  'Workout',
  'Chill',
];

const BROWSE_CATEGORIES = [
  { id: '1', label: 'Pop Hits', query: 'Pop Hits', icon: 'music', color: '#C8F929' },
  { id: '2', label: 'Bollywood', query: 'Bollywood Hits', icon: 'heart', color: '#4ADE80' },
  { id: '3', label: 'Punjabi Beats', query: 'Punjabi Hits', icon: 'zap', color: '#FACC15' },
  { id: '4', label: 'Lo-Fi & Chill', query: 'Lofi Chill', icon: 'headphones', color: '#2DD4BF' },
  { id: '5', label: 'Romantic Melodies', query: 'Romantic Songs', icon: 'smile', color: '#34D399' },
  { id: '6', label: 'Hip Hop & Rap', query: 'Hip Hop', icon: 'radio', color: '#A3E635' },
  { id: '7', label: 'Workout Energy', query: 'Workout Gym', icon: 'activity', color: '#C8F929' },
  { id: '8', label: 'Trending Top 50', query: 'Trending Top 50', icon: 'trending-up', color: '#86EFAC' },
];

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  tintColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  tintColor,
}) => {
  const { theme } = useAppTheme();
  const resolvedTint = tintColor ?? theme.colors.glass.tint;
  return (
    <View className={`overflow-hidden border border-glass-border ${className}`}>
      {Platform.OS === 'ios' && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={22}
          overlayColor="transparent"
          reducedTransparencyFallbackColor={theme.colors.glass.fallbackSearch}
        />
      )}
      <View className="absolute inset-0" style={{ backgroundColor: resolvedTint }} />
      {children}
    </View>
  );
};





const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const { selectedLanguages } = useUserStore();
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    createPlaylist,
    addSongToPlaylist,
  } = useListeningStore();

  // Search State
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeMood, setActiveMood] = useState('All');
  const [activeScope, setActiveScope] = useState<SearchScope>('Songs');

  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [collectionResults, setCollectionResults] = useState<CollectionSearchItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMoreSongs, setHasMoreSongs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [topPicks, setTopPicks] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTopPicks, setIsLoadingTopPicks] = useState(true);

  const [detailModal, setDetailModal] = useState<ActivePlaylistDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Debounce search query input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Load initial Top Picks based on user's selected language
  useEffect(() => {
    let isMounted = true;
    const loadTopPicks = async () => {
      try {
        setIsLoadingTopPicks(true);
        const preferredLang = selectedLanguages[0] || 'hindi';
        const res = await getSongsByLanguage(preferredLang);
        if (isMounted) {
          const songs: Song[] = res?.data?.results || res?.data?.songs || [];
          setTopPicks(songs.slice(0, 15));
        }
      } catch (e) {
        console.log('Error loading search top picks:', e);
      } finally {
        if (isMounted) {
          setIsLoadingTopPicks(false);
        }
      }
    };

    loadTopPicks();

    return () => {
      isMounted = false;
    };
  }, [selectedLanguages]);

  // Fetch search results when debounced query or scope changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setCollectionResults([]);
      setHasMoreSongs(false);
      setPage(1);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    setPage(1);

    const performSearch = async () => {
      try {
        if (activeScope === 'Songs') {
          const res = await getSongBySearch(debouncedQuery, 1, 20);
          if (isMounted) {
            const songs: Song[] = res?.data?.results || res?.data?.songs || res?.data || [];
            setSearchResults(songs);
            setCollectionResults([]);
            setHasMoreSongs(songs.length >= 20);
          }
        } else if (activeScope === 'Artists') {
          const res = await getArtistBySearch(debouncedQuery, 1, 20);
          if (isMounted) {
            const raw = res?.data?.results || [];
            setCollectionResults(
              raw.map((item: any) => ({
                id: String(item.id),
                title: decodeHtmlEntities(item.name || 'Artist'),
                subtitle: item.role || 'Artist',
                image:
                  item.image?.[2]?.url ||
                  item.image?.[1]?.url ||
                  item.image?.[0]?.url ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                kind: 'artist',
              })),
            );
            setSearchResults([]);
            setHasMoreSongs(false);
          }
        } else if (activeScope === 'Albums') {
          const res = await getAlbumBySearch(debouncedQuery, 1, 20);
          if (isMounted) {
            const raw = res?.data?.results || [];
            setCollectionResults(
              raw.map((item: any) => ({
                id: String(item.id),
                title: decodeHtmlEntities(item.name || 'Album'),
                subtitle: item.year ? `Album • ${item.year}` : 'Album',
                image:
                  item.image?.[2]?.url ||
                  item.image?.[1]?.url ||
                  item.image?.[0]?.url ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                kind: 'album',
              })),
            );
            setSearchResults([]);
            setHasMoreSongs(false);
          }
        } else {
          const res = await getPlaylistBySearch(debouncedQuery, 1, 20);
          if (isMounted) {
            const raw = res?.data?.results || [];
            setCollectionResults(
              raw.map((item: any) => ({
                id: String(item.id),
                title: decodeHtmlEntities(item.title || item.name || 'Playlist'),
                subtitle: `${item.songCount || 20} songs • Playlist`,
                image:
                  item.image?.[2]?.url ||
                  item.image?.[1]?.url ||
                  item.image?.[0]?.url ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                kind: 'playlist',
              })),
            );
            setSearchResults([]);
            setHasMoreSongs(false);
          }
        }
      } catch (err) {
        console.log('Search API error:', err);
        if (isMounted) {
          setSearchResults([]);
          setCollectionResults([]);
        }
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeScope]);

  const loadMoreSongs = useCallback(async () => {
    if (
      activeScope !== 'Songs' ||
      !debouncedQuery ||
      !hasMoreSongs ||
      loadingMore ||
      isSearching
    ) {
      return;
    }
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await getSongBySearch(debouncedQuery, nextPage, 20);
      const nextSongs: Song[] = res?.data?.results || res?.data?.songs || [];
      if (nextSongs.length > 0) {
        setSearchResults((prev) => {
          const existing = new Set(prev.map((s) => s.id));
          return [...prev, ...nextSongs.filter((s) => !existing.has(s.id))];
        });
        setPage(nextPage);
        setHasMoreSongs(nextSongs.length >= 20);
      } else {
        setHasMoreSongs(false);
      }
    } catch (e) {
      console.log('Load more songs error:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [activeScope, debouncedQuery, hasMoreSongs, isSearching, loadingMore, page]);

  const openCollectionDetail = useCallback(async (item: CollectionSearchItem) => {
    const badgeLabel =
      item.kind === 'artist'
        ? 'Artist Catalog'
        : item.kind === 'album'
        ? 'Album'
        : 'Playlist';
    setDetailModal({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      badgeLabel,
      image: item.image,
      isLocal: false,
      songs: [],
    });
    setDetailLoading(true);
    try {
      let songs: Song[] = [];
      if (item.kind === 'artist') {
        const res = await getArtistSongs(item.id);
        songs = res?.data?.songs || res?.data?.results || [];
      } else if (item.kind === 'album') {
        const res = await getAlbumDetails(item.id);
        songs = res?.data?.songs || [];
      } else {
        const res = await getPlaylistDetails(item.id);
        songs = res?.data?.songs || [];
      }
      setDetailModal((prev) =>
        prev && prev.id === item.id ? { ...prev, songs } : prev,
      );
    } catch (e) {
      console.log('Collection detail fetch error:', e);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSaveCollection = useCallback(
    (pl: ActivePlaylistDetail) => {
      const created = createPlaylist(pl.title);
      pl.songs.forEach((song) => addSongToPlaylist(created.id, song));
      Alert.alert('Saved to Library', `"${pl.title}" was saved to your playlists.`);
    },
    [addSongToPlaylist, createPlaylist],
  );

  const addRecent = useCallback(
    (term: string) => {
      addRecentSearch(term);
    },
    [addRecentSearch],
  );

  const removeRecent = (term: string) => {
    removeRecentSearch(term);
  };

  const clearAllRecent = () => {
    clearRecentSearches();
  };

  const handleSelectMood = async (mood: string) => {
    setActiveMood(mood);
    if (mood === 'All') {
      setQuery('');
    } else {
      setQuery(mood);
      addRecent(mood);
    }
  };

  const handleSelectCategory = (catQuery: string) => {
    setQuery(catQuery);
    addRecent(catQuery);
    setActiveMood('All');
  };

  const handlePlaySong = (song: Song) => {
    try {
      if (query.trim()) {
        addRecent(query.trim());
      }
    } catch (e) {
      console.log('Error adding recent search:', e);
    }

    navigateAndPlaySong(navigation, song);
  };

  const isSearchingSongs = query.trim().length > 0 && activeScope === 'Songs';
  const isSearchingCollections = query.trim().length > 0 && activeScope !== 'Songs';

  const displayList: Array<Song | CollectionSearchItem> = useMemo(() => {
    if (isSearchingCollections) {
      return collectionResults;
    }
    if (isSearchingSongs) {
      return searchResults;
    }
    return topPicks;
  }, [collectionResults, isSearchingCollections, isSearchingSongs, searchResults, topPicks]);

  const activeResultCount = isSearchingCollections
    ? collectionResults.length
    : searchResults.length;

  return (
    <View className="flex-1 bg-background">
      {/* Full screen gradient background */}
      <LinearGradient
        colors={theme.gradients.search}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={displayList}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          contentContainerClassName="pt-3 px-4 pb-56"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={loadMoreSongs}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <>
              {/* Header Title & Compass Icon */}
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-3xl font-bold tracking-tight text-text">
                    Search
                  </Text>
                  <Text className="mt-0.5 text-xs text-text-muted">
                    Explore songs, artists, and playlists
                  </Text>
                </View>
                <View className="h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass-tint">
                  <Feather name="compass" size={20} color={theme.colors.accent.DEFAULT} />
                </View>
              </View>

              {/* Light Frosted Glass Search Bar */}
              <GlassCard
                className="mb-4 h-[54px] flex-row items-center gap-3 rounded-full px-4"
                tintColor={theme.colors.glass.tintActive}
              >
                <Feather name="search" size={20} color={theme.colors.accent.DEFAULT} />
                <TextInput
                  value={query}
                  onChangeText={(text) => {
                    setQuery(text);
                    if (activeMood !== 'All' && text !== activeMood) {
                      setActiveMood('All');
                    }
                  }}
                  placeholder="Songs, artists, or genres..."
                  placeholderTextColor={theme.colors.text.muted}
                  className="flex-1 py-0 text-base text-text"
                  returnKeyType="search"
                  autoCorrect={false}
                  onSubmitEditing={() => {
                    if (query.trim()) {
                      addRecent(query.trim());
                      Keyboard.dismiss();
                    }
                  }}
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color={theme.colors.text.DEFAULT} />
                ) : query.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setQuery('');
                      setActiveMood('All');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name="x-circle"
                      size={18}
                      color={theme.colors.text.DEFAULT}
                    />
                  </TouchableOpacity>
                ) : null}
              </GlassCard>

              {/* Mood & Vibe Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2.5 pb-4"
                keyboardShouldPersistTaps="handled"
              >
                {MOODS.map((mood) => {
                  const selected = mood === activeMood;
                  return (
                    <TouchableOpacity
                      key={mood}
                      activeOpacity={0.8}
                      onPress={() => handleSelectMood(mood)}
                    >
                      <GlassCard
                        className={`rounded-2xl px-4 py-2 ${
                          selected
                            ? 'border-glass-border-heavy'
                            : 'border-glass-border-light'
                        }`}
                        tintColor={
                          selected
                            ? theme.colors.glass.tintHeavy
                            : theme.colors.glass.tintLight
                        }
                      >
                        <Text
                          className={`text-sm ${
                            selected
                              ? 'font-bold text-accent'
                              : 'font-medium text-text-muted'
                          }`}
                        >
                          {mood}
                        </Text>
                      </GlassCard>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Search Scope Tabs (shown when searching) */}
              {query.trim().length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2 pb-4"
                  keyboardShouldPersistTaps="handled"
                >
                  {SEARCH_SCOPES.map((scope) => {
                    const selected = activeScope === scope;
                    return (
                      <TouchableOpacity
                        key={scope}
                        activeOpacity={0.8}
                        onPress={() => setActiveScope(scope)}
                        className={`px-4 py-1.5 rounded-full border ${
                          selected
                            ? 'border-accent bg-accent/25'
                            : 'border-white/15 bg-white/10'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected ? 'text-accent' : 'text-white/70'
                          }`}
                        >
                          {scope}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Recent Searches (shown only when query is empty) */}
              {query.length === 0 && recentSearches.length > 0 && (
                <View className="mb-5">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-text">
                      Recent Searches
                    </Text>
                    <TouchableOpacity onPress={clearAllRecent} hitSlop={8}>
                      <Text className="text-xs font-medium text-text-subtle">
                        Clear all
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row flex-wrap gap-2.5">
                    {recentSearches.map((term) => (
                      <TouchableOpacity
                        key={term}
                        activeOpacity={0.8}
                        onPress={() => {
                          setQuery(term);
                          addRecent(term);
                        }}
                      >
                        <GlassCard className="flex-row items-center gap-2 rounded-2xl px-3 py-2">
                          <Feather
                            name="clock"
                            size={13}
                            color={theme.colors.text.muted}
                          />
                          <Text className="text-xs font-medium text-text">
                            {term}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeRecent(term)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather
                              name="x"
                              size={13}
                              color={theme.colors.text.subtle}
                            />
                          </TouchableOpacity>
                        </GlassCard>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Browse Categories Grid (shown only when query is empty) */}
              {query.length === 0 && (
                <View className="mb-5">
                  <Text className="mb-3 text-base font-semibold text-text">
                    Browse Categories
                  </Text>
                  <View className="flex-row flex-wrap justify-between gap-y-3">
                    {BROWSE_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        activeOpacity={0.85}
                        className="w-[48%]"
                        onPress={() => handleSelectCategory(category.query)}
                      >
                        <GlassCard className="h-[92px] justify-between rounded-3xl p-3.5">
                          <View
                            className="h-[36px] w-[36px] items-center justify-center rounded-full border border-glass-border"
                            style={{ backgroundColor: `${category.color}35` }}
                          >
                            <Feather
                              name={category.icon}
                              size={18}
                              color={category.color}
                            />
                          </View>
                          <View>
                            <Text className="text-sm font-semibold text-text">
                              {category.label}
                            </Text>
                            <Text className="mt-0.5 text-[11px] text-text-muted">
                              Popular tracks
                            </Text>
                          </View>
                        </GlassCard>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Section Header for Song / Collection Items */}
              <View className="mb-3.5 flex-row items-center justify-between">
                <Text className="text-base font-semibold text-text">
                  {query.trim().length > 0
                    ? `${activeScope} for "${query.trim()}"`
                    : 'Top Picks For You'}
                </Text>
                {query.trim().length > 0 && activeResultCount > 0 && (
                  <View className="rounded-full border border-glass-border bg-glass-tint px-2.5 py-0.5">
                    <Text className="text-xs text-text-muted">
                      {activeResultCount} found
                    </Text>
                  </View>
                )}
              </View>
            </>
          }
          renderItem={({ item }) => {
            if ('kind' in item) {
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => openCollectionDetail(item)}
                  className="mb-2.5 flex-row items-center rounded-2xl border border-glass-border bg-glass-tint p-2.5"
                >
                  <Image
                    source={{ uri: item.image }}
                    className={`w-12 h-12 mr-3 ${
                      item.kind === 'artist' ? 'rounded-full' : 'rounded-xl'
                    }`}
                    resizeMode="cover"
                  />
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-bold text-white" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <View className="h-9 w-9 rounded-full bg-accent/15 border border-accent/40 items-center justify-center">
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={theme.colors.accent.DEFAULT}
                    />
                  </View>
                </TouchableOpacity>
              );
            }
            return <SongCard song={item} onPlay={handlePlaySong} />;
          }}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={theme.colors.accent.DEFAULT} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            isSearching ? (
              <GlassCard className="items-center justify-center gap-3 rounded-3xl py-12">
                <ActivityIndicator
                  size="large"
                  color={theme.colors.accent.DEFAULT}
                />
                <Text className="text-sm font-medium text-text-muted">
                  Searching JioSaavn catalogue...
                </Text>
              </GlassCard>
            ) : query.trim().length > 0 ? (
              <GlassCard className="items-center justify-center gap-3 rounded-3xl px-6 py-10">
                <View className="h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-glass-tint">
                  <Feather
                    name="search"
                    size={26}
                    color={theme.colors.text.muted}
                  />
                </View>
                <Text className="text-center text-base font-semibold text-text">
                  No songs found for "{query.trim()}"
                </Text>
                <Text className="max-w-[260px] text-center text-xs text-text-muted">
                  Check the spelling or try searching for another artist, song, or genre.
                </Text>
                <TouchableOpacity
                  onPress={() => setQuery('Trending')}
                  className="mt-2 rounded-xl border border-glass-border bg-glass-tint px-4 py-2"
                >
                  <Text className="text-xs font-semibold text-text">
                    Explore Trending Songs
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            ) : isLoadingTopPicks ? (
              <GlassCard className="items-center justify-center gap-3 rounded-3xl py-12">
                <ActivityIndicator
                  size="large"
                  color={theme.colors.accent.DEFAULT}
                />
                <Text className="text-sm font-medium text-text-muted">
                  Loading top picks...
                </Text>
              </GlassCard>
            ) : (
              <GlassCard className="items-center justify-center gap-2.5 rounded-3xl py-9">
                <Feather
                  name="music"
                  size={26}
                  color={theme.colors.text.muted}
                />
                <Text className="text-sm text-text-muted">
                  Search your favorite songs and artists
                </Text>
              </GlassCard>
            )
          }
        />
      </SafeAreaView>

      <PlaylistDetailModal
        playlist={detailModal}
        loading={detailLoading}
        onClose={() => setDetailModal(null)}
        onPlayAll={(songs, startIndex) =>
          playQueueAndNavigate(navigation, songs, startIndex)
        }
        onSaveCuratedPlaylist={
          detailModal?.badgeLabel === 'Playlist' ? handleSaveCollection : undefined
        }
      />

      {/* Floating Glass Mini Player */}
      <GlassMiniPlayer />
    </View>
  );
};

export default SearchScreen;
