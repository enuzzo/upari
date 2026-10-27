import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three';
import { lonLatToVec } from './astro';

// The falls of the fireballs whose velocity before entry is known (about a third of them):
// a straight streak from about 120 km down to the height where each one burst, along its real
// direction, drawn in the order of the replay. A bright head runs down in a second, then the
// trail fades to a faint line that stays. One of them can be shown falling again and again.

/** date, lat, lon, kt, burst altitude km, speed km/s, vx, vy, vz (Earth-fixed, km/s). */
export type Fireball = [string, number, number, number, number | null, number | null, number | null, number | null, number | null];

const TOP = 1 + 120 / 6371;
const N = 110;

export function createMeteors(list: Fireball[]) {
  // Earth-fixed axes in the scene's frame.
  const ex = lonLatToVec(0, 0), ey = lonLatToVec(90, 0), ez = lonLatToVec(0, 90);
  const falls = list.map((f, i) => ({ f, order: i / Math.max(1, list.length - 1) })).filter(({ f }) => f[6] != null);
  const pos = new Float32Array(falls.length * N * 3), attr = new Float32Array(falls.length * N * 4);
  const b = new Vector3(), d = new Vector3(), p = new Vector3();
  falls.forEach(({ f, order }, k) => {
    lonLatToVec(f[2], f[1], 1 + (f[4] ?? 30) / 6371, b);
    d.set(0, 0, 0).addScaledVector(ex, f[6]!).addScaledVector(ey, f[7]!).addScaledVector(ez, f[8]!).normalize();
    // Back along the path to the top of the atmosphere: |b - d·L| = TOP.
    const bd = b.dot(d);
    const L = Math.min(0.15, bd + Math.sqrt(Math.max(0, bd * bd - b.lengthSq() + TOP * TOP)));
    const size = 1 + Math.log10(1 + f[3] * 10);
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      p.copy(b).addScaledVector(d, -L * (1 - s));
      pos.set([p.x, p.y, p.z], (k * N + i) * 3);
      attr.set([s, order, size, k], (k * N + i) * 4);
    }
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('fall', new BufferAttribute(attr, 4));
  const material = new ShaderMaterial({
    uniforms: {
      uClock: { value: 0 }, uReplay: { value: 13 }, uOpacity: { value: 0 }, uTime: { value: 0 },
      uLoop: { value: -1 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 fall; // along the fall 0 top .. 1 burst, place in the replay, size, index
      uniform float uClock, uReplay, uTime, uLoop, uPixelRatio;
      varying float vGlow, vS;
      void main() {
        // Seconds since this one's moment in the replay; the one shown again loops every 3.5 s.
        float t = abs(fall.w - uLoop) < 0.5 ? mod(uTime, 3.5) : (uClock - fall.y) * uReplay;
        float head = clamp(t / 1.1, 0.0, 1.0);
        float drawn = step(0.0, t) * step(fall.x, head);
        float fade = 0.14 + 0.86 * exp(-max(0.0, t - 1.1) * 0.9);
        vGlow = drawn * (exp(-(head - fall.x) * 7.0) * 1.6 + 0.25) * fade;
        vS = fall.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (2.2 + fall.z * (head - fall.x < 0.03 && head < 1.0 ? 2.5 : 0.6)) * uPixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vGlow, vS;
      void main() {
        float q = length(gl_PointCoord - 0.5) * 2.0;
        float g = exp(-q * q * 3.0) * (1.0 - smoothstep(0.85, 1.0, q));
        vec3 col = mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.95, 0.8), vS);
        gl_FragColor = vec4(col * g * vGlow * uOpacity, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 4;
  points.visible = false;
  /** The index among the falls drawn of the fireball at this position in the list, or -1. */
  const indexOf = (i: number) => falls.findIndex(({ f }) => f === list[i]);
  return { points, material, indexOf };
}
