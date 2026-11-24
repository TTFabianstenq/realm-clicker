import { ANCIENTS, HEROES, SAVE_VERSION, SKILLS, UPGRADES } from "./content";
import { fromNumber, ZERO, type Dec } from "./numbers";
import { monsterHP } from "./formulas";
import type { Boost, GameState, Monster, Quest, QuestType, Settings, Stats } from "./types";

export function freshMonster(): Monster {
  const hp = monsterHP(1, "normal");
  return { kind: "normal", primal: false, hp, max: hp, seed: 3, until: 0, readyAt: 0 };
}

export function defaultStats(now = Date.now()): Stats {
  return {
    clicks: 0, autoClicks: 0, totalDamage: ZERO, totalGold: ZERO, monsters: 0, bosses: 0, chests: 0, primals: 0,
    highestZone: 1, playTime: 0, heroLevelsBought: 0, skillsUsed: 0, bestCombo: 0, totalEssence: 0,
    runGold: ZERO, runStart: now,
  };
}

export function defaultSettings(): Settings {
  return { sound: true, volume: 0.5, music: false, reducedMotion: false, numberFormat: "short", showFloats: true, buyAmount: 1 };
}

export function defaultState(): GameState {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    gold: ZERO,
    zone: 1,
    cleared: 0,
    killsInZone: 0,
    autoProgress: true,
    monster: freshMonster(),
    heroLevels: Object.fromEntries(HEROES.map((h) => [h.id, 0])),
    gilds: {},
    heroUpgrades: [],
    upgradeLevels: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
    ancients: Object.fromEntries(ANCIENTS.map((a) => [a.id, 0])),
    essence: 0,
    pendingEssence: 0,
    ascensions: 0,
    skillCd: {},
    skillActive: {},
    energized: false,
    lastSkill: null,
    ritualStacks: 0,
    combo: 0,
    lastClickAt: 0,
    autoClickAcc: 0,
    boosts: [],
    achievements: [],
    quests: [],
    questSeq: 1,
    stats: defaultStats(now),
    settings: defaultSettings(),
    lastSaved: now,
    lastSeen: now,
    lastDaily: "",
    dailyStreak: 0,
    introSeen: false,
    createdAt: now,
  };
}

/* ----------------------------- Sanitizers ----------------------------- */

export function reviveDec(v: unknown): Dec {
  if (v && typeof v === "object" && "m" in v && "e" in v) {
    const o = v as { m: unknown; e: unknown };
    if (typeof o.m === "number" && typeof o.e === "number" && isFinite(o.m) && isFinite(o.e) && o.m >= 0) {
      return o.m === 0 ? ZERO : { m: o.m, e: Math.floor(o.e) };
    }
  }
  if (typeof v === "number" && isFinite(v) && v >= 0) return fromNumber(v);
  return ZERO;
}

const int = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Math.floor(Number(v));
  return isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
const num = (v: unknown, fallback = 0) => (typeof v === "number" && isFinite(v) ? v : fallback);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const intRecord = (v: unknown, keys: string[], max?: (k: string) => number) =>
  Object.fromEntries(keys.map((k) => [k, int(obj(v)[k], 0, max ? max(k) : undefined)]));

const QUEST_TYPES: QuestType[] = ["kills", "bosses", "clicks", "chests", "heroLevels", "skills", "zone"];
const SKILL_IDS = SKILLS.map((s) => s.id) as string[];

function sanitizeStats(raw: unknown, base: Stats): Stats {
  const r = obj(raw);
  return {
    clicks: int(r.clicks), autoClicks: int(r.autoClicks), totalDamage: reviveDec(r.totalDamage), totalGold: reviveDec(r.totalGold),
    monsters: int(r.monsters), bosses: int(r.bosses), chests: int(r.chests), primals: int(r.primals),
    highestZone: int(r.highestZone, 1), playTime: Math.max(0, num(r.playTime)),
    heroLevelsBought: int(r.heroLevelsBought ?? r.heroUpgrades), skillsUsed: int(r.skillsUsed), bestCombo: int(r.bestCombo),
    totalEssence: int(r.totalEssence), runGold: reviveDec(r.runGold), runStart: num(r.runStart, base.runStart),
  };
}

function sanitizeSettings(raw: unknown): Settings {
  const r = obj(raw);
  const d = defaultSettings();
  const nf = r.numberFormat;
  return {
    sound: typeof r.sound === "boolean" ? r.sound : d.sound,
    volume: Math.min(1, Math.max(0, num(r.volume, d.volume))),
    music: Boolean(r.music),
    reducedMotion: Boolean(r.reducedMotion),
    numberFormat: nf === "scientific" || nf === "engineering" || nf === "full" ? nf : "short",
    showFloats: typeof r.showFloats === "boolean" ? r.showFloats : true,
    buyAmount: [1, 10, 25, 100, -1].includes(Number(r.buyAmount)) ? Number(r.buyAmount) : 1,
  };
}

function sanitizeMonster(raw: unknown): Monster {
  const r = obj(raw);
  const kind = r.kind === "boss" || r.kind === "chest" ? r.kind : "normal";
  const max = reviveDec(r.max);
  if (max.m === 0) return freshMonster();
  return { kind, primal: Boolean(r.primal), hp: reviveDec(r.hp), max, seed: int(r.seed), until: num(r.until), readyAt: 0 };
}

function sanitizeV2(p: Record<string, unknown>): GameState {
  const base = defaultState();
  const heroIds = HEROES.map((h) => h.id);
  const upMax = (k: string) => UPGRADES.find((u) => u.id === k)?.max ?? 0;
  const ancMax = (k: string) => {
    const m = ANCIENTS.find((a) => a.id === k)?.max ?? 0;
    return m > 0 ? m : 1e9;
  };
  const quests: Quest[] = Array.isArray(p.quests)
    ? (p.quests as unknown[]).slice(0, 3).flatMap((q) => {
        const r = obj(q);
        if (!QUEST_TYPES.includes(r.type as QuestType)) return [];
        return [{ id: int(r.id), type: r.type as QuestType, target: int(r.target, 1), start: int(r.start), rewardGold: reviveDec(r.rewardGold), rewardEssence: int(r.rewardEssence, 0, 50) }];
      })
    : [];
  const boosts: Boost[] = Array.isArray(p.boosts)
    ? (p.boosts as unknown[]).flatMap((b) => {
        const r = obj(b);
        if (typeof r.id !== "string") return [];
        return [{ id: r.id, label: String(r.label ?? ""), until: num(r.until), multGold: r.multGold ? num(r.multGold, 1) : undefined }];
      })
    : [];
  const filterSkillRecord = (v: unknown) => Object.fromEntries(Object.entries(obj(v)).filter(([k, x]) => SKILL_IDS.includes(k) && typeof x === "number" && isFinite(x)));
  const zone = int(p.zone, 1, 1e6);
  return {
    ...base,
    gold: reviveDec(p.gold),
    zone,
    cleared: int(p.cleared, 0, 1e6),
    killsInZone: int(p.killsInZone, 0, 10),
    autoProgress: p.autoProgress !== false,
    monster: sanitizeMonster(p.monster),
    heroLevels: intRecord(p.heroLevels, heroIds, () => 1e6),
    gilds: intRecord(p.gilds, heroIds, () => 1e5),
    heroUpgrades: Array.isArray(p.heroUpgrades) ? (p.heroUpgrades as unknown[]).filter((x): x is string => typeof x === "string") : [],
    upgradeLevels: intRecord(p.upgradeLevels, UPGRADES.map((u) => u.id), upMax),
    ancients: intRecord(p.ancients, ANCIENTS.map((a) => a.id), ancMax),
    essence: int(p.essence),
    pendingEssence: int(p.pendingEssence),
    ascensions: int(p.ascensions),
    skillCd: filterSkillRecord(p.skillCd),
    skillActive: filterSkillRecord(p.skillActive),
    energized: Boolean(p.energized),
    lastSkill: SKILL_IDS.includes(p.lastSkill as string) ? (p.lastSkill as GameState["lastSkill"]) : null,
    ritualStacks: int(p.ritualStacks, 0, 1e4),
    combo: 0,
    lastClickAt: 0,
    autoClickAcc: 0,
    boosts,
    achievements: Array.isArray(p.achievements) ? (p.achievements as unknown[]).filter((x): x is string => typeof x === "string") : [],
    quests,
    questSeq: int(p.questSeq, 1),
    stats: sanitizeStats(p.stats, base.stats),
    settings: sanitizeSettings(p.settings),
    lastSaved: num(p.lastSaved, Date.now()),
    lastSeen: num(p.lastSeen, Date.now()),
    lastDaily: typeof p.lastDaily === "string" ? p.lastDaily : "",
    dailyStreak: int(p.dailyStreak, 0, 10000),
    introSeen: Boolean(p.introSeen),
    createdAt: num(p.createdAt, Date.now()),
  };
}

/** Convert a v1 save (array hero levels, prestige shop) into the v2 shape. */
function migrateV1(p: Record<string, unknown>): GameState {
  const base = defaultState();
  const oldHeroes = Array.isArray(p.heroLevels) ? (p.heroLevels as unknown[]) : [];
  const heroLevels = { ...base.heroLevels };
  HEROES.slice(0, 12).forEach((h, i) => (heroLevels[h.id] = int(oldHeroes[i], 0, 1e6)));
  const prest = obj(p.prestigeLevels);
  const map: Record<string, string> = { pClick: "aClick", pDps: "aDps", pGold: "aGold", pStart: "aStart", pOff: "aOffline", pCrit: "aCrit", pBoss: "aBoss" };
  const ancients = { ...base.ancients };
  for (const [from, to] of Object.entries(map)) {
    const def = ANCIENTS.find((a) => a.id === to)!;
    ancients[to] = int(prest[from], 0, def.max > 0 ? def.max : 1e9);
  }
  const upgradeLevels = { ...base.upgradeLevels };
  const oldUp = obj(p.upgradeLevels);
  for (const u of UPGRADES) upgradeLevels[u.id] = int(oldUp[u.id], 0, u.max);
  const stats = sanitizeStats(p.stats, base.stats);
  const zone = Math.max(1, int(p.zone, 1, 1e6));
  const settings = sanitizeSettings(p.settings);
  settings.sound = true; // v1 had a non-functional sound toggle
  return {
    ...base,
    gold: reviveDec(p.gold),
    zone,
    cleared: zone - 1,
    autoProgress: p.gameMode !== "farm",
    heroLevels,
    upgradeLevels,
    ancients,
    essence: int(p.essence),
    ascensions: int(p.ascensions),
    achievements: [],
    stats: { ...stats, highestZone: Math.max(stats.highestZone, zone) },
    settings,
    lastSeen: num(p.lastSeen, Date.now()),
    lastDaily: typeof p.lastDaily === "string" ? p.lastDaily : "",
    introSeen: Boolean(p.introSeen),
    createdAt: num(p.createdAt, Date.now()),
  };
}

/** Parse untrusted save JSON into a valid GameState. Never executes anything. */
export function parseSave(raw: string): GameState | null {
  let p: unknown;
  try {
    p = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  const o = p as Record<string, unknown>;
  const v = Number(o.version) || 1;
  return v >= 2 ? sanitizeV2(o) : migrateV1(o);
}
