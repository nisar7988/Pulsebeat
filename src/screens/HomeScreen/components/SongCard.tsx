import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { BaseSongCardProps, useSongCard } from '../../../hooks/useSongCard';

export type SongCardProps = BaseSongCardProps;

export const SongCard: React.FC<SongCardProps> = React.memo(({
  song,
  onPlay,
}) => {
  const { isCurrentSong, isPlayingCurrent, imageUrl, artistName, handlePlay } =
    useSongCard({ song, onPlay });
const songName = song.name.length>10 ? song.name.slice(0,15) + "..." : song.name
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePlay}
      className='my-2 mx-4'
    >
      <View
        className={` w-full h-16 rounded-2xl overflow-hidden flex-row relative border bg-glass-tint items-center ${
          isCurrentSong ? 'border-accent' : 'border-glass-border'
        }`}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-[44] h-[44] mx-2 rounded-full" resizeMode="cover" />
        ) : null}

        <View className='flex-col'>
            <Text
        className={`text-md font-bold mt-2 ${
          isCurrentSong ? 'text-accent' : 'text-white'
        }`}
        numberOfLines={1}
      >
        {songName}
      </Text>
      <Text className="text-xs text-white/60 mt-0.5" numberOfLines={1}>
        {artistName}
      </Text>
        </View>

        <View className="absolute flex-row bottom-2 right-2 h-12 w-12 rounded-full bg-accent items-center justify-center shadow-sm shadow-accent/50">
          <Feather
            name={isPlayingCurrent ? 'pause' : 'play'}
            size={24}
            color={theme.colors.text.dark}
            className={isPlayingCurrent ? '' : 'ml-0.5'}
          />
        </View>
      </View>

   
    </TouchableOpacity>
  );
});

export default SongCard;