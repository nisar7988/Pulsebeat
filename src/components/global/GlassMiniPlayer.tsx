import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useActiveTrack,
  useProgress,
} from 'react-native-track-player';

import { Song } from '../../types/song';
import {
  decodeHtmlEntities,
  playSong,
  skipToNextSong,
  getSongArtistName,
  getSongArtwork,
  getSongTitle,
} from '../../service/player';
import { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useCurrentSongStore } from '../../store/useCurrentSongStore';
import { useOptimisticPlayback } from '../../hooks/useOptimisticPlayback';

export interface GlassMiniPlayerProps {
  fallbackSong?: Song;
  bottomOffsetClass?: string;
}

const MiniPlayerProgressBar: React.FC<{ isSwitchingTrack?: boolean }> = React.memo(({
  isSwitchingTrack = false,
}) => {
  const isFocused = useIsFocused();
  const { position, duration } = useProgress(200);
  const progressRatio =
    isFocused && !isSwitchingTrack && duration > 0
      ? Math.min(Math.max(position / duration, 0), 1)
      : 0;
  const progressPercent = `${(progressRatio * 100).toFixed(1)}%` as `${number}%`;

  return (
    <View className="h-[2.5px] w-full bg-white/10 overflow-hidden">
      <View className="h-full bg-accent" style={{ width: progressPercent }} />
    </View>
  );
});

export const GlassMiniPlayer: React.FC<GlassMiniPlayerProps> = React.memo(({
  fallbackSong,
  bottomOffsetClass = 'bottom-[92px]',
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const activeTrack = useActiveTrack();
  const currentSong = useCurrentSongStore((state) => state.currentSong);
  const activeOrFallbackSong = currentSong || fallbackSong;
  const isSwitchingTrack = Boolean(
    currentSong?.id && activeTrack?.id && currentSong.id !== activeTrack.id,
  );
  const { isPlaying, togglePlayback } = useOptimisticPlayback(activeOrFallbackSong);

  // If no track is playing and no fallback song is available, don't render
  if (!activeTrack && !activeOrFallbackSong) {
    return null;
  }

  const title =
    (currentSong ? getSongTitle(currentSong) : decodeHtmlEntities(activeTrack?.title)) ||
    getSongTitle(activeOrFallbackSong) ||
    'Nothing Playing';
  const artist =
    (currentSong ? getSongArtistName(currentSong) : decodeHtmlEntities(activeTrack?.artist)) ||
    getSongArtistName(activeOrFallbackSong);
  const artwork =
    (currentSong ? getSongArtwork(currentSong) : (activeTrack?.artwork as string)) ||
    getSongArtwork(activeOrFallbackSong);

  const handleTogglePlayback = () => {
    togglePlayback(Boolean(activeTrack));
  };

  const handleNext = async () => {
    try {
      if (!activeTrack && activeOrFallbackSong) {
        useCurrentSongStore.getState().setCurrentSong(activeOrFallbackSong);
        await playSong(activeOrFallbackSong);
        await skipToNextSong();
        return;
      }
      await skipToNextSong();
    } catch (e) {
      console.log('Error skipping track:', e);
    }
  };

  const handleOpenFullPlayer = () => {
    const songToPlay: Song | undefined = activeTrack
      ? {
          id: activeTrack.id || '',
          name: activeTrack.title || '',
          artists: {
            primary: [{ id: '', name: activeTrack.artist || '', url: '' }],
            featured: [],
            all: [{ id: '', name: activeTrack.artist || '', url: '' }],
          },
          image: [
            { quality: '150x150', url: activeTrack.artwork || '' },
            { quality: '500x500', url: activeTrack.artwork || '' },
          ],
          album: { id: '', name: '', url: '' },
          downloadUrl: [{ quality: '320kbps', url: activeTrack.url || '' }],
          copyright: '',
          duration: activeTrack.duration || activeOrFallbackSong?.duration || 0,
          explicitContent: false,
          hasLyrics: false,
          label: '',
          language: '',
          lyricsId: null,
          playCount: 0,
          releaseDate: null,
          type: 'song',
          url: '',
          year: '',
        }
      : activeOrFallbackSong;

    if (songToPlay) {
      const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
      if (parent) {
        parent.navigate('Player', { song: songToPlay });
      } else {
        (navigation as any).navigate('Player', { song: songToPlay });
      }
    }
  };

  return (
    <View className={`absolute ${bottomOffsetClass} left-4 right-4 z-30 overflow-hidden rounded-2xl border border-glass-border`}>
      {/* Glass Frost Background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={25}
          overlayColor="transparent"
          reducedTransparencyFallbackColor={theme.colors.glass.fallback}
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16, 28, 13, 0.92)' }]}
        />
      )}
      <View className="absolute inset-0 bg-glass-tint" />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Main Content */}
      <View className="flex-row items-center justify-between p-2.5">
        {/* Artwork + Track Title (Tapping expands to full Player) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenFullPlayer}
          className="flex-1 flex-row items-center gap-3 mr-2"
        >
          <View className="w-11 h-11 rounded-xl overflow-hidden border border-glass-border bg-glass-tint relative">
            <Image
              source={{ uri: artwork }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-sm font-bold text-white" numberOfLines={1}>
              {title}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              {isPlaying ? (
                <View className="h-1.5 w-1.5 rounded-full bg-accent" />
              ) : null}
              <Text className="text-xs text-white/70" numberOfLines={1}>
                {artist}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Controls: Play/Pause and Skip */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleTogglePlayback}
            className="w-10 h-10 rounded-full bg-accent items-center justify-center shadow-sm shadow-accent/50"
          >
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={theme.colors.text.dark}
              className={!isPlaying ? 'ml-0.5' : undefined}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNext}
            className="w-9 h-9 rounded-full items-center justify-center border border-glass-border bg-glass-tint"
          >
            <Feather name="skip-forward" size={17} color={theme.colors.text.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slim Ambient Progress Line on bottom edge */}
      <MiniPlayerProgressBar isSwitchingTrack={isSwitchingTrack} />
    </View>
  );
});

export default GlassMiniPlayer;
