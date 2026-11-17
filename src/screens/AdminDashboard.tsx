import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useApp } from '../context';
import {
  supabase,
  isSupabaseConfigured,
  STORAGE_BUCKETS,
  fetchReligions,
  createReligion,
  updateReligion,
  deleteReligion,
  fetchDeities,
  createDeity,
  updateDeity,
  deleteDeity,
  fetchPrayers,
  createPrayer,
  updatePrayer,
  deletePrayer,
  fetchVersesForPrayer,
  createVerse,
  deleteVerse,
  fetchAppConfig,
  updateAppConfig,
  uploadToStorage,
} from '../services/supabase';
import { DbReligion, DbDeity, DbPrayer, DbVerse, Deity, PrayerItem } from '../types';

type AdminTab = 'religions' | 'deities' | 'prayers' | 'branding';

export function AdminDashboardScreen() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Auth State
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('religions');

  // Data States
  const [religions, setReligions] = useState<DbReligion[]>([]);
  const [deities, setDeities] = useState<Deity[]>([]);
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [appConfig, setAppConfig] = useState<Record<string, string>>({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [religionModalVisible, setReligionModalVisible] = useState(false);
  const [selectedReligion, setSelectedReligion] = useState<Partial<DbReligion> | null>(null);

  const [deityModalVisible, setDeityModalVisible] = useState(false);
  const [selectedDeity, setSelectedDeity] = useState<Partial<DbDeity> & { id?: string } | null>(null);
  const [deityImageUploading, setDeityImageUploading] = useState(false);

  const [prayerModalVisible, setPrayerModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Partial<DbPrayer> & { id?: string } | null>(null);
  const [prayerAudioUploading, setPrayerAudioUploading] = useState(false);
  const [prayerVerses, setPrayerVerses] = useState<DbVerse[]>([]);
  const [newVerseTextHi, setNewVerseTextHi] = useState('');
  const [newVerseTextEn, setNewVerseTextEn] = useState('');
  const [newVerseMeaning, setNewVerseMeaning] = useState('');

  // Branding Inputs
  const [brandTitle, setBrandTitle] = useState('');
  const [brandIconUrl, setBrandIconUrl] = useState('');
  const [brandSplashUrl, setBrandSplashUrl] = useState('');

  // Check auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load section data
  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [rels, deits, prs, cfg] = await Promise.all([
        fetchReligions(),
        fetchDeities(),
        fetchPrayers(),
        fetchAppConfig(),
      ]);
      setReligions(rels);
      setDeities(deits);
      setPrayers(prs);
      setAppConfig(cfg);
      setBrandTitle(cfg.app_title || 'My Prayer');
      setBrandIconUrl(cfg.app_icon_url || '');
      setBrandSplashUrl(cfg.splash_image_url || '');
    } catch (err) {
      console.warn('Dashboard data load warning:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session, loadDashboardData]);

  // Handle Login
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError('कृपया ईमेल और पासवर्ड दर्ज करें (Enter email and password)');
      return;
    }
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setAuthError(error.message || 'लॉगिन असफल (Authentication failed)');
      } else {
        setSession(data.session);
      }
    } catch (err: any) {
      setAuthError(err.message || 'त्रुटि हुई (An error occurred)');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  /* =========================================================================
     RELIGION ACTIONS
     ========================================================================= */
  const handleOpenReligionModal = (religion?: DbReligion) => {
    setSelectedReligion(
      religion || {
        slug: '',
        name_en: '',
        name_hi: '',
        icon_url: '',
        is_active: true,
      }
    );
    setReligionModalVisible(true);
  };

  const handleSaveReligion = async () => {
    if (!selectedReligion?.name_en || !selectedReligion?.name_hi || !selectedReligion?.slug) {
      Alert.alert('त्रुटि', 'कृपया धर्म का नाम (हिन्दी/अंग्रेजी) और स्लग दर्ज करें।');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedReligion.id) {
        await updateReligion(selectedReligion.id, {
          name_en: selectedReligion.name_en,
          name_hi: selectedReligion.name_hi,
          slug: selectedReligion.slug,
          icon_url: selectedReligion.icon_url || null,
          is_active: selectedReligion.is_active ?? true,
        });
      } else {
        await createReligion({
          name_en: selectedReligion.name_en,
          name_hi: selectedReligion.name_hi,
          slug: selectedReligion.slug,
          icon_url: selectedReligion.icon_url || null,
          is_active: selectedReligion.is_active ?? true,
        });
      }
      setReligionModalVisible(false);
      loadDashboardData();
      Alert.alert('सफलता', 'धर्म सफलतापूर्वक सहेजा गया।');
    } catch (e: any) {
      Alert.alert('त्रुटि', e.message || 'सहेजने में विफल');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReligion = (id: string, name: string) => {
    Alert.alert('पुष्टि करें', `क्या आप "${name}" को हटाना चाहते हैं?`, [
      { text: 'रद्द करें', style: 'cancel' },
      {
        text: 'हटाएं',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReligion(id);
            loadDashboardData();
          } catch (e: any) {
            Alert.alert('त्रुटि', e.message || 'हटाने में विफल');
          }
        },
      },
    ]);
  };

  /* =========================================================================
     DEITY ACTIONS & IMAGE UPLOAD
     ========================================================================= */
  const handleOpenDeityModal = (deity?: Deity) => {
    if (deity) {
      setSelectedDeity({
        id: deity.id,
        name_en: deity.nameEnglish,
        name_hi: deity.nameHindi,
        significance: deity.significance,
        display_order: 1,
        is_popular: true,
        image_url: deity.imageUrl || null,
        avatar_icon: deity.avatarIcon,
        color: deity.color,
      });
    } else {
      setSelectedDeity({
        name_en: '',
        name_hi: '',
        significance: '',
        display_order: deities.length + 1,
        is_popular: false,
        image_url: null,
        avatar_icon: '🕉️',
        color: '#FF6F00',
      });
    }
    setDeityModalVisible(true);
  };

  const handlePickDeityImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('अनुमति आवश्यक', 'कृपया फोटो गैलरी की अनुमति दें।');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setDeityImageUploading(true);
        const fileName = `${selectedDeity?.name_en || 'deity'}_${Date.now()}.jpg`;
        const uploadedUrl = await uploadToStorage(
          STORAGE_BUCKETS.DEITY_IMAGES,
          asset.uri,
          fileName,
          asset.mimeType || 'image/jpeg'
        );
        setSelectedDeity((prev) => ({ ...prev, image_url: uploadedUrl }));
        Alert.alert('सफलता', 'चित्र सफलतापूर्वक अपलोड हुआ!');
      }
    } catch (e: any) {
      Alert.alert('अपलोड त्रुटि', e.message || 'छवि अपलोड नहीं हो सकी।');
    } finally {
      setDeityImageUploading(false);
    }
  };

  const handleSaveDeity = async () => {
    if (!selectedDeity?.name_en || !selectedDeity?.name_hi) {
      Alert.alert('त्रुटि', 'देवी-देवता का नाम (हिन्दी व अंग्रेजी) अनिवार्य है।');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Omit<DbDeity, 'id'> = {
        name_en: selectedDeity.name_en,
        name_hi: selectedDeity.name_hi,
        significance: selectedDeity.significance || '',
        display_order: Number(selectedDeity.display_order) || 1,
        is_popular: Boolean(selectedDeity.is_popular),
        image_url: selectedDeity.image_url || null,
        color: selectedDeity.color || '#FF6F00',
        avatar_icon: selectedDeity.avatar_icon || '🕉️',
      };

      if (selectedDeity.id) {
        await updateDeity(selectedDeity.id, payload);
      } else {
        await createDeity(payload);
      }
      setDeityModalVisible(false);
      loadDashboardData();
      Alert.alert('सफलता', 'देवी-देवता विवरण सहेजा गया।');
    } catch (e: any) {
      Alert.alert('त्रुटि', e.message || 'सहेजने में विफल');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDeity = (id: string, name: string) => {
    Alert.alert('पुष्टि करें', `क्या आप "${name}" को हटाना चाहते हैं?`, [
      { text: 'रद्द करें', style: 'cancel' },
      {
        text: 'हटाएं',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDeity(id);
            loadDashboardData();
          } catch (e: any) {
            Alert.alert('त्रुटि', e.message || 'हटाने में विफल');
          }
        },
      },
    ]);
  };

  /* =========================================================================
     PRAYER ACTIONS & MP3 AUDIO UPLOAD
     ========================================================================= */
  const handleOpenPrayerModal = async (prayer?: PrayerItem) => {
    if (prayer) {
      setSelectedPrayer({
        id: prayer.id,
        deity_id: prayer.deityId,
        category: prayer.category,
        title_en: prayer.titleEnglish,
        title_hi: prayer.titleHindi,
        subtitle_hi: prayer.subtitleHindi || null,
        subtitle_en: prayer.subtitleEnglish || null,
        audio_url: prayer.audioUrl || null,
        duration_seconds: prayer.audioDurationSeconds || prayer.durationMinutes * 60,
        is_featured: false,
        significance: prayer.significance || null,
      });

      // Load remote verses if available
      try {
        const verses = await fetchVersesForPrayer(prayer.id);
        setPrayerVerses(verses);
      } catch {
        // Fallback to local verses
        setPrayerVerses(
          prayer.verses.map((v, i) => ({
            id: `local-${i}`,
            prayer_id: prayer.id,
            verse_number: v.number || i + 1,
            text_hi: v.hindi,
            text_en: v.englishTransliteration,
            meaning_en: v.englishMeaning,
          }))
        );
      }
    } else {
      setSelectedPrayer({
        deity_id: deities[0]?.id || '',
        category: 'chalisa',
        title_en: '',
        title_hi: '',
        audio_url: null,
        duration_seconds: 480,
        is_featured: false,
      });
      setPrayerVerses([]);
    }
    setNewVerseTextHi('');
    setNewVerseTextEn('');
    setNewVerseMeaning('');
    setPrayerModalVisible(true);
  };

  const handlePickPrayerAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setPrayerAudioUploading(true);
        const fileName = `${selectedPrayer?.title_en || 'prayer'}_${Date.now()}.mp3`;
        const uploadedUrl = await uploadToStorage(
          STORAGE_BUCKETS.PRAYER_AUDIO,
          file.uri,
          fileName,
          file.mimeType || 'audio/mpeg'
        );
        setSelectedPrayer((prev) => ({ ...prev, audio_url: uploadedUrl }));
        Alert.alert('सफलता', 'ऑडियो (.mp3) सफलतापूर्वक अपलोड हुआ!');
      }
    } catch (e: any) {
      Alert.alert('अपलोड त्रुटि', e.message || 'ऑडियो अपलोड नहीं हो सका।');
    } finally {
      setPrayerAudioUploading(false);
    }
  };

  const handleAddVerseToPrayer = async () => {
    if (!newVerseTextHi.trim()) {
      Alert.alert('सूचना', 'कृपया दोहा या चौपाई की हिन्दी पंक्ति दर्ज करें।');
      return;
    }

    const nextNumber = prayerVerses.length + 1;
    const newVerseItem: DbVerse = {
      id: `temp-${Date.now()}`,
      prayer_id: selectedPrayer?.id || '',
      verse_number: nextNumber,
      text_hi: newVerseTextHi.trim(),
      text_en: newVerseTextEn.trim() || null,
      meaning_en: newVerseMeaning.trim() || null,
    };

    if (selectedPrayer?.id) {
      try {
        const created = await createVerse({
          prayer_id: selectedPrayer.id,
          verse_number: nextNumber,
          text_hi: newVerseTextHi.trim(),
          text_en: newVerseTextEn.trim() || null,
          meaning_en: newVerseMeaning.trim() || null,
        });
        setPrayerVerses((prev) => [...prev, created]);
      } catch {
        setPrayerVerses((prev) => [...prev, newVerseItem]);
      }
    } else {
      setPrayerVerses((prev) => [...prev, newVerseItem]);
    }

    setNewVerseTextHi('');
    setNewVerseTextEn('');
    setNewVerseMeaning('');
  };

  const handleDeleteVerse = async (verseId: string) => {
    if (!verseId.startsWith('temp-') && !verseId.startsWith('local-')) {
      try {
        await deleteVerse(verseId);
      } catch {}
    }
    setPrayerVerses((prev) => prev.filter((v) => v.id !== verseId));
  };

  const handleSavePrayer = async () => {
    if (!selectedPrayer?.title_en || !selectedPrayer?.title_hi || !selectedPrayer?.deity_id) {
      Alert.alert('त्रुटि', 'शीर्षक और देवी-देवता चयन अनिवार्य है।');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Omit<DbPrayer, 'id'> = {
        deity_id: selectedPrayer.deity_id,
        category: selectedPrayer.category || 'chalisa',
        title_en: selectedPrayer.title_en,
        title_hi: selectedPrayer.title_hi,
        subtitle_hi: selectedPrayer.subtitle_hi || null,
        subtitle_en: selectedPrayer.subtitle_en || null,
        audio_url: selectedPrayer.audio_url || null,
        duration_seconds: Number(selectedPrayer.duration_seconds) || 480,
        is_featured: Boolean(selectedPrayer.is_featured),
        significance: selectedPrayer.significance || null,
      };

      if (selectedPrayer.id) {
        await updatePrayer(selectedPrayer.id, payload);
      } else {
        const versesPayload = prayerVerses.map((v, i) => ({
          verse_number: i + 1,
          text_hi: v.text_hi,
          text_en: v.text_en || null,
          meaning_en: v.meaning_en || null,
        }));
        await createPrayer(payload, versesPayload);
      }

      setPrayerModalVisible(false);
      loadDashboardData();
      Alert.alert('सफलता', 'प्रार्थना एवं ऑडियो विवरण सहेजा गया।');
    } catch (e: any) {
      Alert.alert('त्रुटि', e.message || 'सहेजने में विफल');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrayer = (id: string, title: string) => {
    Alert.alert('पुष्टि करें', `क्या आप "${title}" को हटाना चाहते हैं?`, [
      { text: 'रद्द करें', style: 'cancel' },
      {
        text: 'हटाएं',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePrayer(id);
            loadDashboardData();
          } catch (e: any) {
            Alert.alert('त्रुटि', e.message || 'हटाने में विफल');
          }
        },
      },
    ]);
  };

  /* =========================================================================
     APP BRANDING & METADATA ACTIONS
     ========================================================================= */
  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateAppConfig('app_title', brandTitle.trim()),
        updateAppConfig('app_icon_url', brandIconUrl.trim()),
        updateAppConfig('splash_image_url', brandSplashUrl.trim()),
      ]);
      Alert.alert('सफलता', 'ऐप विन्यास एवं ब्रांडिंग सफलतापूर्वक अपडेट हो गई।');
    } catch (e: any) {
      Alert.alert('त्रुटि', e.message || 'अपडेट करने में विफल');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickBrandAsset = async (type: 'icon' | 'splash') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsSaving(true);
        const asset = result.assets[0];
        const fileName = `${type}_${Date.now()}.png`;
        const uploadedUrl = await uploadToStorage(
          STORAGE_BUCKETS.APP_ASSETS,
          asset.uri,
          fileName,
          'image/png'
        );
        if (type === 'icon') setBrandIconUrl(uploadedUrl);
        else setBrandSplashUrl(uploadedUrl);
        Alert.alert('सफलता', `${type === 'icon' ? 'ऐप आइकन' : 'स्प्लैश स्क्रीन'} अपलोड हुआ!`);
      }
    } catch (e: any) {
      Alert.alert('त्रुटि', e.message || 'अपलोड विफल');
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================================
     RENDER: LOGIN SCREEN (If not authenticated)
     ========================================================================= */
  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topBackNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.screenHeaderTitle, { color: theme.textPrimary }]}>
              प्रशासन प्रमाणीकरण (Admin Auth)
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.loginContent}>
            <View style={[styles.loginCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              <View style={styles.loginIconContainer}>
                <Ionicons name="shield-checkmark" size={44} color={Colors.saffron} />
              </View>

              <Text style={[styles.loginTitle, { color: theme.textPrimary }]}>
                माई प्रेयर प्रशासन केंद्र
              </Text>
              <Text style={[styles.loginSubtitle, { color: theme.textSecondary }]}>
                Supabase Auth से सुरक्षित प्रशासक लॉगिन
              </Text>

              {!isSupabaseConfigured && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={18} color="#E65100" />
                  <Text style={styles.warningText}>
                    पर्यावरण चर (EXPO_PUBLIC_SUPABASE_URL) अभी सेट नहीं है। यदि आपने परीक्षण क्रेडेंशियल्स दर्ज किए हैं, तो नीचे टेस्ट बाईपास का उपयोग कर सकते हैं।
                  </Text>
                </View>
              )}

              {authError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  ईमेल पता (Admin Email)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@myprayer.app"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  पासवर्ड (Password)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isAuthenticating && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>प्रवेश करें (Sign In)</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Developer Test Mode Bypass */}
              <TouchableOpacity
                style={styles.devBypassBtn}
                onPress={() => {
                  setSession({ user: { email: 'admin@myprayer.local' } });
                }}
              >
                <Text style={styles.devBypassText}>
                  डेवलपर मोड में डैशबोर्ड देखें (Preview Dashboard)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  /* =========================================================================
     RENDER: AUTHENTICATED ADMIN DASHBOARD
     ========================================================================= */
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Navbar */}
      <View style={[styles.dashboardHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerMainTitle, { color: theme.textPrimary }]}>
              प्रशासन डैशबोर्ड
            </Text>
            <Text style={[styles.headerAdminEmail, { color: theme.textSecondary }]} numberOfLines={1}>
              {session?.user?.email || 'Admin'}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>लॉगआउट</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'religions' && styles.activeTabItem]}
          onPress={() => setActiveTab('religions')}
        >
          <Text style={[styles.tabLabel, activeTab === 'religions' ? styles.activeTabLabel : { color: theme.textSecondary }]}>
            🕉️ धर्म
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'deities' && styles.activeTabItem]}
          onPress={() => setActiveTab('deities')}
        >
          <Text style={[styles.tabLabel, activeTab === 'deities' ? styles.activeTabLabel : { color: theme.textSecondary }]}>
            🌸 देवी-देवता
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'prayers' && styles.activeTabItem]}
          onPress={() => setActiveTab('prayers')}
        >
          <Text style={[styles.tabLabel, activeTab === 'prayers' ? styles.activeTabLabel : { color: theme.textSecondary }]}>
            📜 पाठ व ऑडियो
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'branding' && styles.activeTabItem]}
          onPress={() => setActiveTab('branding')}
        >
          <Text style={[styles.tabLabel, activeTab === 'branding' ? styles.activeTabLabel : { color: theme.textSecondary }]}>
            ⚙️ विन्यास
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {isLoadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.saffron} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            डेटा लोड हो रहा है...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.dashboardContent}>
          {/* TAB 1: RELIGIONS */}
          {activeTab === 'religions' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  धर्म प्रबंधन ({religions.length})
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleOpenReligionModal()}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>नया धर्म जोड़ें</Text>
                </TouchableOpacity>
              </View>

              {religions.map((r) => (
                <View
                  key={r.id}
                  style={[styles.itemCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                >
                  <View style={styles.itemCardLeft}>
                    <Text style={styles.itemEmoji}>{r.icon_url || '🕉️'}</Text>
                    <View>
                      <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                        {r.name_hi} ({r.name_en})
                      </Text>
                      <Text style={[styles.itemSub, { color: theme.textSecondary }]}>
                        स्लग: {r.slug} • स्थिति: {r.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => handleOpenReligionModal(r)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.saffron} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteReligion(r.id, r.name_hi)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: DEITIES */}
          {activeTab === 'deities' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  देवी-देवता सूची ({deities.length})
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleOpenDeityModal()}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>नए देवता जोड़ें</Text>
                </TouchableOpacity>
              </View>

              {deities.map((d) => (
                <View
                  key={d.id}
                  style={[styles.itemCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                >
                  <View style={styles.itemCardLeft}>
                    {d.imageUrl ? (
                      <Image source={{ uri: d.imageUrl }} style={styles.cardThumb} />
                    ) : (
                      <View style={[styles.cardThumbPlaceholder, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={{ fontSize: 24 }}>{d.avatarIcon || '🕉️'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                          {d.nameHindi}
                        </Text>
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>लोकप्रिय</Text>
                        </View>
                      </View>
                      <Text style={[styles.itemSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        {d.nameEnglish} • {d.associatedDayHindi}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => handleOpenDeityModal(d)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.saffron} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteDeity(d.id, d.nameHindi)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: PRAYERS & AUDIO */}
          {activeTab === 'prayers' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  चालीसा, आरती व स्तुति ({prayers.length})
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleOpenPrayerModal()}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>नया पाठ जोड़ें</Text>
                </TouchableOpacity>
              </View>

              {prayers.map((p) => (
                <View
                  key={p.id}
                  style={[styles.itemCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
                >
                  <View style={[styles.itemCardLeft, { flex: 1 }]}>
                    <View style={styles.prayerCategoryIcon}>
                      <Ionicons
                        name={p.audioUrl ? 'musical-notes' : 'document-text-outline'}
                        size={22}
                        color={p.audioUrl ? Colors.saffron : theme.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                        {p.titleHindi}
                      </Text>
                      <Text style={[styles.itemSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        {p.titleEnglish} • {p.category.toUpperCase()} • {p.durationMinutes} मिनट
                      </Text>
                      {p.audioUrl ? (
                        <View style={styles.audioActivePill}>
                          <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                          <Text style={styles.audioActivePillText}>डायनामिक ऑडियो लिंक मौजूद</Text>
                        </View>
                      ) : (
                        <Text style={[styles.itemSub, { color: '#888', fontStyle: 'italic' }]}>
                          स्थानीय ऑडियो फ़ॉलबैक
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => handleOpenPrayerModal(p)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.saffron} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePrayer(p.id, p.titleHindi)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: APP BRANDING & METADATA */}
          {activeTab === 'branding' && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 14 }]}>
                ऐप विन्यास एवं रिमोट ब्रांडिंग
              </Text>

              <View style={[styles.formCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    ऐप का शीर्षक (App Title)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                    value={brandTitle}
                    onChangeText={setBrandTitle}
                    placeholder="My Prayer • माई प्रेयर"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>

                {/* App Icon */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    रिमोट ऐप आइकन URL (App Icon)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[
                        styles.textInput,
                        { flex: 1, color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                      ]}
                      value={brandIconUrl}
                      onChangeText={setBrandIconUrl}
                      placeholder="https://.../icon.png"
                      placeholderTextColor={theme.textSecondary}
                    />
                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      onPress={() => handlePickBrandAsset('icon')}
                    >
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  {brandIconUrl ? (
                    <Image source={{ uri: brandIconUrl }} style={styles.previewImage} resizeMode="contain" />
                  ) : null}
                </View>

                {/* Splash Screen */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    रिमोट स्प्लैश स्क्रीन छवि URL (Splash Screen)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[
                        styles.textInput,
                        { flex: 1, color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                      ]}
                      value={brandSplashUrl}
                      onChangeText={setBrandSplashUrl}
                      placeholder="https://.../splash.png"
                      placeholderTextColor={theme.textSecondary}
                    />
                    <TouchableOpacity
                      style={styles.uploadMiniBtn}
                      onPress={() => handlePickBrandAsset('splash')}
                    >
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  {brandSplashUrl ? (
                    <Image source={{ uri: brandSplashUrl }} style={styles.previewImage} resizeMode="contain" />
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                  onPress={handleSaveBranding}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryButtonText}>विन्यास सहेजें (Save Config)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* =========================================================================
         MODAL 1: RELIGION CREATE / EDIT
         ========================================================================= */}
      <Modal visible={religionModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {selectedReligion?.id ? 'धर्म संपादित करें' : 'नया धर्म जोड़ें'}
              </Text>
              <TouchableOpacity onPress={() => setReligionModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  धर्म का नाम (हिन्दी)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedReligion?.name_hi || ''}
                  onChangeText={(t) => setSelectedReligion((p) => ({ ...p, name_hi: t }))}
                  placeholder="उदा: सनातन धर्म"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  धर्म का नाम (English)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedReligion?.name_en || ''}
                  onChangeText={(t) => setSelectedReligion((p) => ({ ...p, name_en: t }))}
                  placeholder="उदा: Hinduism"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  स्लग (Slug / Identifier)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedReligion?.slug || ''}
                  onChangeText={(t) => setSelectedReligion((p) => ({ ...p, slug: t }))}
                  placeholder="उदा: hinduism"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  प्रतीक चिन्ह (Icon / Emoji)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedReligion?.icon_url || ''}
                  onChangeText={(t) => setSelectedReligion((p) => ({ ...p, icon_url: t }))}
                  placeholder="उदा: 🕉️ या https://..."
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>सक्रिय स्थिति (Active):</Text>
                <Switch
                  value={selectedReligion?.is_active ?? true}
                  onValueChange={(v) => setSelectedReligion((p) => ({ ...p, is_active: v }))}
                  trackColor={{ true: Colors.saffron, false: '#888' }}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveReligion}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>सहेजें (Save)</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* =========================================================================
         MODAL 2: DEITY CREATE / EDIT & STORAGE UPLOAD
         ========================================================================= */}
      <Modal visible={deityModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {selectedDeity?.id ? 'देवी-देवता संपादित करें' : 'नए देवी-देवता जोड़ें'}
              </Text>
              <TouchableOpacity onPress={() => setDeityModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  नाम (हिन्दी)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedDeity?.name_hi || ''}
                  onChangeText={(t) => setSelectedDeity((p) => ({ ...p, name_hi: t }))}
                  placeholder="उदा: श्री हनुमान जी"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  नाम (English)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedDeity?.name_en || ''}
                  onChangeText={(t) => setSelectedDeity((p) => ({ ...p, name_en: t }))}
                  placeholder="उदा: Lord Hanuman"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  महिमा व विवरण (Significance)
                </Text>
                <TextInput
                  style={[styles.textInput, { height: 70, color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedDeity?.significance || ''}
                  onChangeText={(t) => setSelectedDeity((p) => ({ ...p, significance: t }))}
                  placeholder="उदा: संकटमोचन, बल और भक्ति के प्रतीक"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                />
              </View>

              {/* Deity Image Picker & Storage Upload */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  देवी-देवता का पावन चित्र (Supabase Storage: deity-images)
                </Text>
                <View style={styles.uploadRow}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handlePickDeityImage}
                    disabled={deityImageUploading}
                  >
                    {deityImageUploading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.uploadButtonText}>गैलरी से चित्र चुनें व अपलोड करें</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {selectedDeity?.image_url ? (
                  <View style={styles.previewImageContainer}>
                    <Image source={{ uri: selectedDeity.image_url }} style={styles.deityImagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setSelectedDeity((p) => ({ ...p, image_url: null }))}
                    >
                      <Ionicons name="trash" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Display Order & Popular Toggle */}
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>प्रदर्शन क्रम (Order):</Text>
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                    value={String(selectedDeity?.display_order ?? 1)}
                    onChangeText={(t) => setSelectedDeity((p) => ({ ...p, display_order: Number(t) || 1 }))}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>होम स्क्रीन पर लोकप्रिय:</Text>
                  <Switch
                    value={selectedDeity?.is_popular ?? false}
                    onValueChange={(v) => setSelectedDeity((p) => ({ ...p, is_popular: v }))}
                    trackColor={{ true: Colors.saffron, false: '#888' }}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveDeity}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>सहेजें (Save)</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* =========================================================================
         MODAL 3: PRAYER CREATE / EDIT, AUDIO UPLOAD & VERSES MANAGER
         ========================================================================= */}
      <Modal visible={prayerModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCardLarge, { backgroundColor: theme.surfaceCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {selectedPrayer?.id ? 'पाठ एवं ऑडियो संपादित करें' : 'नया पाठ व ऑडियो जोड़ें'}
              </Text>
              <TouchableOpacity onPress={() => setPrayerModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  शीर्षक (हिन्दी)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedPrayer?.title_hi || ''}
                  onChangeText={(t) => setSelectedPrayer((p) => ({ ...p, title_hi: t }))}
                  placeholder="उदा: श्री हनुमान चालीसा"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  शीर्षक (English)
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                  value={selectedPrayer?.title_en || ''}
                  onChangeText={(t) => setSelectedPrayer((p) => ({ ...p, title_en: t }))}
                  placeholder="उदा: Shri Hanuman Chalisa"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* Select Deity */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  संबंधित देवी-देवता चुनें (Select Deity)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {deities.map((d) => {
                    const isSelected = selectedPrayer?.deity_id === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => setSelectedPrayer((p) => ({ ...p, deity_id: d.id }))}
                        style={[
                          styles.deitySelectChip,
                          isSelected && { backgroundColor: Colors.saffron, borderColor: Colors.saffron },
                        ]}
                      >
                        <Text style={[styles.deitySelectText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {d.nameHindi}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Category Pills */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>श्रेणी (Category)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(['chalisa', 'aarti', 'katha', 'mantra', 'stotra'] as const).map((cat) => {
                    const isSelected = selectedPrayer?.category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setSelectedPrayer((p) => ({ ...p, category: cat }))}
                        style={[
                          styles.categorySelectChip,
                          isSelected && { backgroundColor: Colors.saffronDark, borderColor: Colors.saffronDark },
                        ]}
                      >
                        <Text style={[styles.categorySelectText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* MP3 Audio Upload */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  ऑडियो फ़ाइल (.mp3 Storage: prayer-audio)
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { flex: 1, color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                    value={selectedPrayer?.audio_url || ''}
                    onChangeText={(t) => setSelectedPrayer((p) => ({ ...p, audio_url: t }))}
                    placeholder="ऑडियो लिंक या नीचे से .mp3 अपलोड करें"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.uploadMiniBtn}
                    onPress={handlePickPrayerAudio}
                    disabled={prayerAudioUploading}
                  >
                    {prayerAudioUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
                {selectedPrayer?.audio_url ? (
                  <Text style={{ fontSize: 11, color: '#2E7D32', marginTop: 4 }}>
                    ✓ ऑडियो सक्रिय रूप से जुड़ा हुआ है।
                  </Text>
                ) : null}
              </View>

              {/* Verses Manager */}
              <View style={[styles.versesSection, { borderColor: theme.border }]}>
                <Text style={[styles.versesSectionTitle, { color: theme.textPrimary }]}>
                  दोहा / चौपाई / श्लोक प्रबंधन ({prayerVerses.length})
                </Text>

                {prayerVerses.map((v, idx) => (
                  <View key={v.id || idx} style={[styles.verseItemRow, { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.verseNumberText, { color: Colors.saffron }]}>
                        श्लोक / चौपाई #{v.verse_number}
                      </Text>
                      <Text style={[styles.verseTextHi, { color: theme.textPrimary }]}>
                        {v.text_hi}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteVerse(v.id)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={16} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Verse Inputs */}
                <View style={{ marginTop: 10 }}>
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                    value={newVerseTextHi}
                    onChangeText={setNewVerseTextHi}
                    placeholder="नई चौपाई या श्लोक पंक्ति (हिन्दी)"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      { marginTop: 6, color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                    value={newVerseTextEn}
                    onChangeText={setNewVerseTextEn}
                    placeholder="English Transliteration (वैकल्पिक)"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      { marginTop: 6, color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                    value={newVerseMeaning}
                    onChangeText={setNewVerseMeaning}
                    placeholder="भावार्थ / Meaning (वैकल्पिक)"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TouchableOpacity style={styles.addVerseBtn} onPress={handleAddVerseToPrayer}>
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.addVerseBtnText}>यह श्लोक जोड़ें (Add Verse)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSavePrayer}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>सम्पूर्ण पाठ सहेजें (Save Prayer)</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  topBackNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  screenHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  loginCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  loginIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: Colors.saffron,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  devBypassBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  devBypassText: {
    fontSize: 12,
    color: Colors.saffronDark,
    textDecorationLine: 'underline',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMainTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerAdminEmail: {
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  logoutText: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: Colors.saffron,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: Colors.saffron,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  dashboardContent: {
    padding: Spacing.screenPadding,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: Colors.saffron,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 26,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    padding: 6,
  },
  cardThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  popularBadgeText: {
    color: '#E65100',
    fontSize: 10,
    fontWeight: '700',
  },
  prayerCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  audioActivePillText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  formCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  uploadMiniBtn: {
    backgroundColor: Colors.saffron,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalCardLarge: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  uploadRow: {
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: Colors.saffron,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  previewImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    marginTop: 6,
  },
  deityImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deitySelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    backgroundColor: '#F5F5F5',
  },
  deitySelectText: {
    fontSize: 12,
    color: '#333',
  },
  categorySelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    backgroundColor: '#F5F5F5',
  },
  categorySelectText: {
    fontSize: 11,
    color: '#333',
  },
  versesSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  versesSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  verseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  verseNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  verseTextHi: {
    fontSize: 13,
    marginTop: 2,
  },
  addVerseBtn: {
    backgroundColor: Colors.saffronDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  addVerseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
