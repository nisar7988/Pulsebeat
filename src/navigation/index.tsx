import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppTabs from './Tabs';
import type { RootStackParamList } from './types';
import PlayerScreen from '../screens/PlayerScreen';
import OnboardingScreen from '../screens/onboarding';
import ArtistsScreen from '../screens/ArtistsScreen';
import ArtistSongsScreen from '../screens/ArtistSongsScreen';
import DeveloperScreen from '../screens/DeveloperScreen';
import { useUserStore } from '../store';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const hasCompletedOnboarding = useUserStore(
    (state) => state.hasCompletedOnboarding,
  );
  const hasHydrated = useUserStore((state) => state._hasHydrated);
  const { theme } = useAppTheme();

  if (!hasHydrated) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.DEFAULT },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen
        name="Artists"
        component={ArtistsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ArtistSongs"
        component={ArtistSongsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Developer"
        component={DeveloperScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
