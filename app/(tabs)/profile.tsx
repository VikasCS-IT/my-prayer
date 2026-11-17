import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { useApp } from '../../src/context';
import {
  supabase,
  signInUserProfile,
  signUpUserProfile,
  signOutUserProfile,
  fetchUserProfile,
} from '../../src/services/supabase';
import { DbProfile, ReadingTheme, ReadingLanguage } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    isDarkMode,
    toggleDarkMode,
    bookmarks,
    recentlyRead,
    readingLanguage,
    setReadingLanguage,
    fontSizeMultiplier,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    readingTheme,
    setReadingTheme,
    availableLanguages,
  } = useApp();

  const isEnglishOnly = readingLanguage === 'english';
  const isHindiOnly = readingLanguage === 'hindi';

  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Session & Profile State
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Auth Form State (When not logged in)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [signupName, setSignupName] = useState<string>('');
  const [signupMobile, setSignupMobile] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupAge, setSignupAge] = useState<string>('');
  const [signupGender, setSignupGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [signupPhotoUri, setSignupPhotoUri] = useState<string | null>(null);

  // Sub-Modals
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false);
  const [contactModalVisible, setContactModalVisible] = useState<boolean>(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState<boolean>(false);

  // Check auth state on mount
  const checkCurrentSession = useCallback(async () => {
    setIsInitializing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
        const userProfile = await fetchUserProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setSessionUser(null);
        setProfile(null);
      }
    } catch (e) {
      console.warn('Session check warning:', e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    checkCurrentSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        const p = await fetchUserProfile(session.user.id);
        setProfile(p);
      } else {
        setSessionUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkCurrentSession]);

  // Pick Photo for Registration
  const handlePickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('अनुमति आवश्यक', 'कृपया प्रोफाइल फोटो चुनने के लिए गैलरी की अनुमति दें।');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSignupPhotoUri(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('त्रुटि', e.message || 'फोटो चुनने में असमर्थ');
    }
  };

  // Handle Login
  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setAuthError('कृपया मोबाइल नंबर/ईमेल और पासवर्ड दर्ज करें।');
      return;
    }
    setAuthError(null);
    setIsLoadingAuth(true);

    try {
      const { user, profile: loggedInProfile } = await signInUserProfile({
        identifier: loginIdentifier.trim(),
        password: loginPassword.trim(),
      });
      setSessionUser(user);
      setProfile(loggedInProfile);
      setLoginPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'लॉगिन विफल हुआ। कृपया जांचें।');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    if (!signupName.trim()) {
      setAuthError('कृपया अपना पूरा नाम दर्ज करें।');
      return;
    }
    if (!signupMobile.trim() || signupMobile.trim().length < 10) {
      setAuthError('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!signupPassword.trim() || signupPassword.trim().length < 6) {
      setAuthError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    setAuthError(null);
    setIsLoadingAuth(true);

    try {
      const { user, profile: createdProfile } = await signUpUserProfile({
        name: signupName.trim(),
        mobile: signupMobile.trim(),
        email: signupEmail.trim() || undefined,
        password: signupPassword.trim(),
        age: Number(signupAge) || undefined,
        gender: signupGender,
        photoUri: signupPhotoUri || undefined,
      });

      setSessionUser(user);
      setProfile(createdProfile);
      Alert.alert('सफलता', 'आपका खाता सफलतापूर्वक बन गया है! 🌸');
    } catch (err: any) {
      setAuthError(err.message || 'पंजीकरण में समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    Alert.alert('लॉगआउट', 'क्या आप My Prayer से लॉगआउट करना चाहते हैं?', [
      { text: 'रद्द करें', style: 'cancel' },
      {
        text: 'लॉगआउट करें',
        style: 'destructive',
        onPress: async () => {
          await signOutUserProfile();
          setSessionUser(null);
          setProfile(null);
        },
      },
    ]);
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.saffron} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            प्रोफ़ाइल लोड हो रही है...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================================================================
     VIEW A: USER NOT LOGGED IN
     ========================================================================= */
  if (!sessionUser) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.authScrollContent}
          >
            {/* Header / Intro Card */}
            <View
              style={[
                styles.welcomeHeroCard,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              <View style={styles.heroOmCircle}>
                <Text style={styles.heroOmText}>🕉️</Text>
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? 'My Prayer Account'
                  : isHindiOnly
                  ? 'माई प्रेयर साधना खाता'
                  : 'माई प्रेयर साधना खाता • My Prayer Account'}
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                {isEnglishOnly
                  ? 'Securely save your prayer history, bookmarks, and spiritual streaks.'
                  : 'अपनी दैनिक भक्ति, चालीसा पाठ का इतिहास, बुकमार्क और साधना स्ट्रीक को सुरक्षित रूप से सहेजें।'}
              </Text>

              {/* Mode Toggle (Login vs SignUp) */}
              <View style={[styles.modeToggleContainer, { backgroundColor: isDarkMode ? '#2B2019' : '#F5EBE1' }]}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleBtn,
                    authMode === 'login' && { backgroundColor: Colors.saffron },
                  ]}
                  onPress={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      authMode === 'login'
                        ? { color: '#FFFFFF', fontWeight: '700' }
                        : { color: theme.textSecondary },
                    ]}
                  >
                    {isEnglishOnly ? 'Sign In' : isHindiOnly ? 'लॉगिन' : 'लॉगिन (Sign In)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeToggleBtn,
                    authMode === 'signup' && { backgroundColor: Colors.saffron },
                  ]}
                  onPress={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      authMode === 'signup'
                        ? { color: '#FFFFFF', fontWeight: '700' }
                        : { color: theme.textSecondary },
                    ]}
                  >
                    {isEnglishOnly ? 'Sign Up' : isHindiOnly ? 'नया खाता बनाएं' : 'नया खाता बनाएं (Sign Up)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {authError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                <Text style={styles.errorBannerText}>{authError}</Text>
              </View>
            )}

            {/* FORM CONTAINER */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              {authMode === 'login' ? (
                /* LOGIN FORM */
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      मोबाइल नंबर या ईमेल (Mobile or Email)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      value={loginIdentifier}
                      onChangeText={setLoginIdentifier}
                      placeholder="9876543210 या admin@myprayer.com"
                      placeholderTextColor={theme.textMuted}
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
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      placeholder="••••••••"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primarySubmitBtn, isLoadingAuth && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={isLoadingAuth}
                  >
                    {isLoadingAuth ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primarySubmitBtnText}>लॉगिन करें (Sign In)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* REGISTRATION FORM */
                <View>
                  {/* Photo Upload */}
                  <View style={styles.photoUploadContainer}>
                    <TouchableOpacity onPress={handlePickPhoto} style={styles.photoPickerBtn}>
                      {signupPhotoUri ? (
                        <Image source={{ uri: signupPhotoUri }} style={styles.uploadedPhotoPreview} />
                      ) : (
                        <View
                          style={[
                            styles.photoPlaceholder,
                            { backgroundColor: isDarkMode ? '#2F231B' : '#FFF3E0', borderColor: Colors.saffron },
                          ]}
                        >
                          <Ionicons name="camera-outline" size={32} color={Colors.saffron} />
                          <Text style={styles.photoPickerLabel}>फोटो जोड़ें</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {signupPhotoUri ? (
                      <TouchableOpacity
                        onPress={() => setSignupPhotoUri(null)}
                        style={styles.removePhotoBadge}
                      >
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Name */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      पूरा नाम (Full Name) *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      value={signupName}
                      onChangeText={setSignupName}
                      placeholder="उदा: राहुल शर्मा / Priya Singh"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  {/* Mobile */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      मोबाइल नंबर (Mobile Number) *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      value={signupMobile}
                      onChangeText={setSignupMobile}
                      placeholder="10 अंकों का मोबाइल नंबर"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Optional Email */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      ईमेल पता (Email - वैकल्पिक)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      value={signupEmail}
                      onChangeText={setSignupEmail}
                      placeholder="name@example.com"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      पासवर्ड (Password) *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      value={signupPassword}
                      onChangeText={setSignupPassword}
                      placeholder="कम से कम 6 अक्षर"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry
                    />
                  </View>

                  {/* Age & Gender Row */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        आयु (Age)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            color: theme.textPrimary,
                            borderColor: theme.border,
                            backgroundColor: theme.surface,
                          },
                        ]}
                        value={signupAge}
                        onChangeText={setSignupAge}
                        placeholder="उदा: 26"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={{ flex: 2 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        लिंग (Gender)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {(['Male', 'Female', 'Other'] as const).map((g) => {
                          const isSelected = signupGender === g;
                          const label = g === 'Male' ? 'पुरुष' : g === 'Female' ? 'महिला' : 'अन्य';
                          return (
                            <TouchableOpacity
                              key={g}
                              onPress={() => setSignupGender(g)}
                              style={[
                                styles.genderPill,
                                isSelected && { backgroundColor: Colors.saffron, borderColor: Colors.saffron },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.genderPillText,
                                  isSelected && { color: '#FFFFFF', fontWeight: '700' },
                                ]}
                              >
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  {/* Sign Up Submit */}
                  <TouchableOpacity
                    style={[styles.primarySubmitBtn, isLoadingAuth && { opacity: 0.7 }]}
                    onPress={handleSignUp}
                    disabled={isLoadingAuth}
                  >
                    {isLoadingAuth ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primarySubmitBtnText}>पंजीकरण पूर्ण करें (Sign Up)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quick Links & App Info (Always Accessible to Guests without Login) */}
            <View
              style={[
                styles.menuCard,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border, marginTop: 20 },
              ]}
            >
              {/* Settings / Preferences */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setSettingsModalVisible(true)}
              >
                <Ionicons name="settings-outline" size={22} color={Colors.saffron} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                    {isEnglishOnly ? 'App Preferences' : isHindiOnly ? 'ऐप सेटिंग्स' : 'ऐप सेटिंग्स (App Preferences)'}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                    {isEnglishOnly ? 'Language, font size, theme & dark mode' : 'भाषा, फ़ॉन्ट आकार, रीडर थीम व डार्क मोड'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              {/* About Us */}
              <TouchableOpacity style={styles.menuRow} onPress={() => setAboutModalVisible(true)}>
                <Ionicons name="information-circle-outline" size={22} color={Colors.saffron} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                    {isEnglishOnly ? 'About Us' : isHindiOnly ? 'हमारे बारे में' : 'हमारे बारे में (About Us)'}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                    {isEnglishOnly ? 'My Prayer mission & spiritual vision' : 'माई प्रेयर का आध्यात्मिक संकल्प एवं उद्देश्य'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              {/* Contact Us */}
              <TouchableOpacity style={styles.menuRow} onPress={() => setContactModalVisible(true)}>
                <Ionicons name="mail-outline" size={22} color={Colors.saffron} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                    {isEnglishOnly ? 'Contact & Support' : isHindiOnly ? 'संपर्क एवं सहायता' : 'संपर्क एवं सहायता (Contact Us)'}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                    {isEnglishOnly ? 'Suggestions, feedback or queries' : 'सुझाव, त्रुटि रिपोर्ट या सहयोग हेतु'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              {/* Privacy Policy */}
              <TouchableOpacity style={styles.menuRow} onPress={() => setPrivacyModalVisible(true)}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.saffron} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                    {isEnglishOnly ? 'Privacy Policy' : isHindiOnly ? 'गोपनीयता नीति' : 'गोपनीयता नीति (Privacy Policy)'}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                    {isEnglishOnly ? 'Data protection & user privacy rights' : 'साधक डेटा सुरक्षा और अधिकार'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ALL MODALS (Always accessible to guests) */}
        {renderSettingsModal()}
        {renderAboutModal()}
        {renderContactModal()}
        {renderPrivacyModal()}
      </SafeAreaView>
    );
  }

  /* =========================================================================
     VIEW B: USER IS LOGGED IN
     ========================================================================= */
  const isAdmin = profile?.role === 'admin';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Card */}
        <View
          style={[
            styles.profileHeroCard,
            { backgroundColor: theme.surfaceCard, borderColor: theme.border },
          ]}
        >
          <View style={styles.profileAvatarContainer}>
            {profile?.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.profileAvatarImage} />
            ) : (
              <View
                style={[
                  styles.profileAvatarFallback,
                  { backgroundColor: isDarkMode ? '#3B2412' : '#FFF3E0', borderColor: Colors.saffron },
                ]}
              >
                <Text style={styles.profileAvatarInitials}>
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'सा'}
                </Text>
              </View>
            )}

            {/* Role Badge */}
            <View
              style={[
                styles.roleBadge,
                isAdmin ? { backgroundColor: '#E65100' } : { backgroundColor: '#2E7D32' },
              ]}
            >
              <Text style={styles.roleBadgeText}>
                {isAdmin ? '🛡️ मुख्य प्रशासक (Admin)' : '🌸 समर्पित साधक (User)'}
              </Text>
            </View>
          </View>

          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {profile?.name || 'आदरणीय साधक'}
          </Text>

          <Text style={[styles.userContactText, { color: theme.textSecondary }]}>
            {profile?.mobile ? `📱 +91 ${profile.mobile}` : ''}
            {profile?.mobile && sessionUser?.email ? ' • ' : ''}
            {sessionUser?.email ? `✉️ ${sessionUser.email}` : ''}
          </Text>

          {Boolean(profile?.age || profile?.gender) && (
            <View style={styles.metaRow}>
              {profile?.gender && (
                <View style={[styles.metaPill, { backgroundColor: isDarkMode ? '#2D2018' : '#F5EBE1' }]}>
                  <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
                    {profile.gender === 'Male' ? 'पुरुष (Male)' : profile.gender === 'Female' ? 'महिला (Female)' : 'अन्य (Other)'}
                  </Text>
                </View>
              )}
              {profile?.age && (
                <View style={[styles.metaPill, { backgroundColor: isDarkMode ? '#2D2018' : '#F5EBE1' }]}>
                  <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
                    {profile.age} वर्ष (Years)
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Quick Admin Access Button if role === 'admin' */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminShortcutBtn}
              onPress={() => router.push('/admin' as any)}
            >
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.adminShortcutBtnText}>प्रशासन डैशबोर्ड खोलें (Open Admin Panel)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Devotional Analytics & Quick Stats */}
        <View style={styles.analyticsSection}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            साधना सांख्यिकी • Devotional Analytics
          </Text>
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              <Text style={styles.statEmoji}>📿</Text>
              <Text style={[styles.statNumber, { color: Colors.saffron }]}>7 दिन</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>दैनिक साधना स्ट्रीक</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              <Text style={styles.statEmoji}>⏱️</Text>
              <Text style={[styles.statNumber, { color: Colors.saffron }]}>48 मिनट</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>कुल पाठ समय</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              <Text style={styles.statEmoji}>🔖</Text>
              <Text style={[styles.statNumber, { color: Colors.saffron }]}>{bookmarks.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>सहेजे गए पाठ</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              <Text style={styles.statEmoji}>📖</Text>
              <Text style={[styles.statNumber, { color: Colors.saffron }]}>{recentlyRead.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>पठन इतिहास</Text>
            </View>
          </View>
        </View>

        {/* Menu List Items */}
        <View style={styles.menuSection}>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.surfaceCard, borderColor: theme.border },
            ]}
          >
            {/* Settings */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.saffron} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                  {isEnglishOnly ? 'App Preferences' : isHindiOnly ? 'ऐप सेटिंग्स' : 'ऐप सेटिंग्स (App Settings)'}
                </Text>
                <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                  {isEnglishOnly ? 'Language, font size, theme & dark mode' : 'भाषा, फ़ॉन्ट आकार, रीडर थीम व डार्क मोड'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            {/* About Us */}
            <TouchableOpacity style={styles.menuRow} onPress={() => setAboutModalVisible(true)}>
              <Ionicons name="information-circle-outline" size={22} color={Colors.saffron} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                  {isEnglishOnly ? 'About Us' : isHindiOnly ? 'हमारे बारे में' : 'हमारे बारे में (About Us)'}
                </Text>
                <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                  {isEnglishOnly ? 'My Prayer mission & spiritual vision' : 'माई प्रेयर का आध्यात्मिक संकल्प एवं उद्देश्य'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            {/* Contact Us */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setContactModalVisible(true)}
            >
              <Ionicons name="mail-outline" size={22} color={Colors.saffron} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                  {isEnglishOnly ? 'Contact & Support' : isHindiOnly ? 'संपर्क एवं सहायता' : 'संपर्क एवं सहायता (Contact Us)'}
                </Text>
                <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                  {isEnglishOnly ? 'Suggestions, feedback or queries' : 'सुझाव, त्रुटि रिपोर्ट या सहयोग हेतु'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setPrivacyModalVisible(true)}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.saffron} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                  {isEnglishOnly ? 'Privacy Policy' : isHindiOnly ? 'गोपनीयता नीति' : 'गोपनीयता नीति (Privacy Policy)'}
                </Text>
                <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                  {isEnglishOnly ? 'Data protection & user privacy rights' : 'साधक डेटा सुरक्षा और अधिकार'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* If Admin, Admin Panel entry in menu as well */}
            {isAdmin && (
              <>
                <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => router.push('/admin' as any)}
                >
                  <Ionicons name="construct-outline" size={22} color="#E65100" />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.menuTitle, { color: '#E65100' }]}>
                      {isEnglishOnly ? 'Admin Management Console' : 'प्रशासन प्रबंधन केंद्र (Admin Panel)'}
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                      {isEnglishOnly ? 'Religions, deities, audio & branding control' : 'धर्म, देवी-देवता, ऑडियो व ब्रांडिंग प्रबंधन'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            {/* Logout */}
            <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuTitle, { color: '#D32F2F' }]}>
                  {isEnglishOnly ? 'Sign Out' : isHindiOnly ? 'लॉगआउट करें' : 'लॉगआउट करें (Sign Out)'}
                </Text>
                <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                  {isEnglishOnly ? 'End session on this device' : 'डिवाइस से खाता सत्र समाप्त करें'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODALS */}
      {renderSettingsModal()}
      {renderAboutModal()}
      {renderContactModal()}
      {renderPrivacyModal()}
    </SafeAreaView>
  );

  /* =========================================================================
     MODAL HELPERS
     ========================================================================= */
  function renderSettingsModal() {
    return (
      <Modal visible={settingsModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.surfaceCard }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? '⚙️ App Preferences'
                  : isHindiOnly
                  ? '⚙️ ऐप प्राथमिकताएं'
                  : '⚙️ ऐप प्राथमिकताएं (Settings)'}
              </Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Dark Mode */}
              <View style={styles.settingSettingRow}>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                    {isEnglishOnly ? 'Dark Mode' : 'डार्क मोड (Dark Mode)'}
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                    {isEnglishOnly ? 'Comfortable reading at night' : 'रात्रि में सुगम पाठ हेतु'}
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ true: Colors.saffron, false: '#888' }}
                />
              </View>

              {/* Language (Dynamically based on religion) */}
              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, marginBottom: 8 }]}>
                  {isEnglishOnly ? 'Reading Language' : 'पाठ भाषा (Reading Language)'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {availableLanguages.map((langOption) => {
                    const isSel = readingLanguage === langOption.id;
                    const label = isEnglishOnly
                      ? langOption.label
                      : isHindiOnly
                      ? langOption.nativeLabel
                      : `${langOption.nativeLabel} (${langOption.label})`;
                    return (
                      <TouchableOpacity
                        key={langOption.id}
                        onPress={() => setReadingLanguage(langOption.id)}
                        style={[
                          styles.settingChip,
                          isSel && { backgroundColor: Colors.saffron, borderColor: Colors.saffron },
                        ]}
                      >
                        <Text style={[styles.settingChipText, isSel && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Font Size */}
              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                  {isEnglishOnly
                    ? `Reading Font Size: ${Math.round(fontSizeMultiplier * 100)}%`
                    : `पाठ फ़ॉन्ट आकार: ${Math.round(fontSizeMultiplier * 100)}%`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity onPress={decreaseFontSize} style={styles.fontBtnMini}>
                    <Text style={{ fontWeight: '700', color: theme.textPrimary }}>A -</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={resetFontSize} style={styles.fontBtnMini}>
                    <Text style={{ color: theme.textSecondary }}>
                      {isEnglishOnly ? 'Reset' : 'रीसेट'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={increaseFontSize} style={styles.fontBtnMini}>
                    <Text style={{ fontWeight: '700', color: Colors.saffron }}>A +</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reader Theme */}
              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary, marginBottom: 8 }]}>
                  {isEnglishOnly ? 'Reader Canvas Theme' : 'रीडर पृष्ठभूमि (Reader Canvas)'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['cream', 'sepia', 'dark', 'light'] as ReadingTheme[]).map((th) => {
                    const isSel = readingTheme === th;
                    const label =
                      th === 'cream'
                        ? isEnglishOnly
                          ? 'Cream'
                          : 'क्रीम'
                        : th === 'sepia'
                        ? isEnglishOnly
                          ? 'Sepia'
                          : 'सेपिया'
                        : th === 'dark'
                        ? isEnglishOnly
                          ? 'Dark'
                          : 'डार्क'
                        : isEnglishOnly
                        ? 'Light'
                        : 'लाइट';
                    return (
                      <TouchableOpacity
                        key={th}
                        onPress={() => setReadingTheme(th)}
                        style={[
                          styles.settingChip,
                          isSel && { backgroundColor: Colors.saffron, borderColor: Colors.saffron },
                        ]}
                      >
                        <Text style={[styles.settingChipText, isSel && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderAboutModal() {
    return (
      <Modal visible={aboutModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.surfaceCard }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? '🌸 About Us'
                  : isHindiOnly
                  ? '🌸 हमारे बारे में'
                  : '🌸 हमारे बारे में (About Us)'}
              </Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.infoParagraph, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? 'My Prayer is a sacred digital sanctuary dedicated to enriching your daily life with spiritual peace, focus, and divine blessings.'
                  : 'माई प्रेयर (My Prayer) एक पवित्र डिजिटल मंच है जिसका उद्देश्य प्रत्येक साधक के जीवन में दैनिक आध्यात्मिक शांति, एकाग्रता और सकारात्मक ऊर्जा का संचार करना है।'}
              </Text>
              <Text style={[styles.infoParagraph, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? 'Here, authentic Chalisas, daily Aartis, fast stories (Vrat Kathas), and Vedic Mantras are curated with transliteration and word meanings for pure uninterrupted devotion.'
                  : 'यहाँ सम्पूर्ण चालीसा, दैनिक आरती, व्रत कथाएं एवं वैदिक मंत्र प्रामाणिक हिन्दी एवं अंग्रेजी लिप्यंतरण के साथ उपलब्ध हैं, ताकि आप बिना किसी व्यवधान के अपनी साधना संपन्न कर सकें।'}
              </Text>
              <Text style={[styles.infoSubtext, { color: theme.textSecondary }]}>
                {isEnglishOnly
                  ? 'Version: v1.0.0 • All Rights Reserved'
                  : 'संस्करण: v1.0.0 • सर्वाधिकार सुरक्षित'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderContactModal() {
    return (
      <Modal visible={contactModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.surfaceCard }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? '📞 Contact & Support'
                  : isHindiOnly
                  ? '📞 संपर्क एवं सहायता'
                  : '📞 संपर्क एवं सहायता (Contact Us)'}
              </Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 10 }}>
              <Text style={[styles.infoParagraph, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? 'For any feedback, error reports, or prayer addition requests, please write to us:'
                  : 'किसी भी सुझाव, त्रुटि सुधार या नई चालीसा/आरती जुड़वाने के लिए हमें लिखें:'}
              </Text>

              <View style={[styles.contactCard, { backgroundColor: isDarkMode ? '#2B2019' : '#FFF3E0' }]}>
                <Ionicons name="mail" size={20} color={Colors.saffron} />
                <Text style={[styles.contactEmail, { color: Colors.saffronDark }]}>
                  support@myprayer.app
                </Text>
              </View>

              <Text style={[styles.infoSubtext, { color: theme.textSecondary, marginTop: 14 }]}>
                {isEnglishOnly
                  ? 'We typically respond within 24 hours.'
                  : 'हम सामान्यतः 24 घंटों के भीतर उत्तर देते हैं।'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderPrivacyModal() {
    return (
      <Modal visible={privacyModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.surfaceCard }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? '🔒 Privacy Policy'
                  : isHindiOnly
                  ? '🔒 गोपनीयता नीति'
                  : '🔒 गोपनीयता नीति (Privacy Policy)'}
              </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.infoParagraph, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? '1. Your spiritual journey and devotional practice are strictly personal and private.'
                  : '1. आपकी आध्यात्मिक साधना पूर्णतः व्यक्तिगत है।'}
              </Text>
              <Text style={[styles.infoParagraph, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? '2. Your mobile number or email is used solely to synchronize bookmarks, reading history, and streaks.'
                  : '2. आपका मोबाइल नंबर अथवा ईमेल केवल आपके बुकमार्क और साधना स्ट्रीक को सुरक्षित रूप से सिंक करने हेतु उपयोग किया जाता है।'}
              </Text>
              <Text style={[styles.infoParagraph, { color: theme.textPrimary }]}>
                {isEnglishOnly
                  ? '3. We never share or sell your personal information to third parties.'
                  : '3. हम किसी भी तृतीय पक्ष (Third Party) के साथ आपकी व्यक्तिगत जानकारी साझा नहीं करते।'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  authScrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  welcomeHeroCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroOmCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroOmText: {
    fontSize: 32,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    width: '100%',
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    color: '#D32F2F',
    fontSize: 12,
    flex: 1,
  },
  formCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12.5,
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
  primarySubmitBtn: {
    backgroundColor: Colors.saffron,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  primarySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  photoUploadContainer: {
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  photoPickerBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadedPhotoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerLabel: {
    fontSize: 10,
    color: Colors.saffronDark,
    fontWeight: '600',
    marginTop: 2,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: 0,
    right: '35%',
    backgroundColor: '#D32F2F',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
  },
  genderPillText: {
    fontSize: 12,
    color: '#666',
  },
  guestSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  guestSettingsText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeroCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profileAvatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: Colors.saffron,
  },
  profileAvatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.saffronDark,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  userContactText: {
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adminShortcutBtn: {
    backgroundColor: '#E65100',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 14,
  },
  adminShortcutBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  analyticsSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 30,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  settingSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  settingChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  settingChipText: {
    fontSize: 12,
    color: '#666',
  },
  fontBtnMini: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  infoParagraph: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 10,
  },
  infoSubtext: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginTop: 6,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '700',
  },
});
