// Shared GLSL. Units: the planet radius is 1. The atmosphere is thickened by
// ATM_SCALE for legibility at planetary scale; scattering coefficients are
// divided by the same factor so vertical optical depth stays physical.
export const atmosphereGLSL = /* glsl */ `
#define PI 3.141592653589793
const float ATM_SCALE = 1.6;
const float R_PLANET = 1.0;
const float R_ATMO = 1.0 + 100.0 / 6371.0 * ATM_SCALE;
const float H_R = 8.0 / 6371.0 * ATM_SCALE;
const float H_M = 1.2 / 6371.0 * ATM_SCALE;
const vec3 BETA_R = vec3(5.8e-6, 13.5e-6, 33.1e-6) * 6371e3 / ATM_SCALE;
const float BETA_M = 21e-6 * 6371e3 / ATM_SCALE;

vec2 raySphere(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - r * r;
  float d = b * b - c;
  if (d < 0.0) return vec2(1e9, -1e9);
  d = sqrt(d);
  return vec2(-b - d, -b + d);
}

// Soft planet shadow for a point p lit along L.
float planetShadow(vec3 p, vec3 L) {
  float b = dot(p, L);
  if (b > 0.0) return 1.0;
  float closest = sqrt(max(dot(p, p) - b * b, 0.0));
  return smoothstep(R_PLANET - 0.018, R_PLANET + 0.014, closest);
}

// Optical depth (Rayleigh, Mie) from p towards L, to the top of the atmosphere.
vec2 lightDepth(vec3 p, vec3 L) {
  float tl = raySphere(p, L, R_ATMO).y;
  float dl = tl / 4.0;
  vec2 od = vec2(0.0);
  for (int j = 0; j < 4; j++) {
    float h = length(p + L * (float(j) + 0.5) * dl) - R_PLANET;
    od += vec2(exp(-h / H_R), exp(-h / H_M)) * dl;
  }
  return od;
}

vec3 sunTransmittance(vec3 p, vec3 L) {
  vec2 od = lightDepth(p, L);
  return exp(-(BETA_R * od.x + BETA_M * 1.1 * od.y)) * planetShadow(p, L);
}

// Single scattering along a view ray, from ro (camera) in direction rd up to tMax.
vec3 scatter(vec3 ro, vec3 rd, float tMax, vec3 L, int steps, out vec3 trans) {
  trans = vec3(1.0);
  vec2 ta = raySphere(ro, rd, R_ATMO);
  float t0 = max(ta.x, 0.0), t1 = min(ta.y, tMax);
  if (t1 <= t0) return vec3(0.0);
  float dt = (t1 - t0) / float(steps);
  vec3 sumR = vec3(0.0), sumM = vec3(0.0);
  vec2 od = vec2(0.0);
  for (int i = 0; i < 24; i++) {
    if (i >= steps) break;
    vec3 p = ro + rd * (t0 + (float(i) + 0.5) * dt);
    float h = max(length(p) - R_PLANET, 0.0);
    vec2 d = vec2(exp(-h / H_R), exp(-h / H_M)) * dt;
    od += d;
    vec2 ld = lightDepth(p, L);
    vec3 att = exp(-(BETA_R * (od.x + ld.x) + BETA_M * 1.1 * (od.y + ld.y))) * planetShadow(p, L);
    sumR += att * d.x;
    sumM += att * d.y;
  }
  trans = exp(-(BETA_R * od.x + BETA_M * 1.1 * od.y));
  float mu = dot(rd, L);
  float phaseR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float g = 0.76;
  float phaseM = 3.0 / (8.0 * PI) * ((1.0 - g * g) * (1.0 + mu * mu)) / ((2.0 + g * g) * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
  return sumR * BETA_R * phaseR + sumM * BETA_M * phaseM;
}
`;

// B-spline bicubic sampling from 4 bilinear taps: smooth, never pixelated.
export const bicubicGLSL = /* glsl */ `
vec4 textureBicubic(sampler2D tex, vec2 uv, vec2 size) {
  vec2 inv = 1.0 / size;
  uv = uv * size - 0.5;
  vec2 fxy = fract(uv);
  uv -= fxy;
  vec4 xcubic, ycubic;
  {
    float x = fxy.x, x2 = x * x, x3 = x2 * x;
    xcubic = vec4((1.0 - x) * (1.0 - x) * (1.0 - x), 3.0 * x3 - 6.0 * x2 + 4.0, -3.0 * x3 + 3.0 * x2 + 3.0 * x + 1.0, x3) / 6.0;
    float y = fxy.y, y2 = y * y, y3 = y2 * y;
    ycubic = vec4((1.0 - y) * (1.0 - y) * (1.0 - y), 3.0 * y3 - 6.0 * y2 + 4.0, -3.0 * y3 + 3.0 * y2 + 3.0 * y + 1.0, y3) / 6.0;
  }
  vec4 c = uv.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
  vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;
  offset *= inv.xxyy;
  vec4 s0 = texture(tex, offset.xz), s1 = texture(tex, offset.yz), s2 = texture(tex, offset.xw), s3 = texture(tex, offset.yw);
  float sx = s.x / (s.x + s.y), sy = s.z / (s.z + s.w);
  return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}
`;

export const noiseGLSL = /* glsl */ `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}
`;
