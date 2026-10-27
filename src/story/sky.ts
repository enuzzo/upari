import type { Globe } from '../engine/globe';
import { PALETTES } from '../engine/palettes';
import { sunDirection, vecToLonLat } from '../engine/astro';
import { loadSpots } from '../engine/spots';
import { legend, titled, type Chapter } from './chapters';
import { climate } from './charts';
import { t } from '../i18n';
import { dayMonth, dayShort, num, timeUtc } from '../i18n/format';

// The fourth story: the sky around the planet, now. The Sun of this morning, the aurora of
// this hour, every satellite, the rockets about to leave, the fireballs, the asteroids that
// pass and the two Voyagers at the edge of the Sun's wind.

const SKY = { sun: 'real' as const, night: 1, clouds: 0.8, stars: 1 };
const KM_LD = 384400;

/** The pole in the dark now (the aurora shows only there), seen from above its night side. */
function darkPole(g: Globe) {
  const s = vecToLonLat(sunDirection(g.now));
  const north = s.lat < 0;
  return { lon: ((s.lon + 360) % 360) - 180, lat: north ? 62 : -62, north };
}

async function aurora(g: Globe) {
  const { meta } = await g.layers.get('aurora');
  const m = meta as typeof meta & { kp?: { now: number; max24h: number } | null };
  return { time: meta.dates?.[0] ?? '', kp: m.kp ?? null };
}

export const SKY_CHAPTERS: Chapter[] = titled([
  {
    id: 'sole',
    mood: 'open',
    look: { ...SKY, dim: 0.35 },
    duration: 21, chart: 'sun',
    narrate: async () => {
      const d = await climate.sun();
      return t.sole.narrate(timeUtc(d.time));
    },
    detail: async () => {
      const d = await climate.sun();
      return {
        facts: [
          { value: `${timeUtc(d.time)} UTC`, label: t.sole.taken(dayMonth(d.time)) },
          { value: '8′ 20″', label: t.sole.light },
          { value: '≈ 1 000 000 °C', label: t.sole.corona },
        ],
        text: t.sole.text,
        source: t.sole.source,
      };
    },
    beats: async (g) => {
      const s = vecToLonLat(sunDirection(g.now));
      return [{ shot: { lon: s.lon - 80, lat: s.lat * 0.5 + 10, dist: 4.4 }, drift: 0.6 }];
    },
  },
  {
    id: 'aurora',
    mood: 'open', sound: 'night',
    look: { ...SKY, data: 'aurora', clouds: 0.5, bloom: 1.4 },
    duration: 22,
    legend: legend(PALETTES.aurora, 'aurora'),
    narrate: async (g) => {
      const a = await aurora(g), p = darkPole(g);
      return t.aurora.narrate({ pole: p.north ? t.aurora.north : t.aurora.south, kp: a.kp ? num(a.kp.now, 0) : null });
    },
    detail: async (g) => {
      const a = await aurora(g);
      return {
        facts: [
          ...(a.kp ? [{ value: num(a.kp.now, 0), label: t.aurora.kp }, { value: num(a.kp.max24h, 0), label: t.aurora.kpMax }] : []),
          { value: `${timeUtc(a.time)} UTC`, label: t.aurora.forecast(dayMonth(a.time)) },
        ],
        text: t.aurora.text,
        source: t.aurora.source,
      };
    },
    beats: async (g) => {
      const p = darkPole(g);
      return [{ shot: { lon: p.lon, lat: p.lat, dist: 2.3 }, drift: 2.2 }];
    },
  },
  {
    id: 'satelliti',
    mood: 'curious', sound: 'station',
    look: { ...SKY, satellites: 1, clouds: 0.6, dim: 0.25 },
    duration: 24,
    narrate: async (g) => {
      // The elements come from CelesTrak every morning; on a day they did not, say so.
      if (!(await g.loadSats().then(() => true).catch(() => false))) return t.satelliti.unavailable;
      const m = g.satellites!;
      return t.satelliti.narrate({ count: num(m.count), starlink: num(m.kinds.starlink) });
    },
    detail: async (g) => {
      await g.loadSats();
      const m = g.satellites!;
      return {
        facts: [
          { value: num(m.count), label: t.satelliti.count },
          { value: num(m.kinds.starlink), label: t.satelliti.starlink },
          { value: num(m.kinds.geostationary), label: t.satelliti.geo },
          { value: num(m.kinds.navigation), label: t.satelliti.navigation },
        ],
        text: t.satelliti.text,
        source: t.satelliti.source(dayMonth(m.fetched)),
      };
    },
    beats: async () => [
      { shot: { lon: 10, lat: 25, dist: 4 }, drift: 1.5, hold: 7 },
      { shot: { lon: -20, lat: 18, dist: 19 }, seconds: 6, drift: 0.8 },
    ],
  },
  {
    id: 'partenze',
    mood: 'open',
    look: { sun: 'studio', clouds: 0.1, night: 0, dim: 0.55, desat: 0.6, atmo: 0.8, spots: 'launches' },
    duration: 21,
    narrate: async () => {
      const d = await climate.launches(), next = d.launches[0];
      return t.partenze.narrate({ year: d.year, count: d.launchedThisYear == null ? null : num(d.launchedThisYear), name: next.name, day: dayMonth(next.net), place: next.place || next.pad });
    },
    detail: async () => {
      const d = await climate.launches();
      return {
        facts: [
          ...(d.launchedThisYear != null ? [{ value: num(d.launchedThisYear), label: t.partenze.done(d.year) }] : []),
          { value: num(d.launches.length), label: t.partenze.next },
          { value: d.launches[0].rocket || d.launches[0].name, label: t.partenze.first(dayShort(d.launches[0].net)) },
        ],
        text: t.partenze.text,
        source: t.partenze.source(dayMonth(d.fetched)),
      };
    },
    beats: async () => {
      const d = await climate.launches(), next = d.launches[0];
      return [{ shot: { lon: next.lon - 12, lat: next.lat * 0.8, dist: 2.8 }, drift: 0.9 }];
    },
  },
  {
    id: 'bolidi',
    mood: 'curious', sound: 'night',
    look: { sun: 'studio', clouds: 0, night: 0, dim: 0.72, desat: 0.8, atmo: 0.7, spots: 'fireballs', spotReplay: 13, bloom: 1.3 },
    duration: 22,
    narrate: async () => {
      const f = await fireballs();
      return t.bolidi.narrate({ count: num(f.count), year: f.first.slice(0, 4), kt: num(f.top[3]), topYear: f.top[0].slice(0, 4) });
    },
    detail: async () => {
      const f = await fireballs();
      return {
        facts: [
          { value: num(f.count), label: t.bolidi.count(f.first.slice(0, 4)) },
          { value: `${num(f.top[3])} kt`, label: t.bolidi.biggest(dayShort(f.top[0].slice(0, 10))) },
          { value: dayShort(f.last[0].slice(0, 10)), label: t.bolidi.latest },
        ],
        text: t.bolidi.text,
        source: t.bolidi.source,
      };
    },
    beats: async () => [{ shot: { lon: 30, lat: 20, dist: 3.4 }, drift: 2.2 }],
  },
  {
    id: 'passaggi',
    mood: 'curious',
    look: { ...SKY, dim: 0.55, satellites: 0.35 },
    duration: 22, chart: 'neo',
    narrate: async () => {
      const d = await climate.neo(), o = d.list[0];
      return t.passaggi.narrate({ name: o.name, day: dayMonth(o.time), km: num(Math.round((o.ld * KM_LD) / 1000) * 1000), ld: num(o.ld, 2) });
    },
    detail: async () => {
      const d = await climate.neo(), o = d.list[0];
      return {
        facts: [
          { value: num(d.list.length), label: t.passaggi.count },
          { value: `${num(o.kms, 1)} km/s`, label: t.passaggi.speed(o.name) },
          { value: `${num(o.ld, 2)}`, label: t.passaggi.distance },
        ],
        text: t.passaggi.text,
        source: t.passaggi.source(dayMonth(d.fetched)),
      };
    },
    beats: async () => [{ shot: { lon: -40, lat: 20, dist: 4.2 }, drift: 0.5 }],
  },
  {
    id: 'voyager',
    mood: 'open', sound: 'station',
    look: { ...SKY, dim: 0.5, satellites: 0.15 },
    duration: 23, chart: 'voyager',
    narrate: async () => {
      const d = await climate.voyager();
      return t.voyager.narrate({ hours: num(d.v1.lightHours, 2), day: d.v1.lightDay ? dayMonth(d.v1.lightDay) : null });
    },
    detail: async () => {
      const d = await climate.voyager();
      return {
        facts: [
          { value: `${num(d.v1.au, 1)} ${t.charts.auShort}`, label: t.voyager.v1 },
          { value: `${num(d.v2.au, 1)} ${t.charts.auShort}`, label: t.voyager.v2 },
          { value: '1977', label: t.voyager.launched },
        ],
        text: t.voyager.text,
        source: t.voyager.source,
      };
    },
    beats: async () => [{ shot: { lon: 80, lat: 10, dist: 4.6 }, drift: 0.4 }],
  },
]);

async function fireballs() {
  const d = (await loadSpots('fireballs')).data as { count: number; list: [string, number, number, number, number | null, number | null][] };
  const top = d.list.reduce((a, b) => (b[3] > a[3] ? b : a));
  return { count: d.list.length, first: d.list[0][0], last: d.list.at(-1)!, top };
}
