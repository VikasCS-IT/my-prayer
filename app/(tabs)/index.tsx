import React, { useState, useMemo } from 'react';
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
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { useApp } from '../../src/context';
import {
  getPrayers,
  getDeities,
  getPrayerById,
  searchPrayersAndDeities,
} from '../../src/data';
import { PrayerCategory, PrayerItem, Deity } from '../../src/types';
import {
  HeaderGreeting,
  SearchBar,
  CategoryFilter,
  FeaturedPrayerCard,
  DeityAvatarList,
  PrayerCard,
} from '../../src/components';

export default function HomeScreen() {
  const router = useRouter();
  const { isDarkMode, recentlyRead, selectedReligion } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory>('all');

  const allDeities = useMemo(() => getDeities(selectedReligion), [selectedReligion]);
  const allPrayers = useMemo(() => getPrayers(selectedReligion), [selectedReligion]);

  // Featured Daily Prayer (Hanuman Chalisa or first prayer)
  const featuredPrayer = useMemo(() => {
    return allPrayers.find((p) => p.id === 'hanuman-chalisa') || allPrayers[0];
  }, [allPrayers]);

  // Search and Category filtering
  const filteredData = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return searchPrayersAndDeities(searchQuery, selectedReligion);
    }

    let prayers = allPrayers;
    if (selectedCategory !== 'all') {
      prayers = prayers.filter((p) => p.category === selectedCategory);
    }

    return {
      prayers,
      deities: allDeities,
    };
  }, [searchQuery, selectedCategory, selectedReligion, allPrayers, allDeities]);

  // Recently read prayers
  const recentlyReadPrayers = useMemo(() => {
    return recentlyRead
      .map((id) => getPrayerById(id))
      .filter((p): p is PrayerItem => p !== undefined);
  }, [recentlyRead]);

  const handleSelectPrayer = (prayer: PrayerItem) => {
    router.push({
      pathname: '/prayer/[id]',
      params: { id: prayer.id },
    });
  };

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
        {/* Dynamic Spiritual Greeting & Today's Deity Blessing */}
        <HeaderGreeting />

        {/* Instant Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="खोजें: चालीसा, आरती, मंत्र या देवी-देवता..."
        />

        {/* If searching, display search results */}
        {searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsContainer}>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              खोज परिणाम • Search Results ({filteredData.prayers.length + filteredData.deities.length})
            </Text>

            {filteredData.deities.length > 0 && (
              <View style={styles.searchSection}>
                <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
                  देवी-देवता ({filteredData.deities.length})
                </Text>
                <DeityAvatarList
                  deities={filteredData.deities}
                  onSelectDeity={handleSelectDeity}
                />
              </View>
            )}

            <View style={styles.searchSection}>
              <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
                प्रार्थना एवं स्तुति ({filteredData.prayers.length})
              </Text>
              {filteredData.prayers.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    कोई परिणाम नहीं मिला। कृपया दूसरा शब्द खोजें।
                  </Text>
                </View>
              ) : (
                filteredData.prayers.map((prayer) => (
                  <PrayerCard
                    key={prayer.id}
                    prayer={prayer}
                    onPress={() => handleSelectPrayer(prayer)}
                  />
                ))
              )}
            </View>
          </View>
        ) : (
          <>
            {/* Horizontal Category Filter Pills */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Featured Daily Hero Card (shown when 'all' is selected) */}
            {selectedCategory === 'all' && featuredPrayer && (
              <FeaturedPrayerCard
                prayer={featuredPrayer}
                onPress={() => handleSelectPrayer(featuredPrayer)}
              />
            )}

            {/* Popular Deities Horizontal Scroll */}
            <DeityAvatarList
              deities={allDeities}
              onSelectDeity={handleSelectDeity}
            />

            {/* Recently Read Section (if available) */}
            {recentlyReadPrayers.length > 0 && selectedCategory === 'all' && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                    हाल ही में पढ़े गए • Recently Read
                  </Text>
                </View>
                {recentlyReadPrayers.slice(0, 2).map((prayer) => (
                  <PrayerCard
                    key={`recent-${prayer.id}`}
                    prayer={prayer}
                    onPress={() => handleSelectPrayer(prayer)}
                  />
                ))}
              </View>
            )}

            {/* Popular Chalisas, Aartis & Kathas List */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  {selectedCategory === 'all'
                    ? 'पावन चालीसा एवं आरतियां • Popular Prayers'
                    : `संग्रह • Selected Collection (${filteredData.prayers.length})`}
                </Text>
              </View>

              {filteredData.prayers.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onPress={() => handleSelectPrayer(prayer)}
                />
              ))}
            </View>
          </>
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
  searchResultsContainer: {
    marginTop: Spacing.sm,
  },
  searchSection: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyBox: {
    padding: Spacing.xl,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

