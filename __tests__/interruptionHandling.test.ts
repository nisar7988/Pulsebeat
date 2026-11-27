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

const mockListeners = new Map<string, (event: any) => Promise<void> | void>();

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
    seekTo: jest.fn(async () => {}),
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

import TrackPlayer, { Event } from 'react-native-track-player';
import { useCurrentSongStore } from '../src/store/useCurrentSongStore';
import { initializePlayer } from '../src/service/player';
import { playbackService } from '../src/service/playbackService';
import { syncPlaybackWidget } from '../src/service/widgetSync';

const mockSyncPlaybackWidget = syncPlaybackWidget as jest.Mock;
const mockTrackPlayer = TrackPlayer as unknown as {
  setupPlayer: jest.Mock;
  pause: jest.Mock;
};

describe('audio interruption handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListeners.clear();
    useCurrentSongStore.getState().setIsPlaying(false);
  });

  test('initializePlayer enables autoHandleInterruptions', async () => {
    await initializePlayer();
    expect(mockTrackPlayer.setupPlayer).toHaveBeenCalledWith({
      autoHandleInterruptions: true,
    });
  });

  test('playbackService handles transient and permanent RemoteDuck events', async () => {
    await playbackService();
    const onRemoteDuck = mockListeners.get(Event.RemoteDuck);
    expect(onRemoteDuck).toBeDefined();

    // Transient interruption (e.g., incoming phone call)
    useCurrentSongStore.getState().setIsPlaying(true);
    await onRemoteDuck?.({ paused: true, permanent: false });
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);
    expect(mockTrackPlayer.pause).toHaveBeenCalledTimes(1);
    expect(mockSyncPlaybackWidget).toHaveBeenCalledTimes(1);

    // Interruption ended
    await onRemoteDuck?.({ paused: false, permanent: false });
    expect(mockSyncPlaybackWidget).toHaveBeenCalledTimes(2);

    // Permanent interruption (e.g., another media app or non-resumable interruption)
    useCurrentSongStore.getState().setIsPlaying(true);
    await onRemoteDuck?.({ paused: true, permanent: true });
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);
    expect(mockTrackPlayer.pause).toHaveBeenCalledTimes(2);
    expect(mockSyncPlaybackWidget).toHaveBeenCalledTimes(3);

    // PlaybackState Paused updates store & widget even in headless playbackService
    const onPlaybackState = mockListeners.get(Event.PlaybackState);
    useCurrentSongStore.getState().setIsPlaying(true);
    onPlaybackState?.({ state: 'paused' });
    expect(useCurrentSongStore.getState().isPlaying).toBe(false);
    expect(mockSyncPlaybackWidget).toHaveBeenCalledTimes(4);
  });
});
