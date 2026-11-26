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

import {
  getSongsByLanguage,
  getSongsByGenre,
  getArtistSongs,
  getSongBySearch,
  getPopularArtists,
  ApiArtist,
} from '../../service/music';
import { Song } from '../../types/song';
import { useUserStore, useCurrentSongStore } from '../../store';
import { navigateAndPlaySong } from '../../service/player';
import { AppTabParamList } from '../../navigation/types';
import { theme } from '../../theme';
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

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const { selectedLanguages, selectedGenres, selectedArtists } = useUserStore();
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
  const [activeArtist, setActiveArtist] = useState<string>(selectedArtists[0] || 'Arijit Singh');

  // Song data
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [genreSongs, setGenreSongs] = useState<Song[]>([]);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [artistList, setArtistList] = useState<ApiArtist[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Load artists details/avatars
  useEffect(() => {
    let isMounted = true;
    const loadArtists = async () => {
      try {
        const popular = await getPopularArtists(userLanguages);
        if (isMounted && popular.length > 0) {
          setArtistList(popular);
          setActiveArtist((prev) => prev || popular[0]?.name || '');
        }
      } catch (e) {
        console.log('Error loading artists for Home:', e);
      }
    };
    loadArtists();
    return () => {
      isMounted = false;
    };
  }, [userLanguages]);

  const fetchLanguageSongs = useCallback(async (lang: string, bypassCache = false) => {
    if (!bypassCache && languageCache.current.has(lang)) {
      setTrendingSongs(languageCache.current.get(lang)!);
      setIsLoading(false);
      return;
    }
    try {
      const res = await getSongsByLanguage(lang);
      const songs: Song[] = res?.data?.results ?? [];
      languageCache.current.set(lang, songs);
      setTrendingSongs(songs);
    } catch (e) {
      console.log('Error loading trending songs:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGenreSongs = useCallback(async (genre: string, bypassCache = false) => {
    if (!bypassCache && genreCache.current.has(genre)) {
      setGenreSongs(genreCache.current.get(genre)!);
      return;
    }
    try {
      const res = await getSongsByGenre(genre);
      const songs: Song[] = res?.data?.results ?? [];
      genreCache.current.set(genre, songs);
      setGenreSongs(songs);
    } catch (e) {
      console.log('Error loading genre songs:', e);
    }
  }, []);

  const fetchArtistSongs = useCallback(async (artist: string, bypassCache = false) => {
    if (!artist) return;
    if (!bypassCache && artistCache.current.has(artist)) {
      setArtistSongs(artistCache.current.get(artist)!);
      return;
    }
    try {
      const isNumericId = /^\d+$/.test(artist);
      const res = isNumericId
        ? await getArtistSongs(artist)
        : await getSongBySearch(artist);
      const songs: Song[] = (res?.data?.songs || res?.data?.results || []).slice(0, 8);
      artistCache.current.set(artist, songs);
      setArtistSongs(songs);
    } catch (e) {
      console.log('Error loading artist songs:', e);
    }
  }, []);

  useEffect(() => {
    fetchLanguageSongs(activeLanguage);
  }, [activeLanguage, fetchLanguageSongs]);

  useEffect(() => {
    fetchGenreSongs(activeGenre);
  }, [activeGenre, fetchGenreSongs]);

  useEffect(() => {
    fetchArtistSongs(activeArtist);
  }, [activeArtist, fetchArtistSongs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      fetchLanguageSongs(activeLanguage, true),
      fetchGenreSongs(activeGenre, true),
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

  const renderArtistChip = useCallback(
    ({ item }: { item: ApiArtist }) => {
      const isSelected =
        item.name.toLowerCase() === activeArtist.toLowerCase() ||
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
    [activeArtist],
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

        {isLoading && !refreshing ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
            <Text className="text-xs text-white/60 mt-3 font-medium">
              Curating your music feed...
            </Text>
          </View>
        ) : (
          <>
            {artistList.length > 0 && (
              <View className="pt-2">
                <SectionHeader
                  badge="YOUR ARTISTS"
                  title="Artists You Love"
                  subtitle="Tap an artist to explore their catalog"
                />
                <FlatList
                  horizontal
                  data={artistList}
                  keyExtractor={keyExtractorArtist}
                  renderItem={renderArtistChip}
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 py-2"
                  initialNumToRender={5}
                  maxToRenderPerBatch={5}
                  windowSize={3}
                  removeClippedSubviews={Platform.OS === 'android'}
                />
              </View>
            )}

            {artistSongs.length > 0 && (
              <View className="pt-2">
                <SectionHeader
                  badge="SPOTLIGHT"
                  title={`Featuring ${activeArtist}`}
                  subtitle="Top tracks from your chosen artist"
                />
                <FlatList
                  horizontal
                  data={artistSongs}
                  keyExtractor={keyExtractorSong}
                  renderItem={renderHorizontalSong}
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 py-2"
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={3}
                  removeClippedSubviews={Platform.OS === 'android'}
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
      activeArtist,
      activeGenre,
      activeLanguage,
      artistList,
      artistSongs,
      genreSongs,
      isLoading,
      navigation,
      refreshing,
      renderArtistChip,
      renderHorizontalSong,
      userGenres,
      userLanguages,
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
        contentContainerClassName="pb-48"
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
      />

      <GlassMiniPlayer fallbackSong={currentSong || trendingSongs[0] || genreSongs[0]} />
    </SafeAreaView>
  );
}
