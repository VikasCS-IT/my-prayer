import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { useApp } from '../../src/context';
import { getPrayerById } from '../../src/data';
import { PrayerItem } from '../../src/types';
import { PrayerCard } from '../../src/components';

export default function BookmarksScreen() {
  const router = useRouter();
  const { isDarkMode, bookmarks } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const savedPrayers = useMemo(() => {
    return bookmarks
      .map((id) => getPrayerById(id))
      .filter((p): p is PrayerItem => p !== undefined);
  }, [bookmarks]);

  const handleSelectPrayer = (prayer: PrayerItem) => {
    router.push({
      pathname: '/prayer/[id]',
      params: { id: prayer.id },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            सहेजे गए पाठ • Bookmarks
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            नित्य पाठ एवं दैनिक साधना के लिए आपके पसंदीदा संग्रह ({savedPrayers.length})
          </Text>
        </View>

        {savedPrayers.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.surfaceCard }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#2E1E14' : '#FFF3E0' }]}>
              <Ionicons name="bookmark-outline" size={36} color={Colors.saffron} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              कोई सहेजा गया पाठ नहीं है
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              अपनी दैनिक पूजा के लिए किसी भी चालीसा, आरती या मंत्र के बुकमार्क आइकन पर टैप करें।
            </Text>

            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.exploreBtnText}>प्रार्थनाएं देखें • Explore Prayers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {savedPrayers.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onPress={() => handleSelectPrayer(prayer)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  listContainer: {
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  exploreBtn: {
    backgroundColor: Colors.saffron,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Spacing.pillRadius,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

