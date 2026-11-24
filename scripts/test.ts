/* Engine sanity tests. Run with: npx tsx scripts/test.ts */
import { defaultState, parseSave } from "../src/game/createState";
import * as L from "../src/game/logic";
import { HEROES } from "../src/game/content";
import { heroCost, heroCostBulk, heroMaxAffordable, monsterHP } from "../src/game/formulas";
import { add, cmp, formatDec, fromNumber, gte, mulN, ratio } from "../src/game/numbers";
import { decodeSave, encodeSave, fromExportString, LEGACY_CUTOFF, toExportString } from "../src/game/saveCodec";
import { deepFreeze, isTrustedEvent, looksRobotic } from "../src/security/secure";

let fails = 0;
const ok = (cond: unknown, msg: string) => { if (!cond) { fails++; console.error("✗", msg); } else console.log("✓", msg); };
let seed = 1;
const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const T0 = 1_700_000_000_000;

// numbers
ok(formatDec(fromNumber(50)) === "50", "format 50");
ok(formatDec(fromNumber(1234)) === "1.23K", "format 1.23K");
ok(formatDec({ m: 4.5, e: 66 }) === "4.50aa", "format aa suffix");
ok(formatDec(fromNumber(2.5)) === "2.5", "format decimals");

// bulk cost == sum of singles
let sum = fromNumber(0);
for (let j = 0; j < 25; j++) sum = add(sum, heroCost(3, 40 + j));
ok(Math.abs(ratio(heroCostBulk(3, 40, 25), sum) - 1) < 1e-9, "bulk cost matches sum");
const gold = mulN(heroCost(2, 10), 1000);
const n = heroMaxAffordable(2, 10, gold);
ok(gte(gold, heroCostBulk(2, 10, n)) && !gte(gold, heroCostBulk(2, 10, n + 1)), `max affordable exact (${n})`);

// garbage saves
ok(parseSave("not json") === null, "rejects non-JSON");
ok(parseSave("[1,2]") === null, "rejects arrays");
const weird = parseSave(JSON.stringify({ version: 2, gold: { m: "x", e: 5 }, zone: -4, heroLevels: { rowan: 1e99 }, __proto__: { hacked: true } }));
ok(weird && weird.zone === 1 && weird.gold.m === 0 && weird.heroLevels.rowan <= 1e6, "sanitizes bad v2 values");

// v1 migration
const v1 = { version: 1, gold: { m: 5, e: 9 }, zone: 34, heroLevels: [40, 35, 30], prestigeLevels: { pClick: 2, pDps: 3 }, essence: 7, ascensions: 1, stats: { clicks: 1500, highestZone: 34, totalGold: { m: 3, e: 10 } }, gameMode: "farm", introSeen: true };
const m = parseSave(JSON.stringify(v1))!;
ok(m.version === 2 && m.zone === 34 && m.cleared === 33, "v1 zone migrated");
ok(m.heroLevels.rowan === 40 && m.heroLevels.bronn === 30 && m.heroLevels.nyx === 0, "v1 hero levels migrated");
ok(m.ancients.aClick === 2 && m.ancients.aDps === 3 && m.essence === 7, "v1 prestige → ancients");
ok(m.autoProgress === false && m.stats.clicks === 1500, "v1 farm mode + stats");
const ensured = L.ensureMonster(m, T0, rng);
ok(cmp(ensured.monster.max, monsterHP(34, "normal")) === 0, "monster respawned for migrated zone");

// play loop
let s = L.fillQuests(defaultState(), rng);
for (let i = 0; i < 40; i++) s = L.click(s, T0 + i * 1000, rng).s;
ok(s.stats.monsters > 0 && gte(s.gold, fromNumber(1)), "clicking kills and earns gold");
s = { ...s, gold: fromNumber(1e6) };
s = L.buyHero(s, 0, 10).s;
ok(s.heroLevels.rowan === 10, "buy ×10");
s = L.buyHero(s, 0, -1).s;
ok(s.heroLevels.rowan > 10, "buy max");
let now = T0 + 100_000;
for (let i = 0; i < 6000; i++) { now += 100; s = L.tick(s, 0.1, now, rng).s; }
ok(s.zone > 3, `DPS progresses zones (zone ${s.zone})`);

// boss failure pauses auto-progress
let b = { ...defaultState(), zone: 4, cleared: 4, autoProgress: true };
b = L.spawnMonster({ ...b, zone: 5 }, T0, rng, []);
ok(b.monster.kind === "boss", "zone 5 spawns a boss");
const fail = L.tick(b, 0.1, b.monster.until + 10, rng);
ok(fail.s.zone === 4 && !fail.s.autoProgress && fail.ev.some((e) => e.t === "bossFail"), "boss timeout drops a zone and pauses auto");

// primal + ascend
let p = { ...defaultState(), zone: 25, cleared: 24, stats: { ...defaultState().stats, highestZone: 25 } };
p = L.spawnMonster(p, T0, rng, []);
ok(p.monster.primal, "zone 25 boss is primal");
p = { ...p, monster: { ...p.monster, hp: fromNumber(1), readyAt: 0 } };
p = L.click(p, T0 + 1, rng).s;
ok(p.pendingEssence > 0 && p.cleared === 25, "primal kill grants pending essence");
const before = p.pendingEssence;
p = L.ascend(p, T0 + 2, rng).s;
ok(p.essence === before && p.zone === 1 && p.ascensions === 1 && p.heroLevels.rowan === 0, "ascend converts essence and resets run");
const dpsBoost = L.derive({ ...p, heroLevels: { ...p.heroLevels, rowan: 10 } }, T0).globalMult;
ok(dpsBoost >= 1 + before * 0.1, "unspent essence boosts DPS");

// skills
let k = { ...defaultState(), stats: { ...defaultState().stats, highestZone: 100 } };
k = L.useSkill(k, "energize", T0).s;
k = L.useSkill(k, "surge", T0 + 10).s;
ok((k.skillActive.surge || 0) - (T0 + 10) === 60_000, "energize doubles next skill duration");
const cd = k.skillCd.surge!;
k = L.useSkill(k, "rewind", T0 + 20).s;
ok(k.skillCd.surge! < cd, "rewind cuts cooldown");
ok(L.useSkill(k, "surge", T0 + 30).s === k, "skill on cooldown is ignored");

// quests
let q = L.fillQuests(defaultState(), rng);
ok(q.quests.length === 3 && new Set(q.quests.map((x) => x.type)).size === 3, "three distinct contracts");

// gilds
let gd = { ...defaultState(), heroLevels: { ...defaultState().heroLevels, rowan: 5 }, cleared: 29, zone: 29, autoProgress: true, killsInZone: 9 };
gd = { ...gd, stats: { ...gd.stats, highestZone: 29 }, monster: { ...gd.monster, hp: fromNumber(1), max: fromNumber(1), readyAt: 0 } };
const gr = L.click({ ...gd, cleared: 28 }, T0, rng);
ok(gr.s.zone === 30 && (gr.s.gilds.rowan || 0) === 1, "reaching zone 30 grants a gild");
void HEROES;

// anti-cheat: engine never mutates frozen state
{
  let f = deepFreeze(L.fillQuests(defaultState(), rng));
  let tnow = T0;
  let threw = false;
  try {
    for (let i = 0; i < 300; i++) {
      tnow += 100;
      f = deepFreeze(L.click(f, tnow, rng).s);
      f = deepFreeze(L.tick(f, 0.1, tnow, rng).s);
      if (i % 20 === 0) f = deepFreeze(L.buyHero({ ...f, gold: fromNumber(1e9) }, i % 3, -1).s);
    }
    f = deepFreeze(L.useSkill({ ...f, stats: { ...f.stats, highestZone: 100 } }, "storm", tnow).s);
    for (let i = 0; i < 50; i++) { tnow += 100; f = deepFreeze(L.tick(f, 0.1, tnow, rng).s); }
    f = deepFreeze(L.claimDaily(f, tnow).s);
  } catch (e) { threw = true; console.error(e); }
  ok(!threw, "engine works on deep-frozen state (no in-place mutation)");
  const frozen = deepFreeze(defaultState());
  try { (frozen.gold as { m: number }).m = 9; } catch { /* strict mode throws */ }
  ok(frozen.gold.m === 0, "frozen state can't be edited from outside");
}

// anti-cheat: signed saves
{
  const st = { ...defaultState(), gold: fromNumber(1234) };
  const enc = encodeSave(st);
  ok(decodeSave(enc).status === "ok", "signed save round-trips");
  const w = JSON.parse(enc);
  w.d = w.d.replace('"gold":{"m":1.234,"e":3}', '"gold":{"m":9,"e":99}');
  ok(w.d.includes('"e":99') && decodeSave(JSON.stringify(w)).status === "tampered", "edited signed save is rejected");
  const unsignedNew = JSON.stringify({ ...st, lastSaved: LEGACY_CUTOFF + 1000 });
  ok(decodeSave(unsignedNew).status === "tampered", "unsigned save written after cutoff is rejected");
  const legacyOk = JSON.stringify({ ...st, stats: { ...st.stats, totalGold: fromNumber(5000) }, lastSaved: LEGACY_CUTOFF - 1000 });
  ok(decodeSave(legacyOk).status === "legacy", "genuine pre-update save still loads");
  const legacyFake = JSON.stringify({ ...st, gold: fromNumber(1e50), lastSaved: LEGACY_CUTOFF - 1000 });
  ok(decodeSave(legacyFake).status === "tampered", "implausible legacy save rejected");
  ok(fromExportString(toExportString(st)).status === "ok", "export string round-trips");
}

// anti-cheat: trusted events
ok(!isTrustedEvent({ isTrusted: true }), "fake event object is untrusted");
ok(!isTrustedEvent(null), "null is untrusted");
ok(looksRobotic(Array.from({ length: 40 }, () => 50 + Math.random() * 1.2)), "macro rhythm flagged as autoclicker");
ok(!looksRobotic(Array.from({ length: 40 }, () => 90 + Math.random() * 60)), "human rhythm not flagged");

console.log(fails ? `\n${fails} FAILED` : "\nall tests passed");
process.exit(fails ? 1 : 0);
