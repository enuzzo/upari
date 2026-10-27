import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three';
import { hexToLinear } from './palettes';

// Every active satellite, moved on the GPU from its mean orbital elements (CelesTrak OMM):
// a Kepler orbit with the secular drift of the node and the perigee caused by the Earth's
// bulge (J2). Good to a few kilometres to tens of kilometres within days of the elements,
// which is what a picture of the whole sky needs; the ISS keeps its full SGP4 elsewhere.

export interface SatMeta {
  count: number;
  base: string;
  kinds: { other: number; starlink: number; constellations: number; navigation: number; geostationary: number; stations: number };
  source: string;
  fetched: string;
}

/** Colours by kind: other, Starlink, other constellations, navigation, geostationary, stations. */
const KIND = ['#a8bedf', '#7fd8ff', '#b4a3ff', '#ffd27a', '#ff9f6b', '#ffffff'];
/** μ in Earth radii³ per minute². */
const MU = (398600.4418 * 3600) / 6378.137 ** 3;

export async function loadSatellites() {
  const [meta, buf] = await Promise.all([
    fetch('sky/satellites.json').then((r) => { if (!r.ok) throw new Error('no satellites'); return r.json() as Promise<SatMeta>; }),
    fetch('sky/satellites.bin').then((r) => { if (!r.ok) throw new Error('no satellites'); return r.arrayBuffer(); }),
  ]);
  const el = new Float32Array(buf);
  const n = el.length / 8;
  const a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 4), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a0.set(el.subarray(i * 8, i * 8 + 4), i * 4);
    a1.set(el.subarray(i * 8 + 4, i * 8 + 8), i * 4);
    col.set(hexToLinear(KIND[el[i * 8 + 7]] ?? KIND[0]), i * 3);
  }
  const geo = new BufferGeometry();
  // three needs a position attribute; the real one is computed in the shader.
  geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('el0', new BufferAttribute(a0, 4));
  geo.setAttribute('el1', new BufferAttribute(a1, 4));
  geo.setAttribute('tint', new BufferAttribute(col, 3));
  const material = new ShaderMaterial({
    uniforms: {
      uMinutes: { value: 0 }, uGmst: { value: 0 }, uSun: { value: new Vector3(1, 0, 0) }, uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(devicePixelRatio, 2) }, uMu: { value: MU },
    },
    vertexShader: /* glsl */ `
      attribute vec4 el0; // a (Earth radii), e, i, node
      attribute vec4 el1; // argument of perigee, mean anomaly at epoch, epoch (minutes from base), kind
      attribute vec3 tint;
      uniform float uMinutes, uGmst, uMu, uPixelRatio;
      uniform vec3 uSun;
      varying vec3 vColor;
      varying float vLit;
      const float J2 = 1.08263e-3;
      void main() {
        float a = el0.x, e = el0.y, inc = el0.z;
        float n = sqrt(uMu / (a * a * a));
        float p = a * (1.0 - e * e);
        float dt = uMinutes - el1.z;
        float k = J2 / (p * p) * n;
        float node = el0.w - 1.5 * k * cos(inc) * dt;
        float argp = el1.x + 0.75 * k * (5.0 * cos(inc) * cos(inc) - 1.0) * dt;
        float M = mod(el1.y + n * dt, 6.2831853);
        float E = M;
        for (int j = 0; j < 6; j++) E = M + e * sin(E);
        vec2 q = a * vec2(cos(E) - e, sqrt(1.0 - e * e) * sin(E));
        // Perifocal → inertial (z north) → Earth-fixed → the scene (lon 0 +X, north +Y, 90° E −Z).
        float co = cos(argp), so = sin(argp), cn = cos(node), sn = sin(node), ci = cos(inc), si = sin(inc);
        vec3 r = vec3(
          (cn * co - sn * so * ci) * q.x + (-cn * so - sn * co * ci) * q.y,
          (sn * co + cn * so * ci) * q.x + (-sn * so + cn * co * ci) * q.y,
          (so * si) * q.x + (co * si) * q.y);
        float cg = cos(uGmst), sg = sin(uGmst);
        vec3 f = vec3(cg * r.x + sg * r.y, -sg * r.x + cg * r.y, r.z);
        vec3 pos = vec3(f.x, f.z, -f.y);
        // In the Earth's shadow a satellite goes dark, as it does to the eye.
        float b = dot(pos, uSun);
        float axis = sqrt(max(dot(pos, pos) - b * b, 0.0));
        vLit = b > 0.0 ? 1.0 : smoothstep(0.98, 1.02, axis);
        vColor = tint;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        // Stations largest; the few navigation and geostationary satellites a little larger than the crowd.
        float big = el1.w > 4.5 ? 3.0 : el1.w > 2.5 ? 1.8 : 1.0;
        gl_PointSize = clamp(5.0 * big / max(-mv.z, 1.0) * 3.0, 1.5 * big, 7.0 * big) * uPixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vLit;
      void main() {
        float q = length(gl_PointCoord - 0.5) * 2.0;
        float g = exp(-q * q * 3.5) * (1.0 - smoothstep(0.8, 1.0, q));
        gl_FragColor = vec4(vColor * g * (0.25 + 0.75 * vLit) * uOpacity * 1.2, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 4;
  points.visible = false;
  return { points, material, meta, base: Date.parse(meta.base) };
}
