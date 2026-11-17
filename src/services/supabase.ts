import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  DbReligion,
  DbDeity,
  DbPrayer,
  DbVerse,
  DbAppConfig,
  DbProfile,
  Deity,
  PrayerItem,
  VerseItem,
  PrayerCategory,
} from '../types';
import { RELIGIONS, DEITIES, PRAYERS } from '../data/hinduismData';

// Fallback configuration if environment variables are not yet populated
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const isSupabaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('xyzcompany')
);

// Supabase client initialization with AsyncStorage persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Storage Buckets
export const STORAGE_BUCKETS = {
  DEITY_IMAGES: 'deity-images',
  PRAYER_AUDIO: 'prayer-audio',
  APP_ASSETS: 'app-assets',
  PROFILE_PHOTOS: 'profile-photos',
};

// Storage Cache Keys
const CACHE_KEYS = {
  RELIGIONS: '@myprayer_cache_religions',
  POPULAR_DEITIES: '@myprayer_cache_popular_deities',
  ALL_DEITIES: '@myprayer_cache_all_deities',
  PRAYERS_PREFIX: '@myprayer_cache_prayers_',
  PRAYER_DETAIL_PREFIX: '@myprayer_cache_prayer_detail_',
  APP_CONFIG: '@myprayer_cache_app_config',
  USER_PROFILE: '@myprayer_cache_user_profile',
};

/* =========================================================================
   TYPE ADAPTERS & MAPPERS (Db <-> UI Models)
   ========================================================================= */

export function mapDbDeityToDeity(item: DbDeity): Deity {
  return {
    id: item.id,
    religionId: (item.religion_id || 'hinduism') as any,
    nameEnglish: item.name_en,
    nameHindi: item.name_hi,
    title: item.significance || item.name_hi,
    subtitle: item.name_en,
    significance: item.significance || '',
    associatedDayHindi: item.associated_day_hi || 'दैनिक (Daily)',
    associatedDayEnglish: item.associated_day_en || 'Daily',
    color: item.color || '#FF6F00',
    avatarIcon: item.avatar_icon || '🕉️',
    imageUrl: item.image_url || undefined,
  };
}

export function mapDbPrayerToPrayerItem(
  dbPrayer: DbPrayer,
  verses: DbVerse[] = []
): PrayerItem {
  const mappedVerses: VerseItem[] = verses.map((v) => ({
    number: v.verse_number,
    type: v.verse_type || 'chaupai',
    hindi: v.text_hi,
    englishTransliteration: v.text_en || '',
    englishMeaning: v.meaning_en || '',
  }));

  return {
    id: dbPrayer.id,
    religionId: 'hinduism',
    deityId: dbPrayer.deity_id,
    category: dbPrayer.category,
    titleHindi: dbPrayer.title_hi,
    titleEnglish: dbPrayer.title_en,
    subtitleHindi: dbPrayer.subtitle_hi || undefined,
    subtitleEnglish: dbPrayer.subtitle_en || undefined,
    durationMinutes: Math.max(1, Math.round(dbPrayer.duration_seconds / 60)),
    totalVerses: verses.length,
    significance: dbPrayer.significance || undefined,
    audioDurationSeconds: dbPrayer.duration_seconds,
    audioUrl: dbPrayer.audio_url || undefined,
    verses: mappedVerses,
  };
}

/* =========================================================================
   DATA-FETCHING SERVICES WITH OFFLINE ASYNCSTORAGE CACHING
   ========================================================================= */

/**
 * Fetch all active religions from Supabase, with offline caching and static fallback
 */
export async function fetchReligions(): Promise<DbReligion[]> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('religions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        await AsyncStorage.setItem(CACHE_KEYS.RELIGIONS, JSON.stringify(data));
        return data as DbReligion[];
      }
    }
  } catch (err) {
    console.warn('Supabase fetchReligions network notice:', err);
  }

  // Fallback 1: AsyncStorage Cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.RELIGIONS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Fallback 2: Local Built-in Data
  return RELIGIONS.map((r) => ({
    id: r.id,
    slug: r.id,
    name_en: r.nameEnglish,
    name_hi: r.nameNative,
    icon_url: null,
    is_active: r.isAvailable,
  }));
}

/**
 * Fetch popular deities from `deities` where `is_popular = true`, ordered by `display_order`
 */
export async function fetchPopularDeities(): Promise<Deity[]> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('deities')
        .select('*')
        .eq('is_popular', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = (data as DbDeity[]).map(mapDbDeityToDeity);
        await AsyncStorage.setItem(CACHE_KEYS.POPULAR_DEITIES, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchPopularDeities notice:', err);
  }

  // Fallback 1: AsyncStorage Cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.POPULAR_DEITIES);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Fallback 2: Local Built-in Popular Deities
  return DEITIES;
}

/**
 * Fetch all deities or filtered by religion_id
 */
export async function fetchDeities(religionId?: string): Promise<Deity[]> {
  try {
    if (isSupabaseConfigured) {
      let query = supabase.from('deities').select('*').order('display_order', { ascending: true });
      if (religionId) {
        query = query.eq('religion_id', religionId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped = (data as DbDeity[]).map(mapDbDeityToDeity);
        await AsyncStorage.setItem(CACHE_KEYS.ALL_DEITIES, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchDeities notice:', err);
  }

  // Fallback 1: Cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.ALL_DEITIES);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Fallback 2: Local static
  return DEITIES;
}

/**
 * Fetch prayers filtered by deity and/or category
 */
export async function fetchPrayers(
  deityId?: string,
  category?: PrayerCategory
): Promise<PrayerItem[]> {
  const cacheKey = `${CACHE_KEYS.PRAYERS_PREFIX}${deityId || 'all'}_${category || 'all'}`;

  try {
    if (isSupabaseConfigured) {
      let query = supabase.from('prayers').select('*, verses(*)').order('created_at', { ascending: true });

      if (deityId) {
        query = query.eq('deity_id', deityId);
      }
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped = data.map((item: any) =>
          mapDbPrayerToPrayerItem(item, item.verses || [])
        );
        await AsyncStorage.setItem(cacheKey, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchPrayers notice:', err);
  }

  // Fallback 1: Cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Fallback 2: Local static prayers
  let filtered = PRAYERS;
  if (deityId) {
    filtered = filtered.filter((p) => p.deityId === deityId);
  }
  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category === category);
  }
  return filtered;
}

/**
 * Fetch prayer by ID including its verses and deity info
 */
export async function fetchPrayerById(prayerId: string): Promise<{
  prayer: PrayerItem | null;
  deityImageUrl?: string | null;
}> {
  const cacheKey = `${CACHE_KEYS.PRAYER_DETAIL_PREFIX}${prayerId}`;

  try {
    if (isSupabaseConfigured) {
      // 1. Fetch Prayer
      const { data: prayerData, error: prayerError } = await supabase
        .from('prayers')
        .select('*')
        .eq('id', prayerId)
        .maybeSingle();

      if (!prayerError && prayerData) {
        // 2. Fetch Verses ordered by verse_number
        const { data: versesData } = await supabase
          .from('verses')
          .select('*')
          .eq('prayer_id', prayerId)
          .order('verse_number', { ascending: true });

        // 3. Fetch Deity for dynamic image
        let deityImageUrl: string | null = null;
        if (prayerData.deity_id) {
          const { data: deityData } = await supabase
            .from('deities')
            .select('image_url')
            .eq('id', prayerData.deity_id)
            .maybeSingle();
          if (deityData?.image_url) {
            deityImageUrl = deityData.image_url;
          }
        }

        const prayerItem = mapDbPrayerToPrayerItem(
          prayerData as DbPrayer,
          (versesData as DbVerse[]) || []
        );

        const result = { prayer: prayerItem, deityImageUrl };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchPrayerById notice:', err);
  }

  // Fallback 1: AsyncStorage Cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Fallback 2: Local Built-in Prayer
  const localPrayer = PRAYERS.find((p) => p.id === prayerId);
  const localDeity = localPrayer ? DEITIES.find((d) => d.id === localPrayer.deityId) : undefined;

  return {
    prayer: localPrayer || null,
    deityImageUrl: localDeity?.imageUrl || null,
  };
}

/**
 * Fetch remote app configuration (app icon, splash screen URL, app title)
 */
export async function fetchAppConfig(): Promise<Record<string, string>> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('app_config').select('*');
      if (!error && data && data.length > 0) {
        const configMap: Record<string, string> = {};
        (data as DbAppConfig[]).forEach((item) => {
          configMap[item.config_key] = item.config_value;
        });
        await AsyncStorage.setItem(CACHE_KEYS.APP_CONFIG, JSON.stringify(configMap));
        return configMap;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchAppConfig notice:', err);
  }

  // Fallback 1: Cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.APP_CONFIG);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Defaults
  return {
    app_title: 'My Prayer (माई प्रेयर)',
    app_icon_url: '',
    splash_image_url: '',
  };
}

/* =========================================================================
   STORAGE UPLOAD SERVICES (Images & MP3 Audio)
   ========================================================================= */

/**
 * Upload binary file to a Supabase Storage bucket and return public URL
 */
export async function uploadToStorage(
  bucketName: string,
  localUri: string,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const filePath = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    let fileBody: any;

    if (Platform.OS === 'web') {
      const response = await fetch(localUri);
      fileBody = await response.blob();
    } else {
      // React Native file handling
      const response = await fetch(localUri);
      const blob = await response.blob();
      fileBody = blob;
    }

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBody, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err: any) {
    console.error(`Storage upload error (${bucketName}):`, err);
    throw new Error(err.message || 'फाइल अपलोड करने में विफल (Upload failed)');
  }
}

/**
 * Delete a file from Supabase storage by its public URL
 */
export async function deleteFromStorage(bucketName: string, publicUrl: string): Promise<void> {
  try {
    const parts = publicUrl.split(`${bucketName}/`);
    if (parts.length > 1) {
      const filePath = decodeURIComponent(parts[1]);
      await supabase.storage.from(bucketName).remove([filePath]);
    }
  } catch (err) {
    console.warn('Storage delete notice:', err);
  }
}

/* =========================================================================
   ADMIN CRUD OPERATIONS
   ========================================================================= */

// 1. RELIGIONS
export async function createReligion(religion: Omit<DbReligion, 'id'>): Promise<DbReligion> {
  const { data, error } = await supabase.from('religions').insert([religion]).select().single();
  if (error) throw error;
  return data;
}

export async function updateReligion(id: string, updates: Partial<DbReligion>): Promise<DbReligion> {
  const { data, error } = await supabase.from('religions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteReligion(id: string): Promise<void> {
  const { error } = await supabase.from('religions').delete().eq('id', id);
  if (error) throw error;
}

// 2. DEITIES
export async function createDeity(deity: Omit<DbDeity, 'id'>): Promise<DbDeity> {
  const { data, error } = await supabase.from('deities').insert([deity]).select().single();
  if (error) throw error;
  return data;
}

export async function updateDeity(id: string, updates: Partial<DbDeity>): Promise<DbDeity> {
  const { data, error } = await supabase.from('deities').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDeity(id: string): Promise<void> {
  // If deity has image in storage, clean it up
  const { data: deity } = await supabase.from('deities').select('image_url').eq('id', id).single();
  if (deity?.image_url) {
    await deleteFromStorage(STORAGE_BUCKETS.DEITY_IMAGES, deity.image_url);
  }
  const { error } = await supabase.from('deities').delete().eq('id', id);
  if (error) throw error;
}

// 3. PRAYERS & AUDIO
export async function createPrayer(
  prayer: Omit<DbPrayer, 'id'>,
  verses?: Omit<DbVerse, 'id' | 'prayer_id'>[]
): Promise<DbPrayer> {
  const { data: prayerData, error } = await supabase.from('prayers').insert([prayer]).select().single();
  if (error) throw error;

  if (verses && verses.length > 0) {
    const versesWithId = verses.map((v) => ({
      ...v,
      prayer_id: prayerData.id,
    }));
    await supabase.from('verses').insert(versesWithId);
  }

  return prayerData;
}

export async function updatePrayer(id: string, updates: Partial<DbPrayer>): Promise<DbPrayer> {
  const { data, error } = await supabase.from('prayers').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePrayer(id: string): Promise<void> {
  const { data: prayer } = await supabase.from('prayers').select('audio_url').eq('id', id).single();
  if (prayer?.audio_url) {
    await deleteFromStorage(STORAGE_BUCKETS.PRAYER_AUDIO, prayer.audio_url);
  }
  // Delete associated verses first
  await supabase.from('verses').delete().eq('prayer_id', id);
  const { error } = await supabase.from('prayers').delete().eq('id', id);
  if (error) throw error;
}

// 4. VERSES
export async function fetchVersesForPrayer(prayerId: string): Promise<DbVerse[]> {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('prayer_id', prayerId)
    .order('verse_number', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createVerse(verse: Omit<DbVerse, 'id'>): Promise<DbVerse> {
  const { data, error } = await supabase.from('verses').insert([verse]).select().single();
  if (error) throw error;
  return data;
}

export async function updateVerse(id: string, updates: Partial<DbVerse>): Promise<DbVerse> {
  const { data, error } = await supabase.from('verses').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVerse(id: string): Promise<void> {
  const { error } = await supabase.from('verses').delete().eq('id', id);
  if (error) throw error;
}

// 5. APP CONFIG
export async function updateAppConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase.from('app_config').upsert(
    {
      config_key: key,
      config_value: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'config_key' }
  );
  if (error) throw error;
}

/* =========================================================================
   USER & ADMIN PROFILE & AUTHENTICATION SERVICES
   ========================================================================= */

/**
 * Normalizes input identifier (email or mobile) into an auth-compliant email string
 */
export function normalizeAuthIdentifier(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes('@')) {
    return clean;
  }
  const digitsOnly = clean.replace(/[^0-9]/g, '');
  return `${digitsOnly || 'user'}@myprayer.app`;
}

/**
 * Fetch profile for a specific user ID
 */
export async function fetchUserProfile(userId: string): Promise<DbProfile | null> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        await AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(data));
        return data as DbProfile;
      }
    }
  } catch (e) {
    console.warn('Fetch profile notice:', e);
  }

  // Fallback to AsyncStorage Cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.USER_PROFILE);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return null;
}

/**
 * Sign up a new user and create their profile in `profiles` table
 */
export async function signUpUserProfile(params: {
  name: string;
  mobile: string;
  password: string;
  email?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  photoUri?: string;
}): Promise<{ user: any; profile: DbProfile }> {
  const authEmail = params.email?.trim() || normalizeAuthIdentifier(params.mobile);

  // 1. Supabase Auth Sign Up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: authEmail,
    password: params.password,
    options: {
      data: {
        name: params.name,
        mobile: params.mobile,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('उपयोगकर्ता पंजीकरण विफल (User creation failed)');

  // 2. Upload photo if selected
  let uploadedPhotoUrl: string | null = null;
  if (params.photoUri) {
    try {
      const fileName = `profile_${authData.user.id}_${Date.now()}.jpg`;
      uploadedPhotoUrl = await uploadToStorage(
        STORAGE_BUCKETS.PROFILE_PHOTOS,
        params.photoUri,
        fileName,
        'image/jpeg'
      );
    } catch (photoErr) {
      console.warn('Profile photo upload notice:', photoErr);
    }
  }

  // 3. Create Profile in public.profiles table
  const profileRecord: DbProfile = {
    id: authData.user.id,
    name: params.name,
    mobile: params.mobile,
    age: params.age || null,
    gender: params.gender || 'Male',
    photo_url: uploadedPhotoUrl,
    role: 'user',
  };

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert(profileRecord)
    .select()
    .single();

  const finalProfile = profileError ? profileRecord : (profileData as DbProfile);
  await AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(finalProfile));

  return {
    user: authData.user,
    profile: finalProfile,
  };
}

/**
 * Sign in user or admin by email or mobile number
 */
export async function signInUserProfile(params: {
  identifier: string;
  password: string;
}): Promise<{ user: any; profile: DbProfile }> {
  const authEmail = normalizeAuthIdentifier(params.identifier);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: params.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('लॉगिन विफल (Sign in failed)');

  // Fetch or create profile
  let profile = await fetchUserProfile(authData.user.id);

  // If user profile is not found (e.g., initial Admin created in Supabase Auth directly)
  if (!profile) {
    const isAdmin =
      authEmail.includes('admin') ||
      authEmail === 'prayer@myprayer.com' ||
      authData.user.email === 'prayer@myprayer.com';

    const defaultProfile: DbProfile = {
      id: authData.user.id,
      name: isAdmin ? 'मुख्य व्यवस्थापक (Admin)' : 'साधक (Seeker)',
      mobile: authData.user.user_metadata?.mobile || params.identifier,
      age: 30,
      gender: 'Male',
      photo_url: null,
      role: isAdmin ? 'admin' : 'user',
    };

    try {
      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(defaultProfile)
        .select()
        .single();
      profile = inserted ? (inserted as DbProfile) : defaultProfile;
    } catch {
      profile = defaultProfile;
    }
  }

  await AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(profile));
  return {
    user: authData.user,
    profile,
  };
}

/**
 * Update an existing user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<DbProfile>
): Promise<DbProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  await AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(data));
  return data as DbProfile;
}

/**
 * Sign out current user
 */
export async function signOutUserProfile(): Promise<void> {
  await supabase.auth.signOut();
  await AsyncStorage.removeItem(CACHE_KEYS.USER_PROFILE);
}

