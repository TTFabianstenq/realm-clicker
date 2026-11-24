import {
  BOSS_EVERY, BOSS_NAMES, HERO_COST_GROWTH, HEROES, MILESTONE_MULT, MILESTONE_START, MILESTONE_STEP,
  MONSTER_NAMES, MONSTER_PREFIXES, PRIMAL_MIN_ZONE, ZONE_THEMES, ANCIENTS,
} from "./content";
import { Dec, ZERO, add, div, exp10, fromNumber, log10, mul, mulN, pow, sub, gte, cmp } from "./numbers";

export function zoneTheme(zone: number) {
  return ZONE_THEMES[Math.floor((zone - 1) / BOSS_EVERY) % ZONE_THEMES.length];
}

export function isBossZone(zone: number) {
  return zone % BOSS_EVERY === 0;
}

export function roman(n: number): string {
  const map: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

export function monsterName(zone: number, seed: number, kind: "normal" | "boss" | "chest"): string {
  if (kind === "chest") return "Treasure Chest";
  if (kind === "boss") {
    const idx = Math.floor(zone / BOSS_EVERY - 1);
    const base = BOSS_NAMES[((idx % BOSS_NAMES.length) + BOSS_NAMES.length) % BOSS_NAMES.length];
    const cycle = Math.floor(idx / BOSS_NAMES.length);
    return cycle > 0 ? `${base} ${roman(cycle + 1)}` : base;
  }
  const group = MONSTER_NAMES[seed % MONSTER_NAMES.length];
  const name = group[Math.floor(seed / MONSTER_NAMES.length) % group.length];
  const pre = zone > 20 ? MONSTER_PREFIXES[Math.floor(seed / 7) % MONSTER_PREFIXES.length] : "";
  return pre + name;
}

/** Deterministic pseudo-random in [0,1) from integers. */
export function hash01(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/* ----------------------------- Monsters ---------------------------- */

const HP_BREAK = 140;
const LOG_1145 = Math.log10(1.16);

export function baseMonsterHP(zone: number): Dec {
  if (zone <= HP_BREAK) {
    return mulN(add(fromNumber(zone - 1), pow(1.55, zone - 1)), 10);
  }
  const at = mulN(add(fromNumber(HP_BREAK - 1), pow(1.55, HP_BREAK - 1)), 10);
  let l = log10(at) + (zone - HP_BREAK) * LOG_1145;
  if (zone > 500) l += (zone - 500) * Math.log10(1.18 / 1.16);
  return exp10(l);
}

export function monsterHP(zone: number, kind: "normal" | "boss" | "chest"): Dec {
  const hp = baseMonsterHP(zone);
  if (kind === "boss") return mulN(hp, 10);
  if (kind === "chest") return mulN(hp, 0.8);
  return hp;
}

/** Base gold for a normal kill in a zone, before multipliers. */
export function baseMonsterGold(zone: number): Dec {
  let g = div(baseMonsterHP(zone), fromNumber(15));
  if (zone > 75) g = mulN(g, Math.min(3, 1.025 ** (zone - 75)));
  if (cmp(g, fromNumber(1)) < 0) g = fromNumber(1);
  return g;
}

export function monsterGold(zone: number, kind: "normal" | "boss" | "chest"): Dec {
  const g = baseMonsterGold(zone);
  if (kind === "boss") return mulN(g, 10);
  if (kind === "chest") return mulN(g, 10);
  return g;
}

/* ------------------------------ Heroes ----------------------------- */

const LOG_G = Math.log10(HERO_COST_GROWTH);

export function heroCost(heroIndex: number, level: number): Dec {
  return mul(fromNumber(HEROES[heroIndex].baseCost), pow(HERO_COST_GROWTH, level));
}

/** Total cost of buying n levels starting at `level`. */
export function heroCostBulk(heroIndex: number, level: number, n: number): Dec {
  if (n <= 0) return ZERO;
  const first = heroCost(heroIndex, level);
  if (n === 1) return first;
  // first * (g^n - 1) / (g - 1)
  const gn = pow(HERO_COST_GROWTH, n);
  return div(mul(first, sub(gn, fromNumber(1))), fromNumber(HERO_COST_GROWTH - 1));
}

/** Max levels affordable with `gold`. */
export function heroMaxAffordable(heroIndex: number, level: number, gold: Dec): number {
  const first = heroCost(heroIndex, level);
  if (!gte(gold, first)) return 0;
  // n = floor(log_g(gold*(g-1)/first + 1))
  const r = log10(gold) - log10(first) + Math.log10(HERO_COST_GROWTH - 1);
  const x = r > 15 ? r : Math.log10(10 ** r + 1);
  let n = Math.max(1, Math.floor(x / LOG_G));
  while (n > 1 && !gte(gold, heroCostBulk(heroIndex, level, n))) n--;
  return n;
}

export function milestoneSteps(level: number): number {
  if (level < MILESTONE_START) return 1;
  const steps = Math.floor((level - MILESTONE_START) / MILESTONE_STEP) + 1;
  return steps;
}

export function nextMilestone(level: number): number {
  if (level < MILESTONE_START) return MILESTONE_START;
  return MILESTONE_START + (Math.floor((level - MILESTONE_START) / MILESTONE_STEP) + 1) * MILESTONE_STEP;
}

/** Hero DPS before global multipliers (includes milestones, self-upgrades & gilds are passed in). */
export function heroBaseDps(heroIndex: number, level: number, selfMult: number, gildMult: number): Dec {
  if (level <= 0) return ZERO;
  const h = HEROES[heroIndex];
  const ms = milestoneSteps(level);
  let d = fromNumber(h.baseDps * level * selfMult * gildMult);
  if (ms > 0) d = mul(d, pow(MILESTONE_MULT, ms));
  return d;
}

export function heroUpgradeCost(heroIndex: number, reqLevel: number, costMult: number): Dec {
  return mulN(heroCost(heroIndex, reqLevel), costMult);
}

/* ----------------------------- Upgrades ---------------------------- */

export function upgradeCost(base: number, growth: number, level: number): Dec {
  return mul(fromNumber(base), pow(growth, level));
}

export function ancientCost(id: string, level: number): number {
  const a = ANCIENTS.find((x) => x.id === id);
  if (!a) return Infinity;
  if (a.costExp) return Math.ceil(a.costMult * a.costExp ** level);
  return Math.ceil(a.costMult * (level + 1));
}

/* ----------------------------- Prestige ---------------------------- */

export function isPrimal(zone: number, ascensions: number, primalLvl: number): boolean {
  if (!isBossZone(zone) || zone < PRIMAL_MIN_ZONE) return false;
  if (zone % 25 === 0) return true;
  const chance = Math.min(0.9, 0.2 + 0.05 * primalLvl);
  return hash01(zone, ascensions + 7) < chance;
}

export function primalEssence(zone: number, primalLvl: number): number {
  const base = Math.max(1, ((zone - 20) / 5) ** 1.15);
  return Math.max(1, Math.floor(base * (1 + 0.1 * primalLvl)));
}

export function heroLevelEssence(totalLevels: number): number {
  return Math.floor(totalLevels / 2000);
}

export function startingGold(lvl: number): Dec {
  if (lvl <= 0) return ZERO;
  return mul(fromNumber(50), pow(10, lvl));
}

export function bossTimer(bossLvl: number) {
  return 30 + 2 * Math.min(15, bossLvl);
}
