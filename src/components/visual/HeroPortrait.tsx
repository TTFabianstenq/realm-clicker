/** Original stylized hero portraits via SVG */

type Props = { index: number; size?: number; glow?: boolean };

const HERO_COLORS = [
  { skin: "#e8c4a0", hair: "#5c3a1e", cloth: "#4a7c3a", accent: "#c4a574" },
  { skin: "#f0d4b8", hair: "#6b4a9a", cloth: "#5a3a8a", accent: "#c9a0ff" },
  { skin: "#d4a880", hair: "#2a2a2a", cloth: "#4a5568", accent: "#94a3b8" },
  { skin: "#c8b0a0", hair: "#1a1020", cloth: "#2d1f3d", accent: "#8b5cff" },
  { skin: "#f0d8c0", hair: "#e8e0f0", cloth: "#2a4a6a", accent: "#5ec8ff" },
  { skin: "#c4a890", hair: "#5a5040", cloth: "#5a5048", accent: "#a09070" },
  { skin: "#b0a0c0", hair: "#1a0a28", cloth: "#2a1040", accent: "#a855f7" },
  { skin: "#e0b890", hair: "#8b2020", cloth: "#5a2010", accent: "#ff6b35" },
  { skin: "#d8c0a0", hair: "#3a6a3a", cloth: "#2a5a2a", accent: "#4ade80" },
  { skin: "#e0d0b0", hair: "#606870", cloth: "#4a5560", accent: "#f5c542" },
  { skin: "#f0e0d0", hair: "#e8e8f0", cloth: "#3a3a5a", accent: "#c0c8ff" },
  { skin: "#d0a080", hair: "#3a1810", cloth: "#6a2010", accent: "#ff4500" },
];

export function HeroPortrait({ index, size = 48, glow }: Props) {
  const c = HERO_COLORS[index % HERO_COLORS.length];
  const id = `hp-${index}`;

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 border-amber-700/50 bg-gradient-to-b from-slate-800 to-slate-950 ${glow ? "hero-glow" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id={`${id}-face`} cx="50%" cy="40%">
            <stop offset="0%" stopColor={c.skin} />
            <stop offset="100%" stopColor={c.skin} stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="58" rx="28" ry="14" fill={c.cloth} />
        <circle cx="32" cy="28" r="16" fill={`url(#${id}-face)`} />
        <path d="M16 28 Q18 8 32 10 Q46 8 48 28 Q40 18 32 16 Q24 18 16 28" fill={c.hair} />
        <circle cx="26" cy="28" r="2.2" fill="#1a1a22" />
        <circle cx="38" cy="28" r="2.2" fill="#1a1a22" />
        <circle cx="32" cy="48" r="4" fill={c.accent} opacity="0.9" />
      </svg>
    </div>
  );
}
