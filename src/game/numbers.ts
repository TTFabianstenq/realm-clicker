/** Mantissa-exponent decimal for large idle numbers. */

export type Dec = { m: number; e: number };

export const ZERO: Dec = { m: 0, e: 0 };
export const ONE: Dec = { m: 1, e: 0 };

export function fromNumber(n: number): Dec {
  if (!isFinite(n) || n === 0) return { m: 0, e: 0 };
  const e = Math.floor(Math.log10(Math.abs(n)));
  return normalize({ m: n / 10 ** e, e });
}

export function toNumber(d: Dec): number {
  if (d.m === 0) return 0;
  if (d.e > 308) return d.m < 0 ? -Infinity : Infinity;
  if (d.e < -308) return 0;
  return d.m * 10 ** d.e;
}

export function normalize(d: Dec): Dec {
  if (!isFinite(d.m) || !isFinite(d.e) || d.m === 0) return { m: 0, e: 0 };
  let { m, e } = d;
  const sign = m < 0 ? -1 : 1;
  m = Math.abs(m);
  if (m >= 10 || m < 1) {
    const shift = Math.floor(Math.log10(m));
    m = m / 10 ** shift;
    e += shift;
    // guard against float drift like 9.9999999 -> 10
    if (m >= 10) {
      m /= 10;
      e += 1;
    }
  }
  return { m: sign * m, e };
}

/** Clamp to non-negative (HP, gold floors). */
export function clampNonNeg(d: Dec): Dec {
  if (!isFinite(d.m) || d.m <= 0) return ZERO;
  return normalize(d);
}

export function add(a: Dec, b: Dec): Dec {
  if (a.m === 0) return b;
  if (b.m === 0) return a;
  if (a.e > b.e + 15) return a;
  if (b.e > a.e + 15) return b;
  if (a.e >= b.e) return normalize({ m: a.m + b.m * 10 ** (b.e - a.e), e: a.e });
  return normalize({ m: b.m + a.m * 10 ** (a.e - b.e), e: b.e });
}

export function sub(a: Dec, b: Dec): Dec {
  return add(a, { m: -b.m, e: b.e });
}

export function mul(a: Dec, b: Dec): Dec {
  if (a.m === 0 || b.m === 0) return ZERO;
  return normalize({ m: a.m * b.m, e: a.e + b.e });
}

export function mulN(a: Dec, n: number): Dec {
  return mul(a, fromNumber(n));
}

export function div(a: Dec, b: Dec): Dec {
  if (b.m === 0) return { m: a.m < 0 ? -9.99 : 9.99, e: 9e15 };
  if (a.m === 0) return ZERO;
  return normalize({ m: a.m / b.m, e: a.e - b.e });
}

export function pow(base: number, exp: number): Dec {
  if (exp === 0) return ONE;
  if (base <= 0) return ZERO;
  const log = exp * Math.log10(base);
  const e = Math.floor(log);
  const m = 10 ** (log - e);
  return normalize({ m, e });
}

/** log10 of a positive Dec (returns -Infinity for zero). */
export function log10(d: Dec): number {
  if (d.m <= 0) return -Infinity;
  return d.e + Math.log10(d.m);
}

/** 10^x as Dec. */
export function exp10(x: number): Dec {
  const e = Math.floor(x);
  return normalize({ m: 10 ** (x - e), e });
}

/** Correct comparison including negatives. */
export function cmp(a: Dec, b: Dec): number {
  const an = normalize(a);
  const bn = normalize(b);
  if (an.m === 0 && bn.m === 0) return 0;
  if (an.m < 0 && bn.m >= 0) return -1;
  if (an.m >= 0 && bn.m < 0) return 1;
  if (an.m === 0) return bn.m > 0 ? -1 : 1;
  if (bn.m === 0) return an.m > 0 ? 1 : -1;
  const sameSign = an.m >= 0 ? 1 : -1;
  if (an.e !== bn.e) return sameSign * (an.e > bn.e ? 1 : -1);
  if (an.m === bn.m) return 0;
  return an.m > bn.m ? 1 : -1;
}

export function gte(a: Dec, b: Dec): boolean {
  return cmp(a, b) >= 0;
}

export function maxDec(a: Dec, b: Dec): Dec {
  return cmp(a, b) >= 0 ? a : b;
}

export function minDec(a: Dec, b: Dec): Dec {
  return cmp(a, b) <= 0 ? a : b;
}

/** Ratio a/b as a plain number (clamped to finite). */
export function ratio(a: Dec, b: Dec): number {
  if (b.m === 0) return a.m === 0 ? 0 : Infinity;
  const r = div(a, b);
  if (r.e > 300) return Infinity;
  if (r.e < -300) return 0;
  return toNumber(r);
}

export function clone(d: Dec): Dec {
  return { m: d.m, e: d.e };
}

const SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
  "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg",
];

/** After the named suffixes, use aa, ab, ac … zz (each step = ×1000). */
function suffixFor(group: number): string | null {
  if (group < SUFFIXES.length) return SUFFIXES[group];
  const i = group - SUFFIXES.length;
  if (i >= 26 * 26) return null;
  return String.fromCharCode(97 + Math.floor(i / 26)) + String.fromCharCode(97 + (i % 26));
}

export type NumberFormatMode = "short" | "scientific" | "engineering" | "full";

export function formatDec(d: Dec, mode: NumberFormatMode = "short"): string {
  const n = normalize(d);
  if (n.m === 0) return "0";
  if (n.m < 0) return "-" + formatDec({ m: -n.m, e: n.e }, mode);
  const m = n.m;
  const e = n.e;

  if (e < 3) {
    const val = m * 10 ** e + 1e-9;
    if (val < 1000) {
      if (val < 10 && val % 1 > 0.05) return (Math.floor(val * 10) / 10).toFixed(1);
      return Math.floor(val).toString();
    }
  }

  if (mode === "scientific") return `${m.toFixed(2)}e${e}`;
  if (mode === "engineering") {
    const g = Math.floor(e / 3) * 3;
    return `${(m * 10 ** (e - g)).toFixed(2)}e${g}`;
  }
  if (mode === "full" && e < 15) {
    return Math.floor(m * 10 ** e).toLocaleString("en-US");
  }

  const group = Math.floor(e / 3);
  const suf = suffixFor(group);
  if (suf !== null) {
    const shown = m * 10 ** (e % 3);
    const digits = shown >= 100 ? 0 : shown >= 10 ? 1 : 2;
    return `${shown.toFixed(digits)}${suf}`;
  }
  return `${m.toFixed(2)}e${e}`;
}

export function formatInt(n: number): string {
  return Math.floor(n).toLocaleString("en-US");
}
