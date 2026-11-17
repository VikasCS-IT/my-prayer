import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { useApp } from '../../src/context';

export default function TabsLayout() {
  const { isDarkMode, readingLanguage } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const isEnglishOnly = readingLanguage === 'english';
  const isHindiOnly = readingLanguage === 'hindi';

  const homeLabel = isEnglishOnly ? 'Home' : isHindiOnly ? 'मुख्य पृष्ठ' : 'मुख्य पृष्ठ (Home)';
  const deitiesLabel = isEnglishOnly ? 'Deities' : isHindiOnly ? 'देवी-देवता' : 'देवी-देवता (Deities)';
  const bookmarksLabel = isEnglishOnly ? 'Saved' : isHindiOnly ? 'सहेजे गए' : 'सहेजे गए (Saved)';
  const profileLabel = isEnglishOnly ? 'Profile' : isHindiOnly ? 'प्रोफ़ाइल' : 'प्रोफ़ाइल (Profile)';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.saffron,
        tabBarInactiveTintColor: isDarkMode ? '#8E7D70' : '#8C7765',
        tabBarStyle: {
          backgroundColor: theme.surfaceCard,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#4A0E0E',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: homeLabel,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="deities"
        options={{
          title: 'Deities',
          tabBarLabel: deitiesLabel,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bookmarks',
          tabBarLabel: bookmarksLabel,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: profileLabel,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
