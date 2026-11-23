import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProgress, useActiveTrack } from 'react-native-track-player';
import type { RootStackParamList } from '../../navigation/types';
import {
  pauseSong,
  resumeSong,
  skipToNextSong,
  skipToPreviousSong,
  seekTo,
} from '../../service/player';
import ProgressBar from '../../components/ui/ProgressBar';
import { PlayerHeader, SongInfo, PlayerControls } from './components';
import { useSongTheme } from '../../hooks/useSongTheme';

const { width: W } = Dimensions.get('window');
const PANEL_H = 340;

const NowPlayingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Player'>>();
  const song = route.params?.song;
  const activeTrack = useActiveTrack();

  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Real progress from TrackPlayer with smooth simulated fallback & scrub support
  const { position, duration } = useProgress(250);
  const [simulatedProgress, setSimulatedProgress] = useState(0.2);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying || duration > 0 || isSeeking) return;
    const id = setInterval(() => setSimulatedProgress(p => (p >= 1 ? 0 : p + 0.004)), 1000);
    return () => clearInterval(id);
  }, [isPlaying, duration, isSeeking]);

  const currentRatio = duration > 0 ? position / duration : simulatedProgress;
  const progress = isSeeking && seekProgress !== null ? seekProgress : currentRatio;

  const handleSeek = async (ratio: number) => {
    setIsSeeking(false);
    setSeekProgress(null);
    try {
      if (duration > 0) {
        await seekTo(ratio * duration);
      } else {
        setSimulatedProgress(ratio);
      }
    } catch (e) {
      console.log('Seek error:', e);
    }
  };

  const handleScrub = (ratio: number) => {
    setIsSeeking(true);
    setSeekProgress(ratio);
  };

  const title = activeTrack?.title || song?.name || 'Midnight Dreams';
  const artist =
    activeTrack?.artist ||
    song?.artists?.primary?.[0]?.name ||
    song?.artists?.all?.[0]?.name ||
    'Luna Waves';
  const artwork =
    (activeTrack?.artwork as string) ||
    song?.image?.[2]?.url ||
    song?.image?.[1]?.url ||
    song?.image?.[0]?.url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900';

  const theme = useSongTheme(artwork);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await pauseSong();
        setIsPlaying(false);
      } else {
        await resumeSong();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Playback toggle error:', e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" {...{ translucent: true, backgroundColor: 'transparent' }} />

      {/* Full-bleed artwork */}
      <Image source={{ uri: artwork }} style={styles.backgroundImage} />
      <LinearGradient
        colors={theme.backgroundOverlay}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <PlayerHeader onBack={() => navigation.goBack()} />

      {/* Song info (sits just above the dome) */}
      <SongInfo title={title} artist={artist} bottomOffset={PANEL_H + 18} />

      {/* Dome player panel */}
      <LinearGradient
        colors={theme.panelGradient}
        style={styles.panel}
      >
        {/* Arc progress */}
        <ProgressBar
          progress={progress}
          width={W}
          trackColor={theme.trackColor}
          progressColor={theme.progressColor}
          dotColor={theme.dotColor}
          onSeek={handleSeek}
          onScrub={handleScrub}
        />

        {/* Player controls (Heart, Shuffle, Repeat, Previous, Play/Pause, Next) */}
        <PlayerControls
          isPlaying={isPlaying}
          artwork={artwork}
          liked={liked}
          isShuffle={isShuffle}
          isRepeat={isRepeat}
          accentColor={theme.accentColor}
          orbGradient={theme.orbGradient}
          glowColor={theme.glowColor}
          fanColor={theme.fanColor}
          ringColor={theme.ringColor}
          onTogglePlayback={togglePlayback}
          onPrevious={skipToPreviousSong}
          onNext={skipToNextSong}
          onToggleLike={() => setLiked(prev => !prev)}
          onToggleShuffle={() => setIsShuffle(prev => !prev)}
          onToggleRepeat={() => setIsRepeat(prev => !prev)}
        />
      </LinearGradient>
    </View>
  );
};

export default NowPlayingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1160',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: PANEL_H,
    borderTopLeftRadius: W / 2,
    borderTopRightRadius: W / 2,
    overflow: 'hidden',
  },
});
