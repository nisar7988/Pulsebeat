import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Song } from '../types/song';

export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  Player: { song?: Song } | undefined;
};
