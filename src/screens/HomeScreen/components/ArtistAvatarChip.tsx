import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export interface ArtistAvatarChipProps {
  name: string;
  avatar?: string;
  isSelected?: boolean;
  onPress: () => void;
}

export const ArtistAvatarChip: React.FC<ArtistAvatarChipProps> = ({
  name,
  avatar,
  isSelected,
  onPress,
}) => {
  const fallbackAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="items-center mr-4 w-16"
    >
      <View
        className={`w-16 h-16 rounded-full p-0.5 border-2 ${
          isSelected ? 'border-accent' : 'border-white/20'
        }`}
      >
        <Image
          source={{ uri: avatar || fallbackAvatar }}
          className="w-full h-full rounded-full"
        />
      </View>
      <Text
        className={`text-xs text-center mt-1.5 ${
          isSelected ? 'text-accent font-bold' : 'text-white/80 font-medium'
        }`}
        numberOfLines={1}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default ArtistAvatarChip;
