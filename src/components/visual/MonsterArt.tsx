/** Original SVG fantasy monsters — the silhouette is picked by seed, the palette by zone. */
import { memo, useId } from "react";
import { BOSS_EVERY, MONSTER_NAMES, ZONE_THEMES } from "../../game/content";
import type { MonsterKind } from "../../game/types";

type Props = { zone: number; seed: number; kind: MonsterKind; primal: boolean };

const VARIANTS = MONSTER_NAMES.length;

export const MonsterArt = memo(function MonsterArt({ zone, seed, kind, primal }: Props) {
  const uid = "m" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const themeHue = ZONE_THEMES[Math.floor((zone - 1) / BOSS_EVERY) % ZONE_THEMES.length].hue;
  const hue = (themeHue + ((seed % 7) - 3) * 14 + 360) % 360;
  const boss = kind === "boss";
  const variant = boss ? (Math.floor(zone / BOSS_EVERY) * 5) % VARIANTS : seed % VARIANTS;
  const g = { body: `${uid}b`, eye: `${uid}e`, glow: `${uid}g`, aura: `${uid}a` };
  const P = { hue, g };

  return (
    <svg viewBox="0 0 200 220" className="w-full h-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id={g.body} cx="40%" cy="35%">
          <stop offset="0%" stopColor={`hsl(${hue} 70% 58%)`} />
          <stop offset="70%" stopColor={`hsl(${hue} 55% 32%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 45% 16%)`} />
        </radialGradient>
        <radialGradient id={g.eye}>
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="100%" stopColor="#f5c542" />
        </radialGradient>
        <radialGradient id={g.aura}>
          <stop offset="0%" stopColor={primal ? "#b98cff" : "#ff7a50"} stopOpacity="0.55" />
          <stop offset="100%" stopColor={primal ? "#6b21a8" : "#7f1d1d"} stopOpacity="0" />
        </radialGradient>
        <filter id={g.glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {boss && <circle cx="100" cy="115" r="105" fill={`url(#${g.aura})`} className="boss-aura" />}
      <ellipse cx="100" cy="207" rx={boss ? 72 : 55} ry="9" fill="rgba(0,0,0,0.45)" />
      {kind === "chest" ? (
        <Chest />
      ) : (
        <g>
          {variant === 0 && <Slime {...P} />}
          {variant === 1 && <Beast {...P} />}
          {variant === 2 && <Golem {...P} />}
          {variant === 3 && <Spider {...P} />}
          {variant === 4 && <Drake {...P} />}
          {variant === 5 && <Shade {...P} />}
          {variant === 6 && <Shroom {...P} />}
          {variant === 7 && <Eye {...P} />}
          {variant === 8 && <Wisp {...P} />}
          {variant === 9 && <Knight {...P} />}
          {variant === 10 && <Crab {...P} />}
        </g>
      )}
      {boss && (
        <path
          d="M70 28 L78 8 L90 22 L100 2 L110 22 L122 8 L130 28 Z"
          fill={primal ? "#c4b5fd" : "#f5c542"}
          stroke={primal ? "#6d28d9" : "#a16207"}
          strokeWidth="2"
          filter={`url(#${g.glow})`}
        />
      )}
    </svg>
  );
});

type P = { hue: number; g: { body: string; eye: string; glow: string } };
const c = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;

function Slime({ hue, g }: P) {
  return (
    <g>
      <path d="M30 190 Q20 110 100 60 Q180 110 170 190 Z" fill={`url(#${g.body})`} />
      <ellipse cx="70" cy="100" rx="18" ry="11" fill="white" opacity="0.25" />
      <ellipse cx="78" cy="128" rx="12" ry="15" fill="#0a0a12" />
      <ellipse cx="122" cy="128" rx="12" ry="15" fill="#0a0a12" />
      <circle cx="81" cy="123" r="5" fill={`url(#${g.eye})`} />
      <circle cx="125" cy="123" r="5" fill={`url(#${g.eye})`} />
      <path d="M82 160 Q100 176 118 160" stroke="#0a0a12" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="140" cy="170" r="6" fill={c(hue, 70, 60)} opacity="0.6" />
    </g>
  );
}

function Beast({ hue, g }: P) {
  return (
    <g>
      <ellipse cx="100" cy="142" rx="56" ry="44" fill={`url(#${g.body})`} />
      <ellipse cx="100" cy="78" rx="42" ry="37" fill={c(hue, 55, 35)} />
      <path d="M65 58 L52 22 L82 50 Z" fill={c(hue, 50, 26)} />
      <path d="M135 58 L148 22 L118 50 Z" fill={c(hue, 50, 26)} />
      <ellipse cx="82" cy="74" rx="9" ry="11" fill="#0a0a12" />
      <ellipse cx="118" cy="74" rx="9" ry="11" fill="#0a0a12" />
      <circle cx="84" cy="70" r="3.5" fill="#ff6b4a" />
      <circle cx="120" cy="70" r="3.5" fill="#ff6b4a" />
      <ellipse cx="100" cy="98" rx="19" ry="12" fill={c(hue, 40, 24)} />
      <path d="M90 106 L93 116 L96 106 M104 106 L107 116 L110 106" fill="#f8f4e3" />
      <rect x="63" y="170" width="20" height="30" rx="7" fill={c(hue, 45, 24)} />
      <rect x="117" y="170" width="20" height="30" rx="7" fill={c(hue, 45, 24)} />
    </g>
  );
}

function Golem({ hue, g }: P) {
  return (
    <g>
      <rect x="55" y="92" width="90" height="95" rx="12" fill={`url(#${g.body})`} />
      <rect x="66" y="40" width="68" height="58" rx="10" fill={c(hue, 30, 40)} />
      <path d="M80 112 L95 140 L85 162 M120 102 L110 132" stroke={c(hue, 30, 18)} strokeWidth="3" fill="none" />
      <rect x="78" y="58" width="16" height="11" rx="2" fill="#7cf0ff" filter={`url(#${g.glow})`} />
      <rect x="106" y="58" width="16" height="11" rx="2" fill="#7cf0ff" filter={`url(#${g.glow})`} />
      <rect x="28" y="100" width="28" height="58" rx="9" fill={c(hue, 30, 30)} />
      <rect x="144" y="100" width="28" height="58" rx="9" fill={c(hue, 30, 30)} />
      <rect x="65" y="185" width="25" height="16" rx="4" fill={c(hue, 25, 22)} />
      <rect x="110" y="185" width="25" height="16" rx="4" fill={c(hue, 25, 22)} />
    </g>
  );
}

function Spider({ hue, g }: P) {
  return (
    <g>
      {[22, 42, 158, 178].map((x, i) => (
        <path key={i} d={`M100 125 Q${x} ${70 + (i % 2) * 40} ${x + (x < 100 ? -6 : 6)} 196`} stroke={c(hue, 40, 26)} strokeWidth="7" fill="none" strokeLinecap="round" />
      ))}
      <ellipse cx="100" cy="132" rx="44" ry="38" fill={`url(#${g.body})`} />
      <circle cx="100" cy="88" r="29" fill={c(hue, 50, 33)} />
      {[74, 89, 111, 126].map((x, i) => (
        <circle key={x} cx={x} cy={i % 3 === 0 ? 86 : 80} r="5" fill={`url(#${g.eye})`} />
      ))}
      <circle cx="100" cy="70" r="6" fill="#ff6b4a" filter={`url(#${g.glow})`} />
      <path d="M92 108 L96 120 M108 108 L104 120" stroke="#f8f4e3" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Drake({ hue, g }: P) {
  return (
    <g>
      <path d="M100 100 Q38 34 14 88 Q48 80 100 122" fill={c(hue, 50, 38)} opacity="0.9" />
      <path d="M100 100 Q162 34 186 88 Q152 80 100 122" fill={c(hue, 50, 38)} opacity="0.9" />
      <ellipse cx="100" cy="134" rx="46" ry="42" fill={`url(#${g.body})`} />
      <path d="M78 150 Q100 170 122 150" stroke={c(hue, 60, 70)} strokeWidth="3" fill="none" opacity="0.5" />
      <ellipse cx="100" cy="80" rx="33" ry="28" fill={c(hue, 55, 36)} />
      <path d="M78 60 L68 28 L88 55 M122 60 L132 28 L112 55" fill={c(hue, 40, 22)} stroke={c(hue, 40, 22)} strokeWidth="4" />
      <ellipse cx="88" cy="78" rx="7" ry="9" fill="#0a0a12" />
      <ellipse cx="112" cy="78" rx="7" ry="9" fill="#0a0a12" />
      <circle cx="90" cy="75" r="2.6" fill="#ffb020" />
      <circle cx="114" cy="75" r="2.6" fill="#ffb020" />
      <path d="M100 168 Q140 194 160 176" stroke={c(hue, 45, 28)} strokeWidth="11" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Shade({ hue, g }: P) {
  return (
    <g opacity="0.95">
      <path d="M50 200 Q46 110 100 40 Q154 110 150 200 Q140 186 128 200 Q114 184 100 200 Q86 184 72 200 Q60 186 50 200" fill={`url(#${g.body})`} />
      <ellipse cx="85" cy="92" rx="10" ry="14" fill="#a78bfa" filter={`url(#${g.glow})`} />
      <ellipse cx="115" cy="92" rx="10" ry="14" fill="#a78bfa" filter={`url(#${g.glow})`} />
      <circle cx="85" cy="90" r="3" fill="white" />
      <circle cx="115" cy="90" r="3" fill="white" />
      <path d="M88 124 Q100 116 112 124" stroke="#0a0a12" strokeWidth="4" fill="none" />
      <path d="M40 130 Q20 110 30 90 M160 130 Q180 110 170 90" stroke={c(hue, 60, 55)} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
    </g>
  );
}

function Shroom({ hue, g }: P) {
  return (
    <g>
      <path d="M72 120 Q66 170 78 196 L122 196 Q134 170 128 120 Z" fill="#efe6d2" />
      <path d="M20 122 Q30 40 100 36 Q170 40 180 122 Q100 138 20 122" fill={`url(#${g.body})`} />
      {[[60, 80, 10], [100, 60, 13], [140, 84, 9], [84, 104, 7], [124, 108, 8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff6e8" opacity="0.85" />
      ))}
      <ellipse cx="88" cy="150" rx="6" ry="9" fill="#1a1418" />
      <ellipse cx="112" cy="150" rx="6" ry="9" fill="#1a1418" />
      <path d="M92 172 Q100 178 108 172" stroke="#1a1418" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="186" r="5" fill={c(hue, 70, 60)} opacity="0.5" />
      <circle cx="160" cy="176" r="4" fill={c(hue, 70, 60)} opacity="0.5" />
    </g>
  );
}

function Eye({ hue, g }: P) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M100 110 Q${40 + i * 30} ${30 - (i % 2) * 10} ${36 + i * 32} ${10 + (i % 2) * 14}`} stroke={c(hue, 45, 30)} strokeWidth="6" fill="none" strokeLinecap="round" />
      ))}
      <circle cx="100" cy="125" r="62" fill={`url(#${g.body})`} />
      <ellipse cx="100" cy="122" rx="40" ry="32" fill="#f8f4e8" />
      <circle cx="100" cy="122" r="20" fill={c((hue + 180) % 360, 70, 45)} />
      <circle cx="100" cy="122" r="9" fill="#0a0a12" />
      <circle cx="94" cy="116" r="4" fill="white" />
      <path d="M70 168 L78 180 L86 170 L94 182 L102 170 L110 182 L118 170 L126 180 L132 168" stroke="#f8f4e8" strokeWidth="3" fill="none" />
    </g>
  );
}

function Wisp({ hue, g }: P) {
  return (
    <g filter={`url(#${g.glow})`}>
      <path d="M100 30 Q150 90 140 140 Q130 196 100 196 Q70 196 60 140 Q50 90 100 30" fill={c(hue, 90, 65)} opacity="0.35" />
      <circle cx="100" cy="135" r="42" fill={`url(#${g.body})`} />
      <circle cx="100" cy="135" r="24" fill={c(hue, 95, 80)} opacity="0.7" />
      <circle cx="90" cy="130" r="5" fill="#0a0a12" />
      <circle cx="110" cy="130" r="5" fill="#0a0a12" />
      <path d="M94 146 Q100 150 106 146" stroke="#0a0a12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Knight({ hue, g }: P) {
  return (
    <g>
      <path d="M58 200 L62 120 Q100 98 138 120 L142 200 Z" fill={`url(#${g.body})`} />
      <rect x="72" y="40" width="56" height="70" rx="22" fill={c(hue, 15, 45)} />
      <rect x="76" y="70" width="48" height="8" rx="3" fill="#0a0a12" />
      <rect x="84" y="71" width="10" height="5" fill="#ff5a3a" filter={`url(#${g.glow})`} />
      <rect x="106" y="71" width="10" height="5" fill="#ff5a3a" filter={`url(#${g.glow})`} />
      <path d="M100 40 Q96 18 112 8" stroke={c(hue, 70, 50)} strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="148" y="40" width="7" height="140" rx="3" fill="#cbd5e1" />
      <rect x="138" y="140" width="27" height="7" rx="3" fill={c(hue, 30, 30)} />
      <path d="M30 120 L62 116 L64 176 Q46 172 30 150 Z" fill={c(hue, 40, 35)} stroke={c(hue, 30, 20)} strokeWidth="3" />
    </g>
  );
}

function Crab({ hue, g }: P) {
  return (
    <g>
      {[40, 60, 140, 160].map((x, i) => (
        <path key={i} d={`M${x < 100 ? 70 : 130} 150 L${x} 178 L${x + (x < 100 ? -8 : 8)} 198`} stroke={c(hue, 50, 30)} strokeWidth="6" fill="none" strokeLinecap="round" />
      ))}
      <path d="M44 110 Q20 70 40 50 Q50 76 64 70 Q56 90 62 108 Z" fill={c(hue, 60, 42)} />
      <path d="M156 110 Q180 70 160 50 Q150 76 136 70 Q144 90 138 108 Z" fill={c(hue, 60, 42)} />
      <ellipse cx="100" cy="140" rx="62" ry="40" fill={`url(#${g.body})`} />
      <rect x="84" y="88" width="5" height="24" fill={c(hue, 50, 30)} />
      <rect x="111" y="88" width="5" height="24" fill={c(hue, 50, 30)} />
      <circle cx="86" cy="86" r="8" fill="#0a0a12" />
      <circle cx="114" cy="86" r="8" fill="#0a0a12" />
      <circle cx="88" cy="84" r="3" fill={`url(#${g.eye})`} />
      <circle cx="116" cy="84" r="3" fill={`url(#${g.eye})`} />
      <path d="M86 150 Q100 160 114 150" stroke="#0a0a12" strokeWidth="4" fill="none" />
    </g>
  );
}

function Chest() {
  return (
    <g>
      <circle cx="100" cy="130" r="90" fill="#f5c542" opacity="0.12" className="boss-aura" />
      <rect x="40" y="110" width="120" height="82" rx="8" fill="#7a4a1e" stroke="#3a220c" strokeWidth="4" />
      <path d="M40 112 Q40 62 100 62 Q160 62 160 112 Z" fill="#8f5a26" stroke="#3a220c" strokeWidth="4" />
      <rect x="36" y="104" width="128" height="14" rx="3" fill="#d4a017" stroke="#7a5a00" strokeWidth="3" />
      <rect x="64" y="64" width="12" height="128" fill="#d4a017" opacity="0.9" />
      <rect x="124" y="64" width="12" height="128" fill="#d4a017" opacity="0.9" />
      <rect x="88" y="112" width="24" height="28" rx="4" fill="#ffe27a" stroke="#7a5a00" strokeWidth="3" />
      <circle cx="100" cy="124" r="4" fill="#3a220c" />
      <circle cx="58" cy="78" r="3" fill="white" className="twinkle" />
      <circle cx="146" cy="92" r="2.5" fill="white" className="twinkle" style={{ animationDelay: "0.6s" }} />
    </g>
  );
}
