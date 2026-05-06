import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../src/constants/theme';

function TabIcon({ name, focused }) {
  return (
    <View style={styles.tabIcon}>
      {focused && <View style={styles.activeGlow} />}
      <Ionicons name={name} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} /> }} />
      <Tabs.Screen name="books" options={{ title: 'Quran', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} /> }} />
      <Tabs.Screen name="gatherings" options={{ title: 'Gather', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    height: SIZES.tabBarHeight,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    paddingTop: 8,
    elevation: 0,
    position: 'absolute',
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  tabIcon: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  activeGlow: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '15', top: -8,
  },
  activeDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: COLORS.primary, marginTop: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 6,
  },
});
