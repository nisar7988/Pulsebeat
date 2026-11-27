import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../../../theme';
import { BaseSongCardProps, useSongCard } from '../../../hooks/useSongCard';
import { useDownloadStore } from '../../../store/useDownloadStore';

export type HorizontalSongCardProps = BaseSongCardProps;

export const HorizontalSongCard: React.FC<HorizontalSongCardProps> = React.memo(({
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
  const isDownloaded = useDownloadStore((state) =>
    Boolean(state.downloads[song.id]),
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePlay}
      className="w-36 mr-3.5"
    >
      <View
        className={`w-36 h-36 rounded-2xl overflow-hidden relative border bg-glass-tint ${
          isCurrentSong ? 'border-accent' : 'border-glass-border'
        }`}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : null}

        {isPlayingCurrent && (
          <View className="absolute inset-0 items-center justify-center bg-black/40">
            <Feather name="volume-2" size={24} color={theme.colors.accent.DEFAULT} />
          </View>
        )}

        {isDownloaded && (
          <View className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/65 border border-accent/60 items-center justify-center">
            <Feather name="check" size={12} color={theme.colors.accent.DEFAULT} />
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddToPlaylist}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 border border-white/20 items-center justify-center"
        >
          <Feather name="plus" size={14} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-accent items-center justify-center shadow-sm shadow-accent/50">
          <Feather
            name={isPlayingCurrent ? 'pause' : 'play'}
            size={14}
            color={theme.colors.text.dark}
            className={isPlayingCurrent ? '' : 'ml-0.5'}
          />
        </View>
      </View>

      <Text
        className={`text-sm font-bold mt-2 ${
          isCurrentSong ? 'text-accent' : 'text-white'
        }`}
        numberOfLines={1}
      >
        {songTitle}
      </Text>
      <Text className="text-xs text-white/60 mt-0.5" numberOfLines={1}>
        {artistName}
      </Text>
    </TouchableOpacity>
  );
});

export default HorizontalSongCard;