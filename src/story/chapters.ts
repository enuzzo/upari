import type { Globe, Look } from '../engine/globe';
import type { Shot } from '../engine/camera';
import type { Ambience, Mood } from '../engine/audio';
import { PALETTES, type Stop } from '../engine/palettes';
import { sunDirection, vecToLonLat, lonLatToVec } from '../engine/astro';
import { stats, formatLonLat } from './stats';
import { seaName } from './places';
import { loadCountries, placeBelow } from './geo';
import { placeIt, type Quake } from '../engine/markers';
import { climate, type ChartId } from './charts';
import { loadSpots } from '../engine/spots';
import { t } from '../i18n';
import { num, dayMonth, dayMonthTime, dayShort, timeLocal, timeUtc } from '../i18n/format';
import { fresh } from '../engine/fresh';

export interface Beat {
  shot: Shot;
  seconds?: number;
  drift?: number;
  /** Seconds to stay on this shot before the next one. */
  hold?: number;
  /** Ride along with the station while holding. */
  follow?: boolean;
  /** Change of look when this beat starts (on top of the chapter's). */
  look?: Partial<Look>;
  /** Remove the labels on the globe when this beat starts. */
  clear?: boolean;
}
export interface Fact { value: string; label: string }
export type Kind = keyof typeof t.kinds;
export interface Detail { facts: Fact[]; text: string; source: string }
export interface Legend { stops: Stop[]; readonly left: string; readonly right: string; readonly title: string }

export interface Chapter {
  id: string;
  /** Title and kicker are in the language of the page. */
  readonly title: string;
  readonly kicker: string;
  look: Partial<Look>;
  duration: number;
  narrate: (g: Globe) => Promise<string>;
  detail: (g: Globe) => Promise<Detail>;
  beats: (g: Globe) => Promise<Beat[]>;
  legend?: Legend;
  follow?: 'iss';
  /** After the beats, fly down to the station and ride along with it. */
  approach?: 'iss';
  /** A second line, said once the camera has arrived. */
  arrive?: (g: Globe) => Promise<string>;
  /** A live panel beside the narration. */
  telemetry?: 'iss';
  /** The feeling of the score, and the sound of the place. */
  mood?: Mood;
  sound?: Ambience;
  clock?: 'data' | 'year' | 'replay';
  /** The years a replay of spots runs through, for the clock. */
  replay?: [number, number];
  /** A chart beside the planet. */
  chart?: ChartId;
  /** What kind of data the chapter shows: measured, model, forecast, statistics... */
  kind?: Kind;
  /** Labels on the globe (lon, lat, height in km), shown once the words are on screen. */
  badges?: (g: Globe) => Promise<{ lon: number; lat: number; altKm: number; title: string; sub: string }[]>;
  pin?: (g: Globe) => Promise<{ lon: number; lat: number; label: string; sub: string } | null>;
}

/** The words of a chapter: every chapter id has its entry in the dictionaries. */
type Texts = { title: string; kicker: string };
export type ChapterId = { [K in keyof typeof t]: (typeof t)[K] extends Texts ? K : never }[keyof typeof t];

/** Chapters with their title and kicker read from the dictionary of the moment. */
export function titled(list: Omit<Chapter, 'title' | 'kicker'>[]): Chapter[] {
  for (const c of list) {
    const words = () => t[c.id as ChapterId] as Texts;
    Object.defineProperties(c, { title: { get: () => words().title }, kicker: { get: () => words().kicker } });
  }
  return list as Chapter[];
}

/** A legend whose words follow the language. */
export const legend = (stops: Stop[], key: keyof typeof t.legends): Legend => ({
  stops,
  get left() { return t.legends[key].left; }, get right() { return t.legends[key].right; }, get title() { return t.legends[key].title; },
});

/** "today", "yesterday" or "on 22 October", from the day a layer actually shows. */
function when(iso: string | undefined): { text: string; today: boolean } {
  if (!iso) return { text: t.when.recent, today: false };
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((day(new Date()) - Date.parse(iso.slice(0, 10) + 'T00:00:00Z')) / 86400e3);
  return { text: diff <= 0 ? t.when.today : diff === 1 ? t.when.yesterday : t.when.on(dayMonth(iso.slice(0, 10))), today: diff <= 0 };
}
/** The NASA anomaly colormap stops at ±3 °C. */
const anomalyText = (v: number) => (v >= 2.95 ? t.febbre.over3 : `+${num(v, 1)}`);
const facts = (list: [string, string][]) => list.map(([value, label]) => ({ value, label }));
/** +0,95 / −0,12 */
export const signed = (v: number, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), d)}`;

/** Arctic sea ice extent of the latest day (NSIDC), and its 1981–2010 mean for the same day. */
async function seaIceToday() {
  const d = (await climate.seaice()).north as { last: { date: string; value: number }; years: Record<string, (number | null)[]> };
  const [y, m, day] = d.last.date.split('-').map(Number);
  const start = Date.UTC(y, 0, 1);
  let k = Math.round((Date.UTC(y, m - 1, day) - start) / 86400e3);
  if (((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) && k >= 59) k--;
  const base = Array.from({ length: 30 }, (_, i) => d.years[1981 + i]?.[k]).filter((v): v is number => v != null);
  return { date: d.last.date, value: d.last.value, normal: base.reduce((a, b) => a + b, 0) / base.length };
}

/** The cyclones of the last ten days, the strongest first. */
async function storms() {
  const d = (await loadSpots('cyclones')).data as { fetched: string; list: { name: string | null; peak: number; track: [string, number, number, number | null][] }[] };
  const list = [...d.list].sort((a, b) => b.peak - a.peak);
  return { count: list.length, top: list[0] ?? null, fetched: d.fetched };
}

async function meta(g: Globe, id: Parameters<Globe['layers']['get']>[0]) {
  return (await g.layers.get(id)).meta;
}

/** A view that shows both day and night, centred on the terminator. */
function terminatorShot(g: Globe, dist: number): Shot {
  const s = vecToLonLat(sunDirection(g.now));
  // 75° away from the sub-solar point towards the evening side, at a pleasant latitude.
  let lon = s.lon - 70;
  lon = ((lon + 540) % 360) - 180;
  return { lon, lat: 22, dist };
}

function nightSide(g: Globe): Shot {
  const sun = sunDirection(g.now);
  const cities: [number, number][] = [[10, 47], [31, 27], [78, 23], [113, 31], [-82, 38], [-46, -20], [135, 35], [-100, 30], [2, 45]];
  let best = cities[0], bestDark = 1;
  for (const c of cities) {
    const d = lonLatToVec(c[0], c[1]).dot(sun);
    if (d < bestDark) { bestDark = d; best = c; }
  }
  return { lon: best[0], lat: best[1] - 4, dist: 1.05, tilt: 28 };
}

export const CHAPTERS: Chapter[] = titled([
  {
    id: 'pianeta',
    kind: 'observed',
    mood: 'calm',
    look: { sun: 'real', clouds: 1, night: 1 },
    duration: 19,
    narrate: async () => t.pianeta.narrate,
    detail: async (g) => ({
      facts: [...facts(t.pianeta.facts), { value: timeLocal(g.now), label: t.pianeta.hour }],
      text: t.pianeta.text,
      source: t.pianeta.source,
    }),
    beats: async (g) => [{ shot: terminatorShot(g, 3.6), drift: 1.2 }],
  },
  {
    id: 'termometro',
    kind: 'reanalysis',
    mood: 'curious',
    look: { sun: 'real', clouds: 0.7, night: 0.7, dim: 0.6, desat: 0.35 },
    duration: 24, chart: 'temperature',
    narrate: async () => {
      const d = await climate.temperature();
      return t.termometro.narrate({ day: dayMonth(d.last.date), value: num(d.last.value, 1), anomaly: signed(d.last.anomaly, 2) });
    },
    detail: async () => {
      const [d, s] = await Promise.all([climate.temperature(), climate.sst()]);
      return {
        facts: [
          { value: `${signed(d.last.anomaly, 2)} °C`, label: t.termometro.anomaly(dayMonth(d.last.date), d.last.status === 'PRELIMINARY') },
          { value: `${num(d.record.value, 2)} °C`, label: t.termometro.record(dayShort(d.record.date)) },
          { value: `${signed(s.last.anomaly, 2)} °C`, label: t.termometro.sea(dayMonth(s.last.date)) },
        ],
        text: t.termometro.text,
        source: t.termometro.source,
      };
    },
    beats: async (g) => [{ shot: terminatorShot(g, 4.6), drift: 0.8 }],
  },
  {
    id: 'respiro',
    kind: 'model',
    mood: 'curious', sound: 'wind',
    look: { sun: 'studio', clouds: 0.12, cloudFlow: 1, dim: 0.62, desat: 0.5, night: 0, flow: 'wind', atmo: 0.8 },
    duration: 22,
    legend: legend([[0, '#3a5a9a'], [0.25, '#9cc7ff'], [0.5, '#ffffff'], [0.75, '#ffd37a'], [1, '#ff7a4a']], 'wind'),
    narrate: async (g) => {
      const w = await stats.windiest(g);
      return t.respiro.narrate({ where: seaName(w.lon, w.lat), kmh: num(w.value) });
    },
    detail: async (g) => {
      const w = await stats.windiest(g);
      const m = await (await fetch(fresh('fields/wind.json'))).json();
      return {
        facts: [{ value: `${num(w.value)} ${t.units.kmh}`, label: t.respiro.strongest(formatLonLat(w.lon, w.lat)) }, ...facts(t.respiro.facts)],
        text: t.respiro.text,
        source: t.respiro.source(dayMonthTime(m.time)),
      };
    },
    beats: async (g) => {
      const w = await stats.windiest(g);
      return [{ shot: { lon: w.lon - 14, lat: w.lat * 0.7, dist: 3.4 }, drift: 0.6 }];
    },
    pin: async (g) => {
      const w = await stats.windiest(g);
      return { lon: w.lon, lat: w.lat, label: `${num(w.value)} ${t.units.kmh}`, sub: t.respiro.pin };
    },
  },
  {
    id: 'tempeste',
    kind: 'observed',
    mood: 'grave', sound: 'wind',
    look: { sun: 'studio', clouds: 0.3, cloudFlow: 1, dim: 0.6, desat: 0.5, night: 0, flow: 'wind', atmo: 0.8, spots: 'cyclones', spotReplay: 12 },
    duration: 22,
    legend: legend([[0, '#7fe0ff'], [0.35, '#b7a6ff'], [0.7, '#ff7ad9'], [1, '#ff3fa4']], 'cyclones'),
    narrate: async () => {
      const s = await storms();
      return s.top ? t.tempeste.narrate({ count: s.count, name: s.top.name ?? t.spots.cycloneUnnamed, kmh: num(s.top.peak * 1.852) }) : t.tempeste.none;
    },
    detail: async () => {
      const s = await storms();
      return {
        facts: [
          { value: num(s.count), label: t.tempeste.count },
          ...(s.top ? [{ value: `${num(s.top.peak * 1.852)} ${t.units.kmh}`, label: t.tempeste.strongest(s.top.name ?? t.spots.cycloneUnnamed) }] : []),
          { value: '119 km/h', label: t.tempeste.threshold },
        ],
        text: t.tempeste.text,
        source: t.tempeste.source(dayMonth(s.fetched)),
      };
    },
    beats: async () => {
      const s = await storms();
      const p = s.top?.track.at(-1);
      return [{ shot: p ? { lon: p[2] - 10, lat: p[1] * 0.8, dist: 2.6 } : { lon: 140, lat: 15, dist: 3.2 }, drift: 0.8 }];
    },
  },
  {
    id: 'correnti',
    kind: 'estimate',
    mood: 'curious', sound: 'ocean',
    look: { sun: 'studio', clouds: 0, dim: 0.62, desat: 0.5, night: 0, flow: 'currents', atmo: 0.75 },
    duration: 21,
    legend: legend([[0, '#1f5f7a'], [0.3, '#4ad1d1'], [0.6, '#b8fff0'], [1, '#ffffff']], 'currents'),
    narrate: async () => t.correnti.narrate,
    detail: async () => ({ facts: facts(t.correnti.facts), text: t.correnti.text, source: t.correnti.source }),
    beats: async () => [
      { shot: { lon: -58, lat: 30, dist: 1.9 }, drift: 0.8 },
    ],
  },
  {
    id: 'calore',
    kind: 'observed',
    mood: 'calm', sound: 'waves',
    look: { sun: 'studio', data: 'sst', clouds: 0.06, dim: 0.3, desat: 0.4, night: 0, atmo: 0.85 },
    duration: 22, clock: 'data',
    legend: legend(PALETTES.sst, 'sst'),
    narrate: async (g) => {
      const h = await stats.hottestSea(g), day = when((await meta(g, 'sst')).dates?.[0]);
      return t.calore.narrate({ when: day.text, today: day.today, where: seaName(h.lon, h.lat), temp: h.value >= 31.9 ? null : num(h.value, 1) });
    },
    detail: async (g) => {
      const h = await stats.hottestSea(g), m = await meta(g, 'sst');
      return {
        facts: [
          { value: `${h.value >= 31.9 ? '> 32' : num(h.value, 1)} °C`, label: t.calore.hottest(when(m.dates?.[0]).text, formatLonLat(h.lon, h.lat)) },
          ...facts(t.calore.facts),
        ],
        text: t.calore.text,
        source: `GHRSST MUR, NASA JPL · ${dayMonth(m.dates![0])}`,
      };
    },
    beats: async (g) => {
      const h = await stats.hottestSea(g);
      return [{ shot: { lon: h.lon - 12, lat: h.lat * 0.6, dist: 3.3 }, drift: 0.8 }];
    },
    pin: async (g) => {
      const h = await stats.hottestSea(g);
      return { lon: h.lon, lat: h.lat, label: `${h.value >= 31.9 ? '> 32' : num(h.value, 1)} °C`, sub: t.calore.pin };
    },
  },
  {
    id: 'febbre',
    kind: 'observed',
    mood: 'grave', sound: 'waves',
    look: { sun: 'studio', data: 'anomaly', clouds: 0.06, dim: 0.55, desat: 0.75, night: 0, atmo: 0.85 },
    duration: 22, clock: 'data',
    legend: legend(PALETTES.anomaly, 'anomaly'),
    narrate: async (g) => {
      const { share } = await stats.warmShare(g);
      const day = when((await meta(g, 'anomaly')).dates?.[0]);
      return t.febbre.narrate({ when: day.text, today: day.today, pct: num(Math.round(share * 100)) });
    },
    detail: async (g) => {
      const { share, hottest } = await stats.warmShare(g), m = await meta(g, 'anomaly');
      return {
        facts: [
          { value: `${num(Math.round(share * 100))}%`, label: t.febbre.share },
          { value: `${anomalyText(hottest.value)} °C`, label: t.febbre.strongest(seaName(hottest.lon, hottest.lat)) },
          ...facts([t.febbre.normal]),
        ],
        text: t.febbre.text,
        source: `${t.febbre.source} · ${dayMonth(m.dates![0])}`,
      };
    },
    beats: async (g) => {
      const { hottest } = await stats.warmShare(g);
      return [{ shot: { lon: hottest.lon - 10, lat: Math.max(-50, Math.min(50, hottest.lat)), dist: 3.3 }, drift: 0.8 }];
    },
    pin: async (g) => {
      const { hottest } = await stats.warmShare(g);
      return { lon: hottest.lon, lat: hottest.lat, label: `${anomalyText(hottest.value)} °C`, sub: t.febbre.pin };
    },
  },
  {
    id: 'fioritura',
    kind: 'observed',
    mood: 'open', sound: 'reef',
    look: { sun: 'studio', data: 'chlorophyll', clouds: 0.04, dim: 0.66, desat: 0.5, night: 0, atmo: 0.8, bloom: 1.3 },
    duration: 23, clock: 'data',
    legend: legend(PALETTES.chlorophyll, 'chlorophyll'),
    narrate: async () => t.fioritura.narrate,
    detail: async (g) => {
      const m = await meta(g, 'chlorophyll');
      return {
        facts: [
          ...facts([t.fioritura.oxygen]),
          { value: t.fioritura.days(m.dates!.length), label: t.fioritura.daysLabel },
          { value: `${num(0.01, 2)} → 20`, label: t.fioritura.range },
        ],
        text: t.fioritura.text,
        source: `NASA PACE OCI · ${dayMonth(m.dates!.at(-1)!)} – ${dayMonth(m.dates![0])}`,
      };
    },
    beats: async () => [{ shot: { lon: -42, lat: -34, dist: 2.9 }, drift: 1.0 }],
  },
  {
    id: 'pioggia',
    kind: 'estimate',
    mood: 'calm', sound: 'rain',
    look: { sun: 'studio', data: 'rain', clouds: 0.18, dim: 0.62, desat: 0.55, night: 0, atmo: 0.8, bloom: 0.8 },
    duration: 22,
    clock: 'data',
    legend: legend(PALETTES.rain, 'rain'),
    narrate: async () => t.pioggia.narrate,
    detail: async (g) => {
      const m = await meta(g, 'rain');
      const first = m.frames![0].time, last = m.frames!.at(-1)!.time;
      return {
        facts: [
          ...facts([t.pioggia.interval]),
          { value: t.pioggia.hours, label: t.pioggia.since(dayMonthTime(first)) },
          ...facts([t.pioggia.yearly]),
        ],
        text: t.pioggia.text(timeUtc(last)),
        source: 'NASA GPM IMERG · Early Run',
      };
    },
    beats: async () => [{ shot: { lon: 120, lat: 6, dist: 3.4 }, drift: 1.6 }],
  },
  {
    id: 'fuoco',
    kind: 'observed',
    mood: 'grave', sound: 'fire',
    look: { sun: 'studio', clouds: 0, dim: 0.78, desat: 0.75, night: 0.35, fires: 1, atmo: 0.6, bloom: 1.4 },
    duration: 20,
    narrate: async () => {
      const f = await (await fetch(fresh('layers/fires.json'))).json();
      const k = Math.round(f.detections / 1000);
      return t.fuoco.narrate({ thousands: num(k), approx: num(k * 1000) });
    },
    detail: async () => {
      const f = await (await fetch(fresh('layers/fires.json'))).json();
      return {
        facts: [{ value: num(f.detections), label: t.fuoco.count }, ...facts(t.fuoco.facts)],
        text: t.fuoco.text,
        source: t.fuoco.source(dayMonth(f.newest)),
      };
    },
    beats: async () => [{ shot: { lon: 14, lat: -6, dist: 3.2 }, drift: 1.2 }],
  },
  {
    id: 'terremoti',
    kind: 'observed',
    mood: 'grave', sound: 'quake',
    look: { sun: 'studio', clouds: 0, dim: 0.74, desat: 0.75, night: 0, atmo: 0.65, quakes: 1, quakeReplay: 14, bloom: 1.3, spots: 'volcanoes' },
    duration: 24,
    legend: legend([[0, '#ffc76b'], [0.25, '#ff6b8c'], [1, '#8c73ff']], 'quakes'),
    narrate: async (g) => {
      await g.loadQuakes();
      const top = g.strongestQuake!;
      return t.terremoti.narrate({ count: num(g.quakeCount), mag: num(top[3], 1), where: placeIt(top[5]) });
    },
    detail: async (g) => {
      await g.loadQuakes();
      const q = await (await fetch(fresh('layers/quakes.json'))).json();
      const list = q.quakes as Quake[];
      const deepest = list.reduce((a, b) => (b[2] > a[2] ? b : a));
      return {
        facts: [
          { value: num(list.length), label: t.terremoti.count },
          { value: num(list.filter((e) => e[3] >= 5).length), label: t.terremoti.strong },
          { value: `${num(deepest[2])} ${t.units.km}`, label: t.terremoti.deepest(placeIt(deepest[5])) },
          ...(await loadSpots('volcanoes').then((v) => [{ value: num(v.spots.length), label: t.terremoti.volcanoes }]).catch(() => [])),
        ],
        text: t.terremoti.text,
        source: t.terremoti.source(dayMonth(q.newest.slice(0, 10))),
      };
    },
    beats: async (g) => {
      await g.loadQuakes();
      const top = g.strongestQuake!;
      return [
        // The Ring of Fire while the week replays, then the strongest quake.
        { shot: { lon: 165, lat: 8, dist: 3.3 }, drift: 1.2, hold: 10 },
        { shot: { lon: top[0], lat: top[1] - 4, dist: 2.2 }, seconds: 4, drift: 0.4 },
      ];
    },
    pin: async (g) => {
      await g.loadQuakes();
      const top = g.strongestQuake!;
      return { lon: top[0], lat: top[1], label: t.terremoti.pin(num(top[3], 1)), sub: t.terremoti.pinSub };
    },
  },
  {
    id: 'ghiaccio',
    kind: 'observed',
    mood: 'curious', sound: 'ice',
    look: { sun: 'studio', data: 'ice', clouds: 0.08, dim: 0.5, desat: 0.5, night: 0, atmo: 0.9, spots: 'icebergs' },
    duration: 22, clock: 'data',
    legend: legend(PALETTES.ice, 'ice'),
    narrate: async (g) => {
      const { north } = await stats.arcticIce(g), day = when((await meta(g, 'ice')).dates?.[0]);
      return t.ghiaccio.narrate({ when: day.text, today: day.today, area: num(north / 1e6, 1) });
    },
    detail: async (g) => {
      const { north, south } = await stats.arcticIce(g), m = await meta(g, 'ice');
      return {
        facts: [
          { value: t.ghiaccio.area(num(north / 1e6, 1)), label: t.ghiaccio.arctic(when(m.dates?.[0]).text) },
          { value: t.ghiaccio.area(num(south / 1e6, 1)), label: t.ghiaccio.antarctic },
          ...facts([t.ghiaccio.decline]),
          ...(await seaIceToday().then((s) => [{ value: t.ghiaccio.area(num(s.value, 1)), label: t.ghiaccio.nsidc(dayMonth(s.date), `${signed(s.value - s.normal, 1)} ${t.ghiaccio.millionKm2}`) }]).catch(() => [])),
          ...(await loadSpots('icebergs').then((b) => [{ value: num(b.spots.length), label: t.ghiaccio.icebergs }]).catch(() => [])),
        ],
        text: t.ghiaccio.text,
        source: `${t.ghiaccio.source} · ${dayMonth(m.dates![0])}`,
      };
    },
    beats: async () => [{ shot: { lon: -20, lat: 68, dist: 3.2 }, drift: 2 }],
  },
  {
    id: 'luci',
    kind: 'observed',
    mood: 'open', sound: 'night',
    look: { sun: 'real', clouds: 0.45, night: 0.85, atmo: 1, bloom: 0.9 },
    duration: 19,
    narrate: async () => t.luci.narrate,
    detail: async () => ({ facts: facts(t.luci.facts), text: t.luci.text, source: t.luci.source }),
    beats: async (g) => [{ shot: nightSide(g), drift: 0.5 }],
  },
  {
    id: 'lassu',
    kind: 'computed',
    mood: 'open', sound: 'station',
    look: { sun: 'real', clouds: 1, night: 1.1, iss: 1, atmo: 1 },
    duration: 62,
    follow: 'iss',
    approach: 'iss',
    telemetry: 'iss',
    narrate: async (g) => {
      const s = g.station;
      const alt = s.altKm > 300 ? Math.round(s.altKm) : 415;
      return t.lassu.narrate({ alt: num(alt), speed: num(Math.round(s.speedKmh / 100) * 100 || 27600) });
    },
    arrive: async (g) => {
      const s = g.station;
      const below = placeBelow(await loadCountries().catch(() => null), s.lon, s.lat);
      const light = s.daylight(g.now, (d) => sunDirection(d));
      const known = light && Number.isFinite(light.minutes);
      return t.lassu.arrive({ below, day: known ? light.day : null, minutes: known ? num(Math.round(light.minutes)) : '' });
    },
    detail: async (g) => ({
      facts: [
        { value: `${num(Math.round(g.station.altKm || 415))} ${t.units.km}`, label: t.lassu.alt },
        { value: `${num(Math.round(g.station.speedKmh || 27600))} ${t.units.kmh}`, label: t.lassu.speed },
        ...facts([t.lassu.dawns]),
      ],
      text: t.lassu.text,
      source: t.lassu.source,
    }),
    beats: async (g) => {
      const s = g.station;
      return [
        // The whole planet, the orbit as a thread of light and the station running along it.
        { shot: { lon: s.lon - 12, lat: Math.max(-35, Math.min(35, s.lat * 0.7)), dist: 3.7 }, seconds: 4.5, hold: 7 },
        // Riding along, high up, to see where it is going.
        { shot: { lon: s.lon, lat: s.lat, dist: 0.5, tilt: 30 }, seconds: 6, hold: 9, follow: true },
      ];
    },
  },
]);
