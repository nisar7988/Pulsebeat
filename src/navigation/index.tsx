import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppTabs from './Tabs';
import type { RootStackParamList } from './types';
import PlayerScreen from '../screens/PlayerScreen';
import OnboardingScreen from '../screens/onboarding';
import { useUserStore } from '../store';
import { theme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const hasCompletedOnboarding = useUserStore(
    (state) => state.hasCompletedOnboarding
  );

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
    </Stack.Navigator>
  );
}
