import { BufferAttribute, BufferGeometry, CustomBlending, MaxEquation, OneFactor, Points, ShaderMaterial, Vector3 } from 'three';
import { lonLatToVec } from './astro';
import { hexToLinear } from './palettes';
import { t } from '../i18n';
import { dayShort, num } from '../i18n/format';
import { fresh } from './fresh';

// Things that happen in places: cyclones and their tracks, erupting volcanoes, icebergs,
// oil slicks, launch pads and fireballs. Each set is a cloud of glowing dots on the globe,
// revealed in the order of their time when the story replays them; the cursor reads them.

export type SpotId = 'cyclones' | 'volcanoes' | 'icebergs' | 'slicks' | 'launches' | 'launchyear' | 'fireballs';

export interface Spot {
  lon: number;
  lat: number;
  /** Diameter in CSS pixels. */
  size: number;
  color: string;
  /** Place in the replay, 0 (first) .. 1 (last). */
  order: number;
  /** Pulses with a ring: the current or the most important ones. */
  pulse?: boolean;
  /** What the cursor reads. */
  text: () => string;
  sub: () => string;
}

export interface SpotSet {
  id: SpotId;
  points: Points;
  material: ShaderMaterial;
  spots: Spot[];
  /** Raw file, for the stories (counts, the strongest, the next one). */
  data: any;
}

const kmh = (kt: number) => kt * 1.852;
const sqrt = Math.sqrt;

/** How each file becomes dots. */
const BUILD: Record<SpotId, (d: any) => Spot[]> = {
  cyclones(d) {
    const out: Spot[] = [];
    const times = d.list.flatMap((s: any) => s.track.map((p: any) => Date.parse(p[0])));
    const t0 = Math.min(...times), t1 = Math.max(...times);
    for (const s of d.list) {
      s.track.forEach((p: [string, number, number, number | null], i: number) => {
        const wind = p[3] ?? 25, last = i === s.track.length - 1;
        // From a breath of cyan to the magenta of the strongest storms.
        const k = Math.min(1, Math.max(0, (wind - 30) / 110));
        out.push({
          lon: p[2], lat: p[1], size: (last ? 16 : 5) + wind / (last ? 6 : 14), order: (Date.parse(p[0]) - t0) / Math.max(1, t1 - t0),
          color: k < 0.5 ? (k < 0.2 ? '#7fe0ff' : '#b7a6ff') : k < 0.8 ? '#ff7ad9' : '#ff3fa4', pulse: last,
          text: () => s.name ? t.spots.cyclone(s.name) : t.spots.cycloneUnnamed,
          sub: () => t.spots.cycloneSub(num(kmh(wind)), dayShort(p[0])),
        });
      });
    }
    return out;
  },
  volcanoes: (d) => d.list.map((v: any) => ({
    lon: v.lon, lat: v.lat, size: 14, color: '#ff6a2a', order: 0, pulse: true,
    text: () => v.name, sub: () => t.spots.eruption(String(v.since).slice(0, 4)),
  })),
  icebergs: (d) => d.list.map((b: any) => ({
    lon: b.lon, lat: b.lat, size: 5 + sqrt(b.km2) / 3, color: '#dff4ff', order: 0,
    text: () => t.spots.iceberg(b.name), sub: () => t.spots.icebergSub(num(b.km2), num(b.lengthNm * 1.852)),
  })),
  slicks(d) {
    const t0 = Date.parse(d.list[0]?.[3] ?? 0), t1 = Date.parse(d.list.at(-1)?.[3] ?? 0);
    return d.list.map((s: [number, number, number, string]) => ({
      lon: s[1], lat: s[0], size: 3.5 + sqrt(s[2]) * 1.6, color: s[2] > 10 ? '#d48bff' : '#7fd6d0', order: (Date.parse(s[3]) - t0) / Math.max(1, t1 - t0),
      text: () => t.spots.slick(num(s[2], s[2] < 10 ? 1 : 0)), sub: () => t.spots.slickSub(dayShort(s[3])),
    }));
  },
  launches(d) {
    // One dot per pad: its next launch.
    const pads = new Map<string, any>();
    for (const l of d.launches) if (!pads.has(l.pad)) pads.set(l.pad, l);
    return [...pads.values()].map((l) => ({
      lon: l.lon, lat: l.lat, size: 13, color: '#fff1d6', order: 0, pulse: true,
      text: () => l.name, sub: () => t.spots.launch(dayShort(l.net), l.place || l.pad),
    }));
  },
  launchyear(d) {
    // Every launch of the last twelve months, flashing on its pad in the order they flew.
    const list = d.past as { lat: number; lon: number; name: string; net: string; place: string; pad: string }[];
    const t0 = Date.parse(list[0]?.net ?? '0'), t1 = Date.parse(list.at(-1)?.net ?? '0');
    return list.map((l) => ({
      lon: l.lon, lat: l.lat, size: 9, color: '#ffc98a', order: (Date.parse(l.net) - t0) / Math.max(1, t1 - t0),
      text: () => l.name, sub: () => t.spots.launch(dayShort(l.net), l.place || l.pad),
    }));
  },
  fireballs(d) {
    const n = d.list.length;
    return d.list.map((f: [string, number, number, number, number | null, number | null], i: number) => ({
      lon: f[2], lat: f[1], size: 4 + 4 * Math.log10(1 + f[3] * 20), color: f[3] > 1 ? '#fff3b0' : '#ffd27a', order: i / Math.max(1, n - 1), pulse: f[3] > 5,
      text: () => t.spots.fireball(num(f[3], f[3] < 1 ? 2 : 1)), sub: () => t.spots.fireballSub(dayShort(f[0].replace(' ', 'T') + 'Z'), f[4] == null ? null : num(f[4])),
    }));
  },
};

const FILES: Record<SpotId, string> = {
  cyclones: 'layers/cyclones.json', volcanoes: 'layers/volcanoes.json', icebergs: 'layers/icebergs.json',
  slicks: 'layers/slicks.json', launches: 'sky/launches.json', launchyear: 'sky/launches.json', fireballs: 'sky/fireballs.json',
};

function createSet(id: SpotId, spots: Spot[], data: any): SpotSet {
  const n = spots.length;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), attr = new Float32Array(n * 4);
  const v = new Vector3();
  spots.forEach((s, i) => {
    lonLatToVec(s.lon, s.lat, 1.001, v);
    pos.set([v.x, v.y, v.z], i * 3);
    col.set(hexToLinear(s.color), i * 3);
    attr.set([s.size, s.order, s.pulse ? 1 : 0, Math.random()], i * 4);
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('tint', new BufferAttribute(col, 3));
  geo.setAttribute('spot', new BufferAttribute(attr, 4));
  const material = new ShaderMaterial({
    uniforms: { uClock: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: /* glsl */ `
      attribute vec3 tint;
      attribute vec4 spot; // size px, order 0..1, pulse, random
      uniform float uClock, uTime, uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha, vPulse, vRing, vFresh;
      void main() {
        float since = uClock - spot.y;
        vec3 toCam = normalize(cameraPosition - position);
        vAlpha = step(0.0, since) * smoothstep(0.0, 0.2, dot(normalize(position), toCam));
        vFresh = since >= 0.0 && uClock < 0.999 ? exp(-since * 40.0) : 0.0;
        vPulse = spot.z;
        vRing = fract(uTime * 0.4 + spot.w);
        vColor = tint;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        // Closer, a little larger, never enormous.
        float zoom = clamp(2.6 / max(-mv.z, 0.2), 0.7, 2.2);
        gl_PointSize = vAlpha > 0.0 ? min(spot.x * zoom * (1.0 + vPulse * 1.6 + vFresh * 1.5), 72.0) * uPixelRatio : 0.0;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha, vPulse, vRing, vFresh;
      void main() {
        float grow = 1.0 + vPulse * 1.6 + vFresh * 1.5;
        float q = length(gl_PointCoord - 0.5) * 2.0;
        float core = exp(-pow(q * grow, 2.0) * 2.4);
        float ring = vPulse * exp(-pow((q - vRing * 0.9) / 0.05, 2.0)) * (1.0 - vRing) * 0.8;
        float edge = 1.0 - smoothstep(0.85, 1.0, q);
        gl_FragColor = vec4(vColor * (core * 1.4 + ring + vFresh * exp(-q * q * 5.0)) * edge * vAlpha * uOpacity, 1.0);
      }`,
    // As for the earthquakes: max blending and no depth test (the facing test hides the far side).
    blending: CustomBlending, blendEquation: MaxEquation, blendSrc: OneFactor, blendDst: OneFactor,
    depthWrite: false, depthTest: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 3;
  points.visible = false;
  return { id, points, material, spots, data };
}

const cache = new Map<SpotId, Promise<SpotSet>>();

export function loadSpots(id: SpotId): Promise<SpotSet> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(fresh(FILES[id])).then((r) => { if (!r.ok) throw new Error(`${FILES[id]}: ${r.status}`); return r.json(); })
      .then((d) => createSet(id, BUILD[id](d), d));
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

/** The nearest dot already shown within `km` of a place. */
export function nearestSpot(set: SpotSet, lon: number, lat: number, km: number, clock = 1): Spot | null {
  const p = lonLatToVec(lon, lat), q = new Vector3();
  let best: Spot | null = null, bestDot = Math.cos(km / 6371);
  for (const s of set.spots) {
    if (s.order > clock || Math.abs(s.lat - lat) > km / 100) continue;
    const d = lonLatToVec(s.lon, s.lat, 1, q).dot(p);
    if (d > bestDot) { bestDot = d; best = s; }
  }
  return best;
}
