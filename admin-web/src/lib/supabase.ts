import { createClient } from '@supabase/supabase-js';
import {
  DbReligion,
  DbDeity,
  DbPrayer,
  DbVerse,
  DbAppConfig,
  DbProfile,
} from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yryjllhwhfcstlmcmzgm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKETS = {
  APP_ASSETS: 'app-assets',
  DEITY_IMAGES: 'deity-images',
  PRAYER_AUDIO: 'prayer-audio',
  PROFILE_PHOTOS: 'profile-photos',
};

// 1. ADMIN AUTHENTICATION
export async function getAdminProfile(userId: string): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as DbProfile;
}

// 2. DASHBOARD OVERVIEW COUNTS
export async function fetchDashboardCounts() {
  const [religionsRes, deitiesRes, prayersRes, profilesRes] = await Promise.all([
    supabase.from('religions').select('id', { count: 'exact', head: true }),
    supabase.from('deities').select('id', { count: 'exact', head: true }),
    supabase.from('prayers').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  return {
    religionsCount: religionsRes.count ?? 0,
    deitiesCount: deitiesRes.count ?? 0,
    prayersCount: prayersRes.count ?? 0,
    usersCount: profilesRes.count ?? 0,
  };
}

// 3. STORAGE UPLOAD
export async function uploadWebFile(
  bucket: string,
  file: File,
  folder: string = ''
): Promise<string> {
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = folder ? `${folder}/${safeName}` : safeName;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// 4. RELIGIONS
export async function fetchReligions(): Promise<DbReligion[]> {
  const { data, error } = await supabase
    .from('religions')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DbReligion[]) || [];
}

export async function createReligion(rel: Omit<DbReligion, 'id'>): Promise<DbReligion> {
  const { data, error } = await supabase.from('religions').insert([rel]).select().single();
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

// 5. DEITIES
export async function fetchDeities(): Promise<DbDeity[]> {
  const { data, error } = await supabase
    .from('deities')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data as DbDeity[]) || [];
}

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
  const { error } = await supabase.from('deities').delete().eq('id', id);
  if (error) throw error;
}

// 6. PRAYERS & VERSES
export async function fetchPrayers(): Promise<(DbPrayer & { deity?: DbDeity; verses_count?: number })[]> {
  const { data, error } = await supabase
    .from('prayers')
    .select('*, verses(id)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    verses_count: p.verses?.length || 0,
  }));
}

export async function fetchPrayerWithVerses(prayerId: string): Promise<{ prayer: DbPrayer; verses: DbVerse[] }> {
  const [prayerRes, versesRes] = await Promise.all([
    supabase.from('prayers').select('*').eq('id', prayerId).single(),
    supabase.from('verses').select('*').eq('prayer_id', prayerId).order('verse_number', { ascending: true }),
  ]);

  if (prayerRes.error) throw prayerRes.error;
  return {
    prayer: prayerRes.data,
    verses: versesRes.data || [],
  };
}

export async function createPrayerWithVerses(
  prayer: Omit<DbPrayer, 'id'>,
  verses: Omit<DbVerse, 'id' | 'prayer_id'>[]
): Promise<DbPrayer> {
  const { data: pData, error: pError } = await supabase.from('prayers').insert([prayer]).select().single();
  if (pError) throw pError;

  if (verses && verses.length > 0) {
    const versesToInsert = verses.map((v, i) => ({
      ...v,
      verse_number: i + 1,
      prayer_id: pData.id,
    }));
    const { error: vError } = await supabase.from('verses').insert(versesToInsert);
    if (vError) throw vError;
  }

  return pData;
}

export async function updatePrayer(id: string, updates: Partial<DbPrayer>): Promise<DbPrayer> {
  const { data, error } = await supabase.from('prayers').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePrayer(id: string): Promise<void> {
  await supabase.from('verses').delete().eq('prayer_id', id);
  const { error } = await supabase.from('prayers').delete().eq('id', id);
  if (error) throw error;
}

export async function saveVersesForPrayer(
  prayerId: string,
  verses: Omit<DbVerse, 'id' | 'prayer_id'>[]
): Promise<void> {
  await supabase.from('verses').delete().eq('prayer_id', prayerId);
  if (verses.length > 0) {
    const formatted = verses.map((v, idx) => ({
      prayer_id: prayerId,
      verse_number: idx + 1,
      text_hi: v.text_hi,
      text_en: v.text_en || null,
      meaning_en: v.meaning_en || null,
      verse_type: v.verse_type || 'chaupai',
    }));
    const { error } = await supabase.from('verses').insert(formatted);
    if (error) throw error;
  }
}

// 7. APP CONFIG
export async function fetchAppConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('app_config').select('*');
  if (error) throw error;

  const configMap: Record<string, string> = {};
  (data as DbAppConfig[] || []).forEach((c) => {
    configMap[c.config_key] = c.config_value;
  });
  return configMap;
}

export async function updateAppConfigKey(key: string, value: string): Promise<void> {
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
