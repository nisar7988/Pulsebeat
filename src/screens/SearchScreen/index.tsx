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

const GlassCard = ({
  children,
  style,
  tintColor = 'rgba(255, 255, 255, 0.22)',
}: {
  children: React.ReactNode;
  style?: object;
  tintColor?: string;
}) => (
  <View style={[styles.glassBase, style]}>
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="light"
      blurAmount={22}
      overlayColor="transparent"
      reducedTransparencyFallbackColor="#7b78f8"
    />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} />
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
      colors={['#4a7bf7', '#7b79f8', '#b882fa']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.screen}
    >
      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Search</Text>

            {/* Light Frosted Search Bar */}
            <GlassCard
              style={styles.searchBar}
              tintColor="rgba(255, 255, 255, 0.26)"
            >
              <Feather name="search" size={20} color="#ffffff" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Songs, artists, or moods..."
                placeholderTextColor="rgba(255, 255, 255, 0.72)"
                style={styles.input}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Feather
                    name="x-circle"
                    size={18}
                    color="rgba(255, 255, 255, 0.85)"
                  />
                </TouchableOpacity>
              )}
            </GlassCard>

            {/* Mood Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodRow}
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
                      style={[styles.moodPill, selected && styles.moodPillActive]}
                      tintColor={
                        selected
                          ? 'rgba(255, 255, 255, 0.42)'
                          : 'rgba(255, 255, 255, 0.18)'
                      }
                    >
                      <Text
                        style={[
                          styles.moodText,
                          selected && styles.moodTextActive,
                        ]}
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <View style={styles.recentWrap}>
                  {recent.map((term) => (
                    <TouchableOpacity
                      key={term}
                      activeOpacity={0.8}
                      onPress={() => setQuery(term)}
                    >
                      <GlassCard style={styles.recentChip}>
                        <Feather
                          name="clock"
                          size={13}
                          color="rgba(255, 255, 255, 0.85)"
                        />
                        <Text style={styles.recentText}>{term}</Text>
                        <TouchableOpacity
                          onPress={() => removeRecent(term)}
                          hitSlop={6}
                        >
                          <Feather
                            name="x"
                            size={13}
                            color="rgba(255, 255, 255, 0.75)"
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Browse</Text>
                <View style={styles.genreGrid}>
                  {GENRES.map((genre) => (
                    <TouchableOpacity
                      key={genre.id}
                      activeOpacity={0.85}
                      style={styles.genreTouch}
                      onPress={() => setQuery(genre.label)}
                    >
                      <GlassCard style={styles.genreCard}>
                        <View style={styles.genreIconBadge}>
                          <Feather name={genre.icon} size={18} color="#ffffff" />
                        </View>
                        <Text style={styles.genreLabel}>{genre.label}</Text>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {query.length > 0 ? 'Results' : 'Top Picks'}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85}>
            <GlassCard style={styles.trackRow}>
              <Image source={{ uri: item.cover }} style={styles.cover} />
              <View style={styles.trackMeta}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <Feather
                name="play-circle"
                size={28}
                color="rgba(255, 255, 255, 0.88)"
              />
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Feather name="music" size={26} color="rgba(255, 255, 255, 0.85)" />
            <Text style={styles.emptyText}>No matches for "{query}"</Text>
          </GlassCard>
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  glassBase: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    paddingHorizontal: 18,
    borderRadius: 27,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 0,
  },
  moodRow: {
    gap: 10,
    paddingBottom: 20,
  },
  moodPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  moodPillActive: {
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  moodText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  moodTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
  },
  recentText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  genreTouch: {
    width: '48.2%',
  },
  genreCard: {
    height: 88,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
  },
  genreIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    marginBottom: 12,
    gap: 14,
  },
  cover: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  trackArtist: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 13,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    borderRadius: 22,
    gap: 10,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 15,
  },
});

export default SearchScreen;