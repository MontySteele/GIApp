/**
 * Weapon Constants
 *
 * Contains weapon types, stats, and ascension data
 */

export type WeaponType = 'sword' | 'claymore' | 'polearm' | 'bow' | 'catalyst';

export const WEAPON_TYPE_NAMES: Record<WeaponType, string> = {
  sword: 'Sword',
  claymore: 'Claymore',
  polearm: 'Polearm',
  bow: 'Bow',
  catalyst: 'Catalyst',
};

// Weapon rarity colors
export const RARITY_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-yellow-400',
};

export const RARITY_BG_COLORS: Record<number, string> = {
  1: 'bg-gray-900/30 border-gray-700',
  2: 'bg-green-900/30 border-green-700',
  3: 'bg-blue-900/30 border-blue-700',
  4: 'bg-purple-900/30 border-purple-700',
  5: 'bg-yellow-900/30 border-yellow-700',
};

// Max level by ascension
export const WEAPON_MAX_LEVEL_BY_ASCENSION = [20, 40, 50, 60, 70, 80, 90] as const;

// Common 5-star weapons with their types (for display purposes)
export const WEAPON_DATA: Record<string, { name: string; type: WeaponType; rarity: number }> = {
  // 5-star Swords
  'MistsplitterReforged': { name: 'Mistsplitter Reforged', type: 'sword', rarity: 5 },
  'PrimordialJadeCutter': { name: 'Primordial Jade Cutter', type: 'sword', rarity: 5 },
  'LightOfFoliarIncision': { name: 'Light of Foliar Incision', type: 'sword', rarity: 5 },
  'HaranGeppakuFutsu': { name: 'Haran Geppaku Futsu', type: 'sword', rarity: 5 },
  'AquilaFavonia': { name: 'Aquila Favonia', type: 'sword', rarity: 5 },
  'SkywardBlade': { name: 'Skyward Blade', type: 'sword', rarity: 5 },
  'FreedomSworn': { name: 'Freedom-Sworn', type: 'sword', rarity: 5 },
  'SummitShaper': { name: 'Summit Shaper', type: 'sword', rarity: 5 },
  'KeyOfKhajNisut': { name: 'Key of Khaj-Nisut', type: 'sword', rarity: 5 },
  'SplendorOfTranquilWaters': { name: 'Splendor of Tranquil Waters', type: 'sword', rarity: 5 },
  'UrakuMisugiri': { name: 'Uraku Misugiri', type: 'sword', rarity: 5 },
  'AbsoluteZero': { name: 'Absolute Zero', type: 'sword', rarity: 5 },

  // 5-star Claymores
  'SongOfBrokenPines': { name: 'Song of Broken Pines', type: 'claymore', rarity: 5 },
  'RedhornStonethresher': { name: 'Redhorn Stonethresher', type: 'claymore', rarity: 5 },
  'WolfsGravestone': { name: "Wolf's Gravestone", type: 'claymore', rarity: 5 },
  'SkywardPride': { name: 'Skyward Pride', type: 'claymore', rarity: 5 },
  'TheUnforged': { name: 'The Unforged', type: 'claymore', rarity: 5 },
  'BeaconOfTheReedSea': { name: 'Beacon of the Reed Sea', type: 'claymore', rarity: 5 },
  'ConsideredJudgment': { name: 'Considered Judgment', type: 'claymore', rarity: 5 },
  'FangOfTheMountainKing': { name: 'Fang of the Mountain King', type: 'claymore', rarity: 5 },

  // 5-star Polearms
  'StaffOfHoma': { name: 'Staff of Homa', type: 'polearm', rarity: 5 },
  'EngulfingLightning': { name: 'Engulfing Lightning', type: 'polearm', rarity: 5 },
  'PrimordialJadeWingedSpear': { name: 'Primordial Jade Winged-Spear', type: 'polearm', rarity: 5 },
  'SkywardSpine': { name: 'Skyward Spine', type: 'polearm', rarity: 5 },
  'VortexVanquisher': { name: 'Vortex Vanquisher', type: 'polearm', rarity: 5 },
  'CalamityQueller': { name: 'Calamity Queller', type: 'polearm', rarity: 5 },
  'StaffOfTheScarletSands': { name: 'Staff of the Scarlet Sands', type: 'polearm', rarity: 5 },
  'CrimsonMoonsSemblance': { name: "Crimson Moon's Semblance", type: 'polearm', rarity: 5 },
  'LumidouceElegy': { name: 'Lumidouce Elegy', type: 'polearm', rarity: 5 },

  // 5-star Bows
  'AmosBow': { name: "Amos' Bow", type: 'bow', rarity: 5 },
  'ElegyForTheEnd': { name: 'Elegy for the End', type: 'bow', rarity: 5 },
  'ThunderingPulse': { name: 'Thundering Pulse', type: 'bow', rarity: 5 },
  'PolarStar': { name: 'Polar Star', type: 'bow', rarity: 5 },
  'AquaSimulacra': { name: 'Aqua Simulacra', type: 'bow', rarity: 5 },
  'HuntersPath': { name: "Hunter's Path", type: 'bow', rarity: 5 },
  'SkywardHarp': { name: 'Skyward Harp', type: 'bow', rarity: 5 },
  'TheFirstGreatMagic': { name: 'The First Great Magic', type: 'bow', rarity: 5 },
  'SilvershowerHeartstrings': { name: 'Silvershower Heartstrings', type: 'bow', rarity: 5 },

  // 5-star Catalysts
  'AThousandFloatingDreams': { name: 'A Thousand Floating Dreams', type: 'catalyst', rarity: 5 },
  'KagurasVerity': { name: "Kagura's Verity", type: 'catalyst', rarity: 5 },
  'EverlastingMoonglow': { name: 'Everlasting Moonglow', type: 'catalyst', rarity: 5 },
  'MemoryOfDust': { name: 'Memory of Dust', type: 'catalyst', rarity: 5 },
  'LostPrayerToTheSacredWinds': { name: 'Lost Prayer to the Sacred Winds', type: 'catalyst', rarity: 5 },
  'SkywardAtlas': { name: 'Skyward Atlas', type: 'catalyst', rarity: 5 },
  'TulaytullahsRemembrance': { name: "Tulaytullah's Remembrance", type: 'catalyst', rarity: 5 },
  'JadeFallsSplendor': { name: "Jadefall's Splendor", type: 'catalyst', rarity: 5 },
  'TomeOfTheEternalFlow': { name: 'Tome of the Eternal Flow', type: 'catalyst', rarity: 5 },
  'CashflowSupervision': { name: 'Cashflow Supervision', type: 'catalyst', rarity: 5 },
  'SurfsUp': { name: "Surf's Up", type: 'catalyst', rarity: 5 },
  'CranesEchoingCall': { name: "Crane's Echoing Call", type: 'catalyst', rarity: 5 },

  // 4-star Swords
  'TheFluteOfEzpitzal': { name: 'The Flute of Ezpitzal', type: 'sword', rarity: 4 },
  'TheBlackSword': { name: 'The Black Sword', type: 'sword', rarity: 4 },
  'SacrificialSword': { name: 'Sacrificial Sword', type: 'sword', rarity: 4 },
  'LionsRoar': { name: "Lion's Roar", type: 'sword', rarity: 4 },
  'IronSting': { name: 'Iron Sting', type: 'sword', rarity: 4 },
  'FavoniusSword': { name: 'Favonius Sword', type: 'sword', rarity: 4 },
  'TheFlute': { name: 'The Flute', type: 'sword', rarity: 4 },
  'AmenomaKageuchi': { name: 'Amenoma Kageuchi', type: 'sword', rarity: 4 },
  'BlackcliffLongsword': { name: 'Blackcliff Longsword', type: 'sword', rarity: 4 },
  'PrototypeRancour': { name: 'Prototype Rancour', type: 'sword', rarity: 4 },
  'CinnabarSpindle': { name: 'Cinnabar Spindle', type: 'sword', rarity: 4 },
  'XiphosMoonlight': { name: "Xiphos' Moonlight", type: 'sword', rarity: 4 },
  'ToukabouShigure': { name: 'Toukabou Shigure', type: 'sword', rarity: 4 },
  'WolfFang': { name: 'Wolf-Fang', type: 'sword', rarity: 4 },
  'FinaleOfTheDeep': { name: 'Finale of the Deep', type: 'sword', rarity: 4 },
  'FleuveCendreFerryman': { name: 'Fleuve Cendre Ferryman', type: 'sword', rarity: 4 },
  'TheDockhandsAssistant': { name: "The Dockhand's Assistant", type: 'sword', rarity: 4 },
  'SwordOfNarzissenkreuz': { name: 'Sword of Narzissenkreuz', type: 'sword', rarity: 4 },
  'SacrificialJade': { name: 'Sacrificial Jade', type: 'sword', rarity: 4 },

  // 4-star Claymores
  'SerpentSpine': { name: 'Serpent Spine', type: 'claymore', rarity: 4 },
  'Rainslasher': { name: 'Rainslasher', type: 'claymore', rarity: 4 },
  'SacrificialGreatsword': { name: 'Sacrificial Greatsword', type: 'claymore', rarity: 4 },
  'TheBell': { name: 'The Bell', type: 'claymore', rarity: 4 },
  'FavoniusGreatsword': { name: 'Favonius Greatsword', type: 'claymore', rarity: 4 },
  'Whiteblind': { name: 'Whiteblind', type: 'claymore', rarity: 4 },
  'PrototypeArchaic': { name: 'Prototype Archaic', type: 'claymore', rarity: 4 },
  'BlackcliffSlasher': { name: 'Blackcliff Slasher', type: 'claymore', rarity: 4 },
  'LithicBlade': { name: 'Lithic Blade', type: 'claymore', rarity: 4 },
  'SnowTombedStarsilver': { name: 'Snow-Tombed Starsilver', type: 'claymore', rarity: 4 },
  'KatsuragikiriNagamasa': { name: 'Katsuragikiri Nagamasa', type: 'claymore', rarity: 4 },
  'Akuoumaru': { name: 'Akuoumaru', type: 'claymore', rarity: 4 },
  'ForestRegalia': { name: 'Forest Regalia', type: 'claymore', rarity: 4 },
  'MakhairaAquamarine': { name: 'Makhaira Aquamarine', type: 'claymore', rarity: 4 },
  'MailedFlower': { name: 'Mailed Flower', type: 'claymore', rarity: 4 },
  'TalkingStick': { name: 'Talking Stick', type: 'claymore', rarity: 4 },
  'TidalShadow': { name: 'Tidal Shadow', type: 'claymore', rarity: 4 },
  'UltimateOverlordsMegaMagicSword': { name: "Ultimate Overlord's Mega Magic Sword", type: 'claymore', rarity: 4 },
  'PortablePowerSaw': { name: 'Portable Power Saw', type: 'claymore', rarity: 4 },
  'EarthShaker': { name: 'Earth Shaker', type: 'claymore', rarity: 4 },
  'Cloudforged': { name: 'Cloudforged', type: 'claymore', rarity: 4 },

  // 4-star Polearms
  'DragonsBane': { name: "Dragon's Bane", type: 'polearm', rarity: 4 },
  'FavoniusLance': { name: 'Favonius Lance', type: 'polearm', rarity: 4 },
  'PrototypeStarglitter': { name: 'Prototype Starglitter', type: 'polearm', rarity: 4 },
  'CrescentPike': { name: 'Crescent Pike', type: 'polearm', rarity: 4 },
  'BlackcliffPole': { name: 'Blackcliff Pole', type: 'polearm', rarity: 4 },
  'Deathmatch': { name: 'Deathmatch', type: 'polearm', rarity: 4 },
  'LithicSpear': { name: 'Lithic Spear', type: 'polearm', rarity: 4 },
  'DragonspineSpear': { name: 'Dragonspine Spear', type: 'polearm', rarity: 4 },
  'TheCatch': { name: '"The Catch"', type: 'polearm', rarity: 4 },
  'KitainCrossSpear': { name: 'Kitain Cross Spear', type: 'polearm', rarity: 4 },
  'WavebreakersFin': { name: "Wavebreaker's Fin", type: 'polearm', rarity: 4 },
  'MissiveWindspear': { name: 'Missive Windspear', type: 'polearm', rarity: 4 },
  'Moonpiercer': { name: 'Moonpiercer', type: 'polearm', rarity: 4 },
  'BalladOfTheFjords': { name: 'Ballad of the Fjords', type: 'polearm', rarity: 4 },
  'RightfulReward': { name: 'Rightful Reward', type: 'polearm', rarity: 4 },
  'ProspectorsDrill': { name: "Prospector's Drill", type: 'polearm', rarity: 4 },
  'DialoguesOfTheDesertSages': { name: 'Dialogues of the Desert Sages', type: 'polearm', rarity: 4 },
  'FootprintOfTheRainbow': { name: 'Footprint of the Rainbow', type: 'polearm', rarity: 4 },
  'MountainBracingBolt': { name: 'Mountain-Bracing Bolt', type: 'polearm', rarity: 4 },

  // 4-star Bows
  'Rust': { name: 'Rust', type: 'bow', rarity: 4 },
  'SacrificialBow': { name: 'Sacrificial Bow', type: 'bow', rarity: 4 },
  'TheStringless': { name: 'The Stringless', type: 'bow', rarity: 4 },
  'FavoniusWarbow': { name: 'Favonius Warbow', type: 'bow', rarity: 4 },
  'PrototypeCrescent': { name: 'Prototype Crescent', type: 'bow', rarity: 4 },
  'CompoundBow': { name: 'Compound Bow', type: 'bow', rarity: 4 },
  'BlackcliffWarbow': { name: 'Blackcliff Warbow', type: 'bow', rarity: 4 },
  'TheViridescentHunt': { name: 'The Viridescent Hunt', type: 'bow', rarity: 4 },
  'WindblumeOde': { name: 'Windblume Ode', type: 'bow', rarity: 4 },
  'MitternachtsWaltz': { name: 'Mitternachts Waltz', type: 'bow', rarity: 4 },
  'Hamayumi': { name: 'Hamayumi', type: 'bow', rarity: 4 },
  'MouunsMoon': { name: "Mouun's Moon", type: 'bow', rarity: 4 },
  'Predator': { name: 'Predator', type: 'bow', rarity: 4 },
  'FadingTwilight': { name: 'Fading Twilight', type: 'bow', rarity: 4 },
  'KingsSquire': { name: "King's Squire", type: 'bow', rarity: 4 },
  'EndOfTheLine': { name: 'End of the Line', type: 'bow', rarity: 4 },
  'Ibis': { name: 'Ibis Piercer', type: 'bow', rarity: 4 },
  'ScionOfTheBlazingSun': { name: 'Scion of the Blazing Sun', type: 'bow', rarity: 4 },
  'SongOfStillness': { name: 'Song of Stillness', type: 'bow', rarity: 4 },
  'RangeGauge': { name: 'Range Gauge', type: 'bow', rarity: 4 },
  'ChainBreaker': { name: 'Chain Breaker', type: 'bow', rarity: 4 },

  // 4-star Catalysts
  'SacrificialFragments': { name: 'Sacrificial Fragments', type: 'catalyst', rarity: 4 },
  'TheWidsith': { name: 'The Widsith', type: 'catalyst', rarity: 4 },
  'SolarPearl': { name: 'Solar Pearl', type: 'catalyst', rarity: 4 },
  'EyeOfPerception': { name: 'Eye of Perception', type: 'catalyst', rarity: 4 },
  'FavoniusCodex': { name: 'Favonius Codex', type: 'catalyst', rarity: 4 },
  'PrototypeAmber': { name: 'Prototype Amber', type: 'catalyst', rarity: 4 },
  'MappaMare': { name: 'Mappa Mare', type: 'catalyst', rarity: 4 },
  'BlackcliffAgate': { name: 'Blackcliff Agate', type: 'catalyst', rarity: 4 },
  'Frostbearer': { name: 'Frostbearer', type: 'catalyst', rarity: 4 },
  'DodocoTales': { name: 'Dodoco Tales', type: 'catalyst', rarity: 4 },
  'HakushinRing': { name: 'Hakushin Ring', type: 'catalyst', rarity: 4 },
  'OathswornEye': { name: 'Oathsworn Eye', type: 'catalyst', rarity: 4 },
  'WanderingEvenstar': { name: 'Wandering Evenstar', type: 'catalyst', rarity: 4 },
  'FruitOfFulfillment': { name: 'Fruit of Fulfillment', type: 'catalyst', rarity: 4 },
  'FlowingPurity': { name: 'Flowing Purity', type: 'catalyst', rarity: 4 },
  'BalladOfTheBoundlessBlue': { name: 'Ballad of the Boundless Blue', type: 'catalyst', rarity: 4 },
  'AshGravenDrinkingHorn': { name: 'Ash-Graven Drinking Horn', type: 'catalyst', rarity: 4 },
  'RingOfYaxche': { name: 'Ring of Yaxche', type: 'catalyst', rarity: 4 },

  // 3-star weapons (commonly used)
  'HarbingerOfDawn': { name: 'Harbinger of Dawn', type: 'sword', rarity: 3 },
  'CoolSteel': { name: 'Cool Steel', type: 'sword', rarity: 3 },
  'SkyriderSword': { name: 'Skyrider Sword', type: 'sword', rarity: 3 },
  'FerrousShadow': { name: 'Ferrous Shadow', type: 'claymore', rarity: 3 },
  'BloodtaintedGreatsword': { name: 'Bloodtainted Greatsword', type: 'claymore', rarity: 3 },
  'WhiteTassel': { name: 'White Tassel', type: 'polearm', rarity: 3 },
  'BlackTassel': { name: 'Black Tassel', type: 'polearm', rarity: 3 },
  'Slingshot': { name: 'Slingshot', type: 'bow', rarity: 3 },
  'RavenBow': { name: 'Raven Bow', type: 'bow', rarity: 3 },
  'ThrillingTalesOfDragonSlayers': { name: 'Thrilling Tales of Dragon Slayers', type: 'catalyst', rarity: 3 },
  'TwinNephrite': { name: 'Twin Nephrite', type: 'catalyst', rarity: 3 },
  'MagicGuide': { name: 'Magic Guide', type: 'catalyst', rarity: 3 },
};

/**
 * Get weapon display name
 */
export function getWeaponName(key: string): string {
  return WEAPON_DATA[key]?.name ?? formatWeaponKey(key);
}

/**
 * Get weapon type
 */
export function getWeaponType(key: string): WeaponType | undefined {
  return WEAPON_DATA[key]?.type;
}

/**
 * Get weapon rarity
 */
export function getWeaponRarity(key: string): number {
  return WEAPON_DATA[key]?.rarity ?? 4;
}

/**
 * Format weapon key to readable name (fallback)
 */
export function formatWeaponKey(key: string): string {
  // Convert camelCase/PascalCase to spaces
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
}

/**
 * Get refinement display text
 */
export function getRefinementDisplay(refinement: number): string {
  return `R${refinement}`;
}

/**
 * Get refinement color
 */
export function getRefinementColor(refinement: number): string {
  switch (refinement) {
    case 5: return 'text-yellow-400';
    case 4: return 'text-purple-400';
    case 3: return 'text-blue-400';
    case 2: return 'text-green-400';
    default: return 'text-slate-400';
  }
}
