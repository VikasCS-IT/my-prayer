import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yryjllhwhfcstlmcmzgm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Server-side Supabase Client for Centralized Backend API Routes
export const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const STORAGE_BUCKETS = {
  APP_ASSETS: 'app-assets',
  DEITY_IMAGES: 'deity-images',
  PRAYER_AUDIO: 'prayer-audio',
  PROFILE_PHOTOS: 'profile-photos',
};
