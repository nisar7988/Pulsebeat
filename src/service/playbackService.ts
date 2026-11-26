import TrackPlayer, { Event } from 'react-native-track-player';
import { syncPlaybackWidget } from './widgetSync';

export const playbackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
    syncPlaybackWidget();
  });
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
    syncPlaybackWidget();
  });
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    await TrackPlayer.skipToNext();
    syncPlaybackWidget();
  });
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    await TrackPlayer.skipToPrevious();
    syncPlaybackWidget();
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
};
