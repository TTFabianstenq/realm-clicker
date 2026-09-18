/** Layered CSS/SVG zone environments */

type Props = { zone: number; boss: boolean };

const THEMES = [
  { sky: "#1a2f1a", mid: "#2d4a2d", ground: "#1e3a1e", accent: "#4a7c4a", name: "forest" },
  { sky: "#2a2418", mid: "#4a3c28", ground: "#3a3020", accent: "#c4a574", name: "ruins" },
  { sky: "#0e1e2e", mid: "#1a3a5a", ground: "#0a2030", accent: "#5ec8ff", name: "crystal" },
  { sky: "#2a1008", mid: "#5a2810", ground: "#3a1808", accent: "#ff6b35", name: "volcano" },
  { sky: "#0e1e2e", mid: "#1a3048", ground: "#e8f0f8", accent: "#a8d4f0", name: "frost" },
  { sky: "#12081a", mid: "#2a1040", ground: "#180c28", accent: "#8b5cff", name: "shadow" },
  { sky: "#1a1830", mid: "#3a3050", ground: "#2a2040", accent: "#f5d76e", name: "celestial" },
  { sky: "#0a0610", mid: "#1a0e28", ground: "#0c0818", accent: "#6b3fa0", name: "void" },
];

export function ZoneBackground({ zone, boss }: Props) {
  const t = THEMES[(zone - 1) % THEMES.length];
  const dim = boss ? 0.55 : 1;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl" style={{ opacity: dim }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${t.sky} 0%, ${t.mid} 55%, ${t.ground} 100%)` }} />
      <svg className="absolute bottom-0 left-0 w-full h-2/3 opacity-40" viewBox="0 0 400 200" preserveAspectRatio="none">
        <path d="M0 200 L0 120 L40 90 L80 110 L120 60 L160 100 L200 50 L240 95 L280 70 L320 110 L360 80 L400 120 L400 200 Z" fill={t.accent} opacity="0.35" />
        <path d="M0 200 L0 150 L50 130 L100 155 L150 120 L200 145 L250 115 L300 150 L350 125 L400 155 L400 200 Z" fill={t.ground} opacity="0.7" />
      </svg>
      <div className="zone-particles absolute inset-0 pointer-events-none">
        {[12, 28, 45, 62, 78, 90].map((x, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-40"
            style={{
              left: `${x}%`,
              top: `${20 + (i * 11) % 50}%`,
              background: t.accent,
              animation: `floatParticle ${4 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-50" style={{ background: `linear-gradient(transparent, ${t.ground})` }} />
      {boss && <div className="absolute inset-0 bg-red-950/30 pointer-events-none" />}
    </div>
  );
}
