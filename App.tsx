import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GradientBackground from './src/components/global/GradientBackground';
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

  React.useEffect(() => {
    initializePlayer().catch((e) => console.log('Init player error:', e));
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <GradientBackground>
          <RootNavigator />
        </GradientBackground>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
