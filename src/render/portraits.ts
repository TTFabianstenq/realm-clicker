import { HEROES } from "../game/content";
import { Renderer3D } from "./Renderer3D";
import { heroParams } from "./palette";

const cache: (string | null)[] = HEROES.map(() => null);
const listeners = new Set<() => void>();
let started = false;
let failed = false;

/** Renders hero busts one per frame in the background with a throwaway WebGL context. */
function start() {
  started = true;
  if (typeof document === "undefined") return;
  let r: Renderer3D | null = null;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  try {
    r = Renderer3D.create(c, true);
  } catch {
    r = null;
  }
  if (!r) { failed = true; return; }
  const renderer = r;
  let i = 0;
  const step = () => {
    try {
      renderer.render(heroParams(i), 1.3 + i * 0.37);
      cache[i] = c.toDataURL("image/png");
    } catch {
      failed = true;
      renderer.dispose();
      return;
    }
    i++;
    listeners.forEach((fn) => fn());
    if (i < HEROES.length) setTimeout(step, 16);
    else renderer.dispose();
  };
  setTimeout(step, 300);
}

export function heroPortrait(index: number): string | null {
  if (!started && !failed) start();
  return cache[index] ?? null;
}

export function subscribePortraits(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
