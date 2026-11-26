import TrackPlayer, { State } from 'react-native-track-player';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import {
  initializePlayer,
  pauseSong,
  playSong,
  resumeSong,
  seekTo,
  skipToNextSong,
  skipToPreviousSong,
  toggleRepeatMode,
  toggleShuffleMode,
} from '../service/player';
import {
  buildPulseBeatWidgetElement,
  PULSEBEAT_WIDGET_NAME,
} from '../service/widgetSync';
import {
  getPersistedCurrentSong,
  getWidgetPlaybackState,
} from './widgetState';
import { isAppRunningInBackground } from '../service/lockScreen';

interface ClickOverrides {
  isPlaying?: boolean;
  isShuffle?: boolean;
  isRepeat?: boolean;
  position?: number;
}

async function handleWidgetClick(
  clickAction?: string,
  clickActionData?: Record<string, unknown>,
): Promise<ClickOverrides> {
  if (!(await isAppRunningInBackground())) {
    return { isPlaying: false };
  }

  await initializePlayer();

  switch (clickAction) {
    case 'PLAY_PAUSE': {
      const [activeTrack, playbackState] = await Promise.all([
        TrackPlayer.getActiveTrack().catch(() => undefined),
        TrackPlayer.getPlaybackState().catch(() => undefined),
      ]);

      if (activeTrack) {
        const currentlyPlaying =
          playbackState?.state === State.Playing ||
          playbackState?.state === State.Buffering;

        if (currentlyPlaying) {
          await pauseSong();
          return { isPlaying: false };
        }
        await resumeSong();
        return { isPlaying: true };
      }

      const fallbackSong = await getPersistedCurrentSong();
      if (fallbackSong) {
        await playSong(fallbackSong);
        return { isPlaying: true };
      }
      return { isPlaying: false };
    }

    case 'NEXT': {
      await skipToNextSong();
      return {};
    }

    case 'PREVIOUS': {
      await skipToPreviousSong();
      return {};
    }

    case 'SHUFFLE': {
      const isShuffle = await toggleShuffleMode();
      return { isShuffle };
    }

    case 'REPEAT': {
      const isRepeat = await toggleRepeatMode();
      return { isRepeat };
    }

    case 'SEEK_PERCENT': {
      const ratio = Number(clickActionData?.ratio);
      if (!Number.isFinite(ratio)) return {};
      const [progress, activeTrack, fallbackSong] = await Promise.all([
        TrackPlayer.getProgress().catch(() => undefined),
        TrackPlayer.getActiveTrack().catch(() => undefined),
        getPersistedCurrentSong(),
      ]);
      const duration =
        progress?.duration || activeTrack?.duration || fallbackSong?.duration || 0;
      if (duration <= 0) return {};

      const clampedRatio = Math.min(Math.max(ratio, 0), 1);
      const targetPosition = clampedRatio * duration;
      await seekTo(targetPosition);
      return { position: targetPosition };
    }

    default:
      return {};
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== PULSEBEAT_WIDGET_NAME) {
    return;
  }

  let overrides: ClickOverrides = {};

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      break;

    case 'WIDGET_CLICK':
      try {
        overrides = await handleWidgetClick(
          props.clickAction,
          props.clickActionData,
        );
      } catch (e) {
        console.log('Widget click handling error:', e);
      }
      break;

    case 'WIDGET_DELETED':
      return;
  }

  const snapshot = await getWidgetPlaybackState();
  if (overrides.isPlaying !== undefined) {
    snapshot.isPlaying = overrides.isPlaying;
  }
  if (overrides.isShuffle !== undefined) {
    snapshot.isShuffle = overrides.isShuffle;
  }
  if (overrides.isRepeat !== undefined) {
    snapshot.isRepeat = overrides.isRepeat;
  }
  if (overrides.position !== undefined) {
    snapshot.position = overrides.position;
  }

  props.renderWidget(buildPulseBeatWidgetElement(props.widgetInfo, snapshot));
}
