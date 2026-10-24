import type { Globe } from '../engine/globe';
import { DATA, type DataId } from '../engine/layers';
import { Sampler } from '../engine/layers';

export interface Extreme { lon: number; lat: number; value: number }

const cache = new Map<string, Promise<unknown>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as Promise<T>;
}

async function samplerFor(globe: Globe, id: DataId) {
  const { sampler, meta } = await globe.layers.get(id);
  return { s: sampler[0], meta };
}

/** Scan a layer on a coarse grid, weighting by cell area. */
async function scan(globe: Globe, id: DataId, visit: (lon: number, lat: number, value: number, area: number) => void, step = 0.5, latMax = 80) {
  const { s, meta } = await samplerFor(globe, id);
  const land = await landSampler(globe);
  const def = DATA[id];
  for (let lat = -latMax; lat <= latMax; lat += step) {
    const area = Math.cos(lat * Math.PI / 180);
    for (let lon = -180; lon < 180; lon += step) {
      if (def.style[2] === 1 && land.read(lon, lat)[0] > 0.503) continue;
      const [r, g] = s.read(lon, lat);
      if (g < 0.5) continue;
      visit(lon, lat, def.decode(r, meta), area);
    }
  }
}

let land: Promise<Sampler> | null = null;
function landSampler(globe: Globe): Promise<Sampler> {
  land ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(Sampler.fromImage(img, 1440));
    img.src = 'earth/relief-4k.webp';
  });
  void globe;
  return land;
}

export const stats = {
  windiest: (globe: Globe) => once('windiest', async () => {
    await globe.loadFlow('wind');
    const f = globe.flowSampler('wind')!;
    let best: Extreme = { lon: 0, lat: 0, value: 0 };
    for (let lat = -70; lat <= 70; lat += 0.5) for (let lon = -180; lon < 180; lon += 0.5) {
      const [r, g] = f.s.read(lon, lat);
      const kmh = Math.hypot((r - 0.5) * 2 * f.scale, (g - 0.5) * 2 * f.scale) * 3.6;
      if (kmh > best.value) best = { lon, lat, value: kmh };
    }
    return best;
  }),
  hottestSea: (globe: Globe) => once('hottest', async () => {
    let best: Extreme = { lon: 0, lat: 0, value: -99 };
    await scan(globe, 'sst', (lon, lat, v) => { if (v > best.value) best = { lon, lat, value: v }; }, 0.5, 60);
    return best;
  }),
  warmShare: (globe: Globe) => once('warm', async () => {
    let warm = 0, all = 0;
    const step = 0.5, grid = new Map<string, number>();
    const key = (lon: number, lat: number) => `${Math.round(lon / step)}:${Math.round(lat / step)}`;
    await scan(globe, 'anomaly', (lon, lat, v, a) => {
      all += a; if (v > 0) warm += a;
      if (Math.abs(lat) < 65) grid.set(key(lon, lat), v);
    }, step, 75);
    // The colormap saturates at +3 °C, so many cells tie: pick the heart of the
    // widest hot patch, not the first saturated pixel met by the scan.
    let max = -Infinity;
    for (const v of grid.values()) max = Math.max(max, v);
    let best: Extreme = { lon: 0, lat: 0, value: max };
    let bestScore = -Infinity;
    for (const [k, v] of grid) {
      if (v < max - 0.05) continue;
      const [i, j] = k.split(':').map(Number);
      let sum = 0;
      for (let di = -3; di <= 3; di++) for (let dj = -3; dj <= 3; dj++) sum += grid.get(`${i + di}:${j + dj}`) ?? 0;
      if (sum > bestScore) { bestScore = sum; best = { lon: i * step, lat: j * step, value: max }; }
    }
    return { share: all ? warm / all : 0.5, hottest: best };
  }),
  arcticIce: (globe: Globe) => once('ice', async () => {
    const { s, meta } = await samplerFor(globe, 'ice');
    let north = 0, south = 0;
    const step = 0.25, cell = (6371 * step * Math.PI / 180) ** 2;
    for (let lat = -89.875; lat < 90; lat += step) {
      const k = Math.cos(lat * Math.PI / 180) * cell;
      for (let lon = -180; lon < 180; lon += step) {
        const [r, g] = s.read(lon, lat);
        if (g < 0.5) continue;
        const c = DATA.ice.decode(r, meta) / 100;
        if (c < 0.15) continue;
        if (lat > 0) north += c * k; else south += c * k;
      }
    }
    return { north, south };
  }),
  greenest: (globe: Globe) => once('green', async () => {
    let best: Extreme = { lon: 0, lat: 0, value: 0 };
    await scan(globe, 'chlorophyll', (lon, lat, v) => { if (v > best.value && v < 60) best = { lon, lat, value: v }; }, 0.75, 70);
    return best;
  }),
};

export function formatLonLat(lon: number, lat: number): string {
  const la = `${Math.abs(Math.round(lat))}° ${lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(Math.round(lon))}° ${lon >= 0 ? 'E' : 'O'}`;
  return `${la}, ${lo}`;
}
