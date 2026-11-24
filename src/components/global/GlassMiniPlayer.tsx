import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useActiveTrack,
  useIsPlaying,
  useProgress,
} from 'react-native-track-player';

import { Song } from '../../types/song';
import {
  pauseSong,
  resumeSong,
  playSong,
  skipToNextSong,
} from '../../service/player';
import { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme';

export interface GlassMiniPlayerProps {
  fallbackSong?: Song;
}

export const GlassMiniPlayer: React.FC<GlassMiniPlayerProps> = ({
  fallbackSong,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const activeTrack = useActiveTrack();
  const { playing } = useIsPlaying();
  const { position, duration } = useProgress(250);

  // If no track is playing and no fallback song is available, don't render
  if (!activeTrack && !fallbackSong) {
    return null;
  }

  const title = activeTrack?.title || fallbackSong?.name || 'Nothing Playing';
  const artist =
    activeTrack?.artist ||
    fallbackSong?.artists?.primary?.[0]?.name ||
    fallbackSong?.artists?.all?.[0]?.name ||
    'PulseBeat';
  const artwork =
    (activeTrack?.artwork as string) ||
    fallbackSong?.image?.[1]?.url ||
    fallbackSong?.image?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';

  const progressRatio =
    duration > 0 ? Math.min(Math.max(position / duration, 0), 1) : 0;
  const progressPercent = `${(progressRatio * 100).toFixed(1)}%`;

  const handleTogglePlayback = async () => {
    try {
      if (playing) {
        await pauseSong();
      } else {
        if (!activeTrack && fallbackSong) {
          await playSong(fallbackSong);
        } else {
          await resumeSong();
        }
      }
    } catch (e) {
      console.log('Error toggling mini player playback:', e);
    }
  };

  const handleNext = async () => {
    try {
      await skipToNextSong();
    } catch (e) {
      console.log('Error skipping track:', e);
    }
  };

  const handleOpenFullPlayer = () => {
    if (activeTrack) {
      navigation.navigate('Player', {
        song: {
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
          duration: duration || 0,
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
        },
      });
    } else if (fallbackSong) {
      navigation.navigate('Player', { song: fallbackSong });
    }
  };

  return (
    <View className="absolute bottom-[92px] left-4 right-4 z-30 overflow-hidden rounded-2xl border border-glass-border">
      {/* Glass Frost Background */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={25}
        overlayColor="transparent"
        reducedTransparencyFallbackColor={theme.colors.glass.fallback}
      />
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
          <View className="w-11 h-11 rounded-xl overflow-hidden border border-white/20 bg-white/10 relative">
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
              {playing ? (
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
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
          >
            <Feather
              name={playing ? 'pause' : 'play'}
              size={18}
              color={theme.colors.text.dark}
              className={!playing ? 'ml-0.5' : undefined}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNext}
            className="w-9 h-9 rounded-full items-center justify-center border border-white/15 bg-white/10"
          >
            <Feather name="skip-forward" size={17} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slim Ambient Progress Line on bottom edge */}
      <View className="h-[2.5px] w-full bg-white/10 overflow-hidden">
        <View
          className="h-full bg-accent"
          style={{ width: progressPercent }}
        />
      </View>
    </View>
  );
};

export default GlassMiniPlayer;
