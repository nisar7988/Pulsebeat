import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Song } from '../types/song';
import {
  getSongArtistName,
  getSongArtwork,
  navigateAndPlaySong,
} from '../service/player';
import { RootStackParamList } from '../navigation/types';
import { useCurrentSongStore, useListeningStore } from '../store';

export interface BaseSongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
}

export function useSongCard({ song, onPlay }: BaseSongCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const isCurrentSong = useCurrentSongStore(
    (state) => state.currentSong?.id === song.id,
  );
  const isPlaying = useCurrentSongStore((state) => state.isPlaying);
  const isPlayingCurrent = isCurrentSong && isPlaying;
  const imageUrl = getSongArtwork(song);
  const artistName = getSongArtistName(song);

  const handlePlay = useCallback(() => {
    if (onPlay) {
      onPlay(song);
      return;
    }
    navigateAndPlaySong(navigation, song);
  }, [navigation, onPlay, song]);

  const handleAddToPlaylist = useCallback(() => {
    useListeningStore.getState().openPlaylistModal(song);
  }, [song]);

  return {
    isCurrentSong,
    isPlayingCurrent,
    imageUrl,
    artistName,
    handlePlay,
    handleAddToPlaylist,
  };
}
