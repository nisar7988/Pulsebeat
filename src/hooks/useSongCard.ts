import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useActiveTrack, useIsPlaying } from 'react-native-track-player';
import { Song } from '../types/song';
import { playSong, getSongArtistName, getSongArtwork } from '../service/player';
import { RootStackParamList } from '../navigation/types';
import { useCurrentSongStore } from '../store';

export interface BaseSongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
}

export function useSongCard({ song, onPlay }: BaseSongCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const activeTrack = useActiveTrack();
  const { playing } = useIsPlaying();
  const currentSong = useCurrentSongStore((state) => state.currentSong);

  const isCurrentSong = activeTrack?.id === song.id || currentSong?.id === song.id;
  const isPlayingCurrent = isCurrentSong && playing;
  const imageUrl = getSongArtwork(song);
  const artistName = getSongArtistName(song);

  const handlePlay = () => {
    // 1. If custom onPlay provided, delegate completely to avoid duplicate navigation/state updates
    if (onPlay) {
      onPlay(song);
      return;
    }

    // 2. Otherwise immediately navigate to Player screen
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    if (parent) {
      parent.navigate('Player', { song });
    } else {
      (navigation as any).navigate('Player', { song });
    }

    // 3. Play song asynchronously without blocking UI transition
    useCurrentSongStore.getState().setCurrentSong(song);
    playSong(song).catch((error) => {
      console.log('Error playing song:', error);
    });
  };

  return {
    isCurrentSong,
    isPlayingCurrent,
    imageUrl,
    artistName,
    handlePlay,
  };
}