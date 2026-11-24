import { HEROES } from "../../game/content";
import { formatInt, fromNumber } from "../../game/numbers";
import { useGame } from "../../state/GameContext";

function dur(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${Math.floor(sec % 60)}s`;
}

export function StatsPanel() {
  const g = useGame();
  const { s, d } = g;
  const gilds = Object.values(s.gilds).reduce((a, b) => a + b, 0);
  const levels = HEROES.reduce((a, h) => a + (s.heroLevels[h.id] || 0), 0);
  const rows: [string, string][] = [
    ["DPS", g.fmt(d.dps)],
    ["Click damage", g.fmt(d.clickDmg)],
    ["Crit chance", `${(d.critChance * 100).toFixed(1)}%`],
    ["Crit multiplier", `×${d.critMult}`],
    ["Gold multiplier", `×${d.goldMult.toFixed(2)}`],
    ["Chest chance", `${(d.chestChance * 100).toFixed(1)}%`],
    ["Auto attacks / sec", String(d.autoClicksPerSec)],
    ["Global DPS mult", `×${g.fmt(fromNumber(d.globalMult))}`],
    ["Highest zone", formatInt(s.stats.highestZone)],
    ["Current run", dur((g.now - s.stats.runStart) / 1000)],
    ["Ascensions", formatInt(s.ascensions)],
    ["Lifetime Essence", formatInt(s.stats.totalEssence)],
    ["Gilds", formatInt(gilds)],
    ["Hero levels", formatInt(levels)],
    ["Clicks", formatInt(s.stats.clicks)],
    ["Auto attacks", formatInt(s.stats.autoClicks)],
    ["Best combo", formatInt(s.stats.bestCombo)],
    ["Monsters slain", formatInt(s.stats.monsters)],
    ["Bosses slain", formatInt(s.stats.bosses)],
    ["Primal bosses", formatInt(s.stats.primals)],
    ["Chests opened", formatInt(s.stats.chests)],
    ["Skills used", formatInt(s.stats.skillsUsed)],
    ["Total damage", g.fmt(s.stats.totalDamage)],
    ["Lifetime gold", g.fmt(s.stats.totalGold)],
    ["Gold this run", g.fmt(s.stats.runGold)],
    ["Play time", dur(s.stats.playTime)],
    ["Anti-cheat", s.stats.tamper > 0 ? `${formatInt(s.stats.tamper)} blocked` : "Clean ✓"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="card !p-2">
          <dt className="text-[10px] uppercase tracking-wider text-white/40">{k}</dt>
          <dd className="font-semibold text-sm tabular-nums truncate">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
