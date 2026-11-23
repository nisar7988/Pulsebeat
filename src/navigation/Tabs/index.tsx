import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import GlassTabBar from '../../components/global/GlassTabBar';
import SearchScreen from '../../screens/SearchScreen';


const Tab = createBottomTabNavigator();

const AppTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <GlassTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default AppTabs;