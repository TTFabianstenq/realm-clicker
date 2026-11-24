/** Layered SVG zone environments, one per zone theme. */
import { memo } from "react";
import { BOSS_EVERY, ZONE_THEMES } from "../../game/content";

type Props = { zone: number; boss: boolean; primal: boolean };

const SKY = [
  ["#13261a", "#2d4a2d", "#173018"], // woods
  ["#2a2418", "#4a3c28", "#2c2416"], // ruins
  ["#0b1a2b", "#183a5a", "#0a2030"], // crystal
  ["#2a0e06", "#5a2810", "#2c1206"], // ember
  ["#132235", "#2a4560", "#c9dbe8"], // frost
  ["#10081a", "#2a1040", "#150a22"], // marsh
  ["#1a1830", "#3d3260", "#2a2040"], // celestial
  ["#07040d", "#1a0e28", "#0a0614"], // void
  ["#0b1022", "#1e2b55", "#10162c"], // storm
  ["#1c0a08", "#3a1410", "#160806"], // ashen
  ["#0e0a24", "#2c2050", "#120c28"], // starfall
  ["#211a08", "#4a3a12", "#1e1606"], // gilded
];

export const ZoneBackground = memo(function ZoneBackground({ zone, boss, primal }: Props) {
  const ti = Math.floor((zone - 1) / BOSS_EVERY) % ZONE_THEMES.length;
  const [sky, mid, ground] = SKY[ti];
  const hue = ZONE_THEMES[ti].hue;
  const accent = `hsl(${hue} 70% 60%)`;
  const seed = ti * 37;
  const peaks = Array.from({ length: 9 }, (_, i) => 60 + ((seed + i * 53) % 70));
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${sky} 0%, ${mid} 60%, ${ground} 100%)` }} />
      <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(ellipse at 50% 20%, hsl(${hue} 80% 60% / 0.25), transparent 60%)` }} />
      <svg className="absolute bottom-0 left-0 w-full h-3/4" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden>
        <path d={`M0 200 L0 ${peaks[0]} ${peaks.map((p, i) => `L${(i + 1) * 45} ${p}`).join(" ")} L400 200 Z`} fill={accent} opacity="0.13" />
        <path d={`M0 200 L0 ${peaks[3] + 40} ${peaks.map((p, i) => `L${i * 50 + 25} ${200 - (200 - p) * 0.45}`).join(" ")} L400 200 Z`} fill={ground} opacity="0.85" />
        <rect x="0" y="178" width="400" height="22" fill={ground} />
      </svg>
      <div className="absolute inset-0 pointer-events-none">
        {[8, 22, 37, 51, 66, 79, 92].map((x, i) => (
          <span
            key={i}
            className="zone-mote absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${15 + ((i * 17) % 60)}%`,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              background: accent,
              animationDuration: `${5 + (i % 4)}s`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>
      {boss && <div className={`absolute inset-0 pointer-events-none ${primal ? "bg-violet-950/40" : "bg-red-950/35"} boss-vignette`} />}
    </div>
  );
});
