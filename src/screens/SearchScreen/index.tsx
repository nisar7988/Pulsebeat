import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../theme';

type Track = {
  id: string;
  title: string;
  artist: string;
  cover: string;
};

const MOODS = ['All', 'Pop', 'Bollywood', 'Chill', 'Workout', 'Late Night'];

const RECENT = ['Ellie Goulding', 'BLACKPINK', 'Ariana Grande', 'Mithoon'];

const GENRES = [
  { id: '1', label: 'Pop Hits', icon: 'music' },
  { id: '2', label: 'Bollywood', icon: 'heart' },
  { id: '3', label: 'Chill Vibes', icon: 'headphones' },
  { id: '4', label: 'Trending', icon: 'trending-up' },
];

const TRACKS: Track[] = [
  {
    id: '1',
    title: 'Hate Me',
    artist: 'Ellie Goulding',
    cover: 'https://picsum.photos/seed/hateme/200',
  },
  {
    id: '2',
    title: 'Love To Hate Me',
    artist: 'BLACKPINK',
    cover: 'https://picsum.photos/seed/blackpink/200',
  },
  {
    id: '3',
    title: 'hate that i made you love me',
    artist: 'Ariana Grande',
    cover: 'https://picsum.photos/seed/ariana/200',
  },
  {
    id: '4',
    title: 'Hai Dil Ye Mera',
    artist: 'Mithoon',
    cover: 'https://picsum.photos/seed/mithoon/200',
  },
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
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="light"
      blurAmount={22}
      overlayColor="transparent"
      reducedTransparencyFallbackColor={theme.colors.glass.fallbackSearch}
    />
    <View className="absolute inset-0" style={{ backgroundColor: tintColor }} />
    {children}
  </View>
);

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState('All');
  const [recent, setRecent] = useState(RECENT);

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRACKS;
    return TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
    );
  }, [query]);

  const removeRecent = (term: string) => {
    setRecent((prev) => prev.filter((item) => item !== term));
  };

  return (
    <LinearGradient
      colors={theme.gradients.search}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      className="flex-1"
    >
      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pt-16 px-4 pb-32"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text className="text-3xl font-bold text-text mb-4 tracking-tight">
              Search
            </Text>

            {/* Light Frosted Search Bar */}
            <GlassCard
              className="flex-row items-center gap-3 h-[54px] px-4 rounded-full mb-4"
              tintColor={theme.colors.glass.tintActive}
            >
              <Feather name="search" size={20} color={theme.colors.text.DEFAULT} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Songs, artists, or moods..."
                placeholderTextColor={theme.colors.text.muted}
                className="flex-1 text-base text-text py-0"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Feather
                    name="x-circle"
                    size={18}
                    color={theme.colors.text.DEFAULT}
                  />
                </TouchableOpacity>
              )}
            </GlassCard>

            {/* Mood Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2.5 pb-5"
            >
              {MOODS.map((mood) => {
                const selected = mood === activeMood;
                return (
                  <TouchableOpacity
                    key={mood}
                    activeOpacity={0.8}
                    onPress={() => setActiveMood(mood)}
                  >
                    <GlassCard
                      className={`px-4 py-2 rounded-2xl ${
                        selected ? 'border-white/80' : 'border-glass-border-light'
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
                            ? 'font-bold text-text'
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

            {/* Recent Searches */}
            {query.length === 0 && recent.length > 0 && (
              <View className="mb-5">
                <Text className="text-base font-semibold text-text mb-3">Recent</Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {recent.map((term) => (
                    <TouchableOpacity
                      key={term}
                      activeOpacity={0.8}
                      onPress={() => setQuery(term)}
                    >
                      <GlassCard className="flex-row items-center gap-2 px-3 py-2 rounded-2xl">
                        <Feather
                          name="clock"
                          size={13}
                          color={theme.colors.text.muted}
                        />
                        <Text className="text-xs font-medium text-text">{term}</Text>
                        <TouchableOpacity
                          onPress={() => removeRecent(term)}
                          hitSlop={6}
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

            {/* Browse Grid */}
            {query.length === 0 && (
              <View className="mb-5">
                <Text className="text-base font-semibold text-text mb-3">Browse</Text>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {GENRES.map((genre) => (
                    <TouchableOpacity
                      key={genre.id}
                      activeOpacity={0.85}
                      className="w-[48%]"
                      onPress={() => setQuery(genre.label)}
                    >
                      <GlassCard className="h-[88px] rounded-3xl p-3.5 justify-between">
                        <View className="w-[34px] h-[34px] rounded-full bg-white/25 border border-white/40 items-center justify-center">
                          <Feather
                            name={genre.icon}
                            size={18}
                            color={theme.colors.text.DEFAULT}
                          />
                        </View>
                        <Text className="text-sm font-semibold text-text">
                          {genre.label}
                        </Text>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text className="text-base font-semibold text-text mb-3">
              {query.length > 0 ? 'Results' : 'Top Picks'}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85}>
            <GlassCard className="flex-row items-center p-3 rounded-3xl mb-3 gap-3.5">
              <Image source={{ uri: item.cover }} className="w-[50px] h-[50px] rounded-xl" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-text" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <Feather
                name="play-circle"
                size={28}
                color={theme.colors.text.DEFAULT}
              />
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <GlassCard className="items-center justify-center py-9 rounded-3xl gap-2.5">
            <Feather name="music" size={26} color={theme.colors.text.muted} />
            <Text className="text-sm text-text-muted">No matches for "{query}"</Text>
          </GlassCard>
        }
      />
    </LinearGradient>
  );
};

export default SearchScreen;
