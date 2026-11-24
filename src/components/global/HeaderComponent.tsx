import React from 'react';
import { Text, View } from 'react-native';

export interface HeaderComponentProps {
  title?: string;
}

export default function HeaderComponent({ title = 'Header' }: HeaderComponentProps) {
  return (
    <View className="px-4 py-3">
      <Text className="text-xl font-bold text-text">{title}</Text>
    </View>
  );
}
