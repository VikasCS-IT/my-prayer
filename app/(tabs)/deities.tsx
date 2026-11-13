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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { useApp } from '../../src/context';
import { getDeities, getPrayersByDeity } from '../../src/data';
import { Deity } from '../../src/types';
import { SearchBar } from '../../src/components';

export default function DeitiesScreen() {
  const router = useRouter();
  const { isDarkMode, selectedReligion } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [searchQuery, setSearchQuery] = useState<string>('');

  const allDeities = useMemo(() => getDeities(selectedReligion), [selectedReligion]);

  const filteredDeities = useMemo(() => {
    if (!searchQuery.trim()) return allDeities;
    const q = searchQuery.toLowerCase().trim();
    return allDeities.filter(
      (d) =>
        d.nameEnglish.toLowerCase().includes(q) ||
        d.nameHindi.includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.associatedDayEnglish.toLowerCase().includes(q) ||
        d.associatedDayHindi.includes(q)
    );
  }, [searchQuery, allDeities]);

  const handleSelectDeity = (deity: Deity) => {
    router.push({
      pathname: '/deity/[id]',
      params: { id: deity.id },
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
            सनातन देवी-देवता • Sacred Deities
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            देव स्वरूप, स्तुति, पूजन दिवस एवं दिव्य मंत्र
          </Text>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="देवी-देवता या पूजन दिवस खोजें (उदा. शिव, मंगलवार)..."
        />

        <View style={styles.listContainer}>
          {filteredDeities.map((deity) => {
            const prayers = getPrayersByDeity(deity.id);
            return (
              <TouchableOpacity
                key={deity.id}
                style={[
                  styles.deityCard,
                  {
                    backgroundColor: theme.surfaceCard,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => handleSelectDeity(deity)}
              >
                <View style={styles.topSection}>
                  <View
                    style={[
                      styles.avatarBadge,
                      {
                        backgroundColor: isDarkMode ? '#2E1E14' : '#FFF3E0',
                        borderColor: deity.color || Colors.saffron,
                      },
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{deity.avatarIcon}</Text>
                  </View>

                  <View style={styles.nameSection}>
                    <Text style={[styles.nameHindi, { color: theme.textPrimary }]}>
                      {deity.nameHindi}
                    </Text>
                    <Text style={[styles.nameEnglish, { color: theme.textSecondary }]}>
                      {deity.nameEnglish} • {deity.title}
                    </Text>

                    <View style={styles.dayBadge}>
                      <Ionicons name="calendar-outline" size={12} color={Colors.saffronDark} />
                      <Text style={styles.dayText}>{deity.associatedDayHindi}</Text>
                    </View>
                  </View>
                </View>

                <Text
                  style={[styles.significance, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {deity.significance}
                </Text>

                {deity.mantraPreviewHindi && (
                  <View
                    style={[
                      styles.mantraBox,
                      {
                        backgroundColor: isDarkMode ? '#281B13' : '#FFF9F0',
                        borderColor: isDarkMode ? '#482E1C' : '#FFE6CC',
                      },
                    ]}
                  >
                    <Text style={styles.mantraLabel}>सिद्ध मंत्र:</Text>
                    <Text style={[styles.mantraHindi, { color: theme.accent }]}>
                      {deity.mantraPreviewHindi}
                    </Text>
                  </View>
                )}

                <View style={styles.bottomRow}>
                  <Text style={[styles.prayerCount, { color: theme.textMuted }]}>
                    {prayers.length} चालीसा / आरती / पाठ उपलब्ध
                  </Text>
                  <View style={styles.viewMoreRow}>
                    <Text style={[styles.viewMoreText, { color: theme.accent }]}>
                      पाठ सूची देखें
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.accent} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.md,
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
    gap: Spacing.md,
  },
  deityCard: {
    borderRadius: Spacing.cardRadius,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#4A0E0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  avatarBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  nameSection: {
    flex: 1,
  },
  nameHindi: {
    fontSize: 18,
    fontWeight: '700',
  },
  nameEnglish: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayText: {
    fontSize: 11,
    color: Colors.saffronDark,
    fontWeight: '600',
  },
  significance: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm + 2,
  },
  mantraBox: {
    padding: Spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mantraLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.goldDark,
  },
  mantraHindi: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: Spacing.xs,
  },
  prayerCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

