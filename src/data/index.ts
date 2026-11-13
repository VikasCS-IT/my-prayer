import { RELIGIONS, DEITIES, PRAYERS } from './hinduismData';
import { Religion, Deity, PrayerItem, PrayerCategory, ReligionId } from '../types';

export * from './hinduismData';

export function getReligions(): Religion[] {
  return RELIGIONS;
}

export function getReligionById(id: ReligionId): Religion | undefined {
  return RELIGIONS.find((r) => r.id === id);
}

export function getDeities(religionId: ReligionId = 'hinduism'): Deity[] {
  return DEITIES.filter((d) => d.religionId === religionId);
}

export function getDeityById(id: string): Deity | undefined {
  return DEITIES.find((d) => d.id === id);
}

export function getPrayers(religionId: ReligionId = 'hinduism'): PrayerItem[] {
  return PRAYERS.filter((p) => p.religionId === religionId);
}

export function getPrayerById(id: string): PrayerItem | undefined {
  return PRAYERS.find((p) => p.id === id);
}

export function getPrayersByDeity(deityId: string): PrayerItem[] {
  return PRAYERS.filter((p) => p.deityId === deityId);
}

export function getPrayersByCategory(
  category: PrayerCategory,
  religionId: ReligionId = 'hinduism'
): PrayerItem[] {
  const all = getPrayers(religionId);
  if (category === 'all') return all;
  return all.filter((p) => p.category === category);
}

export function searchPrayersAndDeities(
  query: string,
  religionId: ReligionId = 'hinduism'
): {
  prayers: PrayerItem[];
  deities: Deity[];
} {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return {
      prayers: getPrayers(religionId),
      deities: getDeities(religionId),
    };
  }

  const prayers = getPrayers(religionId).filter((p) => {
    return (
      p.titleEnglish.toLowerCase().includes(cleanQuery) ||
      p.titleHindi.includes(cleanQuery) ||
      p.category.toLowerCase().includes(cleanQuery) ||
      p.subtitleEnglish?.toLowerCase().includes(cleanQuery) ||
      p.subtitleHindi?.includes(cleanQuery)
    );
  });

  const deities = getDeities(religionId).filter((d) => {
    return (
      d.nameEnglish.toLowerCase().includes(cleanQuery) ||
      d.nameHindi.includes(cleanQuery) ||
      d.title.toLowerCase().includes(cleanQuery) ||
      d.subtitle.toLowerCase().includes(cleanQuery) ||
      d.associatedDayEnglish.toLowerCase().includes(cleanQuery)
    );
  });

  return { prayers, deities };
}

