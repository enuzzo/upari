import { AdditiveBlending, BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector3, DoubleSide } from 'three';
import { lonLatToVec } from './astro';
import { noiseGLSL } from './glsl';

// The aurora as it is seen from space: curtains of light standing on the oval that NOAA's
// OVATION model forecasts for the next half hour. Where and how bright come from the data;
// the shape and the colours from the physics: oxygen glows green (557.7 nm) between about
// 100 and 150 km and red (630 nm) higher up, nitrogen puts a pink and violet hem at the
// bottom; the curtains fold and ripple slowly. A veil of diffuse light fills the band between
// them, as it looks from the Space Station. Only the night side shows them.

const R_EARTH_KM = 6371;
const BOTTOM = 1 + 95 / R_EARTH_KM, TOP = 1 + 360 / R_EARTH_KM, GLOW = 1 + 112 / R_EARTH_KM;

/** read(lon, lat) → probability 0..1 of seeing an aurora there (the OVATION grid). */
export function createAuroraCurtains(read: (lon: number, lat: number) => number) {
  const pos: number[] = [], attr: number[] = [], index: number[] = [];
  const glowPos: number[] = [], glowAttr: number[] = [], glowIndex: number[] = [];
  const v = new Vector3();
  // Two ovals; along each, for every longitude, the latitude where the aurora is strongest and
  // how wide the band is there.
  for (const north of [true, false]) {
    const ring: { lat: number; p: number; w: number }[] = [];
    for (let i = 0; i < 720; i++) {
      const lon = -180 + i * 0.5;
      let best = 0, sumW = 0, sumLat = 0, sumLat2 = 0;
      for (let k = 0; k <= 40; k++) {
        const lat = (north ? 1 : -1) * (48 + k);
        const p = read(lon, lat);
        if (p > best) best = p;
        if (p > 0.08) { sumW += p * p; sumLat += lat * p * p; sumLat2 += lat * lat * p * p; }
      }
      const mean = sumW ? sumLat / sumW : (north ? 67 : -67);
      const spread = sumW ? Math.sqrt(Math.max(0, sumLat2 / sumW - mean * mean)) : 2;
      ring.push({ lat: mean, p: best, w: Math.min(7, Math.max(2.2, spread * 1.4)) });
    }
    // Smooth along the oval so the light flows instead of jumping cell to cell.
    const smooth = ring.map((_, i) => {
      let lat = 0, p = 0, w = 0, n = 0;
      for (let k = -6; k <= 6; k++) { const r = ring[(i + k + 720) % 720], g = Math.exp(-(k * k) / 18); lat += r.lat * g; p += r.p * g; w += r.w * g; n += g; }
      return { lat: lat / n, p: p / n, w: w / n };
    });
    // Curtains: three folded sheets across the width of the band, the middle one brightest.
    for (const [offset, weight] of [[-0.45, 0.55], [0, 1], [0.5, 0.45]] as const) {
      const base = pos.length / 3;
      smooth.forEach((r, i) => {
        const lon = -180 + i * 0.5;
        const lat = r.lat + offset * r.w * Math.sign(r.lat);
        for (const [h, top] of [[BOTTOM, 0], [TOP, 1]] as const) {
          lonLatToVec(lon, lat, h, v);
          pos.push(v.x, v.y, v.z);
          attr.push(r.p * weight, top, i / 720 + offset * 0.37);
        }
      });
      for (let i = 0; i < 720; i++) {
        const a = base + i * 2, b = base + ((i + 1) % 720) * 2;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    // The haze: a glowing veil across the whole band at about 110 km, what makes the aurora
    // look soft and full from above.
    const ACROSS = 9;
    const base = glowPos.length / 3;
    smooth.forEach((r, i) => {
      const lon = -180 + i * 0.5;
      for (let j = 0; j < ACROSS; j++) {
        const u = (j / (ACROSS - 1)) * 2 - 1; // -1 equatorward edge .. 1 poleward edge
        lonLatToVec(lon, r.lat + u * r.w * 1.6 * Math.sign(r.lat), GLOW, v);
        glowPos.push(v.x, v.y, v.z);
        glowAttr.push(r.p, u, i / 720);
      }
    });
    for (let i = 0; i < 720; i++) {
      for (let j = 0; j < ACROSS - 1; j++) {
        const a = base + i * ACROSS + j, b = base + ((i + 1) % 720) * ACROSS + j;
        glowIndex.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('aur', new BufferAttribute(new Float32Array(attr), 3));
  geo.setIndex(index);
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uSun: { value: new Vector3(1, 0, 0) } };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aur; // strength, height along the curtain (0 bottom, 1 top), place along the oval
      varying vec3 vAur; varying vec3 vPos;
      void main() { vAur = aur; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime, uOpacity;
      uniform vec3 uSun;
      varying vec3 vAur; varying vec3 vPos;
      void main() {
        float strength = smoothstep(0.05, 0.45, vAur.x);
        float h = vAur.y, s = vAur.z * 720.0;
        // Rays and folds: fine vertical rays, broader folds that drift along the oval.
        float folds = fbm(vec3(s * 0.035, uTime * 0.05, 1.7));
        float rays = pow(0.3 + 0.7 * fbm(vec3(s * 1.1 + folds * 6.0, h * 0.5, uTime * 0.15)), 1.4) * 1.5;
        float curtain = smoothstep(0.3, 0.7, folds + 0.25 * sin(s * 0.08 + uTime * 0.2));
        // Light from the bottom up: a sharp lower edge, a long fading top.
        float bottomEdge = smoothstep(0.0, 0.05, h);
        float green = exp(-pow((h - 0.18) / 0.16, 2.0));
        // Above the green, oxygen's red; seen together with the green it reads pink and magenta.
        float upper = exp(-pow((h - 0.55) / 0.28, 2.0)) * 0.45;
        float hem = exp(-pow((h - 0.03) / 0.04, 2.0)) * smoothstep(0.3, 0.7, vAur.x);
        vec3 col = vec3(0.2, 1.0, 0.5) * green + vec3(1.0, 0.28, 0.62) * upper + vec3(1.0, 0.4, 0.85) * hem;
        // Only in the dark: the sunlit sky drowns it.
        float dark = smoothstep(0.08, -0.15, dot(normalize(vPos), uSun));
        float I = strength * (0.4 + 0.6 * curtain) * rays * bottomEdge * dark * uOpacity;
        gl_FragColor = vec4(col * I * 2.6, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true, side: DoubleSide,
  });
  const mesh = new Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;

  const glowGeo = new BufferGeometry();
  glowGeo.setAttribute('position', new BufferAttribute(new Float32Array(glowPos), 3));
  glowGeo.setAttribute('aur', new BufferAttribute(new Float32Array(glowAttr), 3));
  glowGeo.setIndex(glowIndex);
  const glowMaterial = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aur; // strength, across the band (-1 equatorward .. 1 poleward), place along the oval
      varying vec3 vAur; varying vec3 vPos;
      void main() { vAur = aur; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime, uOpacity;
      uniform vec3 uSun;
      varying vec3 vAur; varying vec3 vPos;
      void main() {
        float strength = smoothstep(0.05, 0.45, vAur.x);
        float u = vAur.y, s = vAur.z * 720.0;
        // Patchy, drifting veils; brighter along the middle of the band.
        float veil = fbm(vec3(s * 0.06 + uTime * 0.03, u * 1.6, uTime * 0.04));
        float wisps = fbm(vec3(s * 0.25, u * 4.0 - uTime * 0.05, 3.1));
        float across = exp(-u * u * 2.2);
        float I = strength * across * (0.35 + 0.9 * smoothstep(0.35, 0.8, veil)) * (0.75 + 0.5 * wisps);
        // Green in the middle, pink towards the edges where the red of the heights shows.
        vec3 col = mix(vec3(0.25, 1.0, 0.55), vec3(1.0, 0.35, 0.7), smoothstep(0.35, 0.95, abs(u)) * 0.85);
        float dark = smoothstep(0.08, -0.15, dot(normalize(vPos), uSun));
        gl_FragColor = vec4(col * I * dark * uOpacity * 0.55, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true, side: DoubleSide,
  });
  const glow = new Mesh(glowGeo, glowMaterial);
  glow.frustumCulled = false;
  glow.renderOrder = 4;
  mesh.add(glow);
  mesh.visible = false;
  return { mesh, material };
}
