import TrackPlayer, { Event } from 'react-native-track-player';
import { skipToNextSong, skipToPreviousSong } from './player';
import { syncPlaybackWidget, syncWidgetProgress } from './widgetSync';

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
    await skipToNextSong();
  });
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    await skipToPreviousSong();
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    await TrackPlayer.seekTo(event.position);
    syncPlaybackWidget();
  });
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
    syncWidgetProgress(event.position, event.duration);
  });
  TrackPlayer.addEventListener(Event.PlaybackState, () => {
    syncPlaybackWidget();
  });
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, () => {
    syncPlaybackWidget();
  });
};
