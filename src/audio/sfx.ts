/* Tiny synthesized sound effects with the Web Audio API — no audio files needed. */

type Tone = { f: number; to?: number; d: number; type?: OscillatorType; v?: number; delay?: number };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.5;
let lastHit = 0;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    try {
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = volume * 0.35;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

export function configureSound(on: boolean, vol: number) {
  enabled = on;
  volume = vol;
  if (master) master.gain.value = vol * 0.35;
}

/** Call from a user gesture so browsers allow audio. */
export function unlockAudio() {
  if (enabled) ac();
}

function play(tones: Tone[]) {
  if (!enabled || volume <= 0) return;
  const c = ac();
  if (!c || !master) return;
  const t0 = c.currentTime;
  for (const t of tones) {
    const o = c.createOscillator();
    const g = c.createGain();
    const start = t0 + (t.delay ?? 0);
    o.type = t.type ?? "triangle";
    o.frequency.setValueAtTime(t.f, start);
    if (t.to) o.frequency.exponentialRampToValueAtTime(t.to, start + t.d);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(t.v ?? 0.5, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + t.d);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + t.d + 0.02);
  }
}

function noise(d: number, v = 0.3, hp = 800) {
  if (!enabled || volume <= 0) return;
  const c = ac();
  if (!c || !master) return;
  const len = Math.floor(c.sampleRate * d);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = v;
  src.connect(f).connect(g).connect(master);
  src.start();
}

export const sfx = {
  hit(crit: boolean, auto: boolean) {
    const now = performance.now();
    if (now - lastHit < (auto ? 70 : 25)) return;
    lastHit = now;
    if (crit) {
      noise(0.09, 0.45, 1200);
      play([{ f: 880, to: 1320, d: 0.12, type: "square", v: 0.18 }]);
    } else {
      noise(0.05, auto ? 0.12 : 0.25, 1500);
      play([{ f: 220 + Math.random() * 60, to: 120, d: 0.06, type: "sine", v: auto ? 0.15 : 0.3 }]);
    }
  },
  kill(kind: "normal" | "boss" | "chest") {
    if (kind === "boss") {
      play([
        { f: 392, d: 0.18, v: 0.35 }, { f: 523, d: 0.18, v: 0.35, delay: 0.12 },
        { f: 659, d: 0.18, v: 0.35, delay: 0.24 }, { f: 784, d: 0.45, v: 0.4, delay: 0.36 },
      ]);
    } else if (kind === "chest") {
      play([1047, 1319, 1568, 2093].map((f, i) => ({ f, d: 0.14, v: 0.25, delay: i * 0.06, type: "square" as const })));
    } else {
      play([{ f: 1318, d: 0.07, v: 0.18, type: "square" }, { f: 1760, d: 0.12, v: 0.18, type: "square", delay: 0.05 }]);
    }
  },
  coin() {
    play([{ f: 1568, d: 0.06, v: 0.12, type: "square" }, { f: 2093, d: 0.1, v: 0.12, type: "square", delay: 0.04 }]);
  },
  buy() {
    play([{ f: 660, to: 990, d: 0.09, v: 0.25 }]);
  },
  levelUp() {
    play([{ f: 523, d: 0.08, v: 0.22 }, { f: 784, d: 0.12, v: 0.22, delay: 0.05 }]);
  },
  boss(primal: boolean) {
    play([{ f: primal ? 90 : 110, to: primal ? 55 : 70, d: 0.8, type: "sawtooth", v: 0.25 }, { f: primal ? 135 : 165, to: 90, d: 0.8, type: "sawtooth", v: 0.15 }]);
  },
  fail() {
    play([{ f: 330, to: 110, d: 0.5, type: "sawtooth", v: 0.25 }]);
  },
  skill() {
    play([{ f: 440, to: 1760, d: 0.3, type: "sine", v: 0.3 }, { f: 660, to: 2640, d: 0.3, type: "sine", v: 0.15, delay: 0.04 }]);
  },
  achievement() {
    play([784, 988, 1175, 1568].map((f, i) => ({ f, d: 0.16, v: 0.22, delay: i * 0.08 })));
  },
  essence() {
    play([{ f: 220, to: 880, d: 0.6, type: "sine", v: 0.3 }, { f: 330, to: 1320, d: 0.6, type: "sine", v: 0.2, delay: 0.1 }]);
  },
  ascend() {
    play([262, 330, 392, 523, 659, 784, 1047].map((f, i) => ({ f, d: 0.5, v: 0.22, delay: i * 0.09, type: "sine" as const })));
  },
  click() {
    play([{ f: 1200, d: 0.03, v: 0.12, type: "square" }]);
  },
};
