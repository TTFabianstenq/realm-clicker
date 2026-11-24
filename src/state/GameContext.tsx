import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SAVE_KEY, type SkillId } from "../game/content";
import { defaultState } from "../game/createState";
import * as L from "../game/logic";
import { formatDec, type Dec } from "../game/numbers";
import { decodeSave, encodeSave, fromExportString, toExportString } from "../game/saveCodec";
import type { GameEvent, GameState, TabId } from "../game/types";
import { configureSound, sfx, unlockAudio } from "../audio/sfx";
import {
  clock, createClickGuard, deepFreeze, isTrustedEvent, nativeRaf, nativeSetInterval, nativeSetTimeout, syncClock, timingLooksPatched,
} from "../security/secure";

export type Toast = { id: number; text: string; icon?: string; tone?: "gold" | "magic" | "info" | "danger" };
export type Offline = { ms: number; gold: Dec; kills: number };
type Listener = (ev: GameEvent[]) => void;

const BACKUP_KEY = "realm-clicker-backup";
const UNTRUSTED_OFFLINE_CAP = 2 * 3600_000;

/* ======================================================================
 * The authoritative game state lives here, in module scope. Nothing on
 * `window`, in React state or in the DOM points at it, so console scripts
 * and React DevTools can't reach it. Every state is deep-frozen, so the
 * copy React renders can't be edited in place either.
 * ==================================================================== */
let truth: GameState;
let loadNotice: string | null = null;
let tamperPending = 0;
let importResult: string | null = null;
/** Every state the engine produced. Anything else showing up in React was injected. */
const minted = new WeakSet<object>();

function commit(s: GameState) {
  truth = deepFreeze(s);
  minted.add(truth);
}

function readSlot(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? decodeSave(raw) : null;
  } catch {
    return null;
  }
}

function boot(): GameState {
  const main = readSlot(SAVE_KEY);
  if (main?.state) return main.state;
  if (main && main.status === "tampered") {
    tamperPending++;
    const backup = readSlot(BACKUP_KEY);
    if (backup?.state) {
      loadNotice = "Your save was modified outside the game, so your last verified backup was restored.";
      return backup.state;
    }
    loadNotice = "Your save failed its integrity check (it was edited outside the game), so a new game was started.";
  }
  return defaultState();
}

function persist(backup = false) {
  try {
    const data = encodeSave({ ...truth, lastSaved: clock.now() });
    localStorage.setItem(SAVE_KEY, data);
    if (backup) localStorage.setItem(BACKUP_KEY, data);
  } catch {
    /* storage full or blocked */
  }
}

commit(L.ensureMonster(L.fillQuests(boot(), Math.random), clock.now()));

/* Real user input tracking: actions only run if a genuine (isTrusted) pointer
 * or keyboard event happened a moment ago. Scripts driving the UI with
 * element.click() or dispatchEvent() don't count. */
let lastTrustedInput = -1e9;
if (typeof window !== "undefined") {
  const mark = (e: Event) => { if (isTrustedEvent(e)) lastTrustedInput = clock.perf(); };
  for (const t of ["pointerdown", "pointerup", "keydown", "click", "touchend", "change", "input"]) window.addEventListener(t, mark, true);
}
const userActed = () => clock.perf() - lastTrustedInput < 1500;

/* ======================================================================= */

export interface GameApi {
  s: GameState;
  d: L.Derived;
  now: number;
  ready: boolean;
  tab: TabId;
  setTab: (t: TabId) => void;
  fmt: (n: Dec) => string;
  toasts: Toast[];
  offline: Offline | null;
  collectOffline: () => void;
  dailyOpen: boolean;
  setDailyOpen: (v: boolean) => void;
  modal: null | "ascend" | "reset" | "help";
  setModal: (m: null | "ascend" | "reset" | "help") => void;
  notice: string | null;
  dismissNotice: () => void;
  subscribe: (fn: Listener) => () => void;
  act: {
    click: (x: number, y: number, ev: unknown) => void;
    buyHero: (i: number) => void;
    buyHeroUpgrade: (id: string) => void;
    buyUpgrade: (id: string) => void;
    buyAncient: (id: string) => void;
    moveGild: (i: number) => void;
    useSkill: (id: SkillId) => void;
    setZone: (z: number) => void;
    setAuto: (on: boolean) => void;
    ascend: () => void;
    claimQuest: (id: number) => void;
    rerollQuest: (id: number) => void;
    claimDaily: () => void;
    patchSettings: (p: Partial<GameState["settings"]>) => void;
    exportSave: () => string;
    importSave: (raw: string) => string | null;
    resetSave: () => void;
    saveNow: () => void;
    startGame: () => void;
  };
}

const Ctx = createContext<GameApi | null>(null);

const SETTING_KEYS: (keyof GameState["settings"])[] = ["sound", "volume", "music", "reducedMotion", "numberFormat", "showFloats", "buyAmount", "graphics3d"];

export function GameProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<GameState>(truth);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("heroes");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [offline, setOffline] = useState<Offline | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [modal, setModal] = useState<GameApi["modal"]>(null);
  const [notice, setNotice] = useState<string | null>(loadNotice);
  const [listeners] = useState(() => new Set<Listener>());
  const [guard] = useState(() => createClickGuard(25));
  const [meta] = useState(() => ({ toastId: 1, offline: null as Offline | null, lastScriptToast: -1e9, speedFlags: 0 }));
  meta.offline = offline;

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = meta.toastId++;
    setToasts((x) => [...x.slice(-4), { ...t, id }]);
    nativeSetTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3600);
  }, [meta]);

  const emit = useCallback((ev: GameEvent[]) => {
    if (!ev.length) return;
    for (const e of ev) {
      switch (e.t) {
        case "toast": pushToast({ text: e.text, icon: e.icon, tone: e.tone }); break;
        case "hit": sfx.hit(e.crit, e.auto); break;
        case "kill": sfx.kill(e.kind); break;
        case "bossStart": sfx.boss(e.primal); break;
        case "bossFail": sfx.fail(); break;
        case "buy": sfx.buy(); break;
        case "levelUp": sfx.levelUp(); break;
        case "skill": sfx.skill(); break;
        case "achievement": sfx.achievement(); break;
        case "essence": sfx.essence(); break;
        case "ascend": sfx.ascend(); break;
        case "goldGain": sfx.coin(); break;
      }
    }
    listeners.forEach((fn) => fn(ev));
  }, [pushToast, listeners]);

  /** Run a pure engine action against the authoritative state. */
  const run = useCallback((fn: (st: GameState, now: number) => L.Result) => {
    const r = fn(truth, clock.now());
    if (r.s !== truth) {
      commit(r.s);
      setS(truth);
    }
    emit(r.ev);
  }, [emit]);

  const flagTamper = useCallback((text: string | null) => {
    run((st) => ({ s: { ...st, stats: { ...st.stats, tamper: st.stats.tamper + 1 } }, ev: [] }));
    if (text) pushToast({ text, icon: "🛡", tone: "danger" });
  }, [run, pushToast]);

  const throttledFlag = useCallback((text: string) => {
    if (clock.perf() - meta.lastScriptToast < 10_000) return;
    meta.lastScriptToast = clock.perf();
    flagTamper(text);
  }, [flagTamper, meta]);

  /** Guard for player actions: require genuine recent user input. */
  const userOnly = useCallback(<A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => {
    if (!userActed()) {
      throttledFlag("Scripted actions are blocked.");
      return;
    }
    fn(...a);
  }, [throttledFlag]);

  // React DevTools / fiber hacks can swap the rendered state; put the real one back.
  useEffect(() => {
    if (!minted.has(s)) {
      setS(truth);
      flagTamper("State tampering detected and reverted.");
    }
  }, [s, flagTamper]);

  useEffect(() => configureSound(s.settings.sound, s.settings.volume), [s.settings.sound, s.settings.volume]);

  // Boot: sync with the server clock before computing offline progress.
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (tamperPending) { const n = tamperPending; tamperPending = 0; for (let i = 0; i < n; i++) flagTamper(null); }
      // timingLooksPatched alone isn't punished (some privacy extensions wrap timers); the server clock check handles real speed hacks
      void timingLooksPatched;
      const now = clock.now();
      let st = truth;
      if (st.lastSeen > now + 60_000) st = { ...st, lastSeen: now }; // device clock was wound forward last session
      if (!clock.synced) st = { ...st, lastSeen: Math.max(st.lastSeen, now - UNTRUSTED_OFFLINE_CAP) };
      if (st !== truth) { commit(st); setS(truth); }
      const o = L.computeOffline(truth, now);
      if (o) setOffline(o);
      if (truth.lastDaily !== L.dayKey(new Date(now))) setDailyOpen(true);
      setReady(true);
    };
    void syncClock().finally(finish);
    nativeSetTimeout(finish, 3000);
    const id = nativeSetInterval(() => {
      void syncClock().then(() => {
        if (clock.speedFlags > meta.speedFlags) {
          meta.speedFlags = clock.speedFlags;
          flagTamper("Speed hack detected — the game now runs at real time.");
        }
      });
    }, 30_000);
    const onVis = () => {
      if (document.visibilityState === "hidden") persist();
      else {
        void syncClock().then(() => {
          const o2 = L.computeOffline(truth, clock.now());
          if (o2 && o2.ms > 120_000) setOffline(o2);
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [flagTamper, meta]);

  // Main loop: 10 ticks per second on the trusted clock.
  useEffect(() => {
    if (!ready) return;
    let last = clock.now();
    let stop = false;
    const loop = () => {
      if (stop) return;
      const now = clock.now();
      const dt = (now - last) / 1000;
      if (dt >= 0.1) {
        last = now;
        const step = Math.min(0.5, Math.max(0, dt));
        run((st, n) => (meta.offline ? { s: { ...st, lastSeen: n }, ev: [] } : L.tick(st, step, n)));
      }
      nativeRaf(loop);
    };
    nativeRaf(loop);
    return () => { stop = true; };
  }, [ready, run, meta]);

  // autosave + verified backup once a minute
  useEffect(() => {
    if (!ready) return;
    let n = 0;
    const id = nativeSetInterval(() => persist(++n % 12 === 0), 5000);
    persist(true);
    const bye = () => persist();
    window.addEventListener("pagehide", bye);
    window.addEventListener("beforeunload", bye);
    return () => { clearInterval(id); window.removeEventListener("pagehide", bye); window.removeEventListener("beforeunload", bye); };
  }, [ready]);

  const subscribe = useCallback((fn: Listener) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, [listeners]);

  const act = useMemo<GameApi["act"]>(() => {
    const importInner = userOnly((raw: string) => {
      const r = fromExportString(raw);
      if (r.status === "tampered") {
        flagTamper(null);
        importResult = "That save was edited outside the game and can't be imported.";
        return;
      }
      if (!r.state) { importResult = "That doesn't look like a Realm Clicker save."; return; }
      // imported time stamps can't grant offline progress
      commit(L.ensureMonster(L.fillQuests({ ...r.state, lastSeen: clock.now() }, Math.random), clock.now()));
      setS(truth);
      persist(true);
      importResult = null;
    });
    return {
      click: (x, y, ev) => {
        const v = guard.check(ev);
        if (v === "untrusted") return throttledFlag("Scripted clicks are blocked.");
        if (v === "robot") return throttledFlag("Autoclicker detected — clicking paused for 15 seconds.");
        if (v === "rate") return;
        unlockAudio();
        run((st, now) => L.click(st, now, Math.random, { x, y }));
      },
      buyHero: userOnly((i: number) => run((st) => L.buyHero(st, i, st.settings.buyAmount))),
      buyHeroUpgrade: userOnly((id: string) => run((st) => L.buyHeroUpgrade(st, id))),
      buyUpgrade: userOnly((id: string) => run((st) => L.buyUpgrade(st, id))),
      buyAncient: userOnly((id: string) => run((st) => L.buyAncient(st, id))),
      moveGild: userOnly((i: number) => run((st) => L.moveGild(st, i))),
      useSkill: userOnly((id: SkillId) => { unlockAudio(); run((st, now) => L.useSkill(st, id, now)); }),
      setZone: userOnly((z: number) => run((st, now) => L.setZone(st, z, now))),
      setAuto: userOnly((on: boolean) => run((st) => L.setAutoProgress(st, on))),
      ascend: userOnly(() => {
        run((st, now) => L.ascend(st, now));
        persist(true);
        setModal(null);
        setTab("heroes");
      }),
      claimQuest: userOnly((id: number) => run((st) => L.claimQuest(st, id))),
      rerollQuest: userOnly((id: number) => run((st) => L.rerollQuest(st, id))),
      claimDaily: userOnly(() => {
        run((st, now) => L.claimDaily(st, now));
        setDailyOpen(false);
      }),
      patchSettings: (p) => {
        // only preference keys can be changed through here
        const clean = Object.fromEntries(Object.entries(p).filter(([k]) => SETTING_KEYS.includes(k as keyof GameState["settings"])));
        run((st) => ({ s: { ...st, settings: { ...st.settings, ...clean } }, ev: [] }));
      },
      exportSave: () => toExportString({ ...truth, lastSaved: clock.now() }),
      importSave: (raw: string) => {
        importResult = "Import blocked.";
        importInner(raw);
        return importResult;
      },
      resetSave: userOnly(() => {
        commit(L.fillQuests(defaultState(), Math.random));
        setS(truth);
        persist(true);
        setModal(null);
        setOffline(null);
      }),
      saveNow: () => {
        persist(true);
        pushToast({ text: "Game saved", icon: "💾", tone: "info" });
      },
      startGame: () => {
        unlockAudio();
        run((st) => ({ s: { ...st, introSeen: true }, ev: [] }));
        persist(true);
      },
    };
  }, [run, pushToast, guard, userOnly, flagTamper, throttledFlag]);

  const collectOffline = useCallback(() => {
    const o = meta.offline;
    if (o) run((st, now) => L.collectOffline(st, o, now));
    setOffline(null);
  }, [run, meta]);

  const fmt = useCallback((n: Dec) => formatDec(n, s.settings.numberFormat), [s.settings.numberFormat]);
  const now = clock.now();
  const d = useMemo(() => L.derive(s, now), [s]); // eslint-disable-line react-hooks/exhaustive-deps

  const api: GameApi = {
    s, d, now, ready, tab, setTab, fmt, toasts, offline, collectOffline, dailyOpen, setDailyOpen, modal, setModal,
    notice, dismissNotice: () => setNotice(null), subscribe, act,
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame outside provider");
  return c;
}
