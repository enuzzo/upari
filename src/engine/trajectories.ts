import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three';
import { DEG, lonLatToVec } from './astro';

// Rockets leaving their pads: an illustrative ascent for each launch, along the azimuth its
// orbit asks for (the inclination of the ISS from Florida goes north-east, a polar orbit from
// California goes south), climbing as it goes downrange. The shape is a sketch, the pad and
// the direction are real.

export interface Launch { lat: number; lon: number; orbit: string; name: string; net: string }

/** Inclination of the orbit each Launch Library abbreviation asks for, degrees (null: due east). */
const INCLINATION: Record<string, number | null> = { SSO: 97.6, PO: 90, LEO: 51.6, ISS: 51.6, MEO: 55, GTO: null, GEO: null, 'Direct-GEO': null, GSTO: null };
/** How high each ends the drawn ascent, planet radii (deep space keeps climbing off the frame). */
const HEIGHT: Record<string, number> = { LEO: 0.08, SSO: 0.11, PO: 0.11, ISS: 0.07, Sub: 0.03, MEO: 0.45, GTO: 0.55, GEO: 0.7, 'Direct-GEO': 0.7, GSTO: 0.55 };

/**
 * Ground track and height of an ascent: returns the point at fraction s (0 pad, 1 end).
 * spread (-1..1, two numbers) turns the azimuth by a few degrees and the height by a few tenths,
 * so many launches from one pad fan out instead of drawing one line a hundred times.
 */
export function ascent(l: Launch, spread: [number, number] = [0, 0]) {
  const phi = l.lat * DEG;
  const inc = INCLINATION[l.orbit] ?? (l.orbit in HEIGHT ? null : 28);
  let az = 90 * DEG;
  // Vandenberg cannot launch eastwards over land: its low orbits leave southwards.
  const vandenberg = Math.abs(l.lat - 34.7) < 0.3 && Math.abs(l.lon + 120.6) < 0.3;
  if (vandenberg && (l.orbit === 'LEO' || l.orbit === 'SSO' || l.orbit === 'PO')) az = 192 * DEG;
  else if (inc != null) {
    const x = Math.cos(inc * DEG) / Math.cos(phi);
    if (Math.abs(x) <= 1) {
      const b = Math.asin(x);
      // Prograde orbits leave towards the east side; retrograde (polar, sun-synchronous) southwards.
      az = inc > 90 ? Math.PI - b : b;
      if (inc >= 90 && phi < 0) az = b; // from the southern hemisphere, polar launches go north
    }
  }
  az += spread[0] * 5 * DEG;
  const h = (HEIGHT[l.orbit] ?? 0.9) * (1 + spread[1] * 0.25);
  const range = (h > 0.3 ? 32 : 22) * DEG; // downrange angle of the drawn part
  const p0 = lonLatToVec(l.lon, l.lat, 1);
  const north = new Vector3(0, 1, 0).sub(p0.clone().multiplyScalar(p0.y)).normalize();
  const east = new Vector3().crossVectors(north, p0).normalize();
  const dir = north.clone().multiplyScalar(Math.cos(az)).add(east.multiplyScalar(Math.sin(az))).normalize();
  return (s: number, out = new Vector3()) => {
    const a = range * s;
    out.copy(p0).multiplyScalar(Math.cos(a)).addScaledVector(dir, Math.sin(a)).normalize();
    // Steep at first, then flattening into orbit (or climbing on for higher ones).
    const climb = h > 0.3 ? Math.pow(s, 1.6) : 1 - Math.pow(1 - s, 2.2);
    return out.multiplyScalar(1.003 + h * climb);
  };
}

/**
 * together: every ascent leaves at the same moment (a whole year lifting off at once), slower
 * and fainter each, so hundreds of them add up instead of burning white.
 */
export function createTrajectories(launches: Launch[], together = false) {
  const N = 160;
  const pos = new Float32Array(launches.length * N * 3), attr = new Float32Array(launches.length * N * 2);
  const v = new Vector3();
  launches.forEach((l, k) => {
    const at = ascent(l, together ? [((k * 0.754877) % 1) * 2 - 1, ((k * 0.569840) % 1) * 2 - 1] : [0, 0]);
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      at(s, v);
      pos.set([v.x, v.y, v.z], (k * N + i) * 3);
      attr.set([s, together ? ((k * 0.618) % 1) * 0.06 : (k * 0.37) % 1], (k * N + i) * 2);
    }
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('trail', new BufferAttribute(attr, 2));
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      uSpeed: { value: together ? 0.085 : 0.12 }, uGain: { value: together ? 0.24 : 1 }, uTogether: { value: together ? 1 : 0 },
    },
    vertexShader: /* glsl */ `
      attribute vec2 trail; // along the ascent 0..1, phase
      uniform float uTime, uPixelRatio, uSpeed, uGain, uTogether;
      varying float vGlow, vS;
      void main() {
        float head = fract(uTime * uSpeed + trail.y);
        float behind = head - trail.x;
        // A bright head with a fading plume; the whole path stays faintly drawn (together: only
        // what has been flown so far, so the year rises from the ground).
        float path = uTogether > 0.5 ? (behind >= 0.0 ? 0.25 : 0.0) : 0.4;
        vGlow = (path + (behind >= 0.0 ? exp(-behind * 9.0) * 2.2 : 0.0)) * uGain;
        // Ignition: a flash on the pad as each one leaves.
        vGlow += uTogether * exp(-head * 40.0) * step(trail.x, 0.02) * 0.2;
        vS = trail.x;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        // Together, smaller heads: a hundred of them on one pad must not merge into one blot.
        gl_PointSize = (behind >= 0.0 && behind < 0.02 ? (uTogether > 0.5 ? 6.0 : 10.0) : 3.6) * uPixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vGlow, vS;
      void main() {
        float q = length(gl_PointCoord - 0.5) * 2.0;
        float g = exp(-q * q * 3.0) * (1.0 - smoothstep(0.85, 1.0, q));
        vec3 col = mix(vec3(1.0, 0.62, 0.28), vec3(1.0, 0.95, 0.85), vS);
        gl_FragColor = vec4(col * g * vGlow * uOpacity, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 4;
  points.visible = false;
  return { points, material };
}
