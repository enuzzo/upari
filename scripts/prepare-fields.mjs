// Packs real vector fields into small equirectangular PNG textures for the GPU.
//   R = eastward speed, G = northward speed (128 = 0, scale in meta), B = 255 where valid.
// Wind: NOAA GFS 10 m, 0.5°, via PacIOOS ERDDAP (latest analysis before now).
// Currents: OSCAR surface currents 1/3°, via NOAA CoastWatch ERDDAP.
// A field replaces the published one only if at least 95% of its grid is valid.
// Requires ImageMagick (MAGICK_BIN=convert for ImageMagick 6). Run: node scripts/prepare-fields.mjs [wind] [currents]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, rmSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const OUT = new URL('../public/fields/', import.meta.url).pathname;
const STAGE = join(process.env.UPARI_TMP || tmpdir(), 'upari-fields');
const MAGICK = process.env.MAGICK_BIN || 'magick';
mkdirSync(OUT, { recursive: true });
mkdirSync(STAGE, { recursive: true });

async function getJSON(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) }).catch((err) => ({ ok: false, status: err.name }));
    if (res.ok) {
      try { return await res.json(); } catch (err) { if (attempt === 2) throw err; }
    }
    else if (attempt === 2) throw new Error(`${res.status} ${url}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

function pack(name, rows, { latIdx, lonIdx, uIdx, vIdx, width, height, scale, meta, seam, minValid }) {
  const sum = new Float64Array(width * height * 2);
  const count = new Uint16Array(width * height);
  for (const r of rows) {
    const u = r[uIdx], v = r[vIdx];
    if (u == null || v == null || Number.isNaN(u) || Number.isNaN(v)) continue;
    let lon = ((r[lonIdx] + 180) % 360 + 360) % 360 - 180;
    const x = Math.min(width - 1, Math.floor(((lon + 180) / 360) * width + 1e-6));
    const y = Math.min(height - 1, Math.max(0, Math.floor(((90 - r[latIdx]) / 180) * height + 1e-6)));
    const i = y * width + x;
    sum[i * 2] += u; sum[i * 2 + 1] += v; count[i]++;
  }
  // Bridge narrow longitude seams (OSCAR stops 2° short of a full turn).
  for (let y = 0; seam && y < height; y++) {
    for (let x = Math.floor((seam[0] + 180) / 360 * width); x <= Math.ceil((seam[1] + 180) / 360 * width); x++) {
      const i = y * width + x;
      if (count[i]) continue;
      let l = 1, r = 1;
      while (l < 9 && !count[y * width + ((x - l + width) % width)]) l++;
      while (r < 9 && !count[y * width + ((x + r) % width)]) r++;
      if (l + r > 12) continue;
      const a = y * width + ((x - l + width) % width), b = y * width + ((x + r) % width);
      const t = l / (l + r);
      for (const k of [0, 1]) sum[i * 2 + k] = (sum[a * 2 + k] / count[a]) * (1 - t) + (sum[b * 2 + k] / count[b]) * t;
      count[i] = 1;
    }
  }
  const px = Buffer.alloc(width * height * 3);
  let valid = 0;
  for (let i = 0; i < width * height; i++) {
    if (!count[i]) { px[i * 3] = 128; px[i * 3 + 1] = 128; continue; }
    const enc = (s) => Math.max(0, Math.min(255, Math.round(128 + (s / count[i] / scale) * 127)));
    px[i * 3] = enc(sum[i * 2]);
    px[i * 3 + 1] = enc(sum[i * 2 + 1]);
    px[i * 3 + 2] = 255;
    valid++;
  }
  if (valid < width * height * minValid) throw new Error(`${name}: only ${valid}/${width * height} valid cells; keeping the published field`);
  const raw = join(STAGE, `${name}.rgb`);
  writeFileSync(raw, px);
  execFileSync(MAGICK, ['-size', `${width}x${height}`, '-depth', '8', `rgb:${raw}`, join(STAGE, `${name}.png`)]);
  rmSync(raw, { force: true });
  // Copy next to the target and rename, PNG first and JSON last, so readers never see half a field.
  copyFileSync(join(STAGE, `${name}.png`), join(OUT, `${name}.png.part`));
  renameSync(join(OUT, `${name}.png.part`), join(OUT, `${name}.png`));
  writeFileSync(join(OUT, `${name}.json.part`), JSON.stringify({ ...meta, width, height, scale, valid }, null, 1));
  renameSync(join(OUT, `${name}.json.part`), join(OUT, `${name}.json`));
  console.log(`${name}: ${width}x${height}, ${valid} valid cells`);
}

async function wind() {
  const base = 'https://pae-paha.pacioos.hawaii.edu/erddap/griddap/ncep_global';
  const now = new Date(Date.now() - 6 * 3600e3);
  now.setUTCHours(Math.floor(now.getUTCHours() / 6) * 6, 0, 0, 0);
  const t = now.toISOString().replace('.000', '');
  const data = await getJSON(`${base}.json?ugrd10m[(${t})][(-90):1:(90)][(0):1:(359.5)],vgrd10m[(${t})][(-90):1:(90)][(0):1:(359.5)]`);
  const cols = data.table.columnNames;
  pack('wind', data.table.rows, {
    latIdx: cols.indexOf('latitude'), lonIdx: cols.indexOf('longitude'),
    uIdx: cols.indexOf('ugrd10m'), vIdx: cols.indexOf('vgrd10m'),
    width: 720, height: 360, scale: 40, minValid: 0.95,
    meta: { kind: 'wind', time: data.table.rows[0][0], source: 'NOAA GFS · 10 m', url: `${base}.html` },
  });
}

async function currents() {
  const base = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplOscar';
  const t = '2014-09-26T00:00:00Z';
  const data = await getJSON(`${base}.json?u[(${t})][0][0:1:480][0:1:1074],v[(${t})][0][0:1:480][0:1:1074]`);
  const cols = data.table.columnNames;
  pack('currents', data.table.rows, {
    latIdx: cols.indexOf('latitude'), lonIdx: cols.indexOf('longitude'),
    uIdx: cols.indexOf('u'), vIdx: cols.indexOf('v'),
    width: 1080, height: 540, scale: 1.6, seam: [17.5, 20.5], minValid: 0.4,
    meta: { kind: 'currents', time: t, source: 'OSCAR · NOAA CoastWatch', url: `${base}.html` },
  });
}

const jobs = { wind, currents };
const pick = process.argv.slice(2);
for (const [name, job] of Object.entries(jobs)) {
  if (pick.length && !pick.includes(name)) continue;
  try { await job(); } catch (err) { console.error(`${name} failed:`, err.message); process.exitCode = 1; }
}
