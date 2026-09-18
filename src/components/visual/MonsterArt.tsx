/** Original SVG fantasy monsters - silhouette changes by zone/theme */

type Props = {
  zone: number;
  boss: boolean;
  hit: boolean;
  reducedMotion: boolean;
};

const HUES = [140, 40, 200, 18, 195, 270, 50, 280, 220, 10, 260, 45];

export function MonsterArt({ zone, boss, hit, reducedMotion }: Props) {
  const hue = HUES[(zone - 1) % HUES.length];
  const scale = boss ? 1.15 : 1;
  const variant = (zone - 1) % 6;

  return (
    <div
      className={`relative ${hit ? "monster-hit" : ""} ${reducedMotion ? "" : "monster-breathe"}`}
      style={{ width: boss ? 220 : 180, height: boss ? 240 : 200, transform: `scale(${scale})` }}
    >
      <svg viewBox="0 0 200 220" className="w-full h-full drop-shadow-2xl" aria-hidden>
        <defs>
          <radialGradient id="bodyGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor={`hsl(${hue} 70% 55%)`} />
            <stop offset="70%" stopColor={`hsl(${hue} 55% 32%)`} />
            <stop offset="100%" stopColor={`hsl(${hue} 45% 18%)`} />
          </radialGradient>
          <radialGradient id="eyeGrad">
            <stop offset="0%" stopColor="#fff8c8" />
            <stop offset="100%" stopColor="#f5c542" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="100" cy="205" rx={boss ? 70 : 55} ry="10" fill="rgba(0,0,0,0.45)" />
        {variant === 0 && <Slime hue={hue} boss={boss} />}
        {variant === 1 && <Beast hue={hue} />}
        {variant === 2 && <Golem hue={hue} />}
        {variant === 3 && <Spider hue={hue} />}
        {variant === 4 && <Drake hue={hue} />}
        {variant === 5 && <Shade hue={hue} />}
      </svg>
    </div>
  );
}

function Slime({ hue, boss }: { hue: number; boss: boolean }) {
  return (
    <g>
      <ellipse cx="100" cy="130" rx="70" ry="65" fill="url(#bodyGrad)" />
      <ellipse cx="100" cy="100" rx="55" ry="50" fill={`hsl(${hue} 65% 48%)`} opacity="0.5" />
      <ellipse cx="75" cy="105" rx="14" ry="16" fill="#0a0a12" />
      <ellipse cx="125" cy="105" rx="14" ry="16" fill="#0a0a12" />
      <circle cx="78" cy="100" r="5" fill="url(#eyeGrad)" />
      <circle cx="128" cy="100" r="5" fill="url(#eyeGrad)" />
      <path d="M80 145 Q100 165 120 145" stroke="#0a0a12" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="70" cy="85" rx="18" ry="12" fill="white" opacity="0.25" />
      {boss && <path d="M60 55 Q100 20 140 55" stroke={`hsl(${hue} 80% 70%)`} strokeWidth="6" fill="none" opacity="0.6" />}
    </g>
  );
}

function Beast({ hue }: { hue: number }) {
  return (
    <g>
      <ellipse cx="100" cy="140" rx="55" ry="45" fill="url(#bodyGrad)" />
      <ellipse cx="100" cy="75" rx="42" ry="38" fill={`hsl(${hue} 55% 35%)`} />
      <path d="M65 55 L55 25 L80 50 Z" fill={`hsl(${hue} 50% 28%)`} />
      <path d="M135 55 L145 25 L120 50 Z" fill={`hsl(${hue} 50% 28%)`} />
      <ellipse cx="82" cy="72" rx="10" ry="12" fill="#0a0a12" />
      <ellipse cx="118" cy="72" rx="10" ry="12" fill="#0a0a12" />
      <circle cx="84" cy="68" r="3.5" fill="#ff6b4a" />
      <circle cx="120" cy="68" r="3.5" fill="#ff6b4a" />
      <ellipse cx="100" cy="95" rx="18" ry="12" fill={`hsl(${hue} 40% 25%)`} />
      <circle cx="93" cy="93" r="3" fill="#1a1a22" />
      <circle cx="107" cy="93" r="3" fill="#1a1a22" />
      <rect x="65" y="170" width="18" height="28" rx="6" fill={`hsl(${hue} 45% 25%)`} />
      <rect x="117" y="170" width="18" height="28" rx="6" fill={`hsl(${hue} 45% 25%)`} />
    </g>
  );
}

function Golem({ hue }: { hue: number }) {
  return (
    <g>
      <rect x="55" y="90" width="90" height="95" rx="12" fill="url(#bodyGrad)" />
      <rect x="65" y="40" width="70" height="60" rx="10" fill={`hsl(${hue} 40% 40%)`} />
      <path d="M80 110 L95 140 L85 160" stroke={`hsl(${hue} 30% 20%)`} strokeWidth="3" fill="none" />
      <path d="M120 100 L110 130" stroke={`hsl(${hue} 30% 20%)`} strokeWidth="3" fill="none" />
      <rect x="78" y="58" width="16" height="12" rx="2" fill="#7cf0ff" filter="url(#glow)" />
      <rect x="106" y="58" width="16" height="12" rx="2" fill="#7cf0ff" filter="url(#glow)" />
      <rect x="30" y="100" width="28" height="55" rx="8" fill={`hsl(${hue} 35% 30%)`} />
      <rect x="142" y="100" width="28" height="55" rx="8" fill={`hsl(${hue} 35% 30%)`} />
    </g>
  );
}

function Spider({ hue }: { hue: number }) {
  return (
    <g>
      {[30, 50, 150, 170].map((x, i) => (
        <path key={i} d={`M100 120 Q${x} ${80 + (i % 2) * 40} ${x - 10} 180`} stroke={`hsl(${hue} 40% 30%)`} strokeWidth="6" fill="none" strokeLinecap="round" />
      ))}
      <ellipse cx="100" cy="125" rx="40" ry="35" fill="url(#bodyGrad)" />
      <circle cx="100" cy="85" r="28" fill={`hsl(${hue} 50% 35%)`} />
      {[72, 88, 112, 128].map((x) => (
        <circle key={x} cx={x} cy="80" r="5" fill="#f5c542" />
      ))}
      <circle cx="100" cy="70" r="6" fill="#ff6b4a" />
    </g>
  );
}

function Drake({ hue }: { hue: number }) {
  return (
    <g>
      <path d="M100 100 Q40 40 20 90 Q50 80 100 120" fill={`hsl(${hue} 50% 40%)`} opacity="0.85" />
      <path d="M100 100 Q160 40 180 90 Q150 80 100 120" fill={`hsl(${hue} 50% 40%)`} opacity="0.85" />
      <ellipse cx="100" cy="130" rx="45" ry="40" fill="url(#bodyGrad)" />
      <ellipse cx="100" cy="80" rx="32" ry="28" fill={`hsl(${hue} 55% 38%)`} />
      <path d="M78 60 L70 30 L88 55" fill={`hsl(${hue} 40% 25%)`} />
      <path d="M122 60 L130 30 L112 55" fill={`hsl(${hue} 40% 25%)`} />
      <ellipse cx="88" cy="78" rx="7" ry="9" fill="#0a0a12" />
      <ellipse cx="112" cy="78" rx="7" ry="9" fill="#0a0a12" />
      <circle cx="90" cy="75" r="2.5" fill="#ff6b4a" />
      <circle cx="114" cy="75" r="2.5" fill="#ff6b4a" />
      <path d="M100 165 Q140 190 155 175" stroke={`hsl(${hue} 45% 30%)`} strokeWidth="10" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Shade({ hue }: { hue: number }) {
  return (
    <g opacity="0.95">
      <ellipse cx="100" cy="130" rx="50" ry="70" fill="url(#bodyGrad)" />
      <ellipse cx="100" cy="70" rx="35" ry="40" fill={`hsl(${hue} 40% 25%)`} />
      <ellipse cx="85" cy="70" rx="10" ry="14" fill="#8b5cff" filter="url(#glow)" />
      <ellipse cx="115" cy="70" rx="10" ry="14" fill="#8b5cff" filter="url(#glow)" />
      <circle cx="85" cy="68" r="3" fill="white" />
      <circle cx="115" cy="68" r="3" fill="white" />
      <path d="M60 150 Q40 180 55 200" stroke={`hsl(${hue} 60% 50%)`} strokeWidth="4" fill="none" opacity="0.5" />
      <path d="M140 150 Q160 180 145 200" stroke={`hsl(${hue} 60% 50%)`} strokeWidth="4" fill="none" opacity="0.5" />
    </g>
  );
}
