export type ReligionId = 'hinduism' | 'sikhism' | 'islam' | 'christianity' | 'jainism' | 'buddhism';

export type ReadingLanguage = 'hindi' | 'english' | 'both';

export type ReadingTheme = 'cream' | 'sepia' | 'dark' | 'light';

export type PrayerCategory = 'chalisa' | 'aarti' | 'katha' | 'mantra' | 'stotra' | 'all';

export interface Religion {
  id: ReligionId;
  nameEnglish: string;
  nameNative: string;
  symbol: string;
  tagline: string;
  isAvailable: boolean;
  comingSoon?: boolean;
  accentColor: string;
  categories: {
    id: string;
    label: string;
    description: string;
  }[];
}

export interface Deity {
  id: string;
  religionId: ReligionId;
  nameEnglish: string;
  nameHindi: string;
  title: string;
  subtitle: string;
  significance: string;
  associatedDayHindi: string;
  associatedDayEnglish: string;
  color: string;
  avatarIcon: string; // Icon or emoji identifier
  imageUrl?: string;
  mantraPreviewHindi?: string;
  mantraPreviewEnglish?: string;
}

export interface VerseItem {
  number?: number;
  type?: 'doha' | 'chaupai' | 'stanza' | 'chorus' | 'paragraph' | 'mantra';
  headingHindi?: string;
  headingEnglish?: string;
  hindi: string;
  englishTransliteration: string;
  englishMeaning: string;
}

export interface PrayerItem {
  id: string;
  religionId: ReligionId;
  deityId: string;
  category: 'chalisa' | 'aarti' | 'katha' | 'mantra' | 'stotra';
  titleHindi: string;
  titleEnglish: string;
  subtitleHindi?: string;
  subtitleEnglish?: string;
  durationMinutes: number;
  totalVerses?: number;
  significance?: string;
  bestTimeToChant?: string;
  audioDurationSeconds?: number;
  audioUrl?: string; // audio source or simulated audio stream
  verses: VerseItem[];
}

