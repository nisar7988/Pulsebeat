import {
  Alert,
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
  type AddTrack,
  type Track,
} from 'react-native-track-player';
import { Song } from '../types/song';
import { useCurrentSongStore } from '../store/useCurrentSongStore';
import { useUserStore, AudioQuality } from '../store/useUserStore';
import { useListeningStore } from '../store/useListeningStore';
import { useDownloadStore } from '../store/useDownloadStore';
import { getSongDetails, getSongSuggestions } from './music';
import { syncPlaybackWidget } from './widgetSync';
import { decodeHtmlEntities, pickAudioUrlByQuality } from './audioUtils';
import { getLocalArtworkUri, getLocalAudioUri } from './download';

export { decodeHtmlEntities };

let isPlayerInitialized = false;
let isInitializing = false;
let playbackListenerRegistered = false;
let inFlightSongId: string | null = null;
let suggestionsInFlight: { songId: string; promise: Promise<void> } | null = null;
let optimisticPlayingLock: { value: boolean; expiresAt: number } | null = null;

function applyOptimisticPlaying(playing: boolean, lockMs = 650): void {
  optimisticPlayingLock = {
    value: playing,
    expiresAt: Date.now() + lockMs,
  };
  useCurrentSongStore.getState().setIsPlaying(playing);
}

async function syncPlayingFromNative(): Promise<void> {
  try {
    const { state } = await TrackPlayer.getPlaybackState();
    optimisticPlayingLock = null;
    useCurrentSongStore
      .getState()
      .setIsPlaying(state === State.Playing || state === State.Buffering);
  } catch {
    // Ignore native query errors
  }
}

const songCatalog = new Map<string, Song>();

function registerSongsInCatalog(songs: Song[]): void {
  for (const song of songs) {
    if (song?.id) {
      songCatalog.set(song.id, song);
    }
  }
}

function findSongById(id?: string | null): Song | undefined {
  if (!id) return undefined;
  const fromCatalog = songCatalog.get(id);
  if (fromCatalog) return fromCatalog;

  const { recentPlays, likedSongs } = useListeningStore.getState();
  return (
    recentPlays.find((s) => s.id === id) ||
    likedSongs.find((s) => s.id === id) ||
    useDownloadStore.getState().downloads[id]?.song
  );
}

function registerPlaybackStateSync() {
  if (playbackListenerRegistered) return;
  playbackListenerRegistered = true;
  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    const playing =
      event.state === State.Playing || event.state === State.Buffering;

    if (optimisticPlayingLock) {
      if (Date.now() < optimisticPlayingLock.expiresAt) {
        if (playing !== optimisticPlayingLock.value) {
          return;
        }
        optimisticPlayingLock = null;
      } else {
        optimisticPlayingLock = null;
      }
    }

    useCurrentSongStore.getState().setIsPlaying(playing);
    syncPlaybackWidget();
  });
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
    const nextId = event.track?.id;
    if (nextId) {
      const matched = findSongById(nextId);
      const currentId = useCurrentSongStore.getState().currentSong?.id;
      if (matched && matched.id !== currentId) {
        useCurrentSongStore.getState().setCurrentSong(matched);
        useListeningStore.getState().recordPlay(matched);
      }
    }
    syncPlaybackWidget();
  });

  if (Platform.OS === 'android' && NativeModules.AudioInterruptionModule) {
    const emitter = new NativeEventEmitter(NativeModules.AudioInterruptionModule);
    emitter.addListener('AudioInterruption', (event: { active?: boolean }) => {
      if (event?.active) {
        pauseSong().catch(() => {});
      }
    });
  }

  AppState.addEventListener('change', async () => {
    try {
      const interrupted =
        Platform.OS === 'android' &&
        NativeModules.AudioInterruptionModule?.isInterruptionActive
          ? await NativeModules.AudioInterruptionModule.isInterruptionActive()
          : false;
      if (interrupted) {
        await pauseSong();
        return;
      }
      await syncPlayingFromNative();
      syncPlaybackWidget();
    } catch {
      // Ignore state reconciliation errors
    }
  });
}

const playerOptions = {
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo,
  ],
  compactCapabilities: [Capability.Play, Capability.Pause],
  progressUpdateEventInterval: 2,
  android: {
    appKilledPlaybackBehavior: AppKilledPlaybackBehavior.PausePlayback,
    alwaysPauseOnInterruption: true,
  },
};

export const initializePlayer = async () => {
  if (isPlayerInitialized) return;
  if (isInitializing) return;

  isInitializing = true;
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    });
    await TrackPlayer.updateOptions(playerOptions);
    registerPlaybackStateSync();
    const repeatEnabled = useUserStore.getState().repeatByDefault;
    if (repeatEnabled) {
      await TrackPlayer.setRepeatMode(RepeatMode.Track);
      useCurrentSongStore.getState().setIsRepeat(true);
    }
    isPlayerInitialized = true;
  } catch (error: any) {
    if (
      error?.message?.includes('already been initialized') ||
      String(error).includes('already')
    ) {
      await TrackPlayer.updateOptions(playerOptions).catch(() => {});
      registerPlaybackStateSync();
      isPlayerInitialized = true;
    } else {
      console.log('Player initialization error:', error);
    }
  } finally {
    isInitializing = false;
  }
};

export const getSongTitle = (song?: Song | null): string => {
  if (!song?.name) return 'Unknown Track';
  return decodeHtmlEntities(song.name);
};

export const getSongArtistName = (song?: Song | null): string => {
  if (!song) return 'Unknown Artist';
  const primary = song.artists?.primary?.map((a) => decodeHtmlEntities(a.name)).filter(Boolean).join(', ');
  if (primary) return primary;
  const all = song.artists?.all?.map((a) => decodeHtmlEntities(a.name)).filter(Boolean).join(', ');
  if (all) return all;
  return 'Unknown Artist';
};

export const getSongArtwork = (song?: Song | null): string => {
  if (!song) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';
  }
  return (
    song.image?.[2]?.url ||
    song.image?.[1]?.url ||
    song.image?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'
  );
};

function toTrackItem(song: Song, quality: AudioQuality): AddTrack | null {
  const url =
    getLocalAudioUri(song.id) ||
    pickAudioUrlByQuality(song.downloadUrl || [], quality);
  if (!url) return null;
  const artwork = getLocalArtworkUri(song.id) || getSongArtwork(song);
  return {
    id: song.id,
    url,
    title: song.name,
    artist: getSongArtistName(song),
    artwork,
    duration: song.duration || undefined,
  };
}

/**
 * Fetches related songs for `seedSongId` and appends them to TrackPlayer's queue
 * so Next/Previous controls work seamlessly even after playing a single search result.
 */
async function appendRelatedTracks(seedSongId: string): Promise<void> {
  if (!seedSongId) return;
  if (suggestionsInFlight?.songId === seedSongId) {
    return suggestionsInFlight.promise;
  }

  const run = (async () => {
    try {
      const existingQueue = await TrackPlayer.getQueue().catch(() => []);
      const existingIds = new Set(
        existingQueue.map((t) => t.id).filter((id): id is string => Boolean(id)),
      );
      existingIds.add(seedSongId);

      let candidates: Song[] = [];
      try {
        const res = await getSongSuggestions(seedSongId);
        if (Array.isArray(res?.data)) {
          candidates = res.data;
        }
      } catch (err) {
        console.log('Suggestions fetch error:', err);
      }

      if (!candidates.length) {
        const { likedSongs, recentPlays } = useListeningStore.getState();
        candidates = [...likedSongs, ...recentPlays];
      }

      const uniqueSongs: Song[] = [];
      for (const s of candidates) {
        if (!s?.id || existingIds.has(s.id)) continue;
        existingIds.add(s.id);
        uniqueSongs.push(s);
      }

      if (!uniqueSongs.length) return;
      registerSongsInCatalog(uniqueSongs);

      const quality = useUserStore.getState().audioQuality;
      const tracksToAdd = uniqueSongs
        .map((s) => toTrackItem(s, quality))
        .filter((t): t is AddTrack => t !== null);

      if (tracksToAdd.length) {
        await TrackPlayer.add(tracksToAdd);
      }
    } catch (err) {
      console.log('appendRelatedTracks error:', err);
    } finally {
      if (suggestionsInFlight?.songId === seedSongId) {
        suggestionsInFlight = null;
      }
    }
  })();

  suggestionsInFlight = { songId: seedSongId, promise: run };
  return run;
}

export const playSong = async (song?: Song) => {
  const targetId = song?.id ?? useCurrentSongStore.getState().currentSong?.id;
  if (targetId && inFlightSongId === targetId) {
    return;
  }
  inFlightSongId = targetId ?? null;

  try {
    if (song) {
      registerSongsInCatalog([song]);
      useCurrentSongStore.getState().setCurrentSong(song);
    }
    const currentSong = song || useCurrentSongStore.getState().currentSong;
    if (!currentSong) return;
    registerSongsInCatalog([currentSong]);
    applyOptimisticPlaying(true, 1200);
    await initializePlayer();

    // If the selected song is already the active track in TrackPlayer, resume playback if paused
    const activeTrack = await TrackPlayer.getActiveTrack();
    if (activeTrack?.id === currentSong.id) {
      const playbackState = await TrackPlayer.getPlaybackState();
      if (playbackState.state !== State.Playing) {
        await TrackPlayer.play();
      }
      const queue = await TrackPlayer.getQueue().catch(() => []);
      if (queue.length <= 1 && useUserStore.getState().autoPlay) {
        appendRelatedTracks(currentSong.id).catch(() => {});
      }
      return;
    }

    const artistName = getSongArtistName(currentSong);
    const quality = useUserStore.getState().audioQuality;
    const downloadUrls = currentSong.downloadUrl || [];
    let audioUrl =
      getLocalAudioUri(currentSong.id) ||
      pickAudioUrlByQuality(downloadUrls, quality);

    // Fallback: fetch song details if downloadUrl is missing or empty
    if (!audioUrl && currentSong.id) {
      try {
        const data = await getSongDetails(currentSong.id);
        const songDetail = data?.data?.[0];
        if (songDetail?.downloadUrl?.length) {
          audioUrl = pickAudioUrlByQuality(songDetail.downloadUrl, quality);
        }
      } catch (err) {
        console.log('Error fetching audioUrl fallback:', err);
      }
    }

    const artwork = getLocalArtworkUri(currentSong.id) || getSongArtwork(currentSong);

    if (audioUrl) {
      await TrackPlayer.reset();

      await TrackPlayer.add({
        id: currentSong.id,
        url: audioUrl,
        title: getSongTitle(currentSong),
        artist: artistName,
        artwork: artwork,
        duration: currentSong.duration || undefined,
      });

      await TrackPlayer.play();
      useListeningStore.getState().recordPlay(currentSong);
      if (useUserStore.getState().autoPlay) {
        appendRelatedTracks(currentSong.id).catch(() => {});
      }
    } else {
      // Stop previous track so it does not keep playing in the background
      applyOptimisticPlaying(false, 500);
      await TrackPlayer.stop();
      Alert.alert(
        'Track Unavailable',
        `Unable to stream "${getSongTitle(currentSong)}" right now. Please try another song.`,
      );
      console.log('No playable audio URL found for song:', currentSong.id);
    }
  } catch (err) {
    console.log('Error in playSong:', err);
    await syncPlayingFromNative();
  } finally {
    if (inFlightSongId === targetId) {
      inFlightSongId = null;
    }
  }
};

/**
 * Navigates to the Player screen immediately and defers store/native playback
 * until the transition animation finishes so navigation stays responsive.
 */
export const navigateAndPlaySong = (navigation: any, song: Song) => {
  registerSongsInCatalog([song]);
  useCurrentSongStore.getState().setCurrentSong(song);
  applyOptimisticPlaying(true, 1200);

  const parent = navigation.getParent?.();
  if (parent) {
    parent.navigate('Player', { song });
  } else {
    navigation.navigate('Player', { song });
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      playSong(song).catch((err) => {
        console.log('Error playing song:', err);
      });
    }, 50);
  });
};

/**
 * Loads a list of songs into TrackPlayer and navigates to PlayerScreen.
 */
export const playQueueAndNavigate = (
  navigation: any,
  songs: Song[],
  startIndex = 0,
) => {
  if (!songs.length) return;
  registerSongsInCatalog(songs);
  const safeIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
  const targetSong = songs[safeIndex];

  useCurrentSongStore.getState().setCurrentSong(targetSong);
  applyOptimisticPlaying(true, 1200);

  const parent = navigation.getParent?.();
  if (parent) {
    parent.navigate('Player', { song: targetSong });
  } else {
    navigation.navigate('Player', { song: targetSong });
  }

  requestAnimationFrame(() => {
    setTimeout(async () => {
      try {
        await initializePlayer();
        const quality = useUserStore.getState().audioQuality;
        const tracks = songs
          .map((s) => toTrackItem(s, quality))
          .filter((t): t is AddTrack => t !== null);

        if (!tracks.length) {
          await playSong(targetSong);
          return;
        }

        await TrackPlayer.reset();
        await TrackPlayer.add(tracks);
        const targetTrackIdx = tracks.findIndex((t) => t.id === targetSong.id);
        if (targetTrackIdx > 0) {
          await TrackPlayer.skip(targetTrackIdx);
        }
        await TrackPlayer.play();
        useListeningStore.getState().recordPlay(targetSong);
      } catch (err) {
        console.log('Error playing queue:', err);
        await syncPlayingFromNative();
      }
    }, 50);
  });
};

export const pauseSong = async () => {
  applyOptimisticPlaying(false);
  try {
    await initializePlayer();
    await TrackPlayer.pause();
    syncPlaybackWidget();
  } catch (e) {
    console.log('Pause error:', e);
    await syncPlayingFromNative();
  }
};

export const resumeSong = async () => {
  applyOptimisticPlaying(true);
  try {
    await initializePlayer();
    await TrackPlayer.play();
    syncPlaybackWidget();
  } catch (e) {
    console.log('Resume error:', e);
    await syncPlayingFromNative();
  }
};

export const stopSong = async () => {
  applyOptimisticPlaying(false);
  try {
    await initializePlayer();
    await TrackPlayer.stop();
    syncPlaybackWidget();
  } catch (e) {
    console.log('Stop error:', e);
    await syncPlayingFromNative();
  }
};

export const skipToNextSong = async () => {
  try {
    await initializePlayer();
    const isShuffle = useCurrentSongStore.getState().isShuffle;
    let queue = await TrackPlayer.getQueue();
    let activeIdx = await TrackPlayer.getActiveTrackIndex();
    const activeTrack = await TrackPlayer.getActiveTrack();

    const needsMoreTracks =
      queue.length <= 1 ||
      activeIdx === undefined ||
      activeIdx >= queue.length - 1;

    if (needsMoreTracks) {
      const seedId =
        activeTrack?.id || useCurrentSongStore.getState().currentSong?.id;
      if (seedId) {
        await appendRelatedTracks(seedId);
        queue = await TrackPlayer.getQueue();
        activeIdx = await TrackPlayer.getActiveTrackIndex();
      }
    }

    if (queue.length <= 1) return;

    if (isShuffle) {
      let nextIdx = Math.floor(Math.random() * queue.length);
      if (nextIdx === activeIdx) {
        nextIdx = (nextIdx + 1) % queue.length;
      }
      const nextTrack = queue[nextIdx];
      if (nextTrack) {
        useCurrentSongStore.getState().setCurrentSong(trackToSong(nextTrack));
      }
      applyOptimisticPlaying(true, 900);
      await TrackPlayer.skip(nextIdx);
      await TrackPlayer.play();
      syncPlaybackWidget();
      return;
    }

    if (activeIdx !== undefined && activeIdx < queue.length - 1) {
      const nextTrack = queue[activeIdx + 1];
      if (nextTrack) {
        useCurrentSongStore.getState().setCurrentSong(trackToSong(nextTrack));
      }
      applyOptimisticPlaying(true, 900);
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
      syncPlaybackWidget();
    }
  } catch (e) {
    console.log('Skip next error:', e);
  }
};

export const skipToPreviousSong = async () => {
  try {
    await initializePlayer();
    const [queue, activeIdx, activeTrack, progress] = await Promise.all([
      TrackPlayer.getQueue(),
      TrackPlayer.getActiveTrackIndex(),
      TrackPlayer.getActiveTrack(),
      TrackPlayer.getProgress().catch(() => ({ position: 0, duration: 0 })),
    ]);

    if (progress.position > 4) {
      await TrackPlayer.seekTo(0);
      syncPlaybackWidget();
      return;
    }

    if (activeIdx !== undefined && activeIdx > 0 && queue.length > 1) {
      const prevTrack = queue[activeIdx - 1];
      if (prevTrack) {
        useCurrentSongStore.getState().setCurrentSong(trackToSong(prevTrack));
      }
      applyOptimisticPlaying(true, 900);
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
      syncPlaybackWidget();
      return;
    }

    const recentPlays = useListeningStore.getState().recentPlays;
    const prevSong = recentPlays.find((s) => s.id && s.id !== activeTrack?.id);
    if (prevSong) {
      await playSong(prevSong);
    } else {
      await TrackPlayer.seekTo(0);
    }
    syncPlaybackWidget();
  } catch (e) {
    console.log('Skip prev error:', e);
  }
};

export const seekTo = async (position: number) => {
  try {
    await initializePlayer();
    await TrackPlayer.seekTo(position);
    syncPlaybackWidget();
  } catch (e) {
    console.log('Seek error:', e);
  }
};

export const seekBy = async (offset: number) => {
  try {
    await initializePlayer();
    const progress =
      typeof TrackPlayer.getProgress === 'function'
        ? await TrackPlayer.getProgress().catch(() => ({
            position: 0,
            duration: 0,
          }))
        : { position: 0, duration: 0 };
    const rawTarget = progress.position + offset;
    const target =
      progress.duration > 0
        ? Math.max(0, Math.min(progress.duration, rawTarget))
        : Math.max(0, rawTarget);
    await TrackPlayer.seekTo(target);
    syncPlaybackWidget();
  } catch (e) {
    console.log('Seek by error:', e);
  }
};

export const toggleShuffleMode = async (): Promise<boolean> => {
  const next = !useCurrentSongStore.getState().isShuffle;
  useCurrentSongStore.getState().setIsShuffle(next);
  syncPlaybackWidget();
  return next;
};

export const toggleRepeatMode = async (): Promise<boolean> => {
  const prevEnabled = useCurrentSongStore.getState().isRepeat;
  const nextEnabled = !prevEnabled;
  useCurrentSongStore.getState().setIsRepeat(nextEnabled);
  try {
    await initializePlayer();
    await TrackPlayer.setRepeatMode(
      nextEnabled ? RepeatMode.Track : RepeatMode.Off,
    );
    syncPlaybackWidget();
    return nextEnabled;
  } catch (e) {
    console.log('Toggle repeat error:', e);
    useCurrentSongStore.getState().setIsRepeat(prevEnabled);
    return prevEnabled;
  }
};

function trackToSong(track: Track): Song {
  const matched = findSongById(track.id);
  if (matched) return matched;
  return {
    id: String(track.id || track.url || Math.random()),
    name: String(track.title || 'Unknown Track'),
    artists: {
      primary: [{ id: '', name: String(track.artist || 'Unknown Artist'), url: '' }],
      featured: [],
      all: [{ id: '', name: String(track.artist || 'Unknown Artist'), url: '' }],
    },
    image: track.artwork
      ? [{ quality: '500x500', url: String(track.artwork) }]
      : [],
    album: { id: '', name: String(track.album || ''), url: '' },
    downloadUrl: track.url ? [{ quality: '320kbps', url: String(track.url) }] : [],
    copyright: '',
    duration: Number(track.duration) || 0,
    explicitContent: false,
    hasLyrics: false,
    label: '',
    language: '',
    lyricsId: null,
    playCount: 0,
    releaseDate: null,
    type: 'song',
    url: '',
    year: '',
  };
}

export const getQueueSongs = async (): Promise<{
  songs: Song[];
  activeIndex: number;
}> => {
  try {
    await initializePlayer();
    const [queue, activeIdx] = await Promise.all([
      TrackPlayer.getQueue(),
      TrackPlayer.getActiveTrackIndex(),
    ]);
    return {
      songs: queue.map(trackToSong),
      activeIndex: typeof activeIdx === 'number' ? activeIdx : -1,
    };
  } catch (e) {
    console.log('getQueueSongs error:', e);
    return { songs: [], activeIndex: -1 };
  }
};

export const skipToQueueIndex = async (index: number): Promise<void> => {
  try {
    await initializePlayer();
    const queue = await TrackPlayer.getQueue().catch(() => []);
    const targetTrack = queue[index];
    if (targetTrack) {
      useCurrentSongStore.getState().setCurrentSong(trackToSong(targetTrack));
    }
    applyOptimisticPlaying(true, 900);
    await TrackPlayer.skip(index);
    await TrackPlayer.play();
    syncPlaybackWidget();
  } catch (e) {
    console.log('skipToQueueIndex error:', e);
  }
};

export const removeFromQueue = async (index: number): Promise<void> => {
  try {
    await initializePlayer();
    await TrackPlayer.remove(index);
    syncPlaybackWidget();
  } catch (e) {
    console.log('removeFromQueue error:', e);
  }
};
