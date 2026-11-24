import { FRAG, VERT } from "./shader";

export type Vec3 = [number, number, number];

export interface SceneParams {
  variant: number;
  body: Vec3;
  body2: Vec3;
  glow: Vec3;
  accent: Vec3;
  hit: number;
  spawn: number;
  boss: boolean;
  primal: boolean;
  yaw: number;
  camDist: number;
  camY: number;
  targetY: number;
  style: number;
  seed: number;
}

const UNIFORMS = [
  "uRes", "uTime", "uVariant", "uBody", "uBody2", "uGlow", "uAccent", "uHit", "uSpawn", "uBoss",
  "uPrimal", "uYaw", "uCamDist", "uCamY", "uTargetY", "uStyle", "uSeed",
] as const;

export class Renderer3D {
  readonly gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private loc: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;

  static create(canvas: HTMLCanvasElement, preserve = false): Renderer3D | null {
    try {
      const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, preserveDrawingBuffer: preserve, powerPreference: "high-performance" });
      if (!gl) return null;
      return new Renderer3D(gl);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader error");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link error");
    this.prog = prog;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.loc = Object.fromEntries(UNIFORMS.map((u) => [u, gl.getUniformLocation(prog, u)])) as Renderer3D["loc"];
  }

  render(p: SceneParams, time: number) {
    const gl = this.gl;
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const l = this.loc;
    gl.uniform2f(l.uRes, w, h);
    gl.uniform1f(l.uTime, time);
    gl.uniform1f(l.uVariant, p.variant);
    gl.uniform3fv(l.uBody, p.body);
    gl.uniform3fv(l.uBody2, p.body2);
    gl.uniform3fv(l.uGlow, p.glow);
    gl.uniform3fv(l.uAccent, p.accent);
    gl.uniform1f(l.uHit, p.hit);
    gl.uniform1f(l.uSpawn, p.spawn);
    gl.uniform1f(l.uBoss, p.boss ? 1 : 0);
    gl.uniform1f(l.uPrimal, p.primal ? 1 : 0);
    gl.uniform1f(l.uYaw, p.yaw);
    gl.uniform1f(l.uCamDist, p.camDist);
    gl.uniform1f(l.uCamY, p.camY);
    gl.uniform1f(l.uTargetY, p.targetY);
    gl.uniform1f(l.uStyle, p.style);
    gl.uniform1f(l.uSeed, p.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.gl.deleteProgram(this.prog);
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/** HSL (deg, 0-100, 0-100) → linear-ish RGB triple for the shader. */
export function hsl(h: number, s: number, l: number): Vec3 {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  // approximate sRGB → linear so lighting math stays sane
  return [f(0) ** 2.2, f(8) ** 2.2, f(4) ** 2.2];
}
