import { useMemo, useState } from "react";
import { ACHIEVEMENTS, ASCEND_MIN_ZONE, HEROES, PRESTIGE, QUESTS, SKILLS, UPGRADES } from "../game/content";
import { essenceForAscend, heroCost, heroDps, monsterName, upgradeCost, zoneTheme } from "../game/formulas";
import { fromNumber, gte } from "../game/numbers";
import { useGame } from "../state/GameContext";
import type { TabId } from "../game/types";
import { MonsterArt } from "./visual/MonsterArt";
import { ZoneBackground } from "./visual/ZoneBackground";
import { HeroPortrait } from "./visual/HeroPortrait";

const NAV: { id: TabId; icon: string; label: string }[] = [
  { id: "heroes", icon: "⚔", label: "Heroes" },
  { id: "upgrades", icon: "⚒", label: "Upgrades" },
  { id: "skills", icon: "✨", label: "Skills" },
  { id: "prestige", icon: "🔥", label: "Ascend" },
  { id: "quests", icon: "📜", label: "Quests" },
  { id: "achieve", icon: "🏆", label: "Badges" },
  { id: "stats", icon: "📊", label: "Stats" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatPlayTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function AppShell() {
  const g = useGame();
  const { s, d } = g;
  const theme = zoneTheme(s.zone);
  const [hit, setHit] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const name = monsterName(s.zone, s.killsInZone, s.bossActive);
  const hpPct = useMemo(() => {
    if (s.monsterMax.m === 0) return 0;
    const r = (s.monsterHp.m / s.monsterMax.m) * 10 ** (s.monsterHp.e - s.monsterMax.e);
    return Math.max(0, Math.min(100, r * 100));
  }, [s.monsterHp, s.monsterMax]);
  const bossLeft = s.bossActive ? Math.max(0, Math.ceil((s.bossUntil - Date.now()) / 1000)) : 0;
  const essenceNow = essenceForAscend(s.stats.highestZone, s.stats.runBosses);
  const activeBoosts = s.boosts.filter((b) => b.until > Date.now());

  function onArenaClick(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const point = "touches" in e ? e.changedTouches[0] : (e as React.MouseEvent);
    g.clickMonster(((point.clientX - r.left) / r.width) * 100, ((point.clientY - r.top) / r.height) * 100);
    setHit(true);
    setTimeout(() => setHit(false), 220);
  }

  return (
    <div className={`min-h-dvh flex flex-col bg-[#0a0c14] ${s.settings.reducedMotion ? "reduce-motion" : ""}`}>
      <header className="hud-bar sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-3 py-2 flex flex-wrap items-center gap-2 justify-between">
          <div className="font-display text-lg sm:text-xl gold-text tracking-wide">Realm Clicker</div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <div className="hud-stat"><span>💰</span><span className="gold-num">{g.fmt(s.gold)}</span></div>
            <div className="hud-stat"><span className="label">Zone</span><span>{s.zone}</span></div>
            <div className="hud-stat hidden sm:flex"><span className="label">DPS</span><span>{g.fmt(d.dps)}</span></div>
            <div className="hud-stat hidden sm:flex"><span className="label">Click</span><span>{g.fmt(d.clickDmg)}</span></div>
            {s.essence > 0 && <div className="hud-stat"><span>✨</span><span className="text-violet-300">{s.essence}</span></div>}
          </div>
        </div>
        {activeBoosts.length > 0 && (
          <div className="mx-auto max-w-6xl px-3 pb-2 flex flex-wrap gap-1.5">
            {activeBoosts.map((b) => (
              <span key={b.id} className="text-[10px] sm:text-[11px] rounded-full bg-violet-900/50 border border-violet-500/40 px-2 py-0.5 text-violet-200">
                {b.label} · {formatDuration(b.until - Date.now())}
              </span>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 flex flex-col lg:flex-row gap-3 p-2 sm:p-3 pb-24 lg:pb-3">
        <section className={`combat-frame flex-1 min-h-[340px] sm:min-h-[420px] flex flex-col relative ${s.bossActive ? "boss-active" : ""}`}>
          <ZoneBackground zone={s.zone} boss={s.bossActive} />
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-3 sm:p-5">
            {s.bossActive && (
              <div className="boss-banner w-full text-center py-1 mb-2">
                <p className="text-[10px] uppercase tracking-[0.25em] text-ember font-bold">⚠ Boss Encounter</p>
              </div>
            )}
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/50 mb-1">
              {s.bossActive ? "BOSS" : `Wave ${s.killsInZone + 1}/10`} · {theme.name}
            </p>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-center text-white drop-shadow-lg mb-2">{name}</h2>
            <button type="button" onClick={onArenaClick} onTouchEnd={(e) => { e.preventDefault(); onArenaClick(e); }} className="relative touch-manipulation select-none cursor-pointer active:scale-[0.98] transition-transform" aria-label={`Attack ${name}`}>
              <MonsterArt zone={s.zone} boss={s.bossActive} hit={hit} reducedMotion={s.settings.reducedMotion} />
              {g.floats.map((f) => (
                <span key={f.id} className={`float-num absolute ${f.crit ? "crit" : "text-white text-sm sm:text-base"}`} style={{ left: `${f.x}%`, top: `${f.y}%` }}>
                  {f.crit ? "CRIT! " : ""}−{f.text}
                </span>
              ))}
            </button>
            <div className="w-full max-w-sm mt-3 sm:mt-4 px-2">
              <div className="flex justify-between text-[11px] sm:text-xs mb-1 text-white/70">
                <span>HP</span>
                <span>{g.fmt(s.monsterHp)} / {g.fmt(s.monsterMax)}</span>
              </div>
              <div className="hp-track">
                <div className={`hp-fill ${s.bossActive ? "boss" : ""}`} style={{ width: `${hpPct}%` }} />
              </div>
              {s.bossActive && <p className="text-center text-ember text-sm mt-2 font-bold font-display tracking-wide">⏱ {bossLeft}s</p>}
            </div>
          </div>
        </section>

        <aside className="game-panel w-full lg:w-[360px] flex flex-col max-h-[50vh] lg:max-h-[calc(100dvh-5.5rem)] overflow-hidden shrink-0">
          <nav className="hidden lg:flex flex-wrap gap-0.5 p-1.5 border-b border-white/5">
            {NAV.map((t) => (
              <button key={t.id} onClick={() => g.setTab(t.id)} className={`btn-nav flex-1 ${g.tab === t.id ? "active" : ""}`}>
                <span className="icon">{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto game-scroll p-2 space-y-1.5">
            {g.tab === "heroes" && HEROES.map((h, i) => {
              const locked = s.zone < h.unlockZone && (s.heroLevels[i] || 0) === 0;
              const cost = heroCost(i, s.heroLevels[i] || 0);
              const lv = s.heroLevels[i] || 0;
              return (
                <div key={h.id} className={`hero-row ${locked ? "locked" : ""}`}>
                  <HeroPortrait index={i} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold text-sm truncate">{h.name}</span>
                      <span className="text-[10px] text-white/40 truncate hidden sm:inline">{h.title}</span>
                    </div>
                    <div className="text-[11px] text-amber-200/80">Lv {lv} · <span className="text-neon/90">{g.fmt(heroDps(i, lv))} DPS</span></div>
                  </div>
                  <button disabled={locked || !gte(s.gold, cost)} onClick={() => g.buyHero(i)} className="btn-gold shrink-0">{locked ? `Z${h.unlockZone}` : g.fmt(cost)}</button>
                </div>
              );
            })}
            {g.tab === "upgrades" && UPGRADES.map((u) => {
              const lv = s.upgradeLevels[u.id] || 0;
              const cost = upgradeCost(u.baseCost, u.growth, lv);
              const icons: Record<string, string> = { hands: "👊", crit: "💥", focus: "🎯", rapid: "⚡", heroMult: "⚔", haste: "⏱", heroCrit: "🗡", globalDps: "🏳", goldFind: "💰", bossGold: "👑", zoneGold: "🗺", offline: "🏕", zoneBonus: "🧭" };
              return (
                <div key={u.id} className="hero-row">
                  <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-lg shrink-0">{icons[u.id] || "⬆"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{u.name}</div>
                    <div className="text-[11px] text-white/50">{u.desc}</div>
                    <div className="text-[10px] text-amber-200/60">Lv {lv}/{u.max}</div>
                  </div>
                  <button disabled={lv >= u.max || !gte(s.gold, cost)} onClick={() => g.buyUpgrade(u.id)} className="btn-gold shrink-0">{lv >= u.max ? "MAX" : g.fmt(cost)}</button>
                </div>
              );
            })}
            {g.tab === "skills" && SKILLS.map((sk) => {
              const left = Math.max(0, (s.skillsCd[sk.id] || 0) - Date.now());
              const ready = left <= 0;
              return (
                <button key={sk.id} onClick={() => g.useSkill(sk.id)} disabled={!ready} className={`hero-row w-full text-left ${ready ? "" : "opacity-50"}`}>
                  <div className="w-10 h-10 rounded-lg bg-violet-900/40 border border-violet-500/30 flex items-center justify-center text-lg">{sk.id === "power" ? "💥" : sk.id === "meteor" ? "☄" : sk.id === "goldrush" ? "💰" : sk.id === "frenzy" ? "🔥" : "🍀"}</div>
                  <div className="flex-1"><div className="font-semibold text-sm">{sk.name}</div><div className="text-[11px] text-white/50">{sk.desc}</div></div>
                  <span className={`text-xs font-bold ${ready ? "text-amber-300" : "text-white/40"}`}>{ready ? "READY" : `${Math.ceil(left / 1000)}s`}</span>
                </button>
              );
            })}
            {g.tab === "prestige" && (
              <div className="space-y-2 p-1">
                <div className="rounded-xl bg-violet-950/40 border border-violet-500/30 p-3 text-center">
                  <p className="text-xs text-violet-300 uppercase tracking-wider">Essence</p>
                  <p className="font-display text-2xl text-violet-200">{s.essence}</p>
                  <p className="text-[11px] text-white/50 mt-1">Ascensions: {s.ascensions} · Next: +{essenceNow}</p>
                  <button disabled={s.stats.highestZone < ASCEND_MIN_ZONE} onClick={() => g.setConfirmAscend(true)} className="btn-magic w-full mt-3 py-2.5 text-sm">🔥 Ascend (Zone {ASCEND_MIN_ZONE}+)</button>
                </div>
                {PRESTIGE.map((p) => {
                  const lv = s.prestigeLevels[p.id] || 0;
                  const cost = Math.floor(p.baseCost * p.growth ** lv);
                  return (
                    <div key={p.id} className="hero-row">
                      <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{p.name}</div><div className="text-[11px] text-white/50">{p.desc} · {lv}/{p.max}</div></div>
                      <button disabled={lv >= p.max || s.essence < cost} onClick={() => g.buyPrestige(p.id)} className="btn-magic shrink-0">{lv >= p.max ? "MAX" : `${cost} ✨`}</button>
                    </div>
                  );
                })}
              </div>
            )}
            {g.tab === "quests" && QUESTS.map((q) => {
              const ready = q.type === "gold" ? gte(s.stats.runGold, fromNumber(q.target)) : (s.questProgress[q.type] || 0) >= q.target;
              const done = s.questsClaimed.includes(q.id);
              return (
                <div key={q.id} className="hero-row">
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{q.name}</div><div className="text-[11px] text-white/50">{q.desc}</div></div>
                  <button disabled={done || !ready} onClick={() => g.claimQuest(q.id)} className="btn-gold shrink-0">{done ? "✓" : ready ? "Claim" : "…"}</button>
                </div>
              );
            })}
            {g.tab === "achieve" && ACHIEVEMENTS.map((a) => (
              <div key={a.id} className={`hero-row ${s.achievements.includes(a.id) ? "border-amber-500/40 bg-amber-900/10" : "opacity-60"}`}>
                <span className="text-lg">{s.achievements.includes(a.id) ? "🏆" : "🔒"}</span>
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{a.name}</div><div className="text-[11px] text-white/50">{a.desc}</div></div>
              </div>
            ))}
            {g.tab === "stats" && (
              <dl className="grid grid-cols-2 gap-1.5 p-1">
                {[["Clicks", String(s.stats.clicks)], ["Damage", g.fmt(s.stats.totalDamage)], ["Gold earned", g.fmt(s.stats.totalGold)], ["Monsters", String(s.stats.monsters)], ["Bosses", String(s.stats.bosses)], ["Highest zone", String(s.stats.highestZone)], ["Ascensions", String(s.ascensions)], ["Play time", formatPlayTime(s.stats.playTime)], ["DPS", g.fmt(d.dps)], ["Click dmg", g.fmt(d.clickDmg)], ["Crit %", `${(d.critChance * 100).toFixed(1)}%`]].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-black/30 border border-white/5 p-2">
                    <dt className="text-[9px] uppercase tracking-wider text-white/40">{k}</dt>
                    <dd className="font-semibold text-sm truncate gold-num">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {g.tab === "settings" && (
              <div className="space-y-2 p-1 text-sm">
                <button onClick={() => g.patchSettings({ reducedMotion: !s.settings.reducedMotion })} className="hero-row w-full justify-between"><span>Reduced motion</span><span className="text-amber-300">{s.settings.reducedMotion ? "ON" : "OFF"}</span></button>
                <label className="block px-1"><span className="text-[11px] text-white/50">Number format</span>
                  <select className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 p-2" value={s.settings.numberFormat} onChange={(e) => g.patchSettings({ numberFormat: e.target.value as typeof s.settings.numberFormat })}>
                    <option value="short">Short (1.2K)</option><option value="scientific">Scientific</option><option value="full">Full</option>
                  </select>
                </label>
                <button onClick={g.saveNow} className="btn-gold w-full py-2">Save now</button>
                <button onClick={() => { void navigator.clipboard?.writeText(g.exportSave()); setImportMsg("Copied to clipboard"); }} className="hero-row w-full justify-center">Export save</button>
                <textarea className="w-full h-20 rounded-lg bg-black/40 border border-white/10 p-2 text-xs font-mono" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste save JSON" />
                <button onClick={() => setImportMsg(g.importSave(importText) || "Imported.")} className="hero-row w-full justify-center">Import save</button>
                {importMsg && <p className="text-xs text-center text-white/60">{importMsg}</p>}
                <button onClick={() => g.setConfirmReset(true)} className="w-full rounded-lg py-2 bg-red-900/40 text-ember border border-red-500/30 text-sm">Reset save</button>
              </div>
            )}
          </div>
        </aside>
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 mobile-dock pb-[env(safe-area-inset-bottom)]">
        <div className="flex overflow-x-auto gap-0.5 px-1 py-1.5">
          {NAV.map((t) => (
            <button key={t.id} onClick={() => g.setTab(t.id)} className={`btn-nav shrink-0 ${g.tab === t.id ? "active" : ""}`}>
              <span className="icon">{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="fixed top-16 right-2 z-40 flex flex-col gap-1.5 max-w-[16rem] pointer-events-none">
        {g.toasts.map((msg, i) => (
          <div key={`${msg}-${i}`} className="toast-item rounded-lg bg-[#161a28] border border-amber-500/40 px-3 py-2 text-sm shadow-xl">🏆 {msg}</div>
        ))}
      </div>

      {!s.introSeen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="game-panel max-w-md w-full p-6 space-y-3 text-center">
            <h2 className="font-display text-2xl gold-text">Welcome, Adventurer</h2>
            <p className="text-white/80">Click the monster to attack.</p>
            <p className="text-sm text-white/50">Earn gold, hire heroes, conquer zones, and ascend the Realm.</p>
            <button onClick={() => g.clickMonster(50, 50)} className="btn-gold w-full py-3 text-base">Begin the Hunt</button>
          </div>
        </div>
      )}
      {g.offline && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="game-panel max-w-md w-full p-6 space-y-2 text-center">
            <h2 className="font-display text-xl gold-text">Welcome Back!</h2>
            <p className="text-sm text-white/60">Away for {formatDuration(g.offline.ms)}</p>
            <p className="text-sm">~{g.offline.kills} monsters defeated</p>
            <p className="text-2xl gold-num font-display">{g.fmt(g.offline.gold)} Gold</p>
            <button onClick={g.collectOffline} className="btn-gold w-full py-3 text-base mt-2">Collect</button>
          </div>
        </div>
      )}
      {g.dailyOpen && !g.offline && s.introSeen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="game-panel max-w-md w-full p-6 space-y-3 text-center">
            <h2 className="font-display text-xl gold-text">Daily Reward</h2>
            <p className="text-sm text-white/60">Free gold + 2× gold boost</p>
            <div className="flex gap-2">
              <button onClick={g.claimDaily} className="btn-gold flex-1 py-3">Claim</button>
              <button onClick={g.dismissDaily} className="flex-1 rounded-lg py-3 bg-white/10">Later</button>
            </div>
          </div>
        </div>
      )}
      {g.confirmAscend && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="game-panel max-w-md w-full p-6 space-y-3 text-center">
            <h2 className="font-display text-xl">Ascend?</h2>
            <p>Gain <span className="text-violet-300 font-bold">+{essenceNow} Essence</span></p>
            <p className="text-sm text-white/50">Gold, heroes & upgrades reset. Permanent bonuses stay.</p>
            <div className="flex gap-2">
              <button onClick={g.ascend} className="btn-magic flex-1 py-3">Confirm</button>
              <button onClick={() => g.setConfirmAscend(false)} className="flex-1 rounded-lg py-3 bg-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {g.confirmReset && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="game-panel max-w-md w-full p-6 space-y-3 text-center">
            <h2 className="font-display text-xl text-ember">Erase save?</h2>
            <p className="text-sm text-white/50">Permanent. Export first if you want a backup.</p>
            <div className="flex gap-2">
              <button onClick={g.resetSave} className="flex-1 rounded-lg py-3 bg-red-700 text-white font-bold">Delete</button>
              <button onClick={() => g.setConfirmReset(false)} className="flex-1 rounded-lg py-3 bg-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
