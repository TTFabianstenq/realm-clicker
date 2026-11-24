import { useEffect, type ReactNode } from "react";
import { SKILLS } from "../game/content";
import { ascendGain, dailyReward, dayKey, questProgress } from "../game/logic";
import type { TabId } from "../game/types";
import { useGame } from "../state/GameContext";
import { isTrustedEvent } from "../security/secure";
import { Arena } from "./Arena";
import { Hud } from "./Hud";
import { SkillBar } from "./SkillBar";
import { ZoneBar } from "./ZoneBar";
import { AchievementsPanel } from "./panels/AchievementsPanel";
import { AncientsPanel } from "./panels/AncientsPanel";
import { HeroesPanel } from "./panels/HeroesPanel";
import { QuestsPanel } from "./panels/QuestsPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { StatsPanel } from "./panels/StatsPanel";
import { UpgradesPanel } from "./panels/UpgradesPanel";

const NAV: { id: TabId; icon: string; label: string }[] = [
  { id: "heroes", icon: "⚔", label: "Heroes" },
  { id: "upgrades", icon: "⚒", label: "Upgrades" },
  { id: "ancients", icon: "🔮", label: "Ascend" },
  { id: "quests", icon: "📜", label: "Contracts" },
  { id: "achieve", icon: "🏆", label: "Badges" },
  { id: "stats", icon: "📊", label: "Stats" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

function duration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 modal-in" onClick={onClose}>
      <div className="panel max-w-md w-full p-6 space-y-3 text-center" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export function AppShell() {
  const g = useGame();
  const { s } = g;

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isTrustedEvent(e)) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 9) { g.act.useSkill(SKILLS[n - 1].id); return; }
      const k = e.key.toLowerCase();
      if (k === "a") g.act.setAuto(!s.autoProgress);
      else if (e.key === "ArrowLeft") g.act.setZone(s.zone - 1);
      else if (e.key === "ArrowRight") g.act.setZone(s.zone + 1);
      else if (k === "q") {
        const order = [1, 10, 25, 100, -1];
        g.act.patchSettings({ buyAmount: order[(order.indexOf(s.settings.buyAmount) + 1) % order.length] });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [g.act, s.autoProgress, s.zone, s.settings.buyAmount]);

  const gain = ascendGain(s);
  const dr = dailyReward(s, g.now);
  const tabBadge: Partial<Record<TabId, boolean>> = {
    quests: s.quests.some((q) => questProgress(s, q) >= q.target) || s.lastDaily !== dayKey(),
    ancients: gain > 0 && s.stats.highestZone >= 30,
  };

  const panel = (
    <>
      {g.tab === "heroes" && <HeroesPanel />}
      {g.tab === "upgrades" && <UpgradesPanel />}
      {g.tab === "ancients" && <AncientsPanel />}
      {g.tab === "quests" && <QuestsPanel />}
      {g.tab === "achieve" && <AchievementsPanel />}
      {g.tab === "stats" && <StatsPanel />}
      {g.tab === "settings" && <SettingsPanel />}
    </>
  );

  return (
    <div className={`min-h-dvh lg:h-dvh flex flex-col app-bg ${s.settings.reducedMotion ? "reduce-motion" : ""}`}>
      <Hud />
      <main className="mx-auto w-full max-w-7xl flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 p-2 sm:p-3 pb-24 lg:pb-3 lg:min-h-0">
        <div className="flex-1 flex flex-col gap-2 min-w-0 lg:min-h-0">
          <div className="panel overflow-hidden">
            <ZoneBar />
          </div>
          <div className="panel overflow-hidden flex-1 flex flex-col min-h-[380px] sm:min-h-[440px] lg:min-h-[360px]">
            <Arena />
          </div>
          <div className="panel">
            <SkillBar />
          </div>
        </div>

        <aside className="panel w-full lg:w-[400px] flex flex-col lg:min-h-0 overflow-hidden shrink-0">
          <nav className="hidden lg:grid grid-cols-7 gap-0.5 p-1.5 border-b border-white/5">
            {NAV.map((t) => (
              <button key={t.id} onClick={() => g.setTab(t.id)} className={`btn-nav ${g.tab === t.id ? "active" : ""}`}>
                <span className="icon">{t.icon}</span>
                <span>{t.label}</span>
                {tabBadge[t.id] && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto game-scroll p-2">{panel}</div>
        </aside>
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 mobile-dock pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-7 gap-0.5 px-1 py-1">
          {NAV.map((t) => (
            <button key={t.id} onClick={() => g.setTab(t.id)} className={`btn-nav ${g.tab === t.id ? "active" : ""}`}>
              <span className="icon">{t.icon}</span>
              <span className="truncate max-w-full">{t.label}</span>
              {tabBadge[t.id] && <span className="nav-dot" />}
            </button>
          ))}
        </div>
      </nav>

      <div className="fixed bottom-20 lg:bottom-4 right-2 lg:right-4 z-40 flex flex-col gap-1.5 w-[min(20rem,calc(100vw-1rem))] pointer-events-none" aria-live="polite">
        {g.toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone ?? "info"}`}>
            <span className="text-lg leading-none">{t.icon ?? "•"}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {!s.introSeen && (
        <Modal>
          <h2 className="font-display text-2xl gold-text">Welcome, Adventurer</h2>
          <p className="text-white/80 text-sm">Tap the monster to attack. Gold hires heroes who fight for you — even while you're away.</p>
          <ul className="text-left text-[13px] text-white/65 space-y-1.5 bg-black/25 rounded-xl p-3">
            <li>⚔ <b>Clear 10 monsters</b> to advance a zone. Every 5th zone has a timed <b>boss</b>.</li>
            <li>📈 Hero upgrades unlock at levels 10, 25, 50, 75, 100 — and from Lv 200, every 25 levels triples DPS.</li>
            <li>💀 <b>Primal bosses</b> (zone 25+) grant Essence. <b>Ascend</b> to restart stronger.</li>
            <li>⌨ Skills on keys <b>1–9</b>, <b>A</b> toggles auto-progress.</li>
          </ul>
          <button onClick={g.act.startGame} className="btn-gold w-full py-3 text-base">Begin the Hunt</button>
        </Modal>
      )}

      {s.introSeen && g.offline && (
        <Modal>
          <h2 className="font-display text-2xl gold-text">Welcome Back!</h2>
          <p className="text-sm text-white/60">Your heroes fought for {duration(g.offline.ms)}</p>
          <p className="text-sm">{g.offline.kills.toLocaleString()} monsters defeated</p>
          <p className="text-3xl gold-num font-display tabular-nums">+{g.fmt(g.offline.gold)}</p>
          <button onClick={g.collectOffline} className="btn-gold w-full py-3 text-base">Collect</button>
        </Modal>
      )}

      {s.introSeen && !g.offline && g.dailyOpen && (
        <Modal onClose={() => g.setDailyOpen(false)}>
          <h2 className="font-display text-2xl gold-text">Daily Reward</h2>
          <p className="text-sm text-white/60">Day {dr.streak} streak{dr.streak >= 7 ? " — weekly bonus!" : ""}</p>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={`w-8 h-8 rounded-lg grid place-items-center text-xs font-bold ${i < ((dr.streak - 1) % 7) + 1 ? "bg-amber-500 text-amber-950" : "bg-white/10 text-white/40"}`}>{i === 6 ? "🔮" : i + 1}</span>
            ))}
          </div>
          <p className="text-2xl gold-num font-display tabular-nums">+{g.fmt(dr.gold)}</p>
          <p className="text-xs text-white/55">plus 2× gold for 10 minutes{dr.essence ? ` and ${dr.essence} Essence` : ""}</p>
          <div className="flex gap-2">
            <button onClick={g.act.claimDaily} className="btn-gold flex-1 py-3">Claim</button>
            <button onClick={() => g.setDailyOpen(false)} className="flex-1 rounded-lg py-3 bg-white/10">Later</button>
          </div>
        </Modal>
      )}

      {g.modal === "ascend" && (
        <Modal onClose={() => g.setModal(null)}>
          <h2 className="font-display text-2xl text-violet-200">Ascend?</h2>
          <p>You will gain <span className="text-violet-300 font-bold">+{gain.toLocaleString()} Essence</span> (+{Math.round(gain * 10).toLocaleString()}% DPS while unspent).</p>
          <p className="text-sm text-white/55">Gold, zones, heroes, hero upgrades and gold upgrades reset. Essence, Ancients, gilds, badges and stats are kept.</p>
          <div className="flex gap-2">
            <button onClick={g.act.ascend} className="btn-magic flex-1 py-3 text-sm">🔥 Ascend</button>
            <button onClick={() => g.setModal(null)} className="flex-1 rounded-lg py-3 bg-white/10">Cancel</button>
          </div>
        </Modal>
      )}

      {g.modal === "reset" && (
        <Modal onClose={() => g.setModal(null)}>
          <h2 className="font-display text-xl text-red-300">Erase all progress?</h2>
          <p className="text-sm text-white/55">This cannot be undone. Export your save first if you want a backup.</p>
          <div className="flex gap-2">
            <button onClick={g.act.resetSave} className="flex-1 rounded-lg py-3 bg-red-700 text-white font-bold">Erase</button>
            <button onClick={() => g.setModal(null)} className="flex-1 rounded-lg py-3 bg-white/10">Cancel</button>
          </div>
        </Modal>
      )}

      {g.modal === "help" && (
        <Modal onClose={() => g.setModal(null)}>
          <h2 className="font-display text-2xl gold-text">How to play</h2>
          <ul className="text-left text-[13px] text-white/70 space-y-2">
            <li><b className="text-amber-200">Zones</b> — kill 10 monsters to unlock the next zone. Every 5th zone is a boss you must beat within the timer. If it escapes, auto-progress pauses so you can farm.</li>
            <li><b className="text-amber-200">Heroes</b> — each level adds DPS. Buy their upgrades at levels 10–100; from level 200 every 25 levels triples their DPS.</li>
            <li><b className="text-amber-200">Clicking</b> — fast clicks build a combo for bonus damage. Crits hit hard.</li>
            <li><b className="text-amber-200">Treasure chests</b> — rare monsters worth 10× gold.</li>
            <li><b className="text-amber-200">Gilds</b> — every 10 new zones from zone 30 a random hero is gilded (+50% DPS). Move gilds for 2 Essence.</li>
            <li><b className="text-violet-200">Ascension</b> — primal bosses grant Essence. Ascend to reset with Essence: each unspent one gives +10% DPS, or spend it on Ancients.</li>
          </ul>
          <button onClick={() => g.setModal(null)} className="btn-gold w-full py-2.5">Got it</button>
        </Modal>
      )}
      {g.notice && (
        <Modal onClose={g.dismissNotice}>
          <h2 className="font-display text-xl text-red-300">🛡 Save integrity check</h2>
          <p className="text-sm text-white/70">{g.notice}</p>
          <button onClick={g.dismissNotice} className="btn-gold w-full py-2.5">OK</button>
        </Modal>
      )}

    </div>
  );
}
