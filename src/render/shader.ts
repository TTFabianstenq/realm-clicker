/* Raymarched signed-distance-field creatures. One shader draws every monster,
 * the treasure chest and the hero busts — smooth organic 3D shapes with soft
 * shadows, ambient occlusion, rim light and subsurface-style glow. */

export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform float uVariant;
uniform vec3 uBody;
uniform vec3 uBody2;
uniform vec3 uGlow;
uniform vec3 uAccent;
uniform float uHit;
uniform float uSpawn;
uniform float uBoss;
uniform float uPrimal;
uniform float uYaw;
uniform float uCamDist;
uniform float uCamY;
uniform float uTargetY;
uniform float uStyle;
uniform float uSeed;

#define MAX_STEPS 90
#define FAR 12.0

// materials
#define M_BODY 1.0
#define M_BODY2 2.0
#define M_EYEW 3.0
#define M_DARK 4.0
#define M_GLOW 5.0
#define M_BONE 6.0
#define M_STEEL 7.0
#define M_GOLD 8.0
#define M_WOOD 9.0
#define M_SLIME 10.0
#define M_SPOT 11.0
#define M_IRIS 12.0
#define M_MEMB 13.0
#define M_SKIN 14.0
#define M_HAIR 15.0
#define M_ROCK 16.0
#define M_CLOTH 17.0
#define M_GHOST 18.0

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { return 0.5 * noise(p) + 0.25 * noise(p * 2.03) + 0.125 * noise(p * 4.01); }

float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdEll(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdCap(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float sdCone(vec3 p, vec3 a, vec3 b, float r1, float r2) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - mix(r1, r2, h); }
float sdBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCylX(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.yz), p.x)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdCylZ(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

vec2 U(vec2 a, vec2 b) { return a.x < b.x ? a : b; }

float T;
float V;

// ----------------------------------------------------------------- creatures
vec2 slime(vec3 p) {
  vec3 q = p;
  q.x += sin(q.y * 3.0 + T * 3.0) * 0.04;
  float wob = sin(T * 2.4) * 0.05;
  float d = sdEll(q - vec3(0.0, -0.35, 0.0), vec3(1.05 + wob, 0.8 - wob, 1.0 + wob));
  d = smin(d, sdSphere(q - vec3(0.15, 0.38 - wob, -0.05), 0.42), 0.35);
  d = smax(d, -(q.y + 1.0), 0.08);
  vec2 r = vec2(d, M_SLIME);
  vec3 sx = vec3(abs(q.x), q.y, q.z);
  r = U(r, vec2(sdSphere(sx - vec3(0.33, -0.05, 0.8), 0.17), M_EYEW));
  r = U(r, vec2(sdSphere(sx - vec3(0.34, -0.03, 0.94), 0.075), M_DARK));
  r = U(r, vec2(sdCap(q, vec3(-0.2, -0.42, 0.93), vec3(0.2, -0.42, 0.93), 0.035), M_DARK));
  return r;
}

vec2 beast(vec3 p) {
  vec3 s = vec3(abs(p.x), p.y, p.z);
  float br = sin(T * 2.2) * 0.02;
  float d = sdEll(p - vec3(0.0, -0.12, -0.35), vec3(0.72, 0.6 + br, 0.95));
  d = smin(d, sdSphere(p - vec3(0.0, -0.02, 0.25), 0.6 + br), 0.3);
  vec3 hp = p - vec3(0.0, 0.48, 0.58);
  hp.yz = rot(sin(T * 1.3) * 0.06) * hp.yz;
  float head = sdSphere(hp, 0.44);
  head = smin(head, sdEll(hp - vec3(0.0, -0.13, 0.42), vec3(0.24, 0.19, 0.32)), 0.15);
  d = smin(d, head, 0.18);
  vec3 hs = vec3(abs(hp.x), hp.y, hp.z);
  // legs
  d = smin(d, sdCone(s, vec3(0.38, -0.2, 0.35), vec3(0.42, -0.98, 0.45), 0.17, 0.12), 0.12);
  d = smin(d, sdCone(s, vec3(0.42, -0.3, -0.75), vec3(0.45, -0.98, -0.68), 0.22, 0.12), 0.15);
  d = smin(d, sdCone(p, vec3(0.0, 0.0, -1.15), vec3(0.0, 0.55 + sin(T * 3.0) * 0.08, -1.55), 0.1, 0.03), 0.1);
  d -= 0.025 * noise(p * 9.0);
  vec2 r = vec2(d, M_BODY);
  r = U(r, vec2(sdCone(hs, vec3(0.26, 0.28, -0.08), vec3(0.5, 0.78, -0.3), 0.1, 0.015), M_BONE));
  r = U(r, vec2(sdSphere(hs - vec3(0.19, 0.07, 0.36), 0.075), M_GLOW));
  r = U(r, vec2(sdSphere(hp - vec3(0.0, -0.08, 0.74), 0.07), M_DARK));
  r = U(r, vec2(sdCone(hs, vec3(0.1, -0.25, 0.62), vec3(0.1, -0.4, 0.64), 0.035, 0.005), M_BONE));
  vec3 fs = vec3(s.x, s.y, s.z);
  r = U(r, vec2(sdEll(fs - vec3(0.42, -0.97, 0.5), vec3(0.15, 0.07, 0.18)), M_BODY2));
  return r;
}

vec2 golem(vec3 p) {
  vec3 s = vec3(abs(p.x), p.y, p.z);
  float n = fbm(p * 2.5);
  float d = sdBox(p - vec3(0.0, -0.05, 0.0), vec3(0.62, 0.55, 0.42), 0.22);
  d = smin(d, sdBox(p - vec3(0.0, 0.72, 0.08), vec3(0.3, 0.26, 0.28), 0.12), 0.1);
  d = smin(d, sdSphere(s - vec3(0.78, 0.35, 0.0), 0.36), 0.15);
  float sw = sin(T * 1.5) * 0.06;
  d = smin(d, sdCone(s, vec3(0.85, 0.3, 0.0), vec3(0.95, -0.5, 0.18 + sw), 0.26, 0.3), 0.12);
  d = smin(d, sdSphere(s - vec3(0.97, -0.68, 0.22 + sw), 0.32), 0.1);
  d = smin(d, sdBox(s - vec3(0.32, -0.8, 0.0), vec3(0.22, 0.24, 0.24), 0.08), 0.08);
  d += (n - 0.5) * 0.16;
  vec2 r = vec2(d * 0.8, M_ROCK);
  r = U(r, vec2(sdSphere(s - vec3(0.13, 0.76, 0.37), 0.075), M_GLOW));
  // moss / crystals on shoulders
  r = U(r, vec2(sdCone(s, vec3(0.8, 0.55, -0.1), vec3(0.95, 1.05, -0.2), 0.12, 0.0), M_BODY2));
  r = U(r, vec2(sdCone(s, vec3(0.62, 0.62, 0.05), vec3(0.66, 0.95, 0.05), 0.08, 0.0), M_BODY2));
  return r;
}

vec2 spider(vec3 p) {
  float d = sdEll(p - vec3(0.0, 0.08, -0.6), vec3(0.75, 0.62, 0.85));
  d = smin(d, sdSphere(p - vec3(0.0, -0.05, 0.32), 0.44), 0.18);
  d = smin(d, sdSphere(p - vec3(0.0, 0.03, 0.72), 0.3), 0.12);
  d -= 0.015 * noise(p * 14.0);
  vec2 r = vec2(d, M_BODY);
  float sx = sign(p.x);
  vec3 s = vec3(abs(p.x), p.y, p.z);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float z = 0.55 - fi * 0.28;
    float lift = sin(T * 4.0 + fi * 1.7 + sx) * 0.06;
    vec3 hip = vec3(0.3, -0.02, z);
    vec3 knee = vec3(0.95 + fi * 0.08, 0.6 + lift, z + (fi - 1.5) * 0.35 + 0.1);
    vec3 foot = vec3(1.45 + fi * 0.06, -1.0, z + (fi - 1.5) * 0.75 + 0.1);
    float leg = min(sdCone(s, hip, knee, 0.08, 0.06), sdCone(s, knee, foot, 0.06, 0.025));
    r = U(r, vec2(leg, M_BODY2));
  }
  r = U(r, vec2(sdSphere(s - vec3(0.09, 0.2, 0.97), 0.075), M_DARK));
  r = U(r, vec2(sdSphere(s - vec3(0.21, 0.13, 0.9), 0.058), M_DARK));
  r = U(r, vec2(sdSphere(s - vec3(0.12, 0.33, 0.88), 0.045), M_GLOW));
  r = U(r, vec2(sdCone(s, vec3(0.09, -0.08, 0.95), vec3(0.06, -0.33, 1.02), 0.05, 0.01), M_BONE));
  return r;
}

vec2 drake(vec3 p) {
  vec3 s = vec3(abs(p.x), p.y, p.z);
  float d = sdEll(p - vec3(0.0, -0.32, 0.0), vec3(0.6, 0.68, 0.6));
  d = smin(d, sdSphere(s - vec3(0.42, -0.72, -0.12), 0.34), 0.2);
  d = smin(d, sdCap(p, vec3(0.0, 0.15, 0.1), vec3(0.0, 0.68, 0.32), 0.24), 0.18);
  vec3 hp = p - vec3(0.0, 0.86, 0.48);
  hp.xz = rot(sin(T * 0.9) * 0.15) * hp.xz;
  float head = sdEll(hp, vec3(0.3, 0.26, 0.36));
  head = smin(head, sdEll(hp - vec3(0.0, -0.08, 0.35), vec3(0.2, 0.14, 0.26)), 0.12);
  d = smin(d, head, 0.12);
  d = smin(d, sdCone(s, vec3(0.3, -0.5, 0.35), vec3(0.33, -0.98, 0.52), 0.13, 0.1), 0.1);
  d = smin(d, sdCone(p, vec3(0.0, -0.85, -0.45), vec3(0.55, -0.95, -0.95), 0.2, 0.12), 0.15);
  d = smin(d, sdCone(p, vec3(0.55, -0.95, -0.95), vec3(1.15, -0.85, -0.7), 0.12, 0.03), 0.1);
  d -= 0.012 * noise(p * 18.0);
  vec2 r = vec2(d, M_BODY);
  r = U(r, vec2(sdEll(p - vec3(0.0, -0.3, 0.3), vec3(0.42, 0.55, 0.36)), M_BODY2));
  vec3 hs = vec3(abs(hp.x), hp.y, hp.z);
  r = U(r, vec2(sdCone(hs, vec3(0.14, 0.15, -0.1), vec3(0.28, 0.5, -0.4), 0.07, 0.01), M_BONE));
  r = U(r, vec2(sdSphere(hs - vec3(0.15, 0.06, 0.24), 0.055), M_GLOW));
  // wings: bony leading edge, finger bones and a scalloped membrane
  float flap = sin(T * 2.6) * 0.2;
  vec3 wp = s - vec3(0.38, 0.3, -0.25);
  wp.xy = rot(-0.85 - flap) * wp.xy;
  wp.xz = rot(0.45) * wp.xz;
  float wing = sdEll(wp - vec3(0.72, 0.12, 0.0), vec3(0.78, 0.42, 0.025));
  wing = smax(wing, -sdEll(wp - vec3(0.32, -0.42, 0.0), vec3(0.26, 0.26, 0.3)), 0.03);
  wing = smax(wing, -sdEll(wp - vec3(0.86, -0.44, 0.0), vec3(0.26, 0.28, 0.3)), 0.03);
  wing = smax(wing, -sdEll(wp - vec3(1.38, -0.3, 0.0), vec3(0.24, 0.26, 0.3)), 0.03);
  r = U(r, vec2(wing, M_MEMB));
  float bone = min(sdCone(wp, vec3(0.0, 0.1, 0.0), vec3(0.62, 0.52, 0.0), 0.07, 0.045), sdCone(wp, vec3(0.62, 0.52, 0.0), vec3(1.5, 0.22, 0.0), 0.045, 0.012));
  bone = min(bone, sdCone(wp, vec3(0.62, 0.52, 0.0), vec3(0.58, -0.18, 0.0), 0.03, 0.01));
  bone = min(bone, sdCone(wp, vec3(0.62, 0.52, 0.0), vec3(1.12, -0.2, 0.0), 0.03, 0.01));
  r = U(r, vec2(bone, M_BODY));
  return r;
}

vec2 shade(vec3 p) {
  vec3 q = p;
  q.x += sin(q.y * 2.0 + T * 1.7) * 0.06;
  float a = atan(q.z, q.x);
  float d = sdCone(q, vec3(0.0, -0.95, 0.0), vec3(0.0, 0.45, 0.0), 0.72, 0.42);
  d = smin(d, sdSphere(q - vec3(0.0, 0.55, 0.0), 0.5), 0.2);
  d = smax(d, -(q.y + 0.88 + 0.13 * sin(a * 7.0 + T * 3.0)), 0.05);
  float hood = sdSphere(q - vec3(0.0, 0.5, 0.42), 0.34);
  d = smax(d, -hood, 0.06);
  vec3 s = vec3(abs(q.x), q.y, q.z);
  float sw = sin(T * 2.0) * 0.1;
  d = smin(d, sdCone(s, vec3(0.45, 0.2, 0.05), vec3(0.95, -0.15 + sw, 0.55), 0.14, 0.04), 0.12);
  vec2 r = vec2(d, M_GHOST);
  r = U(r, vec2(sdSphere(s - vec3(0.13, 0.52, 0.32), 0.065), M_GLOW));
  return r;
}

vec2 shroom(vec3 p) {
  vec3 q = p;
  q.xz = rot(sin(T * 1.2) * 0.05) * q.xz;
  float sq = sin(T * 2.4) * 0.03;
  float stem = sdCone(q, vec3(0.0, -1.0, 0.0), vec3(0.0, 0.15, 0.0), 0.5, 0.36);
  vec2 r = vec2(stem, M_BODY2);
  float cap = sdEll(q - vec3(0.0, 0.38 + sq, 0.0), vec3(1.08, 0.6, 1.08));
  cap = smax(cap, -sdEll(q - vec3(0.0, 0.08 + sq, 0.0), vec3(0.98, 0.36, 0.98)), 0.06);
  r = U(r, vec2(cap - 0.02 * noise(q * 6.0), M_BODY));
  vec3 s = vec3(abs(q.x), q.y, q.z);
  r = U(r, vec2(sdEll(s - vec3(0.15, -0.25, 0.42), vec3(0.085, 0.12, 0.05)), M_DARK));
  r = U(r, vec2(sdSphere(s - vec3(0.13, -0.21, 0.465), 0.025), M_EYEW));
  r = U(r, vec2(sdEll(q - vec3(0.0, -0.5, 0.44), vec3(0.09, 0.05, 0.03)), M_DARK));
  return r;
}

vec2 eyeBeast(vec3 p) {
  float d = sdSphere(p - vec3(0.0, 0.05, 0.0), 0.86);
  d -= 0.04 * noise(p * 7.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float ang = (fi - 2.0) * 0.55;
    vec3 a = vec3(sin(ang) * 0.55, 0.65, -0.2 + cos(ang) * 0.1);
    vec3 b = a + vec3(sin(ang) * 0.4, 0.45, -0.15) + vec3(sin(T * 2.0 + fi) * 0.12, 0.0, cos(T * 1.7 + fi) * 0.1);
    vec3 c = b + vec3(sin(ang) * 0.25 + sin(T * 2.5 + fi * 2.0) * 0.15, 0.3, 0.05);
    d = smin(d, min(sdCone(p, a, b, 0.11, 0.07), sdCone(p, b, c, 0.07, 0.025)), 0.08);
  }
  vec2 r = vec2(d, M_BODY);
  vec2 look = vec2(sin(T * 0.7) * 0.12, sin(T * 0.53) * 0.08);
  r = U(r, vec2(sdSphere(p - vec3(0.0, 0.12, 0.42), 0.55), M_EYEW));
  r = U(r, vec2(sdTorus((p - vec3(0.0, 0.12, 0.42)).xzy, vec2(0.52, 0.08)), M_BODY));
  vec3 ip = p - vec3(look.x, 0.12 + look.y, 0.42);
  r = U(r, vec2(max(sdSphere(ip, 0.56), sdSphere(ip - vec3(0.0, 0.0, 0.42), 0.26)), M_IRIS));
  r = U(r, vec2(max(sdSphere(ip, 0.565), sdSphere(ip - vec3(0.0, 0.0, 0.5), 0.13)), M_DARK));
  vec3 s = vec3(abs(p.x), p.y, p.z);
  r = U(r, vec2(sdEll(p - vec3(0.0, -0.5, 0.62), vec3(0.32, 0.1, 0.12)), M_DARK));
  r = U(r, vec2(sdCone(s, vec3(0.1, -0.42, 0.7), vec3(0.1, -0.53, 0.72), 0.04, 0.005), M_BONE));
  r = U(r, vec2(sdCone(s, vec3(0.24, -0.43, 0.64), vec3(0.24, -0.53, 0.66), 0.035, 0.005), M_BONE));
  return r;
}

vec2 wisp(vec3 p) {
  float bob = sin(T * 2.0) * 0.1;
  vec3 q = p - vec3(0.0, bob, 0.0);
  float core = sdSphere(q, 0.52);
  vec3 f = q;
  f.x += sin(f.y * 4.0 - T * 6.0) * 0.08 * clamp(f.y, 0.0, 2.0);
  float flame = sdCone(f, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.35, -0.1), 0.62, 0.02);
  flame += 0.06 * noise(f * 5.0 + vec3(0.0, -T * 3.0, 0.0));
  vec2 r = vec2(smin(core, flame, 0.2), M_GLOW);
  vec3 s = vec3(abs(q.x), q.y, q.z);
  r = U(r, vec2(sdEll(s - vec3(0.17, 0.05, 0.47), vec3(0.07, 0.1, 0.05)), M_DARK));
  // orbiting sparks
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec3 c = vec3(cos(T * 1.5 + fi * 2.1) * 0.95, -0.3 + fi * 0.35, sin(T * 1.5 + fi * 2.1) * 0.95);
    r = U(r, vec2(sdSphere(q - c, 0.07), M_GLOW));
  }
  return r;
}

vec2 knight(vec3 p) {
  vec3 s = vec3(abs(p.x), p.y, p.z);
  float br = sin(T * 2.0) * 0.015;
  vec2 r = vec2(sdBox(p - vec3(0.0, -0.02, 0.0), vec3(0.42, 0.5 + br, 0.27), 0.17), M_STEEL);
  r = U(r, vec2(sdEll(s - vec3(0.52, 0.42, 0.0), vec3(0.3, 0.2, 0.3)), M_STEEL));
  vec3 hp = p - vec3(0.0, 0.86 + br, 0.02);
  float helm = sdEll(hp, vec3(0.27, 0.33, 0.3));
  helm = smax(helm, -sdBox(hp - vec3(0.0, 0.0, 0.3), vec3(0.2, 0.03, 0.08), 0.01), 0.01);
  r = U(r, vec2(helm, M_STEEL));
  r = U(r, vec2(sdSphere(vec3(abs(hp.x), hp.y, hp.z) - vec3(0.08, 0.0, 0.2), 0.045), M_GLOW));
  r = U(r, vec2(sdCone(hp, vec3(0.0, 0.3, -0.05), vec3(0.0, 0.42, -0.45 + sin(T * 3.0) * 0.03), 0.07, 0.04), M_CLOTH));
  r = U(r, vec2(sdCone(s, vec3(0.6, 0.35, 0.0), vec3(0.68, -0.32, 0.22), 0.14, 0.12), M_STEEL));
  r = U(r, vec2(sdCone(s, vec3(0.2, -0.45, 0.0), vec3(0.22, -0.98, 0.06), 0.17, 0.14), M_STEEL));
  r = U(r, vec2(sdBox(p - vec3(0.0, -0.35, 0.0), vec3(0.45, 0.06, 0.3), 0.03), M_GOLD));
  vec3 cp = p - vec3(0.0, -0.1, -0.33);
  cp.z += sin(cp.y * 3.0 + T * 2.0) * 0.04 * (0.5 - cp.y);
  r = U(r, vec2(sdBox(cp, vec3(0.48, 0.7, 0.025), 0.02), M_CLOTH));
  // sword planted in the ground
  vec3 sp = p - vec3(0.78, -0.3, 0.45);
  r = U(r, vec2(sdBox(sp - vec3(0.0, -0.25, 0.0), vec3(0.055, 0.55, 0.012), 0.008), M_STEEL));
  r = U(r, vec2(sdBox(sp - vec3(0.0, 0.32, 0.0), vec3(0.18, 0.03, 0.04), 0.015), M_GOLD));
  r = U(r, vec2(sdCap(sp, vec3(0.0, 0.32, 0.0), vec3(0.0, 0.55, 0.0), 0.035), M_CLOTH));
  r = U(r, vec2(sdSphere(sp - vec3(0.0, 0.59, 0.0), 0.05), M_GOLD));
  // shield
  vec3 sh = p - vec3(-0.72, -0.08, 0.3);
  sh.xz = rot(0.5) * sh.xz;
  r = U(r, vec2(sdCylZ(sh, 0.38, 0.035) - 0.02, M_CLOTH));
  r = U(r, vec2(sdTorus(sh.xzy, vec2(0.38, 0.035)), M_GOLD));
  r = U(r, vec2(sdSphere(sh - vec3(0.0, 0.0, 0.06), 0.09), M_GOLD));
  return r;
}

vec2 crab(vec3 p) {
  vec3 s = vec3(abs(p.x), p.y, p.z);
  float d = sdEll(p - vec3(0.0, -0.32, 0.0), vec3(1.0, 0.45, 0.75));
  d = smin(d, sdEll(p - vec3(0.0, -0.15, -0.05), vec3(0.6, 0.35, 0.5)), 0.2);
  d -= 0.03 * noise(p * 6.0);
  vec2 r = vec2(d, M_BODY);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float z = 0.25 - fi * 0.35;
    float lift = sin(T * 5.0 + fi * 2.0 + sign(p.x)) * 0.05;
    vec3 a = vec3(0.75, -0.38, z);
    vec3 b = vec3(1.3, -0.05 + lift, z * 1.2);
    vec3 c = vec3(1.55, -1.0, z * 1.4);
    r = U(r, vec2(min(sdCone(s, a, b, 0.09, 0.07), sdCone(s, b, c, 0.07, 0.02)), M_BODY2));
  }
  float snap = sin(T * 3.0) * 0.12;
  r = U(r, vec2(sdCone(s, vec3(0.7, -0.3, 0.45), vec3(1.05, 0.0, 0.75), 0.13, 0.15), M_BODY));
  vec3 cl = s - vec3(1.12, 0.12, 0.98);
  r = U(r, vec2(sdEll(cl, vec3(0.28, 0.17, 0.36)), M_BODY));
  vec3 jw = cl - vec3(0.02, -0.2 - snap, 0.05);
  r = U(r, vec2(sdEll(jw, vec3(0.2, 0.08, 0.28)), M_BODY2));
  r = U(r, vec2(sdCap(s, vec3(0.22, -0.12, 0.5), vec3(0.26, 0.35, 0.58), 0.045), M_BODY2));
  r = U(r, vec2(sdSphere(s - vec3(0.26, 0.4, 0.6), 0.11), M_EYEW));
  r = U(r, vec2(sdSphere(s - vec3(0.27, 0.42, 0.69), 0.05), M_DARK));
  r = U(r, vec2(sdEll(p - vec3(0.0, -0.4, 0.72), vec3(0.2, 0.05, 0.06)), M_DARK));
  return r;
}

vec2 chest(vec3 p) {
  float bounce = abs(sin(T * 2.2)) * 0.06;
  vec3 q = p - vec3(0.0, bounce, 0.0);
  vec2 r = vec2(sdBox(q - vec3(0.0, -0.58, 0.0), vec3(0.86, 0.42, 0.56), 0.05), M_WOOD);
  vec3 lq = q - vec3(0.0, -0.16, 0.0);
  float lid = max(sdCylX(lq, 0.56, 0.86), -lq.y);
  r = U(r, vec2(lid, M_WOOD));
  vec3 bq = vec3(abs(q.x), q.y, q.z);
  float bands = min(sdBox(bq - vec3(0.52, -0.58, 0.0), vec3(0.07, 0.44, 0.58), 0.02), max(sdCylX(bq - vec3(0.52, -0.16, 0.0), 0.585, 0.07), -(q.y + 0.16)));
  bands = min(bands, sdBox(q - vec3(0.0, -0.17, 0.0), vec3(0.88, 0.04, 0.58), 0.02));
  r = U(r, vec2(bands, M_GOLD));
  r = U(r, vec2(sdBox(q - vec3(0.0, -0.22, 0.58), vec3(0.13, 0.16, 0.04), 0.03), M_GOLD));
  r = U(r, vec2(sdCap(q, vec3(0.0, -0.22, 0.62), vec3(0.0, -0.3, 0.62), 0.025), M_DARK));
  return r;
}

vec2 bust(vec3 p) {
  vec3 s = vec3(abs(p.x), p.y, p.z);
  vec2 r = vec2(sdEll(p - vec3(0.0, -1.0, -0.02), vec3(0.95, 0.45, 0.5)), M_CLOTH);
  r = U(r, vec2(sdEll(s - vec3(0.56, -0.66, 0.0), vec3(0.32, 0.2, 0.34)), M_STEEL));
  r = U(r, vec2(sdCap(p, vec3(0.0, -0.65, 0.0), vec3(0.0, -0.2, 0.0), 0.16), M_SKIN));
  vec3 hp = p - vec3(0.0, 0.16, 0.0);
  float head = sdEll(hp, vec3(0.36, 0.44, 0.4));
  head = smin(head, sdEll(hp - vec3(0.0, -0.24, 0.1), vec3(0.25, 0.2, 0.27)), 0.14);
  head = smin(head, sdEll(hp - vec3(0.0, -0.06, 0.4), vec3(0.045, 0.07, 0.05)), 0.04);
  vec3 hs = vec3(abs(hp.x), hp.y, hp.z);
  head = smax(head, -sdSphere(hs - vec3(0.13, 0.04, 0.4), 0.06), 0.04);
  head = smin(head, sdSphere(hs - vec3(0.37, -0.02, -0.02), 0.07), 0.03);
  r = U(r, vec2(head, M_SKIN));
  r = U(r, vec2(sdSphere(hs - vec3(0.13, 0.04, 0.33), 0.06), M_EYEW));
  r = U(r, vec2(sdSphere(hs - vec3(0.13, 0.04, 0.38), 0.03), M_IRIS));
  r = U(r, vec2(sdCone(hs, vec3(0.06, 0.13, 0.37), vec3(0.21, 0.15, 0.33), 0.018, 0.012), M_HAIR));
  r = U(r, vec2(sdEll(hp - vec3(0.0, -0.22, 0.36), vec3(0.08, 0.018, 0.02)), M_DARK));
  float face = sdBox(hp - vec3(0.0, -0.2, 0.36), vec3(0.4, 0.33, 0.3), 0.1);
  float st = uStyle;
  if (st < 0.5) {
    float hair = sdEll(hp - vec3(0.0, 0.06, -0.03), vec3(0.4, 0.47, 0.44)) - 0.012 * sin(hp.x * 40.0 + hp.y * 12.0);
    hair = smax(hair, -face, 0.04);
    hair = smax(hair, -(hp.y + 0.1), 0.04);
    r = U(r, vec2(hair, M_HAIR));
  } else if (st < 1.5) {
    float hair = sdEll(hp - vec3(0.0, -0.05, -0.06), vec3(0.42, 0.6, 0.45)) - 0.01 * sin(hp.x * 36.0 + hp.y * 8.0);
    hair = smax(hair, -face, 0.04);
    r = U(r, vec2(hair, M_HAIR));
  } else if (st < 2.5) {
    float helm = sdEll(hp - vec3(0.0, 0.05, 0.0), vec3(0.43, 0.5, 0.46));
    helm = smax(helm, -sdBox(hp - vec3(0.0, -0.22, 0.38), vec3(0.3, 0.3, 0.3), 0.1), 0.02);
    helm = smax(helm, -(hp.y + 0.3), 0.03);
    r = U(r, vec2(helm, M_STEEL));
    r = U(r, vec2(sdBox(hp - vec3(0.0, 0.12, 0.43), vec3(0.035, 0.12, 0.04), 0.015), M_STEEL));
    r = U(r, vec2(sdCone(hp, vec3(0.0, 0.48, -0.05), vec3(0.0, 0.66, -0.42), 0.06, 0.025), M_CLOTH));
  } else {
    float hood = smax(sdEll(hp - vec3(0.0, 0.0, -0.05), vec3(0.5, 0.58, 0.52)), -sdEll(hp - vec3(0.0, -0.08, 0.34), vec3(0.33, 0.44, 0.38)), 0.04);
    r = U(r, vec2(hood, M_CLOTH));
    r = U(r, vec2(smax(sdEll(hp - vec3(0.0, 0.08, -0.02), vec3(0.38, 0.44, 0.42)), -face, 0.03), M_HAIR));
  }
  r = U(r, vec2(sdSphere(p - vec3(0.0, -0.66, 0.44), 0.08), M_GLOW));
  return r;
}

vec2 crown(vec3 p, vec3 at) {
  vec3 q = p - at;
  float d = sdTorus(q, vec2(0.3, 0.05));
  float a = atan(q.z, q.x);
  float sector = 6.2831853 / 5.0;
  float k = floor(a / sector + 0.5);
  vec3 cq = q;
  cq.xz = rot(-k * sector) * cq.xz;
  d = min(d, sdCone(cq, vec3(0.3, 0.0, 0.0), vec3(0.3, 0.28, 0.0), 0.075, 0.0));
  return vec2(d, uPrimal > 0.5 ? M_BONE : M_GOLD);
}

vec3 crownAt() {
  if (V < 0.5) return vec3(0.15, 0.8, -0.05);
  if (V < 1.5) return vec3(0.0, 1.0, 0.5);
  if (V < 2.5) return vec3(0.0, 1.05, 0.08);
  if (V < 3.5) return vec3(0.0, 0.62, -0.55);
  if (V < 4.5) return vec3(0.0, 1.1, 0.45);
  if (V < 5.5) return vec3(0.0, 1.05, 0.0);
  if (V < 6.5) return vec3(0.0, 1.08, 0.0);
  if (V < 7.5) return vec3(0.0, 0.95, -0.1);
  if (V < 8.5) return vec3(0.0, 0.7, 0.0);
  if (V < 9.5) return vec3(0.0, 1.22, 0.02);
  return vec3(0.0, 0.2, -0.05);
}

vec2 creature(vec3 p) {
  if (V < 0.5) return slime(p);
  if (V < 1.5) return beast(p);
  if (V < 2.5) return golem(p);
  if (V < 3.5) return spider(p);
  if (V < 4.5) return drake(p);
  if (V < 5.5) return shade(p);
  if (V < 6.5) return shroom(p);
  if (V < 7.5) return eyeBeast(p);
  if (V < 8.5) return wisp(p);
  if (V < 9.5) return knight(p);
  if (V < 10.5) return crab(p);
  if (V < 11.5) return chest(p);
  return bust(p);
}

vec2 map(vec3 p) {
  // spawn grow + hit squash, pivot at the feet
  float sc = mix(0.05, 1.0, uSpawn);
  vec3 q = p;
  q.y += 1.0;
  float h = uHit;
  vec3 k = vec3(1.0 + 0.12 * h, 1.0 - 0.16 * h, 1.0 + 0.12 * h) * sc;
  q /= k;
  q.y -= 1.0;
  q.xz = rot(uYaw) * q.xz;
  vec2 r = creature(q);
  if (uBoss > 0.5) r = U(r, crown(q, crownAt()));
  r.x *= min(k.x, min(k.y, k.z));
  return r;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.0015;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

float softShadow(vec3 ro, vec3 rd) {
  float res = 1.0;
  float t = 0.03;
  for (int i = 0; i < 28; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.03, 0.25);
    if (res < 0.01 || t > 4.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.02 + 0.12 * float(i);
    occ += (h - map(p + h * n).x) * sca;
    sca *= 0.8;
  }
  return clamp(1.0 - 2.2 * occ, 0.0, 1.0);
}

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

vec2 sphereHit(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd); float c = dot(ro, ro) - r * r; float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h); return vec2(-b - h, -b + h);
}

void main() {
  T = uTime;
  V = uVariant;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ta = vec3(0.0, uTargetY, 0.0);
  vec3 ro = vec3(0.0, uCamY, uCamDist);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 2.2 * ww);

  vec3 L = normalize(vec3(0.55, 0.9, 0.65));
  vec4 outc = vec4(0.0);
  float glowAcc = 0.0;

  vec2 bs = sphereHit(ro - vec3(0.0, 0.1, 0.0), rd, 2.45);
  float t = -1.0;
  float m = 0.0;
  if (bs.y > 0.0) {
    float tt = max(bs.x, 0.0);
    for (int i = 0; i < MAX_STEPS; i++) {
      vec2 h = map(ro + rd * tt);
      if (h.y == M_GLOW) glowAcc += 0.012 / (0.02 + h.x * h.x * 30.0);
      if (h.x < 0.001 * tt) { t = tt; m = h.y; break; }
      tt += h.x * 0.9;
      if (tt > bs.y) break;
    }
  }

  if (t > 0.0) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    vec3 alb = uBody;
    float rough = 0.55, spec = 0.25, sss = 0.0, emi = 0.0, metal = 0.0, alpha = 1.0;
    if (m == M_BODY) {
      alb = uBody; rough = 0.5; sss = 0.15;
      if (V > 5.5 && V < 6.5) { float sp = smoothstep(0.62, 0.66, noise(p * 3.3 + 1.7)); alb = mix(alb, vec3(0.95, 0.92, 0.85), sp * step(0.0, n.y + 0.2)); rough = 0.35; }
    }
    else if (m == M_BODY2) { alb = uBody2; rough = 0.55; sss = 0.15; }
    else if (m == M_EYEW) { alb = vec3(0.92, 0.9, 0.85); rough = 0.08; spec = 0.9; }
    else if (m == M_DARK) { alb = vec3(0.02, 0.015, 0.02); rough = 0.06; spec = 1.0; }
    else if (m == M_GLOW) { alb = uGlow; emi = 1.6; }
    else if (m == M_BONE) { alb = vec3(0.85, 0.8, 0.66); rough = 0.35; spec = 0.4; }
    else if (m == M_STEEL) { alb = vec3(0.62, 0.64, 0.7); rough = 0.22; metal = 1.0; spec = 1.0; }
    else if (m == M_GOLD) { alb = uPrimal > 0.5 && V < 11.5 ? vec3(0.75, 0.6, 1.0) : vec3(1.0, 0.74, 0.25); rough = 0.2; metal = 1.0; spec = 1.0; }
    else if (m == M_WOOD) {
      float g = fbm(vec3(p.x * 1.5, p.y * 14.0, p.z * 1.5));
      alb = mix(vec3(0.28, 0.14, 0.05), vec3(0.52, 0.29, 0.12), g);
      alb *= 0.75 + 0.25 * smoothstep(0.0, 0.03, abs(fract(p.y * 4.0 + 0.5) - 0.5));
      rough = 0.7;
    }
    else if (m == M_SLIME) { alb = uBody; rough = 0.05; spec = 1.2; sss = 0.8; alpha = 0.93; }
    else if (m == M_SPOT) { alb = vec3(0.95, 0.92, 0.85); rough = 0.6; }
    else if (m == M_IRIS) {
      vec3 ip = normalize(p - vec3(0.0, 0.12, 0.42));
      float ring = 0.5 + 0.5 * sin(atan(ip.y, ip.x) * 24.0);
      alb = (V > 11.5 ? uGlow * 0.6 : uAccent) * (0.6 + 0.4 * ring); rough = 0.05; spec = 1.0; emi = 0.25;
    }
    else if (m == M_MEMB) { alb = uBody2 * 0.8; rough = 0.6; sss = 0.9; }
    else if (m == M_SKIN) { alb = uAccent; rough = 0.45; sss = 0.45; }
    else if (m == M_HAIR) { alb = uBody2; rough = 0.6; spec = 0.4; }
    else if (m == M_ROCK) {
      float g = fbm(p * 4.0);
      vec3 stone = mix(vec3(0.33, 0.32, 0.3), uBody, 0.35);
      alb = mix(stone * 0.55, stone * 1.05, g);
      rough = 0.9; spec = 0.1;
      float vein = smoothstep(0.012, 0.0, abs(noise(p * 3.2) - 0.5)) * smoothstep(0.3, 0.7, noise(p * 1.3 + 4.0));
      emi = vein * 1.6;
    }
    else if (m == M_CLOTH) { alb = uBody; rough = 0.8; spec = 0.15; sss = 0.1; }
    else if (m == M_GHOST) { alb = uBody; rough = 0.4; sss = 1.0; alpha = 0.82; emi = 0.15; }

    float occ = calcAO(p, n);
    float sh = softShadow(p + n * 0.01, L);
    float dif = clamp(dot(n, L), 0.0, 1.0);
    float wrap = clamp((dot(n, L) + 0.5) / 1.5, 0.0, 1.0);
    vec3 hal = normalize(L - rd);
    float shin = mix(8.0, 140.0, 1.0 - rough);
    float spe = pow(clamp(dot(n, hal), 0.0, 1.0), shin) * (shin + 8.0) / 40.0;
    float fre = pow(clamp(1.0 + dot(rd, n), 0.0, 1.0), 3.0);
    float sky = 0.5 + 0.5 * n.y;
    float fill = clamp(dot(n, normalize(vec3(-0.7, 0.2, 0.4))), 0.0, 1.0);
    float bou = clamp(-n.y, 0.0, 1.0);

    vec3 key = vec3(1.25, 1.12, 0.95);
    vec3 lin = vec3(0.0);
    lin += key * mix(dif, wrap, sss * 0.6) * sh;
    lin += vec3(0.35, 0.42, 0.6) * sky * occ;
    lin += vec3(0.25, 0.22, 0.35) * fill * occ;
    lin += uBody * 0.25 * bou * occ;
    vec3 col = alb * lin * (1.0 - metal * 0.6);
    vec3 specCol = mix(vec3(1.0), alb, metal);
    col += specCol * spe * spec * sh * occ * (metal > 0.5 ? 1.4 : 0.8);
    // environment-ish reflection for metals
    if (metal > 0.5) {
      vec3 rf = reflect(rd, n);
      vec3 env = mix(vec3(0.12, 0.1, 0.12), vec3(0.75, 0.8, 0.95), smoothstep(-0.3, 0.6, rf.y));
      col += env * alb * 0.55 * occ;
    }
    // subsurface glow + rim
    col += alb * sss * 0.35 * pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 2.0);
    col += mix(vec3(0.5, 0.6, 1.0), uGlow, 0.4) * fre * 0.35 * occ;
    if (uPrimal > 0.5) col += vec3(0.55, 0.3, 1.0) * fre * 0.8;
    else if (uBoss > 0.5) col += vec3(1.0, 0.35, 0.15) * fre * 0.45;
    col += alb * emi;
    if (m == M_ROCK) col += uGlow * emi;
    // hit flash
    col = mix(col, vec3(1.6, 1.4, 1.2), uHit * 0.35);
    col = aces(col * 1.05);
    col = pow(col, vec3(0.4545));
    outc = vec4(col * alpha, alpha);
  } else {
    // ground: contact shadow on transparent background
    if (rd.y < 0.0) {
      float tg = (-1.0 - ro.y) / rd.y;
      vec3 g = ro + rd * tg;
      float r = length(g.xz);
      if (r < 2.4) {
        float sh = softShadow(g + vec3(0.0, 0.01, 0.0), L);
        float ao = calcAO(g, vec3(0.0, 1.0, 0.0));
        float fall = smoothstep(2.4, 0.4, r);
        float a = ((1.0 - sh) * 0.55 + (1.0 - ao) * 0.5) * fall;
        a += smoothstep(1.3, 0.0, r) * 0.18;
        outc = vec4(0.0, 0.0, 0.0, clamp(a, 0.0, 0.8));
      }
    }
  }
  // emissive halo
  vec3 halo = uGlow * clamp(glowAcc, 0.0, 1.5) * 0.35;
  if (uPrimal > 0.5) halo += vec3(0.4, 0.2, 0.9) * clamp(glowAcc, 0.0, 1.0) * 0.2;
  outc.rgb += halo;
  outc.a = max(outc.a, clamp(max(halo.r, max(halo.g, halo.b)), 0.0, 1.0));
  gl_FragColor = outc;
}
`;
