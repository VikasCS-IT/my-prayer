import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useApp } from '../context';

interface HeaderGreetingProps {
  userName?: string;
}

export const HeaderGreeting: React.FC<HeaderGreetingProps> = ({ userName }) => {
  const { isDarkMode, readingLanguage } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const now = new Date();
  const hour = now.getHours();
  const dayIndex = now.getDay(); // 0 is Sunday, 1 Monday, etc.

  // Dynamic Time Greeting
  let greetingHindi = 'सुप्रभात';
  let greetingEnglish = 'Good Morning';
  let timeIcon = '🌅';

  if (hour >= 12 && hour < 17) {
    greetingHindi = 'शुभ दोपहर';
    greetingEnglish = 'Good Afternoon';
    timeIcon = '☀️';
  } else if (hour >= 17 && hour < 21) {
    greetingHindi = 'शुभ संध्या';
    greetingEnglish = 'Good Evening';
    timeIcon = '🪔';
  } else if (hour >= 21 || hour < 5) {
    greetingHindi = 'शुभ रात्रि';
    greetingEnglish = 'Devotional Night';
    timeIcon = '🌙';
  }

  // Day of the week deity association
  const dayHighlights: Record<
    number,
    {
      dayHindi: string;
      dayEnglish: string;
      deityHindi: string;
      deityEnglish: string;
      blessingHindi: string;
      blessingEnglish: string;
    }
  > = {
    0: {
      dayHindi: 'रविवार',
      dayEnglish: 'Sunday',
      deityHindi: 'सूर्य देव एवं भगवान विष्णु',
      deityEnglish: 'Lord Surya & Lord Vishnu',
      blessingHindi: 'तेज एवं ऊर्जा',
      blessingEnglish: 'Vitality & Radiance',
    },
    1: {
      dayHindi: 'सोमवार',
      dayEnglish: 'Monday',
      deityHindi: 'भगवान भोलेनाथ (शिव जी)',
      deityEnglish: 'Lord Shiva',
      blessingHindi: 'शांति एवं कल्याण',
      blessingEnglish: 'Peace & Wellbeing',
    },
    2: {
      dayHindi: 'मंगलवार',
      dayEnglish: 'Tuesday',
      deityHindi: 'श्री हनुमान जी',
      deityEnglish: 'Lord Hanuman',
      blessingHindi: 'बल, बुद्धि एवं भयमुक्ति',
      blessingEnglish: 'Strength, Wisdom & Courage',
    },
    3: {
      dayHindi: 'बुधवार',
      dayEnglish: 'Wednesday',
      deityHindi: 'श्री गणेश जी',
      deityEnglish: 'Lord Ganesha',
      blessingHindi: 'विघ्नविनाशक कृपा एवं विवेक',
      blessingEnglish: 'Intellect & Removal of Obstacles',
    },
    4: {
      dayHindi: 'गुरुवार',
      dayEnglish: 'Thursday',
      deityHindi: 'भगवान विष्णु एवं देवगुरु',
      deityEnglish: 'Lord Vishnu & Brihaspati',
      blessingHindi: 'ज्ञान, समृद्धि एवं सुख',
      blessingEnglish: 'Knowledge, Prosperity & Joy',
    },
    5: {
      dayHindi: 'शुक्रवार',
      dayEnglish: 'Friday',
      deityHindi: 'माँ लक्ष्मी एवं माँ दुर्गा',
      deityEnglish: 'Goddess Lakshmi & Goddess Durga',
      blessingHindi: 'वैभव, सौभाग्य एवं शक्ति',
      blessingEnglish: 'Abundance, Fortune & Power',
    },
    6: {
      dayHindi: 'शनिवार',
      dayEnglish: 'Saturday',
      deityHindi: 'श्री हनुमान जी एवं शनि देव',
      deityEnglish: 'Lord Hanuman & Lord Shani',
      blessingHindi: 'संकट निवारण एवं रक्षा',
      blessingEnglish: 'Protection & Freedom from Afflictions',
    },
  };

  const todayInfo = dayHighlights[dayIndex];
  const isEnglishOnly = readingLanguage === 'english';
  const isHindiOnly = readingLanguage === 'hindi';

  const greetingTitle = isEnglishOnly
    ? `${timeIcon} ${greetingEnglish}${userName ? `, ${userName}` : ''}`
    : `${timeIcon} ${greetingHindi}${userName ? `, ${userName}` : ''}`;

  const greetingSubtitle = isEnglishOnly
    ? `${todayInfo.dayEnglish} • Devotional Blessing`
    : isHindiOnly
    ? `${todayInfo.dayHindi} • दैनिक साधना`
    : `${greetingEnglish} • ${todayInfo.dayEnglish}`;

  const dayCardHeader = isEnglishOnly
    ? `Today's Day (${todayInfo.dayEnglish})`
    : isHindiOnly
    ? `आज का दिन (${todayInfo.dayHindi})`
    : `आज का दिन (${todayInfo.dayHindi} • ${todayInfo.dayEnglish})`;

  const deityHighlight = isEnglishOnly
    ? `Special Worship of ${todayInfo.deityEnglish}`
    : `${todayInfo.deityHindi} की विशेष उपासना`;

  const blessingLine = isEnglishOnly
    ? `Blessing: ${todayInfo.blessingEnglish}`
    : `आशीर्वाद: ${todayInfo.blessingHindi}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
      <View style={styles.topRow}>
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingHindi, { color: theme.textPrimary }]}>
            {greetingTitle}
          </Text>
          <Text style={[styles.greetingEnglish, { color: theme.textSecondary }]}>
            {greetingSubtitle}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: isDarkMode ? '#3B2412' : '#FFF3E0' }]}>
          <Text style={styles.omSymbol}>🕉️</Text>
        </View>
      </View>

      <View
        style={[
          styles.dayCard,
          {
            backgroundColor: isDarkMode ? '#2C1D13' : '#FFF8EE',
            borderColor: isDarkMode ? '#482F1E' : '#FFE2C4',
          },
        ]}
      >
        <View style={styles.dayHeader}>
          <Text style={styles.dayPillText}>{dayCardHeader}</Text>
        </View>
        <Text style={[styles.deityHighlightText, { color: theme.accent }]}>
          {deityHighlight}
        </Text>
        <Text style={[styles.blessingText, { color: theme.textSecondary }]}>
          {blessingLine}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.cardRadius,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    shadowColor: '#4A0E0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingHindi: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  greetingEnglish: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  omSymbol: {
    fontSize: 22,
  },
  dayCard: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.saffronDark,
  },
  deityHighlightText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  blessingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

