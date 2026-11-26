import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Image,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProgress, useActiveTrack, useIsPlaying } from 'react-native-track-player';
import type { RootStackParamList } from '../../navigation/types';
import {
  pauseSong,
  resumeSong,
  playSong,
  skipToNextSong,
  skipToPreviousSong,
  seekTo,
  getSongArtistName,
  getSongArtwork,
} from '../../service/player';
import ProgressBar from '../../components/ui/ProgressBar';
import { PlayerHeader, SongInfo, PlayerControls } from './components';
import { useSongTheme } from '../../hooks/useSongTheme';
import { useCurrentSongStore } from '../../store/useCurrentSongStore';
import { useListeningStore, useUserStore } from '../../store';
import {
  isDeviceLocked,
  requestUnlockToLeavePlayer,
  setShowPlayerOnLockScreen,
} from '../../service/lockScreen';

const { width: W } = Dimensions.get('window');
const PANEL_H = 340;

interface PlayerProgressProps {
  isPlaying: boolean;
  trackColor: string;
  progressColor: string;
  dotColor: string;
}

const PlayerProgress: React.FC<PlayerProgressProps> = React.memo(({
  isPlaying,
  trackColor,
  progressColor,
  dotColor,
}) => {
  const { position, duration } = useProgress(250);
  const [simulatedProgress, setSimulatedProgress] = useState(0.2);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying || duration > 0 || isSeeking) return;
    const id = setInterval(() => setSimulatedProgress((p) => (p >= 1 ? 0 : p + 0.004)), 1000);
    return () => clearInterval(id);
  }, [isPlaying, duration, isSeeking]);

  const currentRatio = duration > 0 ? position / duration : simulatedProgress;
  const progress = isSeeking && seekProgress !== null ? seekProgress : currentRatio;

  const handleSeek = useCallback(
    async (ratio: number) => {
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
    },
    [duration],
  );

  const handleScrub = useCallback((ratio: number) => {
    setIsSeeking(true);
    setSeekProgress(ratio);
  }, []);

  return (
    <ProgressBar
      progress={progress}
      width={W}
      trackColor={trackColor}
      progressColor={progressColor}
      dotColor={dotColor}
      onSeek={handleSeek}
      onScrub={handleScrub}
    />
  );
});

const NowPlayingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Player'>>();
  const song = route.params?.song;
  const activeTrack = useActiveTrack();
  const { playing } = useIsPlaying();
  const currentSong = useCurrentSongStore((state) => state.currentSong);
  const activeSong = song || currentSong;

  const [isPlaying, setIsPlaying] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(() => useUserStore.getState().repeatByDefault);

  const liked = useListeningStore((state) =>
    activeSong ? state.likedSongs.some((s) => s.id === activeSong.id) : false,
  );
  const toggleLikeSong = useListeningStore((state) => state.toggleLikeSong);

  // Sync isPlaying state with TrackPlayer
  useEffect(() => {
    if (typeof playing === 'boolean') {
      setIsPlaying(playing);
    }
  }, [playing]);

  // Allow PlayerScreen to appear over Android lock screen and require unlock to leave
  useEffect(() => {
    setShowPlayerOnLockScreen(true);
    let bypassing = false;

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (bypassing) return;
      e.preventDefault();

      isDeviceLocked().then(async (locked) => {
        if (!locked) {
          bypassing = true;
          navigation.dispatch(e.data.action);
          return;
        }
        const unlocked = await requestUnlockToLeavePlayer();
        if (unlocked) {
          bypassing = true;
          navigation.dispatch(e.data.action);
        }
      });
    });

    return () => {
      unsubscribe();
      setShowPlayerOnLockScreen(false);
    };
  }, [navigation]);

  // Ensure activeSong plays if TrackPlayer is not already playing this song
  useEffect(() => {
    if (!activeSong || activeTrack?.id === activeSong.id) return;
    const timer = setTimeout(() => {
      playSong(activeSong).catch((err: any) =>
        console.log('PlayerScreen playSong error:', err),
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [activeSong, activeTrack?.id]);

  // Prioritize activeSong so UI immediately updates to clicked song without waiting for TrackPlayer native bridge
  const title = activeSong?.name || activeTrack?.title || 'Midnight Dreams';
  const artist =
    (activeSong ? getSongArtistName(activeSong) : activeTrack?.artist) || 'Luna Waves';
  const artwork =
    (activeSong ? getSongArtwork(activeSong) : (activeTrack?.artwork as string)) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900';

  const songTheme = useSongTheme(artwork);

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
    <View className="flex-1" style={{ backgroundColor: songTheme.background }}>
      <StatusBar barStyle="light-content" />

      {/* Full-bleed artwork */}
      <Image
        source={{ uri: artwork }}
        className="absolute inset-0 h-full w-full"
        resizeMode="cover"
      />
      <LinearGradient
        colors={songTheme.backgroundOverlay}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <PlayerHeader onBack={() => navigation.goBack()} />

      {/* Song info (sits just above the dome) */}
      <SongInfo title={title} artist={artist} bottomOffset={PANEL_H + 18} />

      {/* Dome player panel */}
      <LinearGradient
        colors={songTheme.panelGradient}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: PANEL_H,
          borderTopLeftRadius: W / 2,
          borderTopRightRadius: W / 2,
          overflow: 'hidden',
        }}
      >
        {/* Arc progress */}
        <PlayerProgress
          isPlaying={isPlaying}
          trackColor={songTheme.trackColor}
          progressColor={songTheme.progressColor}
          dotColor={songTheme.dotColor}
        />

        {/* Player controls */}
        <PlayerControls
          isPlaying={isPlaying}
          artwork={artwork}
          liked={liked}
          isShuffle={isShuffle}
          isRepeat={isRepeat}
          accentColor={songTheme.accentColor}
          orbGradient={songTheme.orbGradient}
          glowColor={songTheme.glowColor}
          fanColor={songTheme.fanColor}
          ringColor={songTheme.ringColor}
          onTogglePlayback={togglePlayback}
          onPrevious={skipToPreviousSong}
          onNext={skipToNextSong}
          onToggleLike={() => {
            if (activeSong) {
              toggleLikeSong(activeSong);
            }
          }}
          onToggleShuffle={() => setIsShuffle((prev) => !prev)}
          onToggleRepeat={() => setIsRepeat((prev) => !prev)}
        />
      </LinearGradient>
    </View>
  );
};

export default NowPlayingScreen;
