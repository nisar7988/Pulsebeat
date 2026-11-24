import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';

export interface PlayerHeaderProps {
  title?: string;
  onBack: () => void;
  onRightPress?: () => void;
  rightIconName?: string;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  title = 'Now Playing',
  onBack,
  onRightPress,
  rightIconName = 'bell',
}) => {
  return (
    <View className="absolute top-[55px] left-5 right-5 z-10 flex-row items-center justify-between">
      <TouchableOpacity
        className="h-11 w-11 items-center justify-center rounded-full border border-glass-border-light bg-glass-tint"
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Feather name="chevron-left" size={24} color={theme.colors.text.DEFAULT} />
      </TouchableOpacity>
      <Text className="text-lg font-semibold tracking-wide text-text">{title}</Text>
      <TouchableOpacity
        className="h-11 w-11 items-center justify-center rounded-full border border-glass-border-light bg-glass-tint"
        onPress={onRightPress}
        activeOpacity={0.7}
      >
        <Feather name={rightIconName} size={19} color={theme.colors.text.DEFAULT} />
      </TouchableOpacity>
    </View>
  );
};

export default PlayerHeader;
