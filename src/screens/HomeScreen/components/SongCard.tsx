import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../../../theme';
import { BaseSongCardProps, useSongCard } from '../../../hooks/useSongCard';
import DownloadButton from '../../../components/ui/DownloadButton';

export type SongCardProps = BaseSongCardProps;

export const SongCard: React.FC<SongCardProps> = React.memo(({
  song,
  onPlay,
}) => {
  const { theme } = useAppTheme();
  const {
    isCurrentSong,
    isPlayingCurrent,
    imageUrl,
    songTitle,
    artistName,
    handlePlay,
    handleAddToPlaylist,
  } = useSongCard({ song, onPlay });
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

        <View className='flex-col flex-1 pr-[152px]'>
            <Text
        className={`text-md font-bold mt-2 ${
          isCurrentSong ? 'text-accent' : 'text-white'
        }`}
        numberOfLines={1}
      >
        {songTitle}
      </Text>
      <Text className="text-xs text-white/60 mt-0.5" numberOfLines={1}>
        {artistName}
      </Text>
        </View>

        <DownloadButton
          song={song}
          size="md"
          className="absolute right-[106px] bg-white/10 border-glass-border"
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddToPlaylist}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="absolute right-16 h-9 w-9 rounded-full border border-glass-border bg-white/10 items-center justify-center"
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
        </TouchableOpacity>

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