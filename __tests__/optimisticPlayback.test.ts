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

const mockListeners = new Map<string, (event: any) => void>();

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(async () => {}),
    updateOptions: jest.fn(async () => {}),
    addEventListener: jest.fn((event: string, cb: (payload: any) => void) => {
      mockListeners.set(event, cb);
      return { remove: jest.fn() };
    }),
    setRepeatMode: jest.fn(async () => {}),
    getRepeatMode: jest.fn(async () => 0),
    getPlaybackState: jest.fn(async () => ({ state: 'playing' })),
    pause: jest.fn(async () => {}),
    play: jest.fn(async () => {}),
    stop: jest.fn(async () => {}),
    reset: jest.fn(async () => {}),
    add: jest.fn(async () => {}),
    getActiveTrack: jest.fn(async () => null),
    getQueue: jest.fn(async () => []),
    getActiveTrackIndex: jest.fn(async () => 0),
  },
  AppKilledPlaybackBehavior: { PausePlayback: 'pause' },
  Capability: {
    Play: 'play',
    Pause: 'pause',
    SkipToNext: 'next',
    SkipToPrevious: 'prev',
    SeekTo: 'seek',
  },
  Event: {
    PlaybackState: 'playback-state',
    PlaybackActiveTrackChanged: 'playback-active-track-changed',
  },
  RepeatMode: { Off: 0, Track: 1 },
  State: {
    Playing: 'playing',
    Buffering: 'buffering',
    Paused: 'paused',
    Stopped: 'stopped',
    None: 'none',
  },
}));

jest.mock('expo-file-system', () => ({
  Directory: class {},
  File: class {},
  Paths: { document: 'file:///mock-docs' },
}));

jest.mock('../src/service/widgetSync', () => ({
  syncPlaybackWidget: jest.fn(),
}));

jest.mock('../src/service/music', () => ({
  getSongDetails: jest.fn(async () => ({ data: [] })),
  getSongSuggestions: jest.fn(async () => ({ data: [] })),
}));

import TrackPlayer from 'react-native-track-player';
import { useCurrentSongStore } from '../src/store/useCurrentSongStore';
import {
  initializePlayer,
  pauseSong,
  resumeSong,
  stopSong,
  toggleRepeatMode,
} from '../src/service/player';

const mockTrackPlayer = TrackPlayer as unknown as {
  pause: jest.Mock;
  play: jest.Mock;
  stop: jest.Mock;
  getPlaybackState: jest.Mock;
  setRepeatMode: jest.Mock;
};

describe('optimistic playback controls', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useCurrentSongStore.getState().setIsPlaying(false);
    useCurrentSongStore.getState().setIsRepeat(false);
    await initializePlayer();
  });

  test('pauseSong and resumeSong update isPlaying synchronously before TrackPlayer resolves', async () => {
    let resolvePause!: () => void;
    mockTrackPlayer.pause.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        resolvePause = resolve;
      }),
    );

    useCurrentSongStore.getState().setIsPlaying(true);
    const pausePromise = pauseSong();

    // Immediately false before native pause resolves
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);

    // Stale Playing event arriving during optimistic lock must not flicker back to true
    mockListeners.get('playback-state')?.({ state: 'playing' });
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);

    await Promise.resolve();
    resolvePause();
    await pausePromise;
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);

    // Resume immediately flips to true before native play resolves
    let resolvePlay!: () => void;
    mockTrackPlayer.play.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        resolvePlay = resolve;
      }),
    );

    const resumePromise = resumeSong();
    expect(useCurrentSongStore.getState().isPlaying).toBe(true);
    await Promise.resolve();
    resolvePlay();
    await resumePromise;
  });

  test('stopSong sets isPlaying false immediately and reconciles on error', async () => {
    useCurrentSongStore.getState().setIsPlaying(true);
    const p = stopSong();
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);
    await p;

    mockTrackPlayer.pause.mockRejectedValueOnce(new Error('Native failure'));
    mockTrackPlayer.getPlaybackState.mockResolvedValueOnce({ state: 'playing' });
    useCurrentSongStore.getState().setIsPlaying(true);
    await pauseSong();
    expect(useCurrentSongStore.getState().isPlaying).toBe(true);
  });

  test('toggleRepeatMode updates isRepeat immediately and rolls back on failure', async () => {
    let resolveRepeat!: () => void;
    mockTrackPlayer.setRepeatMode.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        resolveRepeat = resolve;
      }),
    );

    const togglePromise = toggleRepeatMode();
    expect(useCurrentSongStore.getState().isRepeat).toBe(true);
    await Promise.resolve();
    resolveRepeat();
    await togglePromise;

    mockTrackPlayer.setRepeatMode.mockRejectedValueOnce(new Error('Repeat fail'));
    await toggleRepeatMode();
    expect(useCurrentSongStore.getState().isRepeat).toBe(true);
  });
});
