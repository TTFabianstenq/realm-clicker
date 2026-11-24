/* Signed save format: {"rc":2,"d":"<state json>","s":"<signature>"}.
 * Hand-editing localStorage or an exported save breaks the signature. */
import { HEROES } from "./content";
import { parseSave } from "./createState";
import { cmp, fromNumber, mulN } from "./numbers";
import type { GameState } from "./types";
import { sign, verify } from "../security/secure";

/** Unsigned saves are only accepted if they were written before signing shipped. */
export const LEGACY_CUTOFF = Date.UTC(2026, 10, 25, 0, 0, 0);

export type DecodeStatus = "ok" | "legacy" | "tampered" | "invalid";

export function encodeSave(s: GameState): string {
  const d = JSON.stringify(s);
  return JSON.stringify({ rc: 2, d, s: sign(d) });
}

/** Basic sanity rules a real save always satisfies. */
export function plausible(s: GameState, fromV1: boolean): boolean {
  if (cmp(s.gold, mulN(s.stats.totalGold, 1.001)) > 0 && cmp(s.gold, fromNumber(1e4)) > 0) return false;
  if (s.zone > s.stats.highestZone + 1) return false;
  if (s.cleared > s.stats.highestZone) return false;
  if (!fromV1 && s.essence > s.stats.totalEssence + 500) return false;
  const levels = HEROES.reduce((a, h) => a + (s.heroLevels[h.id] || 0), 0);
  if (!fromV1 && levels > s.stats.heroLevelsBought + 5) return false;
  if (s.stats.highestZone > 50 && s.stats.monsters < s.stats.highestZone * 3 && !fromV1) return false;
  return true;
}

export function decodeSave(raw: string): { state: GameState | null; status: DecodeStatus } {
  let o: unknown;
  try {
    o = JSON.parse(raw);
  } catch {
    return { state: null, status: "invalid" };
  }
  if (!o || typeof o !== "object" || Array.isArray(o)) return { state: null, status: "invalid" };
  const w = o as Record<string, unknown>;
  if (w.rc === 2 && typeof w.d === "string") {
    if (!verify(w.d, w.s)) return { state: null, status: "tampered" };
    const st = parseSave(w.d);
    return st ? { state: st, status: "ok" } : { state: null, status: "invalid" };
  }
  // unsigned legacy save (v1, or v2 from before signing existed)
  const st = parseSave(raw);
  if (!st) return { state: null, status: "invalid" };
  const savedAt = Number(w.lastSaved) || 0;
  const fromV1 = (Number(w.version) || 1) < 2;
  if (savedAt <= 0 || savedAt >= LEGACY_CUTOFF || !plausible(st, fromV1)) return { state: null, status: "tampered" };
  return { state: st, status: "legacy" };
}

export function toExportString(s: GameState): string {
  return btoa(unescape(encodeURIComponent(encodeSave(s))));
}

export function fromExportString(text: string): { state: GameState | null; status: DecodeStatus } {
  const t = text.trim();
  let json = t;
  if (!t.startsWith("{")) {
    try {
      json = decodeURIComponent(escape(atob(t)));
    } catch {
      return { state: null, status: "invalid" };
    }
  }
  return decodeSave(json);
}
