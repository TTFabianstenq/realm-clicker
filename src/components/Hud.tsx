import { useGame } from "../state/GameContext";
import { goldPerSecond, ascendGain } from "../game/logic";

export function Hud() {
  const g = useGame();
  const { s, d } = g;
  const gps = goldPerSecond(s, d);
  const gain = ascendGain(s);
  const boosts = s.boosts.filter((b) => b.until > g.now);
  return (
    <header className="hud-bar sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-2 sm:px-3 py-1.5 flex items-center gap-2">
        <div className="font-display text-base sm:text-xl gold-text tracking-wide whitespace-nowrap mr-1">Realm Clicker</div>
        <div className="flex-1 flex flex-wrap items-center justify-end gap-1.5">
          <div className="hud-stat hud-gold" title="Gold">
            <span className="coin-icon" aria-hidden />
            <span className="gold-num tabular-nums text-sm sm:text-base">{g.fmt(s.gold)}</span>
            <span className="hidden md:inline text-[10px] text-amber-200/60 tabular-nums">+{g.fmt(gps)}/s</span>
          </div>
          <div className="hud-stat" title="Damage per second from heroes">
            <span className="label">DPS</span>
            <span className="tabular-nums">{g.fmt(d.dps)}</span>
          </div>
          <div className="hud-stat hidden sm:flex" title="Damage per click">
            <span className="label">Click</span>
            <span className="tabular-nums">{g.fmt(d.clickDmg)}</span>
          </div>
          {(s.essence > 0 || gain > 0 || s.ascensions > 0) && (
            <button className="hud-stat hud-essence" title="Essence (each unspent Essence boosts DPS)" onClick={() => g.setTab("ancients")}>
              <span aria-hidden>🔮</span>
              <span className="tabular-nums text-violet-200">{s.essence.toLocaleString()}</span>
              {gain > 0 && <span className="text-[10px] text-violet-300/80 tabular-nums">+{gain.toLocaleString()}</span>}
            </button>
          )}
          <button className="hud-icon" onClick={() => g.setModal("help")} aria-label="How to play" title="How to play">?</button>
        </div>
      </div>
      {boosts.length > 0 && (
        <div className="mx-auto max-w-7xl px-3 pb-1.5 flex flex-wrap gap-1.5 justify-end">
          {boosts.map((b) => (
            <span key={b.id} className="text-[10px] rounded-full bg-amber-900/40 border border-amber-500/40 px-2 py-0.5 text-amber-200 tabular-nums">
              {b.label} · {Math.ceil((b.until - g.now) / 60000)}m
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
