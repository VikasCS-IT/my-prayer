import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { PrayerItem } from '../types';
import { useApp } from '../context';

interface FeaturedPrayerCardProps {
  prayer: PrayerItem;
  onPress: () => void;
}

export const FeaturedPrayerCard: React.FC<FeaturedPrayerCardProps> = ({ prayer, onPress }) => {
  const { isBookmarked, toggleBookmark } = useApp();
  const bookmarked = isBookmarked(prayer.id);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
    >
      {/* Background spiritual glow accents */}
      <View style={styles.content}>
        <View style={styles.topBadgeRow}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>✨ दैनिक प्रमुख पाठ • Featured Prayer</Text>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleBookmark(prayer.id);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.bookmarkBtn}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.titleHindi}>{prayer.titleHindi}</Text>
        <Text style={styles.titleEnglish}>{prayer.titleEnglish}</Text>

        {prayer.verses.length > 0 && (
          <View style={styles.verseQuoteBox}>
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.verseQuoteText} numberOfLines={2}>
              {prayer.verses[0]?.hindi.split('\n')[0]}
            </Text>
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={15} color="#FFE0B2" />
            <Text style={styles.metaText}>{prayer.durationMinutes} मिनट (Mins)</Text>
            <Text style={styles.bullet}>•</Text>
            <Ionicons name="book-outline" size={15} color="#FFE0B2" />
            <Text style={styles.metaText}>{prayer.verses.length} छंद/Verse</Text>
          </View>

          <View style={styles.readActionBtn}>
            <Text style={styles.readActionText}>पढ़ें एवं सुनें</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.maroon} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#9A2A0A',
    borderRadius: Spacing.cardRadius + 4,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    elevation: 4,
    shadowColor: '#4A0E0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E67E22',
  },
  content: {
    padding: Spacing.lg + 2,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featuredBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Spacing.pillRadius,
  },
  featuredBadgeText: {
    color: '#FFEAA7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleHindi: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  titleEnglish: {
    color: '#FFDFBA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  verseQuoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteMark: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 6,
  },
  verseQuoteText: {
    color: '#FFF8EE',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#FFE0B2',
    fontSize: 12,
    fontWeight: '500',
  },
  bullet: {
    color: '#FFE0B2',
    marginHorizontal: 4,
  },
  readActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE57F',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Spacing.pillRadius,
    gap: 4,
  },
  readActionText: {
    color: '#4A0E0E',
    fontSize: 12,
    fontWeight: '700',
  },
});

