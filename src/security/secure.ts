/* ------------------------------------------------------------------ */
/*  Anti-cheat primitives.                                             */
/*                                                                     */
/*  This module is imported before anything else so it captures the    */
/*  browser's native timing functions before a bookmarklet or console  */
/*  script can replace them.                                           */
/*                                                                     */
/*  Honest limits: the game runs entirely in the browser, so a         */
/*  determined person with a debugger can still beat any client-side   */
/*  check. The goal is to stop console one-liners, cheat-menu          */
/*  bookmarklets, scripted clicks, autoclickers, speed hacks, clock    */
/*  changes and hand-edited saves.                                     */
/* ------------------------------------------------------------------ */

const g = globalThis as typeof globalThis & { performance: Performance };
const nativeDateNow: () => number = Date.now.bind(Date);
const nativePerfNow: () => number = g.performance && g.performance.now ? g.performance.now.bind(g.performance) : nativeDateNow;
const nativeFetch: typeof fetch | undefined = typeof fetch === "function" ? fetch.bind(g) : undefined;
export const nativeRaf: (cb: FrameRequestCallback) => number =
  typeof requestAnimationFrame === "function" ? requestAnimationFrame.bind(g) : (cb) => setTimeout(() => cb(nativePerfNow()), 16) as unknown as number;
export const nativeSetTimeout = setTimeout.bind(g);
export const nativeSetInterval = setInterval.bind(g);

function isNative(fn: unknown): boolean {
  try {
    return typeof fn === "function" && /\{\s*\[native code\]\s*\}/.test(Function.prototype.toString.call(fn));
  } catch {
    return false;
  }
}

/** True if timing functions were already replaced before the game loaded (speed-hack extensions). */
export const timingLooksPatched = typeof window !== "undefined" && (!isNative(Date.now) || !isNative(g.performance?.now));

/* ------------------------------ Trusted time ------------------------------ */

let anchorTime = nativeDateNow();
let anchorPerf = nativePerfNow();
let scale = 1;
let synced = false;
let lastSyncServer = 0;
let lastSyncPerf = 0;
let speedFlags = 0;

/**
 * Monotonic game clock. Based on performance.now (immune to system clock
 * changes) and anchored to server time once synced, so changing your
 * device clock does nothing. If local time runs faster than server time
 * (a speed hack), the clock is slowed back down to real time.
 */
export const clock = {
  now(): number {
    return anchorTime + (nativePerfNow() - anchorPerf) * scale;
  },
  perf: nativePerfNow,
  get synced() { return synced; },
  get speedFlags() { return speedFlags; },
  get scale() { return scale; },
};

async function fetchServerTime(): Promise<{ server: number; perf: number } | null> {
  if (!nativeFetch || typeof location === "undefined" || location.protocol === "file:") return null;
  try {
    const t0 = nativePerfNow();
    const res = await nativeFetch(`/api/time?t=${Math.floor(t0)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as { now?: unknown };
    const t1 = nativePerfNow();
    if (typeof j.now !== "number" || !isFinite(j.now) || t1 - t0 > 5000) return null;
    return { server: j.now + (t1 - t0) / 2, perf: t1 };
  } catch {
    return null;
  }
}

/** Sync with the server clock. Resolves true if trusted time is available. */
export async function syncClock(): Promise<boolean> {
  const r = await fetchServerTime();
  if (!r) return synced;
  if (synced && lastSyncPerf > 0) {
    const localElapsed = r.perf - lastSyncPerf;
    const serverElapsed = r.server - lastSyncServer;
    if (localElapsed > 20_000 && serverElapsed > 0) {
      const ratio = localElapsed / serverElapsed;
      if (ratio > 1.15) {
        speedFlags++;
        scale = Math.max(0.05, Math.min(1, serverElapsed / localElapsed));
      } else if (ratio < 1.05) {
        scale = 1;
      }
    }
  }
  // re-anchor so trusted time equals server time right now
  anchorTime = r.server;
  anchorPerf = r.perf;
  lastSyncServer = r.server;
  lastSyncPerf = r.perf;
  synced = true;
  return true;
}

/* ------------------------------ Trusted input ----------------------------- */

const trustedGetter: ((this: Event) => boolean) | undefined = (() => {
  try {
    const ev = new Event("probe");
    const d = Object.getOwnPropertyDescriptor(ev, "isTrusted") ?? Object.getOwnPropertyDescriptor(Event.prototype, "isTrusted");
    return d?.get as ((this: Event) => boolean) | undefined;
  } catch {
    return undefined;
  }
})();

/**
 * True only for events produced by a real user (mouse, touch, keyboard).
 * element.click(), dispatchEvent() and fake objects all fail this check:
 * the native isTrusted getter can't be overridden and throws on non-events.
 */
export function isTrustedEvent(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  try {
    if (trustedGetter) return trustedGetter.call(e as Event) === true;
    return typeof Event !== "undefined" && e instanceof Event && (e as Event).isTrusted === true;
  } catch {
    return false;
  }
}

/* --------------------------- Click rate guard ---------------------------- */

/** Human click rhythms wobble by tens of milliseconds; macros are near-perfect. */
export function looksRobotic(intervals: number[]): boolean {
  if (intervals.length < 30) return false;
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const sd = Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length);
  return mean < 300 && sd < Math.max(2, mean * 0.04);
}

export type ClickVerdict = "ok" | "untrusted" | "rate" | "robot";

export function createClickGuard(maxPerSecond = 25) {
  let tokens = maxPerSecond;
  let last = nativePerfNow();
  const intervals: number[] = [];
  let lastClick = 0;
  let blockedUntil = 0;
  return {
    check(e: unknown): ClickVerdict {
      if (!isTrustedEvent(e)) return "untrusted";
      const now = nativePerfNow();
      // the hardware timestamp of the input, not when we got round to handling it
      const ts = typeof (e as Event).timeStamp === "number" && (e as Event).timeStamp > 0 ? (e as Event).timeStamp : now;
      if (now < blockedUntil) return "robot";
      tokens = Math.min(maxPerSecond, tokens + ((now - last) / 1000) * maxPerSecond);
      last = now;
      if (tokens < 1) return "rate";
      tokens -= 1;
      if (lastClick > 0) {
        const dt = ts - lastClick;
        if (dt < 1500) {
          intervals.push(dt);
          if (intervals.length > 40) intervals.shift();
        } else intervals.length = 0;
      }
      lastClick = ts;
      // Hardware/OS autoclickers fire with machine-perfect rhythm; humans don't.
      if (intervals.length >= 40 && looksRobotic(intervals)) {
        intervals.length = 0;
        blockedUntil = now + 15_000;
        return "robot";
      }
      return "ok";
    },
  };
}

/* ------------------------------ State freezing ---------------------------- */

/** Deep-freeze so code holding a reference (React DevTools, fiber walking) can't edit it in place. */
export function deepFreeze<T>(o: T): T {
  if (o === null || typeof o !== "object" || Object.isFrozen(o)) return o;
  Object.freeze(o);
  for (const k of Object.keys(o as object)) deepFreeze((o as Record<string, unknown>)[k]);
  return o;
}

/* -------------------------------- Signing -------------------------------- */

function h53(str: string, seed: number): number {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// assembled at runtime so it isn't a single greppable string in the bundle
const K = [0x52, 0x65, 0x61, 0x6c, 0x6d].map((c) => String.fromCharCode(c)).join("") + ":" + (0x2f1c9a * 7).toString(36) + ":" + ["v", "o", "i", "d"].reverse().join("");

export function sign(payload: string): string {
  const a = h53(K + payload, 0x9e37);
  const b = h53(payload + K, a % 0xffff);
  const c = h53(String(a) + payload.length + K, b % 0xffff);
  return a.toString(36) + b.toString(36) + c.toString(36);
}

export function verify(payload: string, sig: unknown): boolean {
  if (typeof sig !== "string" || sig.length < 10) return false;
  const expect = sign(payload);
  if (expect.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expect.length; i++) diff |= expect.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
