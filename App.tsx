import { StatusBar, useColorScheme } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GradientBackground from './src/components/global/GradientBackgoround';
import RootNavigator from './src/navigation';
import './global.css';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <GradientBackground>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </NavigationContainer>
      </GradientBackground>
    </SafeAreaProvider>
  );
}

export default App;
