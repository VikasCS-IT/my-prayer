import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { PrayerCategory } from '../types';
import { useApp } from '../context';

interface CategoryFilterProps {
  selectedCategory: PrayerCategory;
  onSelectCategory: (category: PrayerCategory) => void;
}

const CATEGORIES: { id: PrayerCategory; labelHindi: string; labelEnglish: string; icon: string }[] = [
  { id: 'all', labelHindi: 'सभी', labelEnglish: 'All', icon: '✨' },
  { id: 'chalisa', labelHindi: 'चालीसा', labelEnglish: 'Chalisa', icon: '📜' },
  { id: 'aarti', labelHindi: 'आरती', labelEnglish: 'Aarti', icon: '🪔' },
  { id: 'katha', labelHindi: 'व्रत कथा', labelEnglish: 'Vrat Katha', icon: '📖' },
  { id: 'mantra', labelHindi: 'मंत्र / स्तोत्र', labelEnglish: 'Mantra', icon: '🕉️' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { isDarkMode, readingLanguage } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const label =
          readingLanguage === 'english'
            ? cat.labelEnglish
            : readingLanguage === 'hindi'
            ? cat.labelHindi
            : `${cat.labelHindi} (${cat.labelEnglish})`;

        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelectCategory(cat.id)}
            activeOpacity={0.7}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? Colors.saffron
                  : isDarkMode
                  ? theme.surfaceCard
                  : '#FFFFFF',
                borderColor: isSelected ? Colors.saffronDark : theme.border,
              },
            ]}
          >
            <Text style={styles.pillIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  scrollContainer: {
    paddingRight: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Spacing.pillRadius,
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
});

