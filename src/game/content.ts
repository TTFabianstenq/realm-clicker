/* ------------------------------------------------------------------ */
/*  Static game content. All names and art are original.               */
/* ------------------------------------------------------------------ */

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

/** Monster names grouped by art variant (index matches MonsterArt variants). */
export const MONSTER_NAMES: string[][] = [
  ["Mossling", "Ooze Pup", "Bog Jelly", "Glimmer Slime"],
  ["Mossfang", "Cinder Wolf", "Sable Lynx", "Howling Brute"],
  ["Stoneback", "Rune Golem", "Iron Sentinel", "Cragjaw"],
  ["Crystal Crawler", "Ice Skitter", "Night Weaver", "Dust Spinner"],
  ["Prism Drake", "Ember Wyrmling", "Basilisk Pup", "Storm Drake"],
  ["Howling Shade", "Gloom Wraith", "Void Stalker", "Ash Specter"],
  ["Gravebloom", "Spore Lurker", "Capcrawler", "Mirecap"],
  ["Gloom Eye", "Star Eater", "Watcher Below", "Many-Eye"],
  ["Rune Wisp", "Aether Mite", "Ember Sprite", "Will-o'-Wick"],
  ["Hollow Knight-Errant", "Rusted Sentry", "Grave Paladin", "Ashen Squire"],
  ["Tidal Crab", "Iron Pincer", "Reef Brute", "Shellback"],
];

export const MONSTER_PREFIXES = ["", "", "", "Feral ", "Ancient ", "Rabid ", "Cursed ", "Elder ", "Gilded ", "Dread "];

export const BOSS_NAMES = [
  "Elder Mossfang", "Ruin Colossus", "Prism Queen", "Magma Sovereign",
  "Glacier Tyrant", "Umbral Hydra", "Starlight Seraph", "Void Leviathan",
  "Tempest Regent", "Ashen Emperor", "Nova Behemoth", "Gilded Oracle",
  "The Hollow Crown", "Mother of Spores", "Gloom Watcher", "Abyssal Crab King",
];

/* ----------------------------- Heroes ----------------------------- */

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  desc: string;
  baseCost: number;
  baseDps: number;
  hue: number;
  glyph: string;
}

export const HERO_COST_GROWTH = 1.07;

export const HEROES: HeroDef[] = [
  { id: "rowan", name: "Rowan", title: "the Wanderer", desc: "A restless scout who never misses an opening.", baseCost: 50, baseDps: 4, hue: 35, glyph: "⚔" },
  { id: "mira", name: "Mira", title: "the Spellbinder", desc: "Weaves sparks into cutting sigils.", baseCost: 300, baseDps: 16, hue: 280, glyph: "✦" },
  { id: "bronn", name: "Bronn", title: "the Iron Guard", desc: "Turns every stance into crushing force.", baseCost: 1500, baseDps: 57, hue: 210, glyph: "🛡" },
  { id: "nyx", name: "Nyx", title: "the Shadow Archer", desc: "Arrows arrive before the sound.", baseCost: 7000, baseDps: 190, hue: 265, glyph: "🏹" },
  { id: "elara", name: "Elara", title: "the Stormcaller", desc: "Commands lightning like a choir.", baseCost: 35000, baseDps: 660, hue: 200, glyph: "⛈" },
  { id: "torren", name: "Torren", title: "the Stone Knight", desc: "Each blow lands like a landslide.", baseCost: 2e5, baseDps: 2600, hue: 30, glyph: "⛰" },
  { id: "vexa", name: "Vexa", title: "the Void Mage", desc: "Unravels matter at the edges.", baseCost: 1.2e6, baseDps: 10000, hue: 275, glyph: "◉" },
  { id: "kael", name: "Kael", title: "the Dragon Hunter", desc: "Specializes in ending titans.", baseCost: 9e6, baseDps: 50000, hue: 12, glyph: "🐲" },
  { id: "syl", name: "Syl", title: "the Grove Warden", desc: "Roots drink gold and grow blades.", baseCost: 8e7, baseDps: 2.8e5, hue: 130, glyph: "🌿" },
  { id: "orin", name: "Orin", title: "the Clockwork Sage", desc: "Precision multiplied into storms.", baseCost: 8e8, baseDps: 1.7e6, hue: 50, glyph: "⚙" },
  { id: "lira", name: "Lira", title: "the Moon Blade", desc: "Cuts between heartbeats.", baseCost: 1e10, baseDps: 1.2e7, hue: 250, glyph: "☾" },
  { id: "drax", name: "Drax", title: "the Ember Titan", desc: "A walking furnace of ruin.", baseCost: 1.5e11, baseDps: 9.9e7, hue: 16, glyph: "🔥" },
  { id: "seren", name: "Seren", title: "the Tidecaller", desc: "Drowns armies in a single wave.", baseCost: 3e12, baseDps: 1e9, hue: 190, glyph: "🌊" },
  { id: "grimm", name: "Grimm", title: "the Bonewright", desc: "Builds soldiers from what remains.", baseCost: 8e13, baseDps: 1.3e10, hue: 90, glyph: "☠" },
  { id: "aurelia", name: "Aurelia", title: "the Sunforged", desc: "Her shield is a captured dawn.", baseCost: 3e15, baseDps: 2.2e11, hue: 45, glyph: "☀" },
  { id: "volk", name: "Volk", title: "the Frost Giant", desc: "Winters follow his footsteps.", baseCost: 1.5e17, baseDps: 4.7e12, hue: 185, glyph: "❄" },
  { id: "ilyra", name: "Ilyra", title: "the Starweaver", desc: "Stitches constellations into blades.", baseCost: 1e19, baseDps: 1.2e14, hue: 300, glyph: "✷" },
  { id: "mordrek", name: "Mordrek", title: "the Abyss Knight", desc: "Rode out of the deep and never stopped.", baseCost: 1e21, baseDps: 4.5e15, hue: 0, glyph: "♜" },
  { id: "zephra", name: "Zephra", title: "the Windblade", desc: "Faster than her own echo.", baseCost: 2e23, baseDps: 2.8e17, hue: 160, glyph: "🌀" },
  { id: "eon", name: "Eon", title: "the Timeless", desc: "Has already won this fight. Twice.", baseCost: 1e26, baseDps: 3.6e19, hue: 230, glyph: "⌛" },
];

/** Every 25 levels from 200 onward multiplies a hero's DPS by 3. */
export const MILESTONE_START = 200;
export const MILESTONE_STEP = 25;
export const MILESTONE_MULT = 3;

export type HeroUpgradeEffect =
  | { kind: "self"; mult: number }
  | { kind: "global"; pct: number }
  | { kind: "click"; pct: number }
  | { kind: "crit"; pct: number }
  | { kind: "gold"; pct: number }
  | { kind: "dpsClick"; pct: number };

export interface HeroUpgradeDef {
  id: string;
  heroIndex: number;
  name: string;
  desc: string;
  reqLevel: number;
  costMult: number;
  effect: HeroUpgradeEffect;
}

const UP_LEVELS = [10, 25, 50, 75, 100];
const UP_COST = [8, 12, 25, 60, 150];
const UP_NAMES = ["Training", "Mastery", "Rally", "Awakening", "Apotheosis"];

function upgradeEffect(heroIndex: number, slot: number): HeroUpgradeEffect {
  if (slot === 0 || slot === 1) return { kind: "self", mult: 2 };
  if (slot === 3) return { kind: "self", mult: 3 };
  if (slot === 4) return { kind: "self", mult: 4 };
  // slot 2: hero-specific perk
  if (heroIndex === 0) return { kind: "dpsClick", pct: 0.01 };
  switch (heroIndex % 5) {
    case 0: return { kind: "click", pct: 1 };
    case 1: return { kind: "global", pct: 0.1 };
    case 2: return { kind: "crit", pct: 0.02 };
    case 3: return { kind: "gold", pct: 0.15 };
    default: return { kind: "global", pct: 0.15 };
  }
}

export function describeEffect(e: HeroUpgradeEffect, heroName: string): string {
  switch (e.kind) {
    case "self": return `${heroName} DPS ×${e.mult}`;
    case "global": return `+${Math.round(e.pct * 100)}% DPS for all heroes`;
    case "click": return `+${Math.round(e.pct * 100)}% click damage`;
    case "crit": return `+${Math.round(e.pct * 100)}% critical chance`;
    case "gold": return `+${Math.round(e.pct * 100)}% gold found`;
    case "dpsClick": return `Clicks also deal ${Math.round(e.pct * 100)}% of your DPS`;
  }
}

export const HERO_UPGRADES: HeroUpgradeDef[] = HEROES.flatMap((h, hi) =>
  UP_LEVELS.map((lvl, slot) => {
    const effect = upgradeEffect(hi, slot);
    return {
      id: `${h.id}-${slot}`,
      heroIndex: hi,
      name: `${h.name}'s ${UP_NAMES[slot]}`,
      desc: describeEffect(effect, h.name),
      reqLevel: lvl,
      costMult: UP_COST[slot],
      effect,
    };
  })
);

/* ------------------------- Global upgrades ------------------------ */

export type UpgradeCat = "click" | "hero" | "gold" | "progress";

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cat: UpgradeCat;
  baseCost: number;
  growth: number;
  max: number;
  effectPerLevel: number;
}

export const UPGRADES: UpgradeDef[] = [
  { id: "hands", name: "Stronger Hands", icon: "👊", desc: "+25% click damage per level", cat: "click", baseCost: 100, growth: 10, max: 25, effectPerLevel: 0.25 },
  { id: "crit", name: "Critical Strikes", icon: "💥", desc: "+1% crit chance per level", cat: "click", baseCost: 400, growth: 12, max: 20, effectPerLevel: 0.01 },
  { id: "focus", name: "Focused Attacks", icon: "🎯", desc: "+1× crit multiplier per level", cat: "click", baseCost: 800, growth: 12, max: 20, effectPerLevel: 1 },
  { id: "dpsClick", name: "Bladebond", icon: "🗡", desc: "Clicks deal +1% of your DPS per level", cat: "click", baseCost: 5000, growth: 20, max: 15, effectPerLevel: 0.01 },
  { id: "rapid", name: "Combo Training", icon: "⚡", desc: "+20% combo damage cap per level", cat: "click", baseCost: 1500, growth: 12, max: 20, effectPerLevel: 0.2 },
  { id: "heroMult", name: "Hero Training", icon: "⚔", desc: "+15% hero DPS per level", cat: "hero", baseCost: 600, growth: 15, max: 25, effectPerLevel: 0.15 },
  { id: "haste", name: "Battle Cadence", icon: "⏱", desc: "+10% hero DPS per level", cat: "hero", baseCost: 2500, growth: 25, max: 20, effectPerLevel: 0.1 },
  { id: "heroCrit", name: "Hero Precision", icon: "🏹", desc: "+10% hero DPS per level", cat: "hero", baseCost: 8000, growth: 40, max: 20, effectPerLevel: 0.1 },
  { id: "globalDps", name: "War Banner", icon: "🏳", desc: "+20% all DPS per level", cat: "hero", baseCost: 20000, growth: 60, max: 20, effectPerLevel: 0.2 },
  { id: "goldFind", name: "Treasure Sense", icon: "💰", desc: "+15% gold from monsters", cat: "gold", baseCost: 300, growth: 12, max: 30, effectPerLevel: 0.15 },
  { id: "bossGold", name: "Spoils of Titans", icon: "👑", desc: "+30% boss gold per level", cat: "gold", baseCost: 5000, growth: 15, max: 20, effectPerLevel: 0.3 },
  { id: "zoneGold", name: "Treasure Maps", icon: "🗺", desc: "+20% treasure chest chance per level", cat: "gold", baseCost: 12000, growth: 30, max: 15, effectPerLevel: 0.2 },
  { id: "offline", name: "Campfires", icon: "🏕", desc: "+15% offline gold per level", cat: "progress", baseCost: 2000, growth: 15, max: 20, effectPerLevel: 0.15 },
  { id: "zoneBonus", name: "Pathfinder", icon: "🧭", desc: "+5% all damage per level", cat: "progress", baseCost: 15000, growth: 50, max: 20, effectPerLevel: 0.05 },
];

/* ----------------------------- Skills ----------------------------- */

export type SkillId = "storm" | "surge" | "lucky" | "detector" | "midas" | "ritual" | "overpower" | "energize" | "rewind";

export interface SkillDef {
  id: SkillId;
  name: string;
  desc: string;
  icon: string;
  cooldown: number; // seconds
  duration: number; // seconds (0 = instant)
  unlockZone: number;
  hue: number;
}

export const SKILLS: SkillDef[] = [
  { id: "storm", name: "Stormstrike", desc: "Auto-attack 10 times per second for 30s.", icon: "🌩", cooldown: 300, duration: 30, unlockZone: 1, hue: 200 },
  { id: "surge", name: "Warsurge", desc: "Double hero DPS for 30s.", icon: "🔥", cooldown: 600, duration: 30, unlockZone: 5, hue: 12 },
  { id: "lucky", name: "Fortune's Eye", desc: "+50% critical chance for 30s.", icon: "🍀", cooldown: 900, duration: 30, unlockZone: 10, hue: 130 },
  { id: "detector", name: "Gold Sense", desc: "Double gold from kills for 30s.", icon: "💰", cooldown: 1200, duration: 30, unlockZone: 15, hue: 45 },
  { id: "midas", name: "Midas Touch", desc: "Every hit grants 15% of a kill's gold, for 30s.", icon: "✋", cooldown: 1200, duration: 30, unlockZone: 25, hue: 50 },
  { id: "ritual", name: "Blood Pact", desc: "Permanent +5% DPS until you ascend. Stacks.", icon: "🩸", cooldown: 3600, duration: 0, unlockZone: 35, hue: 350 },
  { id: "overpower", name: "Overpower", desc: "Triple click damage for 30s.", icon: "💪", cooldown: 1800, duration: 30, unlockZone: 50, hue: 25 },
  { id: "energize", name: "Empower", desc: "Your next skill is twice as strong / long.", icon: "⚡", cooldown: 1800, duration: 60, unlockZone: 65, hue: 280 },
  { id: "rewind", name: "Rewind", desc: "Cut the last skill's remaining cooldown in half.", icon: "⏳", cooldown: 2400, duration: 0, unlockZone: 80, hue: 230 },
];

/* ---------------------------- Ancients ---------------------------- */

export interface AncientDef {
  id: string;
  name: string;
  title: string;
  desc: string;
  icon: string;
  /** cost(level) = ceil(costMult * (level+1)) unless costExp set: ceil(costMult * costExp^level) */
  costMult: number;
  costExp?: number;
  max: number; // 0 = unlimited
}

export const ANCIENTS: AncientDef[] = [
  { id: "aDps", name: "Valor", title: "Ancient of War", desc: "+15% all DPS per level", icon: "⚔", costMult: 1, max: 0 },
  { id: "aClick", name: "Kestra", title: "Ancient of the Fist", desc: "+50% click damage per level", icon: "👊", costMult: 1, max: 0 },
  { id: "aGold", name: "Aurum", title: "Ancient of Coin", desc: "+10% gold per level", icon: "🪙", costMult: 1, max: 0 },
  { id: "aIdle", name: "Somnus", title: "Ancient of Stillness", desc: "+25% DPS per level when you haven't clicked for 60s", icon: "🌙", costMult: 1, max: 0 },
  { id: "aCrit", name: "Sever", title: "Ancient of Edges", desc: "+0.5% crit chance & +1× crit damage per level", icon: "🗡", costMult: 1, max: 40 },
  { id: "aBoss", name: "Tyrr", title: "Ancient of Trials", desc: "+2s boss timer & +10% boss damage per level", icon: "⏱", costMult: 2, max: 15 },
  { id: "aChest", name: "Coffra", title: "Ancient of Hoards", desc: "+20% chest chance & +50% chest gold per level", icon: "🧰", costMult: 1, max: 25 },
  { id: "aPrimal", name: "Ossa", title: "Ancient of Bones", desc: "+5% primal boss chance & +10% primal Essence per level", icon: "💀", costMult: 2, max: 15 },
  { id: "aSkill", name: "Chrona", title: "Ancient of Hours", desc: "-5% skill cooldowns per level", icon: "⌛", costMult: 3, max: 15 },
  { id: "aOffline", name: "Lull", title: "Ancient of Dreams", desc: "+25% offline gold & +1h offline cap per level", icon: "💤", costMult: 1, max: 8 },
  { id: "aStart", name: "Herald", title: "Ancient of Beginnings", desc: "Start every ascension with bonus gold", icon: "🎺", costMult: 2, max: 20 },
  { id: "aFamiliar", name: "Wisplings", title: "Familiar Swarm", desc: "+1 automatic attack per second per level", icon: "✨", costMult: 5, costExp: 2, max: 10 },
  { id: "aGild", name: "Gildra", title: "Ancient of Gilding", desc: "+10% gild bonus per level", icon: "✦", costMult: 1, max: 0 },
  { id: "aEssence", name: "Vigil", title: "Keeper of Essence", desc: "+1% bonus per unspent Essence per level", icon: "🔮", costMult: 2, max: 0 },
];

/* ---------------------------- Constants --------------------------- */

export const SAVE_VERSION = 2;
export const SAVE_KEY = "realm-clicker-save-v1"; // kept so existing players keep their saves
export const MONSTERS_PER_ZONE = 10;
export const BOSS_EVERY = 5;
export const BOSS_TIMER = 30;
export const BASE_OFFLINE_CAP_H = 8;
export const PRIMAL_MIN_ZONE = 25;
export const GILD_START_ZONE = 30;
export const ESSENCE_DPS = 0.1;
export const COMBO_WINDOW_MS = 900;
