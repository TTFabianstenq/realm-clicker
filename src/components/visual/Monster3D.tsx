import { useEffect, useRef, useState } from "react";
import type { MonsterKind } from "../../game/types";
import { Renderer3D } from "../../render/Renderer3D";
import { monsterParams } from "../../render/palette";
import { MonsterArt } from "./MonsterArt";

type Props = { zone: number; seed: number; kind: MonsterKind; primal: boolean; hitKey: number; reducedMotion: boolean };

/** Real-time 3D monster. Keeps one WebGL context alive and swaps creatures via uniforms. Falls back to SVG. */
export function Monster3D(props: Props) {
  const { zone, seed, kind, primal, hitKey, reducedMotion } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const state = useRef({ params: monsterParams(zone, seed, kind, primal), spawnAt: performance.now(), hitAt: -1e9, reduced: reducedMotion });

  useEffect(() => {
    state.current.params = monsterParams(zone, seed, kind, primal);
    state.current.spawnAt = performance.now();
  }, [zone, seed, kind, primal]);
  useEffect(() => {
    if (hitKey > 0) state.current.hitAt = performance.now();
  }, [hitKey]);
  useEffect(() => {
    state.current.reduced = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const cv = canvas.current;
    const box = wrap.current;
    if (!cv || !box) return;
    let r: Renderer3D | null = null;
    try {
      r = Renderer3D.create(cv);
    } catch (e) {
      console.warn("3D renderer unavailable", e);
    }
    if (!r) { setFallback(true); return; }
    const renderer = r;
    let quality = 1;
    let raf = 0;
    let last = performance.now();
    let avg = 16;
    let cssW = 0, cssH = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = Math.max(1, Math.floor(cssW * dpr * quality));
      const h = Math.max(1, Math.floor(cssH * dpr * quality));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    };
    const ro = new ResizeObserver((ents) => {
      const e = ents[0].contentRect;
      cssW = e.width; cssH = e.height;
      resize();
    });
    ro.observe(box);
    const lost = (ev: Event) => { ev.preventDefault(); setFallback(true); };
    cv.addEventListener("webglcontextlost", lost);
    const t0 = performance.now();
    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      if (dt < 200) avg = avg * 0.92 + dt * 0.08;
      // adaptive resolution: keep the frame rate smooth on slow devices
      if (avg > 24 && quality > 0.55) { quality = Math.max(0.55, quality - 0.08); avg = 16; resize(); }
      else if (avg < 15 && quality < 1) { quality = Math.min(1, quality + 0.04); avg = 16; resize(); }
      const st = state.current;
      const spawnT = Math.min(1, (now - st.spawnAt) / 320);
      const spawn = st.reduced ? 1 : 1 - Math.pow(1 - spawnT, 3) * Math.cos(spawnT * 6);
      const hitT = (now - st.hitAt) / 180;
      const hit = st.reduced || hitT > 1 ? 0 : Math.sin(Math.min(1, hitT) * Math.PI);
      const time = st.reduced ? 1.5 : (now - t0) / 1000;
      if (cv.width > 1) renderer.render({ ...st.params, spawn: Math.max(0.05, spawn), hit }, time);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("webglcontextlost", lost);
      renderer.dispose();
    };
  }, []);

  if (fallback) {
    return (
      <div className="h-full w-full max-w-[300px] mx-auto">
        <MonsterArt zone={zone} seed={seed} kind={kind} primal={primal} />
      </div>
    );
  }
  return (
    <div ref={wrap} className="absolute inset-0">
      <canvas ref={canvas} className="w-full h-full block" aria-hidden />
    </div>
  );
}
