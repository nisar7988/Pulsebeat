import { Alert } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        store.delete(k);
      }),
    },
  };
});

import { Song } from '../src/types/song';
import { pickAudioUrlByQuality } from '../src/service/audioUtils';
import { useDownloadStore } from '../src/store/useDownloadStore';
import { useUserStore } from '../src/store/useUserStore';

const mockFiles = new Map<string, { exists: boolean; size: number }>();
const mockDirs = new Set<string>();
const mockDownloadImpl = jest.fn();

jest.mock('expo-file-system', () => {
  function joinMockUri(uris: any[]): string {
    return uris
      .map((u, idx) => {
        const s = typeof u === 'string' ? u : u?.uri || '';
        return idx === 0 ? s.replace(/\/+$/, '') : s.replace(/^\/+|\/+$/g, '');
      })
      .filter(Boolean)
      .join('/');
  }

  class MockDirectory {
    uri: string;
    constructor(...uris: any[]) {
      this.uri = joinMockUri(uris);
    }
    get exists() {
      return mockDirs.has(this.uri);
    }
    create() {
      mockDirs.add(this.uri);
    }
    delete() {
      mockDirs.delete(this.uri);
      for (const key of Array.from(mockFiles.keys())) {
        if (key.startsWith(this.uri)) {
          mockFiles.delete(key);
        }
      }
    }
  }

  class MockFile {
    uri: string;
    constructor(...uris: any[]) {
      this.uri = joinMockUri(uris);
    }
    get exists() {
      return mockFiles.get(this.uri)?.exists ?? false;
    }
    get size() {
      return mockFiles.get(this.uri)?.size ?? 0;
    }
    delete() {
      mockFiles.delete(this.uri);
    }
    static async downloadFileAsync(url: string, dest: MockFile, options?: any) {
      return mockDownloadImpl(url, dest, options);
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: {
      document: 'file:///mock-documents',
    },
  };
});

const mockGetSongDetails = jest.fn();
jest.mock('../src/service/music', () => ({
  getSongDetails: (...args: any[]) => mockGetSongDetails(...args),
}));

import {
  cancelDownload,
  clearAllDownloads,
  downloadSong,
  downloadSongsBatch,
  formatBytes,
  getLocalAudioUri,
  removeDownloadedSong,
} from '../src/service/download';

function makeSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    name: 'Test Track',
    album: { id: 'alb-1', name: 'Test Album', url: '' },
    artists: {
      primary: [{ id: 'art-1', name: 'Test Artist', url: '' }],
      featured: [],
      all: [{ id: 'art-1', name: 'Test Artist', url: '' }],
    },
    copyright: '',
    downloadUrl: [
      { quality: '96kbps', url: 'https://cdn.example.com/low.m4a' },
      { quality: '160kbps', url: 'https://cdn.example.com/med.m4a' },
      { quality: '320kbps', url: 'https://cdn.example.com/high.m4a' },
    ],
    duration: 210,
    explicitContent: false,
    hasLyrics: false,
    image: [{ quality: '500x500', url: 'https://cdn.example.com/art.jpg' }],
    label: '',
    language: 'english',
    lyricsId: null,
    playCount: 0,
    releaseDate: null,
    type: 'song',
    url: '',
    year: '2026',
    ...overrides,
  };
}

describe('audioUtils & download service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFiles.clear();
    mockDirs.clear();
    useDownloadStore.getState().clearDownloadedRecords();
    useUserStore.getState().setAudioQuality('high');
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  test('pickAudioUrlByQuality selects expected bitrate tier', () => {
    const urls = makeSong().downloadUrl;
    expect(pickAudioUrlByQuality(urls, 'high')).toBe('https://cdn.example.com/high.m4a');
    expect(pickAudioUrlByQuality(urls, 'medium')).toBe('https://cdn.example.com/med.m4a');
    expect(pickAudioUrlByQuality(urls, 'low')).toBe('https://cdn.example.com/low.m4a');
    expect(pickAudioUrlByQuality([], 'high')).toBeUndefined();
  });

  test('formatBytes formats sizes cleanly', () => {
    expect(formatBytes(0)).toBe('0 MB');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  test('downloadSong saves audio and artwork and exposes local URI', async () => {
    mockDownloadImpl.mockImplementation(async (_url: string, dest: any, opts?: any) => {
      if (opts?.onProgress) {
        opts.onProgress({ bytesWritten: 1024, totalBytes: 2048 });
        opts.onProgress({ bytesWritten: 2048, totalBytes: 2048 });
      }
      mockFiles.set(dest.uri, { exists: true, size: 2048 });
      return dest;
    });

    const song = makeSong();
    const record = await downloadSong(song);

    expect(record).not.toBeNull();
    expect(record?.fileName).toBe('song-1.m4a');
    expect(record?.artworkFileName).toBe('song-1_art.jpg');
    expect(record?.fileSize).toBe(2048);
    expect(useDownloadStore.getState().downloads['song-1']).toBeDefined();
    expect(useDownloadStore.getState().activeDownloads['song-1']).toBeUndefined();
    expect(getLocalAudioUri('song-1')).toBe('file:///mock-documents/downloads/song-1.m4a');
  });

  test('downloadSong falls back to getSongDetails when downloadUrl is empty', async () => {
    mockGetSongDetails.mockResolvedValue({
      data: [
        {
          downloadUrl: [{ quality: '320kbps', url: 'https://cdn.example.com/fallback.mp3' }],
        },
      ],
    });
    mockDownloadImpl.mockImplementation(async (_url: string, dest: any) => {
      mockFiles.set(dest.uri, { exists: true, size: 4096 });
      return dest;
    });

    const song = makeSong({ id: 'song-fb', downloadUrl: [] });
    const record = await downloadSong(song);

    expect(mockGetSongDetails).toHaveBeenCalledWith('song-fb');
    expect(record?.fileName).toBe('song-fb.mp3');
    expect(getLocalAudioUri('song-fb')).toBe('file:///mock-documents/downloads/song-fb.mp3');
  });

  test('cancelDownload aborts an in-flight download cleanly', async () => {
    mockDownloadImpl.mockImplementation(
      (_url: string, _dest: any, opts?: any) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );

    const song = makeSong({ id: 'song-cancel' });
    const promise = downloadSong(song);
    cancelDownload('song-cancel');
    const result = await promise;

    expect(result).toBeNull();
    expect(useDownloadStore.getState().downloads['song-cancel']).toBeUndefined();
    expect(useDownloadStore.getState().activeDownloads['song-cancel']).toBeUndefined();
  });

  test('removeDownloadedSong and clearAllDownloads clean files and store', async () => {
    mockDownloadImpl.mockImplementation(async (_url: string, dest: any) => {
      mockFiles.set(dest.uri, { exists: true, size: 1000 });
      return dest;
    });

    await downloadSongsBatch([makeSong({ id: 's1' }), makeSong({ id: 's2' })]);
    expect(Object.keys(useDownloadStore.getState().downloads)).toHaveLength(2);

    removeDownloadedSong('s1');
    expect(getLocalAudioUri('s1')).toBeNull();
    expect(useDownloadStore.getState().downloads.s1).toBeUndefined();
    expect(getLocalAudioUri('s2')).toBe('file:///mock-documents/downloads/s2.m4a');

    clearAllDownloads();
    expect(Object.keys(useDownloadStore.getState().downloads)).toHaveLength(0);
    expect(getLocalAudioUri('s2')).toBeNull();
  });
});
