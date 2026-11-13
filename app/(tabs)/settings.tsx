import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { useApp } from '../../src/context';
import { getReligions } from '../../src/data';
import { ReligionId, ReadingLanguage, ReadingTheme } from '../../src/types';
import { updateService } from '../../src/services/updateService';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    selectedReligion,
    setSelectedReligion,
    readingLanguage,
    setReadingLanguage,
    fontSizeMultiplier,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    readingTheme,
    setReadingTheme,
    isDarkMode,
    toggleDarkMode,
    resetAllSettings,
  } = useApp();

  const theme = isDarkMode ? Colors.dark : Colors.light;
  const religions = getReligions();

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateStatusText, setUpdateStatusText] = useState('अपडेट स्थिति: नवीनतम संस्करण');

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    const result = await updateService.checkForUpdate();
    setIsCheckingUpdate(false);
    if (result.hasUpdate) {
      setUpdateAvailable(true);
      setUpdateStatusText('नया ओटीए अपडेट उपलब्ध है!');
      Alert.alert('नया अपडेट मिला!', result.message, [
        { text: 'बाद में', style: 'cancel' },
        { text: 'तुरंत लागू करें', onPress: handleApplyUpdate },
      ]);
    } else {
      setUpdateAvailable(false);
      setUpdateStatusText('ऐप नवीनतम है (Up to date)');
      Alert.alert('अपडेट स्थिति', result.message);
    }
  };

  const handleApplyUpdate = async () => {
    setIsDownloadingUpdate(true);
    const result = await updateService.downloadAndApplyUpdate();
    setIsDownloadingUpdate(false);
    if (!result.success) {
      Alert.alert('सूचना', result.message);
    }
  };

  const handleShowOTAGuide = () => {
    Alert.alert(
      'ओटीए (OTA) अपडेट कैसे कार्य करता है?',
      '1. अपने सर्वर पर परिवर्तन प्रकाशित करें:\nnpx expo export (या eas update)\n\n2. बिना नया APK डाउनलोड किए या Play Store पर सबमिट किए उपयोगकर्ताओं के ऐप में तत्काल नए पाठ, ऑडियो और बग फिक्स स्वतः अपडेट हो जाते हैं।\n\nप्रोटोकॉल: Expo Updates Spec & Self-Hosted Manifest.'
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'My Prayer - Daily Spiritual Chants & Prayers',
        message:
          '🌸 My Prayer: सम्पूर्ण चालीसा, आरती, व्रत कथा एवं सिद्ध मंत्र। आध्यात्मिक शांति और दैनिक साधना के लिए डाउनलोड करें: https://myprayer.app',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'सेटिंग्स रीसेट करें • Reset Preferences',
      'क्या आप सभी सेटिंग्स और प्राथमिकताओं को प्रारंभिक स्थिति में लाना चाहते हैं?',
      [
        { text: 'रद्द करें (Cancel)', style: 'cancel' },
        {
          text: 'रीसेट करें (Reset)',
          style: 'destructive',
          onPress: async () => {
            await resetAllSettings();
            Alert.alert('सफलता', 'सभी प्राथमिकताएं रीसेट कर दी गई हैं।');
          },
        },
      ]
    );
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
            सेटिंग्स एवं प्राथमिकताएं • Settings
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            धर्म, भाषा, फ़ॉन्ट आकार एवं पाठ विषय-वस्तु कस्टमाइज़ करें
          </Text>
        </View>

        {/* Offline Mode Banner */}
        <View
          style={[
            styles.offlineBanner,
            {
              backgroundColor: isDarkMode ? '#241E15' : '#FFF8EE',
              borderColor: isDarkMode ? '#48331E' : '#FFE0B2',
            },
          ]}
        >
          <View style={styles.offlineIcon}>
            <Ionicons name="cloud-offline" size={22} color={Colors.saffron} />
          </View>
          <View style={styles.offlineContent}>
            <Text style={[styles.offlineTitle, { color: theme.textPrimary }]}>
              १००% ऑफ़लाइन मोड सक्रिय (Offline Ready)
            </Text>
            <Text style={[styles.offlineDesc, { color: theme.textSecondary }]}>
              सभी चालीसा, आरतियां, व्रत कथाएं और ऑडियो बिना इंटरनेट के भी उपलब्ध हैं।
            </Text>
          </View>
        </View>

        {/* Religion Selection Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            धार्मिक परंपरा • Spiritual Tradition
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            {religions.map((r, idx) => {
              const isSelected = selectedReligion === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.religionRow,
                    idx < religions.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                  ]}
                  onPress={() => {
                    if (r.isAvailable) {
                      setSelectedReligion(r.id);
                    } else {
                      Alert.alert(
                        `${r.nameEnglish} - शीघ्र आ रहा है`,
                        `हम शीघ्र ही ${r.nameNative} के पवित्र पाठ (जैसे ${r.tagline}) जोड़ रहे हैं!`
                      );
                    }
                  }}
                >
                  <Text style={styles.religionSymbol}>{r.symbol}</Text>
                  <View style={styles.religionInfo}>
                    <View style={styles.religionNameRow}>
                      <Text style={[styles.religionName, { color: theme.textPrimary }]}>
                        {r.nameEnglish} ({r.nameNative})
                      </Text>
                      {r.comingSoon && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.religionTagline, { color: theme.textSecondary }]}>
                      {r.tagline}
                    </Text>
                  </View>

                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.saffron} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reading Language Preference */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            पठन भाषा • Reading Language
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            {[
              { id: 'hindi', label: 'देवनागरी हिन्दी', desc: 'प्रामाणिक संस्कृत एवं हिन्दी लिपि' },
              { id: 'english', label: 'English Transliteration', desc: 'Roman text + English meaning' },
              { id: 'both', label: 'दोनों (Both / द्वैभाषी)', desc: 'देवनागरी श्लोक + English Meaning' },
            ].map((langItem, idx) => {
              const isSelected = readingLanguage === langItem.id;
              return (
                <TouchableOpacity
                  key={langItem.id}
                  style={[
                    styles.optionRow,
                    idx < 2 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                  ]}
                  onPress={() => setReadingLanguage(langItem.id as ReadingLanguage)}
                >
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                      {langItem.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                      {langItem.desc}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.saffron} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reading Font Size Adjuster */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            अक्षर आकार • Font Size Adjuster
          </Text>
          <View style={[styles.card, styles.fontSizeRow, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                पाठ आकार: {Math.round(fontSizeMultiplier * 100)}%
              </Text>
              <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                {fontSizeMultiplier > 1.2 ? 'बड़ा (Large)' : fontSizeMultiplier < 0.95 ? 'छोटा (Compact)' : 'मध्यम (Standard)'}
              </Text>
            </View>

            <View style={styles.fontControls}>
              <TouchableOpacity
                onPress={decreaseFontSize}
                style={[styles.fontBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.fontBtnText, { color: theme.textPrimary }]}>A -</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetFontSize}
                style={[styles.fontBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.fontBtnText, { color: theme.textMuted }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={increaseFontSize}
                style={[styles.fontBtn, { borderColor: theme.border, backgroundColor: isDarkMode ? '#3B2412' : '#FFF3E0' }]}
              >
                <Text style={[styles.fontBtnText, { color: Colors.saffronDark, fontWeight: '700' }]}>A +</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Reader Theme (Parchment, Sepia, Dark, Light) */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            रीडर थीम • Reader Surface
          </Text>
          <View style={styles.themesGrid}>
            {[
              { id: 'cream', label: 'पर्चमेंट क्रीम', bg: '#FFFBF5', border: '#E2D1B3' },
              { id: 'sepia', label: 'सेपिया', bg: '#F4ECD8', border: '#CFC09F' },
              { id: 'dark', label: 'रात्रि / डार्क', bg: '#1E1915', border: '#4E3A2D', textLight: true },
              { id: 'light', label: 'श्वेत / लाइट', bg: '#FFFFFF', border: '#D0D0D0' },
            ].map((th) => {
              const isSelected = readingTheme === th.id;
              return (
                <TouchableOpacity
                  key={th.id}
                  onPress={() => setReadingTheme(th.id as ReadingTheme)}
                  style={[
                    styles.themeItem,
                    {
                      backgroundColor: th.bg,
                      borderColor: isSelected ? Colors.saffron : th.border,
                      borderWidth: isSelected ? 2.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: th.textLight ? '#F5F5F5' : '#333333' },
                    ]}
                  >
                    {th.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.saffron} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dark Mode Switch */}
        <View style={styles.section}>
          <View
            style={[
              styles.switchRow,
              { backgroundColor: theme.surfaceCard, borderColor: theme.border },
            ]}
          >
            <View style={styles.switchLabelArea}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny-outline'}
                size={22}
                color={Colors.saffron}
                style={{ marginRight: 10 }}
              />
              <View>
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                  डार्क मोड (Dark Mode)
                </Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                  आंखों के लिए आरामदायक रात्रि प्रारूप
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#D1C4B9', true: Colors.saffron }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* OTA Updates Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            ओटीए अपडेट्स • Over-The-Air (OTA) Updates
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View style={styles.otaHeaderRow}>
              <View style={[styles.otaIconBadge, { backgroundColor: isDarkMode ? '#2F2015' : '#FFF3E0' }]}>
                <Ionicons name="cloud-download-outline" size={24} color={Colors.saffron} />
              </View>
              <View style={styles.otaTitleInfo}>
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                  लाइव अपडेट सिस्टम (Over-The-Air)
                </Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                  {updateStatusText}
                </Text>
              </View>
            </View>

            <View style={styles.otaMetaGrid}>
              <View style={styles.otaMetaItem}>
                <Text style={[styles.otaMetaLabel, { color: theme.textMuted }]}>App Version</Text>
                <Text style={[styles.otaMetaVal, { color: theme.textPrimary }]}>v1.0.0</Text>
              </View>
              <View style={styles.otaMetaItem}>
                <Text style={[styles.otaMetaLabel, { color: theme.textMuted }]}>Channel</Text>
                <Text style={[styles.otaMetaVal, { color: theme.textPrimary }]}>production</Text>
              </View>
              <View style={styles.otaMetaItem}>
                <Text style={[styles.otaMetaLabel, { color: theme.textMuted }]}>Runtime</Text>
                <Text style={[styles.otaMetaVal, { color: theme.textPrimary }]}>1.0.0</Text>
              </View>
              <View style={styles.otaMetaItem}>
                <Text style={[styles.otaMetaLabel, { color: theme.textMuted }]}>No APK Reinstall</Text>
                <Text style={[styles.otaMetaVal, { color: '#2E7D32' }]}>Enabled ✅</Text>
              </View>
            </View>

            <View style={styles.otaButtonsRow}>
              {updateAvailable ? (
                <TouchableOpacity
                  style={[styles.otaActionButton, { backgroundColor: '#2E7D32' }]}
                  onPress={handleApplyUpdate}
                  disabled={isDownloadingUpdate}
                >
                  {isDownloadingUpdate ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                      <Text style={styles.otaActionButtonText}>
                        नया अपडेट लागू करें • Apply & Reload
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.otaActionButton, { backgroundColor: Colors.saffron }]}
                  onPress={handleCheckUpdates}
                  disabled={isCheckingUpdate}
                >
                  {isCheckingUpdate ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      <Text style={styles.otaActionButtonText}>
                        अपडेट जांचें • Check for Updates
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.otaGuideBtn, { borderColor: theme.border }]}
                onPress={handleShowOTAGuide}
              >
                <Ionicons name="help-circle-outline" size={18} color={theme.textSecondary} />
                <Text style={[styles.otaGuideBtnText, { color: theme.textSecondary }]}>
                  सर्वर गाइड
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Actions: Share & Reset */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.actionRow} onPress={handleShareApp}>
              <Ionicons name="share-social-outline" size={20} color={theme.accent} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                ऐप साझा करें • Share My Prayer
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/onboarding')}
            >
              <Ionicons name="sparkles-outline" size={20} color={theme.accent} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                ऑनबोर्डिंग फिर से देखें • Revisit Onboarding
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.actionRow} onPress={handleResetPreferences}>
              <Ionicons name="refresh-outline" size={20} color="#D32F2F" />
              <Text style={[styles.actionText, { color: '#D32F2F' }]}>
                प्राथमिकताएं रीसेट करें • Reset Preferences
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            My Prayer v1.0.0 • सम्पूर्ण आध्यात्मिक संकलन
          </Text>
          <Text style={[styles.footerSubText, { color: theme.textMuted }]}>
            सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः
          </Text>
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
    marginBottom: Spacing.lg,
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  offlineIcon: {
    marginRight: Spacing.md,
  },
  offlineContent: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  offlineDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  religionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  religionSymbol: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  religionInfo: {
    flex: 1,
  },
  religionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  religionName: {
    fontSize: 15,
    fontWeight: '700',
  },
  comingSoonBadge: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B24900',
  },
  religionTagline: {
    fontSize: 12,
    marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  fontBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
  },
  switchLabelArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerSubText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  otaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  otaIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  otaTitleInfo: {
    flex: 1,
  },
  otaMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: 8,
  },
  otaMetaItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: 8,
  },
  otaMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  otaMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  otaButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: 8,
  },
  otaActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Spacing.pillRadius,
    gap: 6,
  },
  otaActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  otaGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Spacing.pillRadius,
    borderWidth: 1,
    gap: 4,
  },
  otaGuideBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

