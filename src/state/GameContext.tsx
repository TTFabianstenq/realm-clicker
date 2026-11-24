import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SAVE_KEY, type SkillId } from "../game/content";
import { defaultState, parseSave } from "../game/createState";
import * as L from "../game/logic";
import { formatDec, type Dec } from "../game/numbers";
import type { GameEvent, GameState, TabId } from "../game/types";
import { configureSound, sfx, unlockAudio } from "../audio/sfx";

export type Toast = { id: number; text: string; icon?: string; tone?: "gold" | "magic" | "info" | "danger" };
export type Offline = { ms: number; gold: Dec; kills: number };
type Listener = (ev: GameEvent[]) => void;

function loadInitial(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? parseSave(raw) : null;
    return L.ensureMonster(L.fillQuests(s ?? defaultState(), Math.random), Date.now());
  } catch {
    return L.fillQuests(defaultState(), Math.random);
  }
}

function persist(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, lastSaved: Date.now() }));
  } catch {
    /* storage full or blocked */
  }
}

export interface GameApi {
  s: GameState;
  d: L.Derived;
  now: number;
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
  subscribe: (fn: Listener) => () => void;
  act: {
    click: (x?: number, y?: number) => void;
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

export function GameProvider({ children }: { children: ReactNode }) {
  const ref = useRef<GameState>(null as unknown as GameState);
  if (!ref.current) ref.current = loadInitial();
  const [s, setS] = useState<GameState>(ref.current);
  const [tab, setTab] = useState<TabId>("heroes");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [offline, setOffline] = useState<Offline | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [modal, setModal] = useState<GameApi["modal"]>(null);
  const listeners = useRef(new Set<Listener>());
  const toastId = useRef(1);
  const offlineRef = useRef<Offline | null>(null);
  offlineRef.current = offline;

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = toastId.current++;
    setToasts((x) => [...x.slice(-4), { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3600);
  }, []);

  const emit = useCallback(
    (ev: GameEvent[]) => {
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
      listeners.current.forEach((fn) => fn(ev));
    },
    [pushToast]
  );

  /** Run a pure engine action against the latest state. */
  const run = useCallback(
    (fn: (st: GameState, now: number) => L.Result) => {
      const r = fn(ref.current, Date.now());
      if (r.s !== ref.current) {
        ref.current = r.s;
        setS(r.s);
      }
      emit(r.ev);
    },
    [emit]
  );

  // sound config
  useEffect(() => configureSound(s.settings.sound, s.settings.volume), [s.settings.sound, s.settings.volume]);

  // offline + daily on load
  useEffect(() => {
    const o = L.computeOffline(ref.current, Date.now());
    if (o) setOffline(o);
    if (ref.current.lastDaily !== L.dayKey()) setDailyOpen(true);
    const onVis = () => {
      if (document.visibilityState === "hidden") persist(ref.current);
      else {
        const o2 = L.computeOffline(ref.current, Date.now());
        if (o2 && o2.ms > 120_000) setOffline(o2);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // main loop: 10 ticks per second
  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const loop = (t: number) => {
      acc += Math.min(0.5, (t - last) / 1000);
      last = t;
      if (acc >= 0.1) {
        const step = acc;
        acc = 0;
        run((st, now) => (offlineRef.current ? { s: st, ev: [] } : L.tick(st, step, now)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  // autosave
  useEffect(() => {
    const id = setInterval(() => persist(ref.current), 5000);
    const bye = () => persist(ref.current);
    window.addEventListener("pagehide", bye);
    window.addEventListener("beforeunload", bye);
    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", bye);
      window.removeEventListener("beforeunload", bye);
    };
  }, []);

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const act = useMemo<GameApi["act"]>(
    () => ({
      click: (x, y) => {
        unlockAudio();
        run((st, now) => L.click(st, now, Math.random, { x, y }));
      },
      buyHero: (i) => run((st) => L.buyHero(st, i, st.settings.buyAmount)),
      buyHeroUpgrade: (id) => run((st) => L.buyHeroUpgrade(st, id)),
      buyUpgrade: (id) => run((st) => L.buyUpgrade(st, id)),
      buyAncient: (id) => run((st) => L.buyAncient(st, id)),
      moveGild: (i) => run((st) => L.moveGild(st, i)),
      useSkill: (id) => {
        unlockAudio();
        run((st, now) => L.useSkill(st, id, now));
      },
      setZone: (z) => run((st, now) => L.setZone(st, z, now)),
      setAuto: (on) => run((st) => L.setAutoProgress(st, on)),
      ascend: () => {
        run((st, now) => L.ascend(st, now));
        persist(ref.current);
        setModal(null);
        setTab("heroes");
      },
      claimQuest: (id) => run((st) => L.claimQuest(st, id)),
      rerollQuest: (id) => run((st) => L.rerollQuest(st, id)),
      claimDaily: () => {
        run((st, now) => L.claimDaily(st, now));
        setDailyOpen(false);
      },
      patchSettings: (p) => run((st) => ({ s: { ...st, settings: { ...st.settings, ...p } }, ev: [] })),
      exportSave: () => btoa(unescape(encodeURIComponent(JSON.stringify(ref.current)))),
      importSave: (raw) => {
        const text = raw.trim();
        let json = text;
        if (!text.startsWith("{")) {
          try {
            json = decodeURIComponent(escape(atob(text)));
          } catch {
            return "That doesn't look like a Realm Clicker save.";
          }
        }
        const parsed = parseSave(json);
        if (!parsed) return "Could not read that save.";
        const next = L.ensureMonster(L.fillQuests(parsed, Math.random), Date.now());
        ref.current = next;
        setS(next);
        persist(next);
        return null;
      },
      resetSave: () => {
        const fresh = L.fillQuests(defaultState(), Math.random);
        ref.current = fresh;
        setS(fresh);
        persist(fresh);
        setModal(null);
        setOffline(null);
      },
      saveNow: () => {
        persist(ref.current);
        pushToast({ text: "Game saved", icon: "💾", tone: "info" });
      },
      startGame: () => {
        unlockAudio();
        run((st) => ({ s: { ...st, introSeen: true }, ev: [] }));
      },
    }),
    [run, pushToast]
  );

  const collectOffline = useCallback(() => {
    const o = offlineRef.current;
    if (o) run((st, now) => L.collectOffline(st, o, now));
    setOffline(null);
  }, [run]);

  const fmt = useCallback((n: Dec) => formatDec(n, s.settings.numberFormat), [s.settings.numberFormat]);
  const now = Date.now();
  const d = useMemo(() => L.derive(s, now), [s]); // eslint-disable-line react-hooks/exhaustive-deps

  const api: GameApi = {
    s, d, now, tab, setTab, fmt, toasts, offline, collectOffline, dailyOpen, setDailyOpen, modal, setModal, subscribe, act,
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame outside provider");
  return c;
}
