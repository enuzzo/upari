import {
  DataTexture, Mesh, ShaderMaterial, SphereGeometry, Texture, Vector2, Vector3, Vector4, RGBAFormat, LinearFilter,
} from 'three';
import { atmosphereGLSL, bicubicGLSL, noiseGLSL } from './glsl';

const blank = (() => {
  const t = new DataTexture(new Uint8Array([128, 128, 0, 255]), 1, 1, RGBAFormat);
  t.magFilter = t.minFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
})();

export const earthVertex = /* glsl */ `
varying vec3 vPos;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const earthFragment = /* glsl */ `
precision highp float;
${atmosphereGLSL}
${bicubicGLSL}
${noiseGLSL}

uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uClouds;
uniform sampler2D uRelief;
uniform sampler2D uWind;
uniform vec2 uReliefSize;
uniform vec3 uSun;
uniform float uSunPower;
uniform float uAtmoPower;
uniform float uHaze;
uniform float uGlint;
uniform float uTime;
uniform float uCloudOpacity;
uniform float uCloudFlow;
uniform float uNightGain;
uniform float uReliefGain;
uniform float uBaseDim;
uniform float uBaseDesat;

uniform sampler2D uData;
uniform sampler2D uData2;
uniform sampler2D uPalette;
uniform vec2 uDataSize;
uniform float uDataBlend;
uniform float uDataMix;
uniform vec4 uDataStyle; // x: lit, y: glow, z: mask (0 any, 1 ocean, 2 land), w: above clouds
uniform vec2 uDataRange;
uniform float uDataFx;   // 1: rain, drawn as falling streaks instead of a glowing veil

uniform sampler2D uTrail;
uniform float uTrailGain;

uniform vec4 uMoon;      // xyz: direction, w: moonlight at the ground
uniform vec4 uPin;       // xyz: direction, w: intensity
uniform float uPinScale; // shrinks the pulse as the camera comes down
uniform vec3 uPinColor;

#ifdef TILE
uniform sampler2D uTile;
uniform float uTileMix;   // Blue Marble → Sentinel-2, by altitude
uniform float uTileAlpha; // fade over the parent tile
uniform vec4 uTileEdge;   // mip bias towards coarser neighbours: west, east, south, north
varying vec2 vTileUv;
#endif

varying vec3 vPos;
varying vec2 vUv;

float decodeHeight(float e) {
  // Signed sqrt encoding: 0.502 = sea level.
  float s = (e * 255.0 - 128.0);
  return s >= 0.0 ? pow(s / 127.0, 2.0) * 8.8 : -pow(-s / 128.0, 2.0) * 11.0; // km
}

// Slanted dashes that slide along themselves: the map sign for rain. Their size is
// held at a few pixels on screen, blending two octaves so zooming never pops.
float rainDashes(vec2 km, float t) {
  float pxKm = max(length(fwidth(vPos)) * 6371.0, 1e-3);
  float level = log2(pxKm * 10.0);
  float l0 = floor(level);
  float s = 0.0;
  for (int k = 0; k < 2; k++) {
    float period = exp2(l0 + float(k));
    vec2 q = mat2(0.906, -0.423, 0.423, 0.906) * km / period;
    float col = floor(q.x);
    float line = 1.0 - smoothstep(0.06, 0.2, abs(fract(q.x) - 0.5));
    float y = fract(q.y * 0.3 + fract(sin(col * 91.7) * 4375.85) * 7.0 + t);
    float dash = smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.42, 0.58, y));
    s += line * dash * (k == 0 ? 1.0 - fract(level) : fract(level));
  }
  return s;
}

vec3 desaturate(vec3 c, float k) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(c, vec3(l), k);
}

void main() {
  vec3 N = normalize(vPos);
  vec3 L = normalize(uSun);
  vec3 V = normalize(cameraPosition - vPos);
  vec2 uv = vUv;
  float lat = asin(clamp(N.y, -1.0, 1.0));
  float cosLat = max(cos(lat), 0.02);
  vec3 east = normalize(vec3(N.z, 0.0, -N.x) + vec3(1e-6, 0.0, 0.0));
  vec3 north = cross(N, east);

  // ---- Relief: normals from the elevation model, grazing light reveals mountains.
  vec2 texel = 1.0 / uReliefSize;
  float hc = texture(uRelief, uv).r;
  float hE = decodeHeight(texture(uRelief, uv + vec2(texel.x, 0.0)).r);
  float hW = decodeHeight(texture(uRelief, uv - vec2(texel.x, 0.0)).r);
  float hN = decodeHeight(texture(uRelief, uv + vec2(0.0, texel.y)).r);
  float hS = decodeHeight(texture(uRelief, uv - vec2(0.0, texel.y)).r);
  float kmX = 2.0 * PI * 6371.0 * texel.x * cosLat, kmY = PI * 6371.0 * texel.y;
  float land = smoothstep(0.500, 0.507, hc);
  vec2 slope = vec2((hE - hW) / (2.0 * kmX), (hN - hS) / (2.0 * kmY)) * uReliefGain * land;
  vec3 n = normalize(N - slope.x * east - slope.y * north);

  // ---- Albedo.
  vec3 albedo = texture(uDay, uv).rgb;
  albedo = pow(albedo, vec3(2.2)); // to linear
#ifdef TILE
  // Next to a coarser tile, blur towards its resolution so the seam disappears.
  vec2 tu = vTileUv;
  float bias = max(max(uTileEdge.x * (1.0 - smoothstep(0.0, 0.3, tu.x)), uTileEdge.y * (1.0 - smoothstep(0.0, 0.3, 1.0 - tu.x))),
                   max(uTileEdge.z * (1.0 - smoothstep(0.0, 0.3, tu.y)), uTileEdge.w * (1.0 - smoothstep(0.0, 0.3, 1.0 - tu.y))));
  vec3 s2 = pow(texture(uTile, tu, bias).rgb, vec3(2.2));
  // Sentinel-2 cloudless graded to Blue Marble (per-channel quantile fit on land), so the hand-over has no colour jump.
  vec3 tileC = vec3(0.55, 0.47, 0.86) * pow(max(s2 - vec3(0.005, 0.0175, 0.02), 0.0), vec3(0.82, 0.76, 1.2));
  albedo = mix(albedo, tileC, uTileMix);
#endif
  float depth = clamp((0.502 - hc) / 0.502, 0.0, 1.0);
  float shelf = (1.0 - smoothstep(0.0, 0.16, depth)) * (1.0 - land);
#ifdef TILE
  shelf *= 1.0 - uTileMix; // Sentinel-2 shows the real shallows
#endif
  albedo = mix(albedo, albedo * vec3(0.7, 1.35, 1.45) + vec3(0.0, 0.012, 0.018), shelf * 0.75);
  albedo = desaturate(albedo, uBaseDesat) * (1.0 - uBaseDim);

  // ---- Clouds, advected by today's winds (two-phase flow map).
  vec2 w = (texture(uWind, uv).rg - 0.5) * 2.0 * 40.0; // m/s
  vec2 flow = vec2(w.x / (2.0 * PI * 6371000.0 * cosLat), w.y / (PI * 6371000.0)) * 2400.0 * uCloudFlow;
  float period = 24.0;
  float ph0 = fract(uTime / period), ph1 = fract(uTime / period + 0.5);
  float wgt = 1.0 - abs(1.0 - 2.0 * ph0);
  float c0 = texture(uClouds, uv - flow * ph0 * period).r;
  float c1 = texture(uClouds, uv - flow * ph1 * period).r;
  float cloud = mix(c1, c0, wgt);
  cloud = smoothstep(0.08, 0.95, cloud) * uCloudOpacity;
  vec2 shadowShift = vec2(dot(L, east) / (2.0 * PI * cosLat), dot(L, north) / PI) * 0.0035;
  float cloudShadow = smoothstep(0.08, 0.95, texture(uClouds, uv - flow * ph0 * period + shadowShift).r) * uCloudOpacity;

  // ---- Sunlight at the ground, reddened near the terminator by the atmosphere.
  vec3 sunT = sunTransmittance(N * 1.0005, L);
  float nl = max(dot(n, L), 0.0);
  float NL = dot(N, L);
  vec3 sky = vec3(0.03, 0.06, 0.12) * smoothstep(-0.25, 0.3, NL) + vec3(0.004, 0.006, 0.011);
  // Twilight: past the terminator the sky still lights the ground, warm at first, then blue.
  float below = max(-NL, 0.0);
  sky += mix(vec3(0.15, 0.085, 0.06), vec3(0.025, 0.04, 0.10), smoothstep(0.0, 0.07, below)) * exp(-abs(NL + 0.012) / 0.05) * 0.8;
  // Moonlight, from the real Moon and its phase; drawn cool, as the eye sees the night.
  float night = smoothstep(0.06, -0.12, NL);
  vec3 moonC = vec3(0.62, 0.74, 1.0) * uMoon.w * night;
  vec3 surface = albedo * (sunT * nl * (1.0 - cloudShadow * 0.55) * uSunPower + sky + moonC * max(dot(n, uMoon.xyz), 0.0) * (1.0 - cloudShadow * 0.5));

  // Ocean glint.
  vec3 H = normalize(L + V);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  float glint = pow(max(dot(N, H), 0.0), 140.0) * 0.55 + pow(max(dot(N, H), 0.0), 14.0) * 0.03;
  surface += (1.0 - land) * sunT * glint * (1.0 - cloud) * uSunPower * (1.0 - uBaseDim) * uGlint;
  surface += (1.0 - land) * fres * vec3(0.10, 0.18, 0.32) * smoothstep(-0.2, 0.4, NL) * 0.35 * (1.0 - uBaseDim);
  vec3 Hm = normalize(uMoon.xyz + V);
  surface += (1.0 - land) * moonC * pow(max(dot(N, Hm), 0.0), 160.0) * 0.8 * (1.0 - cloud) * uGlint;

  // ---- Data layer below the clouds.
  vec4 dataColor = vec4(0.0);
  if (uDataMix > 0.001) {
    vec4 d1 = textureBicubic(uData, uv, uDataSize);
    vec4 d = d1;
    if (uDataBlend > 0.0) d = mix(d1, textureBicubic(uData2, uv, uDataSize), uDataBlend);
    float v = clamp((d.r - uDataRange.x) / max(uDataRange.y - uDataRange.x, 1e-4), 0.0, 1.0);
    vec4 pal = texture(uPalette, vec2(v, 0.5));
    pal.rgb *= pal.rgb;
    float mask = uDataStyle.z < 0.5 ? 1.0 : (uDataStyle.z < 1.5 ? 1.0 - land : land);
    float a = clamp(d.g * 1.15, 0.0, 1.0) * pal.a * mask * uDataMix;
    if (uDataFx > 0.5) {
      float dashes = rainDashes(vec2(uv.x * 40075.0 * cosLat, uv.y * 20004.0), uTime * 0.8);
      a *= 0.42 + 0.75 * dashes;
      pal.rgb *= 0.8 + 0.45 * dashes;
    }
    float light = mix(1.0, 0.25 + 0.75 * smoothstep(-0.15, 0.35, NL), uDataStyle.x);
    dataColor = vec4(pal.rgb * light, a);
    if (uDataStyle.w < 0.5) {
      surface = mix(surface, dataColor.rgb, a);
      surface += pal.rgb * a * uDataStyle.y;
    }
  }

  // ---- Cloud layer.
  vec3 cloudLight = sunT * (smoothstep(-0.12, 0.6, NL) * 0.92 + 0.04) * uSunPower + sky * 0.6 + moonC * (smoothstep(-0.2, 0.6, dot(N, uMoon.xyz)) * 0.9 + 0.1);
  vec3 col = mix(surface, vec3(0.58) * cloudLight * (1.0 - uBaseDim * 0.6), cloud);

  if (uDataMix > 0.001 && uDataStyle.w > 0.5) {
    col = mix(col, dataColor.rgb, dataColor.a);
    col += dataColor.rgb * dataColor.a * uDataStyle.y;
  }

  // ---- City lights on the night side.
  float lights = max(texture(uNight, uv).r - 0.165, 0.0) / 0.835; // Black Marble keeps a faint land base
  float dark = smoothstep(0.08, -0.18, NL);
  vec3 sodium = vec3(1.0, 0.68, 0.36);
  col += sodium * pow(lights, 1.6) * dark * (1.0 - cloud * 0.7) * uNightGain;

  // ---- Flow trails (winds, currents).
  col += texture(uTrail, uv).rgb * uTrailGain;

  // ---- Pin: a soft pulse that draws the eye to a place.
  if (uPin.w > 0.001) {
    float ang = length(N - normalize(uPin.xyz)); // chord: acos is too coarse at these tiny angles
    float r = fract(uTime * 0.45) * 0.09 * uPinScale;
    float ring = exp(-pow((ang - r) / (0.004 * uPinScale), 2.0)) * (1.0 - fract(uTime * 0.45));
    float dot0 = exp(-pow(ang / (0.0045 * uPinScale), 2.0));
    col += uPinColor * (ring * 1.6 + dot0 * 2.5) * uPin.w;
  }

  // ---- Aerial perspective: camera → surface through the atmosphere.
  vec3 rd = -V;
  float tHit = length(cameraPosition - vPos);
  vec3 trans;
  vec3 inscatter = scatter(cameraPosition, rd, tHit, L, 10, trans);
  col = col * mix(vec3(1.0), trans, uHaze) + inscatter * uAtmoPower * uHaze;

#ifdef TILE
  gl_FragColor = vec4(col, uTileAlpha);
#else
  gl_FragColor = vec4(col, 1.0);
#endif
}
`;

export interface EarthTextures {
  day: Texture;
  night: Texture;
  clouds: Texture;
  relief: Texture;
}

export function earthUniforms(t: EarthTextures) {
  return {
    uDay: { value: t.day },
    uNight: { value: t.night },
    uClouds: { value: t.clouds },
    uRelief: { value: t.relief },
    uWind: { value: blank as Texture },
    uReliefSize: { value: new Vector2(4096, 2048) },
    uSun: { value: new Vector3(1, 0, 0) },
    uSunPower: { value: 1.55 },
    uAtmoPower: { value: 5 },
    uHaze: { value: 0.6 },
    uLimb: { value: 2 },
    uGlint: { value: 1 },
    uTime: { value: 0 },
    uCloudOpacity: { value: 1 },
    uCloudFlow: { value: 1 },
    uNightGain: { value: 3.2 },
    uReliefGain: { value: 9 },
    uBaseDim: { value: 0 },
    uBaseDesat: { value: 0 },
    uData: { value: blank as Texture },
    uData2: { value: blank as Texture },
    uPalette: { value: blank as Texture },
    uDataSize: { value: new Vector2(1, 1) },
    uDataBlend: { value: 0 },
    uDataMix: { value: 0 },
    uDataStyle: { value: new Vector4(0, 0, 1, 0) },
    uDataRange: { value: new Vector2(0, 1) },
    uDataFx: { value: 0 },
    uTrail: { value: blank as Texture },
    uTrailGain: { value: 0 },
    uMoon: { value: new Vector4(1, 0, 0, 0) },
    uAirglow: { value: 0 },
    uPin: { value: new Vector4(1, 0, 0, 0) },
    uPinColor: { value: new Vector3(1, 0.85, 0.6) },
    uPinScale: { value: 1 },
  };
}

export type EarthUniforms = ReturnType<typeof earthUniforms>;

export function createEarth(uniforms: EarthUniforms): Mesh {
  const material = new ShaderMaterial({ uniforms, vertexShader: earthVertex, fragmentShader: earthFragment });
  const mesh = new Mesh(new SphereGeometry(1, 384, 192), material);
  mesh.name = 'earth';
  return mesh;
}

export const atmosphereFragment = /* glsl */ `
precision highp float;
${atmosphereGLSL}
uniform vec3 uSun;
uniform float uAtmoPower;
uniform float uLimb;
uniform float uAirglow;
varying vec3 vPos;
void main() {
  vec3 rd = normalize(vPos - cameraPosition);
  vec2 tp = raySphere(cameraPosition, rd, R_PLANET);
  if (tp.x > 0.0 && tp.x < 1e8) discard; // the planet is in front (a miss returns 1e9)
  vec3 L = normalize(uSun);
  vec3 trans;
  vec3 c = scatter(cameraPosition, rd, 1e9, L, 16, trans) * uAtmoPower * uLimb;
  // Airglow: oxygen near 95 km glows faintly green all night. Seen edge-on, it draws the night limb.
  vec3 pc = cameraPosition + rd * max(-dot(cameraPosition, rd), 0.0);
  float hT = length(pc) - R_PLANET;
  float glow = exp(-pow((hT - 95.0 / 6371.0 * ATM_SCALE) / (22.0 / 6371.0 * ATM_SCALE), 2.0));
  c += vec3(0.36, 0.8, 0.52) * glow * smoothstep(0.1, -0.2, dot(normalize(pc), L)) * uAirglow;
  gl_FragColor = vec4(c, 1.0);
}
`;

export function createAtmosphere(uniforms: EarthUniforms): Mesh {
  const material = new ShaderMaterial({
    uniforms: { uSun: uniforms.uSun, uAtmoPower: uniforms.uAtmoPower, uLimb: uniforms.uLimb, uAirglow: uniforms.uAirglow },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: atmosphereFragment,
    side: 1, // BackSide
    transparent: true,
    depthWrite: false,
    blending: 2, // Additive
  });
  const mesh = new Mesh(new SphereGeometry(1 + (100 / 6371) * 1.6 + 0.0005, 128, 64), material);
  mesh.name = 'atmosphere';
  mesh.renderOrder = 2;
  return mesh;
}
