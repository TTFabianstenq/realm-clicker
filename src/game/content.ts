export const ZONE_THEMES = [
  { name: "Whispering Woods", hue: 140 },
  { name: "Ancient Ruins", hue: 40 },
  { name: "Crystal Caverns", hue: 200 },
  { name: "Ember Wastes", hue: 18 },
  { name: "Frostreach", hue: 195 },
  { name: "Umbral Marsh", hue: 270 },
  { name: "Celestial Spire", hue: 50 },
  { name: "Void Expanse", hue: 280 },
  { name: "Storm Crown", hue: 220 },
  { name: "Ashen Throne", hue: 10 },
  { name: "Starfall Basin", hue: 260 },
  { name: "Gilded Labyrinth", hue: 45 },
];

export const MONSTER_NAMES = [
  "Mossfang", "Ember Rat", "Stoneback", "Thorn Beast", "Crystal Crawler",
  "Shadow Hound", "Frost Warden", "Lava Brute", "Void Stalker", "Star Eater",
  "Bramble Imp", "Dust Serpent", "Glimmer Beetle", "Rune Wisp", "Cinder Wolf",
  "Ice Skitter", "Night Moth", "Basilisk Pup", "Gravebloom", "Aether Mite",
  "Iron Toad", "Sable Lynx", "Prism Drake", "Howling Shade", "Sunscar Beetle",
];

export const BOSS_NAMES = [
  "Elder Mossfang", "Ruin Colossus", "Prism Queen", "Magma Sovereign",
  "Glacier Tyrant", "Umbral Hydra", "Starlight Seraph", "Void Leviathan",
  "Tempest Regent", "Ashen Emperor", "Nova Behemoth", "Gilded Oracle",
];

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  desc: string;
  baseCost: number;
  baseDps: number;
  costGrowth: number;
  unlockZone: number;
  hue: number;
  glyph: string;
}

export const HEROES: HeroDef[] = [
  { id: "rowan", name: "Rowan", title: "the Wanderer", desc: "A restless scout who never misses an opening.", baseCost: 50, baseDps: 1, costGrowth: 1.15, unlockZone: 1, hue: 35, glyph: "⚔" },
  { id: "mira", name: "Mira", title: "the Spellbinder", desc: "Weaves sparks into cutting sigils.", baseCost: 250, baseDps: 5, costGrowth: 1.155, unlockZone: 2, hue: 280, glyph: "✦" },
  { id: "bronn", name: "Bronn", title: "the Iron Guard", desc: "Turns every stance into crushing force.", baseCost: 1000, baseDps: 22, costGrowth: 1.16, unlockZone: 3, hue: 210, glyph: "🛡" },
  { id: "nyx", name: "Nyx", title: "the Shadow Archer", desc: "Arrows arrive before the sound.", baseCost: 4000, baseDps: 85, costGrowth: 1.16, unlockZone: 4, hue: 265, glyph: "🏹" },
  { id: "elara", name: "Elara", title: "the Stormcaller", desc: "Commands lightning like a choir.", baseCost: 20000, baseDps: 320, costGrowth: 1.165, unlockZone: 6, hue: 200, glyph: "⛈" },
  { id: "torren", name: "Torren", title: "the Stone Knight", desc: "Each blow lands like a landslide.", baseCost: 100000, baseDps: 1250, costGrowth: 1.17, unlockZone: 8, hue: 30, glyph: "⛰" },
  { id: "vexa", name: "Vexa", title: "the Void Mage", desc: "Unravels matter at the edges.", baseCost: 5e5, baseDps: 5200, costGrowth: 1.17, unlockZone: 10, hue: 275, glyph: "◉" },
  { id: "kael", name: "Kael", title: "the Dragon Hunter", desc: "Specializes in ending titans.", baseCost: 2.5e6, baseDps: 22000, costGrowth: 1.175, unlockZone: 12, hue: 12, glyph: "🐲" },
  { id: "syl", name: "Syl", title: "the Grove Warden", desc: "Roots drink gold and grow blades.", baseCost: 1.2e7, baseDps: 9e4, costGrowth: 1.175, unlockZone: 15, hue: 130, glyph: "🌿" },
  { id: "orin", name: "Orin", title: "the Clockwork Sage", desc: "Precision multiplied into storms.", baseCost: 6e7, baseDps: 4e5, costGrowth: 1.18, unlockZone: 18, hue: 50, glyph: "⚙" },
  { id: "lira", name: "Lira", title: "the Moon Blade", desc: "Cuts between heartbeats.", baseCost: 3e8, baseDps: 1.8e6, costGrowth: 1.18, unlockZone: 22, hue: 250, glyph: "☾" },
  { id: "drax", name: "Drax", title: "the Ember Titan", desc: "A walking furnace of ruin.", baseCost: 1.5e9, baseDps: 8e6, costGrowth: 1.185, unlockZone: 26, hue: 16, glyph: "🔥" },
];

export type UpgradeCat = "click" | "hero" | "gold" | "progress";

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  cat: UpgradeCat;
  baseCost: number;
  growth: number;
  max: number;
  effectPerLevel: number;
}

export const UPGRADES: UpgradeDef[] = [
  { id: "hands", name: "Stronger Hands", desc: "+15% click damage per level", cat: "click", baseCost: 100, growth: 1.35, max: 100, effectPerLevel: 0.15 },
  { id: "crit", name: "Critical Strikes", desc: "+1.5% crit chance per level", cat: "click", baseCost: 400, growth: 1.4, max: 40, effectPerLevel: 0.015 },
  { id: "focus", name: "Focused Attacks", desc: "+20% crit multiplier per level", cat: "click", baseCost: 800, growth: 1.38, max: 50, effectPerLevel: 0.2 },
  { id: "rapid", name: "Rapid Clicking", desc: "+8% click damage per level", cat: "click", baseCost: 1500, growth: 1.36, max: 80, effectPerLevel: 0.08 },
  { id: "heroMult", name: "Hero Training", desc: "+12% hero DPS per level", cat: "hero", baseCost: 600, growth: 1.37, max: 100, effectPerLevel: 0.12 },
  { id: "haste", name: "Battle Cadence", desc: "+5% effective DPS (attack tempo)", cat: "hero", baseCost: 2500, growth: 1.4, max: 40, effectPerLevel: 0.05 },
  { id: "heroCrit", name: "Hero Precision", desc: "+8% hero damage per level", cat: "hero", baseCost: 8000, growth: 1.42, max: 50, effectPerLevel: 0.08 },
  { id: "globalDps", name: "War Banner", desc: "+10% global DPS per level", cat: "hero", baseCost: 20000, growth: 1.45, max: 60, effectPerLevel: 0.1 },
  { id: "goldFind", name: "Treasure Sense", desc: "+10% gold from monsters", cat: "gold", baseCost: 300, growth: 1.33, max: 80, effectPerLevel: 0.1 },
  { id: "bossGold", name: "Spoils of Titans", desc: "+20% boss gold", cat: "gold", baseCost: 5000, growth: 1.4, max: 40, effectPerLevel: 0.2 },
  { id: "zoneGold", name: "Cartographer's Cut", desc: "+2% gold per current zone / 10 levels", cat: "gold", baseCost: 12000, growth: 1.42, max: 30, effectPerLevel: 0.02 },
  { id: "offline", name: "Campfires", desc: "+15% offline gold per level", cat: "progress", baseCost: 2000, growth: 1.4, max: 20, effectPerLevel: 0.15 },
  { id: "zoneBonus", name: "Pathfinder", desc: "+4% all damage per level", cat: "progress", baseCost: 15000, growth: 1.45, max: 40, effectPerLevel: 0.04 },
];

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  cooldown: number;
  duration: number;
  hue: number;
}

export const SKILLS: SkillDef[] = [
  { id: "power", name: "Power Strike", desc: "Deal 80× click damage instantly.", cooldown: 20, duration: 0, hue: 12 },
  { id: "goldrush", name: "Gold Rush", desc: "2.5× gold for 20s.", cooldown: 90, duration: 20, hue: 45 },
  { id: "frenzy", name: "Frenzy", desc: "2.5× hero DPS for 15s.", cooldown: 75, duration: 15, hue: 0 },
  { id: "meteor", name: "Meteor", desc: "Deal 40× current DPS instantly.", cooldown: 45, duration: 0, hue: 22 },
  { id: "lucky", name: "Lucky Hit", desc: "+35% crit chance for 12s.", cooldown: 60, duration: 12, hue: 280 },
];

export interface PrestigeDef {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  growth: number;
  effect: number;
  max: number;
}

export const PRESTIGE: PrestigeDef[] = [
  { id: "pClick", name: "Eternal Hands", desc: "+20% click damage", baseCost: 1, growth: 1.6, effect: 0.2, max: 50 },
  { id: "pDps", name: "Bound Companions", desc: "+20% hero DPS", baseCost: 1, growth: 1.6, effect: 0.2, max: 50 },
  { id: "pGold", name: "Gilded Fate", desc: "+15% gold", baseCost: 2, growth: 1.55, effect: 0.15, max: 40 },
  { id: "pStart", name: "Head Start", desc: "Start with extra gold after Ascension", baseCost: 3, growth: 1.7, effect: 1, max: 20 },
  { id: "pOff", name: "Dream Harvest", desc: "+25% offline gold", baseCost: 2, growth: 1.6, effect: 0.25, max: 20 },
  { id: "pCrit", name: "Fate's Edge", desc: "+2% crit chance", baseCost: 4, growth: 1.75, effect: 0.02, max: 15 },
  { id: "pBoss", name: "Titan Breaker", desc: "+25% damage to bosses", baseCost: 3, growth: 1.65, effect: 0.25, max: 20 },
];

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "firstClick", name: "First Click", desc: "Make your first attack." },
  { id: "firstBlood", name: "First Blood", desc: "Defeat your first monster." },
  { id: "rich", name: "Rich", desc: "Earn 100,000 gold lifetime." },
  { id: "millionaire", name: "Millionaire", desc: "Earn 1,000,000 gold lifetime." },
  { id: "bossSlayer", name: "Boss Slayer", desc: "Defeat your first boss." },
  { id: "heroCollector", name: "Hero Collector", desc: "Unlock 5 heroes." },
  { id: "ascended", name: "Ascended", desc: "Ascend for the first time." },
  { id: "legend", name: "Legend", desc: "Reach zone 25." },
  { id: "click100", name: "Relentless", desc: "Click 100 times." },
  { id: "click1k", name: "Drum of War", desc: "Click 1,000 times." },
  { id: "zone10", name: "Pathwalker", desc: "Reach zone 10." },
  { id: "zone50", name: "Realm Breaker", desc: "Reach zone 50." },
  { id: "heroesAll", name: "Full Company", desc: "Unlock every hero." },
  { id: "boss10", name: "Titan Hunter", desc: "Defeat 10 bosses." },
  { id: "gold1b", name: "Vault Lord", desc: "Earn 1B gold lifetime." },
];

export interface QuestDef {
  id: string;
  name: string;
  desc: string;
  type: "kills" | "heroUp" | "gold" | "boss" | "zone" | "clicks";
  target: number;
  goldReward: number;
}

export const QUESTS: QuestDef[] = [
  { id: "q1", name: "Warmup", desc: "Defeat 10 monsters", type: "kills", target: 10, goldReward: 80 },
  { id: "q2", name: "Training", desc: "Upgrade any hero 5 times", type: "heroUp", target: 5, goldReward: 200 },
  { id: "q3", name: "Purse", desc: "Earn 10,000 gold this run", type: "gold", target: 10000, goldReward: 1500 },
  { id: "q4", name: "Challenge", desc: "Defeat a boss", type: "boss", target: 1, goldReward: 2500 },
  { id: "q5", name: "Frontier", desc: "Reach zone 10", type: "zone", target: 10, goldReward: 8000 },
  { id: "q6", name: "Onslaught", desc: "Click 250 times", type: "clicks", target: 250, goldReward: 1200 },
  { id: "q7", name: "Company", desc: "Upgrade heroes 25 times", type: "heroUp", target: 25, goldReward: 20000 },
  { id: "q8", name: "Warpath", desc: "Defeat 200 monsters", type: "kills", target: 200, goldReward: 50000 },
];

export const SAVE_VERSION = 1;
export const SAVE_KEY = "realm-clicker-save-v1";
export const MONSTERS_PER_ZONE = 10;
export const BOSS_EVERY = 10;
export const BOSS_TIMER = 30;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
export const ASCEND_MIN_ZONE = 12;
