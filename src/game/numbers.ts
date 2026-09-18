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
  if (!isFinite(d.m) || d.m === 0) return { m: 0, e: 0 };
  let { m, e } = d;
  const sign = m < 0 ? -1 : 1;
  m = Math.abs(m);
  if (m >= 10 || m < 1) {
    const shift = Math.floor(Math.log10(m));
    m = m / 10 ** shift;
    e += shift;
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
  if (a.e >= b.e) {
    return normalize({ m: a.m + b.m * 10 ** (b.e - a.e), e: a.e });
  }
  return normalize({ m: b.m + a.m * 10 ** (a.e - b.e), e: b.e });
}

export function sub(a: Dec, b: Dec): Dec {
  return add(a, { m: -b.m, e: b.e });
}

export function mul(a: Dec, b: Dec): Dec {
  if (a.m === 0 || b.m === 0) return ZERO;
  return normalize({ m: a.m * b.m, e: a.e + b.e });
}

export function div(a: Dec, b: Dec): Dec {
  if (b.m === 0) return { m: a.m < 0 ? -Infinity : Infinity, e: 0 };
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

/** Correct comparison including negatives. */
export function cmp(a: Dec, b: Dec): number {
  const an = normalize(a);
  const bn = normalize(b);
  if (an.m === 0 && bn.m === 0) return 0;
  if (an.m < 0 && bn.m >= 0) return -1;
  if (an.m >= 0 && bn.m < 0) return 1;
  const sameSign = an.m >= 0 ? 1 : -1;
  if (an.e !== bn.e) {
    const expCmp = an.e > bn.e ? 1 : -1;
    return sameSign * expCmp;
  }
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

export function clone(d: Dec): Dec {
  return { m: d.m, e: d.e };
}

const SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
  "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg",
];

export type NumberFormatMode = "short" | "scientific" | "full";

export function formatDec(d: Dec, mode: NumberFormatMode = "short"): string {
  const n = normalize(d);
  if (n.m === 0 || n.m < 0) return "0";
  const m = Math.abs(n.m);
  const e = n.e;

  if (mode === "scientific") {
    return `${m.toFixed(2)}e${e}`;
  }

  if (mode === "full" && e < 15) {
    const val = m * 10 ** e;
    return Math.floor(val).toLocaleString("en-US");
  }

  if (e < 3) {
    const val = m * 10 ** e;
    if (val < 1000) {
      return val < 10 && val % 1 !== 0 ? val.toFixed(1) : Math.floor(val).toString();
    }
  }

  const group = Math.floor(e / 3);
  if (group < SUFFIXES.length) {
    const rem = e % 3;
    const shown = m * 10 ** rem;
    const digits = shown >= 100 ? 0 : shown >= 10 ? 1 : 2;
    return `${shown.toFixed(digits)}${SUFFIXES[group]}`;
  }

  return `${m.toFixed(2)}e${e}`;
}
