import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { Spacing } from '../src/theme/spacing';
import { useApp } from '../src/context';
import { getReligions } from '../src/data';
import { ReligionId, ReadingLanguage } from '../src/types';

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    selectedReligion,
    setSelectedReligion,
    readingLanguage,
    setReadingLanguage,
    completeOnboarding,
    isDarkMode,
  } = useApp();

  const theme = isDarkMode ? Colors.dark : Colors.light;
  const religions = getReligions();

  const [activeReligion, setActiveReligion] = useState<ReligionId>(selectedReligion || 'hinduism');
  const [activeLanguage, setActiveLanguage] = useState<ReadingLanguage>(readingLanguage || 'both');

  const handleStart = async () => {
    await setSelectedReligion(activeReligion);
    await setReadingLanguage(activeLanguage);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sacred Header Logo */}
        <View style={styles.heroSection}>
          <View style={styles.sacredIconContainer}>
            <Text style={styles.sacredIcon}>🪔</Text>
          </View>
          <Text style={[styles.brandTitle, { color: Colors.saffronDark }]}>
            My Prayer • माय प्रेयर
          </Text>
          <Text style={[styles.sanskritVerse, { color: theme.textSecondary }]}>
            ॥ ॐ असतो मा सद्गमय तमसो मा ज्योतिर्गमय ॥
          </Text>
          <Text style={[styles.subTitle, { color: theme.textPrimary }]}>
            दैनिक पूजा, चालीसा, आरती एवं पवित्र पाठ का सर्वसमावेशी मंच
          </Text>
        </View>

        {/* Step 1: Select Faith / Religion */}
        <View style={styles.stepSection}>
          <View style={styles.stepBadgeRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
              अपनी धार्मिक परंपरा चुनें • Select Faith
            </Text>
          </View>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
            आप सेटिंग्स में कभी भी अपनी पसंद बदल सकते हैं या अन्य परंपराओं को जान सकते हैं।
          </Text>

          <View style={styles.religionList}>
            {religions.map((r) => {
              const isSelected = activeReligion === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.religionCard,
                    {
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? '#3B2412'
                          : '#FFF4E5'
                        : theme.surfaceCard,
                      borderColor: isSelected ? Colors.saffron : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (r.isAvailable) {
                      setActiveReligion(r.id);
                    } else {
                      Alert.alert(
                        `${r.nameEnglish} - शीघ्र आ रहा है`,
                        `हम शीघ्र ही ${r.nameNative} के प्रामाणिक पाठ जोड़ रहे हैं। अभी हिन्दू धर्म का संपूर्ण संकलन उपलब्ध है।`
                      );
                    }
                  }}
                >
                  <Text style={styles.religionEmoji}>{r.symbol}</Text>
                  <View style={styles.religionDetails}>
                    <View style={styles.religionTitleRow}>
                      <Text style={[styles.religionTitle, { color: theme.textPrimary }]}>
                        {r.nameEnglish} ({r.nameNative})
                      </Text>
                      {r.comingSoon ? (
                        <View style={styles.comingSoonTag}>
                          <Text style={styles.comingSoonTagText}>Coming Soon</Text>
                        </View>
                      ) : (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>Active • उपलब्ध</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.religionTagline, { color: theme.textSecondary }]}>
                      {r.tagline}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? Colors.saffron : theme.border,
                      },
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 2: Preferred Reading Language */}
        <View style={styles.stepSection}>
          <View style={styles.stepBadgeRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
              पठन भाषा का चयन • Reading Language
            </Text>
          </View>

          <View style={styles.languageOptions}>
            {[
              {
                id: 'hindi',
                title: 'देवनागरी हिन्दी',
                subtitle: 'पारंपरिक संस्कृत एवं हिन्दी लिपि',
                badge: 'अ/आ',
              },
              {
                id: 'english',
                title: 'English Transliteration',
                subtitle: 'Easy Roman chanting + English meaning',
                badge: 'EN',
              },
              {
                id: 'both',
                title: 'दोनों (Both / द्वैभाषी)',
                subtitle: 'देवनागरी चौपाइयां + Roman Meaning (Recommended)',
                badge: 'A+अ',
              },
            ].map((item) => {
              const isSelected = activeLanguage === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.languageCard,
                    {
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? '#3B2412'
                          : '#FFF4E5'
                        : theme.surfaceCard,
                      borderColor: isSelected ? Colors.saffron : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setActiveLanguage(item.id as ReadingLanguage)}
                >
                  <View style={[styles.langBadge, { backgroundColor: isSelected ? Colors.saffron : isDarkMode ? '#2D1E14' : '#F5EBE1' }]}>
                    <Text style={[styles.langBadgeText, { color: isSelected ? '#FFFFFF' : theme.textPrimary }]}>
                      {item.badge}
                    </Text>
                  </View>

                  <View style={styles.langDetails}>
                    <Text style={[styles.langTitle, { color: theme.textPrimary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.langSubtitle, { color: theme.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? Colors.saffron : theme.border,
                      },
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleStart}
        >
          <Text style={styles.ctaButtonText}>
            साधना आरंभ करें • Begin Spiritual Journey
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
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
    paddingBottom: Spacing.xxxl * 1.5,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  sacredIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFE5C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.saffron,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sacredIcon: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sanskritVerse: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 6,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  stepSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.saffron,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 12,
    marginBottom: Spacing.md,
    marginLeft: 32,
  },
  religionList: {
    gap: 10,
  },
  religionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Spacing.cardRadius,
  },
  religionEmoji: {
    fontSize: 26,
    marginRight: Spacing.md,
  },
  religionDetails: {
    flex: 1,
  },
  religionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  religionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  comingSoonTag: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#546E7A',
  },
  religionTagline: {
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.saffron,
  },
  languageOptions: {
    gap: 10,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Spacing.cardRadius,
  },
  langBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  langBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  langDetails: {
    flex: 1,
  },
  langTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  langSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.saffronDark,
    paddingVertical: 16,
    borderRadius: Spacing.pillRadius,
    marginTop: Spacing.md,
    gap: 8,
    shadowColor: Colors.saffronDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

