import { UPGRADES, type UpgradeCat } from "../../game/content";
import { upgradeCost } from "../../game/formulas";
import { lvl } from "../../game/logic";
import { gte } from "../../game/numbers";
import { useGame } from "../../state/GameContext";

const CATS: [UpgradeCat, string][] = [["click", "Clicking"], ["hero", "Heroes"], ["gold", "Treasure"], ["progress", "Expedition"]];

export function UpgradesPanel() {
  const g = useGame();
  const { s } = g;
  return (
    <div className="space-y-3">
      {CATS.map(([cat, label]) => (
        <div key={cat} className="space-y-1.5">
          <h3 className="section-title">{label}</h3>
          {UPGRADES.filter((u) => u.cat === cat).map((u) => {
            const L = lvl(s, u.id);
            const cost = upgradeCost(u.baseCost, u.growth, L);
            const max = L >= u.max;
            return (
              <div key={u.id} className="card flex items-center gap-2">
                <div className="icon-box">{u.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{u.name}</div>
                  <div className="text-[11px] text-white/55">{u.desc}</div>
                  <div className="level-pips mt-1"><span style={{ width: `${(L / u.max) * 100}%` }} /></div>
                </div>
                <button disabled={max || !gte(s.gold, cost)} onClick={() => g.act.buyUpgrade(u.id)} className="btn-gold shrink-0 min-w-[72px]">
                  <span className="block text-[10px] opacity-80 leading-tight">Lv {L}/{u.max}</span>
                  <span className="block tabular-nums leading-tight">{max ? "MAX" : g.fmt(cost)}</span>
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
