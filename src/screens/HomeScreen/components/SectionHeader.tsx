import React from 'react';
import { View, Text } from 'react-native';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
}) => {
  return (
    <View className="px-5 pt-5 pb-2">
      {badge ? (
        <View className="self-start rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 mb-1">
          <Text className="text-[10px] font-bold tracking-wider text-accent uppercase">
            {badge}
          </Text>
        </View>
      ) : null}
      <Text className="text-xl font-bold tracking-tight text-white">{title}</Text>
      {subtitle ? (
        <Text className="text-xs text-white/60 mt-0.5">{subtitle}</Text>
      ) : null}
    </View>
  );
};

export default SectionHeader;
