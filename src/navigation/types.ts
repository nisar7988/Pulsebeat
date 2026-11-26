import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Song } from '../types/song';

export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  Player: { song?: Song } | undefined;
  Artists: undefined;
  ArtistSongs: { artistId?: string; artistName: string; avatar?: string };
  Developer: undefined;
};
