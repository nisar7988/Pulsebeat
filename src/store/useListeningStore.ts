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

export interface UserPlaylist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

export interface ListeningStoreState {
  likedSongs: Song[];
  recentPlays: Song[];
  playlists: UserPlaylist[];
  playCounts: Record<string, PlayCountEntry>;
  artistPlayCounts: Record<string, number>;
  totalListeningSeconds: number;
  playlistModalVisible: boolean;
  playlistModalSong: Song | null;

  toggleLikeSong: (song: Song) => void;
  recordPlay: (song: Song) => void;
  createPlaylist: (name: string, initialSong?: Song) => UserPlaylist;
  deletePlaylist: (playlistId: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  openPlaylistModal: (song?: Song | null) => void;
  closePlaylistModal: () => void;
  clearHistory: () => void;
  clearAllListeningData: () => void;
}

export const useListeningStore = create<ListeningStoreState>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      recentPlays: [],
      playlists: [],
      playCounts: {},
      artistPlayCounts: {},
      totalListeningSeconds: 0,
      playlistModalVisible: false,
      playlistModalSong: null,

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
        const mergedPlayCounts: Record<string, PlayCountEntry> = {
          ...playCounts,
          [song.id]: {
            song,
            count: (prevEntry?.count ?? 0) + 1,
            lastPlayedAt: Date.now(),
          },
        };
        const entries = Object.entries(mergedPlayCounts);
        const nextPlayCounts: Record<string, PlayCountEntry> =
          entries.length > 60
            ? Object.fromEntries(
                entries
                  .sort((a, b) => b[1].lastPlayedAt - a[1].lastPlayedAt)
                  .slice(0, 60),
              )
            : mergedPlayCounts;

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

      createPlaylist: (name: string, initialSong?: Song) => {
        const trimmed = name.trim() || 'Untitled Playlist';
        const newPlaylist: UserPlaylist = {
          id: `pl_${Date.now()}`,
          name: trimmed,
          songs: initialSong ? [initialSong] : [],
          createdAt: Date.now(),
        };
        set((state) => ({
          playlists: [newPlaylist, ...state.playlists],
        }));
        return newPlaylist;
      },

      deletePlaylist: (playlistId: string) =>
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        })),

      addSongToPlaylist: (playlistId: string, song: Song) =>
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            if (p.songs.some((s) => s.id === song.id)) return p;
            return { ...p, songs: [song, ...p.songs] };
          }),
        })),

      removeSongFromPlaylist: (playlistId: string, songId: string) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
              : p,
          ),
        })),

      openPlaylistModal: (song = null) =>
        set({ playlistModalVisible: true, playlistModalSong: song }),

      closePlaylistModal: () =>
        set({ playlistModalVisible: false, playlistModalSong: null }),

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
      partialize: (state) => ({
        likedSongs: state.likedSongs,
        recentPlays: state.recentPlays,
        playlists: state.playlists,
        playCounts: state.playCounts,
        artistPlayCounts: state.artistPlayCounts,
        totalListeningSeconds: state.totalListeningSeconds,
      }),
    },
  ),
);
