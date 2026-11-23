import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Song } from '../types/song';

export type AppTabParamList = {
  Home: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  Player: { song?: Song } | undefined;
};
