import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  HomeHeader,
  SectionHeader,
  HorizontalSongCard,
  ArtistAvatarChip,
  SongCard,
  GlassMiniPlayer,
} from './components';
import { theme } from '../../theme';
import { AppTabParamList, RootStackParamList } from '../../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();

  // User preferences from Zustand store
  const { selectedLanguages, selectedGenres, selectedArtists } = useUserStore();
  const currentSong = useCurrentSongStore((state) => state.currentSong);

  const userLanguages = useMemo(
    () => (selectedLanguages.length > 0 ? selectedLanguages : ['english', 'hindi']),
    [selectedLanguages],
  );
  const userGenres = useMemo(
    () => (selectedGenres.length > 0 ? selectedGenres : ['pop', 'lofi', 'electronic']),
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

  // Unified method to play a song and navigate to Player screen
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

  // Load content based on active selections
  const loadHomeContent = useCallback(async () => {
    try {
      const [langRes, genreRes] = await Promise.allSettled([
        getSongsByLanguage(activeLanguage),
        getSongsByGenre(activeGenre),
      ]);

      if (langRes.status === 'fulfilled') {
        setTrendingSongs(langRes.value?.data?.results ?? []);
      }
      if (genreRes.status === 'fulfilled') {
        setGenreSongs(genreRes.value?.data?.results ?? []);
      }

      // Fetch artist songs (support ID or name)
      if (activeArtist) {
        const isNumericId = /^\d+$/.test(activeArtist);
        const artistRes = isNumericId
          ? await getArtistSongs(activeArtist)
          : await getSongBySearch(activeArtist);

        const songs = artistRes?.data?.songs || artistRes?.data?.results || [];
        setArtistSongs(songs.slice(0, 8));
      }
    } catch (error) {
      console.log('Error loading personalized home feed:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeLanguage, activeGenre, activeArtist]);

  useEffect(() => {
    loadHomeContent();
  }, [loadHomeContent]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeContent();
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-48"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.DEFAULT}
          />
        }
      >
        {/* Header with Greeting & Language Switcher */}
        <HomeHeader
          languages={userLanguages}
          activeLanguage={activeLanguage}
          onSelectLanguage={(lang) => setActiveLanguage(lang)}
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
            {/* 1. Favorite Artists Row */}
            {artistList.length > 0 && (
              <View className="pt-2">
                <SectionHeader
                  badge="YOUR ARTISTS"
                  title="Artists You Love"
                  subtitle="Tap an artist to explore their catalog"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 py-2"
                >
                  {artistList.map((artist) => {
                    const isSelected =
                      artist.name.toLowerCase() === activeArtist.toLowerCase() ||
                      artist.id === activeArtist;
                    return (
                      <ArtistAvatarChip
                        key={artist.id}
                        name={artist.name}
                        avatar={artist.avatar}
                        isSelected={isSelected}
                        onPress={() => setActiveArtist(artist.name || artist.id)}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 2. Spotlight on Selected Artist */}
            {artistSongs.length > 0 && (
              <View className="pt-2">
                <SectionHeader
                  badge="SPOTLIGHT"
                  title={`Featuring ${activeArtist}`}
                  subtitle="Top tracks from your chosen artist"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5 py-2"
                >
                  {artistSongs.map((song) => (
                    <HorizontalSongCard
                      key={song.id}
                      song={song}
                      onPlay={handlePlaySong}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 3. Your Vibe / Selected Genres Carousel */}
            <View className="pt-2">
              <SectionHeader
                badge="YOUR VIBE"
                title="Matches Your Mood"
                subtitle="Genres based on your onboarding selections"
              />

              {/* Genre Selector Pills */}
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

              {/* Genre Songs Horizontal List */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-5 py-2 mt-1"
              >
                {genreSongs.map((song) => (
                  <HorizontalSongCard
                    key={song.id}
                    song={song}
                    onPlay={handlePlaySong}
                  />
                ))}
              </ScrollView>
            </View>

            {/* 4. Trending in Selected Language */}
            <View className="pt-2">
              <SectionHeader
                badge="TRENDING NOW"
                title={`Top Hits in ${activeLanguage}`}
                subtitle="Popular releases updated daily"
              />
              <View className="pt-1">
                {trendingSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onPlay={handlePlaySong}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Glass Mini Player */}
      <GlassMiniPlayer fallbackSong={currentSong || trendingSongs[0] || genreSongs[0]} />
    </SafeAreaView>
  );
}
