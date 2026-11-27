import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import {
  getSongsByLanguage,
  getSongsByGenre,
  getArtistSongs,
  getSongBySearch,
  getPopularArtists,
  resolveSelectedArtists,
  ApiArtist,
} from '../../service/music';
import { Song } from '../../types/song';
import { useUserStore, useCurrentSongStore } from '../../store';
import { navigateAndPlaySong } from '../../service/player';
import { AppTabParamList, RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import {
  HomeHeader,
  SectionHeader,
  ArtistAvatarChip,
  HorizontalSongCard,
  SongCard,
} from './components';

const keyExtractorSong = (item: Song) => item.id;
const keyExtractorArtist = (item: ApiArtist) => item.id;

function dedupeSongs(list: Song[]): Song[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const out: Song[] = [];
  for (const s of list) {
    if (!s?.id || seenIds.has(s.id)) continue;
    const titleKey = (s.name || '').trim().toLowerCase();
    if (titleKey && seenTitles.has(titleKey)) continue;
    seenIds.add(s.id);
    if (titleKey) seenTitles.add(titleKey);
    out.push(s);
  }
  return out;
}

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const { theme } = useAppTheme();
  const {
    selectedLanguages,
    selectedGenres,
    selectedArtists,
    artistNames,
    artistProfiles,
  } = useUserStore();
  const currentSong = useCurrentSongStore((state) => state.currentSong);

  const userLanguages = useMemo(
    () => (selectedLanguages.length > 0 ? selectedLanguages : ['English', 'Hindi']),
    [selectedLanguages],
  );
  const userGenres = useMemo(
    () => (selectedGenres.length > 0 ? selectedGenres : ['Pop', 'Lo-Fi', 'Electronic']),
    [selectedGenres],
  );

  // Active filters
  const [activeLanguage, setActiveLanguage] = useState(userLanguages[0]);
  const [activeGenre, setActiveGenre] = useState(userGenres[0]);
  const [activeArtist, setActiveArtist] = useState<string>(
    selectedArtists[0] || '',
  );

  // Sync active filters if user preferences change (e.g. edited in Profile)
  useEffect(() => {
    setActiveLanguage((prev) =>
      userLanguages.some((l) => l.toLowerCase() === prev.toLowerCase())
        ? prev
        : userLanguages[0],
    );
  }, [userLanguages]);

  useEffect(() => {
    setActiveGenre((prev) =>
      userGenres.some((g) => g.toLowerCase() === prev.toLowerCase())
        ? prev
        : userGenres[0],
    );
  }, [userGenres]);

  useEffect(() => {
    if (selectedArtists.length > 0) {
      setActiveArtist((prev) =>
        prev &&
        (selectedArtists.includes(prev) ||
          artistListRef.current.some(
            (a) =>
              a.id === prev || a.name.toLowerCase() === prev.toLowerCase(),
          ))
          ? prev
          : selectedArtists[0],
      );
    }
  }, [selectedArtists]);

  // Song data
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [genreSongs, setGenreSongs] = useState<Song[]>([]);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [artistList, setArtistList] = useState<ApiArtist[]>([]);
  const artistListRef = useRef<ApiArtist[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [usingCachedFeed, setUsingCachedFeed] = useState(false);

  // In-memory caches to make switching tabs/pills instant
  const languageCache = useRef<Map<string, Song[]>>(new Map());
  const genreCache = useRef<Map<string, Song[]>>(new Map());
  const artistCache = useRef<Map<string, Song[]>>(new Map());

  const handlePlaySong = useCallback(
    (song: Song) => {
      navigateAndPlaySong(navigation, song);
    },
    [navigation],
  );

  // Load personalized artists: user's selected artists first, then language-matched popular artists
  useEffect(() => {
    let isMounted = true;
    const loadArtists = async () => {
      try {
        const [selectedResolved, popular] = await Promise.all([
          resolveSelectedArtists(selectedArtists, artistProfiles, artistNames),
          getPopularArtists(userLanguages),
        ]);

        if (!isMounted) return;

        const merged: ApiArtist[] = [];
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();

        for (const a of [...selectedResolved, ...popular]) {
          const nameKey = a.name.trim().toLowerCase();
          if (seenIds.has(a.id) || (nameKey && seenNames.has(nameKey))) continue;
          seenIds.add(a.id);
          if (nameKey) seenNames.add(nameKey);
          merged.push(a);
        }

        if (merged.length > 0) {
          artistListRef.current = merged;
          setArtistList(merged);
          setActiveArtist((prev) => {
            if (!prev) return merged[0].id || merged[0].name;
            const stillPresent = merged.some(
              (a) =>
                a.id === prev ||
                a.name.toLowerCase() === prev.toLowerCase(),
            );
            return stillPresent ? prev : merged[0].id || merged[0].name;
          });
        }
      } catch (e) {
        console.log('Error loading artists for Home:', e);
      }
    };
    loadArtists();
    return () => {
      isMounted = false;
    };
  }, [artistNames, artistProfiles, selectedArtists, userLanguages]);

  const fetchLanguageSongs = useCallback(async (lang: string, bypassCache = false) => {
    if (!bypassCache && languageCache.current.has(lang)) {
      setTrendingSongs(languageCache.current.get(lang)!);
      setFeedError(false);
      setIsLoading(false);
      return;
    }
    try {
      setFeedError(false);
      const res = await getSongsByLanguage(lang);
      const songs = dedupeSongs(res?.data?.results ?? []);
      setUsingCachedFeed(Boolean(res?._fromCache));
      languageCache.current.set(lang, songs);
      setTrendingSongs(songs);
    } catch (e) {
      console.log('Error loading trending songs:', e);
      setFeedError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGenreSongs = useCallback(
    async (genre: string, language: string, bypassCache = false) => {
      const cacheKey = `${language.toLowerCase()}::${genre.toLowerCase()}`;
      if (!bypassCache && genreCache.current.has(cacheKey)) {
        setGenreSongs(genreCache.current.get(cacheKey)!);
        return;
      }
      try {
        const res = await getSongsByGenre(genre, 1, 12, language);
        const songs = dedupeSongs(res?.data?.results ?? []);
        genreCache.current.set(cacheKey, songs);
        setGenreSongs(songs);
      } catch (e) {
        console.log('Error loading genre songs:', e);
      }
    },
    [],
  );

  const fetchArtistSongs = useCallback(
    async (artist: string, bypassCache = false) => {
      if (!artist) return;
      if (!bypassCache && artistCache.current.has(artist)) {
        setArtistSongs(artistCache.current.get(artist)!);
        return;
      }
      try {
        const isNumericId = /^\d+$/.test(artist);
        const matchedFromList = artistListRef.current.find(
          (a) =>
            a.id === artist || a.name.toLowerCase() === artist.toLowerCase(),
        );
        const targetId = isNumericId
          ? artist
          : matchedFromList && /^\d+$/.test(matchedFromList.id)
          ? matchedFromList.id
          : null;

        const lookupQuery =
          matchedFromList?.name ||
          artistNames[artist] ||
          artist.replace(/-/g, ' ');

        const res = targetId
          ? await getArtistSongs(targetId, 0)
          : await getSongBySearch(lookupQuery);
        const songs = dedupeSongs(
          res?.data?.songs || res?.data?.results || [],
        ).slice(0, 8);
        artistCache.current.set(artist, songs);
        setArtistSongs(songs);
      } catch (e) {
        console.log('Error loading artist songs:', e);
      }
    },
    [artistNames],
  );

  useEffect(() => {
    fetchLanguageSongs(activeLanguage);
  }, [activeLanguage, fetchLanguageSongs]);

  useEffect(() => {
    fetchGenreSongs(activeGenre, activeLanguage);
  }, [activeGenre, activeLanguage, fetchGenreSongs]);

  useEffect(() => {
    fetchArtistSongs(activeArtist);
  }, [activeArtist, fetchArtistSongs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      fetchLanguageSongs(activeLanguage, true),
      fetchGenreSongs(activeGenre, activeLanguage, true),
      fetchArtistSongs(activeArtist, true),
    ]);
    setRefreshing(false);
  }, [
    activeArtist,
    activeGenre,
    activeLanguage,
    fetchArtistSongs,
    fetchGenreSongs,
    fetchLanguageSongs,
  ]);

  const renderHorizontalSong = useCallback(
    ({ item }: { item: Song }) => (
      <HorizontalSongCard song={item} onPlay={handlePlaySong} />
    ),
    [handlePlaySong],
  );

  const renderTrendingSong = useCallback(
    ({ item }: { item: Song }) => (
      <SongCard song={item} onPlay={handlePlaySong} />
    ),
    [handlePlaySong],
  );

  const openArtistsPage = useCallback(() => {
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    if (parent) {
      parent.navigate('Artists');
    } else {
      (navigation as any).navigate('Artists');
    }
  }, [navigation]);

  const activeMatchedArtist = useMemo(
    () =>
      artistList.find(
        (a) =>
          a.id === activeArtist ||
          a.name.toLowerCase() === activeArtist.toLowerCase(),
      ),
    [activeArtist, artistList],
  );

  const activeArtistDisplayName = useMemo(() => {
    if (!activeArtist) return '';
    return activeMatchedArtist?.name || artistNames[activeArtist] || activeArtist;
  }, [activeArtist, activeMatchedArtist, artistNames]);

  const openArtistSongsPage = useCallback(() => {
    const params = {
      artistId: activeMatchedArtist?.id || (/^\d+$/.test(activeArtist) ? activeArtist : undefined),
      artistName: activeArtistDisplayName || 'Artist',
      avatar: activeMatchedArtist?.avatar,
    };
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    if (parent) {
      parent.navigate('ArtistSongs', params);
    } else {
      (navigation as any).navigate('ArtistSongs', params);
    }
  }, [activeArtist, activeArtistDisplayName, activeMatchedArtist, navigation]);

  const visibleArtists = useMemo(() => artistList.slice(0, 8), [artistList]);
  const visibleArtistSongs = useMemo(() => artistSongs.slice(0, 6), [artistSongs]);

  const renderArtistChip = useCallback(
    ({ item }: { item: ApiArtist }) => {
      const isSelected =
        item.name.toLowerCase() === activeArtistDisplayName.toLowerCase() ||
        item.id === activeArtist;
      return (
        <ArtistAvatarChip
          name={item.name}
          avatar={item.avatar}
          isSelected={isSelected}
          onPress={() => setActiveArtist(item.name || item.id)}
        />
      );
    },
    [activeArtist, activeArtistDisplayName],
  );

  const listHeader = useMemo(
    () => (
      <>
        <HomeHeader
          languages={userLanguages}
          activeLanguage={activeLanguage}
          onSelectLanguage={setActiveLanguage}
          onOpenSearch={() => navigation.navigate('Search')}
        />

        {usingCachedFeed && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRefresh}
            className="mx-5 mt-1 mb-1 px-3.5 py-2 rounded-2xl border border-accent/35 bg-accent/10 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Feather name="wifi-off" size={14} color={theme.colors.accent.DEFAULT} />
              <Text className="text-xs font-medium text-white/85" numberOfLines={1}>
                Showing offline cached feed
              </Text>
            </View>
            <Text className="text-xs font-bold text-accent">Retry</Text>
          </TouchableOpacity>
        )}

        {isLoading && !refreshing ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
            <Text className="text-xs text-white/60 mt-3 font-medium">
              Curating your music feed...
            </Text>
          </View>
        ) : (
          <>
            {visibleArtists.length > 0 && (
              <View className="pt-2">
                <SectionHeader
                  badge="YOUR ARTISTS"
                  title="Artists You Love"
                  subtitle="Tap an artist to explore their catalog"
                  actionLabel="See all"
                  onActionPress={openArtistsPage}
                />
                <FlatList
                  horizontal
                  data={visibleArtists}
                  keyExtractor={keyExtractorArtist}
                  renderItem={renderArtistChip}
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 py-2 items-start"
                  initialNumToRender={5}
                  maxToRenderPerBatch={5}
                  windowSize={3}
                  removeClippedSubviews={Platform.OS === 'android'}
                  ListFooterComponent={
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={openArtistsPage}
                      className="items-center w-16"
                    >
                      <View className="w-16 h-16 rounded-full border border-dashed border-accent/60 bg-accent/10 items-center justify-center">
                        <Feather
                          name="arrow-right"
                          size={20}
                          color={theme.colors.accent.DEFAULT}
                        />
                      </View>
                      <Text
                        className="text-xs text-center mt-1.5 font-bold text-accent"
                        numberOfLines={1}
                      >
                        View All
                      </Text>
                    </TouchableOpacity>
                  }
                />
              </View>
            )}

            {visibleArtistSongs.length > 0 && (
              <View className="pt-2">
                <SectionHeader
                  badge="SPOTLIGHT"
                  title={`Featuring ${activeArtistDisplayName}`}
                  subtitle="Top tracks from your chosen artist"
                  actionLabel="View more"
                  onActionPress={openArtistSongsPage}
                />
                <FlatList
                  horizontal
                  data={visibleArtistSongs}
                  keyExtractor={keyExtractorSong}
                  renderItem={renderHorizontalSong}
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 py-2"
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={3}
                  removeClippedSubviews={Platform.OS === 'android'}
                  ListFooterComponent={
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={openArtistSongsPage}
                      className="w-32"
                    >
                      <View className="w-32 h-36 rounded-2xl border border-dashed border-accent/50 bg-accent/10 items-center justify-center p-3">
                        <View className="h-10 w-10 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mb-2">
                          <Feather
                            name="arrow-right"
                            size={18}
                            color={theme.colors.accent.DEFAULT}
                          />
                        </View>
                        <Text className="text-xs font-bold text-accent text-center">
                          View More Songs
                        </Text>
                        <Text
                          className="text-[10px] text-white/60 text-center mt-0.5"
                          numberOfLines={1}
                        >
                          {activeArtistDisplayName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  }
                />
              </View>
            )}

            <View className="pt-2">
              <SectionHeader
                badge="YOUR VIBE"
                title="Matches Your Mood"
                subtitle="Genres based on your onboarding selections"
              />

              {userGenres.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 py-1 gap-2"
                >
                  {userGenres.map((genre) => {
                    const isSelected =
                      genre.toLowerCase() === activeGenre.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={genre}
                        activeOpacity={0.75}
                        onPress={() => setActiveGenre(genre)}
                        className={`px-3.5 py-1 rounded-full border ${
                          isSelected
                            ? 'border-accent bg-accent/25'
                            : 'border-white/15 bg-white/10'
                        }`}
                      >
                        <Text
                          className={`text-xs capitalize ${
                            isSelected
                              ? 'font-bold text-accent'
                              : 'font-medium text-white/70'
                          }`}
                        >
                          {genre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <FlatList
                horizontal
                data={genreSongs}
                keyExtractor={keyExtractorSong}
                renderItem={renderHorizontalSong}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-5 py-2 mt-1"
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={Platform.OS === 'android'}
              />
            </View>

            <View className="pt-2 pb-1">
              <SectionHeader
                badge="TRENDING NOW"
                title={`Top Hits in ${activeLanguage}`}
                subtitle="Popular releases updated daily"
              />
            </View>
          </>
        )}
      </>
    ),
    [
      activeArtistDisplayName,
      activeGenre,
      activeLanguage,
      genreSongs,
      isLoading,
      navigation,
      onRefresh,
      openArtistSongsPage,
      openArtistsPage,
      refreshing,
      renderArtistChip,
      renderHorizontalSong,
      theme.colors.accent.DEFAULT,
      userGenres,
      userLanguages,
      usingCachedFeed,
      visibleArtistSongs,
      visibleArtists,
    ],
  );

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <FlatList
        data={isLoading && !refreshing ? [] : trendingSongs}
        keyExtractor={keyExtractorSong}
        renderItem={renderTrendingSong}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-56"
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.DEFAULT}
          />
        }
        ListEmptyComponent={
          !isLoading && feedError ? (
            <View className="mx-5 mt-2 p-5 rounded-2xl border border-glass-border bg-glass-tint items-center">
              <Text className="text-sm font-bold text-white mb-1">
                Could not load music feed
              </Text>
              <Text className="text-xs text-white/60 text-center mb-3">
                Check your internet connection and try refreshing.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onRefresh}
                className="px-4 py-2 rounded-full bg-accent"
              >
                <Text className="text-xs font-extrabold text-text-dark">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      <GlassMiniPlayer fallbackSong={currentSong || trendingSongs[0] || genreSongs[0]} />
    </SafeAreaView>
  );
}
