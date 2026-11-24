import { HEROES } from "./content";
import { log10 } from "./numbers";
import type { GameState } from "./types";

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (s: GameState) => boolean;
}

/** Each badge earned grants this much DPS. */
export const ACHIEVEMENT_DPS = 0.03;

const owned = (s: GameState) => HEROES.filter((h) => (s.heroLevels[h.id] || 0) > 0).length;
const totalLevels = (s: GameState) => HEROES.reduce((a, h) => a + (s.heroLevels[h.id] || 0), 0);
const totalGilds = (s: GameState) => Object.values(s.gilds).reduce((a, b) => a + b, 0);
const ancientLevels = (s: GameState) => Object.values(s.ancients).reduce((a, b) => a + b, 0);

function tiered(
  key: string,
  icon: string,
  names: string[],
  values: number[],
  desc: (v: number) => string,
  get: (s: GameState) => number
): AchievementDef[] {
  return values.map((v, i) => ({
    id: `${key}_${i}`,
    name: names[i] ?? `${names[names.length - 1]} ${i + 1}`,
    desc: desc(v),
    icon,
    check: (s: GameState) => get(s) >= v,
  }));
}

const fmt = (n: number) => (n >= 1e6 ? n.toExponential(0).replace("+", "") : n.toLocaleString("en-US"));

export const ACHIEVEMENTS: AchievementDef[] = [
  ...tiered("click", "👆", ["First Click", "Relentless", "Drum of War", "Thousand Fists", "Click Deity"], [1, 100, 1000, 10000, 100000], (v) => `Click ${fmt(v)} times.`, (s) => s.stats.clicks),
  ...tiered("kill", "🗡", ["First Blood", "Hunter", "Slayer", "Exterminator", "Extinction Event"], [1, 100, 1000, 10000, 100000], (v) => `Defeat ${fmt(v)} monsters.`, (s) => s.stats.monsters),
  ...tiered("boss", "👑", ["Boss Slayer", "Titan Hunter", "Kingbreaker", "Crownless Realm", "Godfall"], [1, 10, 50, 250, 1000], (v) => `Defeat ${fmt(v)} bosses.`, (s) => s.stats.bosses),
  ...tiered("zone", "🧭", ["Pathwalker", "Legend", "Realm Breaker", "Centurion", "Beyond Maps", "Edge of Worlds", "Endless"], [10, 25, 50, 100, 150, 200, 300], (v) => `Reach zone ${v}.`, (s) => s.stats.highestZone),
  ...tiered("gold", "💰", ["Coin Purse", "Rich", "Millionaire", "Vault Lord", "Dragon Hoard", "Realm Treasury", "Infinite Wealth"], [3, 5, 6, 9, 15, 24, 40], (v) => `Earn 1e${v} gold lifetime.`, (s) => log10(s.stats.totalGold)),
  ...tiered("hero", "🛡", ["Recruiter", "Hero Collector", "War Party", "Grand Army", "Full Company"], [1, 5, 10, 15, HEROES.length], (v) => `Hire ${v} different heroes.`, owned),
  ...tiered("hlvl", "📈", ["Drillmaster", "Veteran Corps", "Legion", "Myth Forge"], [100, 1000, 5000, 20000], (v) => `Reach ${fmt(v)} total hero levels.`, totalLevels),
  ...tiered("asc", "🔥", ["Ascended", "Reborn", "Eternal Return", "Cycle Breaker"], [1, 5, 15, 40], (v) => `Ascend ${v} time${v > 1 ? "s" : ""}.`, (s) => s.ascensions),
  ...tiered("chest", "🧰", ["Lucky Find", "Treasure Hunter", "Hoarder"], [1, 25, 150], (v) => `Open ${v} treasure chests.`, (s) => s.stats.chests),
  ...tiered("primal", "💀", ["Primal Encounter", "Bone Collector", "Soul Reaper"], [1, 10, 60], (v) => `Defeat ${v} primal bosses.`, (s) => s.stats.primals),
  ...tiered("gild", "✦", ["Gilded", "Golden Company", "Midas Legion"], [1, 10, 50], (v) => `Own ${v} gilds.`, totalGilds),
  ...tiered("combo", "⚡", ["Combo!", "Unstoppable", "Rhythm of Ruin"], [25, 100, 250], (v) => `Reach a ${v}-hit combo.`, (s) => s.stats.bestCombo),
  ...tiered("anc", "🔮", ["Seeker", "Devotee", "High Priest"], [10, 50, 250], (v) => `Own ${v} total ancient levels.`, ancientLevels),
  ...tiered("skill", "✨", ["Spellcaster", "Archmage"], [10, 100], (v) => `Use skills ${v} times.`, (s) => s.stats.skillsUsed),
];
