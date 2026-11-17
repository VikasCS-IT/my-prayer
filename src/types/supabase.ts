export interface DbReligion {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  icon_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface DbDeity {
  id: string;
  religion_id?: string;
  name_en: string;
  name_hi: string;
  image_url?: string | null;
  significance?: string | null;
  display_order: number;
  is_popular: boolean;
  color?: string | null;
  associated_day_hi?: string | null;
  associated_day_en?: string | null;
  avatar_icon?: string | null;
  created_at?: string;
}

export interface DbPrayer {
  id: string;
  deity_id: string;
  category: 'chalisa' | 'aarti' | 'katha' | 'mantra' | 'stotra';
  title_en: string;
  title_hi: string;
  subtitle_hi?: string | null;
  subtitle_en?: string | null;
  audio_url?: string | null;
  duration_seconds: number;
  is_featured: boolean;
  significance?: string | null;
  created_at?: string;
}

export interface DbVerse {
  id: string;
  prayer_id: string;
  verse_number: number;
  text_hi: string;
  text_en?: string | null;
  meaning_en?: string | null;
  verse_type?: 'doha' | 'chaupai' | 'stanza' | 'chorus' | 'paragraph' | 'mantra';
  created_at?: string;
}

export interface DbAppConfig {
  id?: string;
  config_key: string;
  config_value: string;
  updated_at?: string;
}

export interface DbProfile {
  id: string;
  name: string;
  mobile?: string | null;
  age?: number | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  photo_url?: string | null;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}
