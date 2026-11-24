import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface UserPreferencesState {
  hasCompletedOnboarding: boolean;
  selectedLanguages: string[];
  selectedGenres: string[];
  selectedArtists: string[];
  _hasHydrated: boolean;

  toggleLanguage: (language: string) => void;
  setLanguages: (languages: string[]) => void;
  toggleGenre: (genre: string) => void;
  setGenres: (genres: string[]) => void;
  toggleArtist: (artist: string) => void;
  setArtists: (artists: string[]) => void;
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
      _hasHydrated: false,

      toggleLanguage: (language: string) => {
        const { selectedLanguages } = get();
        const exists = selectedLanguages.includes(language);
        if (exists) {
          if (selectedLanguages.length > 1) {
            set({
              selectedLanguages: selectedLanguages.filter((l) => l !== language),
            });
          }
        } else {
          set({ selectedLanguages: [...selectedLanguages, language] });
        }
      },

      setLanguages: (languages: string[]) => set({ selectedLanguages: languages }),

      toggleGenre: (genre: string) => {
        const { selectedGenres } = get();
        const exists = selectedGenres.includes(genre);
        set({
          selectedGenres: exists
            ? selectedGenres.filter((g) => g !== genre)
            : [...selectedGenres, genre],
        });
      },

      setGenres: (genres: string[]) => set({ selectedGenres: genres }),

      toggleArtist: (artist: string) => {
        const { selectedArtists } = get();
        const exists = selectedArtists.includes(artist);
        set({
          selectedArtists: exists
            ? selectedArtists.filter((a) => a !== artist)
            : [...selectedArtists, artist],
        });
      },

      setArtists: (artists: string[]) => set({ selectedArtists: artists }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetPreferences: () =>
        set({
          hasCompletedOnboarding: false,
          selectedLanguages: ['English'],
          selectedGenres: [],
          selectedArtists: [],
        }),

      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'pulsebeat-user-preferences',
      storage: createJSONStorage(() => safeAsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
