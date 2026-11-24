/** Original stylized hero portraits drawn in SVG, varied per hero. */
import { HEROES } from "../../game/content";
import { useEffect, useState } from "react";
import { heroPortrait, subscribePortraits } from "../../render/portraits";

type Props = { index: number; size?: number; gilds?: number; dim?: boolean };

const SKINS = ["#f0d4b8", "#e0b890", "#c8956c", "#8d5a3b", "#f3dcc8", "#b88563", "#d9b08c"];

export function HeroPortrait({ index, size = 48, gilds = 0, dim }: Props) {
  const h = HEROES[index % HEROES.length];
  const hue = h.hue;
  const skin = SKINS[index % SKINS.length];
  const hair = `hsl(${(hue + 180) % 360} 35% ${20 + (index % 3) * 15}%)`;
  const cloth = `hsl(${hue} 55% 32%)`;
  const accent = `hsl(${hue} 85% 65%)`;
  const style = index % 4; // hair / helmet style
  const [, bump] = useState(0);
  const img = heroPortrait(index % HEROES.length);
  useEffect(() => (img ? undefined : subscribePortraits(() => bump((n) => n + 1))), [img]);
  return (
    <div
      className={`relative shrink-0 rounded-xl overflow-hidden border-2 ${gilds > 0 ? "border-amber-300 gild-glow" : "border-white/10"} ${dim ? "grayscale opacity-60" : ""}`}
      style={{ width: size, height: size, background: `radial-gradient(circle at 50% 30%, hsl(${hue} 50% 28%), hsl(${hue} 40% 10%))` }}
    >
      {img ? (
        <img src={img} width={size} height={size} alt="" draggable={false} className="block w-full h-full object-cover" />
      ) : (
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <ellipse cx="32" cy="62" rx="26" ry="16" fill={cloth} />
        <path d="M14 62 Q32 44 50 62" fill={accent} opacity="0.35" />
        <rect x="27" y="38" width="10" height="8" fill={skin} />
        <circle cx="32" cy="28" r="14" fill={skin} />
        {style === 0 && <path d="M17 28 Q18 10 32 11 Q46 10 47 28 Q42 18 32 17 Q22 18 17 28" fill={hair} />}
        {style === 1 && <path d="M16 30 Q16 8 32 9 Q48 8 48 30 L46 44 Q44 26 32 18 Q20 26 18 44 Z" fill={hair} />}
        {style === 2 && (
          <g>
            <path d="M16 27 Q16 10 32 10 Q48 10 48 27 L48 31 L16 31 Z" fill={`hsl(${hue} 15% 55%)`} />
            <rect x="30" y="10" width="4" height="22" fill={`hsl(${hue} 15% 40%)`} />
          </g>
        )}
        {style === 3 && <path d="M18 24 Q24 6 32 14 Q40 6 46 24 Q40 16 32 20 Q24 16 18 24" fill={hair} />}
        <circle cx="27" cy="29" r="1.8" fill="#14121a" />
        <circle cx="37" cy="29" r="1.8" fill="#14121a" />
        <path d="M28 35 Q32 37 36 35" stroke="#5a2a20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="52" r="3.5" fill={accent} />
      </svg>
      )}
      <span className="absolute bottom-0 right-0.5 text-[10px] leading-none drop-shadow" aria-hidden>{h.glyph}</span>
      {gilds > 0 && (
        <span className="absolute top-0 left-0 text-[9px] font-bold px-1 rounded-br-md bg-amber-400 text-amber-950 leading-tight">✦{gilds}</span>
      )}
    </div>
  );
}
