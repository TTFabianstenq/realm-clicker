import {
  ACHIEVEMENTS,
  HEROES,
  SAVE_KEY,
  SAVE_VERSION,
} from "../game/content";
import { defaultState, reviveDec } from "../game/createState";
import { heroDps } from "../game/formulas";
import { add, cmp, Dec, fromNumber, mul } from "../game/numbers";
import type { GameState } from "../game/types";

export type Derived = {
  clickDmg: Dec;
  dps: Dec;
  critChance: number;
  critMult: number;
  goldMult: number;
  bossDmgMult: number;
  offlineMult: number;
};

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const p = JSON.parse(raw) as Partial<GameState>;
    if (!p || typeof p !== "object") return defaultState();
    const base = defaultState();
    const heroLevels = Array.isArray(p.heroLevels)
      ? HEROES.map((_, i) => Math.max(0, Math.floor(Number(p.heroLevels![i]) || 0)))
      : base.heroLevels;
    return {
      ...base,
      ...p,
      version: SAVE_VERSION,
      gold: reviveDec(p.gold),
      zone: Math.max(1, Math.floor(Number(p.zone) || 1)),
      killsInZone: Math.max(0, Math.floor(Number(p.killsInZone) || 0)),
      monsterHp: reviveDec(p.monsterHp),
      monsterMax: reviveDec(p.monsterMax),
      bossActive: Boolean(p.bossActive),
      bossUntil: Number(p.bossUntil) || 0,
      heroLevels,
      upgradeLevels: { ...base.upgradeLevels, ...(p.upgradeLevels || {}) },
      prestigeLevels: { ...base.prestigeLevels, ...(p.prestigeLevels || {}) },
      essence: Math.max(0, Math.floor(Number(p.essence) || 0)),
      ascensions: Math.max(0, Math.floor(Number(p.ascensions) || 0)),
      skillsCd: p.skillsCd && typeof p.skillsCd === "object" ? p.skillsCd : {},
      boosts: Array.isArray(p.boosts) ? p.boosts : [],
      achievements: Array.isArray(p.achievements) ? p.achievements : [],
      questProgress: p.questProgress && typeof p.questProgress === "object" ? p.questProgress : {},
      questsClaimed: Array.isArray(p.questsClaimed) ? p.questsClaimed : [],
      stats: {
        ...base.stats,
        ...(p.stats || {}),
        totalDamage: reviveDec(p.stats?.totalDamage),
        totalGold: reviveDec(p.stats?.totalGold),
        runGold: reviveDec(p.stats?.runGold),
      },
      settings: { ...base.settings, ...(p.settings || {}) },
      lastSaved: Number(p.lastSaved) || Date.now(),
      lastSeen: Number(p.lastSeen) || Date.now(),
      lastDaily: typeof p.lastDaily === "string" ? p.lastDaily : "",
      introSeen: Boolean(p.introSeen),
      createdAt: Number(p.createdAt) || Date.now(),
    };
  } catch {
    return defaultState();
  }
}

export function persist(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, lastSaved: Date.now() }));
  } catch {
    /* quota */
  }
}

export function lvl(s: GameState, id: string) {
  return s.upgradeLevels[id] || 0;
}
export function plvl(s: GameState, id: string) {
  return s.prestigeLevels[id] || 0;
}

export function derive(s: GameState, now: number): Derived {
  const clickBase = fromNumber(1 + lvl(s, "hands") * 0.15 + lvl(s, "rapid") * 0.08);
  const pClick = 1 + plvl(s, "pClick") * 0.2;
  const zoneB = 1 + lvl(s, "zoneBonus") * 0.04;
  let click = mul(clickBase, fromNumber(pClick * zoneB));
  let dpsAcc = fromNumber(0);
  for (let i = 0; i < HEROES.length; i++) dpsAcc = add(dpsAcc, heroDps(i, s.heroLevels[i] || 0));
  const heroM =
    1 +
    lvl(s, "heroMult") * 0.12 +
    lvl(s, "haste") * 0.05 +
    lvl(s, "heroCrit") * 0.08 +
    lvl(s, "globalDps") * 0.1 +
    plvl(s, "pDps") * 0.2;
  dpsAcc = mul(dpsAcc, fromNumber(heroM * zoneB));
  let goldM = 1 + lvl(s, "goldFind") * 0.1 + lvl(s, "zoneGold") * 0.02 * (s.zone / 10) + plvl(s, "pGold") * 0.15;
  let clickM = 1;
  let dpsM = 1;
  let extraCrit = 0;
  for (const b of s.boosts) {
    if (b.until > now) {
      if (b.multGold) goldM *= b.multGold;
      if (b.multDps) dpsM *= b.multDps;
      if (b.multClick) clickM *= b.multClick;
      if (b.extraCrit) extraCrit += b.extraCrit;
    }
  }
  click = mul(click, fromNumber(clickM));
  dpsAcc = mul(dpsAcc, fromNumber(dpsM));
  return {
    clickDmg: click,
    dps: dpsAcc,
    critChance: Math.min(0.75, 0.05 + lvl(s, "crit") * 0.015 + plvl(s, "pCrit") * 0.02 + extraCrit),
    critMult: 2 + lvl(s, "focus") * 0.2,
    goldMult: goldM,
    bossDmgMult: 1 + plvl(s, "pBoss") * 0.25,
    offlineMult: 1 + lvl(s, "offline") * 0.15 + plvl(s, "pOff") * 0.25,
  };
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function toApprox(d: Dec) {
  if (d.e > 12) return 1e15;
  return Math.floor(d.m * 10 ** d.e);
}

export function grantAchievements(st: GameState, toast: (m: string) => void): GameState {
  const addA = (id: string) => {
    if (st.achievements.includes(id)) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) toast(`Achievement: ${def.name}`);
    st = { ...st, achievements: [...st.achievements, id] };
  };
  if (st.stats.clicks >= 1) addA("firstClick");
  if (st.stats.monsters >= 1) addA("firstBlood");
  if (cmp(st.stats.totalGold, fromNumber(1e5)) >= 0) addA("rich");
  if (cmp(st.stats.totalGold, fromNumber(1e6)) >= 0) addA("millionaire");
  if (cmp(st.stats.totalGold, fromNumber(1e9)) >= 0) addA("gold1b");
  if (st.stats.bosses >= 1) addA("bossSlayer");
  if (st.stats.bosses >= 10) addA("boss10");
  if (st.heroLevels.filter((l) => l > 0).length >= 5) addA("heroCollector");
  if (st.heroLevels.every((l) => l > 0)) addA("heroesAll");
  if (st.ascensions >= 1) addA("ascended");
  if (st.stats.highestZone >= 10) addA("zone10");
  if (st.stats.highestZone >= 25) addA("legend");
  if (st.stats.highestZone >= 50) addA("zone50");
  if (st.stats.clicks >= 100) addA("click100");
  if (st.stats.clicks >= 1000) addA("click1k");
  return st;
}
