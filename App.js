import React from 'react';
import './src/locationTask';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import RunScreen from './src/screens/RunScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import RunDetailScreen from './src/screens/RunDetailScreen';
import MapFullScreenScreen from './src/screens/MapFullScreenScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StatsScreen from './src/screens/StatsScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();
const RunStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();

function RunStackScreen() {
  return (
    <RunStack.Navigator screenOptions={{ headerShown: false }}>
      <RunStack.Screen name="RunLive" component={RunScreen} />
      <RunStack.Screen name="완료" component={SummaryScreen} />
    </RunStack.Navigator>
  );
}

function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} />
      <HistoryStack.Screen
        name="RunDetail"
        component={RunDetailScreen}
        options={{ headerShown: true, title: '러닝 경로', unmountOnBlur: true }}
      />
      <HistoryStack.Screen
        name="MapFullScreen"
        component={MapFullScreenScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </HistoryStack.Navigator>
  );
}

const icons = { 홈: '⌂', 러닝: '▷', 기록: '☰', 통계: '◫', 프로필: '◔' };

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.trail,
          tabBarInactiveTintColor: colors.faint,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="홈" component={HomeScreen} />
        <Tab.Screen name="러닝" component={RunStackScreen} options={{ tabBarStyle: { display: 'none' } }} />
        <Tab.Screen name="기록" component={HistoryStackScreen} />
        <Tab.Screen name="통계" component={StatsScreen} />
        <Tab.Screen name="프로필" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
