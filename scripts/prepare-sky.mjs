// The sky around the planet, once a day: every active satellite (CelesTrak), the Sun this
// morning (NASA SDO), the aurora and the Kp index (NOAA SWPC), the next launches (The Space
// Devs), the next asteroids to pass (JPL CNEOS), the fireballs seen from space (JPL CNEOS)
// and how far the Voyagers are (JPL Horizons). Each job keeps the published file when its
// source fails. Run: node scripts/prepare-sky.mjs [jobs...]
import { mkdirSync, writeFileSync, renameSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const OUT = new URL('../public/sky/', import.meta.url).pathname;
const LAYERS = new URL('../public/layers/', import.meta.url).pathname;
const TMP = join(process.env.UPARI_TMP || tmpdir(), 'upari-sky');
const MAGICK = process.env.MAGICK_BIN || 'magick';
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const UA = { 'User-Agent': 'Upari/1.1 (+https://upari.earth; daily refresh)' };

async function get(url, as = 'json') {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(90_000) });
      // CelesTrak asks to stop on anything but 200, not to insist.
      if (!res.ok) throw Object.assign(new Error(`${res.status} ${url}`), { final: res.status >= 400 && res.status < 500 });
      return as === 'json' ? await res.json() : as === 'text' ? await res.text() : { buf: Buffer.from(await res.arrayBuffer()), headers: res.headers };
    } catch (err) {
      if (attempt === 2 || err.final) throw err;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}
const writeAtomic = (file, data) => { writeFileSync(`${file}.part`, data); renameSync(`${file}.part`, file); };
const iso = (d) => d.toISOString().slice(0, 10);
const round = (x, k = 3) => Number(x.toFixed(k));

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
/** JPL dates ("2026-Oct-31 02:35") as ISO. */
const jplDate = (s) => { const m = /^(\d{4})-(\w{3})-(\d{2})(?: (\d{2}):(\d{2}))?/.exec(s.trim()); return m ? `${m[1]}-${MONTHS[m[2]]}-${m[3]}T${m[4] ?? '00'}:${m[5] ?? '00'}:00Z` : s; };

const DEG = Math.PI / 180;
const MU = 398600.4418, RE = 6378.137; // km³/s², km

/** What a satellite is, from its name and orbit. */
function kindOf(name, revPerDay) {
  if (/^(ISS \(ZARYA\)|CSS \(TIANHE\))/.test(name)) return 5;
  if (/^STARLINK/.test(name)) return 1;
  if (/^(ONEWEB|KUIPER|QIANFAN|GUOWANG|SPACESAIL)/.test(name)) return 2;
  if (/(NAVSTAR|GPS |GLONASS|GALILEO|BEIDOU|QZS|IRNSS|NAVIC)/.test(name) || (revPerDay > 1.8 && revPerDay < 2.3)) return 3;
  if (revPerDay > 0.9 && revPerDay < 1.1) return 4;
  return 0;
}

const layers = {
  async satellites() {
    // Every active satellite as mean orbital elements (OMM): the browser moves them on the GPU.
    // CelesTrak answers curl where Node's fetch is turned away (the ISS step already uses curl).
    const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json';
    const list = await get(url).catch(() => JSON.parse(execFileSync('curl', ['-fsS', '--max-time', '120', url], { maxBuffer: 1 << 28 }).toString()));
    if (!Array.isArray(list) || list.length < 5000) throw new Error(`satellites: ${list?.length} objects look incomplete`);
    const base = Date.parse(list.reduce((a, s) => (s.EPOCH > a ? s.EPOCH : a), '')) ;
    const out = new Float32Array(list.length * 8);
    const kinds = [0, 0, 0, 0, 0, 0];
    let k = 0;
    for (const s of list) {
      const revPerDay = Number(s.MEAN_MOTION), e = Number(s.ECCENTRICITY);
      if (!(revPerDay > 0.05) || !(e < 0.99)) continue;
      const n = revPerDay * 2 * Math.PI / 1440; // rad/min
      const a = Math.cbrt(MU / (n / 60) ** 2) / RE; // Earth radii
      const epoch = Date.parse(`${s.EPOCH}Z`);
      const kind = kindOf(s.OBJECT_NAME ?? '', revPerDay);
      kinds[kind]++;
      out.set([a, e, s.INCLINATION * DEG, s.RA_OF_ASC_NODE * DEG, s.ARG_OF_PERICENTER * DEG, s.MEAN_ANOMALY * DEG, (epoch - base) / 60e3, kind], k * 8);
      k++;
    }
    writeAtomic(join(OUT, 'satellites.bin'), Buffer.from(out.buffer, 0, k * 8 * 4));
    writeAtomic(join(OUT, 'satellites.json'), JSON.stringify({
      count: k, base: new Date(base).toISOString(), kinds: { other: kinds[0], starlink: kinds[1], constellations: kinds[2], navigation: kinds[3], geostationary: kinds[4], stations: kinds[5] },
      source: 'CelesTrak GP · active', fetched: new Date().toISOString(),
    }, null, 1));
    console.log(`satellites: ${k} (Starlink ${kinds[1]}, geostationary ${kinds[4]}, navigation ${kinds[3]})`);
  },

  async sun() {
    // The Sun in extreme ultraviolet (AIA 171 Å, about a million degrees), a few minutes old.
    const { buf, headers } = await get('https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg', 'bin');
    if (buf.length < 50_000) throw new Error('sun: image too small');
    writeAtomic(join(OUT, 'sun.jpg'), buf);
    const time = new Date(headers.get('last-modified') ?? Date.now()).toISOString();
    writeAtomic(join(OUT, 'sun.json'), JSON.stringify({ time, channel: 'AIA 171 Å', source: 'NASA/SDO and the AIA, EVE and HMI science teams' }, null, 1));
    console.log(`sun: ${time}`);
  },

  async aurora() {
    // OVATION: the probability of seeing an aurora, on a 1° grid, for the next half hour.
    // Stored as a layer like the others (R = probability up to 50%, G = coverage); the page
    // asks NOAA for the newest forecast when it shows it, and falls back to this one.
    const d = await get('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json');
    const W = 360, H = 181, px = Buffer.alloc(W * H * 3);
    for (const [lon, lat, v] of d.coordinates) {
      const x = (Math.round(lon) + 180) % 360, y = 90 - Math.round(lat);
      if (y < 0 || y >= H) continue;
      px[(y * W + x) * 3] = Math.round(Math.min(1, v / 50) * 255);
      px[(y * W + x) * 3 + 1] = 255;
    }
    const raw = join(TMP, 'aurora.rgb');
    writeFileSync(raw, px);
    execFileSync(MAGICK, ['-size', `${W}x${H}`, '-depth', '8', `rgb:${raw}`, '-define', 'png:compression-level=9', join(LAYERS, 'aurora.png.part')]);
    renameSync(join(LAYERS, 'aurora.png.part'), join(LAYERS, 'aurora.png'));
    const kp = await get('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json').catch(() => null);
    // Rows are [time, Kp, a_running, station_count] after a header row (or objects, in newer files).
    const rows = Array.isArray(kp) ? kp.slice(Array.isArray(kp[0]) ? 1 : 0).map((r) => (Array.isArray(r) ? { t: r[0], kp: Number(r[1]) } : { t: r.time_tag, kp: Number(r.Kp ?? r.kp) })) : [];
    const last = rows.at(-1), day = rows.slice(-8);
    writeAtomic(join(LAYERS, 'aurora.json'), JSON.stringify({
      id: 'aurora', width: W, height: H, unit: '%', scale: 'linear', min: 0, max: 50,
      dates: [d['Forecast Time']], observed: d['Observation Time'],
      kp: last ? { now: last.kp, time: last.t, max24h: Math.max(...day.map((r) => r.kp)) } : null,
      source: 'NOAA SWPC · OVATION aurora forecast · planetary Kp',
    }, null, 1));
    console.log(`aurora: forecast ${d['Forecast Time']}, Kp ${last?.kp ?? '?'}`);
  },

  async launches() {
    // The next rockets, with the pad they leave from. The Space Devs allow 15 requests an hour.
    const up = await get('https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=40&mode=normal');
    const year = new Date().getUTCFullYear();
    const done = await get(`https://ll.thespacedevs.com/2.3.0/launches/previous/?net__gte=${year}-01-01T00:00:00Z&limit=1&mode=list`).catch(() => null);
    const horizon = Date.now() + 45 * 86400e3;
    const list = (up.results ?? []).filter((l) => Date.parse(l.net) < horizon && l.pad?.latitude != null).map((l) => ({
      name: l.name, net: l.net, status: l.status?.abbrev ?? '', provider: l.launch_service_provider?.name ?? '',
      rocket: l.rocket?.configuration?.full_name ?? l.rocket?.configuration?.name ?? '',
      mission: l.mission?.name ?? '', orbit: l.mission?.orbit?.abbrev ?? '', type: l.mission?.type ?? '',
      pad: l.pad.name, place: l.pad.location?.name ?? '', country: l.pad.country?.alpha_2_code ?? l.pad.location?.country_code ?? '',
      lat: round(Number(l.pad.latitude)), lon: round(Number(l.pad.longitude)),
    }));
    if (!list.length) throw new Error('launches: none in the next 45 days');
    writeAtomic(join(OUT, 'launches.json'), JSON.stringify({ fetched: new Date().toISOString(), year, launchedThisYear: done?.count ?? null, launches: list, source: 'Launch Library 2 · The Space Devs' }, null, 1));
    console.log(`launches: ${list.length} in the next 45 days, ${done?.count ?? '?'} so far in ${year}`);
  },

  async neo() {
    // Asteroids passing within about 20 lunar distances in the next 60 days.
    const d = await get('https://ssd-api.jpl.nasa.gov/cad.api?dist-max=0.05&date-min=now&date-max=%2B60&sort=dist&diameter=true');
    const f = Object.fromEntries(d.fields.map((k, i) => [k, i]));
    const list = (d.data ?? []).map((r) => ({
      name: r[f.des], time: jplDate(r[f.cd]), au: Number(r[f.dist]), ld: round(Number(r[f.dist]) / 0.00256955529, 2),
      kms: round(Number(r[f.v_rel]), 1), h: Number(r[f.h]), diameter: r[f.diameter] ? Number(r[f.diameter]) : null,
    }));
    if (!list.length) throw new Error('neo: empty list');
    writeAtomic(join(OUT, 'neo.json'), JSON.stringify({ fetched: new Date().toISOString(), days: 60, maxAu: 0.05, list, source: 'NASA/JPL CNEOS · SBDB Close-Approach Data' }, null, 1));
    console.log(`neo: ${list.length}, closest ${list[0].name} at ${list[0].ld} LD on ${list[0].time}`);
  },

  async fireballs() {
    // Bright meteors seen by US government sensors since 1988: where, when, how much energy.
    const d = await get('https://ssd-api.jpl.nasa.gov/fireball.api');
    const f = Object.fromEntries(d.fields.map((k, i) => [k, i]));
    const list = (d.data ?? []).filter((r) => r[f.lat] && r[f.lon]).map((r) => [
      r[f.date],
      round(Number(r[f.lat]) * (r[f['lat-dir']] === 'S' ? -1 : 1), 2),
      round(Number(r[f.lon]) * (r[f['lon-dir']] === 'W' ? -1 : 1), 2),
      Number(r[f['impact-e']]),
      r[f.alt] ? Number(r[f.alt]) : null,
      r[f.vel] ? Number(r[f.vel]) : null,
    ]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (list.length < 500) throw new Error(`fireballs: ${list.length} events look incomplete`);
    writeAtomic(join(OUT, 'fireballs.json'), JSON.stringify({ fetched: new Date().toISOString(), count: list.length, fields: ['date', 'lat', 'lon', 'kt', 'altKm', 'kms'], list, source: 'NASA/JPL CNEOS · Fireball Data' }));
    console.log(`fireballs: ${list.length}, newest ${list.at(-1)[0]}`);
  },

  async voyager() {
    // How far the two Voyagers are from the Earth, and where in the sky; when Voyager 1 gets
    // to one light-day (173.14 au): computed, not quoted.
    const LIGHT_DAY_AU = (299792.458 * 86400) / 149597870.7;
    const today = new Date(), end = new Date(Date.now() + 400 * 86400e3);
    const probe = async (id) => {
      const q = new URLSearchParams({
        format: 'json', COMMAND: `'${id}'`, EPHEM_TYPE: 'OBSERVER', CENTER: "'500@399'", START_TIME: `'${iso(today)}'`,
        STOP_TIME: `'${iso(end)}'`, STEP_SIZE: "'1d'", QUANTITIES: "'1,20'", CSV_FORMAT: "'YES'", OBJ_DATA: "'NO'",
      });
      const r = (await get(`https://ssd.jpl.nasa.gov/api/horizons.api?${q}`)).result;
      const rows = r.slice(r.indexOf('$$SOE') + 5, r.indexOf('$$EOE')).trim().split('\n').map((l) => l.split(',').map((c) => c.trim()));
      const hms = (s, deg) => { const [a, b, c] = s.split(/\s+/).map(Number); const sign = s.startsWith('-') ? -1 : 1; return sign * (Math.abs(a) + b / 60 + c / 3600) * (deg ? 1 : 15); };
      const days = rows.map((c) => ({ date: jplDate(c[0]).slice(0, 10), ra: hms(c[3], false), dec: hms(c[4], true), au: Number(c[5]) }));
      const cross = days.find((d) => d.au >= LIGHT_DAY_AU);
      return { au: round(days[0].au, 3), lightHours: round((days[0].au * 149597870.7) / 299792.458 / 3600, 2), ra: round(days[0].ra, 3), dec: round(days[0].dec, 3), lightDay: cross ? cross.date : null };
    };
    const v1 = await probe(-31), v2 = await probe(-32);
    writeAtomic(join(OUT, 'voyager.json'), JSON.stringify({ date: iso(today), lightDayAu: round(LIGHT_DAY_AU, 3), v1, v2, source: 'NASA/JPL Horizons' }, null, 1));
    console.log(`voyager: V1 ${v1.au} au (${v1.lightHours} light-hours), one light-day on ${v1.lightDay ?? 'beyond 400 days'}`);
  },
};

const pick = process.argv.slice(2);
for (const [id, job] of Object.entries(layers)) {
  if (pick.length && !pick.includes(id)) continue;
  const t = Date.now();
  try { await job(); } catch (err) { console.error(`${id} failed:`, err.message); process.exitCode = 1; }
  console.log(`  ${id} in ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
