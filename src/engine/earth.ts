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
uniform float uGlintWaves;
uniform float uTime;
uniform float uCloudOpacity;
uniform float uCloudFlow;
uniform float uCloudDetail; // 0 from afar, 1 close to the ground
uniform float uNightGain;
uniform float uReliefGain;
uniform float uBaseDim;
uniform float uBaseDesat;

uniform sampler2D uData;
uniform sampler2D uData2;
uniform sampler2D uPalette;
uniform vec2 uDataSize;
uniform float uDataBlend;
uniform sampler2D uConf;   // coverage, when a series keeps it apart from the value
uniform sampler2D uConf2;
uniform float uDataSplit;
uniform float uDataMix;
uniform vec4 uDataStyle; // x: lit, y: glow, z: mask (0 any, 1 ocean, 2 land), w: above clouds
uniform vec2 uDataRange;
uniform float uDataFx;   // 1: rain, drawn as falling streaks; 2: forest loss, year by year; 3: aurora, only in the dark
uniform float uLossYear; // forest loss: years since 2000 on screen, fractional

// Atlas: countries coloured by a statistic, year by year.
uniform sampler2D uAtlasId;      // red: country slot; green 0 on borders
uniform sampler2D uAtlasValues;  // x: slot, y: year; red value, green 1 where there is one
uniform sampler2D uAtlasPalette;
uniform float uAtlasMix;
uniform float uAtlasYear;        // years since the first, fractional between two years
uniform float uAtlasYear2;       // the other year, right of the comparison line
uniform float uSplit;            // comparison line, drawing-buffer x (negative: no comparison)
uniform float uAtlasYears;
uniform vec3 uAtlasRange;        // min, max, curve
uniform float uAtlasHover;
uniform float uAtlasFill;

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

// Value noise with each octave rotated, so no grid shows through in cloud edges.
float cloudFbm(vec3 p) {
  const mat3 R = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = R * p * 2.07; a *= 0.5; }
  return s / 0.9375;
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
  // Sentinel-2 knows the coastline better than the 5 km relief: dark, blue-dominant pixels are water.
  float tileWater = smoothstep(0.004, 0.016, s2.b - max(s2.r, s2.g)) * (1.0 - smoothstep(0.08, 0.16, s2.b));
  land = mix(land, min(land, 1.0 - tileWater), uTileMix);
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
  // The clouds float about 10 km up: seen at a slant they are not over the ground point but
  // where the line of sight crosses their height. Close to the planet they shift against the
  // ground and their shadows fall beside them; from afar nothing changes.
  vec2 lift = vec2(0.0);
  {
    vec3 C = cameraPosition, d = normalize(vPos - C);
    float b = dot(C, d), R = 1.0 + 10.0 / 6371.0;
    float disc = b * b - (dot(C, C) - R * R);
    if (disc > 0.0) {
      vec3 Q = normalize(C + d * (-b - sqrt(disc)));
      vec2 q = vec2(atan(-Q.z, Q.x) / (2.0 * PI) + 0.5, asin(clamp(Q.y, -1.0, 1.0)) / PI + 0.5);
      lift = vec2(fract(q.x - uv.x + 0.5) - 0.5, q.y - uv.y);
      lift *= step(length(lift), 0.02); // only the slant of a nearby view
    }
  }
  vec2 uv0 = uv - flow * ph0 * period + lift, uv1 = uv - flow * ph1 * period + lift;
  float c0 = texture(uClouds, uv0).r;
  float c1 = texture(uClouds, uv1).r;
  float cloudBase = mix(c1, c0, wgt);
  float cloud = cloudBase;
  vec2 shadowShift = vec2(dot(L, east) / (2.0 * PI * cosLat), dot(L, north) / PI) * 0.0035;
  float cloudShade = 1.0;
  if (uCloudDetail > 0.001 && uCloudOpacity > 0.001 && cloudBase > 0.02) {
    // The cloud map has 5 km pixels. Close up, break the edges into cumulus-like texture
    // (moving with the clouds) where there already is cloud, without adding any.
    // Noise on the sphere itself (features of about 5 km), carried along by the cloud drift.
    vec2 a0 = vec2((uv0.x - 0.5) * 2.0 * PI, (uv0.y - 0.5) * PI), a1 = vec2((uv1.x - 0.5) * 2.0 * PI, (uv1.y - 0.5) * PI);
    vec3 p0 = vec3(cos(a0.y) * cos(a0.x), sin(a0.y), -cos(a0.y) * sin(a0.x)) * 1274.0;
    vec3 p1 = vec3(cos(a1.y) * cos(a1.x), sin(a1.y), -cos(a1.y) * sin(a1.x)) * 1274.0;
    float d = wgt > 0.97 ? cloudFbm(p0) : wgt < 0.03 ? cloudFbm(p1 + 17.0) : mix(cloudFbm(p1 + 17.0), cloudFbm(p0), wgt);
    // Erode only: gaps open inside thin and broken cloud, solid decks stay solid, clear sky stays clear.
    float body = smoothstep(0.12, 0.45, cloudBase) * (1.0 - smoothstep(0.7, 0.98, cloudBase));
    cloud = cloudBase * (1.0 - smoothstep(0.36, 0.72, 1.0 - d) * 0.55 * body * uCloudDetail);
    // Sides turned away from the Sun fall into their own shadow.
    float toSun = mix(texture(uClouds, uv1 + shadowShift * 0.35).r, texture(uClouds, uv0 + shadowShift * 0.35).r, wgt);
    cloudShade = 1.0 - 0.45 * clamp((toSun - cloudBase) * 4.0, 0.0, 1.0) * uCloudDetail;
  }
  // Relief of the cloud tops from the gradient of their density: slopes facing the Sun light
  // up, the lee side falls into shade. It shows most near the terminator, as in photographs.
  vec2 ct = vec2(1.6 / 8192.0, 1.6 / 4096.0);
  float gx = texture(uClouds, uv0 + vec2(ct.x, 0.0)).r - texture(uClouds, uv0 - vec2(ct.x, 0.0)).r;
  float gy = texture(uClouds, uv0 + vec2(0.0, ct.y)).r - texture(uClouds, uv0 - vec2(0.0, ct.y)).r;
  vec3 cn = normalize(N - (gx * east + gy * north) * 2.2);
  float cloudRelief = clamp(1.0 + (dot(cn, L) - dot(N, L)) * 2.8, 0.5, 1.35);
  // Thick decks are brighter than thin veils.
  float cloudAlbedo = mix(0.46, 0.66, smoothstep(0.25, 0.95, cloudBase));
  // Thin haze in a 5 km map reads as fog from close by: let it clear as the camera comes down.
  cloud = smoothstep(0.08 + 0.2 * uCloudDetail, 0.95, cloud) * uCloudOpacity;
  // The shadow on the ground: the cloud above this point, displaced along the Sun's direction.
  float cloudShadow = smoothstep(0.08, 0.95, texture(uClouds, uv0 - lift + shadowShift).r) * uCloudOpacity;

  // ---- Sunlight at the ground, reddened near the terminator by the atmosphere.
  vec3 sunT = sunTransmittance(N * 1.0005, L);
  float nl = max(dot(n, L), 0.0);
  float NL = dot(N, L);
  vec3 sky = vec3(0.03, 0.06, 0.12) * smoothstep(-0.25, 0.3, NL) + vec3(0.004, 0.006, 0.011);
  // Twilight: past the terminator the sky still lights the ground, warm at first, then blue.
  float below = max(-NL, 0.0);
  sky += mix(vec3(0.15, 0.085, 0.06), vec3(0.025, 0.04, 0.10), smoothstep(0.0, 0.07, below)) * exp(-pow((NL + 0.012) / 0.055, 2.0)) * 0.8; // smooth: a cusp here draws a crease along the terminator
  // Moonlight, from the real Moon and its phase; drawn cool, as the eye sees the night.
  float night = smoothstep(0.06, -0.12, NL);
  vec3 moonC = vec3(0.62, 0.74, 1.0) * uMoon.w * night;
  vec3 surface = albedo * (sunT * nl * (1.0 - cloudShadow * 0.55) * uSunPower + sky + moonC * max(dot(n, uMoon.xyz), 0.0) * (1.0 - cloudShadow * 0.5));

  // Ocean glint.
  vec3 H = normalize(L + V);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  // A bright core and a faint wide halo: a milky disc would hide the sea and its clouds.
  float glint = pow(max(dot(N, H), 0.0), 160.0) * 0.6 + pow(max(dot(N, H), 0.0), 24.0) * 0.012;
  // Seen from near the ground the glint fills the sea: let waves break it up, as in photographs from orbit.
  // The pattern runs downwind with today's wind, a little faster where it blows harder.
  if (glint * uGlint > 0.002 && uGlintWaves > 0.001) {
    vec3 drift = (east * w.x + north * w.y) * uTime * 0.0006;
    float waves = fbm(N * vec3(520.0, 900.0, 520.0) - drift * 520.0 + vec3(0.0, 0.0, uTime * 0.01));
    float chop = fbm(N * vec3(1900.0, 2600.0, 1900.0) - drift * 1900.0 + vec3(uTime * 0.03, 0.0, 0.0));
    glint *= mix(1.0, 0.25 + 1.1 * smoothstep(0.2, 0.85, waves) * (0.6 + 0.6 * chop), uGlintWaves);
  }
  surface += (1.0 - land) * sunT * glint * (1.0 - cloud) * uSunPower * (1.0 - uBaseDim) * uGlint;
  surface += (1.0 - land) * fres * vec3(0.10, 0.18, 0.32) * smoothstep(-0.2, 0.4, NL) * 0.35 * (1.0 - uBaseDim);
  vec3 Hm = normalize(uMoon.xyz + V);
  surface += (1.0 - land) * moonC * pow(max(dot(N, Hm), 0.0), 160.0) * 0.8 * (1.0 - cloud) * uGlint;

  // ---- Data layer below the clouds.
  vec4 dataColor = vec4(0.0);
  if (uDataMix > 0.001) {
    // Comparing: the first frame left of the line, the last one right of it.
    float blend = uSplit > 0.0 ? step(uSplit, gl_FragCoord.x) : uDataBlend;
    vec4 d1 = textureBicubic(uData, uv, uDataSize);
    vec4 d = d1;
    if (blend > 0.0) d = mix(d1, textureBicubic(uData2, uv, uDataSize), blend);
    if (uDataSplit > 0.5) d.g = mix(texture(uConf, uv).r, texture(uConf2, uv).r, blend);
    float v = clamp((d.r - uDataRange.x) / max(uDataRange.y - uDataRange.x, 1e-4), 0.0, 1.0);
    vec4 pal = texture(uPalette, vec2(v, 0.5));
    pal.rgb *= pal.rgb;
    float mask = uDataStyle.z < 0.5 ? 1.0 : (uDataStyle.z < 1.5 ? 1.0 - land : land);
    float a = clamp(d.g * 1.15, 0.0, 1.0) * pal.a * mask * uDataMix;
    if (uDataFx > 2.5) {
      // Aurora: light of its own, seen only where it is dark, with curtains that shimmer.
      float night = smoothstep(0.1, -0.14, NL);
      // It breathes slowly along the oval.
      float sheet = 0.85 + 0.15 * sin(uTime * 0.6 + uv.x * 12.0 + sin(uTime * 0.21) * 2.0);
      a *= night * sheet * 0.8;
    } else if (uDataFx > 1.5) {
      // Forest loss: the year of loss is a code, never blended between neighbours.
      vec4 f = texelFetch(uData, ivec2(uv * uDataSize), 0);
      float year = floor(f.r * 25.5 + 0.5);
      float age = uLossYear - year;
      float shown = year > 0.5 ? smoothstep(-0.6, 0.0, age) : 0.0;
      // Fresh loss glows like embers, then cools to a dark scar.
      vec3 fresh = vec3(1.0, 0.42, 0.16), scar = vec3(0.32, 0.07, 0.05);
      float k = exp(-max(age, 0.0) / 2.5);
      pal = vec4(mix(scar, fresh, k), 1.0);
      a = shown * clamp(f.g * 1.4, 0.0, 1.0) * (0.55 + 0.45 * k) * mask * uDataMix;
    } else if (uDataFx > 0.5) {
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
  // Shaded cloud sides take the blue of the sky above them.
  float lit = cloudShade * cloudRelief;
  vec3 cloudCol = cloudAlbedo * cloudLight * mix(vec3(0.78, 0.86, 1.0), vec3(1.0), smoothstep(0.6, 1.05, lit)) * lit;
  vec3 col = mix(surface, cloudCol * (1.0 - uBaseDim * 0.6), cloud);

  if (uDataMix > 0.001 && uDataStyle.w > 0.5) {
    col = mix(col, dataColor.rgb, dataColor.a);
    col += dataColor.rgb * dataColor.a * uDataStyle.y;
  }

  // ---- Atlas: countries as light.
  if (uAtlasMix > 0.001) {
    vec4 idp = texelFetch(uAtlasId, ivec2(uv * vec2(textureSize(uAtlasId, 0))), 0);
    float border = 1.0 - idp.g;
    int slot = int(idp.r * 255.0 + 0.5);
    float hover = slot > 0 && slot == int(uAtlasHover + 0.5) ? 1.0 : 0.0;
    if (slot > 0 && uAtlasFill > 0.5) {
      float yr = uSplit > 0.0 && gl_FragCoord.x > uSplit ? uAtlasYear2 : uAtlasYear;
      int y0 = int(floor(yr)), y1 = min(y0 + 1, int(uAtlasYears) - 1);
      vec2 v0 = texelFetch(uAtlasValues, ivec2(slot, y0), 0).rg, v1 = texelFetch(uAtlasValues, ivec2(slot, y1), 0).rg;
      // Colours move between two years; the numbers are never interpolated.
      vec4 c0 = vec4(0.5, 0.52, 0.56, 0.12), c1 = c0;
      float span = max(uAtlasRange.y - uAtlasRange.x, 1e-4);
      if (v0.g > 0.5) { vec4 p = texture(uAtlasPalette, vec2(pow(clamp((v0.r - uAtlasRange.x) / span, 0.0, 1.0), uAtlasRange.z), 0.5)); c0 = vec4(p.rgb * p.rgb, 1.0); }
      if (v1.g > 0.5) { vec4 p = texture(uAtlasPalette, vec2(pow(clamp((v1.r - uAtlasRange.x) / span, 0.0, 1.0), uAtlasRange.z), 0.5)); c1 = vec4(p.rgb * p.rgb, 1.0); }
      vec4 c = mix(c0, c1, fract(yr));
      c.rgb *= 1.0 + hover * 0.6;
      col = mix(col, c.rgb * 0.9, c.a * 0.82 * uAtlasMix);
      col += c.rgb * c.a * 0.22 * uAtlasMix;
    } else if (slot > 0) {
      col += vec3(1.0, 0.85, 0.62) * hover * 0.08 * uAtlasMix;
    }
    // Borders and coasts as fine threads of warm light.
    col += vec3(1.0, 0.86, 0.66) * border * (0.16 + 0.3 * uAtlasFill) * uAtlasMix;
  }

  // ---- City lights on the night side.
  float lights = max(texture(uNight, uv).r - 0.165, 0.0) / 0.835; // Black Marble keeps a faint land base
  float dark = smoothstep(0.08, -0.18, NL);
  vec3 sodium = vec3(1.0, 0.68, 0.36);
  // Steeper and compressed at the top: crisp networks of light instead of glowing blobs.
  float city = pow(lights, 2.1) * uNightGain * 2.4;
  col += sodium * city / (1.0 + 0.55 * city) * dark * (1.0 - cloud * 0.75);

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
    uGlintWaves: { value: 0 },
    uTime: { value: 0 },
    uCloudOpacity: { value: 1 },
    uCloudFlow: { value: 1 },
    uCloudDetail: { value: 0 },
    uNightGain: { value: 3.2 },
    uReliefGain: { value: 9 },
    uBaseDim: { value: 0 },
    uBaseDesat: { value: 0 },
    uData: { value: blank as Texture },
    uData2: { value: blank as Texture },
    uPalette: { value: blank as Texture },
    uDataSize: { value: new Vector2(1, 1) },
    uDataBlend: { value: 0 },
    uConf: { value: blank as Texture },
    uConf2: { value: blank as Texture },
    uDataSplit: { value: 0 },
    uDataMix: { value: 0 },
    uDataStyle: { value: new Vector4(0, 0, 1, 0) },
    uDataRange: { value: new Vector2(0, 1) },
    uDataFx: { value: 0 },
    uLossYear: { value: 24 },
    uAtlasId: { value: blank as Texture },
    uAtlasValues: { value: blank as Texture },
    uAtlasPalette: { value: blank as Texture },
    uAtlasMix: { value: 0 },
    uAtlasYear: { value: 0 },
    uAtlasYear2: { value: 0 },
    uSplit: { value: -1 },
    uAtlasYears: { value: 1 },
    uAtlasRange: { value: new Vector3(0, 1, 1) },
    uAtlasHover: { value: -1 },
    uAtlasFill: { value: 1 },
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
