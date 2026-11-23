import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppTabs from './Tabs';
import type { RootStackParamList } from './types';
import PlayerScreen from '../screens/PlayerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
  );
}
