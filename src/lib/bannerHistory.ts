/**
 * Banner History Data
 *
 * Historical record of Genshin Impact character and weapon banners.
 * Data is organized by version for easy updates.
 */

export interface BannerRecord {
  id: string;
  version: string;
  phase: 1 | 2;
  startDate: string; // ISO date
  endDate: string;
  bannerType: 'character' | 'weapon';
  featured5Star: string[]; // Character or weapon keys
  featured4Star: string[];
}

export interface CharacterBannerHistory {
  characterKey: string;
  banners: {
    version: string;
    phase: 1 | 2;
    date: string;
  }[];
  lastRun: string | null; // ISO date
  versionsSinceLastRun: number;
  totalReruns: number;
}

// Historical banner data (recent versions)
// Note: This is a simplified dataset - expand as needed
export const BANNER_HISTORY: BannerRecord[] = [
  // Version 5.3 (Current as of knowledge cutoff)
  {
    id: '5.3-1-char',
    version: '5.3',
    phase: 1,
    startDate: '2025-01-01',
    endDate: '2025-01-21',
    bannerType: 'character',
    featured5Star: ['Mavuika'],
    featured4Star: ['Lan Yan', 'Bennett', 'Chevreuse'],
  },
  {
    id: '5.3-2-char',
    version: '5.3',
    phase: 2,
    startDate: '2025-01-21',
    endDate: '2025-02-11',
    bannerType: 'character',
    featured5Star: ['Citlali', 'Clorinde'],
    featured4Star: ['Kachina', 'Gaming', 'Rosaria'],
  },
  // Version 5.2
  {
    id: '5.2-1-char',
    version: '5.2',
    phase: 1,
    startDate: '2024-11-20',
    endDate: '2024-12-10',
    bannerType: 'character',
    featured5Star: ['Chasca', 'Lyney'],
    featured4Star: ['Ororon', 'Xiangling', 'Thoma'],
  },
  {
    id: '5.2-2-char',
    version: '5.2',
    phase: 2,
    startDate: '2024-12-10',
    endDate: '2024-12-31',
    bannerType: 'character',
    featured5Star: ['Neuvillette', 'Zhongli'],
    featured4Star: ['Freminet', 'Yanfei', 'Beidou'],
  },
  // Version 5.1
  {
    id: '5.1-1-char',
    version: '5.1',
    phase: 1,
    startDate: '2024-10-09',
    endDate: '2024-10-29',
    bannerType: 'character',
    featured5Star: ['Xilonen', 'Chiori'],
    featured4Star: ['Candace', 'Dori', 'Noelle'],
  },
  {
    id: '5.1-2-char',
    version: '5.1',
    phase: 2,
    startDate: '2024-10-29',
    endDate: '2024-11-19',
    bannerType: 'character',
    featured5Star: ['Hu Tao', 'Nahida'],
    featured4Star: ['Xingqiu', 'Diona', 'Collei'],
  },
  // Version 5.0
  {
    id: '5.0-1-char',
    version: '5.0',
    phase: 1,
    startDate: '2024-08-28',
    endDate: '2024-09-17',
    bannerType: 'character',
    featured5Star: ['Mualani', 'Kazuha'],
    featured4Star: ['Kachina', 'Bennett', 'Heizou'],
  },
  {
    id: '5.0-2-char',
    version: '5.0',
    phase: 2,
    startDate: '2024-09-17',
    endDate: '2024-10-08',
    bannerType: 'character',
    featured5Star: ['Kinich', 'Raiden'],
    featured4Star: ['Thoma', 'Sayu', 'Sucrose'],
  },
  // Version 4.8
  {
    id: '4.8-1-char',
    version: '4.8',
    phase: 1,
    startDate: '2024-07-17',
    endDate: '2024-08-06',
    bannerType: 'character',
    featured5Star: ['Navia', 'Nilou'],
    featured4Star: ['Kaveh', 'Kirara', 'Ningguang'],
  },
  {
    id: '4.8-2-char',
    version: '4.8',
    phase: 2,
    startDate: '2024-08-06',
    endDate: '2024-08-27',
    bannerType: 'character',
    featured5Star: ['Emilie', 'Yelan'],
    featured4Star: ['Layla', 'Fischl', 'Xiangling'],
  },
  // Version 4.7
  {
    id: '4.7-1-char',
    version: '4.7',
    phase: 1,
    startDate: '2024-06-05',
    endDate: '2024-06-25',
    bannerType: 'character',
    featured5Star: ['Clorinde', 'Alhaitham'],
    featured4Star: ['Sethos', 'Bennett', 'Thoma'],
  },
  {
    id: '4.7-2-char',
    version: '4.7',
    phase: 2,
    startDate: '2024-06-25',
    endDate: '2024-07-16',
    bannerType: 'character',
    featured5Star: ['Sigewinne', 'Furina'],
    featured4Star: ['Gaming', 'Noelle', 'Rosaria'],
  },
  // Version 4.6
  {
    id: '4.6-1-char',
    version: '4.6',
    phase: 1,
    startDate: '2024-04-24',
    endDate: '2024-05-14',
    bannerType: 'character',
    featured5Star: ['Arlecchino', 'Lyney'],
    featured4Star: ['Freminet', 'Lynette', 'Xingqiu'],
  },
  {
    id: '4.6-2-char',
    version: '4.6',
    phase: 2,
    startDate: '2024-05-14',
    endDate: '2024-06-04',
    bannerType: 'character',
    featured5Star: ['Wanderer', 'Baizhu'],
    featured4Star: ['Faruzan', 'Yanfei', 'Barbara'],
  },
  // Version 4.5
  {
    id: '4.5-1-char',
    version: '4.5',
    phase: 1,
    startDate: '2024-03-13',
    endDate: '2024-04-02',
    bannerType: 'character',
    featured5Star: ['Chiori', 'Arataki Itto'],
    featured4Star: ['Gorou', 'Yun Jin', 'Dori'],
  },
  {
    id: '4.5-2-char',
    version: '4.5',
    phase: 2,
    startDate: '2024-04-02',
    endDate: '2024-04-23',
    bannerType: 'character',
    featured5Star: ['Neuvillette', 'Kazuha'],
    featured4Star: ['Faruzan', 'Xiangling', 'Noelle'],
  },
  // Version 4.4
  {
    id: '4.4-1-char',
    version: '4.4',
    phase: 1,
    startDate: '2024-01-31',
    endDate: '2024-02-20',
    bannerType: 'character',
    featured5Star: ['Xianyun', 'Nahida'],
    featured4Star: ['Gaming', 'Yaoyao', 'Xinyan'],
  },
  {
    id: '4.4-2-char',
    version: '4.4',
    phase: 2,
    startDate: '2024-02-20',
    endDate: '2024-03-12',
    bannerType: 'character',
    featured5Star: ['Xiao', 'Yae Miko'],
    featured4Star: ['Yaoyao', 'Ningguang', 'Xinyan'],
  },
  // Version 4.3
  {
    id: '4.3-1-char',
    version: '4.3',
    phase: 1,
    startDate: '2023-12-20',
    endDate: '2024-01-09',
    bannerType: 'character',
    featured5Star: ['Navia', 'Ayaka'],
    featured4Star: ['Chevreuse', 'Sucrose', 'Diona'],
  },
  {
    id: '4.3-2-char',
    version: '4.3',
    phase: 2,
    startDate: '2024-01-09',
    endDate: '2024-01-30',
    bannerType: 'character',
    featured5Star: ['Raiden', 'Yoimiya'],
    featured4Star: ['Chevreuse', 'Bennett', 'Xiangling'],
  },
];

// All known 5-star characters for tracking
export const ALL_5_STAR_CHARACTERS = [
  'Albedo', 'Alhaitham', 'Arataki Itto', 'Ayaka', 'Ayato',
  'Baizhu', 'Chasca', 'Chiori', 'Citlali', 'Clorinde', 'Cyno',
  'Dehya', 'Diluc', 'Emilie', 'Eula', 'Furina',
  'Ganyu', 'Hu Tao', 'Jean', 'Kazuha', 'Keqing',
  'Kinich', 'Klee', 'Kokomi', 'Lyney', 'Mavuika', 'Mona',
  'Mualani', 'Nahida', 'Navia', 'Neuvillette', 'Nilou',
  'Qiqi', 'Raiden', 'Shenhe', 'Sigewinne', 'Tartaglia',
  'Tighnari', 'Venti', 'Wanderer', 'Wriothesley', 'Xiao',
  'Xianyun', 'Xilonen', 'Yae Miko', 'Yelan', 'Yoimiya', 'Zhongli',
] as const;

// Current version for calculations
export const CURRENT_VERSION = '5.3';

/**
 * Get banner history for a specific character
 */
export function getCharacterBannerHistory(characterKey: string): CharacterBannerHistory {
  const banners = BANNER_HISTORY
    .filter(
      (b) =>
        b.bannerType === 'character' &&
        b.featured5Star.some((c) => c.toLowerCase() === characterKey.toLowerCase())
    )
    .map((b) => ({
      version: b.version,
      phase: b.phase,
      date: b.startDate,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const lastBanner = banners[0];
  const lastRunDate = lastBanner?.date || null;

  // Calculate versions since last run
  let versionsSince = 0;
  if (lastBanner) {
    const lastVersion = parseFloat(lastBanner.version);
    const currentVersion = parseFloat(CURRENT_VERSION);
    versionsSince = Math.round((currentVersion - lastVersion) * 10) / 10;
    // Each version is roughly 6 weeks, count full versions
    versionsSince = Math.floor(versionsSince * 2) / 2; // Round to nearest 0.5
  }

  return {
    characterKey,
    banners,
    lastRun: lastRunDate,
    versionsSinceLastRun: versionsSince > 0 ? Math.round(versionsSince * 2) : 0,
    totalReruns: banners.length - 1, // First appearance is debut, not rerun
  };
}

/**
 * Get all characters sorted by how long since their last banner
 */
export function getCharactersByTimeSinceRun(): CharacterBannerHistory[] {
  return ALL_5_STAR_CHARACTERS
    .map((char) => getCharacterBannerHistory(char))
    .sort((a, b) => {
      // Characters who have never run go last
      if (!a.lastRun && !b.lastRun) return 0;
      if (!a.lastRun) return 1;
      if (!b.lastRun) return -1;
      // Sort by versions since last run (descending)
      return b.versionsSinceLastRun - a.versionsSinceLastRun;
    });
}

/**
 * Get banners for a specific version
 */
export function getBannersForVersion(version: string): BannerRecord[] {
  return BANNER_HISTORY.filter((b) => b.version === version);
}

/**
 * Get the most recent banners
 */
export function getRecentBanners(count: number = 10): BannerRecord[] {
  return [...BANNER_HISTORY]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, count);
}

/**
 * Predict potential upcoming reruns based on time since last appearance
 */
export function getPotentialReruns(): CharacterBannerHistory[] {
  return getCharactersByTimeSinceRun()
    .filter((char) => char.versionsSinceLastRun >= 4) // Characters overdue by 4+ versions
    .slice(0, 10);
}
