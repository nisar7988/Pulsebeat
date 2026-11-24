import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import GlassTabBar from '../../components/global/GlassTabBar';
import SearchScreen from '../../screens/SearchScreen';

const Tab = createBottomTabNavigator();

const renderTabBar = (props: BottomTabBarProps) => <GlassTabBar {...props} />;

const AppTabs = () => (
  <Tab.Navigator
    tabBar={renderTabBar}
    screenOptions={{ headerShown: false, animation: 'shift' }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default AppTabs;
