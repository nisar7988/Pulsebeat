import TrackPlayer from 'react-native-track-player';
import type { Song } from '../types/song';

let isPlayerInitialized = false;

export const initializePlayer = async () => {
  if (isPlayerInitialized) return;

  try {
    await TrackPlayer.setupPlayer();
    isPlayerInitialized = true;
  } catch (error) {
    // Avoid re-initializing if the player was already initialized
    // externally or by another initialization call.
    console.log('Player initialization:', error);
  }
};

export const playSong = async (song: Song) => {
  await initializePlayer();

  await TrackPlayer.reset();

  const primaryArtists = song.artists?.primary?.map(artist => artist.name).join(', ');
  const allArtists = song.artists?.all?.map(artist => artist.name).join(', ');
  const artistName = primaryArtists || allArtists || 'Unknown Artist';

  const downloadUrls = song.downloadUrl || [];
  const audioUrl = downloadUrls[downloadUrls.length - 1]?.url || downloadUrls[0]?.url;

  const artwork = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;

  if (audioUrl) {
    await TrackPlayer.add({
      id: song.id,
      url: audioUrl,
      title: song.name,
      artist: artistName,
      artwork: artwork,
    });

    await TrackPlayer.play();
  }
};

export const pauseSong = async () => {
  await initializePlayer();
  await TrackPlayer.pause();
};

export const resumeSong = async () => {
  await initializePlayer();
  await TrackPlayer.play();
};

export const stopSong = async () => {
  await initializePlayer();
  await TrackPlayer.stop();
};

export const skipToNextSong = async () => {
  await initializePlayer();
  await TrackPlayer.skipToNext();
};

export const skipToPreviousSong = async () => {
  await initializePlayer();
  await TrackPlayer.skipToPrevious();
};

export const seekTo = async (position: number) => {
  await initializePlayer();
  await TrackPlayer.seekTo(position);
};
