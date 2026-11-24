import { ANCIENTS, ESSENCE_DPS, HEROES, PRIMAL_MIN_ZONE } from "../../game/content";
import { ancientCost, heroLevelEssence } from "../../game/formulas";
import { REGILD_COST, alvl, ascendGain } from "../../game/logic";
import { HeroPortrait } from "../visual/HeroPortrait";
import { useGame } from "../../state/GameContext";

export function AncientsPanel() {
  const g = useGame();
  const { s, d } = g;
  const gain = ascendGain(s);
  const totalLv = HEROES.reduce((a, h) => a + (s.heroLevels[h.id] || 0), 0);
  const perEss = ESSENCE_DPS + alvl(s, "aEssence") * 0.01;
  const totalGilds = Object.values(s.gilds).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      <div className="ascend-card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-violet-300/80">Essence</p>
            <p className="font-display text-3xl text-violet-100 tabular-nums">{s.essence.toLocaleString()}</p>
            <p className="text-[11px] text-violet-200/70">+{Math.round(d.essenceBonus * 100).toLocaleString()}% DPS ({Math.round(perEss * 100)}% each, unspent)</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-violet-300/80">On Ascension</p>
            <p className="font-display text-2xl text-amber-200 tabular-nums">+{gain.toLocaleString()}</p>
            <p className="text-[10px] text-white/45">{s.pendingEssence} primal · {heroLevelEssence(totalLv)} from hero levels</p>
          </div>
        </div>
        <button disabled={gain < 1} onClick={() => g.setModal("ascend")} className="btn-magic w-full mt-3 py-2.5 text-sm">
          🔥 Ascend {s.ascensions > 0 && <span className="opacity-70">(#{s.ascensions + 1})</span>}
        </button>
        {gain < 1 && (
          <p className="text-[11px] text-white/45 mt-2 text-center">
            Defeat a <span className="text-violet-300">primal boss</span> (zone {PRIMAL_MIN_ZONE}+) or reach 2,000 total hero levels to earn Essence.
          </p>
        )}
      </div>
      {totalGilds > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="section-title !p-0">Gilds ✦ {totalGilds}</h3>
            <span className="text-[10px] text-white/45">+{Math.round(50 * (1 + alvl(s, "aGild") * 0.1))}% DPS each · move for {REGILD_COST} 🔮</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {HEROES.map((h, i) => {
              const n = s.gilds[h.id] || 0;
              const canMove = s.essence >= REGILD_COST && n < totalGilds;
              return (
                <button
                  key={h.id}
                  disabled={!canMove}
                  onClick={() => g.act.moveGild(i)}
                  className={`relative rounded-lg ${n ? "" : "opacity-60"} disabled:cursor-default`}
                  title={`${h.name}: ${n} gild${n === 1 ? "" : "s"}${canMove ? ` — click to move a gild here (${REGILD_COST} Essence)` : ""}`}
                >
                  <HeroPortrait index={i} size={34} gilds={n} />
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-white/40 mt-1.5">Tap a hero to pull one gild from your most-gilded hero. Gild your strongest hero!</p>
        </div>
      )}
      <h3 className="section-title">Ancients</h3>
      <p className="text-[11px] text-white/45 -mt-1">Spend Essence on permanent powers. Spent Essence no longer boosts DPS — choose wisely.</p>
      {ANCIENTS.map((a) => {
        const L = alvl(s, a.id);
        const max = a.max > 0 && L >= a.max;
        const cost = ancientCost(a.id, L);
        return (
          <div key={a.id} className={`card flex items-center gap-2 ${L > 0 ? "border-violet-500/30" : ""}`}>
            <div className="icon-box ancient">{a.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm"><span className="font-semibold">{a.name}</span> <span className="text-[10px] text-white/40">{a.title}</span></div>
              <div className="text-[11px] text-white/55">{a.desc}</div>
              <div className="text-[10px] text-violet-300/80">Level {L}{a.max > 0 ? ` / ${a.max}` : ""}</div>
            </div>
            <button disabled={max || s.essence < cost} onClick={() => g.act.buyAncient(a.id)} className="btn-magic shrink-0 min-w-[64px]">
              {max ? "MAX" : `${cost.toLocaleString()} 🔮`}
            </button>
          </div>
        );
      })}
    </div>
  );
}
