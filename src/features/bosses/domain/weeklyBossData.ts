/**
 * Weekly Boss Data
 *
 * Contains information about all weekly bosses in Genshin Impact
 */

export interface WeeklyBoss {
  key: string;
  name: string;
  location: string;
  region: string;
  element: string;
  requiredAdventureRank: number;
  prerequisiteQuest?: string;
  drops: string[]; // Talent materials
  releaseVersion: string;
}

export const WEEKLY_BOSSES: WeeklyBoss[] = [
  {
    key: 'dvalin',
    name: 'Stormterror Dvalin',
    location: "Stormterror's Lair",
    region: 'Mondstadt',
    element: 'Anemo',
    requiredAdventureRank: 25,
    prerequisiteQuest: 'Prologue: Act III',
    drops: ["Dvalin's Plume", "Dvalin's Claw", "Dvalin's Sigh"],
    releaseVersion: '1.0',
  },
  {
    key: 'andrius',
    name: 'Wolf of the North',
    location: 'Wolvendom',
    region: 'Mondstadt',
    element: 'Cryo/Anemo',
    requiredAdventureRank: 21,
    drops: ['Tail of Boreas', 'Ring of Boreas', 'Spirit Locket of Boreas'],
    releaseVersion: '1.0',
  },
  {
    key: 'childe',
    name: 'Childe',
    location: 'Golden House',
    region: 'Liyue',
    element: 'Hydro/Electro',
    requiredAdventureRank: 35,
    prerequisiteQuest: 'Chapter I: Act III',
    drops: ['Tusk of Monoceros Caeli', 'Shard of a Foul Legacy', 'Shadow of the Warrior'],
    releaseVersion: '1.1',
  },
  {
    key: 'azhdaha',
    name: 'Azhdaha',
    location: "Beneath the Dragon-Queller",
    region: 'Liyue',
    element: 'Geo (Variable)',
    requiredAdventureRank: 40,
    prerequisiteQuest: 'Zhongli Story Quest Act II',
    drops: ['Dragon Lord\'s Crown', 'Bloodjade Branch', 'Gilded Scale'],
    releaseVersion: '1.5',
  },
  {
    key: 'signora',
    name: 'La Signora',
    location: 'Tenshukaku',
    region: 'Inazuma',
    element: 'Cryo/Pyro',
    requiredAdventureRank: 30,
    prerequisiteQuest: 'Chapter II: Act III',
    drops: ['Molten Moment', 'Hellfire Butterfly', 'Ashen Heart'],
    releaseVersion: '2.1',
  },
  {
    key: 'shogun',
    name: 'Raiden Shogun',
    location: 'End of the Oneiric Euthymia',
    region: 'Inazuma',
    element: 'Electro',
    requiredAdventureRank: 40,
    prerequisiteQuest: 'Raiden Shogun Story Quest',
    drops: ['Mudra of the Malefic General', 'Tears of the Calamitous God', 'The Meaning of Aeons'],
    releaseVersion: '2.5',
  },
  {
    key: 'scaramouche',
    name: 'Shouki no Kami, the Prodigal',
    location: 'Joururi Workshop',
    region: 'Sumeru',
    element: 'Anemo/Electro',
    requiredAdventureRank: 35,
    prerequisiteQuest: 'Chapter III: Act V',
    drops: ['Puppet Strings', 'Mirror of Mushin', 'Daka\'s Bell'],
    releaseVersion: '3.2',
  },
  {
    key: 'apep',
    name: "Guardian of Apep's Oasis",
    location: "Apep's Oasis",
    region: 'Sumeru',
    element: 'Dendro',
    requiredAdventureRank: 35,
    prerequisiteQuest: "Nahida Story Quest Act II",
    drops: ['Worldspan Fern', 'Primordial Greenbloom', 'Evergloom Ring'],
    releaseVersion: '3.6',
  },
  {
    key: 'narwhal',
    name: 'All-Devouring Narwhal',
    location: 'Elynas',
    region: 'Fontaine',
    element: 'Hydro',
    requiredAdventureRank: 40,
    prerequisiteQuest: 'Chapter IV: Act V',
    drops: ['Lightless Silk String', 'Lightless Eye of the Maelstrom', 'Lightless Mass'],
    releaseVersion: '4.2',
  },
  {
    key: 'simulacra',
    name: 'Statue of the Sinners',
    location: 'Finale of the Deep',
    region: 'Fontaine',
    element: 'Pneuma/Ousia',
    requiredAdventureRank: 40,
    prerequisiteQuest: 'Neuvillette Story Quest',
    drops: ['Everflame Seed', 'Crystalline Cyst Dust', 'Fading Candle'],
    releaseVersion: '4.6',
  },
];

export const WEEKLY_BOSS_MAP = Object.fromEntries(
  WEEKLY_BOSSES.map((boss) => [boss.key, boss])
);

/**
 * Discounted resin cost for weekly bosses
 */
export const DISCOUNTED_RESIN_COST = 30;
export const REGULAR_RESIN_COST = 60;
export const MAX_DISCOUNTED_CLAIMS = 3;

/**
 * Get next Monday reset time (4:00 AM server time)
 * US Server: UTC-5
 */
export function getNextWeeklyReset(): Date {
  const now = new Date();
  // Assuming US server (UTC-5)
  const serverOffset = -5; // hours
  const resetHour = 4; // 4:00 AM server time

  // Convert to server time
  const serverTime = new Date(now.getTime() + serverOffset * 60 * 60 * 1000);

  // Find next Monday
  const daysUntilMonday = (8 - serverTime.getDay()) % 7 || 7;
  const nextMonday = new Date(serverTime);
  nextMonday.setDate(serverTime.getDate() + daysUntilMonday);
  nextMonday.setHours(resetHour, 0, 0, 0);

  // If it's Monday before reset, use this Monday
  if (serverTime.getDay() === 1 && serverTime.getHours() < resetHour) {
    nextMonday.setDate(nextMonday.getDate() - 7);
  }

  // Convert back to local time
  return new Date(nextMonday.getTime() - serverOffset * 60 * 60 * 1000);
}

/**
 * Get the start of the current week (Monday 4:00 AM server time)
 */
export function getCurrentWeekStart(): Date {
  const nextReset = getNextWeeklyReset();
  const currentWeekStart = new Date(nextReset);
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  return currentWeekStart;
}

/**
 * Format time until reset
 */
export function formatTimeUntilReset(reset: Date): string {
  const now = new Date();
  const diff = reset.getTime() - now.getTime();

  if (diff <= 0) return 'Reset!';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
