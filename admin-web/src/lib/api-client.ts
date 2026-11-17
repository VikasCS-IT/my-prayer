import {
  DbReligion,
  DbDeity,
  DbPrayer,
  DbVerse,
  DbAppConfig,
} from '../types';

/**
 * Unified Backend API Client
 * Centralizes all communication through /api/* endpoints
 */

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

// 1. OVERVIEW
export async function apiGetOverview() {
  return fetchJson<{
    religionsCount: number;
    deitiesCount: number;
    prayersCount: number;
    usersCount: number;
  }>('/api/overview');
}

// 2. RELIGIONS
export async function apiGetReligions(): Promise<DbReligion[]> {
  return fetchJson<DbReligion[]>('/api/religions');
}

export async function apiCreateReligion(rel: Omit<DbReligion, 'id'>): Promise<DbReligion> {
  return fetchJson<DbReligion>('/api/religions', {
    method: 'POST',
    body: JSON.stringify(rel),
  });
}

export async function apiUpdateReligion(id: string, updates: Partial<DbReligion>): Promise<DbReligion> {
  return fetchJson<DbReligion>(`/api/religions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteReligion(id: string): Promise<void> {
  return fetchJson<void>(`/api/religions/${id}`, {
    method: 'DELETE',
  });
}

// 3. DEITIES
export async function apiGetDeities(): Promise<DbDeity[]> {
  return fetchJson<DbDeity[]>('/api/deities');
}

export async function apiCreateDeity(deity: Omit<DbDeity, 'id'>): Promise<DbDeity> {
  return fetchJson<DbDeity>('/api/deities', {
    method: 'POST',
    body: JSON.stringify(deity),
  });
}

export async function apiUpdateDeity(id: string, updates: Partial<DbDeity>): Promise<DbDeity> {
  return fetchJson<DbDeity>(`/api/deities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteDeity(id: string): Promise<void> {
  return fetchJson<void>(`/api/deities/${id}`, {
    method: 'DELETE',
  });
}

// 4. PRAYERS & VERSES
export async function apiGetPrayers(params?: { category?: string; deity_id?: string }): Promise<
  (DbPrayer & { deity?: DbDeity; verses_count?: number })[]
> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') query.set('category', params.category);
  if (params?.deity_id && params.deity_id !== 'all') query.set('deity_id', params.deity_id);

  const url = query.toString() ? `/api/prayers?${query.toString()}` : '/api/prayers';
  return fetchJson<(DbPrayer & { deity?: DbDeity; verses_count?: number })[]>(url);
}

export async function apiGetPrayerWithVerses(prayerId: string): Promise<{ prayer: DbPrayer; verses: DbVerse[] }> {
  return fetchJson<{ prayer: DbPrayer; verses: DbVerse[] }>(`/api/prayers/${prayerId}`);
}

export async function apiCreatePrayer(
  prayer: Omit<DbPrayer, 'id'>,
  verses?: Omit<DbVerse, 'id' | 'prayer_id'>[]
): Promise<DbPrayer> {
  return fetchJson<DbPrayer>('/api/prayers', {
    method: 'POST',
    body: JSON.stringify({ prayer, verses: verses || [] }),
  });
}

export async function apiUpdatePrayer(id: string, updates: Partial<DbPrayer>): Promise<DbPrayer> {
  return fetchJson<DbPrayer>(`/api/prayers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeletePrayer(id: string): Promise<void> {
  return fetchJson<void>(`/api/prayers/${id}`, {
    method: 'DELETE',
  });
}

export async function apiSaveVerses(
  prayerId: string,
  verses: Omit<DbVerse, 'id' | 'prayer_id'>[]
): Promise<DbVerse[]> {
  return fetchJson<DbVerse[]>(`/api/prayers/${prayerId}/verses`, {
    method: 'PUT',
    body: JSON.stringify({ verses }),
  });
}

// 5. APP CONFIG
export async function apiGetAppConfig(): Promise<Record<string, string>> {
  return fetchJson<Record<string, string>>('/api/config');
}

export async function apiUpdateAppConfig(config: Record<string, string>): Promise<void> {
  return fetchJson<void>('/api/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

// 6. STORAGE UPLOAD VIA API
export async function apiUploadFile(bucket: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || 'Upload failed');
  }

  return json.data.url as string;
}
