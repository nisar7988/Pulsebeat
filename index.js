/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { name as appName } from './app.json';
import { playbackService } from './src/service/playbackService';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => playbackService);

if (Platform.OS === 'android') {
  registerWidgetTaskHandler(widgetTaskHandler);
}
