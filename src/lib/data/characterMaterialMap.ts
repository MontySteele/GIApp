/**
 * Static Character Material Map
 *
 * Provides offline fallback material data for character ascension planning.
 * Used when the genshin-db API is unavailable or returns no data.
 *
 * Only includes material NAMES (not counts), since the ascension calculator
 * derives counts from level/talent targets independently.
 */

import type { CharacterMaterialData } from '@/features/planner/domain/characterMaterials';
import { DOMAIN_SCHEDULE } from '@/features/planner/domain/materialConstants';

interface StaticMaterialEntry {
  element: string;
  gem: string; // base gem name (e.g., "Varunada Lazurite")
  boss: string; // normal boss drop
  localSpecialty: string;
  commonAscension: [string, string, string]; // gray, green, blue tier names
  talentBook: string; // series name (e.g., "Freedom")
  talentBookRegion: string;
  commonTalent: [string, string, string]; // gray, green, blue tier names
  weeklyBoss: string;
}

// Gem base names by element
const GEMS: Record<string, string> = {
  Pyro: 'Agnidus Agate',
  Hydro: 'Varunada Lazurite',
  Anemo: 'Vayuda Turquoise',
  Electro: 'Vajrada Amethyst',
  Dendro: 'Nagadus Emerald',
  Cryo: 'Shivada Jade',
  Geo: 'Prithiva Topaz',
};

/**
 * Static material data for known characters.
 * Keys match GOOD format (PascalCase).
 */
const CHARACTER_MATERIALS: Record<string, StaticMaterialEntry> = {
  // ==================== MONDSTADT ====================
  Albedo: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Basalt Pillar', localSpecialty: 'Cecilia',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Tusk of Monoceros Caeli',
  },
  Amber: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Everflame Seed', localSpecialty: 'Small Lamp Grass',
    commonAscension: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    weeklyBoss: 'Dvalin\'s Sigh',
  },
  Barbara: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Cleansing Heart', localSpecialty: 'Philanemo Mushroom',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Ring of Boreas',
  },
  Bennett: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Everflame Seed', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Resistance', talentBookRegion: 'Mondstadt',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'Dvalin\'s Plume',
  },
  Diluc: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Everflame Seed', localSpecialty: 'Small Lamp Grass',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Resistance', talentBookRegion: 'Mondstadt',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Dvalin\'s Plume',
  },
  Diona: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Hoarfrost Core', localSpecialty: 'Calla Lily',
    commonAscension: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    weeklyBoss: 'Shard of a Foul Legacy',
  },
  Eula: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Crystalline Bloom', localSpecialty: 'Dandelion Seed',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Resistance', talentBookRegion: 'Mondstadt',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Dragon Lord\'s Crown',
  },
  Fischl: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Lightning Prism', localSpecialty: 'Small Lamp Grass',
    commonAscension: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    weeklyBoss: 'Spirit Locket of Boreas',
  },
  Jean: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Hurricane Seed', localSpecialty: 'Dandelion Seed',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Resistance', talentBookRegion: 'Mondstadt',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Dvalin\'s Plume',
  },
  Kaeya: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Hoarfrost Core', localSpecialty: 'Calla Lily',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'Spirit Locket of Boreas',
  },
  Klee: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Everflame Seed', localSpecialty: 'Philanemo Mushroom',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Ring of Boreas',
  },
  Lisa: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Lightning Prism', localSpecialty: 'Valberry',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Dvalin\'s Claw',
  },
  Mika: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Pseudo-Stamens', localSpecialty: 'Wolfhook',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Mirror of Mushin',
  },
  Mona: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Cleansing Heart', localSpecialty: 'Philanemo Mushroom',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Resistance', talentBookRegion: 'Mondstadt',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Ring of Boreas',
  },
  Noelle: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Basalt Pillar', localSpecialty: 'Valberry',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Resistance', talentBookRegion: 'Mondstadt',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Dvalin\'s Claw',
  },
  Razor: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Lightning Prism', localSpecialty: 'Wolfhook',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Resistance', talentBookRegion: 'Mondstadt',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Dvalin\'s Claw',
  },
  Rosaria: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Hoarfrost Core', localSpecialty: 'Valberry',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Shadow of the Warrior',
  },
  Sucrose: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Hurricane Seed', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Spirit Locket of Boreas',
  },
  Venti: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Hurricane Seed', localSpecialty: 'Cecilia',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Tail of Boreas',
  },
  Xinyan: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Everflame Seed', localSpecialty: 'Violetgrass',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'Tusk of Monoceros Caeli',
  },

  // ==================== LIYUE ====================
  Beidou: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Lightning Prism', localSpecialty: 'Noctilucous Jade',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'Dvalin\'s Sigh',
  },
  Chongyun: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Hoarfrost Core', localSpecialty: 'Cor Lapis',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Dvalin\'s Sigh',
  },
  Ganyu: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Hoarfrost Core', localSpecialty: 'Qingxin',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Shadow of the Warrior',
  },
  'Hu Tao': {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Juvenile Jade', localSpecialty: 'Silk Flower',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Shard of a Foul Legacy',
  },
  HuTao: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Juvenile Jade', localSpecialty: 'Silk Flower',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Shard of a Foul Legacy',
  },
  Keqing: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Lightning Prism', localSpecialty: 'Cor Lapis',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Prosperity', talentBookRegion: 'Liyue',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Ring of Boreas',
  },
  Ningguang: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Basalt Pillar', localSpecialty: 'Glaze Lily',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Prosperity', talentBookRegion: 'Liyue',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Spirit Locket of Boreas',
  },
  Qiqi: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Hoarfrost Core', localSpecialty: 'Violetgrass',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Prosperity', talentBookRegion: 'Liyue',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Tail of Boreas',
  },
  Shenhe: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Dragonheir\'s False Fin', localSpecialty: 'Qingxin',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Prosperity', talentBookRegion: 'Liyue',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Hellfire Butterfly',
  },
  Xiangling: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Everflame Seed', localSpecialty: 'Jueyun Chili',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Dvalin\'s Claw',
  },
  Xiao: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Juvenile Jade', localSpecialty: 'Qingxin',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Prosperity', talentBookRegion: 'Liyue',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Shadow of the Warrior',
  },
  Xingqiu: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Cleansing Heart', localSpecialty: 'Silk Flower',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Tail of Boreas',
  },
  Yanfei: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Juvenile Jade', localSpecialty: 'Noctilucous Jade',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'Bloodjade Branch',
  },
  Yelan: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Runic Fang', localSpecialty: 'Starconch',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Prosperity', talentBookRegion: 'Liyue',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Gilded Scale',
  },
  YunJin: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Riftborn Regalia', localSpecialty: 'Glaze Lily',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Ashen Heart',
  },
  Zhongli: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Basalt Pillar', localSpecialty: 'Cor Lapis',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Tusk of Monoceros Caeli',
  },
  Xianyun: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Cloudseam Scale', localSpecialty: 'Clearwater Jade',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Lightless Mass',
  },
  Gaming: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Emperor\'s Resolution', localSpecialty: 'Starconch',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Lightless Mass',
  },
  Yaoyao: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Quelled Creeper', localSpecialty: 'Jueyun Chili',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Daka\'s Bell',
  },

  // ==================== INAZUMA ====================
  'Arataki Itto': {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Riftborn Regalia', localSpecialty: 'Onikabuto',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Elegance', talentBookRegion: 'Inazuma',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Ashen Heart',
  },
  Ayaka: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Perpetual Heart', localSpecialty: 'Sakura Bloom',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Elegance', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Bloodjade Branch',
  },
  KamisatoAyaka: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Perpetual Heart', localSpecialty: 'Sakura Bloom',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Elegance', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Bloodjade Branch',
  },
  Ayato: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Dew of Repudiation', localSpecialty: 'Sakura Bloom',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Elegance', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Mudra of the Malefic General',
  },
  KamisatoAyato: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Dew of Repudiation', localSpecialty: 'Sakura Bloom',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Elegance', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Mudra of the Malefic General',
  },
  Gorou: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Perpetual Heart', localSpecialty: 'Sango Pearl',
    commonAscension: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    talentBook: 'Light', talentBookRegion: 'Inazuma',
    commonTalent: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    weeklyBoss: 'Molten Moment',
  },
  Heizou: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Runic Fang', localSpecialty: 'Onikabuto',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Transience', talentBookRegion: 'Inazuma',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'The Meaning of Aeons',
  },
  Kokomi: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Dew of Repudiation', localSpecialty: 'Sango Pearl',
    commonAscension: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    talentBook: 'Transience', talentBookRegion: 'Inazuma',
    commonTalent: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    weeklyBoss: 'Hellfire Butterfly',
  },
  'Kujou Sara': {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Storm Beads', localSpecialty: 'Dendrobium',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Elegance', talentBookRegion: 'Inazuma',
    commonTalent: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    weeklyBoss: 'Ashen Heart',
  },
  'Kuki Shinobu': {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Runic Fang', localSpecialty: 'Naku Weed',
    commonAscension: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    talentBook: 'Elegance', talentBookRegion: 'Inazuma',
    commonTalent: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    weeklyBoss: 'Tears of the Calamitous God',
  },
  RaidenShogun: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Storm Beads', localSpecialty: 'Amakumo Fruit',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Light', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Molten Moment',
  },
  Sayu: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Marionette Core', localSpecialty: 'Crystal Marrow',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Light', talentBookRegion: 'Inazuma',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Gilded Scale',
  },
  Thoma: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Smoldering Pearl', localSpecialty: 'Fluorescent Fungus',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Transience', talentBookRegion: 'Inazuma',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'Hellfire Butterfly',
  },
  YaeMiko: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Dragonheir\'s False Fin', localSpecialty: 'Sea Ganoderma',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Light', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'The Meaning of Aeons',
  },
  Yoimiya: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Smoldering Pearl', localSpecialty: 'Naku Weed',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Transience', talentBookRegion: 'Inazuma',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Dragon Lord\'s Crown',
  },
  Tartaglia: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Cleansing Heart', localSpecialty: 'Starconch',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Shard of a Foul Legacy',
  },
  KaedeharaKazuha: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Marionette Core', localSpecialty: 'Sea Ganoderma',
    commonAscension: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    talentBook: 'Diligence', talentBookRegion: 'Liyue',
    commonTalent: ['Treasure Hoarder Insignia', 'Silver Raven Insignia', 'Golden Raven Insignia'],
    weeklyBoss: 'Gilded Scale',
  },

  // ==================== SUMERU ====================
  Alhaitham: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Pseudo-Stamens', localSpecialty: 'Sand Grease Pupa',
    commonAscension: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    talentBook: 'Ingenuity', talentBookRegion: 'Sumeru',
    commonTalent: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    weeklyBoss: 'Mirror of Mushin',
  },
  Baizhu: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Evergloom Ring', localSpecialty: 'Violetgrass',
    commonAscension: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    weeklyBoss: 'Worldspan Fern',
  },
  Candace: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Light Guiding Tetrahedron', localSpecialty: 'Henna Berry',
    commonAscension: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    talentBook: 'Admonition', talentBookRegion: 'Sumeru',
    commonTalent: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    weeklyBoss: 'Tears of the Calamitous God',
  },
  Collei: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Majestic Hooked Beak', localSpecialty: 'Rukkhashava Mushrooms',
    commonAscension: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    talentBook: 'Praxis', talentBookRegion: 'Sumeru',
    commonTalent: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    weeklyBoss: 'Tears of the Calamitous God',
  },
  Cyno: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Thunderclap Fruitcore', localSpecialty: 'Scarab',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Admonition', talentBookRegion: 'Sumeru',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Mudra of the Malefic General',
  },
  Dehya: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Light Guiding Tetrahedron', localSpecialty: 'Sand Grease Pupa',
    commonAscension: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    talentBook: 'Praxis', talentBookRegion: 'Sumeru',
    commonTalent: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    weeklyBoss: 'Puppet Strings',
  },
  Dori: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Thunderclap Fruitcore', localSpecialty: 'Kalpalata Lotus',
    commonAscension: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    talentBook: 'Ingenuity', talentBookRegion: 'Sumeru',
    commonTalent: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    weeklyBoss: 'Bloodjade Branch',
  },
  Faruzan: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Light Guiding Tetrahedron', localSpecialty: 'Henna Berry',
    commonAscension: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    talentBook: 'Admonition', talentBookRegion: 'Sumeru',
    commonTalent: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    weeklyBoss: 'Puppet Strings',
  },
  Kaveh: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Quelled Creeper', localSpecialty: 'Mourning Flower',
    commonAscension: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    talentBook: 'Ingenuity', talentBookRegion: 'Sumeru',
    commonTalent: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    weeklyBoss: 'Worldspan Fern',
  },
  Kirara: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Evergloom Ring', localSpecialty: 'Amakumo Fruit',
    commonAscension: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    talentBook: 'Transience', talentBookRegion: 'Inazuma',
    commonTalent: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    weeklyBoss: 'Everamber',
  },
  Layla: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Perpetual Caliber', localSpecialty: 'Nilotpala Lotus',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Ingenuity', talentBookRegion: 'Sumeru',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Mirror of Mushin',
  },
  Nahida: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Quelled Creeper', localSpecialty: 'Kalpalata Lotus',
    commonAscension: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    talentBook: 'Ingenuity', talentBookRegion: 'Sumeru',
    commonTalent: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    weeklyBoss: 'Puppet Strings',
  },
  Nilou: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Perpetual Caliber', localSpecialty: 'Padisarah',
    commonAscension: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    talentBook: 'Praxis', talentBookRegion: 'Sumeru',
    commonTalent: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    weeklyBoss: 'Tears of the Calamitous God',
  },
  Sethos: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Thunderclap Fruitcore', localSpecialty: 'Tainted Water-Splitting Phantasm',
    commonAscension: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    talentBook: 'Praxis', talentBookRegion: 'Sumeru',
    commonTalent: ['Faded Red Satin', 'Trimmed Red Silk', 'Rich Red Brocade'],
    weeklyBoss: 'Daka\'s Bell',
  },
  Tighnari: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Majestic Hooked Beak', localSpecialty: 'Nilotpala Lotus',
    commonAscension: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    talentBook: 'Admonition', talentBookRegion: 'Sumeru',
    commonTalent: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    weeklyBoss: 'The Meaning of Aeons',
  },
  Wanderer: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Perpetual Caliber', localSpecialty: 'Rukkhashava Mushrooms',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Praxis', talentBookRegion: 'Sumeru',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Daka\'s Bell',
  },

  // ==================== FONTAINE ====================
  Charlotte: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Tourbillon Device', localSpecialty: 'Beryl Conch',
    commonAscension: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    talentBook: 'Justice', talentBookRegion: 'Fontaine',
    commonTalent: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    weeklyBoss: 'Lightless Silk String',
  },
  Chevreuse: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Fontemer Unihorn', localSpecialty: 'Romaritime Flower',
    commonAscension: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    talentBook: 'Order', talentBookRegion: 'Fontaine',
    commonTalent: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    weeklyBoss: 'Lightless Eye of the Maelstrom',
  },
  Chiori: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Artificed Spare Clockwork Component — Coppelius', localSpecialty: 'Dendrobium',
    commonAscension: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    talentBook: 'Light', talentBookRegion: 'Inazuma',
    commonTalent: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    weeklyBoss: 'Lightless Mass',
  },
  Clorinde: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Fontemer Unihorn', localSpecialty: 'Lumitoile',
    commonAscension: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    talentBook: 'Justice', talentBookRegion: 'Fontaine',
    commonTalent: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    weeklyBoss: 'Everamber',
  },
  Freminet: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Artificed Spare Clockwork Component — Coppelius', localSpecialty: 'Romaritime Flower',
    commonAscension: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    talentBook: 'Justice', talentBookRegion: 'Fontaine',
    commonTalent: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    weeklyBoss: 'Worldspan Fern',
  },
  Furina: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Water Orb of the Font of All Waters', localSpecialty: 'Lakelight Lily',
    commonAscension: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    talentBook: 'Justice', talentBookRegion: 'Fontaine',
    commonTalent: ['Whopperflower Nectar', 'Shimmering Nectar', 'Energy Nectar'],
    weeklyBoss: 'Lightless Silk String',
  },
  Lynette: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Artificed Spare Clockwork Component — Coppelius', localSpecialty: 'Lumidouce Bell',
    commonAscension: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    talentBook: 'Order', talentBookRegion: 'Fontaine',
    commonTalent: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    weeklyBoss: 'Everamber',
  },
  Lyney: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Emperor\'s Resolution', localSpecialty: 'Rainbow Rose',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Equity', talentBookRegion: 'Fontaine',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Worldspan Fern',
  },
  Navia: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Artificed Spare Clockwork Component — Coppelius', localSpecialty: 'Spring of the First Dewdrop',
    commonAscension: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    talentBook: 'Equity', talentBookRegion: 'Fontaine',
    commonTalent: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    weeklyBoss: 'Lightless Eye of the Maelstrom',
  },
  Neuvillette: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Fontemer Unihorn', localSpecialty: 'Lumitoile',
    commonAscension: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    talentBook: 'Equity', talentBookRegion: 'Fontaine',
    commonTalent: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    weeklyBoss: 'Everamber',
  },
  Sigewinne: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Water Orb of the Font of All Waters', localSpecialty: 'Romaritime Flower',
    commonAscension: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    talentBook: 'Equity', talentBookRegion: 'Fontaine',
    commonTalent: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    weeklyBoss: 'Lightless Silk String',
  },
  Wriothesley: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Tourbillon Device', localSpecialty: 'Subdetection Unit',
    commonAscension: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    talentBook: 'Order', talentBookRegion: 'Fontaine',
    commonTalent: ['Transoceanic Pearl', 'Transoceanic Chunk', 'Xenochromatic Crystal'],
    weeklyBoss: 'Lightless Eye of the Maelstrom',
  },

  // ==================== NATLAN ====================
  Arlecchino: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Fragment of a Golden Melody', localSpecialty: 'Rainbow Rose',
    commonAscension: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    talentBook: 'Order', talentBookRegion: 'Fontaine',
    commonTalent: ['Recruit\'s Insignia', 'Sergeant\'s Insignia', 'Lieutenant\'s Insignia'],
    weeklyBoss: 'Fading Candle',
  },
  Chasca: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Ensnaring Gaze', localSpecialty: 'Brilliant Chrysanthemum',
    commonAscension: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    talentBook: 'Conflict', talentBookRegion: 'Natlan',
    commonTalent: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    weeklyBoss: 'Silken Feather',
  },
  Citlali: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Mark of the Binding Blessing', localSpecialty: 'Withering Purpurbloom',
    commonAscension: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    talentBook: 'Kindling', talentBookRegion: 'Natlan',
    commonTalent: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    weeklyBoss: 'Denial and Judgment',
  },
  Emilie: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Fragment of a Golden Melody', localSpecialty: 'Lakelight Lily',
    commonAscension: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    talentBook: 'Order', talentBookRegion: 'Fontaine',
    commonTalent: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    weeklyBoss: 'Lightless Mass',
  },
  Kachina: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Overripe Flamegranate', localSpecialty: 'Quenepa Berry',
    commonAscension: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    talentBook: 'Conflict', talentBookRegion: 'Natlan',
    commonTalent: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    weeklyBoss: 'Fading Candle',
  },
  Kinich: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Overripe Flamegranate', localSpecialty: 'Saurian Claw Succulent',
    commonAscension: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    talentBook: 'Kindling', talentBookRegion: 'Natlan',
    commonTalent: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    weeklyBoss: 'Fading Candle',
  },
  Mavuika: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Gold-Inscribed Secret Source Core', localSpecialty: 'Brilliant Chrysanthemum',
    commonAscension: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    talentBook: 'Contention', talentBookRegion: 'Natlan',
    commonTalent: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    weeklyBoss: 'Denial and Judgment',
  },
  Mualani: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Overripe Flamegranate', localSpecialty: 'Saurian Claw Succulent',
    commonAscension: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    talentBook: 'Contention', talentBookRegion: 'Natlan',
    commonTalent: ['Sentry\'s Wooden Whistle', 'Sentry\'s Brass Whistle', 'Sentry\'s Golden Whistle'],
    weeklyBoss: 'Fading Candle',
  },
  Ororon: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Overripe Flamegranate', localSpecialty: 'Glowing Hornshroom',
    commonAscension: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    talentBook: 'Conflict', talentBookRegion: 'Natlan',
    commonTalent: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    weeklyBoss: 'Silken Feather',
  },
  Xilonen: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Ensnaring Gaze', localSpecialty: 'Brilliant Chrysanthemum',
    commonAscension: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    talentBook: 'Kindling', talentBookRegion: 'Natlan',
    commonTalent: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    weeklyBoss: 'Silken Feather',
  },

  // ==================== CROSSOVER ====================
  Aloy: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Crystalline Bloom', localSpecialty: 'Crystal Marrow',
    commonAscension: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Spectral Husk', 'Spectral Heart', 'Spectral Nucleus'],
    weeklyBoss: 'Molten Moment',
  },

  // ==================== TRAVELER VARIANTS ====================
  TravelerAnemo: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Brilliant Diamond', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Dvalin\'s Sigh',
  },
  TravelerGeo: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Brilliant Diamond', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Tail of Boreas',
  },
  TravelerElectro: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Brilliant Diamond', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Transience', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Dragon Lord\'s Crown',
  },
  TravelerDendro: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Brilliant Diamond', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Admonition', talentBookRegion: 'Sumeru',
    commonTalent: ['Fungal Spores', 'Luminescent Pollen', 'Crystalline Cyst Dust'],
    weeklyBoss: 'Mudra of the Malefic General',
  },
  TravelerHydro: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Brilliant Diamond', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Equity', talentBookRegion: 'Fontaine',
    commonTalent: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    weeklyBoss: 'Worldspan Fern',
  },
  TravelerPyro: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Brilliant Diamond', localSpecialty: 'Windwheel Aster',
    commonAscension: ['Damaged Mask', 'Stained Mask', 'Ominous Mask'],
    talentBook: 'Contention', talentBookRegion: 'Natlan',
    commonTalent: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    weeklyBoss: 'Eroded Horn',
  },

  // ==================== NEWER CHARACTERS ====================
  LanYan: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Cloudseam Scale', localSpecialty: 'Clearwater Jade',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Tail of Boreas',
  },
  'Lan Yan': {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Cloudseam Scale', localSpecialty: 'Clearwater Jade',
    commonAscension: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Divining Scroll', 'Sealed Scroll', 'Forbidden Curse Scroll'],
    weeklyBoss: 'Tail of Boreas',
  },
  Mizuki: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Cloudseam Scale', localSpecialty: 'Fluorescent Fungus',
    commonAscension: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    talentBook: 'Light', talentBookRegion: 'Inazuma',
    commonTalent: ['Old Handguard', 'Kageuchi Handguard', 'Famed Handguard'],
    weeklyBoss: 'Mudra of the Malefic General',
  },
  Iansan: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Overripe Flamegranate', localSpecialty: 'Quenepa Berry',
    commonAscension: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    talentBook: 'Conflict', talentBookRegion: 'Natlan',
    commonTalent: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    weeklyBoss: 'Eroded Horn',
  },
  Varesa: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Overripe Flamegranate', localSpecialty: 'Quenepa Berry',
    commonAscension: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    talentBook: 'Contention', talentBookRegion: 'Natlan',
    commonTalent: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    weeklyBoss: 'Eroded Horn',
  },
  Skirk: {
    element: 'Cryo', gem: GEMS.Cryo!, boss: 'Fontemer Unihorn', localSpecialty: 'Romaritime Flower',
    commonAscension: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    talentBook: 'Order', talentBookRegion: 'Fontaine',
    commonTalent: ['Meshing Gear', 'Mechanical Spur Gear', 'Artificed Dynamic Gear'],
    weeklyBoss: 'Worldspan Fern',
  },
  Durin: {
    element: 'Pyro', gem: GEMS.Pyro!, boss: 'Cyclic Military Kuuvahki Core', localSpecialty: 'Frostlamp Flower',
    commonAscension: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    weeklyBoss: 'Eroded Sunfire',
  },
  Flins: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Precision Kuuvahki Stamping Die', localSpecialty: 'Frostlamp Flower',
    commonAscension: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    talentBook: 'Vagrancy', talentBookRegion: 'Nod-Krai',
    commonTalent: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    weeklyBoss: 'Ascended Sample: Queen',
  },
  Lauma: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Lightbearing Scale-Feather', localSpecialty: 'Moonfall Silver',
    commonAscension: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    talentBook: 'Moonlight', talentBookRegion: 'Nod-Krai',
    commonTalent: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    weeklyBoss: 'Eroded Scale-Feather',
  },
  Nefer: {
    element: 'Dendro', gem: GEMS.Dendro!, boss: 'Radiant Antler', localSpecialty: 'Moonfall Silver',
    commonAscension: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    talentBook: 'Elysium', talentBookRegion: 'Nod-Krai',
    commonTalent: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    weeklyBoss: 'Ascended Sample: Rook',
  },
  Columbina: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Radiant Antler', localSpecialty: 'Winter Icelea',
    commonAscension: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    talentBook: 'Moonlight', talentBookRegion: 'Nod-Krai',
    commonTalent: ['Slime Condensate', 'Slime Secretions', 'Slime Concentrate'],
    weeklyBoss: 'Mask of the Virtuous Doctor',
  },
  Ineffa: {
    element: 'Electro', gem: GEMS.Electro!, boss: 'Secret Source Airflow Accumulator', localSpecialty: 'Glowing Hornshroom',
    commonAscension: ['Sentry\'s Wooden Whistle', 'Warrior\'s Metal Whistle', 'Saurian-Crowned Warrior\'s Golden Whistle'],
    talentBook: 'Conflict', talentBookRegion: 'Natlan',
    commonTalent: ['Sentry\'s Wooden Whistle', 'Warrior\'s Metal Whistle', 'Saurian-Crowned Warrior\'s Golden Whistle'],
    weeklyBoss: 'Eroded Sunfire',
  },
  Aino: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Precision Kuuvahki Stamping Die', localSpecialty: 'Portable Bearing',
    commonAscension: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    talentBook: 'Elysium', talentBookRegion: 'Nod-Krai',
    commonTalent: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    weeklyBoss: 'Silken Feather',
  },
  Dahlia: {
    element: 'Hydro', gem: GEMS.Hydro!, boss: 'Secret Source Airflow Accumulator', localSpecialty: 'Calla Lily',
    commonAscension: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    talentBook: 'Ballad', talentBookRegion: 'Mondstadt',
    commonTalent: ['Firm Arrowhead', 'Sharp Arrowhead', 'Weathered Arrowhead'],
    weeklyBoss: 'Eroded Scale-Feather',
  },
  Ifa: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Sparkless Statue Core', localSpecialty: 'Saurian Claw Succulent',
    commonAscension: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    talentBook: 'Conflict', talentBookRegion: 'Natlan',
    commonTalent: ['Juvenile Fang', 'Seasoned Fang', 'Tyrant\'s Fang'],
    weeklyBoss: 'Ascended Sample: Rook',
  },
  Jahoda: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Lightbearing Scale-Feather', localSpecialty: 'Portable Bearing',
    commonAscension: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    talentBook: 'Vagrancy', talentBookRegion: 'Nod-Krai',
    commonTalent: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    weeklyBoss: 'Ascended Sample: Knight',
  },
  Zibai: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Remnant of the Dreadwing', localSpecialty: 'Glaze Lily',
    commonAscension: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    talentBook: 'Gold', talentBookRegion: 'Liyue',
    commonTalent: ['Tattered Warrant', 'Immaculate Warrant', 'Frost-Etched Warrant'],
    weeklyBoss: 'Ascended Sample: Queen',
  },
  Illuga: {
    element: 'Geo', gem: GEMS.Geo!, boss: 'Cyclic Military Kuuvahki Core', localSpecialty: 'Pine Amber',
    commonAscension: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    talentBook: 'Elysium', talentBookRegion: 'Nod-Krai',
    commonTalent: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    weeklyBoss: 'Eroded Horn',
  },
  Varka: {
    element: 'Anemo', gem: GEMS.Anemo!, boss: 'Prismatic Severed Tail', localSpecialty: 'Wolfhook',
    commonAscension: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    talentBook: 'Freedom', talentBookRegion: 'Mondstadt',
    commonTalent: ['Broken Drive Shaft', 'Reinforced Drive Shaft', 'Precision Drive Shaft'],
    weeklyBoss: 'Ascended Sample: Rook',
  },
};

/**
 * Get base name for common material family
 */
function getBaseName(tierNames: [string, string, string]): string {
  const gray = tierNames[0];
  if (gray.includes('Slime')) return 'Slime';
  if (gray.includes('Mask')) return 'Mask';
  if (gray.includes('Scroll')) return 'Scroll';
  if (gray.includes('Arrowhead')) return 'Arrowhead';
  if (gray.includes('Nectar')) return 'Nectar';
  if (gray.includes('Insignia')) return 'Insignia';
  if (gray.includes('Handguard')) return 'Handguard';
  if (gray.includes('Spectral')) return 'Spectral';
  if (gray.includes('Fungal')) return 'Fungal Spores';
  if (gray.includes('Satin')) return 'Red Satin';
  if (gray.includes('Transoceanic')) return 'Transoceanic';
  if (gray.includes('Fang')) return 'Fang';
  if (gray.includes('Gear')) return 'Gear';
  if (gray.includes('Sentry')) return 'Sentry Whistle';
  if (gray.includes('Bone Shard')) return 'Bone Shard';
  if (gray.includes('Statuette')) return 'Statuette';
  if (gray.includes('Prism')) return 'Prism';
  if (gray.includes('Horn')) return 'Horn';
  if (gray.includes('Warrant')) return 'Warrant';
  if (gray.includes('Drive Shaft')) return 'Drive Shaft';
  return gray;
}

/**
 * Convert a static material entry into a full CharacterMaterialData object
 * suitable for consumption by the ascension calculator.
 */
function toCharacterMaterialData(key: string, entry: StaticMaterialEntry): CharacterMaterialData {
  const bookDays = DOMAIN_SCHEDULE[entry.talentBook] ?? [];

  return {
    characterKey: key,
    element: entry.element,
    ascensionMaterials: {
      gem: {
        name: entry.gem,
        baseName: entry.gem,
        element: entry.element,
        byTier: { sliver: 1, fragment: 9, chunk: 9, gemstone: 6 },
      },
      boss: { name: entry.boss, totalCount: 46 },
      localSpecialty: { name: entry.localSpecialty, totalCount: 168 },
      common: {
        name: entry.commonAscension[2],
        baseName: getBaseName(entry.commonAscension),
        tierNames: {
          gray: entry.commonAscension[0],
          green: entry.commonAscension[1],
          blue: entry.commonAscension[2],
        },
        byTier: { gray: 18, green: 30, blue: 36 },
      },
    },
    talentMaterials: {
      books: {
        name: entry.talentBook,
        series: entry.talentBook,
        region: entry.talentBookRegion,
        days: bookDays,
        byTier: { teachings: 9, guide: 63, philosophies: 114 },
      },
      common: {
        name: entry.commonTalent[2],
        baseName: getBaseName(entry.commonTalent),
        tierNames: {
          gray: entry.commonTalent[0],
          green: entry.commonTalent[1],
          blue: entry.commonTalent[2],
        },
        byTier: { gray: 18, green: 66, blue: 93 },
      },
      weekly: { name: entry.weeklyBoss, totalCount: 18 },
      crown: { name: 'Crown of Insight', totalCount: 3 },
    },
    fetchedAt: 0,
    apiVersion: 'static',
  };
}

/**
 * Look up static material data for a character.
 * Returns null if the character is not in the static map.
 *
 * Tries several key formats:
 * - Exact match (e.g., "Furina")
 * - PascalCase (e.g., "HuTao")
 * - With spaces (e.g., "Hu Tao")
 * - Case-insensitive search
 */
export function getStaticCharacterMaterials(characterKey: string): CharacterMaterialData | null {
  // Try exact match
  const entry = CHARACTER_MATERIALS[characterKey];
  if (entry) return toCharacterMaterialData(characterKey, entry);

  // Try case-insensitive match
  const lowerKey = characterKey.toLowerCase();
  for (const [key, value] of Object.entries(CHARACTER_MATERIALS)) {
    if (key.toLowerCase() === lowerKey) {
      return toCharacterMaterialData(key, value);
    }
  }

  return null;
}

/**
 * Check if a character has static material data available.
 */
export function hasStaticMaterialData(characterKey: string): boolean {
  return getStaticCharacterMaterials(characterKey) !== null;
}
