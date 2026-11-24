import { useEffect, useState } from "react";
import { BOSS_EVERY, ZONE_THEMES } from "../game/content";
import { isBossZone } from "../game/formulas";
import { maxZone } from "../game/logic";
import { useGame } from "../state/GameContext";

export function ZoneBar() {
  const g = useGame();
  const { s } = g;
  const top = maxZone(s);
  const [count, setCount] = useState(9);
  useEffect(() => {
    const f = () => setCount(window.innerWidth < 420 ? 5 : window.innerWidth < 640 ? 7 : 9);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  const half = Math.floor(count / 2);
  const start = Math.max(1, Math.min(s.zone - half, top + 2 - count + 1));
  const zones = Array.from({ length: count }, (_, i) => start + i);

  return (
    <div className="zone-bar flex items-center gap-1.5 px-1.5 py-1.5">
      <button className="zone-arrow" onClick={() => g.act.setZone(s.zone - 1)} disabled={s.zone <= 1} aria-label="Previous zone">‹</button>
      <div className="flex-1 flex gap-1 justify-center">
        {zones.map((z) => {
          const locked = z > top;
          const cur = z === s.zone;
          const boss = isBossZone(z);
          const hue = ZONE_THEMES[Math.floor((z - 1) / BOSS_EVERY) % ZONE_THEMES.length].hue;
          return (
            <button
              key={z}
              disabled={locked}
              onClick={() => g.act.setZone(z)}
              className={`zone-tile ${cur ? "current" : ""} ${locked ? "locked" : ""} ${boss ? "boss" : ""}`}
              style={{ ["--zh" as string]: hue }}
              title={locked ? "Locked" : `Zone ${z}${boss ? " (boss)" : ""}`}
            >
              <span className="text-[9px] leading-none opacity-80">{boss ? "☠" : z <= s.cleared ? "✓" : ""}</span>
              <span className="tabular-nums leading-none">{z}</span>
            </button>
          );
        })}
      </div>
      <button className="zone-arrow" onClick={() => g.act.setZone(s.zone + 1)} disabled={s.zone >= top} aria-label="Next zone">›</button>
      <button
        onClick={() => g.act.setAuto(!s.autoProgress)}
        className={`auto-btn ${s.autoProgress ? "on" : "off"}`}
        title="Auto-progress: move to the next zone automatically (key A)"
      >
        {s.autoProgress ? "▶ Auto" : "⏸ Farm"}
      </button>
    </div>
  );
}
