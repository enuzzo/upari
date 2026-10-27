import { AdditiveBlending, BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector3, DoubleSide } from 'three';
import { lonLatToVec } from './astro';
import { noiseGLSL } from './glsl';

// The aurora as it is seen from space: curtains of light standing on the oval that NOAA's
// OVATION model forecasts for the next half hour. Where and how bright come from the data;
// the shape and the colours from the physics: oxygen glows green (557.7 nm) between about
// 100 and 150 km and red (630 nm) higher up, nitrogen puts a pink and violet hem at the
// bottom; the curtains fold and ripple slowly. Only the night side shows them.

const R_EARTH_KM = 6371;
const BOTTOM = 1 + 95 / R_EARTH_KM, TOP = 1 + 320 / R_EARTH_KM;

/** read(lon, lat) → probability 0..1 of seeing an aurora there (the OVATION grid). */
export function createAuroraCurtains(read: (lon: number, lat: number) => number) {
  const pos: number[] = [], attr: number[] = [], index: number[] = [];
  // Two ovals; along each, for every longitude, the latitude where the aurora is strongest.
  for (const north of [true, false]) {
    const ring: { lat: number; p: number }[] = [];
    for (let i = 0; i < 720; i++) {
      const lon = -180 + i * 0.5;
      let best = 0, sumW = 0, sumLat = 0;
      for (let k = 0; k <= 40; k++) {
        const lat = (north ? 1 : -1) * (48 + k);
        const p = read(lon, lat);
        if (p > best) best = p;
        if (p > 0.08) { sumW += p * p; sumLat += lat * p * p; }
      }
      ring.push({ lat: sumW ? sumLat / sumW : (north ? 67 : -67), p: best });
    }
    // Smooth along the oval so the curtain flows instead of jumping cell to cell.
    const smooth = ring.map((_, i) => {
      let lat = 0, p = 0, w = 0;
      for (let k = -6; k <= 6; k++) { const r = ring[(i + k + 720) % 720], g = Math.exp(-(k * k) / 18); lat += r.lat * g; p += r.p * g; w += g; }
      return { lat: lat / w, p: p / w };
    });
    const base = pos.length / 3;
    const v = new Vector3();
    smooth.forEach((r, i) => {
      const lon = -180 + i * 0.5;
      for (const [h, top] of [[BOTTOM, 0], [TOP, 1]] as const) {
        lonLatToVec(lon, r.lat, h, v);
        pos.push(v.x, v.y, v.z);
        attr.push(r.p, top, i / 720);
      }
    });
    for (let i = 0; i < 720; i++) {
      const a = base + i * 2, b = base + ((i + 1) % 720) * 2;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('aur', new BufferAttribute(new Float32Array(attr), 3));
  geo.setIndex(index);
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uSun: { value: new Vector3(1, 0, 0) } },
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
        float strength = smoothstep(0.08, 0.5, vAur.x);
        float h = vAur.y, s = vAur.z * 720.0;
        // Rays and folds: fine vertical rays, broader folds that drift along the oval.
        float folds = fbm(vec3(s * 0.035, uTime * 0.05, 1.7));
        float rays = pow(0.25 + 0.75 * fbm(vec3(s * 1.1 + folds * 6.0, h * 0.5, uTime * 0.15)), 1.6) * 1.6;
        float curtain = smoothstep(0.35, 0.7, folds + 0.25 * sin(s * 0.08 + uTime * 0.2));
        // Light from the bottom up: a sharp lower edge, a long fading top.
        float bottomEdge = smoothstep(0.0, 0.06, h);
        float green = exp(-pow((h - 0.16) / 0.13, 2.0));
        float red = exp(-pow((h - 0.62) / 0.3, 2.0)) * 0.12;
        float hem = exp(-pow((h - 0.03) / 0.035, 2.0)) * smoothstep(0.35, 0.75, vAur.x);
        vec3 col = vec3(0.22, 1.0, 0.45) * green + vec3(1.0, 0.18, 0.28) * red + vec3(0.95, 0.35, 0.85) * hem;
        // Only in the dark: the sunlit sky drowns it.
        float dark = smoothstep(0.08, -0.15, dot(normalize(vPos), uSun));
        float I = strength * (0.35 + 0.65 * curtain) * rays * bottomEdge * dark * uOpacity;
        gl_FragColor = vec4(col * I * 3.0, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true, side: DoubleSide,
  });
  const mesh = new Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  mesh.visible = false;
  return { mesh, material };
}
