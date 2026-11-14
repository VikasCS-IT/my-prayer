import React, { useEffect, useState, Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../src/context';
import { Colors } from '../src/theme/colors';
import { updateService } from '../src/services/updateService';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Error Boundary to prevent standalone release crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SafeErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Boundary Catch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🌸</Text>
          <Text style={styles.errorTitle}>माई प्रेयर (My Prayer)</Text>
          <Text style={styles.errorSubtitle}>
            {this.state.error?.message || 'ऐप लोड करने में समस्या आई'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={styles.retryBtn}
          >
            <Text style={styles.retryBtnText}>पुनः खोलें (Retry)</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootNavigation() {
  const { hasCompletedOnboarding, isLoading, isDarkMode } = useApp();
  const segments = useSegments();
  const router = useRouter();

  const [hasDownloadedOTA, setHasDownloadedOTA] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    try {
      const inOnboarding = segments[0] === 'onboarding';

      if (!hasCompletedOnboarding && !inOnboarding) {
        router.replace('/onboarding');
      }
    } catch (e) {
      console.warn('Navigation redirect notice:', e);
    }
  }, [hasCompletedOnboarding, isLoading, segments, router]);

  // Silent automatic OTA background check on launch
  useEffect(() => {
    async function checkAutoOTA() {
      try {
        if (Platform.OS === 'web') return;
        const result = await updateService.autoCheckAndDownloadInBackground();
        if (result?.isNewDownloaded) {
          setHasDownloadedOTA(true);
        }
      } catch {
        // Safe catch - never interrupt app startup
      }
    }
    checkAutoOTA();
  }, []);

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Gentle OTA Notification Banner */}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFDF9',
  },
  errorEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D84315',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#FF6F00',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
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
    <SafeErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigation />
        </AppProvider>
      </SafeAreaProvider>
    </SafeErrorBoundary>
  );
}
