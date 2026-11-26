import TrackPlayer, { Capability, Event, State } from 'react-native-track-player';
import { Song } from '../types/song';
import { useCurrentSongStore } from '../store/useCurrentSongStore';

let isPlayerInitialized = false;
let isInitializing = false;
let playbackListenerRegistered = false;
let inFlightSongId: string | null = null;

function registerPlaybackStateSync() {
  if (playbackListenerRegistered) return;
  playbackListenerRegistered = true;
  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    const playing =
      event.state === State.Playing || event.state === State.Buffering;
    useCurrentSongStore.getState().setIsPlaying(playing);
  });
}

export const initializePlayer = async () => {
  if (isPlayerInitialized) return;
  if (isInitializing) return;

  isInitializing = true;
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause],
    });
    registerPlaybackStateSync();
    isPlayerInitialized = true;
  } catch (error: any) {
    if (
      error?.message?.includes('already been initialized') ||
      String(error).includes('already')
    ) {
      registerPlaybackStateSync();
      isPlayerInitialized = true;
    } else {
      console.log('Player initialization error:', error);
    }
  } finally {
    isInitializing = false;
  }
};

export const getSongArtistName = (song?: Song | null): string => {
  if (!song) return 'Unknown Artist';
  const primary = song.artists?.primary?.map((a) => a.name).join(', ');
  if (primary) return primary;
  const all = song.artists?.all?.map((a) => a.name).join(', ');
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

export const playSong = async (song?: Song) => {
  const targetId = song?.id ?? useCurrentSongStore.getState().currentSong?.id;
  if (targetId && inFlightSongId === targetId) {
    return;
  }
  inFlightSongId = targetId ?? null;

  try {
    if (song) {
      useCurrentSongStore.getState().setCurrentSong(song);
    }
    const currentSong = song || useCurrentSongStore.getState().currentSong;
    if (!currentSong) return;
    await initializePlayer();

    // If the selected song is already the active track in TrackPlayer, resume playback if paused
    const activeTrack = await TrackPlayer.getActiveTrack();
    if (activeTrack?.id === currentSong.id) {
      const playbackState = await TrackPlayer.getPlaybackState();
      if (playbackState.state !== State.Playing) {
        await TrackPlayer.play();
      }
      return;
    }

    const artistName = getSongArtistName(currentSong);
    const downloadUrls = currentSong.downloadUrl || [];
    let audioUrl = downloadUrls[downloadUrls.length - 1]?.url || downloadUrls[0]?.url;

    // Fallback: fetch song details if downloadUrl is missing or empty
    if (!audioUrl && currentSong.id) {
      try {
        const res = await fetch(
          `https://saavn.bycomsolutions.com/api/songs/${encodeURIComponent(currentSong.id)}`,
        );
        const data = await res.json();
        const songDetail = data?.data?.[0];
        if (songDetail?.downloadUrl?.length) {
          const detailUrls = songDetail.downloadUrl;
          audioUrl = detailUrls[detailUrls.length - 1]?.url || detailUrls[0]?.url;
        }
      } catch (err) {
        console.log('Error fetching audioUrl fallback:', err);
      }
    }

    const artwork = getSongArtwork(currentSong);

    if (audioUrl) {
      await TrackPlayer.reset();

      await TrackPlayer.add({
        id: currentSong.id,
        url: audioUrl,
        title: currentSong.name,
        artist: artistName,
        artwork: artwork,
      });

      await TrackPlayer.play();
    } else {
      // Stop previous track so it does not keep playing in the background
      await TrackPlayer.stop();
      console.log('No playable audio URL found for song:', currentSong.id);
    }
  } catch (err) {
    console.log('Error in playSong:', err);
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
  const parent = navigation.getParent?.();
  if (parent) {
    parent.navigate('Player', { song });
  } else {
    navigation.navigate('Player', { song });
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      useCurrentSongStore.getState().setCurrentSong(song);
      playSong(song).catch((err) => {
        console.log('Error playing song:', err);
      });
    }, 50);
  });
};

export const pauseSong = async () => {
  try {
    await initializePlayer();
    await TrackPlayer.pause();
  } catch (e) {
    console.log('Pause error:', e);
  }
};

export const resumeSong = async () => {
  try {
    await initializePlayer();
    await TrackPlayer.play();
  } catch (e) {
    console.log('Resume error:', e);
  }
};

export const stopSong = async () => {
  try {
    await initializePlayer();
    await TrackPlayer.stop();
  } catch (e) {
    console.log('Stop error:', e);
  }
};

export const skipToNextSong = async () => {
  try {
    await initializePlayer();
    await TrackPlayer.skipToNext();
  } catch (e) {
    console.log('Skip next error:', e);
  }
};

export const skipToPreviousSong = async () => {
  try {
    await initializePlayer();
    await TrackPlayer.skipToPrevious();
  } catch (e) {
    console.log('Skip prev error:', e);
  }
};

export const seekTo = async (position: number) => {
  try {
    await initializePlayer();
    await TrackPlayer.seekTo(position);
  } catch (e) {
    console.log('Seek error:', e);
  }
};
