import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { withStallion } from 'react-native-stallion';
import GradientBackground from './src/components/global/GradientBackground';
import AnimatedBootSplash from './src/components/global/AnimatedBootSplash';
import GlobalPlaylistModal from './src/components/global/GlobalPlaylistModal';
import StallionUpdateModal from './src/components/global/StallionUpdateModal';
import RootNavigator from './src/navigation';
import { ThemedContainer, useAppTheme } from './src/theme';
import { initializePlayer } from './src/service/player';
import { useUserStore } from './src/store';
import './global.css';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [splashVisible, setSplashVisible] = React.useState(true);
  const [playerReady, setPlayerReady] = React.useState(false);
  const userHydrated = useUserStore((state) => state._hasHydrated);
  const { theme } = useAppTheme();

  const navigationTheme = React.useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.colors.background.DEFAULT,
      },
    }),
    [theme.colors.background.DEFAULT],
  );

  React.useEffect(() => {
    initializePlayer()
      .catch((e) => console.log('Init player error:', e))
      .finally(() => setPlayerReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      <ThemedContainer className="flex-1">
        <NavigationContainer theme={navigationTheme}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <GradientBackground>
            <RootNavigator />
          </GradientBackground>
        </NavigationContainer>
        <GlobalPlaylistModal />
        <StallionUpdateModal />
        {splashVisible && (
          <AnimatedBootSplash
            ready={playerReady && userHydrated}
            onAnimationEnd={() => setSplashVisible(false)}
          />
        )}
      </ThemedContainer>
    </SafeAreaProvider>
  );
}

export default withStallion(App);
