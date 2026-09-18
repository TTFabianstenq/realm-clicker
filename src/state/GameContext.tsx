import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ASCEND_MIN_ZONE, BOSS_TIMER, HEROES, MONSTERS_PER_ZONE, OFFLINE_CAP_MS, PRESTIGE, QUESTS, SKILLS, UPGRADES } from "../game/content";
import { defaultState } from "../game/createState";
import { essenceForAscend, heroCost, monsterGold, monsterHP, startingGold, upgradeCost } from "../game/formulas";
import { add, clampNonNeg, cmp, Dec, formatDec, fromNumber, gte, mul, sub, ZERO } from "../game/numbers";
import type { GameState, TabId } from "../game/types";
import { dayKey, derive, grantAchievements, loadState, persist, plvl, toApprox } from "./engine";

type FloatNum = { id: number; text: string; x: number; y: number; crit: boolean };

interface Ctx {
  s: GameState; d: ReturnType<typeof derive>; tab: TabId; setTab: (t: TabId) => void;
  floats: FloatNum[]; toasts: string[];
  offline: null | { ms: number; gold: Dec; kills: number };
  collectOffline: () => void; dailyOpen: boolean; claimDaily: () => void; dismissDaily: () => void;
  clickMonster: (x?: number, y?: number) => void; buyHero: (i: number) => void; buyUpgrade: (id: string) => void;
  useSkill: (id: string) => void; buyPrestige: (id: string) => void; ascend: () => void; claimQuest: (id: string) => void;
  fmt: (n: Dec) => string; patchSettings: (p: Partial<GameState["settings"]>) => void;
  exportSave: () => string; importSave: (raw: string) => string | null; resetSave: () => void; saveNow: () => void;
  confirmAscend: boolean; setConfirmAscend: (v: boolean) => void; confirmReset: boolean; setConfirmReset: (v: boolean) => void;
  setGameMode: (m: "progression" | "farm") => void; selectZone: (z: number) => void;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<GameState>(() => loadState());
  const [tab, setTab] = useState<TabId>("heroes");
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [toasts, setToasts] = useState<string[]>([]);
  const [offline, setOffline] = useState<null | { ms: number; gold: Dec; kills: number }>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [confirmAscend, setConfirmAscend] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const idRef = useRef(1);
  const sRef = useRef(s);
  sRef.current = s;
  const d = useMemo(() => derive(s, Date.now()), [s]);
  const toast = useCallback((msg: string) => {
    setToasts((t) => [...t.slice(-4), msg]);
    setTimeout(() => setToasts((t) => t.slice(1)), 2800);
  }, []);
  const apply = useCallback((st: GameState) => grantAchievements(st, toast), [toast]);

  const spawn = useCallback((zone: number, killsInZone: number, opts?: { failedBoss?: boolean; farm?: boolean }) => {
    const failedBoss = opts?.failedBoss ?? false;
    const farm = opts?.farm ?? false;
    let kills = failedBoss ? Math.max(0, MONSTERS_PER_ZONE - 2) : Math.max(0, Math.min(killsInZone, MONSTERS_PER_ZONE));
    const wantBoss = !failedBoss && !farm && kills >= MONSTERS_PER_ZONE;
    if (wantBoss) kills = MONSTERS_PER_ZONE;
    const boss = wantBoss;
    const hp = monsterHP(zone, boss);
    return {
      monsterHp: hp,
      monsterMax: hp,
      bossActive: boss,
      bossUntil: boss ? Date.now() + BOSS_TIMER * 1000 : 0,
      killsInZone: boss ? MONSTERS_PER_ZONE : Math.min(kills, MONSTERS_PER_ZONE - 1),
      combatAlive: true,
    };
  }, []);

  const handleEnemyDefeated = useCallback((st: GameState, now: number): GameState => {
    const goldM = derive(st, now).goldMult * (st.bossActive ? 1 + (st.upgradeLevels.bossGold || 0) * 0.2 : 1);
    const gained = mul(monsterGold(st.zone, st.bossActive), fromNumber(goldM));
    let zone = st.zone;
    let kills = st.killsInZone;
    let bosses = st.stats.bosses;
    let runBosses = st.stats.runBosses;
    const wasBoss = st.bossActive;
    const farm = st.gameMode === "farm";

    if (wasBoss) {
      bosses += 1;
      runBosses += 1;
      if (!farm) {
        zone += 1;
        kills = 0;
      } else {
        kills = MONSTERS_PER_ZONE - 2;
      }
    } else {
      kills = Math.min(MONSTERS_PER_ZONE, kills + 1);
      if (kills >= MONSTERS_PER_ZONE && farm) kills = 0;
    }

    const spawned = spawn(zone, kills, { farm });
    return apply({
      ...st,
      gold: add(st.gold, gained),
      zone,
      ...spawned,
      killsInZone: spawned.killsInZone,
      combatAlive: true,
      stats: {
        ...st.stats,
        monsters: st.stats.monsters + 1,
        bosses,
        runBosses,
        highestZone: Math.max(st.stats.highestZone, zone),
        totalGold: add(st.stats.totalGold, gained),
        runGold: add(st.stats.runGold, gained),
      },
      questProgress: {
        ...st.questProgress,
        kills: (st.questProgress.kills || 0) + 1,
        boss: wasBoss ? (st.questProgress.boss || 0) + 1 : st.questProgress.boss || 0,
        zone: Math.max(st.questProgress.zone || 0, zone),
        gold: toApprox(add(st.stats.runGold, gained)),
      },
    });
  }, [apply, spawn]);

  const dealDamage = useCallback((st: GameState, raw: Dec, now: number): GameState => {
    if (!st.combatAlive) return st;
    if (cmp(st.monsterHp, ZERO) <= 0) {
      return handleEnemyDefeated({ ...st, monsterHp: ZERO, combatAlive: false }, now);
    }
    if (!raw || !isFinite(raw.m) || raw.m <= 0) return st;

    let dmg = raw;
    if (st.bossActive) dmg = mul(dmg, fromNumber(derive(st, now).bossDmgMult));

    const remaining = sub(st.monsterHp, dmg);
    const stats = { ...st.stats, totalDamage: add(st.stats.totalDamage, dmg) };

    if (cmp(remaining, ZERO) <= 0) {
      return handleEnemyDefeated({ ...st, monsterHp: ZERO, combatAlive: false, stats }, now);
    }
    return { ...st, monsterHp: clampNonNeg(remaining), stats, combatAlive: true };
  }, [handleEnemyDefeated]);

  const clickMonster = useCallback((x = 50, y = 40) => {
    setS((prev) => {
      const now = Date.now();
      const der = derive(prev, now);
      const crit = Math.random() < der.critChance;
      const dmg = crit ? mul(der.clickDmg, fromNumber(der.critMult)) : der.clickDmg;
      const id = idRef.current++;
      setFloats((f) => [...f.slice(-18), { id, text: formatDec(dmg, prev.settings.numberFormat), x, y, crit }]);
      setTimeout(() => setFloats((f) => f.filter((n) => n.id !== id)), 700);
      return apply(dealDamage({ ...prev, stats: { ...prev.stats, clicks: prev.stats.clicks + 1 }, questProgress: { ...prev.questProgress, clicks: (prev.questProgress.clicks || 0) + 1 }, introSeen: true }, dmg, now));
    });
  }, [apply, dealDamage]);

  const buyHero = useCallback((i: number) => {
    setS((prev) => {
      const h = HEROES[i];
      if (prev.zone < h.unlockZone && (prev.heroLevels[i] || 0) === 0) return prev;
      const cost = heroCost(i, prev.heroLevels[i] || 0);
      if (!gte(prev.gold, cost)) return prev;
      const levels = [...prev.heroLevels];
      levels[i] = (levels[i] || 0) + 1;
      return apply({ ...prev, gold: sub(prev.gold, cost), heroLevels: levels, stats: { ...prev.stats, heroUpgrades: prev.stats.heroUpgrades + 1 }, questProgress: { ...prev.questProgress, heroUp: (prev.questProgress.heroUp || 0) + 1 } });
    });
  }, [apply]);

  const buyUpgrade = useCallback((id: string) => {
    setS((prev) => {
      const u = UPGRADES.find((x) => x.id === id);
      if (!u) return prev;
      const lv = prev.upgradeLevels[id] || 0;
      if (lv >= u.max) return prev;
      const cost = upgradeCost(u.baseCost, u.growth, lv);
      if (!gte(prev.gold, cost)) return prev;
      return { ...prev, gold: sub(prev.gold, cost), upgradeLevels: { ...prev.upgradeLevels, [id]: lv + 1 } };
    });
  }, []);

  const useSkill = useCallback((id: string) => {
    setS((prev) => {
      const sk = SKILLS.find((x) => x.id === id);
      if (!sk) return prev;
      const now = Date.now();
      if ((prev.skillsCd[id] || 0) > now) return prev;
      let next = { ...prev, skillsCd: { ...prev.skillsCd, [id]: now + sk.cooldown * 1000 } };
      const der = derive(prev, now);
      if (id === "power") next = dealDamage(next, mul(der.clickDmg, fromNumber(80)), now);
      else if (id === "meteor") next = dealDamage(next, mul(der.dps, fromNumber(40)), now);
      else if (id === "goldrush") next.boosts = [...next.boosts.filter((b) => b.until > now), { id: "goldrush", label: "2.5× Gold", until: now + 20000, multGold: 2.5 }];
      else if (id === "frenzy") next.boosts = [...next.boosts.filter((b) => b.until > now), { id: "frenzy", label: "2.5× DPS", until: now + 15000, multDps: 2.5 }];
      else if (id === "lucky") next.boosts = [...next.boosts.filter((b) => b.until > now), { id: "lucky", label: "+35% Crit", until: now + 12000, extraCrit: 0.35 }];
      return next;
    });
  }, [dealDamage]);

  const buyPrestige = useCallback((id: string) => {
    setS((prev) => {
      const p = PRESTIGE.find((x) => x.id === id);
      if (!p) return prev;
      const lv = prev.prestigeLevels[id] || 0;
      if (lv >= p.max) return prev;
      const cost = Math.floor(p.baseCost * p.growth ** lv);
      if (prev.essence < cost) return prev;
      return { ...prev, essence: prev.essence - cost, prestigeLevels: { ...prev.prestigeLevels, [id]: lv + 1 } };
    });
  }, []);

  const ascend = useCallback(() => {
    setS((prev) => {
      if (prev.stats.highestZone < ASCEND_MIN_ZONE) return prev;
      const gain = essenceForAscend(prev.stats.highestZone, prev.stats.runBosses);
      const hp = monsterHP(1, false);
      const next = apply({
        ...prev, gold: startingGold(plvl(prev, "pStart")), zone: 1, killsInZone: 0, monsterHp: hp, monsterMax: hp,
        bossActive: false, bossUntil: 0, combatAlive: true, heroLevels: HEROES.map(() => 0),
        upgradeLevels: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])), skillsCd: {}, boosts: [],
        essence: prev.essence + gain, ascensions: prev.ascensions + 1, questProgress: {}, questsClaimed: [],
        stats: { ...prev.stats, runGold: fromNumber(0), runBosses: 0 },
      });
      persist(next);
      toast(`Ascended. +${gain} Essence.`);
      return next;
    });
    setConfirmAscend(false);
  }, [apply, toast]);

  const claimQuest = useCallback((id: string) => {
    setS((prev) => {
      if (prev.questsClaimed.includes(id)) return prev;
      const q = QUESTS.find((x) => x.id === id);
      if (!q) return prev;
      const progress = q.type === "gold" ? toApprox(prev.stats.runGold) : prev.questProgress[q.type] || 0;
      if (progress < q.target) return prev;
      const reward = fromNumber(q.goldReward);
      return { ...prev, gold: add(prev.gold, reward), questsClaimed: [...prev.questsClaimed, id], stats: { ...prev.stats, totalGold: add(prev.stats.totalGold, reward) } };
    });
  }, []);

  const claimDaily = useCallback(() => {
    setS((prev) => {
      const key = dayKey();
      if (prev.lastDaily === key) return prev;
      const gold = mul(fromNumber(80), fromNumber(Math.max(1, prev.zone)));
      toast("Daily claimed");
      return { ...prev, lastDaily: key, gold: add(prev.gold, gold), boosts: [...prev.boosts.filter((b) => b.until > Date.now()), { id: "daily", label: "2× Gold (5m)", until: Date.now() + 5 * 60 * 1000, multGold: 2 }], stats: { ...prev.stats, totalGold: add(prev.stats.totalGold, gold) } };
    });
    setDailyOpen(false);
  }, [toast]);

  useEffect(() => {
    const prev = sRef.current;
    const now = Date.now();
    const away = Math.min(OFFLINE_CAP_MS, Math.max(0, now - (prev.lastSeen || now)));
    if (away > 20_000) {
      const der = derive(prev, now);
      const secs = away / 1000;
      const gold = mul(mul(der.dps, fromNumber(0.35 * der.goldMult * der.offlineMult)), fromNumber(secs));
      const kills = Math.max(1, Math.floor(secs / 4));
      if (cmp(gold, fromNumber(1)) > 0) setOffline({ ms: away, gold, kills });
    }
    if (prev.lastDaily !== dayKey()) setDailyOpen(true);
  }, []);

  const collectOffline = useCallback(() => {
    if (!offline) return;
    setS((prev) => ({ ...prev, gold: add(prev.gold, offline.gold), lastSeen: Date.now(), stats: { ...prev.stats, totalGold: add(prev.stats.totalGold, offline.gold), monsters: prev.stats.monsters + offline.kills } }));
    setOffline(null);
  }, [offline]);

  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.25, (t - last) / 1000);
      last = t;
      acc += dt;
      if (acc >= 0.1) {
        const step = acc;
        acc = 0;
        setS((prev) => {
          const now = Date.now();
          const der = derive(prev, now);
          let next = { ...prev, lastSeen: now, stats: { ...prev.stats, playTime: prev.stats.playTime + step }, boosts: prev.boosts.filter((b) => b.until > now) };
          if (next.bossActive && next.bossUntil && now > next.bossUntil && cmp(next.monsterHp, ZERO) > 0) {
            next = { ...next, ...spawn(next.zone, next.killsInZone, { failedBoss: true, farm: next.gameMode === "farm" }) };
          } else if (cmp(der.dps, ZERO) > 0) {
            next = dealDamage(next, mul(der.dps, fromNumber(step)), now);
          }
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dealDamage, spawn]);

  useEffect(() => {
    const id = setInterval(() => persist(sRef.current), 4000);
    const hide = () => persist(sRef.current);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", hide);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", hide); };
  }, []);

  const fmt = useCallback((n: Dec) => formatDec(n, s.settings.numberFormat), [s.settings.numberFormat]);
  const patchSettings = useCallback((p: Partial<GameState["settings"]>) => setS((prev) => ({ ...prev, settings: { ...prev.settings, ...p } })), []);
  const exportSave = useCallback(() => JSON.stringify(sRef.current), []);
  const importSave = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return "Invalid save.";
      localStorage.setItem("realm-clicker-save-v1", JSON.stringify(parsed));
      setS(loadState());
      return null;
    } catch { return "Could not parse save JSON."; }
  }, []);
  const resetSave = useCallback(() => { const fresh = defaultState(); persist(fresh); setS(fresh); setConfirmReset(false); }, []);

  const setGameMode = useCallback((m: "progression" | "farm") => {
    setS((prev) => ({ ...prev, gameMode: m }));
  }, []);

  const selectZone = useCallback((z: number) => {
    setS((prev) => {
      if (z < 1 || z > prev.stats.highestZone) return prev;
      const hp = monsterHP(z, false);
      return {
        ...prev,
        zone: z,
        killsInZone: 0,
        monsterHp: hp,
        monsterMax: hp,
        bossActive: false,
        bossUntil: 0,
        combatAlive: true,
      };
    });
  }, []);

  const value: Ctx = {
    s, d, tab, setTab, floats, toasts, offline, collectOffline, dailyOpen, claimDaily, dismissDaily: () => setDailyOpen(false),
    clickMonster, buyHero, buyUpgrade, useSkill, buyPrestige, ascend, claimQuest, fmt, patchSettings, exportSave, importSave, resetSave,
    saveNow: () => persist(sRef.current), confirmAscend, setConfirmAscend, confirmReset, setConfirmReset, setGameMode, selectZone,
  };
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame outside provider");
  return c;
}
