import { SKILLS } from "../game/content";
import { skillUnlocked } from "../game/logic";
import { useGame } from "../state/GameContext";

function fmtCd(sec: number) {
  if (sec >= 3600) return `${Math.floor(sec / 3600)}h${Math.floor((sec % 3600) / 60)}m`;
  if (sec >= 60) return `${Math.floor(sec / 60)}m${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  return `${Math.ceil(sec)}s`;
}

export function SkillBar() {
  const g = useGame();
  const { s, d } = g;
  return (
    <div className="skill-bar grid grid-cols-9 gap-1 sm:gap-1.5 p-1.5">
      {SKILLS.map((sk, i) => {
        const unlocked = skillUnlocked(s, sk.id);
        const cdLeft = Math.max(0, ((s.skillCd[sk.id] || 0) - g.now) / 1000);
        const total = sk.cooldown * d.skillCdMult;
        const activeLeft = Math.max(0, ((s.skillActive[sk.id] || 0) - g.now) / 1000);
        const ready = unlocked && cdLeft <= 0;
        const pct = cdLeft > 0 ? (cdLeft / total) * 100 : 0;
        const energizedGlow = s.energized && ready && sk.id !== "energize";
        return (
          <button
            key={sk.id}
            disabled={!ready}
            onClick={() => g.act.useSkill(sk.id)}
            className={`skill-btn ${ready ? "ready" : ""} ${activeLeft > 0 ? "active" : ""} ${energizedGlow ? "energized" : ""}`}
            style={{ ["--sh" as string]: sk.hue }}
            title={unlocked ? `${sk.name} [${i + 1}] — ${sk.desc}` : `${sk.name} — unlocks at zone ${sk.unlockZone}`}
            aria-label={sk.name}
          >
            <span className="text-lg sm:text-xl leading-none" aria-hidden>{unlocked ? sk.icon : "🔒"}</span>
            {cdLeft > 0 && <span className="skill-cd" style={{ background: `conic-gradient(rgba(0,0,0,0.65) ${pct}%, transparent 0)` }} />}
            <span className="skill-key">{i + 1}</span>
            {(cdLeft > 0 || activeLeft > 0 || !unlocked) && (
              <span className={`skill-time ${activeLeft > 0 ? "text-amber-200" : ""}`}>
                {!unlocked ? `Z${sk.unlockZone}` : activeLeft > 0 ? fmtCd(activeLeft) : fmtCd(cdLeft)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
