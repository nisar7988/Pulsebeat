import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

import { theme } from '../../theme';
import { Song } from '../../types/song';
import { getSongBySearch, getSongsByLanguage } from '../../service/music';
import { navigateAndPlaySong } from '../../service/player';
import { useUserStore } from '../../store';
import { RootStackParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';
import { SongCard } from '../HomeScreen/components';

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
  tintColor = theme.colors.glass.tint,
}) => (
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
    <View className="absolute inset-0" style={{ backgroundColor: tintColor }} />
    {children}
  </View>
);





const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedLanguages, selectedArtists } = useUserStore();


  // Search State
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeMood, setActiveMood] = useState('All');

  // Seed recent searches with user's favorite artists or standard defaults
  const initialRecent = useMemo(() => {
    if (selectedArtists && selectedArtists.length > 0) {
      return selectedArtists.slice(0, 5);
    }
    return ['Arijit Singh', 'Diljit Dosanjh', 'The Weeknd', 'Taylor Swift'];
  }, [selectedArtists]);

  const [recent, setRecent] = useState<string[]>(initialRecent);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [topPicks, setTopPicks] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTopPicks, setIsLoadingTopPicks] = useState(true);

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

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const performSearch = async () => {
      try {
        const res = await getSongBySearch(debouncedQuery);
        if (isMounted) {
          const songs: Song[] = res?.data?.results || res?.data?.songs || res?.data || [];
          setSearchResults(songs);
        }
      } catch (err) {
        console.log('Search API error:', err);
        if (isMounted) {
          setSearchResults([]);
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
  }, [debouncedQuery]);

  const addRecent = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecent((prev) => [
      trimmed,
      ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 6));
  }, []);

  const removeRecent = (term: string) => {
    setRecent((prev) => prev.filter((item) => item !== term));
  };

  const clearAllRecent = () => {
    setRecent([]);
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

  const displayList = useMemo(() => {
    if (query.trim().length > 0) {
      return searchResults;
    }
    return topPicks;
  }, [query, searchResults, topPicks]);

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
          keyExtractor={(item) => item.id}
          contentContainerClassName="pt-3 px-4 pb-48"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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

              {/* Recent Searches (shown only when query is empty) */}
              {query.length === 0 && recent.length > 0 && (
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
                    {recent.map((term) => (
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

              {/* Section Header for Song Items */}
              <View className="mb-3.5 flex-row items-center justify-between">
                <Text className="text-base font-semibold text-text">
                  {query.trim().length > 0
                    ? `Results for "${query.trim()}"`
                    : 'Top Picks For You'}
                </Text>
                {query.trim().length > 0 && searchResults.length > 0 && (
                  <View className="rounded-full border border-glass-border bg-glass-tint px-2.5 py-0.5">
                    <Text className="text-xs text-text-muted">
                      {searchResults.length} {searchResults.length === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                )}
              </View>
            </>
          }
          renderItem={({ item }) => (
            <SongCard song={item} onPlay={handlePlaySong} />
          )}
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

      {/* Floating Glass Mini Player */}
      <GlassMiniPlayer />
    </View>
  );
};

export default SearchScreen;
