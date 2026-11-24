import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { Song } from '../../../types/song';
import { playSong } from '../../../service/player';
import { RootStackParamList } from '../../../navigation/types';

export interface HorizontalSongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
}

export const HorizontalSongCard: React.FC<HorizontalSongCardProps> = ({
  song,
  onPlay,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const imageUrl =
    song.image?.[2]?.url ||
    song.image?.[1]?.url ||
    song.image?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';

  const primaryArtist = song.artists?.primary?.[0];
  const artistName =
    primaryArtist?.name ||
    song.artists?.all?.[0]?.name ||
    'Unknown Artist';

  const handlePlay = async () => {
    try {
      if (onPlay) {
        onPlay(song);
      } else {
        await playSong(song);
      }
    } catch (e) {
      console.log('Play error:', e);
    }
    navigation.navigate('Player', { song });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePlay}
      className="w-36 mr-3.5"
    >
      <View className="w-36 h-36 rounded-2xl overflow-hidden relative border border-white/15 bg-white/10">
        <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
        <View className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-accent items-center justify-center">
          <Feather name="play" size={14} color="white" className="ml-0.5" />
        </View>
      </View>
      <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
        {song.name}
      </Text>
      <Text className="text-xs text-white/60 mt-0.5" numberOfLines={1}>
        {artistName}
      </Text>
    </TouchableOpacity>
  );
};

export default HorizontalSongCard;
