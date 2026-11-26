import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GradientBackground from './src/components/global/GradientBackground';
import AnimatedBootSplash from './src/components/global/AnimatedBootSplash';
import RootNavigator from './src/navigation';
import { theme } from './src/theme';
import { initializePlayer } from './src/service/player';
import './global.css';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background.DEFAULT,
  },
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [splashVisible, setSplashVisible] = React.useState(true);
  const [playerReady, setPlayerReady] = React.useState(false);

  React.useEffect(() => {
    initializePlayer()
      .catch((e) => console.log('Init player error:', e))
      .finally(() => setPlayerReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <GradientBackground>
          <RootNavigator />
        </GradientBackground>
      </NavigationContainer>
      {splashVisible && (
        <AnimatedBootSplash
          ready={playerReady}
          onAnimationEnd={() => setSplashVisible(false)}
        />
      )}
    </SafeAreaProvider>
  );
}

export default App;
