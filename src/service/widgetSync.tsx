import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate, type WidgetInfo } from 'react-native-android-widget';
import { PulseBeatWidget } from '../widgets/PulseBeatWidget';
import {
  getWidgetPlaybackState,
  type WidgetPlaybackSnapshot,
} from '../widgets/widgetState';

export const PULSEBEAT_WIDGET_NAME = 'PulseBeatPlayer';

const PROGRESS_SYNC_THROTTLE_MS = 1800;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastProgressSyncAt = 0;
let updateInFlight = false;
let hasPendingUpdate = false;
let pendingProgressOverride: { position: number; duration: number } | undefined;

export function buildPulseBeatWidgetElement(
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
  snapshot: WidgetPlaybackSnapshot,
) {
  const safeWidth = widgetInfo.width > 0 ? widgetInfo.width : 330;
  const safeHeight = widgetInfo.height > 0 ? widgetInfo.height : 195;
  return (
    <PulseBeatWidget
      title={snapshot.title}
      artist={snapshot.artist}
      artwork={snapshot.artwork}
      isPlaying={snapshot.isPlaying}
      hasSong={snapshot.hasSong}
      position={snapshot.position}
      duration={snapshot.duration}
      isShuffle={snapshot.isShuffle}
      isRepeat={snapshot.isRepeat}
      theme={snapshot.theme}
      width={safeWidth}
      height={safeHeight}
    />
  );
}

async function performWidgetUpdate(progressOverride?: {
  position: number;
  duration: number;
}): Promise<void> {
  if (updateInFlight) {
    hasPendingUpdate = true;
    pendingProgressOverride = progressOverride;
    return;
  }
  updateInFlight = true;
  try {
    const snapshot = await getWidgetPlaybackState(progressOverride);
    await requestWidgetUpdate({
      widgetName: PULSEBEAT_WIDGET_NAME,
      renderWidget: (info) => buildPulseBeatWidgetElement(info, snapshot),
    });
  } catch (e) {
    console.log('syncPlaybackWidget error:', e);
  } finally {
    updateInFlight = false;
    if (hasPendingUpdate) {
      const nextOverride = pendingProgressOverride;
      hasPendingUpdate = false;
      pendingProgressOverride = undefined;
      performWidgetUpdate(nextOverride).catch(() => {});
    }
  }
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

  syncTimer = setTimeout(() => {
    syncTimer = null;
    lastProgressSyncAt = Date.now();
    performWidgetUpdate().catch(() => {});
  }, 80);
}

/**
 * Updates the Android widget's progress bar & timestamp from TrackPlayer's
 * background service PlaybackProgressUpdated events (throttled every ~1.8s).
 */
export function syncWidgetProgress(position: number, duration: number): void {
  if (Platform.OS !== 'android') return;
  const now = Date.now();
  if (now - lastProgressSyncAt < PROGRESS_SYNC_THROTTLE_MS) return;

  lastProgressSyncAt = now;
  performWidgetUpdate({ position, duration }).catch(() => {});
}
