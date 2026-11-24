import React from 'react';
import { View, Text } from 'react-native';

export interface SongInfoProps {
  title: string;
  artist: string;
  bottomOffset?: number;
}

export const SongInfo: React.FC<SongInfoProps> = ({
  title,
  artist,
  bottomOffset = 340 + 18,
}) => {
  return (
    <View className="absolute left-7 right-7" style={{ bottom: bottomOffset }}>
      <Text className="text-2xl font-bold text-text" numberOfLines={1}>
        {title}
      </Text>
      <Text className="mt-1 text-[15px] text-text-muted" numberOfLines={1}>
        {artist}
      </Text>
    </View>
  );
};

export default SongInfo;
