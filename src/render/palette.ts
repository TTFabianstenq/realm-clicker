import { BOSS_EVERY, HEROES, MONSTER_NAMES, ZONE_THEMES } from "../game/content";
import type { MonsterKind } from "../game/types";
import { hsl, type SceneParams } from "./Renderer3D";

export const CHEST_VARIANT = 11;
export const BUST_VARIANT = 12;

export function monsterVariant(zone: number, seed: number, kind: MonsterKind) {
  if (kind === "chest") return CHEST_VARIANT;
  if (kind === "boss") return (Math.floor(zone / BOSS_EVERY) * 5) % MONSTER_NAMES.length;
  return seed % MONSTER_NAMES.length;
}

/** Per-variant colour rules so each species reads as itself, tinted by the zone. */
export function monsterParams(zone: number, seed: number, kind: MonsterKind, primal: boolean): Omit<SceneParams, "hit" | "spawn"> {
  const v = monsterVariant(zone, seed, kind);
  const themeHue = ZONE_THEMES[Math.floor((zone - 1) / BOSS_EVERY) % ZONE_THEMES.length].hue;
  const hue = (themeHue + ((seed % 7) - 3) * 12 + 360) % 360;
  let body = hsl(hue, 55, 42);
  let body2 = hsl((hue + 25) % 360, 40, 62);
  let glow = hsl(18, 95, 58);
  let accent = hsl((hue + 180) % 360, 75, 50);
  switch (v) {
    case 0: body = hsl(hue, 70, 52); break; // slime
    case 1: body = hsl(hue, 30, 30); body2 = hsl(hue, 20, 18); glow = hsl(5, 100, 55); break; // beast
    case 2: body = hsl(hue, 18, 55); body2 = hsl((hue + 160) % 360, 80, 60); glow = hsl(185, 100, 60); break; // golem
    case 3: body = hsl(hue, 35, 18); body2 = hsl(hue, 30, 14); glow = hsl(0, 100, 55); break; // spider
    case 4: body = hsl(hue, 60, 38); body2 = hsl((hue + 30) % 360, 60, 65); glow = hsl(48, 100, 55); break; // drake
    case 5: body = hsl(240 + (hue % 50), 35, 24); glow = hsl(275, 100, 68); break; // shade
    case 6: body = hsl((hue + 330) % 360, 70, 45); body2 = hsl(40, 30, 82); break; // mushroom
    case 7: body = hsl(hue, 40, 35); accent = hsl((hue + 160) % 360, 85, 50); break; // eye beast
    case 8: glow = hsl(hue, 95, 60); body = glow; break; // wisp
    case 9: body = hsl(hue, 65, 32); glow = hsl(0, 100, 55); break; // knight (cape/shield colour)
    case 10: body = hsl((hue + 340) % 360, 70, 45); body2 = hsl((hue + 340) % 360, 55, 60); break; // crab
    case 11: glow = hsl(48, 100, 60); break; // chest
  }
  if (primal) glow = hsl(275, 100, 70);
  const boss = kind === "boss";
  return {
    variant: v, body, body2, glow, accent,
    boss, primal,
    yaw: v === CHEST_VARIANT ? 0.45 : 0.42,
    camDist: boss ? 8.0 : 7.7,
    camY: 1.6,
    targetY: boss ? 0.1 : 0.0,
    style: 0,
    seed: seed % 97,
  };
}

const SKINS = [[28, 55, 78], [24, 50, 66], [22, 45, 52], [20, 40, 36], [30, 60, 82], [18, 42, 46], [26, 48, 60]];

export function heroParams(index: number): SceneParams {
  const h = HEROES[index];
  const sk = SKINS[index % SKINS.length];
  return {
    variant: BUST_VARIANT,
    body: hsl(h.hue, 55, 34),
    body2: hsl((h.hue + 180) % 360, 30, 18 + (index % 3) * 18),
    glow: hsl(h.hue, 95, 62),
    accent: hsl(sk[0], sk[1], sk[2]),
    hit: 0, spawn: 1, boss: false, primal: false,
    yaw: 0.38, camDist: 4.3, camY: 0.3, targetY: -0.18,
    style: index % 4, seed: index,
  };
}
