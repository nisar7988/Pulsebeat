import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate, type WidgetInfo } from 'react-native-android-widget';
import { PulseBeatWidget } from '../widgets/PulseBeatWidget';
import {
  getWidgetPlaybackState,
  type WidgetPlaybackSnapshot,
} from '../widgets/widgetState';

export const PULSEBEAT_WIDGET_NAME = 'PulseBeatPlayer';

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function buildPulseBeatWidgetElement(
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
  snapshot: WidgetPlaybackSnapshot,
) {
  return (
    <PulseBeatWidget
      title={snapshot.title}
      artist={snapshot.artist}
      artwork={snapshot.artwork}
      isPlaying={snapshot.isPlaying}
      hasSong={snapshot.hasSong}
      width={widgetInfo.width}
      height={widgetInfo.height}
    />
  );
}

/**
 * Triggers an Android home screen widget refresh with the latest playback state.
 * Debounced briefly so rapid TrackPlayer state transitions coalesce cleanly.
 */
export function syncPlaybackWidget(): void {
  if (Platform.OS !== 'android') return;

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(async () => {
    syncTimer = null;
    try {
      const snapshot = await getWidgetPlaybackState();
      await requestWidgetUpdate({
        widgetName: PULSEBEAT_WIDGET_NAME,
        renderWidget: (info) => buildPulseBeatWidgetElement(info, snapshot),
      });
    } catch (e) {
      console.log('syncPlaybackWidget error:', e);
    }
  }, 80);
}
