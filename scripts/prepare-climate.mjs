// The planet's vital signs, once a day, as small JSON files for the charts of Upari:
// global air temperature and sea surface temperature day by day since 1940 and 1979
// (Copernicus C3S/ECMWF Climate Pulse, ERA5), carbon dioxide at Mauna Loa since 1958
// (NOAA GML) and the extent of sea ice in both hemispheres since 1978 (NSIDC Sea Ice
// Index v4). A source that fails keeps its published file. Run: node scripts/prepare-climate.mjs
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';

const OUT = new URL('../public/climate/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const UA = { 'User-Agent': 'Upari/1.1 (+https://upari.earth; daily refresh)' };

async function text(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}
const writeAtomic = (name, obj) => { const f = OUT + name; writeFileSync(`${f}.part`, JSON.stringify(obj)); renameSync(`${f}.part`, f); };
const r2 = (x) => Math.round(x * 100) / 100;

/** Day of the year, 0-based, with 29 February folded onto 28 so every year has 365 slots. */
function slot(y, m, d) {
  const t = Date.UTC(y, m - 1, d), start = Date.UTC(y, 0, 1);
  let k = Math.round((t - start) / 86400e3);
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  if (leap && k >= 59) k--;
  return k;
}

/** Year → 365 values (null where missing), from rows of [date, value]. */
function byYear(rows) {
  const years = {};
  for (const [date, v] of rows) {
    const [y, m, d] = date.split('-').map(Number);
    (years[y] ??= Array(365).fill(null))[slot(y, m, d)] = r2(v);
  }
  return years;
}

/** Climate Pulse: date, value, 1991–2020 climatology, anomaly, status. */
async function pulse(file, name, label) {
  const rows = (await text(`https://sites.ecmwf.int/data/climatepulse/data/series/${file}`)).split('\n')
    .filter((l) => /^\d{4}-/.test(l)).map((l) => l.split(','));
  if (rows.length < 10000) throw new Error(`${name}: ${rows.length} rows look incomplete`);
  const clim = Array(365).fill(null);
  for (const r of rows.slice(-366)) { const [y, m, d] = r[0].split('-').map(Number); clim[slot(y, m, d)] = r2(Number(r[2])); }
  const last = rows.at(-1);
  // The warmest day of the record, and the same day last year.
  let top = rows[0];
  for (const r of rows) if (Number(r[1]) > Number(top[1])) top = r;
  const lastYear = rows.find((r) => r[0] === `${Number(last[0].slice(0, 4)) - 1}${last[0].slice(4)}`);
  writeAtomic(`${name}.json`, {
    id: name, label, unit: '°C', baseline: '1991–2020',
    last: { date: last[0], value: Number(last[1]), anomaly: Number(last[3]), status: last[4] },
    lastYear: lastYear ? { date: lastYear[0], value: Number(lastYear[1]), anomaly: Number(lastYear[3]) } : null,
    record: { date: top[0], value: Number(top[1]) },
    clim, years: byYear(rows.map((r) => [r[0], Number(r[1])])),
    source: 'Copernicus Climate Change Service (C3S) / ECMWF · Climate Pulse · ERA5',
  });
  console.log(`${name}: ${last[0]} ${last[1]} °C (${Number(last[3]) > 0 ? '+' : ''}${last[3]} vs 1991–2020, ${last[4]})`);
}

const jobs = {
  temperature: () => pulse('era5_daily_series_2t_global.csv', 'temperature', 'global surface air temperature (2 m)'),
  sst: () => pulse('era5_daily_series_sst_60S-60N_ocean.csv', 'sst', 'sea surface temperature, 60° S – 60° N'),

  async co2() {
    const monthly = (await text('https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv')).split('\n')
      .filter((l) => /^\d{4},/.test(l)).map((l) => l.split(',')).map((c) => [Number(c[2]), Number(c[3])]).filter((r) => r[1] > 0);
    const daily = (await text('https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.txt')).split('\n')
      .filter((l) => /^\s*\d{4}\s/.test(l)).map((l) => l.trim().split(/\s+/)).map((c) => ({ date: `${c[0]}-${c[1].padStart(2, '0')}-${c[2].padStart(2, '0')}`, ppm: Number(c[4]) }));
    if (monthly.length < 700 || daily.length < 1000) throw new Error('co2: series look incomplete');
    const last = daily.at(-1);
    const yearAgo = daily.filter((d) => d.date <= `${Number(last.date.slice(0, 4)) - 1}${last.date.slice(4)}`).at(-1);
    writeAtomic('co2.json', {
      id: 'co2', unit: 'ppm', last, yearAgo, first: { date: '1958-03', ppm: monthly[0][1] },
      monthly: monthly.map(([t, v]) => [Math.round(t * 1000) / 1000, r2(v)]),
      source: 'NOAA Global Monitoring Laboratory · Mauna Loa Observatory · Scripps',
    });
    console.log(`co2: ${last.date} ${last.ppm} ppm (a year before ${yearAgo?.ppm})`);
  },

  async seaice() {
    const out = { id: 'seaice', unit: 'million km²', source: 'NSIDC Sea Ice Index, version 4 (G02135)' };
    for (const [hem, letter] of [['north', 'N'], ['south', 'S']]) {
      const rows = (await text(`https://noaadata.apps.nsidc.org/NOAA/G02135/${hem}/daily/data/${letter}_seaice_extent_daily_v4.0.csv`)).split('\n')
        .filter((l) => /^\d{4},/.test(l)).map((l) => l.split(',').map((c) => c.trim()))
        .map((c) => [`${c[0]}-${c[1].padStart(2, '0')}-${c[2].padStart(2, '0')}`, Number(c[3])]).filter((r) => r[1] > 0);
      if (rows.length < 10000) throw new Error(`seaice ${hem}: series looks incomplete`);
      const last = rows.at(-1);
      // The smallest extent of each year, for the record line (the year has to be complete).
      const mins = {};
      for (const [d, v] of rows) { const y = d.slice(0, 4); if (!mins[y] || v < mins[y][1]) mins[y] = [d, v]; }
      out[hem] = { last: { date: last[0], value: last[1] }, minima: mins, years: byYear(rows) };
      console.log(`seaice ${hem}: ${last[0]} ${last[1]} million km²`);
    }
    writeAtomic('seaice.json', out);
  },
};

const pick = process.argv.slice(2);
for (const [id, job] of Object.entries(jobs)) {
  if (pick.length && !pick.includes(id)) continue;
  try { await job(); } catch (err) { console.error(`${id} failed:`, err.message); process.exitCode = 1; }
}
