import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePresetId } from '../theme/presets';

// In-memory fallback if the native module hasn't been recompiled into the binary yet
const memoryStore = new Map<string, string>();

const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

export type AudioQuality = 'high' | 'medium' | 'low';

const LANGUAGE_ALIASES: Record<string, string> = {
  english: 'English',
  hindi: 'Hindi',
  punjabi: 'Punjabi',
  spanish: 'Spanish',
  korean: 'Korean',
  japanese: 'Japanese',
  tamil: 'Tamil',
  telugu: 'Telugu',
  french: 'French',
  german: 'German',
  arabic: 'Arabic',
  bengali: 'Bengali',
};

const GENRE_ALIASES: Record<string, string> = {
  pop: 'Pop',
  'pop hits': 'Pop',
  hiphop: 'Hip-Hop',
  'hip-hop': 'Hip-Hop',
  'hip hop': 'Hip-Hop',
  electronic: 'Electronic',
  lofi: 'Lo-Fi',
  'lo-fi': 'Lo-Fi',
  rock: 'Rock',
  rnb: 'R&B',
  'r&b': 'R&B',
  bollywood: 'Bollywood',
  indie: 'Indie',
  latin: 'Latin',
  classical: 'Classical',
  jazz: 'Jazz',
  metal: 'Metal',
  chill: 'Chill',
  acoustic: 'Acoustic',
  workout: 'Workout',
};

const DEFAULT_ARTIST_NAMES: Record<string, string> = {
  'the-weeknd': 'The Weeknd',
  'taylor-swift': 'Taylor Swift',
  'arijit-singh': 'Arijit Singh',
  drake: 'Drake',
  'dua-lipa': 'Dua Lipa',
  'diljit-dosanjh': 'Diljit Dosanjh',
  'billie-eilish': 'Billie Eilish',
  bts: 'BTS',
  'ed-sheeran': 'Ed Sheeran',
  'bad-bunny': 'Bad Bunny',
  'post-malone': 'Post Malone',
  'olivia-rodrigo': 'Olivia Rodrigo',
};

export function normalizeLanguageName(lang: string): string {
  const key = lang.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || lang.trim();
}

export function normalizeGenreName(genre: string): string {
  const key = genre.trim().toLowerCase();
  return GENRE_ALIASES[key] || genre.trim();
}

function dedupeNormalized(values: string[], normalizer: (v: string) => string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const val of values) {
    const normalized = normalizer(val);
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    out.push(normalized);
  }
  return out;
}

export interface SavedArtistProfile {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface UserPreferencesState {
  hasCompletedOnboarding: boolean;
  selectedLanguages: string[];
  selectedGenres: string[];
  selectedArtists: string[];
  artistNames: Record<string, string>;
  artistProfiles: Record<string, SavedArtistProfile>;
  profileName: string;
  profileHandle: string;
  avatarId: string;
  joinedAt: number;
  audioQuality: AudioQuality;
  autoPlay: boolean;
  repeatByDefault: boolean;
  themeId: ThemePresetId;
  _hasHydrated: boolean;

  toggleLanguage: (language: string) => void;
  setLanguages: (languages: string[]) => void;
  toggleGenre: (genre: string) => void;
  setGenres: (genres: string[]) => void;
  toggleArtist: (
    artistId: string,
    artistMeta?: string | { name: string; avatar?: string; role?: string },
  ) => void;
  setArtists: (artists: string[]) => void;
  updateProfile: (profile: {
    profileName?: string;
    profileHandle?: string;
    avatarId?: string;
  }) => void;
  setAudioQuality: (quality: AudioQuality) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setRepeatByDefault: (repeat: boolean) => void;
  setThemeId: (themeId: ThemePresetId) => void;
  completeOnboarding: () => void;
  resetPreferences: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useUserStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      selectedLanguages: ['English'],
      selectedGenres: [],
      selectedArtists: [],
      artistNames: { ...DEFAULT_ARTIST_NAMES },
      artistProfiles: {},
      profileName: 'PulseBeat Listener',
      profileHandle: '@pulsebeat',
      avatarId: 'neon-disc',
      joinedAt: Date.now(),
      audioQuality: 'high',
      autoPlay: true,
      repeatByDefault: false,
      themeId: 'pulse',
      _hasHydrated: false,

      toggleLanguage: (language: string) => {
        const normalized = normalizeLanguageName(language);
        const { selectedLanguages } = get();
        const exists = selectedLanguages.some(
          (l) => l.toLowerCase() === normalized.toLowerCase(),
        );
        if (exists) {
          if (selectedLanguages.length > 1) {
            set({
              selectedLanguages: selectedLanguages.filter(
                (l) => l.toLowerCase() !== normalized.toLowerCase(),
              ),
            });
          }
        } else {
          set({ selectedLanguages: [...selectedLanguages, normalized] });
        }
      },

      setLanguages: (languages: string[]) =>
        set({ selectedLanguages: dedupeNormalized(languages, normalizeLanguageName) }),

      toggleGenre: (genre: string) => {
        const normalized = normalizeGenreName(genre);
        const { selectedGenres } = get();
        const exists = selectedGenres.some(
          (g) => g.toLowerCase() === normalized.toLowerCase(),
        );
        set({
          selectedGenres: exists
            ? selectedGenres.filter(
                (g) => g.toLowerCase() !== normalized.toLowerCase(),
              )
            : [...selectedGenres, normalized],
        });
      },

      setGenres: (genres: string[]) =>
        set({ selectedGenres: dedupeNormalized(genres, normalizeGenreName) }),

      toggleArtist: (
        artistId: string,
        artistMeta?: string | { name: string; avatar?: string; role?: string },
      ) => {
        const { selectedArtists, artistNames, artistProfiles } = get();
        const exists = selectedArtists.includes(artistId);
        const metaName =
          typeof artistMeta === 'string' ? artistMeta : artistMeta?.name;
        const metaAvatar =
          typeof artistMeta === 'object' ? artistMeta?.avatar : undefined;
        const metaRole =
          typeof artistMeta === 'object' ? artistMeta?.role : undefined;

        const nextNames = metaName
          ? { ...artistNames, [artistId]: metaName }
          : artistNames;
        const nextProfiles =
          metaName && metaAvatar
            ? {
                ...artistProfiles,
                [artistId]: {
                  id: artistId,
                  name: metaName,
                  avatar: metaAvatar,
                  role: metaRole,
                },
              }
            : artistProfiles;

        set({
          selectedArtists: exists
            ? selectedArtists.filter((a) => a !== artistId)
            : [...selectedArtists, artistId],
          artistNames: nextNames,
          artistProfiles: nextProfiles,
        });
      },

      setArtists: (artists: string[]) => set({ selectedArtists: artists }),

      updateProfile: (profile) =>
        set((state) => ({
          profileName: profile.profileName !== undefined ? profile.profileName : state.profileName,
          profileHandle:
            profile.profileHandle !== undefined ? profile.profileHandle : state.profileHandle,
          avatarId: profile.avatarId !== undefined ? profile.avatarId : state.avatarId,
        })),

      setAudioQuality: (audioQuality: AudioQuality) => set({ audioQuality }),

      setAutoPlay: (autoPlay: boolean) => set({ autoPlay }),

      setRepeatByDefault: (repeatByDefault: boolean) => set({ repeatByDefault }),

      setThemeId: (themeId: ThemePresetId) => set({ themeId }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetPreferences: () =>
        set({
          hasCompletedOnboarding: false,
          selectedLanguages: ['English'],
          selectedGenres: [],
          selectedArtists: [],
          artistProfiles: {},
        }),

      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'pulsebeat-user-preferences',
      storage: createJSONStorage(() => safeAsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const normalizedLangs = dedupeNormalized(
            state.selectedLanguages || ['English'],
            normalizeLanguageName,
          );
          state.setLanguages(normalizedLangs.length ? normalizedLangs : ['English']);
          state.setGenres(
            dedupeNormalized(state.selectedGenres || [], normalizeGenreName),
          );
          state.setHasHydrated(true);
        } else {
          useUserStore.getState().setHasHydrated(true);
        }
      },
    }
  )
);
