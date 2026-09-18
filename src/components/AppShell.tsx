import { useMemo, useState } from "react";
import { ACHIEVEMENTS, ASCEND_MIN_ZONE, HEROES, PRESTIGE, QUESTS, SKILLS, UPGRADES } from "../game/content";
import { essenceForAscend, heroCost, heroDps, monsterName, upgradeCost, zoneTheme } from "../game/formulas";
import { fromNumber, gte } from "../game/numbers";
import { useGame } from "../state/GameContext";
import type { TabId } from "../game/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "heroes", label: "Heroes" }, { id: "upgrades", label: "Upgrades" }, { id: "skills", label: "Skills" },
  { id: "prestige", label: "Ascend" }, { id: "quests", label: "Quests" }, { id: "achieve", label: "Badges" },
  { id: "stats", label: "Stats" }, { id: "settings", label: "Settings" },
];

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
  function onArenaClick(e: React.MouseEvent | React.TouchEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const point = "touches" in e ? e.changedTouches[0] : e;
    g.clickMonster(((point.clientX - r.left) / r.width) * 100, ((point.clientY - r.top) / r.height) * 100);
    setHit(true);
    setTimeout(() => setHit(false), 180);
  }
  return (
    <div className={`min-h-dvh flex flex-col ${s.settings.reducedMotion ? "reduce-motion" : ""}`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-2 flex flex-wrap items-center gap-2 justify-between">
          <div className="font-display text-lg gold-text">Realm Clicker</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
            <span className="text-gold font-semibold">{g.fmt(s.gold)} gold</span>
            <span>Z{s.zone}</span>
            <span>DPS {g.fmt(d.dps)}</span>
            <span>Click {g.fmt(d.clickDmg)}</span>
            <span>Slain {s.stats.monsters}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3 p-3 pb-24 lg:pb-3">
        <section className="panel relative min-h-[420px] flex flex-col items-center justify-center p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{s.bossActive ? "Boss" : `Wave ${s.killsInZone + 1}/10`} · {theme.name}</p>
          <h2 className="font-display text-2xl mt-1">{name}</h2>
          <button type="button" onClick={onArenaClick} className="relative rounded-full p-2" aria-label={`Attack ${name}`}>
            <div className={`${hit ? "monster-hit" : ""} w-44 h-44 rounded-full`} style={{ background: `radial-gradient(circle at 40% 35%, hsl(${theme.hue} 80% 62%), hsl(${theme.hue} 50% 18%))` }} />
            {g.floats.map((f) => (
              <span key={f.id} className={`float-num absolute font-semibold ${f.crit ? "text-amber-300" : "text-white"}`} style={{ left: `${f.x}%`, top: `${f.y}%` }}>{f.crit ? "CRIT " : ""}{f.text}</span>
            ))}
          </button>
          <div className="w-full max-w-md mt-3">
            <div className="flex justify-between text-xs mb-1"><span>HP</span><span>{g.fmt(s.monsterHp)} / {g.fmt(s.monsterMax)}</span></div>
            <div className="h-3 rounded-full bg-black/50 overflow-hidden"><div className="hp-shine h-full" style={{ width: `${hpPct}%` }} /></div>
            {s.bossActive && <p className="text-center text-ember text-sm mt-2">Timer {bossLeft}s</p>}
          </div>
        </section>
        <aside className="panel flex flex-col max-h-[70vh] lg:max-h-[calc(100dvh-7rem)] overflow-hidden">
          <nav className="hidden lg:flex flex-wrap gap-1 p-2 border-b border-white/10">
            {TABS.map((t) => <button key={t.id} onClick={() => g.setTab(t.id)} className={`px-2 py-1 rounded-lg text-xs ${g.tab === t.id ? "bg-white/15 text-neon" : "text-slate-400"}`}>{t.label}</button>)}
          </nav>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {g.tab === "heroes" && HEROES.map((h, i) => {
              const locked = s.zone < h.unlockZone && (s.heroLevels[i] || 0) === 0;
              const cost = heroCost(i, s.heroLevels[i] || 0);
              return (
                <article key={h.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{h.glyph} {h.name} {h.title}</h3>
                      <p className="text-xs text-neon">Lv {s.heroLevels[i] || 0} · {g.fmt(heroDps(i, s.heroLevels[i] || 0))} DPS</p>
                    </div>
                    <button disabled={locked || !gte(s.gold, cost)} onClick={() => g.buyHero(i)} className="rounded-lg px-3 py-2 text-xs bg-gold/20 text-gold disabled:opacity-30">{locked ? `Z${h.unlockZone}` : g.fmt(cost)}</button>
                  </div>
                </article>
              );
            })}
            {g.tab === "upgrades" && UPGRADES.map((u) => {
              const lv = s.upgradeLevels[u.id] || 0;
              const cost = upgradeCost(u.baseCost, u.growth, lv);
              return (
                <article key={u.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                  <div className="flex justify-between gap-2">
                    <div><h3 className="font-semibold">{u.name}</h3><p className="text-xs text-slate-400">{u.desc} · {lv}/{u.max}</p></div>
                    <button disabled={lv >= u.max || !gte(s.gold, cost)} onClick={() => g.buyUpgrade(u.id)} className="rounded-lg px-3 py-2 text-xs bg-neon/15 text-neon disabled:opacity-30">{lv >= u.max ? "MAX" : g.fmt(cost)}</button>
                  </div>
                </article>
              );
            })}
            {g.tab === "skills" && SKILLS.map((sk) => {
              const left = Math.max(0, (s.skillsCd[sk.id] || 0) - Date.now());
              return <button key={sk.id} onClick={() => g.useSkill(sk.id)} disabled={left > 0} className="w-full text-left rounded-xl border border-white/10 p-3 bg-white/5 disabled:opacity-40"><div className="flex justify-between"><h3 className="font-semibold">{sk.name}</h3><span className="text-xs">{left <= 0 ? "Ready" : `${Math.ceil(left / 1000)}s`}</span></div><p className="text-xs text-slate-400">{sk.desc}</p></button>;
            })}
            {g.tab === "prestige" && (
              <div className="space-y-3">
                <p className="text-sm">Essence {s.essence} · Ascensions {s.ascensions} · Next +{essenceNow}</p>
                <button disabled={s.stats.highestZone < ASCEND_MIN_ZONE} onClick={() => g.setConfirmAscend(true)} className="w-full rounded-xl py-3 bg-void/40 disabled:opacity-30">Ascend</button>
                {PRESTIGE.map((p) => {
                  const lv = s.prestigeLevels[p.id] || 0;
                  const cost = Math.floor(p.baseCost * p.growth ** lv);
                  return <article key={p.id} className="rounded-xl border border-white/10 p-3 bg-white/5"><div className="flex justify-between gap-2"><div><h3 className="font-semibold">{p.name}</h3><p className="text-xs">{p.desc} · {lv}/{p.max}</p></div><button disabled={lv >= p.max || s.essence < cost} onClick={() => g.buyPrestige(p.id)} className="rounded-lg px-3 py-2 text-xs bg-violet-500/20 disabled:opacity-30">{lv >= p.max ? "MAX" : `${cost} Ess`}</button></div></article>;
                })}
              </div>
            )}
            {g.tab === "quests" && QUESTS.map((q) => {
              const ready = q.type === "gold" ? gte(s.stats.runGold, fromNumber(q.target)) : (s.questProgress[q.type] || 0) >= q.target;
              const done = s.questsClaimed.includes(q.id);
              return <article key={q.id} className="rounded-xl border border-white/10 p-3 bg-white/5"><div className="flex justify-between gap-2"><div><h3 className="font-semibold">{q.name}</h3><p className="text-xs text-slate-400">{q.desc}</p></div><button disabled={done || !ready} onClick={() => g.claimQuest(q.id)} className="rounded-lg px-3 py-2 text-xs bg-gold/20 text-gold disabled:opacity-30">{done ? "Claimed" : ready ? "Claim" : "Locked"}</button></div></article>;
            })}
            {g.tab === "achieve" && ACHIEVEMENTS.map((a) => <article key={a.id} className={`rounded-xl border p-3 ${s.achievements.includes(a.id) ? "border-gold/40 bg-gold/10" : "border-white/10 opacity-70"}`}><h3 className="font-semibold">{a.name}</h3><p className="text-xs text-slate-400">{a.desc}</p></article>)}
            {g.tab === "stats" && (
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {[["Clicks", String(s.stats.clicks)], ["Gold", g.fmt(s.stats.totalGold)], ["Monsters", String(s.stats.monsters)], ["Bosses", String(s.stats.bosses)], ["Zone", String(s.stats.highestZone)], ["Ascensions", String(s.ascensions)]].map(([k, v]) => <div key={k} className="rounded-lg bg-white/5 p-2"><dt className="text-[10px] uppercase text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
              </dl>
            )}
            {g.tab === "settings" && (
              <div className="space-y-3 text-sm">
                <button onClick={() => g.patchSettings({ reducedMotion: !s.settings.reducedMotion })} className="w-full flex justify-between rounded-lg bg-white/5 px-3 py-2"><span>Reduced motion</span><span>{s.settings.reducedMotion ? "ON" : "OFF"}</span></button>
                <select className="w-full rounded-lg bg-black/40 border border-white/10 p-2" value={s.settings.numberFormat} onChange={(e) => g.patchSettings({ numberFormat: e.target.value as typeof s.settings.numberFormat })}>
                  <option value="short">Short</option><option value="scientific">Scientific</option><option value="full">Full</option>
                </select>
                <button onClick={g.saveNow} className="w-full rounded-lg py-2 bg-white/10">Save now</button>
                <textarea className="w-full h-24 rounded-lg bg-black/40 border border-white/10 p-2 text-xs" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste save JSON" />
                <button onClick={() => setImportMsg(g.importSave(importText) || "Imported.")} className="w-full rounded-lg py-2 bg-white/10">Import</button>
                {importMsg && <p className="text-xs">{importMsg}</p>}
                <button onClick={() => g.setConfirmReset(true)} className="w-full rounded-lg py-2 bg-ember/20 text-ember">Reset save</button>
              </div>
            )}
          </div>
        </aside>
      </main>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-ink/90">
        <div className="grid grid-cols-4 gap-1 p-2">{TABS.map((t) => <button key={t.id} onClick={() => g.setTab(t.id)} className={`text-[11px] py-2 rounded-lg ${g.tab === t.id ? "text-neon bg-white/15" : "text-slate-400"}`}>{t.label}</button>)}</div>
      </nav>
      {!s.introSeen && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="panel max-w-md w-full p-6 space-y-3"><h2 className="font-display text-2xl gold-text">Welcome, Adventurer.</h2><p>Click the monster to attack.</p><button onClick={() => g.clickMonster(50, 50)} className="w-full rounded-xl py-3 bg-gold text-ink font-semibold">Begin</button></div></div>}
      {g.offline && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="panel max-w-md w-full p-6 space-y-2"><h2 className="font-display text-xl gold-text">Welcome Back!</h2><p className="text-gold">{g.fmt(g.offline.gold)} Gold</p><button onClick={g.collectOffline} className="w-full rounded-xl py-3 bg-gold text-ink font-semibold">Collect</button></div></div>}
      {g.dailyOpen && !g.offline && s.introSeen && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="panel max-w-md w-full p-6 space-y-2"><h2 className="font-display text-xl gold-text">Daily Reward</h2><div className="flex gap-2"><button onClick={g.claimDaily} className="flex-1 rounded-xl py-3 bg-gold text-ink font-semibold">Claim</button><button onClick={g.dismissDaily} className="flex-1 rounded-xl py-3 bg-white/10">Later</button></div></div></div>}
      {g.confirmAscend && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="panel max-w-md w-full p-6 space-y-2"><h2 className="font-display text-xl">Ascend?</h2><p>+{essenceNow} Essence. Reset run progress.</p><div className="flex gap-2"><button onClick={g.ascend} className="flex-1 rounded-xl py-3 bg-void">Confirm</button><button onClick={() => g.setConfirmAscend(false)} className="flex-1 rounded-xl py-3 bg-white/10">Cancel</button></div></div></div>}
      {g.confirmReset && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="panel max-w-md w-full p-6 space-y-2"><h2 className="font-display text-xl">Erase save?</h2><div className="flex gap-2"><button onClick={g.resetSave} className="flex-1 rounded-xl py-3 bg-ember text-ink">Delete</button><button onClick={() => g.setConfirmReset(false)} className="flex-1 rounded-xl py-3 bg-white/10">Cancel</button></div></div></div>}
    </div>
  );
}
