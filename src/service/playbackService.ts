import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmitterSubscription } from 'react-native';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import {
  pauseSong,
  playSong,
  resumeSong,
  seekBy,
  seekTo,
  skipToNextSong,
  skipToPreviousSong,
  skipToQueueIndex,
  stopSong,
} from './player';
import { syncPlaybackWidget, syncWidgetProgress } from './widgetSync';
import { useCurrentSongStore } from '../store/useCurrentSongStore';
import type { Song } from '../types/song';

const DEFAULT_JUMP_INTERVAL_SECONDS = 10;
const activeSubscriptions: EmitterSubscription[] = [];

function clearSubscriptions(): void {
  while (activeSubscriptions.length > 0) {
    activeSubscriptions.pop()?.remove?.();
  }
}

async function getFallbackSong(): Promise<Song | null> {
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
  } catch {
    // Ignore storage read errors in background service
  }
  return null;
}

export const playbackService = async () => {
  clearSubscriptions();

  activeSubscriptions.push(
    TrackPlayer.addEventListener(Event.RemotePlay, async () => {
      const activeTrack = await TrackPlayer.getActiveTrack().catch(
        () => undefined,
      );
      if (!activeTrack) {
        const fallbackSong = await getFallbackSong();
        if (fallbackSong) {
          await playSong(fallbackSong);
          return;
        }
      }
      await resumeSong();
    }),
    TrackPlayer.addEventListener(Event.RemotePause, async () => {
      await pauseSong();
    }),
    TrackPlayer.addEventListener(Event.RemoteStop, async () => {
      await stopSong();
    }),
    TrackPlayer.addEventListener(Event.RemoteNext, async () => {
      await skipToNextSong();
    }),
    TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
      await skipToPreviousSong();
    }),
    TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
      await seekTo(event.position);
    }),
    TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
      const interval =
        typeof event?.interval === 'number' && event.interval > 0
          ? event.interval
          : DEFAULT_JUMP_INTERVAL_SECONDS;
      await seekBy(interval);
    }),
    TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
      const interval =
        typeof event?.interval === 'number' && event.interval > 0
          ? event.interval
          : DEFAULT_JUMP_INTERVAL_SECONDS;
      await seekBy(-interval);
    }),
    TrackPlayer.addEventListener(Event.RemoteSkip, async (event) => {
      if (typeof event?.index === 'number') {
        await skipToQueueIndex(event.index);
      }
    }),
    TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
      if (event.permanent || event.paused) {
        useCurrentSongStore.getState().setIsPlaying(false);
        await TrackPlayer.pause().catch(() => {});
        syncPlaybackWidget();
      } else {
        syncPlaybackWidget();
      }
    }),
    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
      syncWidgetProgress(event.position, event.duration);
    }),
    TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
      if (
        event.state === State.Paused ||
        event.state === State.Stopped ||
        event.state === State.Ended ||
        event.state === State.None
      ) {
        useCurrentSongStore.getState().setIsPlaying(false);
      }
      syncPlaybackWidget();
    }),
    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, () => {
      syncPlaybackWidget();
    }),
  );
};
