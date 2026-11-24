import TrackPlayer, { Capability } from 'react-native-track-player';
import type { Song } from '../types/song';

let isPlayerInitialized = false;
let isInitializing = false;

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
    isPlayerInitialized = true;
  } catch (error: any) {
    if (
      error?.message?.includes('already been initialized') ||
      String(error).includes('already')
    ) {
      isPlayerInitialized = true;
    } else {
      console.log('Player initialization error:', error);
    }
  } finally {
    isInitializing = false;
  }
};

export const playSong = async (song: Song) => {
  try {
    await initializePlayer();

    const primaryArtists = song.artists?.primary?.map(artist => artist.name).join(', ');
    const allArtists = song.artists?.all?.map(artist => artist.name).join(', ');
    const artistName = primaryArtists || allArtists || 'Unknown Artist';

    const downloadUrls = song.downloadUrl || [];
    const audioUrl = downloadUrls[downloadUrls.length - 1]?.url || downloadUrls[0]?.url;

    const artwork = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;

    if (audioUrl) {
      await TrackPlayer.reset();

      await TrackPlayer.add({
        id: song.id,
        url: audioUrl,
        title: song.name,
        artist: artistName,
        artwork: artwork,
      });

      await TrackPlayer.play();
    }
  } catch (err) {
    console.log('Error in playSong:', err);
  }
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
