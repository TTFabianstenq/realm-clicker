import { ACHIEVEMENTS, ACHIEVEMENT_DPS } from "../../game/achievements";
import { useGame } from "../../state/GameContext";

export function AchievementsPanel() {
  const { s } = useGame();
  const have = new Set(s.achievements);
  const count = ACHIEVEMENTS.filter((a) => have.has(a.id)).length;
  return (
    <div className="space-y-2">
      <div className="card text-center">
        <p className="font-display text-xl gold-text">{count} / {ACHIEVEMENTS.length}</p>
        <p className="text-[11px] text-white/55">Each badge gives +{Math.round(ACHIEVEMENT_DPS * 100)}% DPS · total +{Math.round(count * ACHIEVEMENT_DPS * 100)}%</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {ACHIEVEMENTS.map((a) => {
          const ok = have.has(a.id);
          return (
            <div key={a.id} className={`card !p-2 flex gap-2 items-center ${ok ? "border-amber-400/40 bg-amber-500/5" : "opacity-50"}`}>
              <span className={`text-xl ${ok ? "" : "grayscale"}`}>{a.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{a.name}</div>
                <div className="text-[10px] text-white/55 leading-tight">{a.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
