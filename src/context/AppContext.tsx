import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReligionId, ReadingLanguage, ReadingTheme } from '../types';

interface AppContextType {
  selectedReligion: ReligionId;
  setSelectedReligion: (religion: ReligionId) => Promise<void>;
  readingLanguage: ReadingLanguage;
  setReadingLanguage: (lang: ReadingLanguage) => Promise<void>;
  fontSizeMultiplier: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  readingTheme: ReadingTheme;
  setReadingTheme: (theme: ReadingTheme) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  bookmarks: string[];
  toggleBookmark: (prayerId: string) => Promise<void>;
  isBookmarked: (prayerId: string) => boolean;
  recentlyRead: string[];
  recordRecentlyRead: (prayerId: string) => Promise<void>;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetAllSettings: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEYS = {
  RELIGION: '@myprayer_religion',
  LANGUAGE: '@myprayer_language',
  FONT_SIZE: '@myprayer_font_size',
  READING_THEME: '@myprayer_reading_theme',
  DARK_MODE: '@myprayer_dark_mode',
  BOOKMARKS: '@myprayer_bookmarks',
  RECENTLY_READ: '@myprayer_recently_read',
  ONBOARDING_DONE: '@myprayer_onboarding_done',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedReligion, setSelectedReligionState] = useState<ReligionId>('hinduism');
  const [readingLanguage, setReadingLanguageState] = useState<ReadingLanguage>('both');
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1.0);
  const [readingTheme, setReadingThemeState] = useState<ReadingTheme>('cream');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<string[]>(['hanuman-chalisa', 'om-jai-jagdish-hare']);
  const [recentlyRead, setRecentlyRead] = useState<string[]>(['hanuman-chalisa']);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const [
          savedReligion,
          savedLanguage,
          savedFontSize,
          savedReadingTheme,
          savedDarkMode,
          savedBookmarks,
          savedRecentlyRead,
          savedOnboarding,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.RELIGION),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
          AsyncStorage.getItem(STORAGE_KEYS.READING_THEME),
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
          AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_READ),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE),
        ]);

        if (savedReligion) setSelectedReligionState(savedReligion as ReligionId);
        if (savedLanguage) setReadingLanguageState(savedLanguage as ReadingLanguage);
        if (savedFontSize) setFontSizeMultiplier(parseFloat(savedFontSize) || 1.0);
        if (savedReadingTheme) setReadingThemeState(savedReadingTheme as ReadingTheme);
        if (savedDarkMode !== null) setIsDarkMode(savedDarkMode === 'true');
        if (savedBookmarks) {
          try {
            setBookmarks(JSON.parse(savedBookmarks));
          } catch {}
        }
        if (savedRecentlyRead) {
          try {
            setRecentlyRead(JSON.parse(savedRecentlyRead));
          } catch {}
        }
        if (savedOnboarding !== null) {
          setHasCompletedOnboarding(savedOnboarding === 'true');
        }
      } catch (err) {
        console.error('Failed to load user preferences from AsyncStorage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedState();
  }, []);

  const setSelectedReligion = async (religion: ReligionId) => {
    setSelectedReligionState(religion);
    await AsyncStorage.setItem(STORAGE_KEYS.RELIGION, religion);
  };

  const setReadingLanguage = async (lang: ReadingLanguage) => {
    setReadingLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  const increaseFontSize = async () => {
    setFontSizeMultiplier((prev) => {
      const next = Math.min(prev + 0.15, 1.6);
      AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, next.toString());
      return next;
    });
  };

  const decreaseFontSize = async () => {
    setFontSizeMultiplier((prev) => {
      const next = Math.max(prev - 0.15, 0.85);
      AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, next.toString());
      return next;
    });
  };

  const resetFontSize = async () => {
    setFontSizeMultiplier(1.0);
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, '1.0');
  };

  const setReadingTheme = async (theme: ReadingTheme) => {
    setReadingThemeState(theme);
    await AsyncStorage.setItem(STORAGE_KEYS.READING_THEME, theme);
  };

  const toggleDarkMode = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, nextMode.toString());
  };

  const toggleBookmark = async (prayerId: string) => {
    const updated = bookmarks.includes(prayerId)
      ? bookmarks.filter((id) => id !== prayerId)
      : [...bookmarks, prayerId];
    setBookmarks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
  };

  const isBookmarked = (prayerId: string) => {
    return bookmarks.includes(prayerId);
  };

  const recordRecentlyRead = async (prayerId: string) => {
    const updated = [prayerId, ...recentlyRead.filter((id) => id !== prayerId)].slice(0, 10);
    setRecentlyRead(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_READ, JSON.stringify(updated));
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
  };

  const resetAllSettings = async () => {
    setSelectedReligionState('hinduism');
    setReadingLanguageState('both');
    setFontSizeMultiplier(1.0);
    setReadingThemeState('cream');
    setIsDarkMode(false);
    setBookmarks(['hanuman-chalisa', 'om-jai-jagdish-hare']);
    setRecentlyRead(['hanuman-chalisa']);
    setHasCompletedOnboarding(false);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.RELIGION),
      AsyncStorage.removeItem(STORAGE_KEYS.LANGUAGE),
      AsyncStorage.removeItem(STORAGE_KEYS.FONT_SIZE),
      AsyncStorage.removeItem(STORAGE_KEYS.READING_THEME),
      AsyncStorage.removeItem(STORAGE_KEYS.DARK_MODE),
      AsyncStorage.removeItem(STORAGE_KEYS.BOOKMARKS),
      AsyncStorage.removeItem(STORAGE_KEYS.RECENTLY_READ),
      AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_DONE),
    ]);
  };

  return (
    <AppContext.Provider
      value={{
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
        bookmarks,
        toggleBookmark,
        isBookmarked,
        recentlyRead,
        recordRecentlyRead,
        hasCompletedOnboarding,
        completeOnboarding,
        resetAllSettings,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
