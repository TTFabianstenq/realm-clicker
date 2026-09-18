import { HEROES, SAVE_VERSION, UPGRADES, PRESTIGE } from "./content";
import { fromNumber } from "./numbers";
import { monsterHP } from "./formulas";
import type { GameState } from "./types";

export function defaultState(): GameState {
  const hp = monsterHP(1, false);
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    gold: fromNumber(0),
    zone: 1,
    killsInZone: 0,
    monsterHp: hp,
    monsterMax: hp,
    bossActive: false,
    bossUntil: 0,
    heroLevels: HEROES.map(() => 0),
    upgradeLevels: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
    prestigeLevels: Object.fromEntries(PRESTIGE.map((p) => [p.id, 0])),
    essence: 0,
    ascensions: 0,
    skillsCd: {},
    boosts: [],
    achievements: [],
    questProgress: {},
    questsClaimed: [],
    stats: {
      clicks: 0,
      totalDamage: fromNumber(0),
      totalGold: fromNumber(0),
      monsters: 0,
      bosses: 0,
      highestZone: 1,
      playTime: 0,
      heroUpgrades: 0,
      runGold: fromNumber(0),
      runBosses: 0,
    },
    settings: {
      sound: false,
      music: false,
      reducedMotion: false,
      numberFormat: "short",
    },
    lastSaved: now,
    lastSeen: now,
    lastDaily: "",
    introSeen: false,
    createdAt: now,
    gameMode: "progression",
    combatAlive: true,
  };
}

export function reviveDec(v: unknown) {
  if (v && typeof v === "object" && "m" in v && "e" in v) {
    const o = v as { m: unknown; e: unknown };
    if (typeof o.m === "number" && typeof o.e === "number" && isFinite(o.m) && isFinite(o.e)) {
      return { m: o.m, e: o.e };
    }
  }
  if (typeof v === "number" && isFinite(v)) return fromNumber(v);
  return fromNumber(0);
}
