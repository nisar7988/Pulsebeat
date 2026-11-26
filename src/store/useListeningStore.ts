import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types/song';

const memoryStore = new Map<string, string>();

const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) return value;
      return memoryStore.get(key) ?? null;
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

export interface PlayCountEntry {
  song: Song;
  count: number;
  lastPlayedAt: number;
}

export interface ListeningStoreState {
  likedSongs: Song[];
  recentPlays: Song[];
  playCounts: Record<string, PlayCountEntry>;
  artistPlayCounts: Record<string, number>;
  totalListeningSeconds: number;

  toggleLikeSong: (song: Song) => void;
  recordPlay: (song: Song) => void;
  clearHistory: () => void;
  clearAllListeningData: () => void;
}

export const useListeningStore = create<ListeningStoreState>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      recentPlays: [],
      playCounts: {},
      artistPlayCounts: {},
      totalListeningSeconds: 0,

      toggleLikeSong: (song: Song) => {
        const { likedSongs } = get();
        const exists = likedSongs.some((s) => s.id === song.id);
        set({
          likedSongs: exists
            ? likedSongs.filter((s) => s.id !== song.id)
            : [song, ...likedSongs],
        });
      },

      recordPlay: (song: Song) => {
        const { recentPlays, playCounts, artistPlayCounts, totalListeningSeconds } =
          get();

        const nextRecent = [
          song,
          ...recentPlays.filter((s) => s.id !== song.id),
        ].slice(0, 30);

        const prevEntry = playCounts[song.id];
        const nextPlayCounts: Record<string, PlayCountEntry> = {
          ...playCounts,
          [song.id]: {
            song,
            count: (prevEntry?.count ?? 0) + 1,
            lastPlayedAt: Date.now(),
          },
        };

        const primaryArtist =
          song.artists?.primary?.[0]?.name ||
          song.artists?.all?.[0]?.name ||
          'Unknown Artist';
        const nextArtistCounts = {
          ...artistPlayCounts,
          [primaryArtist]: (artistPlayCounts[primaryArtist] ?? 0) + 1,
        };

        const addedSeconds =
          typeof song.duration === 'number' && song.duration > 0
            ? song.duration
            : 180;

        set({
          recentPlays: nextRecent,
          playCounts: nextPlayCounts,
          artistPlayCounts: nextArtistCounts,
          totalListeningSeconds: totalListeningSeconds + addedSeconds,
        });
      },

      clearHistory: () =>
        set({
          recentPlays: [],
          playCounts: {},
          artistPlayCounts: {},
          totalListeningSeconds: 0,
        }),

      clearAllListeningData: () =>
        set({
          likedSongs: [],
          recentPlays: [],
          playCounts: {},
          artistPlayCounts: {},
          totalListeningSeconds: 0,
        }),
    }),
    {
      name: 'pulsebeat-listening-stats',
      storage: createJSONStorage(() => safeAsyncStorage),
    },
  ),
);
