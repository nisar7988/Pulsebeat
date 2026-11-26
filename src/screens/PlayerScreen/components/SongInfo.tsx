import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';

export interface SongInfoProps {
  title: string;
  artist: string;
  bottomOffset?: number;
  onAddToPlaylist?: () => void;
}

export const SongInfo: React.FC<SongInfoProps> = ({
  title,
  artist,
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
  );
};

export default SongInfo;
