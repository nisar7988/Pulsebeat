const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockStorage.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      mockStorage.set(k, v);
    }),
    removeItem: jest.fn(async (k: string) => {
      mockStorage.delete(k);
    }),
  },
}));

const mockListeners = new Map<string, (event?: any) => Promise<void> | void>();
const mockSubscriptions: Array<{ remove: jest.Mock }> = [];

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(async () => {}),
    updateOptions: jest.fn(async () => {}),
    addEventListener: jest.fn((event: string, cb: (payload: any) => void) => {
      mockListeners.set(event, cb);
      const sub = { remove: jest.fn() };
      mockSubscriptions.push(sub);
      return sub;
    }),
    setRepeatMode: jest.fn(async () => {}),
    getRepeatMode: jest.fn(async () => 0),
    getPlaybackState: jest.fn(async () => ({ state: 'paused' })),
    getProgress: jest.fn(async () => ({ position: 10, duration: 100 })),
    pause: jest.fn(async () => {}),
    play: jest.fn(async () => {}),
    stop: jest.fn(async () => {}),
    seekTo: jest.fn(async () => {}),
    skip: jest.fn(async () => {}),
    skipToNext: jest.fn(async () => {}),
    skipToPrevious: jest.fn(async () => {}),
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
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
    RemoteNext: 'remote-next',
    RemotePrevious: 'remote-previous',
    RemoteSeek: 'remote-seek',
    RemoteJumpForward: 'remote-jump-forward',
    RemoteJumpBackward: 'remote-jump-backward',
    RemoteSkip: 'remote-skip',
    RemoteDuck: 'remote-duck',
    PlaybackProgressUpdated: 'playback-progress-updated',
    PlaybackState: 'playback-state',
    PlaybackActiveTrackChanged: 'playback-active-track-changed',
  },
  RepeatMode: { Off: 0, Track: 1 },
  State: {
    Playing: 'playing',
    Buffering: 'buffering',
    Paused: 'paused',
    Stopped: 'stopped',
    Ended: 'ended',
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
  syncWidgetProgress: jest.fn(),
}));

jest.mock('../src/service/music', () => ({
  getSongDetails: jest.fn(async () => ({ data: [] })),
  getSongSuggestions: jest.fn(async () => ({ data: [] })),
}));

import TrackPlayer, { Capability, Event } from 'react-native-track-player';
import { useCurrentSongStore } from '../src/store/useCurrentSongStore';
import { initializePlayer } from '../src/service/player';
import { playbackService } from '../src/service/playbackService';
import { syncPlaybackWidget } from '../src/service/widgetSync';
import type { Song } from '../src/types/song';

const mockTrackPlayer = TrackPlayer as unknown as {
  updateOptions: jest.Mock;
  play: jest.Mock;
  pause: jest.Mock;
  stop: jest.Mock;
  seekTo: jest.Mock;
  skip: jest.Mock;
  skipToNext: jest.Mock;
  skipToPrevious: jest.Mock;
  reset: jest.Mock;
  add: jest.Mock;
  getActiveTrack: jest.Mock;
  getQueue: jest.Mock;
  getActiveTrackIndex: jest.Mock;
  getProgress: jest.Mock;
};

const sampleSong = (id: string, name: string): Song => ({
  id,
  name,
  type: 'song',
  year: '2025',
  releaseDate: null,
  duration: 180,
  label: '',
  explicitContent: false,
  playCount: 0,
  language: 'english',
  hasLyrics: false,
  lyricsId: null,
  url: '',
  copyright: '',
  album: { id: 'alb-1', name: 'Album', url: '' },
  artists: {
    primary: [{ id: 'art-1', name: 'Artist', url: '' }],
    featured: [],
    all: [{ id: 'art-1', name: 'Artist', url: '' }],
  },
  image: [{ quality: '500x500', url: 'https://example.com/art.jpg' }],
  downloadUrl: [{ quality: '320kbps', url: `https://example.com/${id}.mp3` }],
});

describe('earphone & remote media controls in playbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListeners.clear();
    mockSubscriptions.length = 0;
    mockStorage.clear();
    useCurrentSongStore.getState().setCurrentSong(null);
    useCurrentSongStore.getState().setIsPlaying(false);
    useCurrentSongStore.getState().setIsShuffle(false);
  });

  test('initializePlayer registers standard media capabilities for headset/lockscreen controls', async () => {
    await initializePlayer();
    expect(mockTrackPlayer.updateOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
      }),
    );
  });

  test('RemotePlay, RemotePause, and RemoteStop handle loaded track playback', async () => {
    await playbackService();
    mockTrackPlayer.getActiveTrack.mockResolvedValueOnce({ id: 's1' });

    await mockListeners.get(Event.RemotePlay)?.();
    expect(useCurrentSongStore.getState().isPlaying).toBe(true);
    expect(mockTrackPlayer.play).toHaveBeenCalledTimes(1);
    expect(syncPlaybackWidget).toHaveBeenCalled();

    await mockListeners.get(Event.RemotePause)?.();
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);
    expect(mockTrackPlayer.pause).toHaveBeenCalledTimes(1);

    useCurrentSongStore.getState().setIsPlaying(true);
    await mockListeners.get(Event.RemoteStop)?.();
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);
    expect(mockTrackPlayer.stop).toHaveBeenCalledTimes(1);
  });

  test('RemotePlay falls back to persisted song when no active track is loaded', async () => {
    const persisted = sampleSong('cold-1', 'Cold Start Track');
    mockStorage.set(
      'song-storage',
      JSON.stringify({ state: { currentSong: persisted }, version: 0 }),
    );
    mockTrackPlayer.getActiveTrack.mockResolvedValue(null);

    await playbackService();
    await mockListeners.get(Event.RemotePlay)?.();

    expect(mockTrackPlayer.reset).toHaveBeenCalledTimes(1);
    expect(mockTrackPlayer.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cold-1', title: 'Cold Start Track' }),
    );
    expect(mockTrackPlayer.play).toHaveBeenCalledTimes(1);
    expect(useCurrentSongStore.getState().currentSong?.id).toBe('cold-1');
  });

  test('RemoteNext and RemotePrevious handle double/triple-tap track navigation', async () => {
    const track1 = { id: 't1', title: 'Track 1', artist: 'Artist', url: 'u1' };
    const track2 = { id: 't2', title: 'Track 2', artist: 'Artist', url: 'u2' };
    mockTrackPlayer.getQueue.mockResolvedValue([track1, track2]);

    await playbackService();

    mockTrackPlayer.getActiveTrackIndex.mockResolvedValue(0);
    mockTrackPlayer.getActiveTrack.mockResolvedValue(track1);
    await mockListeners.get(Event.RemoteNext)?.();
    expect(mockTrackPlayer.skipToNext).toHaveBeenCalledTimes(1);
    expect(mockTrackPlayer.play).toHaveBeenCalled();

    // Past 4s: RemotePrevious restarts current track
    mockTrackPlayer.getActiveTrackIndex.mockResolvedValue(1);
    mockTrackPlayer.getActiveTrack.mockResolvedValue(track2);
    mockTrackPlayer.getProgress.mockResolvedValueOnce({ position: 15, duration: 180 });
    await mockListeners.get(Event.RemotePrevious)?.();
    expect(mockTrackPlayer.seekTo).toHaveBeenCalledWith(0);
    expect(mockTrackPlayer.skipToPrevious).not.toHaveBeenCalled();

    // Within first 4s: RemotePrevious skips to previous track
    mockTrackPlayer.getProgress.mockResolvedValueOnce({ position: 2, duration: 180 });
    await mockListeners.get(Event.RemotePrevious)?.();
    expect(mockTrackPlayer.skipToPrevious).toHaveBeenCalledTimes(1);
  });

  test('RemoteSeek, RemoteJumpForward, RemoteJumpBackward, and RemoteSkip work cleanly', async () => {
    mockTrackPlayer.getQueue.mockResolvedValue([
      { id: 't1', title: 'Track 1', artist: 'Artist', url: 'u1' },
      { id: 't2', title: 'Track 2', artist: 'Artist', url: 'u2' },
    ]);

    await playbackService();

    await mockListeners.get(Event.RemoteSeek)?.({ position: 42 });
    expect(mockTrackPlayer.seekTo).toHaveBeenCalledWith(42);

    mockTrackPlayer.getProgress.mockResolvedValueOnce({ position: 95, duration: 100 });
    await mockListeners.get(Event.RemoteJumpForward)?.({ interval: 15 });
    expect(mockTrackPlayer.seekTo).toHaveBeenLastCalledWith(100);

    mockTrackPlayer.getProgress.mockResolvedValueOnce({ position: 5, duration: 100 });
    await mockListeners.get(Event.RemoteJumpBackward)?.({ interval: 15 });
    expect(mockTrackPlayer.seekTo).toHaveBeenLastCalledWith(0);

    await mockListeners.get(Event.RemoteSkip)?.({ index: 1 });
    expect(mockTrackPlayer.skip).toHaveBeenCalledWith(1);
  });

  test('re-invoking playbackService cleans up prior subscriptions to prevent duplicate triggers', async () => {
    await playbackService();
    const firstBatch = [...mockSubscriptions];
    expect(firstBatch.length).toBeGreaterThan(0);

    await playbackService();
    for (const sub of firstBatch) {
      expect(sub.remove).toHaveBeenCalledTimes(1);
    }
  });
});
