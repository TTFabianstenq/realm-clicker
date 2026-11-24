import { dailyReward, dayKey, questLabel, questProgress } from "../../game/logic";
import { useGame } from "../../state/GameContext";

export function QuestsPanel() {
  const g = useGame();
  const { s } = g;
  const dailyReady = s.lastDaily !== dayKey();
  const dr = dailyReward(s, g.now);
  const filled = dailyReady ? (dr.streak - 1) % 7 : s.dailyStreak > 0 ? ((s.dailyStreak - 1) % 7) + 1 : 0;
  return (
    <div className="space-y-2">
      <div className={`card flex items-center gap-2 ${dailyReady ? "border-amber-400/50 glow-gold" : ""}`}>
        <div className="icon-box">🎁</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Daily Reward</div>
          <div className="text-[11px] text-white/55">
            {dailyReady ? `Day ${dr.streak}: ${g.fmt(dr.gold)} gold + 2× gold for 10 min${dr.essence ? ` + ${dr.essence} Essence` : ""}` : `Streak: ${s.dailyStreak} day${s.dailyStreak === 1 ? "" : "s"}. Come back tomorrow!`}
          </div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-amber-400" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
        <button disabled={!dailyReady} onClick={g.act.claimDaily} className="btn-gold shrink-0">{dailyReady ? "Claim" : "✓"}</button>
      </div>

      <h3 className="section-title">Contracts</h3>
      {s.quests.map((q) => {
        const p = questProgress(s, q);
        const done = p >= q.target;
        return (
          <div key={q.id} className={`card ${done ? "border-emerald-400/50" : ""}`}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{questLabel(q)}</div>
                <div className="text-[11px] text-amber-200/80">
                  Reward: {g.fmt(q.rewardGold)} gold{q.rewardEssence > 0 && <span className="text-violet-300"> + {q.rewardEssence} Essence</span>}
                </div>
              </div>
              {done ? (
                <button onClick={() => g.act.claimQuest(q.id)} className="btn-gold shrink-0">Claim</button>
              ) : (
                <button onClick={() => g.act.rerollQuest(q.id)} className="chip shrink-0" title="Swap for a different contract">↻</button>
              )}
            </div>
            <div className="progress mt-1.5"><span style={{ width: `${(p / q.target) * 100}%` }} /></div>
            <div className="text-[10px] text-white/45 mt-0.5 tabular-nums">{p.toLocaleString()} / {q.target.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}
