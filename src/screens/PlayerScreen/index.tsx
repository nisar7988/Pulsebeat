import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StatusBar,
  Dimensions,
  StyleSheet,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProgress, useActiveTrack } from 'react-native-track-player';
import type { RootStackParamList } from '../../navigation/types';
import {
  playSong,
  skipToNextSong,
  skipToPreviousSong,
  seekTo,
  toggleRepeatMode,
  toggleShuffleMode,
  getSongArtistName,
  getSongArtwork,
  getSongTitle,
  decodeHtmlEntities,
} from '../../service/player';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  PlayerHeader,
  SongInfo,
  PlayerControls,
  LyricsModal,
  QueueModal,
} from './components';
import { useSongTheme } from '../../hooks/useSongTheme';
import { useOptimisticPlayback } from '../../hooks/useOptimisticPlayback';
import { useCurrentSongStore } from '../../store/useCurrentSongStore';
import { useListeningStore } from '../../store';
import {
  isDeviceLocked,
  requestUnlockToLeavePlayer,
  setShowPlayerOnLockScreen,
} from '../../service/lockScreen';

const { width: W } = Dimensions.get('window');
const PANEL_H = 340;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface PlayerProgressProps {
  fallbackDuration?: number;
  isSwitchingTrack?: boolean;
  trackColor: string;
  progressColor: string;
  dotColor: string;
}

const PlayerProgress: React.FC<PlayerProgressProps> = React.memo(({
  fallbackDuration = 0,
  isSwitchingTrack = false,
  trackColor,
  progressColor,
  dotColor,
}) => {
  const { position, duration } = useProgress(100);
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);
  const [pendingSeekRatio, setPendingSeekRatio] = useState<number | null>(null);
  const seekClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveDuration = isSwitchingTrack
    ? fallbackDuration
    : duration > 0
    ? duration
    : fallbackDuration;
  const livePosition = isSwitchingTrack ? 0 : position;
  const currentRatio =
    effectiveDuration > 0
      ? Math.min(Math.max(livePosition / effectiveDuration, 0), 1)
      : 0;

  const activeOverride = scrubProgress ?? pendingSeekRatio;
  const progress = activeOverride !== null ? activeOverride : currentRatio;
  const displayPosition =
    activeOverride !== null ? activeOverride * effectiveDuration : livePosition;

  useEffect(() => {
    if (pendingSeekRatio === null || effectiveDuration <= 0) return;
    const targetSeconds = pendingSeekRatio * effectiveDuration;
    if (Math.abs(livePosition - targetSeconds) <= 1.2) {
      setPendingSeekRatio(null);
      if (seekClearTimerRef.current) {
        clearTimeout(seekClearTimerRef.current);
        seekClearTimerRef.current = null;
      }
    }
  }, [effectiveDuration, livePosition, pendingSeekRatio]);

  useEffect(() => {
    return () => {
      if (seekClearTimerRef.current) {
        clearTimeout(seekClearTimerRef.current);
      }
    };
  }, []);

  const handleSeek = useCallback(
    async (ratio: number) => {
      setScrubProgress(null);
      setPendingSeekRatio(ratio);
      if (seekClearTimerRef.current) {
        clearTimeout(seekClearTimerRef.current);
      }
      seekClearTimerRef.current = setTimeout(() => {
        setPendingSeekRatio(null);
        seekClearTimerRef.current = null;
      }, 650);

      try {
        if (effectiveDuration > 0) {
          await seekTo(ratio * effectiveDuration);
        }
      } catch (e) {
        console.log('Seek error:', e);
        setPendingSeekRatio(null);
      }
    },
    [effectiveDuration],
  );

  const handleScrub = useCallback((ratio: number) => {
    if (seekClearTimerRef.current) {
      clearTimeout(seekClearTimerRef.current);
      seekClearTimerRef.current = null;
    }
    setPendingSeekRatio(null);
    setScrubProgress(ratio);
  }, []);

  return (
    <>
      <ProgressBar
        progress={progress}
        width={W}
        trackColor={trackColor}
        progressColor={progressColor}
        dotColor={dotColor}
        onSeek={handleSeek}
        onScrub={handleScrub}
      />
      <View
        pointerEvents="none"
        className="absolute top-[108px] left-7 right-7 flex-row items-center justify-between"
      >
        <Text className="text-[11px] font-semibold text-white/75">
          {formatTime(displayPosition)}
        </Text>
        <Text className="text-[11px] font-semibold text-white/75">
          {formatTime(effectiveDuration)}
        </Text>
      </View>
    </>
  );
});

const NowPlayingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Player'>>();
  const song = route.params?.song;
  const activeTrack = useActiveTrack();
  const currentSong = useCurrentSongStore((state) => state.currentSong);
  const activeSong = currentSong || song;
  const isSwitchingTrack = Boolean(
    activeSong?.id && activeTrack?.id && activeSong.id !== activeTrack.id,
  );

  const { isPlaying, togglePlayback } = useOptimisticPlayback(activeSong);
  const [lyricsVisible, setLyricsVisible] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);
  const isShuffle = useCurrentSongStore((state) => state.isShuffle);
  const isRepeat = useCurrentSongStore((state) => state.isRepeat);

  const liked = useListeningStore((state) =>
    activeSong ? state.likedSongs.some((s) => s.id === activeSong.id) : false,
  );
  const toggleLikeSong = useListeningStore((state) => state.toggleLikeSong);
  const openPlaylistModal = useListeningStore((state) => state.openPlaylistModal);

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

  // Ensure route song plays once when opening PlayerScreen if TrackPlayer isn't already on it
  useEffect(() => {
    if (!song || activeTrack?.id === song.id) return;
    if (currentSong && currentSong.id !== song.id) return;
    const timer = setTimeout(() => {
      playSong(song).catch((err: any) =>
        console.log('PlayerScreen playSong error:', err),
      );
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]);

  // Prioritize activeSong so UI immediately updates to clicked song without waiting for TrackPlayer native bridge
  const title =
    (activeSong ? getSongTitle(activeSong) : decodeHtmlEntities(activeTrack?.title)) ||
    'Midnight Dreams';
  const artist =
    (activeSong
      ? getSongArtistName(activeSong)
      : decodeHtmlEntities(activeTrack?.artist)) || 'Luna Waves';
  const artwork =
    (activeSong ? getSongArtwork(activeSong) : (activeTrack?.artwork as string)) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900';

  const songTheme = useSongTheme(artwork);

  const handleTogglePlayback = useCallback(() => {
    togglePlayback(Boolean(activeTrack));
  }, [activeTrack, togglePlayback]);

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
      <PlayerHeader
        onBack={() => navigation.goBack()}
        onLyricsPress={() => setLyricsVisible(true)}
        onQueuePress={() => setQueueVisible(true)}
      />

      {/* Song info (sits just above the dome) */}
      <SongInfo
        title={title}
        artist={artist}
        song={activeSong}
        accentColor={songTheme.accentColor}
        bottomOffset={PANEL_H + 18}
        onAddToPlaylist={
          activeSong ? () => openPlaylistModal(activeSong) : undefined
        }
      />

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
        {/* Arc progress + timestamps */}
        <PlayerProgress
          fallbackDuration={activeSong?.duration || activeTrack?.duration || 0}
          isSwitchingTrack={isSwitchingTrack}
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
          onTogglePlayback={handleTogglePlayback}
          onPrevious={skipToPreviousSong}
          onNext={skipToNextSong}
          onToggleLike={() => {
            if (activeSong) {
              toggleLikeSong(activeSong);
            }
          }}
          onToggleShuffle={() => {
            toggleShuffleMode();
          }}
          onToggleRepeat={() => {
            toggleRepeatMode();
          }}
        />
      </LinearGradient>

      <LyricsModal
        visible={lyricsVisible}
        songId={activeSong?.id || activeTrack?.id}
        title={title}
        artist={artist}
        duration={activeSong?.duration || activeTrack?.duration || undefined}
        accentColor={songTheme.accentColor}
        onClose={() => setLyricsVisible(false)}
      />

      <QueueModal
        visible={queueVisible}
        accentColor={songTheme.accentColor}
        onClose={() => setQueueVisible(false)}
      />
    </View>
  );
};

export default NowPlayingScreen;
