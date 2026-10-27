import type { Globe } from '../engine/globe';
import { DATA, type DataId } from '../engine/layers';
import { PALETTES } from '../engine/palettes';
import { legend, signed, titled, type Chapter } from './chapters';
import { loadCountries, placeBelow } from './geo';
import { climate } from './charts';
import { loadSpots } from '../engine/spots';
import { seaName } from './places';
import { t } from '../i18n';
import { dayMonth, month, monthYear, num } from '../i18n/format';

// The third story: the living planet, from monthly satellite series and the forest record.

const monthOf = (iso: string) => month(iso.slice(0, 10));
const monthYearOf = (iso: string) => monthYear(iso.slice(0, 10));
const LOOK = { sun: 'studio' as const, clouds: 0, night: 0, atmo: 0.8 };

/** Area-weighted scan of one frame of a series; visit gets the decoded value. */
async function scanFrames(g: Globe, id: DataId, box: [number, number, number, number], visit: (frame: number, v: number, area: number, lon: number, lat: number) => void, step = 1) {
  const { sampler, meta } = await g.layers.get(id);
  const [lon0, lat0, lon1, lat1] = box;
  sampler.forEach((s, f) => {
    for (let lat = lat0; lat <= lat1; lat += step) {
      const area = Math.cos((lat * Math.PI) / 180);
      for (let lon = lon0; lon < lon1; lon += step) {
        const [r, c] = s.read(lon, lat);
        if (c < 0.5) continue;
        visit(f, DATA[id].decode(r, meta), area, lon, lat);
      }
    }
  });
  return meta;
}

async function greenSeasons(g: Globe) {
  const green = new Float64Array(16), all = new Float64Array(16);
  const meta = await scanFrames(g, 'ndvi', [-180, 30, 180, 65], (f, v, a) => { all[f] += a; if (v > 0.5) green[f] += a; });
  const share = Array.from(meta.frames!, (_, f) => (all[f] ? green[f] / all[f] : 0));
  const hi = share.indexOf(Math.max(...share)), lo = share.indexOf(Math.min(...share));
  return { meta, share, hi, lo };
}

async function haziest(g: Globe) {
  let best = { v: 0, lon: 0, lat: 0, frame: 0 };
  const sum = new Float64Array(16), area = new Float64Array(16);
  const meta = await scanFrames(g, 'aerosol', [-180, -60, 180, 70], (f, v, a, lon, lat) => {
    sum[f] += v * a; area[f] += a;
    if (v > best.v) best = { v, lon, lat, frame: f };
  }, 1);
  const mean = Array.from(meta.frames!, (_, f) => (area[f] ? sum[f] / area[f] : 0));
  return { meta, best, worstMonth: mean.indexOf(Math.max(...mean)) };
}

async function reefStress(g: Globe) {
  const alert = new Float64Array(16), severe = new Float64Array(16), all = new Float64Array(16);
  const meta = await scanFrames(g, 'coral', [-180, -30, 180, 30], (f, v, a) => {
    all[f] += a;
    if (v >= 4) alert[f] += a;
    if (v >= 8) severe[f] += a;
  }, 0.5);
  const n = meta.frames!.length;
  const share = (arr: Float64Array, f: number) => (all[f] ? arr[f] / all[f] : 0);
  let peak = 0;
  for (let f = 0; f < n; f++) if (share(alert, f) > share(alert, peak)) peak = f;
  return { meta, last: n - 1, alertNow: share(alert, n - 1), severeNow: share(severe, n - 1), peak, alertPeak: share(alert, peak) };
}

/** One degree of latitude, in km. */
const KM_DEG = 111.32;

/** Snow seen on the northern lands (30°–75° N), month by month, in million km². */
async function snowSeasons(g: Globe) {
  const area = new Float64Array(16);
  const meta = await scanFrames(g, 'snow', [-180, 30, 180, 75], (f, v, a) => { if (v > 20) area[f] += a * KM_DEG * KM_DEG; }, 1);
  const mkm2 = Array.from(meta.frames!, (_, f) => area[f] / 1e6);
  const hi = mkm2.indexOf(Math.max(...mkm2));
  return { meta, mkm2, hi, now: mkm2.length - 1 };
}

/** The ozone hole: area below 220 Dobson units south of 40° S, and the thinnest point. */
async function ozoneHole(g: Globe) {
  const area = new Float64Array(16), low = Array.from({ length: 16 }, () => Infinity);
  const meta = await scanFrames(g, 'ozone', [-180, -90, 180, -40], (f, v, a) => {
    if (v < 220) area[f] += a * KM_DEG * KM_DEG;
    low[f] = Math.min(low[f], v);
  }, 1);
  const mkm2 = Array.from(meta.frames!, (_, f) => area[f] / 1e6);
  const peak = mkm2.indexOf(Math.max(...mkm2));
  return { meta, mkm2, low, peak, now: mkm2.length - 1 };
}

/** Where the air carries the most nitrogen dioxide in the latest frame. */
async function dirtiest(g: Globe) {
  const per: { v: number; lon: number; lat: number }[] = [];
  const meta = await scanFrames(g, 'no2', [-180, -60, 180, 72], (f, v, _a, lon, lat) => {
    if (v > (per[f]?.v ?? 0)) per[f] = { v, lon, lat };
  }, 0.5);
  return { meta, best: per[meta.frames!.length - 1] ?? { v: 0, lon: 0, lat: 0 } };
}

async function slickStats() {
  const d = (await loadSpots('slicks')).data as { list: [number, number, number, string][]; fetched: string };
  const km2 = d.list.reduce((s, x) => s + x[2], 0);
  // The sea with the most slicks.
  const seas = new Map<string, number>();
  for (const s of d.list) { const k = seaName(s[1], s[0]); seas.set(k, (seas.get(k) ?? 0) + 1); }
  const top = [...seas.entries()].sort((a, b) => b[1] - a[1])[0];
  return { count: d.list.length, km2, top: top?.[0] ?? '', topCount: top?.[1] ?? 0, fetched: d.fetched };
}

async function forestMeta() {
  return (await fetch('layers/forest.json')).json() as Promise<{ peak: number; share: number[]; first: number; last: number }>;
}

export const NATURE: Chapter[] = titled([
  {
    id: 'verde',
    mood: 'open', sound: 'forest',
    look: { ...LOOK, data: 'ndvi', dim: 0.35, desat: 0.65 },
    duration: 23, clock: 'data',
    legend: legend(PALETTES.ndvi, 'ndvi'),
    narrate: async (g) => {
      const { meta, share, hi, lo } = await greenSeasons(g);
      const f = meta.frames!;
      return t.verde.narrate({ hi: num(share[hi] * 100), hiMonth: monthOf(f[hi].time), lo: num(share[lo] * 100), loMonth: monthOf(f[lo].time) });
    },
    detail: async (g) => {
      const { meta, share, hi, lo } = await greenSeasons(g);
      const f = meta.frames!;
      return {
        facts: [
          { value: `${num(share[hi] * 100)}%`, label: t.verde.dense(monthYearOf(f[hi].time)) },
          { value: `${num(share[lo] * 100)}%`, label: t.verde.sparse(monthYearOf(f[lo].time)) },
          { value: t.verde.months(f.length), label: t.verde.span(monthYearOf(f[0].time), monthYearOf(f[f.length - 1].time)) },
        ],
        text: t.verde.text,
        source: t.verde.source,
      };
    },
    beats: async () => [{ shot: { lon: 20, lat: 35, dist: 3.2 }, drift: 1.4 }],
  },
  {
    id: 'carbonio',
    mood: 'curious',
    look: { ...LOOK, dim: 0.62, desat: 0.6 },
    duration: 24, chart: 'co2',
    narrate: async () => {
      const d = await climate.co2();
      return t.carbonio.narrate({ then: num(d.first.ppm, 0), now: num(d.last.ppm, 1) });
    },
    detail: async () => {
      const d = await climate.co2();
      return {
        facts: [
          { value: `${num(d.last.ppm, 1)} ppm`, label: t.carbonio.now(dayMonth(d.last.date)) },
          { value: `${signed(d.last.ppm - d.yearAgo.ppm, 1)} ppm`, label: t.carbonio.year },
          { value: '≈ 280 ppm', label: t.carbonio.preindustrial },
        ],
        text: t.carbonio.text,
        source: t.carbonio.source,
      };
    },
    beats: async () => [{ shot: { lon: 30, lat: 48, dist: 4.4 }, drift: 1.0 }],
  },
  {
    id: 'foreste',
    mood: 'grave', sound: 'forest',
    look: { ...LOOK, data: 'forest', dim: 0.55, desat: 0.85, years: [2001, 2024], yearSeconds: 18, bloom: 1.3 },
    duration: 24, clock: 'year',
    legend: legend(PALETTES.forest, 'forest'),
    narrate: async () => t.foreste.narrate((await forestMeta()).peak),
    detail: async () => {
      const m = await forestMeta();
      const recent = m.share.slice(-5).reduce((a, b) => a + b, 0), early = m.share.slice(0, 5).reduce((a, b) => a + b, 0);
      return {
        facts: [
          { value: String(m.peak), label: t.foreste.peak },
          { value: `${num(recent * 100)}%`, label: t.foreste.recent(m.last - 4, m.last) },
          { value: `${num(early * 100)}%`, label: t.foreste.early(m.first, m.first + 4) },
        ],
        text: t.foreste.text,
        source: t.foreste.source,
      };
    },
    beats: async () => [{ shot: { lon: -58, lat: -6, dist: 2.5 }, drift: 0.9, hold: 12 }, { shot: { lon: 108, lat: 2, dist: 2.6 }, seconds: 5, drift: 0.6 }],
  },
  {
    id: 'neve',
    mood: 'calm', sound: 'ice',
    look: { ...LOOK, data: 'snow', dim: 0.5, desat: 0.55, clouds: 0 },
    duration: 23, clock: 'data',
    legend: legend(PALETTES.snow, 'snow'),
    narrate: async (g) => {
      const s = await snowSeasons(g);
      const f = s.meta.frames!;
      return t.neve.narrate({ hi: num(s.mkm2[s.hi], 0), hiMonth: monthOf(f[s.hi].time), now: num(s.mkm2[s.now], 0) });
    },
    detail: async (g) => {
      const s = await snowSeasons(g);
      const f = s.meta.frames!;
      return {
        facts: [
          { value: t.neve.area(num(s.mkm2[s.hi], 0)), label: t.neve.most(monthYearOf(f[s.hi].time)) },
          { value: t.neve.area(num(s.mkm2[s.now], 0)), label: t.neve.latest(monthYearOf(f[s.now].time)) },
        ],
        text: t.neve.text,
        source: t.neve.source,
      };
    },
    beats: async () => [{ shot: { lon: 60, lat: 58, dist: 3.0 }, drift: 1.6 }],
  },
  {
    id: 'aria',
    mood: 'curious', sound: 'desert',
    look: { ...LOOK, data: 'aerosol', dim: 0.45, desat: 0.6, clouds: 0.1 },
    duration: 22, clock: 'data',
    legend: legend(PALETTES.aerosol, 'aerosol'),
    narrate: async (g) => {
      const { meta, best, worstMonth } = await haziest(g);
      const where = placeBelow(await loadCountries().catch(() => null), best.lon, best.lat);
      return t.aria.narrate({ where, month: monthOf(meta.frames![best.frame].time), worst: monthOf(meta.frames![worstMonth].time) });
    },
    detail: async (g) => {
      const { meta, best, worstMonth } = await haziest(g);
      const where = placeBelow(await loadCountries().catch(() => null), best.lon, best.lat);
      return {
        facts: [
          { value: num(best.v, 2), label: t.aria.thickest(where, monthYearOf(meta.frames![best.frame].time)) },
          { value: monthYearOf(meta.frames![worstMonth].time), label: t.aria.worst },
          { value: t.aria.wavelength[0], label: t.aria.wavelength[1] },
        ],
        text: t.aria.text,
        source: t.aria.source,
      };
    },
    beats: async () => [{ shot: { lon: -10, lat: 18, dist: 3.1 }, drift: 1.2 }],
  },
  {
    id: 'smog',
    mood: 'grave', sound: 'city',
    look: { ...LOOK, data: 'no2', dim: 0.66, desat: 0.75, night: 0.4, sun: 'real' as const },
    duration: 22, clock: 'data',
    legend: legend(PALETTES.no2, 'no2'),
    narrate: async (g) => {
      const { best } = await dirtiest(g);
      return t.smog.narrate(placeBelow(await loadCountries().catch(() => null), best.lon, best.lat));
    },
    detail: async (g) => {
      const { best, meta } = await dirtiest(g);
      return {
        facts: [
          { value: `${num(best.v / 1e15, 0)} ×10¹⁵`, label: t.smog.highest(placeBelow(await loadCountries().catch(() => null), best.lon, best.lat)) },
          { value: '3,5 km', label: t.smog.pixel },
          { value: t.smog.days, label: t.smog.daysLabel(monthYearOf(meta.frames!.at(-1)!.time)) },
        ],
        text: t.smog.text,
        source: t.smog.source,
      };
    },
    beats: async () => [{ shot: { lon: 70, lat: 30, dist: 2.6 }, drift: 1.4 }],
  },
  {
    id: 'ozono',
    mood: 'curious', sound: 'ice',
    look: { ...LOOK, data: 'ozone', dim: 0.55, desat: 0.6 },
    duration: 23, clock: 'data',
    legend: legend(PALETTES.ozone, 'ozone'),
    narrate: async (g) => {
      const o = await ozoneHole(g);
      return t.ozono.narrate({ now: num(o.mkm2[o.now], 0), peak: num(o.mkm2[o.peak], 0), peakMonth: o.peak === o.now ? null : monthOf(o.meta.frames![o.peak].time) });
    },
    detail: async (g) => {
      const o = await ozoneHole(g);
      return {
        facts: [
          { value: t.ozono.area(num(o.mkm2[o.now], 0)), label: t.ozono.hole(monthYearOf(o.meta.frames![o.now].time)) },
          { value: `${num(o.low[o.now])} DU`, label: t.ozono.thinnest },
          { value: '1987', label: t.ozono.montreal },
        ],
        text: t.ozono.text,
        source: t.ozono.source,
      };
    },
    beats: async () => [{ shot: { lon: 20, lat: -62, dist: 3.0 }, drift: 1.2 }],
  },
  {
    id: 'petrolio',
    mood: 'grave', sound: 'waves',
    look: { ...LOOK, dim: 0.72, desat: 0.75, spots: 'slicks', spotReplay: 12, bloom: 1.2 },
    duration: 22,
    legend: legend([[0, '#7fd6d0'], [1, '#d48bff']], 'slicks'),
    narrate: async () => {
      const s = await slickStats();
      return t.petrolio.narrate({ count: num(s.count), km2: num(s.km2), top: s.top });
    },
    detail: async () => {
      const s = await slickStats();
      return {
        facts: [
          { value: num(s.count), label: t.petrolio.count },
          { value: `${num(s.km2)} km²`, label: t.petrolio.area },
          { value: num(s.topCount), label: t.petrolio.top(s.top) },
        ],
        text: t.petrolio.text,
        source: t.petrolio.source(dayMonth(s.fetched)),
      };
    },
    beats: async () => [{ shot: { lon: 50, lat: 22, dist: 3.0 }, drift: 0.9 }],
  },
  {
    id: 'coralli',
    mood: 'grave', sound: 'reef',
    look: { ...LOOK, data: 'coral', dim: 0.6, desat: 0.7, bloom: 1.2 },
    duration: 24, clock: 'data',
    legend: legend(PALETTES.coral, 'coral'),
    narrate: async (g) => {
      const r = await reefStress(g);
      return t.coralli.narrate({
        now: num(r.alertNow * 100),
        peakMonth: r.peak === r.last ? null : monthYearOf(r.meta.frames![r.peak].time),
        peak: num(r.alertPeak * 100),
      });
    },
    detail: async (g) => {
      const r = await reefStress(g);
      return {
        facts: [
          { value: `${num(r.alertNow * 100)}%`, label: t.coralli.alert },
          { value: `${num(r.severeNow * 100)}%`, label: t.coralli.severe },
          { value: monthYearOf(r.meta.frames![r.peak].time), label: t.coralli.worst(num(r.alertPeak * 100)) },
        ],
        text: t.coralli.text,
        source: t.coralli.source,
      };
    },
    beats: async () => [{ shot: { lon: 150, lat: -12, dist: 2.9 }, drift: 1.0 }],
  },
]);
