import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { useApp } from '../../src/context';
import { getDeityById, getPrayersByDeity } from '../../src/data';
import { PrayerCategory, PrayerItem } from '../../src/types';
import { PrayerCard } from '../../src/components';

export default function DeityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const deity = getDeityById(id || 'hanuman');
  const allDeityPrayers = useMemo(() => (id ? getPrayersByDeity(id) : []), [id]);

  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory>('all');

  const filterTabs: { id: PrayerCategory; label: string }[] = [
    { id: 'all', label: 'सभी (All)' },
    { id: 'chalisa', label: 'चालीसा' },
    { id: 'aarti', label: 'आरती' },
    { id: 'katha', label: 'व्रत कथा' },
    { id: 'mantra', label: 'मंत्र' },
  ];

  const filteredPrayers = useMemo(() => {
    if (selectedCategory === 'all') return allDeityPrayers;
    return allDeityPrayers.filter((p) => p.category === selectedCategory);
  }, [allDeityPrayers, selectedCategory]);

  const handleSelectPrayer = (prayer: PrayerItem) => {
    router.push({
      pathname: '/prayer/[id]',
      params: { id: prayer.id },
    });
  };

  if (!deity) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            देवी-देवता की जानकारी उपलब्ध नहीं है।
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>वापस जाएं</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sacred Header Banner */}
        <View
          style={[
            styles.bannerHeader,
            {
              backgroundColor: deity.color || Colors.maroon,
            },
          ]}
        >
          {/* Top Bar with Back Button */}
          <View style={styles.bannerTopNav}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.dayPill}>
              <Ionicons name="calendar" size={12} color="#FFFFFF" />
              <Text style={styles.dayPillText}>{deity.associatedDayHindi}</Text>
            </View>
          </View>

          {/* Deity Identity */}
          <View style={styles.deityHeroContent}>
            <View style={styles.avatarLargeCircle}>
              <Text style={styles.avatarLargeEmoji}>{deity.avatarIcon}</Text>
            </View>

            <Text style={styles.bannerNameHindi}>{deity.nameHindi}</Text>
            <Text style={styles.bannerNameEnglish}>
              {deity.nameEnglish} • {deity.title}
            </Text>

            <View style={styles.significanceBox}>
              <Text style={styles.significanceText}>{deity.significance}</Text>
            </View>

            {deity.mantraPreviewHindi && (
              <View style={styles.bannerMantraCard}>
                <Text style={styles.mantraCardLabel}>सिद्ध महामंत्र:</Text>
                <Text style={styles.mantraCardText}>{deity.mantraPreviewHindi}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Filter Category Tabs for this Deity */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {filterTabs.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: isSelected
                        ? Colors.saffron
                        : theme.surfaceCard,
                      borderColor: isSelected ? Colors.saffronDark : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(tab.id)}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Deity's Prayers List */}
        <View style={styles.prayersSection}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            पवित्र पाठ सूची • Sacred Verses ({filteredPrayers.length})
          </Text>

          {filteredPrayers.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: theme.border, backgroundColor: theme.surfaceCard }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                इस श्रेणी में अभी कोई पाठ नहीं है। कृपया "सभी" श्रेणी चुनें।
              </Text>
            </View>
          ) : (
            filteredPrayers.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onPress={() => handleSelectPrayer(prayer)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  bannerHeader: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  bannerTopNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Spacing.pillRadius,
    gap: 6,
  },
  dayPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deityHeroContent: {
    alignItems: 'center',
  },
  avatarLargeCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarLargeEmoji: {
    fontSize: 42,
  },
  bannerNameHindi: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bannerNameEnglish: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFE2B8',
    marginBottom: Spacing.md,
  },
  significanceBox: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  significanceText: {
    color: '#FFF8EE',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  bannerMantraCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Spacing.pillRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mantraCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.maroon,
  },
  mantraCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.saffronDark,
  },
  tabsContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.screenPadding,
  },
  tabsScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.screenPadding,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Spacing.pillRadius,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 13,
  },
  prayersSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.screenPadding,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: 0.2,
  },
  emptyBox: {
    padding: Spacing.xl,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  backBtn: {
    backgroundColor: Colors.saffron,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Spacing.pillRadius,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

