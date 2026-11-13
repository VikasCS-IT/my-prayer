import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Deity } from '../types';
import { useApp } from '../context';

interface DeityAvatarListProps {
  deities: Deity[];
  onSelectDeity: (deity: Deity) => void;
}

export const DeityAvatarList: React.FC<DeityAvatarListProps> = ({ deities, onSelectDeity }) => {
  const { isDarkMode, readingLanguage } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          प्रमुख देवी-देवता • Popular Deities
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {deities.map((deity) => {
          const displayName =
            readingLanguage === 'english'
              ? deity.nameEnglish
              : readingLanguage === 'hindi'
              ? deity.nameHindi
              : deity.nameHindi;

          return (
            <TouchableOpacity
              key={deity.id}
              style={styles.avatarCard}
              onPress={() => onSelectDeity(deity)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: isDarkMode ? '#2D1E15' : '#FFF3E0',
                    borderColor: deity.color || Colors.saffron,
                  },
                ]}
              >
                <Text style={styles.avatarEmoji}>{deity.avatarIcon}</Text>
              </View>

              <Text
                style={[styles.deityName, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>

              <Text
                style={[styles.deityDay, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {deity.associatedDayHindi}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingRight: Spacing.screenPadding,
    gap: Spacing.md,
  },
  avatarCard: {
    alignItems: 'center',
    width: 82,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#4A0E0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  deityName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  deityDay: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});

