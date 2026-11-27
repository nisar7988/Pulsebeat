import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../../../theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actionLabel,
  onActionPress,
}) => {
  const { theme } = useAppTheme();
  return (
    <View className="px-5 pt-5 pb-2 flex-row items-end justify-between gap-3">
      <View className="flex-1">
        {badge ? (
          <View className="self-start rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 mb-1">
            <Text className="text-[10px] font-bold tracking-wider text-accent uppercase">
              {badge}
            </Text>
          </View>
        ) : null}
        <Text className="text-xl font-bold tracking-tight text-white" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-white/60 mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onActionPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="flex-row items-center gap-0.5 pb-0.5"
        >
          <Text className="text-xs font-bold text-accent">{actionLabel}</Text>
          <Feather name="chevron-right" size={14} color={theme.colors.accent.DEFAULT} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default SectionHeader;
