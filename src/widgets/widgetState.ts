import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer, { State } from 'react-native-track-player';
import type { ImageWidgetSource } from 'react-native-android-widget';
import { useCurrentSongStore } from '../store/useCurrentSongStore';
import { Song } from '../types/song';
import { getSongArtistName, getSongArtwork } from '../service/player';

export interface WidgetPlaybackSnapshot {
  title: string;
  artist: string;
  artwork?: ImageWidgetSource;
  isPlaying: boolean;
  hasSong: boolean;
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
 * Resolves the current track metadata and playback state for the Android widget.
 */
export async function getWidgetPlaybackState(): Promise<WidgetPlaybackSnapshot> {
  const fallbackSong = await getPersistedCurrentSong();

  try {
    const [activeTrack, playbackState] = await Promise.all([
      TrackPlayer.getActiveTrack().catch(() => undefined),
      TrackPlayer.getPlaybackState().catch(() => undefined),
    ]);

    const isPlaying =
      playbackState?.state === State.Playing ||
      playbackState?.state === State.Buffering;

    if (activeTrack) {
      return {
        title: activeTrack.title || fallbackSong?.name || 'PulseBeat',
        artist:
          activeTrack.artist ||
          (fallbackSong ? getSongArtistName(fallbackSong) : 'Tap to play music'),
        artwork: toWidgetImageSource(
          (activeTrack.artwork as string | undefined) ||
            (fallbackSong ? getSongArtwork(fallbackSong) : undefined),
        ),
        isPlaying,
        hasSong: true,
        fallbackSong,
      };
    }

    if (fallbackSong) {
      return {
        title: fallbackSong.name || 'PulseBeat',
        artist: getSongArtistName(fallbackSong),
        artwork: toWidgetImageSource(getSongArtwork(fallbackSong)),
        isPlaying: false,
        hasSong: true,
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
    fallbackSong: null,
  };
}
