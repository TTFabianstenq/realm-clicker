import { HERO_UPGRADES, HEROES, MILESTONE_MULT, MILESTONE_START } from "../../game/content";
import { heroUpgradeCost, nextMilestone } from "../../game/formulas";
import { heroBuyPreview, hlvl } from "../../game/logic";
import { gte, ratio } from "../../game/numbers";
import { useGame } from "../../state/GameContext";
import { HeroPortrait } from "../visual/HeroPortrait";

const AMOUNTS: [number, string][] = [[1, "×1"], [10, "×10"], [25, "×25"], [100, "×100"], [-1, "MAX"]];

export function HeroesPanel() {
  const g = useGame();
  const { s, d } = g;
  const lastOwned = HEROES.reduce((a, _, i) => (hlvl(s, i) > 0 ? i : a), -1);
  const visible = Math.min(HEROES.length, Math.max(lastOwned + 2, 1));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 sticky top-0 z-10 bg-[#11141f]/95 backdrop-blur py-1 -mt-1">
        <span className="text-[11px] text-white/50 mr-1">Buy</span>
        {AMOUNTS.map(([n, label]) => (
          <button key={n} onClick={() => g.act.patchSettings({ buyAmount: n })} className={`chip ${s.settings.buyAmount === n ? "active" : ""}`}>
            {label}
          </button>
        ))}
      </div>
      {HEROES.slice(0, visible).map((h, i) => {
        const lv = hlvl(s, i);
        const p = heroBuyPreview(s, i, s.settings.buyAmount);
        const afford = gte(s.gold, p.cost);
        const dps = d.heroDps[i];
        const share = d.dps.m > 0 ? ratio(dps, d.dps) * 100 : 0;
        const ups = HERO_UPGRADES.filter((u) => u.heroIndex === i);
        const nm = nextMilestone(lv);
        const gilds = s.gilds[h.id] || 0;
        return (
          <div key={h.id} className={`card hero-card ${lv === 0 ? "unhired" : ""}`}>
            <div className="flex gap-2 items-center">
              <HeroPortrait index={i} size={46} gilds={gilds} dim={lv === 0 && !afford} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="font-semibold text-sm truncate">{h.name}</span>
                  <span className="text-[10px] text-white/40 truncate">{h.title}</span>
                </div>
                {lv > 0 ? (
                  <div className="text-[11px] text-white/60 tabular-nums">
                    Lv <span className="text-amber-200 font-semibold">{lv}</span> · <span className="text-cyan-200">{g.fmt(dps)}</span> DPS
                    {share >= 0.5 && <span className="text-white/35"> ({share.toFixed(share >= 10 ? 0 : 1)}%)</span>}
                  </div>
                ) : (
                  <div className="text-[11px] text-white/45 truncate">{h.desc}</div>
                )}
                {lv > 0 && lv >= MILESTONE_START - 50 && (
                  <div className="text-[10px] text-violet-300/80">×{MILESTONE_MULT} DPS at Lv {nm}</div>
                )}
              </div>
              <button disabled={!afford} onClick={() => g.act.buyHero(i)} className="btn-gold shrink-0 min-w-[78px]">
                <span className="block text-[10px] opacity-80 leading-tight">{lv === 0 ? "Hire" : `Lv +${p.n}`}</span>
                <span className="block tabular-nums leading-tight">{g.fmt(p.cost)}</span>
              </button>
            </div>
            {lv > 0 && (
              <div className="flex items-center gap-1 mt-1.5 pl-[54px]">
                {ups.map((u) => {
                  const owned = s.heroUpgrades.includes(u.id);
                  const cost = heroUpgradeCost(u.heroIndex, u.reqLevel, u.costMult);
                  const reach = lv >= u.reqLevel;
                  const can = !owned && reach && gte(s.gold, cost);
                  return (
                    <button
                      key={u.id}
                      disabled={!can}
                      onClick={() => g.act.buyHeroUpgrade(u.id)}
                      className={`hup ${owned ? "owned" : can ? "can" : reach ? "reach" : ""}`}
                      title={`${u.name} — ${u.desc}\n${owned ? "Owned" : `Needs Lv ${u.reqLevel} · Cost ${g.fmt(cost)}`}`}
                    >
                      {owned ? "★" : reach ? "↑" : u.reqLevel}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {visible < HEROES.length && (
        <div className="card text-center text-xs text-white/35 py-3">More heroes appear as your party grows…</div>
      )}
    </div>
  );
}
