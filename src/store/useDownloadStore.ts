import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Song } from '../types/song';
import { AudioQuality } from './useUserStore';
import { safeAsyncStorage } from './storage';

export interface DownloadedSongRecord {
  song: Song;
  fileName: string;
  artworkFileName?: string;
  fileSize: number;
  quality: AudioQuality;
  downloadedAt: number;
}

export interface ActiveDownloadState {
  progress: number;
  bytesWritten: number;
  totalBytes: number;
}

export interface DownloadStoreState {
  downloads: Record<string, DownloadedSongRecord>;
  downloadOrder: string[];
  activeDownloads: Record<string, ActiveDownloadState>;

  setActiveDownload: (songId: string, state: ActiveDownloadState | null) => void;
  markDownloaded: (record: DownloadedSongRecord) => void;
  removeDownloadedRecord: (songId: string) => void;
  clearDownloadedRecords: () => void;
}

export const useDownloadStore = create<DownloadStoreState>()(
  persist(
    (set) => ({
      downloads: {},
      downloadOrder: [],
      activeDownloads: {},

      setActiveDownload: (songId, downloadState) =>
        set((state) => {
          if (downloadState === null) {
            if (!(songId in state.activeDownloads)) return state;
            const next = { ...state.activeDownloads };
            delete next[songId];
            return { activeDownloads: next };
          }
          return {
            activeDownloads: {
              ...state.activeDownloads,
              [songId]: downloadState,
            },
          };
        }),

      markDownloaded: (record) =>
        set((state) => {
          const songId = record.song.id;
          return {
            downloads: {
              ...state.downloads,
              [songId]: record,
            },
            downloadOrder: [
              songId,
              ...state.downloadOrder.filter((id) => id !== songId),
            ],
          };
        }),

      removeDownloadedRecord: (songId) =>
        set((state) => {
          if (!(songId in state.downloads) && !state.downloadOrder.includes(songId)) {
            return state;
          }
          const nextDownloads = { ...state.downloads };
          delete nextDownloads[songId];
          return {
            downloads: nextDownloads,
            downloadOrder: state.downloadOrder.filter((id) => id !== songId),
          };
        }),

      clearDownloadedRecords: () =>
        set({
          downloads: {},
          downloadOrder: [],
        }),
    }),
    {
      name: 'pulsebeat-downloads',
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        downloads: state.downloads,
        downloadOrder: state.downloadOrder,
      }),
    },
  ),
);
