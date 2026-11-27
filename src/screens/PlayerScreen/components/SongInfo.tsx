import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { Song } from '../../../types/song';
import DownloadButton from '../../../components/ui/DownloadButton';

export interface SongInfoProps {
  title: string;
  artist: string;
  song?: Song | null;
  accentColor?: string;
  bottomOffset?: number;
  onAddToPlaylist?: () => void;
}

export const SongInfo: React.FC<SongInfoProps> = ({
  title,
  artist,
  song,
  accentColor,
  bottomOffset = 340 + 18,
  onAddToPlaylist,
}) => {
  return (
    <View
      className="absolute left-7 right-7 flex-row items-center justify-between gap-3"
      style={{ bottom: bottomOffset }}
    >
      <View className="flex-1">
        <Text className="text-2xl font-bold text-text" numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-1 text-[15px] text-text-muted" numberOfLines={1}>
          {artist}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {song && (
          <DownloadButton
            song={song}
            size="lg"
            accentColor={accentColor}
          />
        )}

        {onAddToPlaylist && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAddToPlaylist}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-10 w-10 rounded-full border border-glass-border-light bg-glass-tint items-center justify-center"
          >
            <Feather name="plus" size={19} color={theme.colors.text.DEFAULT} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SongInfo;
