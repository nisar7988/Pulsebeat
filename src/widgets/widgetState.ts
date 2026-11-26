import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer, { RepeatMode, State } from 'react-native-track-player';
import type { ImageWidgetSource } from 'react-native-android-widget';
import { useCurrentSongStore } from '../store/useCurrentSongStore';
import { Song } from '../types/song';
import { getSongArtistName, getSongArtwork } from '../service/player';
import { isAppRunningInBackground } from '../service/lockScreen';
import {
  DEFAULT_WIDGET_THEME,
  getWidgetThemeForArtwork,
  type WidgetThemeColors,
} from '../theme/songPalette';

export interface WidgetPlaybackSnapshot {
  title: string;
  artist: string;
  artwork?: ImageWidgetSource;
  isPlaying: boolean;
  hasSong: boolean;
  position: number;
  duration: number;
  isShuffle: boolean;
  isRepeat: boolean;
  theme: WidgetThemeColors;
  fallbackSong: Song | null;
}

function toWidgetImageSource(uri?: string | null): ImageWidgetSource | undefined {
  if (!uri) return undefined;
  if (uri.startsWith('https:') || uri.startsWith('http:') || uri.startsWith('data:image')) {
    return uri as ImageWidgetSource;
  }
  return undefined;
}

/**
 * Reads the persisted current song from Zustand or directly from AsyncStorage
 * when running in a cold-start headless widget task before store hydration.
 */
export async function getPersistedCurrentSong(): Promise<Song | null> {
  const inMemory = useCurrentSongStore.getState().currentSong;
  if (inMemory) return inMemory;

  try {
    const raw = await AsyncStorage.getItem('song-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const persistedSong = parsed?.state?.currentSong as Song | null | undefined;
    if (persistedSong) {
      useCurrentSongStore.getState().setCurrentSong(persistedSong);
      return persistedSong;
    }
  } catch (e) {
    console.log('Widget persisted song read error:', e);
  }
  return null;
}

/**
 * Resolves the current track metadata, dynamic colors, progress, and playback state.
 */
export async function getWidgetPlaybackState(progressOverride?: {
  position: number;
  duration: number;
}): Promise<WidgetPlaybackSnapshot> {
  const [fallbackSong, appRunning] = await Promise.all([
    getPersistedCurrentSong(),
    isAppRunningInBackground(),
  ]);
  const storeState = useCurrentSongStore.getState();

  try {
    const [activeTrack, playbackState, progress, repeatMode] = await Promise.all([
      TrackPlayer.getActiveTrack().catch(() => undefined),
      TrackPlayer.getPlaybackState().catch(() => undefined),
      progressOverride
        ? Promise.resolve(progressOverride)
        : TrackPlayer.getProgress().catch(() => undefined),
      TrackPlayer.getRepeatMode().catch(() => undefined),
    ]);

    const isPlaying =
      appRunning &&
      (playbackState?.state === State.Playing ||
        playbackState?.state === State.Buffering);

    const isRepeat =
      repeatMode !== undefined ? repeatMode === RepeatMode.Track : storeState.isRepeat;

    const position = Math.max(0, progress?.position ?? 0);
    const duration = Math.max(
      0,
      progress?.duration || activeTrack?.duration || fallbackSong?.duration || 0,
    );

    if (activeTrack) {
      const artworkUrl =
        (activeTrack.artwork as string | undefined) ||
        (fallbackSong ? getSongArtwork(fallbackSong) : undefined);
      const theme = await getWidgetThemeForArtwork(artworkUrl);

      return {
        title: activeTrack.title || fallbackSong?.name || 'PulseBeat',
        artist:
          activeTrack.artist ||
          (fallbackSong ? getSongArtistName(fallbackSong) : 'Tap to play music'),
        artwork: toWidgetImageSource(artworkUrl),
        isPlaying,
        hasSong: true,
        position,
        duration,
        isShuffle: storeState.isShuffle,
        isRepeat,
        theme,
        fallbackSong,
      };
    }

    if (fallbackSong) {
      const artworkUrl = getSongArtwork(fallbackSong);
      const theme = await getWidgetThemeForArtwork(artworkUrl);

      return {
        title: fallbackSong.name || 'PulseBeat',
        artist: getSongArtistName(fallbackSong),
        artwork: toWidgetImageSource(artworkUrl),
        isPlaying: false,
        hasSong: true,
        position: 0,
        duration: fallbackSong.duration || 0,
        isShuffle: storeState.isShuffle,
        isRepeat,
        theme,
        fallbackSong,
      };
    }
  } catch (e) {
    console.log('Widget state resolution error:', e);
  }

  return {
    title: 'PulseBeat',
    artist: 'Tap to play music',
    artwork: undefined,
    isPlaying: false,
    hasSong: false,
    position: 0,
    duration: 0,
    isShuffle: storeState.isShuffle,
    isRepeat: storeState.isRepeat,
    theme: DEFAULT_WIDGET_THEME,
    fallbackSong: null,
  };
}
