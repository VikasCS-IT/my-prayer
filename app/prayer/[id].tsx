import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { useApp } from '../../src/context';
import { getPrayerById, getDeityById } from '../../src/data';
import { MiniAudioPlayer } from '../../src/components';
import { ReadingLanguage, ReadingTheme, VerseItem } from '../../src/types';

export default function PrayerReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    readingLanguage,
    setReadingLanguage,
    fontSizeMultiplier,
    increaseFontSize,
    decreaseFontSize,
    readingTheme,
    setReadingTheme,
    bookmarks,
    toggleBookmark,
    recordRecentlyRead,
  } = useApp();

  const prayer = getPrayerById(id || 'hanuman-chalisa');
  const deity = prayer ? getDeityById(prayer.deityId) : undefined;
  const isBookmarked = prayer ? bookmarks.includes(prayer.id) : false;

  // Local display mode for reader
  const [localLang, setLocalLang] = useState<ReadingLanguage>(readingLanguage || 'both');

  // Record recently viewed
  useEffect(() => {
    if (prayer) {
      recordRecentlyRead(prayer.id);
    }
  }, [prayer?.id]);

  // Color palette based on readingTheme
  const themeColors = Colors.reader[readingTheme] || Colors.reader.cream;
  const isDarkSurface = readingTheme === 'dark';

  // Cycle through Reader themes
  const cycleReadingTheme = () => {
    const sequence: ReadingTheme[] = ['cream', 'sepia', 'dark', 'light'];
    const nextIdx = (sequence.indexOf(readingTheme) + 1) % sequence.length;
    setReadingTheme(sequence[nextIdx]);
  };

  // Cycle language
  const cycleLanguage = () => {
    if (localLang === 'hindi') setLocalLang('both');
    else if (localLang === 'both') setLocalLang('english');
    else setLocalLang('hindi');
  };

  // Share Prayer
  const handleShare = async () => {
    if (!prayer) return;
    try {
      const firstVerse = prayer.verses[0]?.hindi || '';
      await Share.share({
        title: `${prayer.titleHindi} - ${prayer.titleEnglish}`,
        message: `🌸 ${prayer.titleHindi} (${prayer.titleEnglish})\n\n${firstVerse}\n\nMy Prayer ऐप में पूरा पाठ पढ़ें एवं सुनें: https://myprayer.app/prayer/${prayer.id}`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  if (!prayer) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            यह पाठ उपलब्ध नहीं है।
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>वापस जाएं</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Base font sizes scaled with multiplier
  const baseHindiSize = 18 * fontSizeMultiplier;
  const baseEnglishSize = 14 * fontSizeMultiplier;
  const baseMeaningSize = 13.5 * fontSizeMultiplier;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDarkSurface ? 'light-content' : 'dark-content'} />

      {/* Top Distraction-Free Toolbar */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: themeColors.background,
            borderBottomColor: isDarkSurface ? '#33271F' : '#E8DBCB',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.toolIconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.toolbarCenter}>
          <Text style={[styles.toolbarTitle, { color: themeColors.text }]} numberOfLines={1}>
            {prayer.titleHindi}
          </Text>
        </View>

        {/* Toolbar Controls */}
        <View style={styles.toolbarActions}>
          {/* Language Toggle */}
          <TouchableOpacity
            onPress={cycleLanguage}
            style={[
              styles.toolPill,
              {
                backgroundColor: isDarkSurface ? '#2D221A' : '#F5EBE1',
                borderColor: isDarkSurface ? '#4D382A' : '#D6C4B0',
              },
            ]}
          >
            <Text style={[styles.toolPillText, { color: themeColors.text }]}>
              {localLang === 'hindi' ? 'हिन्दी' : localLang === 'english' ? 'Eng' : 'द्वैभाषी'}
            </Text>
          </TouchableOpacity>

          {/* Font Size Adjusters */}
          <TouchableOpacity
            onPress={decreaseFontSize}
            style={styles.fontAdjustBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={[styles.fontAdjustText, { color: themeColors.text }]}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={increaseFontSize}
            style={styles.fontAdjustBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={[styles.fontAdjustText, { color: themeColors.text, fontWeight: '700' }]}>A+</Text>
          </TouchableOpacity>

          {/* Theme Palette Switcher */}
          <TouchableOpacity
            onPress={cycleReadingTheme}
            style={styles.toolIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons
              name={
                readingTheme === 'dark'
                  ? 'moon'
                  : readingTheme === 'sepia'
                  ? 'color-palette'
                  : 'sunny-outline'
              }
              size={20}
              color={themeColors.text}
            />
          </TouchableOpacity>

          {/* Bookmark Toggle */}
          <TouchableOpacity
            onPress={() => toggleBookmark(prayer.id)}
            style={styles.toolIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? Colors.saffron : themeColors.text}
            />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.toolIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons name="share-social-outline" size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Reading Canvas */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.readingScroll}
      >
        {/* Sacred Invocation Header */}
        <View style={styles.prayerTitleHeader}>
          {deity && (
            <View style={styles.deityPill}>
              <Text style={styles.deityPillEmoji}>{deity.avatarIcon}</Text>
              <Text style={styles.deityPillText}>{deity.nameHindi}</Text>
            </View>
          )}

          <Text style={[styles.mainPrayerTitle, { color: themeColors.text }]}>
            {prayer.titleHindi}
          </Text>
          <Text style={[styles.subPrayerTitle, { color: themeColors.textSecondary }]}>
            {prayer.titleEnglish}
          </Text>

          {prayer.subtitleHindi && (
            <Text style={[styles.subtitleHindi, { color: Colors.saffronDark }]}>
              ॥ {prayer.subtitleHindi} ॥
            </Text>
          )}

          {prayer.significance && (
            <View
              style={[
                styles.significanceBox,
                {
                  backgroundColor: isDarkSurface ? '#241B15' : '#FFF9F0',
                  borderColor: isDarkSurface ? '#442F20' : '#FFE8D1',
                },
              ]}
            >
              <Text style={[styles.significanceText, { color: themeColors.textSecondary }]}>
                {prayer.significance}
              </Text>
            </View>
          )}
        </View>

        {/* Verses Container */}
        <View style={styles.versesList}>
          {prayer.verses.map((verse: VerseItem, index: number) => {
            const isDoha = verse.type === 'doha';
            const isChaupai = verse.type === 'chaupai';
            const isChorus = verse.type === 'chorus';
            const isKatha = verse.type === 'paragraph';
            const isMantra = verse.type === 'mantra';

            return (
              <View
                key={index}
                style={[
                  styles.verseCard,
                  isDoha && [
                    styles.dohaCard,
                    {
                      backgroundColor: themeColors.dohaBg,
                      borderColor: themeColors.dohaBorder,
                    },
                  ],
                  isChorus && [
                    styles.chorusCard,
                    {
                      backgroundColor: isDarkSurface ? '#2A1F18' : '#FFF0E0',
                      borderColor: Colors.gold,
                    },
                  ],
                  !isDoha && !isChorus && [
                    styles.standardCard,
                    {
                      backgroundColor: themeColors.cardBg,
                      borderColor: isDarkSurface ? '#36271D' : '#F0E4D5',
                    },
                  ],
                ]}
              >
                {/* Heading / Stanza Type Badge */}
                {(verse.headingHindi || isDoha || isChorus || isMantra) && (
                  <View style={styles.verseHeaderRow}>
                    <View
                      style={[
                        styles.verseTypeBadge,
                        {
                          backgroundColor: isDoha
                            ? Colors.saffronLight
                            : themeColors.badgeBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.verseTypeBadgeText,
                          {
                            color: isDoha ? Colors.saffronDark : themeColors.badgeText,
                          },
                        ]}
                      >
                        {verse.headingHindi ||
                          (isDoha
                            ? '॥ दोहा ॥'
                            : isChaupai
                            ? '॥ चौपाई ॥'
                            : isChorus
                            ? '॥ स्थायी / Chorus ॥'
                            : isMantra
                            ? '॥ महामंत्र ॥'
                            : '॥ पद ॥')}
                      </Text>
                    </View>

                    {verse.number && (
                      <Text style={[styles.verseNumberText, { color: themeColors.textSecondary }]}>
                        #{verse.number}
                      </Text>
                    )}
                  </View>
                )}

                {/* 1. Hindi Devanagari Script */}
                {(localLang === 'hindi' || localLang === 'both') && (
                  <Text
                    style={[
                      styles.verseHindi,
                      {
                        color: themeColors.text,
                        fontSize: isDoha || isMantra ? baseHindiSize + 2 : baseHindiSize,
                        lineHeight: (isDoha || isMantra ? baseHindiSize + 2 : baseHindiSize) * 1.6,
                        fontWeight: isDoha || isChorus || isMantra ? '700' : '500',
                      },
                    ]}
                  >
                    {verse.hindi}
                  </Text>
                )}

                {/* 2. English Transliteration */}
                {(localLang === 'english' || localLang === 'both') && verse.englishTransliteration && (
                  <Text
                    style={[
                      styles.verseEnglishTrans,
                      {
                        color: isDarkSurface ? '#E2D5C7' : '#574332',
                        fontSize: baseEnglishSize,
                        lineHeight: baseEnglishSize * 1.5,
                        marginTop: localLang === 'both' ? 8 : 0,
                      },
                    ]}
                  >
                    {verse.englishTransliteration}
                  </Text>
                )}

                {/* 3. English Meaning / भावार्थ */}
                {verse.englishMeaning && (
                  <View
                    style={[
                      styles.meaningBox,
                      {
                        borderLeftColor: isDoha ? Colors.saffron : Colors.gold,
                        backgroundColor: isDarkSurface ? '#17120E' : 'rgba(0,0,0,0.02)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.meaningLabel,
                        { color: isDoha ? Colors.saffronDark : Colors.goldDark },
                      ]}
                    >
                      अर्थ / Meaning:
                    </Text>
                    <Text
                      style={[
                        styles.meaningText,
                        {
                          color: themeColors.meaningText,
                          fontSize: baseMeaningSize,
                          lineHeight: baseMeaningSize * 1.45,
                        },
                      ]}
                    >
                      {verse.englishMeaning}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Completion Closing Benediction */}
        <View style={styles.benedictionBox}>
          <Text style={[styles.benedictionOm, { color: Colors.saffron }]}>॥ इति शुभम् ॥</Text>
          <Text style={[styles.benedictionText, { color: themeColors.textSecondary }]}>
            भगवान आपके जीवन में सुख, शांति एवं आध्यात्मिक तेज का संचार करें।
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Mini Audio Player */}
      <MiniAudioPlayer
        title={prayer.titleHindi}
        subtitle={`${prayer.titleEnglish} • ${prayer.durationMinutes} मिनट`}
        durationSeconds={prayer.durationMinutes * 60}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toolIconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarCenter: {
    flex: 1,
    marginLeft: 6,
    marginRight: 6,
  },
  toolbarTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Spacing.pillRadius,
    borderWidth: 1,
  },
  toolPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fontAdjustBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  fontAdjustText: {
    fontSize: 13,
    fontWeight: '600',
  },
  readingScroll: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl * 2,
  },
  prayerTitleHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  deityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE6CC',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Spacing.pillRadius,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  deityPillEmoji: {
    fontSize: 14,
  },
  deityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A3B00',
  },
  mainPrayerTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subPrayerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  subtitleHindi: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  significanceBox: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  significanceText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  versesList: {
    gap: Spacing.lg,
  },
  verseCard: {
    borderRadius: Spacing.cardRadius,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  dohaCard: {
    borderLeftWidth: 4,
  },
  chorusCard: {
    borderLeftWidth: 4,
  },
  standardCard: {
    borderLeftWidth: 1,
  },
  verseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  verseTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verseTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  verseNumberText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verseHindi: {
    letterSpacing: 0.3,
  },
  verseEnglishTrans: {
    fontStyle: 'italic',
  },
  meaningBox: {
    marginTop: Spacing.md,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    borderLeftWidth: 2,
    borderRadius: 4,
  },
  meaningLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  meaningText: {
    fontStyle: 'normal',
  },
  benedictionBox: {
    alignItems: 'center',
    marginVertical: Spacing.xxl,
    padding: Spacing.lg,
  },
  benedictionOm: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  benedictionText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
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

