import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from '../src/context';
import { Colors } from '../src/theme/colors';
import { updateService } from '../src/services/updateService';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigation() {
  const { hasCompletedOnboarding, isLoading, isDarkMode } = useApp();
  const segments = useSegments();
  const router = useRouter();

  const [hasDownloadedOTA, setHasDownloadedOTA] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [hasCompletedOnboarding, isLoading, segments]);

  // Silent automatic OTA background check on launch
  useEffect(() => {
    async function checkAutoOTA() {
      if (Platform.OS === 'web') return;
      const result = await updateService.autoCheckAndDownloadInBackground();
      if (result.isNewDownloaded) {
        setHasDownloadedOTA(true);
      }
    }
    checkAutoOTA();
  }, []);

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Gentle OTA Notification Banner (Auto updates silently, user doesn't need to do anything) */}
      {hasDownloadedOTA && (
        <View style={styles.otaBanner}>
          <View style={styles.otaBannerLeft}>
            <Text style={styles.otaBannerEmoji}>🌸</Text>
            <View style={styles.otaBannerTexts}>
              <Text style={styles.otaBannerTitle}>नया पावन संकलन स्वतः डाउनलोड हो चुका है</Text>
              <Text style={styles.otaBannerSubtitle}>अगली बार ऐप खोलने पर स्वतः लागू हो जाएगा</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.otaReloadBtn}
            onPress={() => updateService.reloadApp()}
          >
            <Text style={styles.otaReloadBtnText}>अभी देखें</Text>
          </TouchableOpacity>
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="deity/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="prayer/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  otaBanner: {
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  otaBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  otaBannerEmoji: {
    fontSize: 16,
  },
  otaBannerTexts: {
    flex: 1,
  },
  otaBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
  otaBannerSubtitle: {
    fontSize: 10,
    color: '#8D4004',
  },
  otaReloadBtn: {
    backgroundColor: '#FF6F00',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  otaReloadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}

