import { useEffect, useRef, useState, type PointerEvent } from "react";
import { HEROES, MONSTERS_PER_ZONE } from "../game/content";
import { isBossZone, monsterName, zoneTheme } from "../game/formulas";
import { comboBonus, hlvl } from "../game/logic";
import { formatDec, ratio } from "../game/numbers";
import type { GameEvent } from "../game/types";
import { useGame } from "../state/GameContext";
import { Monster3D } from "./visual/Monster3D";
import { MonsterArt } from "./visual/MonsterArt";
import { ZoneBackground } from "./visual/ZoneBackground";
import { HeroPortrait } from "./visual/HeroPortrait";

type Float = { id: number; text: string; x: number; y: number; kind: "hit" | "crit" | "auto" | "gold" | "essence" };

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; color: string; coin: boolean };

let fid = 1;

export function Arena() {
  const g = useGame();
  const { s, d } = g;
  const m = s.monster;
  const [floats, setFloats] = useState<Float[]>([]);
  const [hitKey, setHitKey] = useState(0);
  const [shake, setShake] = useState(false);
  const [banner, setBanner] = useState<null | { text: string; tone: string }>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<Particle[]>([]);
  const raf = useRef(0);
  const lastGoldFloat = useRef(0);
  const settingsRef = useRef(s.settings);
  settingsRef.current = s.settings;

  // particle renderer
  const kick = () => {
    if (raf.current) return;
    const step = () => {
      const cv = canvas.current;
      if (!cv) { raf.current = 0; return; }
      const ctx = cv.getContext("2d");
      if (!ctx) { raf.current = 0; return; }
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * devicePixelRatio) { cv.width = w * devicePixelRatio; cv.height = h * devicePixelRatio; }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const list = parts.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= 1;
        p.vy += p.coin ? 0.35 : 0.08;
        p.x += p.vx;
        p.y += p.vy;
        if (p.coin && p.y > h - 24 && p.vy > 0) { p.vy *= -0.45; p.vx *= 0.7; p.y = h - 24; }
        if (p.life <= 0) { list.splice(i, 1); continue; }
        const a = Math.min(1, p.life / (p.max * 0.4));
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.coin) {
          ctx.ellipse(p.x, p.y, p.r * Math.abs(Math.cos(p.life / 5)) + 1, p.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#8a5a00";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (list.length) raf.current = requestAnimationFrame(step);
      else raf.current = 0;
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    return g.subscribe((events: GameEvent[]) => {
      const st = settingsRef.current;
      const cv = canvas.current;
      const W = cv?.clientWidth ?? 400, H = cv?.clientHeight ?? 400;
      const add: Float[] = [];
      for (const e of events) {
        if (e.t === "hit") {
          if (st.showFloats && (!e.auto || Math.random() < 0.5)) {
            add.push({
              id: fid++,
              text: (e.crit ? "CRIT " : "") + formatDec(e.amount, st.numberFormat),
              x: e.x ?? 40 + Math.random() * 20,
              y: e.y ?? 35 + Math.random() * 15,
              kind: e.crit ? "crit" : e.auto ? "auto" : "hit",
            });
          }
          if (!e.auto) setHitKey((k) => k + 1);
          if (e.crit && !st.reducedMotion) {
            setShake(true);
            setTimeout(() => setShake(false), 160);
            for (let i = 0; i < 10; i++) parts.current.push({ x: W / 2, y: H * 0.45, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.7) * 8, life: 26, max: 26, r: 2 + Math.random() * 2, color: "#ffe27a", coin: false });
            kick();
          }
        } else if (e.t === "kill") {
          if (st.showFloats) add.push({ id: fid++, text: "+" + formatDec(e.gold, st.numberFormat), x: 50, y: 55, kind: "gold" });
          if (!st.reducedMotion) {
            const n = e.kind === "normal" ? 7 : 26;
            for (let i = 0; i < n; i++) parts.current.push({ x: W / 2 + (Math.random() - 0.5) * 40, y: H * 0.5, vx: (Math.random() - 0.5) * 7, vy: -4 - Math.random() * 6, life: 70, max: 70, r: 4 + Math.random() * 2, color: "#f5c542", coin: true });
            for (let i = 0; i < 12; i++) parts.current.push({ x: W / 2, y: H * 0.45, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 30, max: 30, r: 3 + Math.random() * 3, color: e.primal ? "#c4b5fd" : "#ffffff", coin: false });
            kick();
          }
        } else if (e.t === "goldGain" && st.showFloats && performance.now() - lastGoldFloat.current > 300) {
          lastGoldFloat.current = performance.now();
          add.push({ id: fid++, text: "+" + formatDec(e.gold, st.numberFormat), x: 50 + (Math.random() - 0.5) * 30, y: 60, kind: "gold" });
        } else if (e.t === "essence") {
          add.push({ id: fid++, text: `+${e.amount} Essence`, x: 50, y: 30, kind: "essence" });
        } else if (e.t === "bossStart") {
          setBanner({ text: e.primal ? "Primal Boss!" : "Boss Battle!", tone: e.primal ? "primal" : "boss" });
          setTimeout(() => setBanner(null), 1600);
        } else if (e.t === "bossFail") {
          setBanner({ text: "The boss escaped…", tone: "fail" });
          setTimeout(() => setBanner(null), 1600);
        } else if (e.t === "zone" && e.record && e.zone % 5 === 1) {
          setBanner({ text: zoneTheme(e.zone).name, tone: "zone" });
          setTimeout(() => setBanner(null), 1600);
        }
      }
      if (add.length) {
        setFloats((f) => [...f.slice(-24 + add.length), ...add]);
        const ids = new Set(add.map((a) => a.id));
        setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 900);
      }
    });
  }, [g]);

  const name = monsterName(s.zone, m.seed, m.kind);
  const hpPct = Math.max(0, Math.min(100, ratio(m.hp, m.max) * 100));
  const boss = m.kind === "boss";
  const bossTotal = boss ? (m.until - m.readyAt) / 1000 : 0;
  const bossLeft = boss ? Math.max(0, (m.until - g.now) / 1000) : 0;
  const theme = zoneTheme(s.zone);
  const combo = s.combo >= 3 && g.now - s.lastClickAt < 900 ? s.combo : 0;
  const army = HEROES.map((h, i) => ({ h, i, lv: hlvl(s, i) })).filter((x) => x.lv > 0).slice(-8);

  function onPointer(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    g.act.click(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <section className={`arena relative overflow-hidden ${boss ? (m.primal ? "arena-primal" : "arena-boss") : ""} ${shake ? "shake" : ""}`}>
      <ZoneBackground zone={s.zone} boss={boss} primal={m.primal} />
      <canvas ref={canvas} className="absolute inset-0 w-full h-full pointer-events-none z-20" />

      <div className="relative z-10 flex flex-col items-center h-full px-3 pt-3 pb-2">
        <div className="text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-white/55">
            {theme.name} · Zone {s.zone}
          </p>
          <h2 className={`font-display text-lg sm:text-2xl leading-tight drop-shadow-lg ${m.primal ? "text-violet-200" : boss ? "text-orange-200" : m.kind === "chest" ? "text-amber-200" : "text-white"}`}>
            {m.primal && <span className="text-xs align-middle mr-1.5 px-1.5 py-0.5 rounded bg-violet-600/70 font-sans tracking-wider">PRIMAL</span>}
            {name}
          </h2>
        </div>

        <button
          type="button"
          onPointerDown={onPointer}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => { if (e.key === "Enter") g.act.click(50, 45); }}
          className="monster-btn relative flex-1 w-full max-w-[560px] min-h-[220px] touch-manipulation select-none"
          aria-label={`Attack ${name}`}
        >
          {s.settings.graphics3d ? (
            <Monster3D zone={s.zone} seed={m.seed} kind={m.kind} primal={m.primal} hitKey={hitKey} reducedMotion={s.settings.reducedMotion} />
          ) : (
            <div key={m.seed + ":" + s.zone} className="absolute inset-0 flex items-end justify-center pb-2 monster-spawn">
              <div key={hitKey} className={`h-full w-full max-w-[300px] ${s.settings.reducedMotion ? "" : "monster-hit"}`}>
                <div className={`h-full w-full ${s.settings.reducedMotion ? "" : "monster-breathe"}`}>
                  <MonsterArt zone={s.zone} seed={m.seed} kind={m.kind} primal={m.primal} />
                </div>
              </div>
            </div>
          )}
          {floats.map((f) => (
            <span key={f.id} className={`float-num float-${f.kind}`} style={{ left: `${f.x}%`, top: `${f.y}%` }}>
              {f.text}
            </span>
          ))}
          {combo > 0 && (
            <span className="combo-badge absolute right-1 top-2">
              <span className="block text-[10px] tracking-widest text-amber-200/80">COMBO</span>
              <span className="block font-display text-2xl leading-none">×{combo}</span>
              <span className="block text-[10px] text-amber-100/80">+{Math.round(comboBonus(s, d) * 100)}% dmg</span>
            </span>
          )}
        </button>

        <div className="w-full max-w-md">
          <div className="flex justify-between text-[11px] sm:text-xs mb-1 text-white/75 font-semibold">
            <span>{isBossZone(s.zone) ? (boss ? "Boss" : "") : s.zone > s.cleared ? `Monsters ${s.killsInZone}/${MONSTERS_PER_ZONE}` : "Farming"}{m.kind === "chest" && " · 💰 ×10 gold"}</span>
            <span className="tabular-nums">{g.fmt(m.hp)} HP</span>
          </div>
          <div className="hp-track">
            <div className={`hp-fill ${boss ? (m.primal ? "primal" : "boss") : ""}`} style={{ width: `${hpPct}%` }} />
            <span className="hp-shine" />
          </div>
          {boss && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`text-xs font-bold tabular-nums w-10 ${bossLeft < 8 ? "text-red-400 animate-pulse" : "text-orange-200"}`}>{bossLeft.toFixed(1)}s</span>
              <div className="timer-track flex-1">
                <div className="timer-fill" style={{ width: `${Math.min(100, (bossLeft / Math.max(1, bossTotal)) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {army.length > 0 && (
          <div className="mt-2 flex gap-1 justify-center" aria-hidden>
            {army.map(({ i, h }, k) => (
              <div key={h.id} className={s.settings.reducedMotion ? "" : "army-bob"} style={{ animationDelay: `${k * 0.15}s` }}>
                <HeroPortrait index={i} size={26} gilds={s.gilds[h.id] || 0} />
              </div>
            ))}
          </div>
        )}
      </div>

      {banner && (
        <div className={`arena-banner banner-${banner.tone} z-30`}>
          <span className="font-display">{banner.text}</span>
        </div>
      )}
    </section>
  );
}
