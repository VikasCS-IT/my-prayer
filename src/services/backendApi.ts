import {
  DbReligion,
  DbDeity,
  DbPrayer,
  DbVerse,
  PrayerCategory,
} from '../types';
import { fetchReligions, fetchPopularDeities, fetchPrayers, fetchPrayerById, fetchAppConfig } from './supabase';

/**
 * Centralized Backend API Client for Mobile
 * Communicates with the unified backend REST API layer.
 * Automatically falls back to local caching/direct Supabase if the web API is unreachable.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'https://myprayer.app';

async function fetchFromApi<T>(endpoint: string, fallbackFn: () => Promise<T>): Promise<T> {
  try {
    if (process.env.EXPO_PUBLIC_BACKEND_API_URL) {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return json.data as T;
      }
    }
  } catch (err) {
    console.warn(`Backend API notice on ${endpoint}:`, err);
  }

  // Graceful fallback to direct Supabase client + AsyncStorage cache
  return fallbackFn();
}

export const BackendApi = {
  // Religions
  getReligions: async (): Promise<DbReligion[]> => {
    return fetchFromApi('/api/religions', fetchReligions);
  },

  // Popular Deities
  getPopularDeities: async () => {
    return fetchFromApi('/api/deities', fetchPopularDeities);
  },

  // Prayers
  getPrayers: async (category?: PrayerCategory, deityId?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (deityId && deityId !== 'all') params.set('deity_id', deityId);
    const query = params.toString() ? `?${params.toString()}` : '';

    return fetchFromApi(`/api/prayers${query}`, () => fetchPrayers(deityId, category));
  },

  // Prayer by ID
  getPrayerById: async (id: string) => {
    return fetchFromApi(`/api/prayers/${id}`, () => fetchPrayerById(id));
  },

  // App Remote Configuration
  getAppConfig: async () => {
    return fetchFromApi('/api/config', fetchAppConfig);
  },
};
