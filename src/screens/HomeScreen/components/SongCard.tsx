import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Song } from '../../../types/song';
import { playSong } from '../../../service/player';
import PlayCircleIcon from '../../../components/ui/PlayButton';
import { RootStackParamList } from '../../../navigation/types';
import { theme } from '../../../theme';

export interface SongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
}

export default function SongCard({ song, onPlay }: SongCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const imageUrl = song.image?.[1]?.url || song.image?.[0]?.url;
  const primaryArtist = song.artists?.primary?.[0];
  const artistName =
    primaryArtist?.name ||
    song.artists?.all?.[0]?.name ||
    'Unknown Artist';

  const handlePlay = () => {
    // 1. Immediately navigate to Player screen
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    if (parent) {
      parent.navigate('Player', { song });
    } else {
      (navigation as any).navigate('Player', { song });
    }

    // 2. Play song asynchronously without blocking UI transition
    if (onPlay) {
      onPlay(song);
    } else {
      playSong(song).catch((error) => {
        console.log('Error playing song:', error);
      });
    }
  };

  return (
    <View className="mx-4 my-2 overflow-hidden rounded-2xl border border-glass-border">
      {/* Glass blur background */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={25}
        overlayColor="transparent"
        reducedTransparencyFallbackColor={theme.colors.glass.fallback}
      />
      {/* Glass tint overlay */}
      <View className="absolute inset-0 bg-glass-tint" />

      {/* Card Content */}
      <View className="flex-row items-center justify-between p-3.5">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePlay}
          className="mr-2 flex-1 flex-row items-center gap-3"
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="h-[50px] w-[50px] rounded-xl"
            />
          ) : null}

          <View className="flex-1 justify-center">
            <Text
              className="text-base font-semibold text-text"
              numberOfLines={1}
            >
              {song.name}
            </Text>
            <Text
              className="mt-0.5 text-xs text-text-muted"
              numberOfLines={1}
            >
              {artistName}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlay}
          activeOpacity={0.7}
          className="items-center justify-center p-1"
        >
          <PlayCircleIcon color={theme.colors.accent.DEFAULT} size={32} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
