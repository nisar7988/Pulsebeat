import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <View className="rounded-3xl border border-glass-border bg-glass-tint px-8 py-6">
        <Text className="text-xl font-bold text-text">Profile</Text>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
