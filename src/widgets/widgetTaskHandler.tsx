import TrackPlayer, { State } from 'react-native-track-player';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import {
  initializePlayer,
  pauseSong,
  playSong,
  resumeSong,
  skipToNextSong,
  skipToPreviousSong,
} from '../service/player';
import {
  buildPulseBeatWidgetElement,
  PULSEBEAT_WIDGET_NAME,
} from '../service/widgetSync';
import {
  getPersistedCurrentSong,
  getWidgetPlaybackState,
} from './widgetState';

async function handleWidgetClick(clickAction?: string): Promise<boolean | undefined> {
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
          return false;
        }
        await resumeSong();
        return true;
      }

      const fallbackSong = await getPersistedCurrentSong();
      if (fallbackSong) {
        await playSong(fallbackSong);
        return true;
      }
      return false;
    }

    case 'NEXT': {
      await skipToNextSong();
      return undefined;
    }

    case 'PREVIOUS': {
      await skipToPreviousSong();
      return undefined;
    }

    default:
      return undefined;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== PULSEBEAT_WIDGET_NAME) {
    return;
  }

  let overridePlaying: boolean | undefined;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      break;

    case 'WIDGET_CLICK':
      try {
        overridePlaying = await handleWidgetClick(props.clickAction);
      } catch (e) {
        console.log('Widget click handling error:', e);
      }
      break;

    case 'WIDGET_DELETED':
      return;
  }

  const snapshot = await getWidgetPlaybackState();
  if (overridePlaying !== undefined) {
    snapshot.isPlaying = overridePlaying;
  }

  props.renderWidget(buildPulseBeatWidgetElement(props.widgetInfo, snapshot));
}
