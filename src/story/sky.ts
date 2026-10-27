import type { Globe } from '../engine/globe';
import { PALETTES } from '../engine/palettes';
import { Vector3 } from 'three';
import { gmst, sunDirection, vecToLonLat } from '../engine/astro';
import { loadSpots } from '../engine/spots';
import { ascent, type Launch } from '../engine/trajectories';
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
    kind: 'observed',
    mood: 'open',
    // The Sun as a body beside the Earth: to scale in size, much nearer than it really is.
    look: { ...SKY, solar: 1, reach: 1400, clouds: 1, bloom: 0.45 },
    duration: 32,
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
      return [
        // From afar: the Sun, and beside it a speck that is the Earth.
        // On a phone held upright the Sun goes above the Earth instead of beside it: the camera
        // looks from 90° away along the Sun's meridian, over the pole, with that pole up.
        g.rig.portrait
          ? { shot: s.lat <= 0 ? { lon: s.lon + 180, lat: -90 - s.lat, dist: 1400, heading: 180 } : { lon: s.lon + 180, lat: 90 - s.lat, dist: 1400 }, seconds: 7, hold: 7, portraitShift: 0 }
          : { shot: { lon: s.lon - 90, lat: 12, dist: 1150 }, seconds: 7, hold: 7 },
        // Then close, with the Sun behind the planet as a measure.
        { shot: { lon: s.lon + 180 - 18, lat: -s.lat * 0.5 + 8, dist: 4.2 }, seconds: 6, drift: 0.4 },
      ];
    },
    pin: async (g) => {
      const s = vecToLonLat(sunDirection(g.now));
      return { lon: s.lon - 90, lat: 12, label: t.sole.earth, sub: t.sole.earthSub };
    },
  },
  {
    id: 'aurora',
    kind: 'forecast',
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
      // From above the oval, then low and sideways, to see the curtains stand.
      return [
        { shot: { lon: p.lon, lat: p.lat, dist: 2.3 }, drift: 2.2, hold: 8 },
        { shot: { lon: p.lon + 15, lat: p.north ? 58 : -58, dist: 0.3, tilt: 50, heading: p.north ? 0 : 180 }, seconds: 7, drift: 0.6 },
      ];
    },
  },
  {
    id: 'satelliti',
    kind: 'computed',
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
    kind: 'observed',
    mood: 'open',
    look: { sun: 'studio', clouds: 0.1, night: 0, dim: 0.55, desat: 0.6, atmo: 0.8, rockets: 1 },
    duration: 30,
    narrate: async () => {
      const d = await climate.launches(), recent = recentLaunches(d);
      return t.partenze.narrate({ count: recent.length, yesterday: recent.yesterday, year: num(d.past?.length ?? 0) });
    },
    detail: async () => {
      const d = await climate.launches();
      return {
        facts: [
          { value: num(d.past?.length ?? 0), label: t.partenze.yearCount },
          ...(d.launchedThisYear != null ? [{ value: num(d.launchedThisYear), label: t.partenze.done(d.year) }] : []),
          { value: d.launches[0].rocket || d.launches[0].name, label: t.partenze.first(dayShort(d.launches[0].net)) },
        ],
        text: t.partenze.text,
        source: t.partenze.source(dayMonth(d.fetched)),
      };
    },
    beats: async (g) => {
      const d = await climate.launches(), recent = recentLaunches(d);
      g.showRockets(recent);
      const first = recent[0] ?? d.launches[0];
      return [
        // Yesterday's rockets climbing from their pads, with where each is going.
        { shot: { lon: first.lon + 30, lat: first.lat * 0.6 + 8, dist: 2.4 }, drift: 0.6, hold: 11 },
        // Then the whole year, pad by pad, in the order they flew.
        { shot: { lon: first.lon + 10, lat: 22, dist: 3.4 }, seconds: 4, drift: 1.4, clear: true, look: { rockets: 0, spots: 'launchyear', spotReplay: 12 } },
      ];
    },
    badges: async () => {
      const d = await climate.launches();
      return recentLaunches(d).slice(0, 6).map((l) => {
        const end = ascent(l)(1);
        const ll = vecToLonLat(end);
        const [rocket, mission] = l.name.split(' | ');
        return { lon: ll.lon, lat: ll.lat, altKm: (end.length() - 1) * 6371, title: mission ?? rocket, sub: `${rocket} · ${t.orbits[l.orbit as keyof typeof t.orbits] ?? l.orbit}` };
      });
    },
  },
  {
    id: 'bolidi',
    kind: 'observed',
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
    kind: 'computed',
    mood: 'curious',
    // The real path of the pass around the Earth, and the Moon's orbit for scale.
    look: { ...SKY, flyby: 1, reach: 400, clouds: 1 },
    duration: 25,
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
    beats: async (g) => [
      // Far enough to hold the Moon's orbit; the Earth is the speck in the middle.
      { shot: { lon: vecToLonLat(sunDirection(g.now)).lon - 70, lat: 35, dist: 230 }, seconds: 6, drift: 0.8 },
    ],
    badges: async (g) => {
      await g.loadFlyby();
      const p = g.flybyPoints(), d = await climate.neo(), o = d.list[0];
      if (!p) return [];
      const label = (v: import('three').Vector3, title: string, sub: string) => {
        const ll = vecToLonLat(v);
        return { lon: ll.lon, lat: ll.lat, altKm: (v.length() - 1) * 6371, title, sub };
      };
      return [
        label(p.moon, t.passaggi.moon, t.passaggi.moonSub),
        label(p.closest, o.name, t.passaggi.closest(dayMonth(o.time), num(Math.round((o.ld * KM_LD) / 1000) * 1000))),
      ];
    },
  },
  {
    id: 'voyager',
    kind: 'computed',
    mood: 'open', sound: 'station',
    look: { ...SKY, dim: 0.5 },
    duration: 27,
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
    beats: async (g) => {
      const d = await climate.voyager();
      const v1 = voyagerDir(d.v1, g.now), v2 = voyagerDir(d.v2, g.now);
      // From the far side of the Earth, looking out towards Voyager 1 (in Ophiuchus), then
      // towards Voyager 2 (far south, in Pavo): they are too far apart for one shot.
      return [
        { shot: { lon: v1.lon + 180 + 12, lat: -v1.lat * 0.6 - 6, dist: 4.4 }, seconds: 6, drift: 0.12, hold: 9 },
        { shot: { lon: v2.lon + 180 + 24, lat: -v2.lat, dist: 4.4 }, seconds: 5, drift: 0.1 },
      ];
    },
    badges: async (g) => {
      const d = await climate.voyager();
      return (['v1', 'v2'] as const).map((k) => {
        const v = voyagerDir(d[k], g.now);
        return { lon: v.lon, lat: v.lat, altKm: 400 * 6371, title: k === 'v1' ? 'Voyager 1' : 'Voyager 2', sub: t.voyager.there(num(d[k].au, 1)) };
      });
    },
  },
]);

/** Where a Voyager is in the sky, as the Earth-fixed direction the globe uses. */
function voyagerDir(v: { ra: number; dec: number }, now: Date) {
  const ra = v.ra * Math.PI / 180, dec = v.dec * Math.PI / 180;
  const dir = new Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra)).applyAxisAngle(new Vector3(0, 1, 0), -gmst(now));
  return vecToLonLat(dir);
}

/** The launches of yesterday (the last two days); on a quiet day, the last three. */
function recentLaunches(d: { past?: Launch[] }) {
  const past = d.past ?? [];
  const recent = past.filter((l) => Date.now() - Date.parse(l.net) < 2 * 86400e3);
  const list = (recent.length ? recent : past.slice(-3)).slice().reverse() as Launch[] & { yesterday?: boolean };
  list.yesterday = recent.length > 0;
  return list as Launch[] & { yesterday: boolean };
}

async function fireballs() {
  const d = (await loadSpots('fireballs')).data as { count: number; list: [string, number, number, number, number | null, number | null][] };
  const top = d.list.reduce((a, b) => (b[3] > a[3] ? b : a));
  return { count: d.list.length, first: d.list[0][0], last: d.list.at(-1)!, top };
}
