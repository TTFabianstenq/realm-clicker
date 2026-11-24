/* Balance simulation: a bot plays the game with a simple greedy strategy.
 * Usage: npm run sim -- [hours=6] [clicksPerSecond=4]   (DBG=1 for zone checkpoints) */
import { writeFileSync } from "node:fs";
import { defaultState } from "../src/game/createState";
import { HEROES, HERO_UPGRADES, UPGRADES, SKILLS, ANCIENTS } from "../src/game/content";
import * as L from "../src/game/logic";
import { heroUpgradeCost, upgradeCost, ancientCost } from "../src/game/formulas";
import { formatDec, gte, mulN, ratio, log10, add, ZERO } from "../src/game/numbers";
const src = { kill: ZERO, other: ZERO };

const HOURS = Number(process.argv[2] || 6);
const CPS = Number(process.argv[3] || 4);
let seed = 42;
const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

let s = defaultState();
s.introSeen = true;
let now = 1_700_000_000_000;
const dt = 0.1;
const marks = new Map<string, number>();
let lastRecordAt = 0, lastZone = 0, failAt = 0;
const fmtT = (sec: number) => `${Math.floor(sec / 3600)}h${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}m`;

function shop() {
  for (let guard = 0; guard < 50; guard++) {
    const d = L.derive(s, now);
    // candidate: best dps/cost hero level
    let best: { score: number; act: () => L.Result } | null = null;
    for (let i = 0; i < HEROES.length; i++) {
      const lv = L.hlvl(s, i);
      if (i > 0 && L.hlvl(s, i - 1) === 0) break;
      const p = L.heroBuyPreview(s, i, 1);
      if (!gte(s.gold, p.cost)) continue;
      const cur = d.heroDps[i];
      const gain = lv === 0 ? mulN(L.derive({ ...s, heroLevels: { ...s.heroLevels, [HEROES[i].id]: 1 } }, now).heroDps[i], 1) : mulN(cur, 1 / lv);
      const score = ratio(gain, p.cost);
      if (!best || score > best.score) best = { score, act: () => L.buyHero(s, i, 1) };
    }
    for (const u of HERO_UPGRADES) {
      if (s.heroUpgrades.includes(u.id) || L.hlvl(s, u.heroIndex) < u.reqLevel) continue;
      const c = heroUpgradeCost(u.heroIndex, u.reqLevel, u.costMult);
      if (gte(s.gold, c)) { s = L.buyHeroUpgrade(s, u.id).s; continue; }
    }
    for (const u of UPGRADES) {
      const c = upgradeCost(u.baseCost, u.growth, L.lvl(s, u.id));
      if (L.lvl(s, u.id) < u.max && gte(mulN(s.gold, 0.1), c)) s = L.buyUpgrade(s, u.id).s;
    }
    if (!best) break;
    s = best.act().s;
  }
}

let ascTimes: string[] = [];
let runStart = 0;
const total = HOURS * 3600;
for (let t = 0; t < total; t += dt) {
  now += dt * 1000;
  const r = L.tick(s, dt, now, rng);
  s = r.s;
  if (r.ev.some((e) => e.t === "bossFail")) failAt = t;
  for (const e of r.ev) { if (e.t === "kill") src.kill = add(src.kill, e.gold); if (e.t === "goldGain") src.other = add(src.other, e.gold); }
  if (process.env.DBG && Math.floor(t / 60) !== Math.floor((t - dt) / 60) && t < 1500) { console.log("min", Math.round(t / 60), "zone", s.zone, "kill$", formatDec(src.kill), "other$", formatDec(src.other), "dps", formatDec(L.derive(s, now).dps), "hp", formatDec(s.monster.max), "kills", s.stats.monsters, "clicks", s.stats.clicks); src.kill = ZERO; src.other = ZERO; }
  // clicking
  const clicksThisTick = Math.floor((t + dt) * CPS) - Math.floor(t * CPS);
  for (let c = 0; c < clicksThisTick; c++) { const rr = L.click(s, now, rng); s = rr.s; for (const e of rr.ev) { if (e.t === "kill") src.kill = add(src.kill, e.gold); if (e.t === "goldGain") src.other = add(src.other, e.gold); } }
  if (Math.floor(t * 10) % 10 === 0) {
    shop();
    for (const sk of SKILLS) if (L.skillUnlocked(s, sk.id) && (s.skillCd[sk.id] || 0) <= now) s = L.useSkill(s, sk.id, now).s;
    for (const q of s.quests) if (L.questProgress(s, q) >= q.target) { const rr = L.claimQuest(s, q.id, rng); s = rr.s; for (const e of rr.ev) if (e.t === "goldGain") src.other = add(src.other, e.gold); }
    if (!s.autoProgress && t - failAt > 90) s = L.setAutoProgress(s, true).s;
  }
  if (s.zone > lastZone) { lastZone = s.zone; lastRecordAt = t; }
  for (const z of [10, 25, 50, 75, 100, 150, 200]) {
    const k = `a${s.ascensions} z${z}`;
    if (s.zone >= z && !marks.has(k)) { marks.set(k, t); if (process.env.DBG) { const dd = L.derive(s, now); console.log(k, fmtT(t), "dps", formatDec(dd.dps), "gm", dd.globalMult.toFixed(1), "click", formatDec(dd.clickDmg), "hp", formatDec(s.monster.max), "gold", formatDec(s.gold), "lv", HEROES.map((h) => s.heroLevels[h.id]).join(","), "ups", s.heroUpgrades.length, "gu", JSON.stringify(s.upgradeLevels)); } }
  }
  // ascend when stuck for 15 minutes
  if (t - lastRecordAt > 900 && L.ascendGain(s) >= 1) {
    const gain = L.ascendGain(s);
    ascTimes.push(`asc#${s.ascensions + 1} at ${fmtT(t)} (run ${fmtT(t - runStart)}): maxZone ${s.zone} gain ${gain} essence→${s.essence + gain}`);
    s = L.ascend(s, now, rng).s;
    // spend 40% of essence on ancients round-robin
    let budget = Math.floor(s.essence * 0.4);
    const order = ["aDps", "aClick", "aGold", "aIdle", "aChest", "aFamiliar", "aBoss", "aPrimal"];
    let progress = true;
    while (budget > 0 && progress) {
      progress = false;
      for (const id of order) {
        const c = ancientCost(id, L.alvl(s, id));
        if (c <= budget) { const before = s.essence; s = L.buyAncient(s, id).s; if (s.essence < before) { budget -= before - s.essence; progress = true; } }
      }
    }
    lastRecordAt = t; lastZone = 0; runStart = t;
  }
}
const d = L.derive(s, now);
console.log(`Sim ${HOURS}h @${CPS}cps`);
for (const [k, v] of marks) console.log(`  ${k}: ${fmtT(v)}`);
ascTimes.forEach((x) => console.log("  " + x));
console.log(`final zone ${s.zone} highest ${s.stats.highestZone} dps ${formatDec(d.dps)} gold ${formatDec(s.gold)} essence ${s.essence} pending ${s.pendingEssence} ach ${s.achievements.length} gilds ${JSON.stringify(s.gilds)}`);
console.log(`heroes ${HEROES.map((h) => s.heroLevels[h.id]).join(",")} ups ${s.heroUpgrades.length} log10gold ${log10(s.stats.totalGold).toFixed(1)}`);
void ANCIENTS;

if (process.env.DUMP) writeFileSync(process.env.DUMP, JSON.stringify({ ...s, lastSeen: Date.now(), lastSaved: Date.now(), monster: { ...s.monster, until: 0 } }));
