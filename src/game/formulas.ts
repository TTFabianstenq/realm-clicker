import { HEROES, MONSTER_NAMES, BOSS_NAMES, ZONE_THEMES, MONSTERS_PER_ZONE } from "./content";
import { Dec, fromNumber, mul, pow, add } from "./numbers";

export function zoneTheme(zone: number) {
  return ZONE_THEMES[(zone - 1) % ZONE_THEMES.length];
}

export function monsterName(zone: number, index: number, boss: boolean) {
  if (boss) {
    const base = BOSS_NAMES[(zone - 1) % BOSS_NAMES.length];
    const cycle = Math.floor((zone - 1) / BOSS_NAMES.length);
    return cycle > 0 ? `${base} ${roman(cycle + 1)}` : base;
  }
  const i = (zone * 7 + index) % MONSTER_NAMES.length;
  return MONSTER_NAMES[i];
}

function roman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  for (const [v, r] of map) {
    while (n >= v) {
      s += r;
      n -= v;
    }
  }
  return s;
}

export function monsterHP(zone: number, boss: boolean): Dec {
  const base = pow(1.21, zone - 1);
  let hp = mul(fromNumber(12), base);
  hp = mul(hp, fromNumber(1 + zone * 0.08));
  if (boss) hp = mul(hp, fromNumber(8 + zone * 0.15));
  return hp;
}

export function monsterGold(zone: number, boss: boolean): Dec {
  const base = pow(1.17, zone - 1);
  let g = mul(fromNumber(6 + zone), base);
  if (boss) g = mul(g, fromNumber(12 + zone * 0.2));
  return g;
}

export function heroCost(heroIndex: number, level: number): Dec {
  const h = HEROES[heroIndex];
  return mul(fromNumber(h.baseCost), pow(h.costGrowth, level));
}

export function heroDps(heroIndex: number, level: number): Dec {
  if (level <= 0) return fromNumber(0);
  const h = HEROES[heroIndex];
  return mul(fromNumber(h.baseDps * level), pow(1.03, Math.max(0, level - 1)));
}

export function upgradeCost(base: number, growth: number, level: number): Dec {
  return mul(fromNumber(base), pow(growth, level));
}

export function essenceForAscend(highestZone: number, bossesThisRun: number): number {
  if (highestZone < 12) return 0;
  return Math.max(1, Math.floor((highestZone - 10) * 1.2 + bossesThisRun * 0.4));
}

export function isBossWave(killsInZone: number): boolean {
  return killsInZone >= MONSTERS_PER_ZONE - 1;
}

export function startingGold(pStartLevel: number): Dec {
  if (pStartLevel <= 0) return fromNumber(0);
  return mul(fromNumber(50), pow(8, pStartLevel));
}

export function addMany(list: Dec[]): Dec {
  return list.reduce((a, b) => add(a, b), fromNumber(0));
}
