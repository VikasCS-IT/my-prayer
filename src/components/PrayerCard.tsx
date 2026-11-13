import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { PrayerItem } from '../types';
import { useApp } from '../context';
import { getDeityById } from '../data';

interface PrayerCardProps {
  prayer: PrayerItem;
  onPress: () => void;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({ prayer, onPress }) => {
  const { isDarkMode, isBookmarked, toggleBookmark } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const bookmarked = isBookmarked(prayer.id);
  const deity = getDeityById(prayer.deityId);

  const categoryLabels: Record<string, { label: string; bg: string; text: string }> = {
    chalisa: { label: 'चालीसा', bg: '#FFF3E0', text: '#E65100' },
    aarti: { label: 'आरती', bg: '#FCE4EC', text: '#C2185B' },
    katha: { label: 'व्रत कथा', bg: '#E8F5E9', text: '#2E7D32' },
    mantra: { label: 'मंत्र', bg: '#EDE7F6', text: '#512DA8' },
    stotra: { label: 'स्तोत्र', bg: '#FFF8E1', text: '#F57F17' },
  };

  const catStyle = categoryLabels[prayer.category] || {
    label: prayer.category,
    bg: '#EEEEEE',
    text: '#444444',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <Text style={[styles.titleHindi, { color: theme.textPrimary }]}>
            {prayer.titleHindi}
          </Text>
          <Text style={[styles.titleEnglish, { color: theme.textSecondary }]}>
            {prayer.titleEnglish}
          </Text>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleBookmark(prayer.id);
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.bookmarkButton, { backgroundColor: isDarkMode ? '#2F2018' : '#FDF6EC' }]}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? Colors.saffron : theme.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.tagGroup}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: isDarkMode ? '#3B271A' : catStyle.bg },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: isDarkMode ? Colors.saffronLight : catStyle.text },
              ]}
            >
              {catStyle.label}
            </Text>
          </View>

          {deity && (
            <View style={styles.deityTag}>
              <Text style={styles.deityEmoji}>{deity.avatarIcon}</Text>
              <Text style={[styles.deityNameText, { color: theme.textSecondary }]}>
                {deity.nameHindi}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaInfo}>
          <Ionicons name="time-outline" size={14} color={theme.textMuted} />
          <Text style={[styles.durationText, { color: theme.textMuted }]}>
            {prayer.durationMinutes} मिनट
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.cardRadius,
    padding: Spacing.md + 2,
    borderWidth: 1,
    marginBottom: Spacing.md,
    shadowColor: '#4A0E0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm + 2,
  },
  titleArea: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleHindi: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  titleEnglish: {
    fontSize: 13,
    fontWeight: '500',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deityEmoji: {
    fontSize: 12,
  },
  deityNameText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

