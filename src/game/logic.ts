/* ------------------------------------------------------------------ */
/*  Pure game engine. Every action takes a state and returns a new    */
/*  state plus UI events. No React, no DOM — fully testable in Node.  */
/* ------------------------------------------------------------------ */

import {
  ANCIENTS, BOSS_EVERY, COMBO_WINDOW_MS, ESSENCE_DPS, GILD_START_ZONE, HERO_UPGRADES, HEROES,
  MONSTERS_PER_ZONE, SKILLS, UPGRADES, BASE_OFFLINE_CAP_H, type SkillId,
} from "./content";
import { ACHIEVEMENTS, ACHIEVEMENT_DPS } from "./achievements";
import {
  ancientCost, baseMonsterGold, bossTimer, heroBaseDps, heroCost, heroCostBulk, heroLevelEssence,
  heroMaxAffordable, heroUpgradeCost, isBossZone, isPrimal, monsterGold, monsterHP, primalEssence,
  startingGold, upgradeCost,
} from "./formulas";
import { Dec, ZERO, add, cmp, fromNumber, gte, mul, mulN, ratio, sub, toNumber, log10 } from "./numbers";
import { freshMonster } from "./createState";
import type { GameEvent, GameState, Monster, Quest, QuestType } from "./types";

export type Rng = () => number;
export type Result = { s: GameState; ev: GameEvent[] };

export const lvl = (s: GameState, id: string) => s.upgradeLevels[id] || 0;
export const alvl = (s: GameState, id: string) => s.ancients[id] || 0;
export const hlvl = (s: GameState, i: number) => s.heroLevels[HEROES[i].id] || 0;

/* =============================== Derived =============================== */

export interface Derived {
  dps: Dec;
  heroDps: Dec[];
  clickDmg: Dec;
  critChance: number;
  critMult: number;
  goldMult: number;
  bossGoldMult: number;
  chestChance: number;
  chestGoldMult: number;
  bossDmgMult: number;
  comboCap: number;
  autoClicksPerSec: number;
  offlineMult: number;
  offlineCapMs: number;
  essenceBonus: number;
  globalMult: number;
  idle: boolean;
  skillCdMult: number;
}

export function isSkillActive(s: GameState, id: SkillId, now: number) {
  return (s.skillActive[id] || 0) > now;
}

export function heroUpgradeTotals(s: GameState) {
  const self: number[] = HEROES.map(() => 1);
  let global = 0, click = 0, crit = 0, gold = 0, dpsClick = 0;
  for (const id of s.heroUpgrades) {
    const u = HERO_UPGRADES.find((x) => x.id === id);
    if (!u) continue;
    const e = u.effect;
    if (e.kind === "self") self[u.heroIndex] *= e.mult;
    else if (e.kind === "global") global += e.pct;
    else if (e.kind === "click") click += e.pct;
    else if (e.kind === "crit") crit += e.pct;
    else if (e.kind === "gold") gold += e.pct;
    else if (e.kind === "dpsClick") dpsClick += e.pct;
  }
  return { self, global, click, crit, gold, dpsClick };
}

export function gildMult(s: GameState, heroId: string) {
  const g = s.gilds[heroId] || 0;
  return 1 + g * 0.5 * (1 + alvl(s, "aGild") * 0.1);
}

export function derive(s: GameState, now: number): Derived {
  const hu = heroUpgradeTotals(s);
  const idle = now - s.lastClickAt > 60_000;
  const essenceBonus = s.essence * (ESSENCE_DPS + alvl(s, "aEssence") * 0.01);
  const pathfinder = 1 + lvl(s, "zoneBonus") * 0.05;

  let globalMult =
    (1 + lvl(s, "heroMult") * 0.15 + lvl(s, "haste") * 0.1 + lvl(s, "heroCrit") * 0.1) *
    (1 + lvl(s, "globalDps") * 0.2) *
    pathfinder *
    (1 + alvl(s, "aDps") * 0.15) *
    (1 + essenceBonus) *
    (1 + s.achievements.length * ACHIEVEMENT_DPS) *
    (1 + hu.global) *
    (1 + s.ritualStacks * 0.05);
  if (idle) globalMult *= 1 + alvl(s, "aIdle") * 0.25;
  if (isSkillActive(s, "surge", now)) globalMult *= 2;

  const heroDps: Dec[] = [];
  let dps = ZERO;
  for (let i = 0; i < HEROES.length; i++) {
    const L = hlvl(s, i);
    const d = L > 0 ? mulN(heroBaseDps(i, L, hu.self[i], gildMult(s, HEROES[i].id)), globalMult) : ZERO;
    heroDps.push(d);
    dps = add(dps, d);
  }

  const clickPct = lvl(s, "dpsClick") * 0.01 + hu.dpsClick;
  let clickDmg = fromNumber(
    (1 + lvl(s, "hands") * 0.25) * (1 + alvl(s, "aClick") * 0.5) * (1 + hu.click) * pathfinder
  );
  if (clickPct > 0) clickDmg = add(clickDmg, mulN(dps, clickPct));
  if (isSkillActive(s, "overpower", now)) clickDmg = mulN(clickDmg, 3);

  let goldMult = (1 + lvl(s, "goldFind") * 0.15) * (1 + alvl(s, "aGold") * 0.1) * (1 + hu.gold);
  for (const b of s.boosts) if (b.until > now && b.multGold) goldMult *= b.multGold;
  if (isSkillActive(s, "detector", now)) goldMult *= 2;

  return {
    dps,
    heroDps,
    clickDmg,
    critChance: Math.min(0.95, 0.05 + lvl(s, "crit") * 0.01 + alvl(s, "aCrit") * 0.005 + hu.crit + (isSkillActive(s, "lucky", now) ? 0.5 : 0)),
    critMult: 5 + lvl(s, "focus") + alvl(s, "aCrit"),
    goldMult,
    bossGoldMult: 1 + lvl(s, "bossGold") * 0.3,
    chestChance: Math.min(0.3, 0.02 * (1 + lvl(s, "zoneGold") * 0.2) * (1 + alvl(s, "aChest") * 0.2)),
    chestGoldMult: 1 + alvl(s, "aChest") * 0.5,
    bossDmgMult: 1 + alvl(s, "aBoss") * 0.1,
    comboCap: 1 + lvl(s, "rapid") * 0.2,
    autoClicksPerSec: alvl(s, "aFamiliar") + (isSkillActive(s, "storm", now) ? 10 : 0),
    offlineMult: (1 + lvl(s, "offline") * 0.15) * (1 + alvl(s, "aOffline") * 0.25),
    offlineCapMs: (BASE_OFFLINE_CAP_H + alvl(s, "aOffline")) * 3600_000,
    essenceBonus,
    globalMult,
    idle,
    skillCdMult: 1 - 0.05 * Math.min(15, alvl(s, "aSkill")),
  };
}

export function comboBonus(s: GameState, d: Derived) {
  return Math.min(d.comboCap, s.combo * 0.01);
}

/* ============================== Monsters =============================== */

export function maxZone(s: GameState) {
  return s.cleared + 1;
}

export const RESPAWN_MS = 300;
export const BOSS_RESPAWN_MS = 900;

export function spawnMonster(s: GameState, now: number, rng: Rng, ev: GameEvent[], delay = 0): GameState {
  const zone = s.zone;
  const readyAt = now + delay;
  const seed = Math.floor(rng() * 1e6);
  let m: Monster;
  if (isBossZone(zone)) {
    const primal = zone > s.cleared && isPrimal(zone, s.ascensions, alvl(s, "aPrimal"));
    const hp = monsterHP(zone, "boss");
    m = { kind: "boss", primal, hp, max: hp, seed, until: readyAt + bossTimer(alvl(s, "aBoss")) * 1000, readyAt };
    ev.push({ t: "bossStart", primal });
  } else {
    const d = derive(s, now);
    const chest = zone >= 2 && rng() < d.chestChance;
    const kind = chest ? "chest" : "normal";
    const hp = monsterHP(zone, kind);
    m = { kind, primal: false, hp, max: hp, seed, until: 0, readyAt };
  }
  return { ...s, monster: m };
}

/** Make sure the current monster belongs to the current zone (used after load/migration). */
export function ensureMonster(s: GameState, now: number, rng: Rng = Math.random): GameState {
  const m = s.monster;
  const expectKind = isBossZone(s.zone) ? "boss" : m.kind === "chest" ? "chest" : "normal";
  const expectMax = monsterHP(s.zone, expectKind);
  const ok = m.kind === expectKind && Math.abs(log10(m.max) - log10(expectMax)) < 1e-6 && cmp(m.hp, ZERO) > 0 && cmp(m.hp, m.max) <= 0;
  if (ok && (m.kind !== "boss" || m.until > now)) return s;
  return spawnMonster(s, now, rng, []);
}

function grantGild(s: GameState, rng: Rng, ev: GameEvent[]): GameState {
  const owned = HEROES.map((h, i) => ({ h, i })).filter(({ i }) => hlvl(s, i) > 0);
  const pool = owned.length ? owned : [{ h: HEROES[0], i: 0 }];
  const pick = pool[Math.floor(rng() * pool.length)];
  ev.push({ t: "gild", heroIndex: pick.i });
  ev.push({ t: "toast", text: `${pick.h.name} was gilded! (+50% DPS)`, icon: "✦", tone: "gold" });
  return { ...s, gilds: { ...s.gilds, [pick.h.id]: (s.gilds[pick.h.id] || 0) + 1 } };
}

/** Move to a zone, recording all-time records and granting gilds. Does not spawn. */
function enterZone(s0: GameState, z: number, rng: Rng, ev: GameEvent[]): GameState {
  let s: GameState = { ...s0, zone: z, killsInZone: 0, stats: { ...s0.stats } };
  const record = z > s.stats.highestZone;
  if (record) {
    const prev = s.stats.highestZone;
    s.stats.highestZone = z;
    for (let k = prev + 1; k <= z; k++) {
      if (k >= GILD_START_ZONE && k % 10 === 0) s = grantGild(s, rng, ev);
    }
  }
  ev.push({ t: "zone", zone: z, record });
  return s;
}

function onKill(s0: GameState, now: number, rng: Rng, ev: GameEvent[]): GameState {
  let s = { ...s0, stats: { ...s0.stats } };
  const m = s.monster;
  const d = derive(s, now);
  let gold = mulN(monsterGold(s.zone, m.kind), d.goldMult);
  if (m.kind === "boss") gold = mulN(gold, d.bossGoldMult);
  if (m.kind === "chest") gold = mulN(gold, d.chestGoldMult);

  s.gold = add(s.gold, gold);
  s.stats.totalGold = add(s.stats.totalGold, gold);
  s.stats.runGold = add(s.stats.runGold, gold);
  s.stats.monsters += 1;
  if (m.kind === "boss") s.stats.bosses += 1;
  if (m.kind === "chest") s.stats.chests += 1;
  ev.push({ t: "kill", gold, kind: m.kind, primal: m.primal });

  if (m.primal) {
    const e = primalEssence(s.zone, alvl(s, "aPrimal"));
    s.pendingEssence += e;
    s.stats.primals += 1;
    ev.push({ t: "essence", amount: e });
    ev.push({ t: "toast", text: `Primal boss slain: +${e} Essence on next Ascension`, icon: "💀", tone: "magic" });
  }

  // progression
  const zoneDone = m.kind === "boss" || (s.zone > s.cleared && s.killsInZone + 1 >= MONSTERS_PER_ZONE);
  if (s.zone > s.cleared && m.kind !== "boss") s.killsInZone += 1;
  if (zoneDone) s.cleared = Math.max(s.cleared, s.zone);

  if (s.autoProgress && s.zone <= s.cleared) s = enterZone(s, s.zone + 1, rng, ev);

  s = spawnMonster(s, now, rng, ev, isBossZone(s.zone) ? BOSS_RESPAWN_MS : RESPAWN_MS);
  return s;
}

function dealDamage(s: GameState, raw: Dec, now: number, rng: Rng, ev: GameEvent[]): GameState {
  if (raw.m <= 0 || now < s.monster.readyAt) return s;
  let dmg = raw;
  if (s.monster.kind === "boss") dmg = mulN(dmg, derive(s, now).bossDmgMult);
  const remaining = sub(s.monster.hp, dmg);
  const stats = { ...s.stats, totalDamage: add(s.stats.totalDamage, dmg) };
  if (cmp(remaining, ZERO) <= 0) {
    return onKill({ ...s, stats, monster: { ...s.monster, hp: ZERO } }, now, rng, ev);
  }
  return { ...s, stats, monster: { ...s.monster, hp: remaining } };
}

/* =============================== Actions =============================== */

export function click(s0: GameState, now: number, rng: Rng = Math.random, opts: { auto?: boolean; x?: number; y?: number } = {}): Result {
  const ev: GameEvent[] = [];
  let s = { ...s0, stats: { ...s0.stats } };
  if (!opts.auto) {
    s.combo = now - s.lastClickAt <= COMBO_WINDOW_MS ? s.combo + 1 : 1;
    s.lastClickAt = now;
    s.stats.clicks += 1;
    s.stats.bestCombo = Math.max(s.stats.bestCombo, s.combo);
    s.introSeen = true;
  } else {
    s.stats.autoClicks += 1;
  }
  const d = derive(s, now);
  const crit = rng() < d.critChance;
  let dmg = mulN(d.clickDmg, 1 + comboBonus(s, d));
  if (crit) dmg = mulN(dmg, d.critMult);
  ev.push({ t: "hit", amount: dmg, crit, auto: !!opts.auto, x: opts.x, y: opts.y });

  if (isSkillActive(s, "midas", now)) {
    const g = mulN(baseMonsterGold(s.zone), 0.15 * d.goldMult);
    s.gold = add(s.gold, g);
    s.stats.totalGold = add(s.stats.totalGold, g);
    s.stats.runGold = add(s.stats.runGold, g);
    ev.push({ t: "goldGain", gold: g });
  }
  s = dealDamage(s, dmg, now, rng, ev);
  return finish(s, ev);
}

export function tick(s0: GameState, dt: number, now: number, rng: Rng = Math.random): Result {
  const ev: GameEvent[] = [];
  let s: GameState = { ...s0, lastSeen: now, stats: { ...s0.stats, playTime: s0.stats.playTime + dt } };

  if (s.boosts.some((b) => b.until <= now)) s.boosts = s.boosts.filter((b) => b.until > now);
  if (s.energized && (s.skillActive.energize || 0) <= now) s.energized = false;
  if (s.combo > 0 && now - s.lastClickAt > COMBO_WINDOW_MS) s.combo = 0;

  // boss timer
  if (s.monster.kind === "boss" && now > s.monster.until && cmp(s.monster.hp, ZERO) > 0) {
    ev.push({ t: "bossFail" });
    if (s.autoProgress && s.zone > 1) {
      s = { ...s, autoProgress: false, zone: s.zone - 1, killsInZone: 0 };
      ev.push({ t: "toast", text: "Boss escaped! Auto-progress paused — farm up and try again.", icon: "⏱", tone: "danger" });
    }
    s = spawnMonster(s, now, rng, ev);
  }

  const d = derive(s, now);
  if (d.dps.m > 0) s = dealDamage(s, mulN(d.dps, dt), now, rng, ev);

  if (d.autoClicksPerSec > 0) {
    s.autoClickAcc += d.autoClicksPerSec * dt;
    let n = Math.min(30, Math.floor(s.autoClickAcc));
    s.autoClickAcc -= Math.floor(s.autoClickAcc);
    while (n-- > 0) {
      const r = click(s, now, rng, { auto: true });
      s = r.s;
      ev.push(...r.ev);
    }
  }

  if (s.quests.length < 3) s = fillQuests(s, rng);
  return finish(s, ev);
}

export function buyHero(s: GameState, i: number, amount: number): Result {
  const ev: GameEvent[] = [];
  const L = hlvl(s, i);
  const n = amount < 0 ? heroMaxAffordable(i, L, s.gold) : amount;
  if (n <= 0) return { s, ev };
  const cost = heroCostBulk(i, L, n);
  if (!gte(s.gold, cost)) return { s, ev };
  const id = HEROES[i].id;
  ev.push({ t: L === 0 ? "buy" : "levelUp" });
  if (L === 0) ev.push({ t: "toast", text: `${HEROES[i].name} joined your party!`, icon: HEROES[i].glyph, tone: "gold" });
  const next = {
    ...s,
    gold: sub(s.gold, cost),
    heroLevels: { ...s.heroLevels, [id]: L + n },
    stats: { ...s.stats, heroLevelsBought: s.stats.heroLevelsBought + n },
  };
  return finish(next, ev);
}

export function heroBuyPreview(s: GameState, i: number, amount: number): { n: number; cost: Dec } {
  const L = hlvl(s, i);
  if (amount < 0) {
    const n = heroMaxAffordable(i, L, s.gold);
    return n > 0 ? { n, cost: heroCostBulk(i, L, n) } : { n: 1, cost: heroCost(i, L) };
  }
  return { n: amount, cost: heroCostBulk(i, L, amount) };
}

export function buyHeroUpgrade(s: GameState, id: string): Result {
  const u = HERO_UPGRADES.find((x) => x.id === id);
  if (!u || s.heroUpgrades.includes(id)) return { s, ev: [] };
  if (hlvl(s, u.heroIndex) < u.reqLevel) return { s, ev: [] };
  const cost = heroUpgradeCost(u.heroIndex, u.reqLevel, u.costMult);
  if (!gte(s.gold, cost)) return { s, ev: [] };
  return finish({ ...s, gold: sub(s.gold, cost), heroUpgrades: [...s.heroUpgrades, id] }, [{ t: "buy" }]);
}

export function buyUpgrade(s: GameState, id: string): Result {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return { s, ev: [] };
  const L = lvl(s, id);
  if (L >= u.max) return { s, ev: [] };
  const cost = upgradeCost(u.baseCost, u.growth, L);
  if (!gte(s.gold, cost)) return { s, ev: [] };
  return finish({ ...s, gold: sub(s.gold, cost), upgradeLevels: { ...s.upgradeLevels, [id]: L + 1 } }, [{ t: "buy" }]);
}

export function buyAncient(s: GameState, id: string): Result {
  const a = ANCIENTS.find((x) => x.id === id);
  if (!a) return { s, ev: [] };
  const L = alvl(s, id);
  if (a.max > 0 && L >= a.max) return { s, ev: [] };
  const cost = ancientCost(id, L);
  if (s.essence < cost) return { s, ev: [] };
  return finish({ ...s, essence: s.essence - cost, ancients: { ...s.ancients, [id]: L + 1 } }, [{ t: "buy" }]);
}

export const REGILD_COST = 2;

export function moveGild(s: GameState, toHeroIndex: number): Result {
  const to = HEROES[toHeroIndex].id;
  if (s.essence < REGILD_COST) return { s, ev: [] };
  let from: string | null = null;
  let best = 0;
  for (const h of HEROES) {
    const g = s.gilds[h.id] || 0;
    if (h.id !== to && g > best) { best = g; from = h.id; }
  }
  if (!from) return { s, ev: [] };
  return finish(
    { ...s, essence: s.essence - REGILD_COST, gilds: { ...s.gilds, [from]: best - 1, [to]: (s.gilds[to] || 0) + 1 } },
    [{ t: "gild", heroIndex: toHeroIndex }]
  );
}

export function skillUnlocked(s: GameState, id: SkillId) {
  const sk = SKILLS.find((x) => x.id === id)!;
  return s.stats.highestZone >= sk.unlockZone;
}

export function useSkill(s0: GameState, id: SkillId, now: number): Result {
  const sk = SKILLS.find((x) => x.id === id);
  if (!sk || !skillUnlocked(s0, id) || (s0.skillCd[id] || 0) > now) return { s: s0, ev: [] };
  const d = derive(s0, now);
  const ev: GameEvent[] = [{ t: "skill", id }];
  let s: GameState = { ...s0, skillCd: { ...s0.skillCd }, skillActive: { ...s0.skillActive }, stats: { ...s0.stats, skillsUsed: s0.stats.skillsUsed + 1 } };
  s.skillCd[id] = now + sk.cooldown * 1000 * d.skillCdMult;
  const boost = s.energized && id !== "energize" ? 2 : 1;
  if (boost === 2) { s.energized = false; s.skillActive.energize = 0; }

  switch (id) {
    case "ritual":
      s.ritualStacks += boost;
      ev.push({ t: "toast", text: `Blood Pact: +${5 * boost}% DPS this ascension`, icon: "🩸", tone: "danger" });
      break;
    case "energize":
      s.energized = true;
      s.skillActive.energize = now + sk.duration * 1000;
      break;
    case "rewind": {
      const last = s.lastSkill;
      if (last && (s.skillCd[last] || 0) > now) {
        const left = (s.skillCd[last] || 0) - now;
        s.skillCd[last] = now + (boost === 2 ? 0 : left * 0.5);
        ev.push({ t: "toast", text: `Rewound ${SKILLS.find((x) => x.id === last)!.name}`, icon: "⏳", tone: "info" });
      }
      break;
    }
    default:
      s.skillActive[id] = now + sk.duration * 1000 * boost;
  }
  if (id !== "rewind" && id !== "energize") s.lastSkill = id;
  return finish(s, ev);
}

export function setZone(s: GameState, z: number, now: number, rng: Rng = Math.random): Result {
  if (z < 1 || z > maxZone(s) || z === s.zone) return { s, ev: [] };
  const ev: GameEvent[] = [];
  const next = spawnMonster(enterZone(s, z, rng, ev), now, rng, ev);
  return finish(next, ev);
}

export function setAutoProgress(s: GameState, on: boolean): Result {
  return { s: { ...s, autoProgress: on }, ev: [] };
}

export function ascendGain(s: GameState) {
  const total = HEROES.reduce((a, h) => a + (s.heroLevels[h.id] || 0), 0);
  return s.pendingEssence + heroLevelEssence(total);
}

export function ascend(s: GameState, now: number, rng: Rng = Math.random): Result {
  const gain = ascendGain(s);
  if (gain < 1) return { s, ev: [] };
  const base: GameState = {
    ...s,
    gold: startingGold(alvl(s, "aStart")),
    zone: 1,
    cleared: 0,
    killsInZone: 0,
    autoProgress: true,
    monster: freshMonster(),
    heroLevels: Object.fromEntries(HEROES.map((h) => [h.id, 0])),
    heroUpgrades: [],
    upgradeLevels: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
    skillCd: {},
    skillActive: {},
    energized: false,
    lastSkill: null,
    ritualStacks: 0,
    quests: [],
    essence: s.essence + gain,
    pendingEssence: 0,
    ascensions: s.ascensions + 1,
    stats: { ...s.stats, totalEssence: s.stats.totalEssence + gain, runGold: ZERO, runStart: now },
  };
  const ev: GameEvent[] = [{ t: "ascend", essence: gain }, { t: "toast", text: `Ascended! +${gain} Essence`, icon: "🔥", tone: "magic" }];
  const next = spawnMonster(base, now, rng, ev);
  return finish(fillQuests(next, rng), ev);
}

/* ================================ Quests =============================== */

const QUEST_LABEL: Record<QuestType, (n: number) => string> = {
  kills: (n) => `Defeat ${n} monsters`,
  bosses: (n) => `Defeat ${n} bosses`,
  clicks: (n) => `Click ${n} times`,
  chests: (n) => `Open ${n} treasure chest${n > 1 ? "s" : ""}`,
  heroLevels: (n) => `Buy ${n} hero levels`,
  skills: (n) => `Use ${n} skill${n > 1 ? "s" : ""}`,
  zone: (n) => `Clear zone ${n}`,
};

export function questLabel(q: Quest) {
  return QUEST_LABEL[q.type](q.target);
}

function questStat(s: GameState, t: QuestType): number {
  switch (t) {
    case "kills": return s.stats.monsters;
    case "bosses": return s.stats.bosses;
    case "clicks": return s.stats.clicks;
    case "chests": return s.stats.chests;
    case "heroLevels": return s.stats.heroLevelsBought;
    case "skills": return s.stats.skillsUsed;
    case "zone": return s.cleared;
  }
}

export function questProgress(s: GameState, q: Quest): number {
  if (q.type === "zone") return Math.min(q.target, s.cleared);
  return Math.min(q.target, Math.max(0, questStat(s, q.type) - q.start));
}

function makeQuest(s: GameState, rng: Rng, taken: QuestType[]): Quest {
  const pool: QuestType[] = ["kills", "kills", "clicks", "heroLevels", "zone"];
  if (s.cleared >= 5) pool.push("bosses");
  if (s.cleared >= 3) pool.push("chests");
  if (s.stats.highestZone >= 1) pool.push("skills");
  const choices = pool.filter((t) => !taken.includes(t));
  const type = choices[Math.floor(rng() * choices.length)] ?? "kills";
  const r = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
  let target = 1;
  let weight = 1; // reward ≈ weight × normal kill gold
  switch (type) {
    case "kills": target = r(3, 10) * 10; weight = target * 2; break;
    case "bosses": target = r(2, 5); weight = target * 40; break;
    case "clicks": target = r(3, 12) * 50; weight = target / 6; break;
    case "chests": target = r(1, 3); weight = target * 80; break;
    case "heroLevels": target = r(2, 10) * 10; weight = target; break;
    case "skills": target = r(1, 3); weight = target * 50; break;
    case "zone": target = s.cleared + r(3, 8); weight = (target - s.cleared) * 40; break;
  }
  const refZone = Math.max(1, s.cleared + 1);
  const rewardGold = mulN(baseMonsterGold(refZone), weight * derive(s, Date.now()).goldMult);
  const rewardEssence = s.stats.highestZone >= 25 && rng() < 0.15 ? 1 + Math.floor(s.stats.highestZone / 60) : 0;
  return { id: s.questSeq, type, target, start: type === "zone" ? 0 : questStat(s, type), rewardGold, rewardEssence };
}

export function fillQuests(s: GameState, rng: Rng): GameState {
  let next = { ...s, quests: [...s.quests] };
  while (next.quests.length < 3) {
    const q = makeQuest(next, rng, next.quests.map((x) => x.type));
    next = { ...next, quests: [...next.quests, q], questSeq: next.questSeq + 1 };
  }
  return next;
}

export function claimQuest(s: GameState, id: number, rng: Rng = Math.random): Result {
  const q = s.quests.find((x) => x.id === id);
  if (!q || questProgress(s, q) < q.target) return { s, ev: [] };
  const ev: GameEvent[] = [{ t: "goldGain", gold: q.rewardGold }, { t: "toast", text: `Contract complete: ${questLabel(q)}`, icon: "📜", tone: "gold" }];
  let next: GameState = {
    ...s,
    gold: add(s.gold, q.rewardGold),
    essence: s.essence + q.rewardEssence,
    quests: s.quests.filter((x) => x.id !== id),
    stats: { ...s.stats, totalGold: add(s.stats.totalGold, q.rewardGold), runGold: add(s.stats.runGold, q.rewardGold), totalEssence: s.stats.totalEssence + q.rewardEssence },
  };
  if (q.rewardEssence) ev.push({ t: "essence", amount: q.rewardEssence });
  next = fillQuests(next, rng);
  return finish(next, ev);
}

export function rerollQuest(s: GameState, id: number, rng: Rng = Math.random): Result {
  const q = s.quests.find((x) => x.id === id);
  if (!q) return { s, ev: [] };
  const rest = { ...s, quests: s.quests.filter((x) => x.id !== id) };
  const nq = makeQuest(rest, rng, [...rest.quests.map((x) => x.type), q.type]);
  const quests = s.quests.map((x) => (x.id === id ? nq : x));
  return { s: { ...s, quests, questSeq: s.questSeq + 1 }, ev: [] };
}

/* ============================ Daily & offline ========================== */

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function dailyReward(s: GameState, now: number) {
  const yesterday = dayKey(new Date(now - 86400_000));
  const streak = s.lastDaily === yesterday ? s.dailyStreak + 1 : 1;
  const gold = mulN(baseMonsterGold(Math.max(s.zone, s.cleared + 1)), 30 * Math.min(7, streak) * derive(s, now).goldMult);
  const essence = streak % 7 === 0 ? 1 + Math.floor(s.stats.highestZone / 50) : 0;
  return { streak, gold, essence };
}

export function claimDaily(s: GameState, now: number): Result {
  const key = dayKey(new Date(now));
  if (s.lastDaily === key) return { s, ev: [] };
  const r = dailyReward(s, now);
  const next: GameState = {
    ...s,
    lastDaily: key,
    dailyStreak: r.streak,
    gold: add(s.gold, r.gold),
    essence: s.essence + r.essence,
    boosts: [...s.boosts.filter((b) => b.until > now && b.id !== "daily"), { id: "daily", label: "2× Gold", until: now + 10 * 60_000, multGold: 2 }],
    stats: { ...s.stats, totalGold: add(s.stats.totalGold, r.gold), totalEssence: s.stats.totalEssence + r.essence },
  };
  return finish(next, [{ t: "goldGain", gold: r.gold }, { t: "toast", text: `Day ${r.streak} reward claimed!`, icon: "🎁", tone: "gold" }]);
}

export function computeOffline(s: GameState, now: number) {
  const d = derive({ ...s, lastClickAt: 0 }, now);
  const away = Math.min(d.offlineCapMs, Math.max(0, now - s.lastSeen));
  if (away < 30_000 || d.dps.m === 0) return null;
  // farm the highest cleared non-boss zone at or below the current zone
  let z = Math.min(s.zone, Math.max(1, s.cleared));
  if (isBossZone(z) && z > 1) z -= 1;
  const killRate = Math.min(5, ratio(d.dps, monsterHP(z, "normal")));
  const secs = away / 1000;
  const kills = Math.floor(killRate * secs);
  if (kills < 1) return null;
  const gold = mul(mulN(baseMonsterGold(z), d.goldMult * d.offlineMult * 0.75), fromNumber(kills));
  return { ms: away, gold, kills };
}

export function collectOffline(s: GameState, o: { gold: Dec; kills: number }, now: number): Result {
  return finish(
    {
      ...s,
      lastSeen: now,
      gold: add(s.gold, o.gold),
      stats: { ...s.stats, totalGold: add(s.stats.totalGold, o.gold), runGold: add(s.stats.runGold, o.gold), monsters: s.stats.monsters + o.kills },
    },
    [{ t: "goldGain", gold: o.gold }]
  );
}

/* ============================== Achievements =========================== */

function finish(s: GameState, ev: GameEvent[]): Result {
  let next = s;
  for (const a of ACHIEVEMENTS) {
    if (!next.achievements.includes(a.id) && a.check(next)) {
      next = { ...next, achievements: [...next.achievements, a.id] };
      ev.push({ t: "achievement" });
      ev.push({ t: "toast", text: `Badge: ${a.name} (+${Math.round(ACHIEVEMENT_DPS * 100)}% DPS)`, icon: a.icon, tone: "gold" });
    }
  }
  return { s: next, ev };
}

/* ================================ Helpers ============================== */

export function goldPerSecond(s: GameState, d: Derived): Dec {
  const z = s.zone;
  const kind = isBossZone(z) ? "boss" : "normal";
  const hp = monsterHP(z, kind);
  const rate = Math.min(10, ratio(d.dps, hp));
  return mulN(monsterGold(z, kind), rate * d.goldMult * (kind === "boss" ? d.bossGoldMult : 1));
}

export function timeToKill(s: GameState, d: Derived): number {
  if (d.dps.m === 0) return Infinity;
  return toNumber(fromNumber(ratio(s.monster.hp, d.dps)));
}

export { BOSS_EVERY };
