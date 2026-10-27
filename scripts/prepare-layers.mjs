// Turns NASA GIBS imagery back into physical values, fills orbital gaps by
// compositing several days, and packs each layer as an equirectangular RGB PNG:
//   R = value mapped to 0..255 (see meta), G = coverage confidence, B = 0.
// The app recolours these values with its own palettes on the GPU.
// Also packs NASA FIRMS active fires (VIIRS NOAA-20, last 7 days) as points.
// A refreshed layer replaces the published one only if its coverage is at least
// 80% of the previous snapshot: a half-processed NASA day never reaches the site.
// Requires ImageMagick (MAGICK_BIN=convert for ImageMagick 6). Run: node scripts/prepare-layers.mjs [ids...]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const OUT = new URL('../public/layers/', import.meta.url).pathname;
const TMP = join(process.env.UPARI_TMP || tmpdir(), 'upari-layers');
const STAGE = join(TMP, 'stage');
const MAGICK = process.env.MAGICK_BIN || 'magick';
mkdirSync(OUT, { recursive: true });
mkdirSync(STAGE, { recursive: true });
const magick = (args) => execFileSync(MAGICK, args, { maxBuffer: 1 << 30 });
// The staging area may sit on another volume: copy next to the target, then rename
// atomically, so a reader never sees a half-written file.
const move = (from, to) => { copyFileSync(from, `${to}.part`); renameSync(`${to}.part`, to); rmSync(from, { force: true }); };
const writeAtomic = (file, text) => { writeFileSync(`${file}.part`, text); renameSync(`${file}.part`, file); };
// Overall budget, so a stalled server cannot eat the whole CI job.
const DEADLINE = Date.now() + Number(process.env.UPARI_DEADLINE_MIN || 30) * 60e3;
const checkDeadline = (what) => { if (Date.now() > DEADLINE) throw new Error(`${what}: time budget exhausted`); };

const GIBS = 'https://gibs.earthdata.nasa.gov';

async function fetchBuffer(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      // A stalled server must not hold the whole refresh hostage.
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}


const rgba = (file) => magick([file, '-depth', '8', 'rgba:-']);

const wmsBox = (layer, time, [la0, lo0, la1, lo1], w, h) =>
  `${GIBS}/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layer}&CRS=EPSG:4326&BBOX=${la0},${lo0},${la1},${lo1}&WIDTH=${w}&HEIGHT=${h}&FORMAT=image/png&STYLES=&TIME=${time}`;
const WORLD = [-90, -180, 90, 180];

/** Share of opaque pixels in each block of an 8 × 4 grid. */
function blockShares(file) {
  const [w, h] = magick([file, '-format', '%w %h', 'info:']).toString().split(' ').map(Number);
  const b = rgba(file), BX = 8, BY = 4;
  const n = new Float64Array(BX * BY), t = new Float64Array(BX * BY);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = Math.floor((y * BY) / h) * BX + Math.floor((x * BX) / w);
    t[k]++;
    if (b[(y * w + x) * 4 + 3] > 128) n[k]++;
  }
  return Array.from(n, (v, k) => v / t[k]);
}

// GIBS sometimes answers a large WMS request with an image rendered only in part:
// whole regions come back empty. Compare each image with a quick thumbnail of the
// same request, region by region, and ask again when a region with data is missing.
// (Sparse swaths look denser in a thumbnail, so only near-empty regions count.)
async function wmsChecked(layer, time, box, W, H, name) {
  checkDeadline(name);
  const file = join(TMP, name);
  if (existsSync(file)) return file;
  const thumb = join(TMP, `${name}.thumb.png`);
  writeFileSync(thumb, await fetchBuffer(wmsBox(layer, time, box, Math.max(128, W >> 3), Math.max(64, H >> 3))));
  const ref = blockShares(thumb);
  rmSync(thumb, { force: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    writeFileSync(file, await fetchBuffer(wmsBox(layer, time, box, W, H)));
    const got = blockShares(file);
    const holes = ref.filter((r, k) => r > 0.05 && got[k] < r * 0.25).length;
    if (!holes) return file;
    console.warn(`${name}: ${holes} empty region(s) in the render, asking again`);
    rmSync(file, { force: true });
    checkDeadline(name);
  }
  throw new Error(`${name}: GIBS keeps returning a partial image`);
}

async function colormap(name) {
  const xml = (await fetchBuffer(`${GIBS}/colormaps/v1.3/${name}.xml`)).toString();
  const map = new Map();
  for (const m of xml.matchAll(/<ColorMapEntry rgb="(\d+),(\d+),(\d+)" transparent="false"[^>]*?\svalue="([^"]+)"/g)) {
    const nums = m[4].replace(/[\[\]()]/g, '').split(',').map((s) => (/INF/.test(s) ? NaN : Number(s)));
    const value = Number.isNaN(nums[0]) ? nums[1] : Number.isNaN(nums[1] ?? NaN) ? nums[0] : (nums[0] + nums[1]) / 2;
    if (Number.isFinite(value)) map.set((+m[1] << 16) | (+m[2] << 8) | +m[3], value);
  }
  return map;
}

const iso = (d) => d.toISOString().slice(0, 10);
const daysBack = (n, from = new Date()) => Array.from({ length: n }, (_, i) => iso(new Date(from.getTime() - i * 86400e3)));

// Mean of the valid samples of each pixel across frames, in normalised units.
function composite(frames, cmap, norm, W, H) {
  const sum = new Float32Array(W * H), cnt = new Uint8Array(W * H);
  for (const buf of frames) {
    for (let i = 0; i < W * H; i++) {
      if (buf[i * 4 + 3] < 128) continue;
      const v = cmap.get((buf[i * 4] << 16) | (buf[i * 4 + 1] << 8) | buf[i * 4 + 2]);
      if (v === undefined) continue;
      sum[i] += norm(v); cnt[i]++;
    }
  }
  const val = new Float32Array(W * H), w = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) if (cnt[i]) { val[i] = sum[i] / cnt[i]; w[i] = 1; }
  return { val, w };
}

// Push-pull hole filling: a weighted pyramid fills gaps with smooth surroundings;
// the returned confidence fades with distance from real observations.
function pushPull(val, w, W, H) {
  const levels = [{ v: val.map((x, i) => x * w[i]), w: Float32Array.from(w), W, H }];
  while (levels.at(-1).W > 4) {
    const p = levels.at(-1), nW = p.W >> 1, nH = Math.max(1, p.H >> 1);
    const v = new Float32Array(nW * nH), ww = new Float32Array(nW * nH);
    for (let y = 0; y < nH; y++) for (let x = 0; x < nW; x++) {
      let sv = 0, sw = 0;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const sx = Math.min(p.W - 1, x * 2 + dx), sy = Math.min(p.H - 1, y * 2 + dy), j = sy * p.W + sx;
        sv += p.v[j]; sw += p.w[j];
      }
      v[y * nW + x] = sv; ww[y * nW + x] = sw;
    }
    // Normalise so weights saturate at 1 (a fully observed parent).
    for (let i = 0; i < v.length; i++) { if (ww[i] > 1) { v[i] /= ww[i]; ww[i] = 1; } }
    levels.push({ v, w: ww, W: nW, H: nH });
  }
  for (let l = levels.length - 2; l >= 0; l--) {
    const c = levels[l], p = levels[l + 1];
    for (let y = 0; y < c.H; y++) for (let x = 0; x < c.W; x++) {
      const i = y * c.W + x;
      if (c.w[i] >= 1) continue;
      // Bilinear sample of the coarser level.
      const fx = Math.max(0, (x - 0.5) / 2), fy = Math.max(0, (y - 0.5) / 2);
      const x0 = Math.min(p.W - 1, Math.floor(fx)), y0 = Math.min(p.H - 1, Math.floor(fy));
      const x1 = Math.min(p.W - 1, x0 + 1), y1 = Math.min(p.H - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
      const s = (arr) => (arr[y0 * p.W + x0] * (1 - tx) + arr[y0 * p.W + x1] * tx) * (1 - ty) + (arr[y1 * p.W + x0] * (1 - tx) + arr[y1 * p.W + x1] * tx) * ty;
      const pv = s(p.v), pw = s(p.w);
      const pval = pw > 0 ? pv / pw : 0;
      const cur = c.w[i] > 0 ? c.v[i] / c.w[i] : 0;
      const a = c.w[i];
      c.v[i] = cur * a + pval * (1 - a);
      c.w[i] = 1;
    }
  }
  return levels[0].v;
}

function blurCoverage(w, W, H, radius) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let acc = 0;
    for (let x = -radius; x <= radius; x++) acc += w[y * W + ((x + W) % W)];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = acc / (2 * radius + 1);
      acc += w[y * W + ((x + radius + 1) % W)] - w[y * W + ((x - radius + W) % W)];
    }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let y = -radius; y <= radius; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) {
      out[y * W + x] = acc / (2 * radius + 1);
      acc += tmp[Math.min(H - 1, y + radius + 1) * W + x] - tmp[Math.max(0, y - radius) * W + x];
    }
  }
  return out;
}

const readMeta = (dir, id) => {
  try { return JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8')); } catch { return null; }
};

/** Mean coverage, weighted by cell area so the stretched polar rows do not dominate. */
function coverageOf(conf, W, H) {
  let sum = 0, area = 0;
  for (let y = 0; y < H; y++) {
    const a = Math.cos(((y + 0.5) / H - 0.5) * Math.PI);
    for (let x = 0; x < W; x++) sum += Math.min(1, Math.max(0, conf[y * W + x])) * a;
    area += a * W;
  }
  return sum / area;
}

/** Encode a layer into `dir` (the staging area by default). Returns its coverage. */
function encodeLayer(id, val, conf, W, H, meta, dir = STAGE) {
  const px = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = Math.round(Math.max(0, Math.min(1, val[i])) * 255);
    px[i * 3 + 1] = Math.round(Math.max(0, Math.min(1, conf[i])) * 255);
  }
  const raw = join(TMP, `${id}.rgb`);
  writeFileSync(raw, px);
  magick(['-size', `${W}x${H}`, '-depth', '8', `rgb:${raw}`, '-define', 'png:compression-level=9', join(dir, `${id}.png`)]);
  rmSync(raw, { force: true });
  const coverage = Number(coverageOf(conf, W, H).toFixed(5));
  writeFileSync(join(dir, `${id}.json`), JSON.stringify({ id, width: W, height: H, coverage, ...meta }, null, 1));
  return coverage;
}

/** Stage, compare with the published snapshot, then promote. */
function writeLayer(id, val, conf, W, H, meta, minRatio = 0.8, check = null) {
  if (!meta.dates?.length) throw new Error(`${id}: no usable day found`);
  check?.();
  const coverage = encodeLayer(id, val, conf, W, H, meta);
  const previous = readMeta(OUT, id);
  if (previous?.coverage && coverage < previous.coverage * minRatio) {
    throw new Error(`${id}: coverage ${coverage} is below ${minRatio} × published ${previous.coverage}; keeping ${previous.dates?.[0] ?? 'the previous snapshot'}`);
  }
  // PNG first, JSON last: the JSON is what tells the app a new day exists.
  for (const ext of ['png', 'json']) move(join(STAGE, `${id}.${ext}`), join(OUT, `${id}.${ext}`));
  console.log(`${id}: ${W}x${H} · coverage ${coverage} · ${meta.dates.at(-1)} → ${meta.dates[0]}`);
}

// Large global WMS renders can come back partial; ask for four quadrants and stitch them.
async function wmsQuadrants(layer, time, W, H) {
  const file = join(TMP, `${layer}_${time}_${W}_q.png`);
  if (existsSync(file)) return file;
  const parts = [];
  for (const [la0, la1] of [[0, 90], [-90, 0]]) for (const [lo0, lo1] of [[-180, 0], [0, 180]]) {
    parts.push(await wmsChecked(layer, time, [la0, lo0, la1, lo1], W / 2, H / 2, `${layer}_${time}_${W}_${la0}_${lo0}.png`));
  }
  magick(['(', parts[0], parts[1], '+append', ')', '(', parts[2], parts[3], '+append', ')', '-append', file]);
  return file;
}

async function availableDays(layer, cmap, n, W, H, maxTries = n + 6, quadrants = false, tiles = false) {
  const frames = [], dates = [];
  for (const day of daysBack(maxTries, new Date(Date.now() - 86400e3))) {
    if (frames.length >= n) break;
    try {
      const file = tiles ? await wmtsWorld(layer, day, W, H).catch(() => wmsChecked(layer, day, WORLD, W, H, `${layer}_${day}_${W}.png`))
        : quadrants ? await wmsQuadrants(layer, day, W, H) : await wmsChecked(layer, day, WORLD, W, H, `${layer}_${day}_${W}.png`);
      const buf = rgba(file);
      let filled = 0;
      for (let i = 3; i < buf.length; i += 64) if (buf[i] > 128) filled++;
      if (filled < 200) { rmSync(file, { force: true }); continue; } // empty day (not yet processed): do not cache it
      frames.push(buf); dates.push(day);
    } catch { /* missing day */ }
  }
  return { frames, dates };
}

// ---- Time series: the last twelve months and the latest day, as frames the app plays.
// Each frame is a grey JPEG (the value) and a smaller PNG (where there is data). Frames of
// past months never change, so they are kept and reused; only the latest frame is fetched
// every day. A series is promoted only when enough frames are present.

const pad = (n) => String(n).padStart(2, '0');
/** The 15th (or another day) of each of the last `n` complete months, oldest first. */
function pastMonths(n, day = 15, from = new Date()) {
  const out = [];
  for (let k = n; k >= 1; k--) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - k, day));
    out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(day)}`);
  }
  return out;
}

function encodeFrame(name, val, conf, W, H, confScale = 4) {
  const v = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) v[i] = Math.round(Math.max(0, Math.min(1, val[i])) * 255);
  const raw = join(TMP, `${name}.gray`);
  writeFileSync(raw, v);
  magick(['-size', `${W}x${H}`, '-depth', '8', `gray:${raw}`, '-quality', '92', '-strip', join(STAGE, `${name}.jpg`)]);
  const c = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) c[i] = Math.round(Math.max(0, Math.min(1, conf[i])) * 255);
  writeFileSync(raw, c);
  magick(['-size', `${W}x${H}`, '-depth', '8', `gray:${raw}`, '-filter', 'Box', '-resize', `${W / confScale}x${H / confScale}!`, '-define', 'png:compression-level=9', '-strip', join(STAGE, `${name}-c.png`)]);
  rmSync(raw, { force: true });
  return coverageOf(conf, W, H);
}

/**
 * steps: [{ key, time, live }] oldest first; `live` frames are fetched every run, the others
 * only when missing. build(step) returns { val, conf, dates } or null when the source has
 * nothing for that step.
 */
async function series(id, steps, build, meta, { W, H, minFrames, confScale = 4, cadence = 'month' }) {
  const frames = [];
  let last = null;
  for (const step of steps) {
    const name = `${id}-${step.key}`;
    const cached = !step.live && existsSync(join(OUT, `${name}.jpg`)) && existsSync(join(OUT, `${name}-c.png`));
    if (cached) { frames.push({ file: `${name}.jpg`, conf: `${name}-c.png`, time: step.time, kept: true }); continue; }
    try {
      checkDeadline(name);
      const r = await build(step);
      if (!r) console.warn(`${id}: nothing for ${step.time}`);
      else {
        encodeFrame(name, r.val, r.conf, W, H, confScale);
        frames.push({ file: `${name}.jpg`, conf: `${name}-c.png`, time: r.time ?? step.time });
        if (step.live) last = r;
      }
    } catch (err) { console.warn(`${id}: ${step.time} skipped (${err.message})`); }
    // Nothing new for this step: keep the frame already published, if there is one.
    if (frames.at(-1)?.file !== `${name}.jpg` && existsSync(join(OUT, `${name}.jpg`)) && existsSync(join(OUT, `${name}-c.png`))) {
      const old = readMeta(OUT, id)?.frames?.find((f) => f.file === `${name}.jpg`);
      frames.push({ file: `${name}.jpg`, conf: `${name}-c.png`, time: old?.time ?? step.time, kept: true });
      console.warn(`${id}: keeping the published frame for ${step.time}`);
    }
  }
  if (frames.length < minFrames) throw new Error(`${id}: only ${frames.length}/${steps.length} frames; keeping the published series`);
  for (const f of frames) if (!f.kept) for (const file of [f.file, f.conf]) move(join(STAGE, file), join(OUT, file));
  const previous = readMeta(OUT, id);
  writeAtomic(join(OUT, `${id}.json`), JSON.stringify({
    id, width: W, height: H, cadence, ...meta,
    dates: last?.dates ?? previous?.dates ?? [frames.at(-1).time],
    frames: frames.map(({ file, conf, time }) => ({ file, conf, time })),
  }, null, 1));
  const keep = new Set(frames.flatMap((f) => [f.file, f.conf]));
  const own = new RegExp(`^${id}-[\\d-]+(-c)?\\.(jpg|png)$`);
  for (const old of readdirSync(OUT)) if (own.test(old) && !keep.has(old)) rmSync(join(OUT, old));
  for (const old of [`${id}.png`]) rmSync(join(OUT, old), { force: true });
  console.log(`${id}: ${frames.length} frames, ${frames[0].time} → ${frames.at(-1).time}`);
}

/**
 * The whole world from GIBS WMTS tiles (pre-rendered and cached on their side, so they do
 * not come back half drawn like large WMS renders sometimes do). In EPSG:4326, level 2 has
 * 5 × 3 tiles of 72°, 512 px each: 2560 × 1280 px for the world, resized to W × H.
 */
/** Tile matrix set of each layer in GIBS (they come at different native resolutions). */
const MATRIX = {
  OMPS_Ozone_Total_Column: '2km', TROPOMI_L2_Nitrogen_Dioxide_Tropospheric_Column: '2km',
  TROPOMI_L2_Sulfur_Dioxide_Total_Vertical_Column: '2km', VIIRS_NOAA20_NDSI_Snow_Cover: '500m',
};

async function wmtsWorld(layer, time, W, H, matrix = MATRIX[layer] ?? '1km') {
  const file = join(TMP, `${layer}_${time}_wmts_${W}.png`);
  if (existsSync(file)) return file;
  const tiles = [];
  for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) {
    const t = join(TMP, `${layer}_${time}_wmts_${x}_${y}.png`);
    writeFileSync(t, await fetchBuffer(`${GIBS}/wmts/epsg4326/best/${layer}/default/${time}/${matrix}/2/${y}/${x}.png`));
    tiles.push(t);
  }
  const rows = [0, 1, 2].map((y) => ['(', ...tiles.slice(y * 5, y * 5 + 5), '+append', ')']).flat();
  magick([...rows, '-append', '-crop', '2560x1280+0+0', '+repage', '-filter', 'Box', '-resize', `${W}x${H}!`, file]);
  for (const t of tiles) rmSync(t, { force: true });
  return file;
}

/** One day of a daily GIBS product, with the nearest earlier day as fallback. */
async function dayNear(layer, cmap, day, W, H, quadrants = false, tries = 5, tiles = false) {
  const start = new Date(`${day}T00:00:00Z`);
  for (const d of daysBack(tries, start)) {
    try {
      const file = tiles ? await wmtsWorld(layer, d, W, H).catch(() => wmsChecked(layer, d, WORLD, W, H, `${layer}_${d}_${W}.png`))
        : quadrants ? await wmsQuadrants(layer, d, W, H) : await wmsChecked(layer, d, WORLD, W, H, `${layer}_${d}_${W}.png`);
      const buf = rgba(file);
      let filled = 0;
      for (let i = 3; i < buf.length; i += 64) if (buf[i] > 128) filled++;
      if (filled >= 200) return { buf, day: d };
      rmSync(file, { force: true });
    } catch { /* try the day before */ }
  }
  return null;
}

/** A monthly GIBS product (TIME is the first day of the month). */
async function monthOf(layer, month, W, H) {
  const file = await wmsChecked(layer, month, WORLD, W, H, `${layer}_${month}_${W}.png`);
  const buf = rgba(file);
  let filled = 0;
  for (let i = 3; i < buf.length; i += 64) if (buf[i] > 128) filled++;
  return filled >= 200 ? buf : null;
}

/** A daily product sampled on the 15th of each of the last twelve months, plus the latest day. */
async function daySeries(id, layer, cmap, norm, W, H, meta) {
  const steps = [...months(12, 15), { key: 'latest', time: iso(new Date()), live: true }];
  await series(id, steps, async (step) => {
    // WMTS tiles first: a whole-world WMS render of these products often comes back partial.
    const r = await dayNear(layer, cmap, step.live ? iso(new Date(Date.now() - 86400e3)) : step.time, W, H, false, step.live ? 7 : 4, true);
    if (!r) return null;
    const { val, w } = composite([r.buf], cmap, norm, W, H);
    return { val: pushPull(val, w, W, H), conf: blurCoverage(w, W, H, 2), dates: [r.day], time: r.day };
  }, meta, { W, H, minFrames: 12, cadence: 'day' });
}

const months = (n, day) => pastMonths(n, day).map((t) => ({ key: t.slice(0, 7), time: t }));

/** Pixel-wise maximum of several frames, in normalised units (for things seen only now and then). */
function maxComposite(frames, cmap, norm, W, H) {
  const val = new Float32Array(W * H);
  for (const buf of frames) for (let i = 0; i < W * H; i++) {
    if (buf[i * 4 + 3] < 128) continue;
    const v = cmap.get((buf[i * 4] << 16) | (buf[i * 4 + 1] << 8) | buf[i * 4 + 2]);
    if (v !== undefined) val[i] = Math.max(val[i], norm(v));
  }
  return val;
}

/** Points published as a small JSON file, kept when the new list looks broken. */
function writePoints(id, list, meta, min = 1) {
  const previous = readMeta(OUT, id);
  if (list.length < min || (previous?.count && list.length < previous.count * 0.3)) throw new Error(`${id}: ${list.length} items look incomplete; keeping the published file`);
  writeAtomic(join(OUT, `${id}.json`), JSON.stringify({ id, count: list.length, fetched: new Date().toISOString(), ...meta, list }));
  console.log(`${id}: ${list.length}`);
}

async function getJson(url) { return JSON.parse((await fetchBuffer(url)).toString()); }

/**
 * A grid from ERDDAP drawn as a grey image (BlackWhite colour bar: grey level = value), placed
 * on the global W × H grid. `rows` is the latitude span of the source image, north first.
 */
async function erddapGrey(url, file, srcW, srcH, [north, south], W, H, shiftLon = 0) {
  writeFileSync(file, await fetchBuffer(url));
  const buf = rgba(file);
  if (buf.length !== srcW * srcH * 4) throw new Error(`unexpected size ${buf.length / 4} px`);
  const val = new Float32Array(W * H), w = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const lat = 90 - ((y + 0.5) * 180) / H;
    if (lat > north + 0.3 || lat < south - 0.3) continue;
    const sy = Math.min(srcH - 1, Math.max(0, Math.round(((north - lat) / (north - south)) * (srcH - 1))));
    for (let x = 0; x < W; x++) {
      const sx = (Math.floor((x * srcW) / W) + shiftLon) % srcW;
      const k = (sy * srcW + sx) * 4;
      if (buf[k + 3] > 128) { val[y * W + x] = buf[k + 1] / 255; w[y * W + x] = 1; }
    }
  }
  return { val, w };
}

const layers = {
  async chlorophyll() {
    // Phytoplankton through the year: each month is a composite of six days (clouds hide the
    // sea most days); the latest frame fuses the last twelve days.
    const W = 2048, H = 1024, cmap = await colormap('MODIS_Chlorophyll');
    const lo = -2, hi = 1.3; // log10 mg/m³
    const norm = (v) => (Math.log10(Math.max(v, 0.005)) - lo) / (hi - lo);
    const fuse = (frames) => {
      const { val, w } = composite(frames, cmap, norm, W, H);
      return { val: pushPull(val, w, W, H), conf: blurCoverage(w, W, H, 6).map((c) => Math.min(1, c * 2.2)) };
    };
    const steps = [...months(12, 15), { key: 'latest', time: iso(new Date()), live: true }];
    await series('chlorophyll', steps, async (step) => {
      if (step.live) {
        const { frames, dates } = await availableDays('OCI_PACE_Chlorophyll_a', cmap, 12, W, H, 18, false, true);
        return frames.length >= 6 ? { ...fuse(frames), dates, time: dates[0] } : null;
      }
      const bufs = [];
      for (const day of [3, 8, 13, 18, 23, 28]) {
        const r = await dayNear('OCI_PACE_Chlorophyll_a', cmap, `${step.key}-${pad(day)}`, W, H, false, 2, true);
        if (r) bufs.push(r.buf);
      }
      return bufs.length >= 3 ? fuse(bufs) : null;
    }, { unit: 'mg/m³', scale: 'log10', min: lo, max: hi, source: 'NASA PACE OCI · GIBS', layer: 'OCI_PACE_Chlorophyll_a' }, { W, H, minFrames: 9 });
  },
  async sst() {
    const W = 2048, H = 1024, cmap = await colormap('GHRSST_Sea_Surface_Temperature');
    const lo = -2, hi = 34;
    await daySeries('sst', 'GHRSST_L4_MUR_Sea_Surface_Temperature', cmap, (v) => (v - lo) / (hi - lo), W, H,
      { unit: '°C', scale: 'linear', min: lo, max: hi, source: 'GHRSST MUR · JPL · GIBS', layer: 'GHRSST_L4_MUR_Sea_Surface_Temperature' });
  },
  async anomaly() {
    const W = 2048, H = 1024, cmap = await colormap('GHRSST_Sea_Surface_Temperature_Anomalies');
    const lo = -3, hi = 3; // the NASA colormap saturates at ±3 °C
    await daySeries('anomaly', 'GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies', cmap, (v) => (v - lo) / (hi - lo), W, H,
      { unit: '°C', scale: 'linear', min: lo, max: hi, source: 'GHRSST MUR · JPL · GIBS', layer: 'GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies' });
  },
  async ice() {
    // The sea ice through the year, twice a month: the Arctic melts while the Antarctic grows.
    const W = 2048, H = 1024, cmap = await colormap('GHRSST_Sea_Ice_Concentration');
    const steps = [];
    for (const m of pastMonths(12, 1)) for (const day of [1, 16]) steps.push({ key: `${m.slice(0, 7)}-${pad(day)}`, time: `${m.slice(0, 7)}-${pad(day)}` });
    steps.push({ key: 'latest', time: iso(new Date()), live: true });
    await series('ice', steps, async (step) => {
      const r = step.live
        ? await dayNear('GHRSST_L4_GAMSSA_GDS2_Sea_Ice_Concentration', cmap, iso(new Date(Date.now() - 86400e3)), W, H, true, 7)
        : await dayNear('GHRSST_L4_GAMSSA_GDS2_Sea_Ice_Concentration', cmap, step.time, W, H, true, 4);
      if (!r) return null;
      const { val, w } = composite([r.buf], cmap, (v) => v / 100, W, H);
      const half = (y0, y1) => coverageOf(w.subarray(y0 * W, y1 * W), W, y1 - y0);
      if (half(0, H / 2) < 0.005 || half(H / 2, H) < 0.005) throw new Error('polar coverage looks incomplete');
      return { val, conf: w, dates: [r.day], time: r.day };
    }, { unit: '%', scale: 'linear', min: 0, max: 100, source: 'GHRSST GAMSSA · Bureau of Meteorology · GIBS', layer: 'GHRSST_L4_GAMSSA_GDS2_Sea_Ice_Concentration' },
    { W, H, minFrames: 18, confScale: 1, cadence: 'day' });
  },
  async ndvi() {
    // How green the land is, month by month (VIIRS NDVI, monthly composites).
    const W = 2048, H = 1024, cmap = await colormap('MODIS_L3_NDVI');
    const steps = months(13, 1);
    await series('ndvi', steps, async (step) => {
      const buf = await monthOf('VIIRS_SNPP_L3_NDVI_Monthly', step.time, W, H);
      if (!buf) return null;
      const { val, w } = composite([buf], cmap, (v) => (v + 0.1) / 1.1, W, H);
      return { val: pushPull(val, w, W, H), conf: blurCoverage(w, W, H, 1), dates: [step.time] };
    }, { unit: 'NDVI', scale: 'linear', min: -0.1, max: 1, source: 'NASA VIIRS SNPP · NDVI mensile · GIBS', layer: 'VIIRS_SNPP_L3_NDVI_Monthly' }, { W, H, minFrames: 10 });
  },
  async aerosol() {
    // What the air carries, month by month: dust, smoke, haze (MERRA-2 reanalysis, AOD at 550 nm).
    const W = 2048, H = 1024, cmap = await colormap('MERRA2_Total_Aerosol_Optical_Thickness_550nm_Extinction_Monthly');
    const steps = months(13, 1);
    await series('aerosol', steps, async (step) => {
      const buf = await monthOf('MERRA2_Total_Aerosol_Optical_Thickness_550nm_Extinction_Monthly', step.time, W, H);
      if (!buf) return null;
      const { val, w } = composite([buf], cmap, (v) => Math.min(1, Math.max(0, v) / 1.0), W, H);
      // MERRA-2 cells are half a degree: soften their edges rather than show the grid.
      return { val: blurCoverage(pushPull(val, w, W, H), W, H, 4), conf: blurCoverage(w, W, H, 3), dates: [step.time] };
    }, { unit: 'AOD 550 nm', scale: 'linear', min: 0, max: 1, source: 'NASA GMAO MERRA-2 · GIBS', layer: 'MERRA2_Total_Aerosol_Optical_Thickness_550nm_Extinction_Monthly' }, { W, H, minFrames: 10 });
  },
  async coral() {
    // Heat stress on coral reefs, month by month: NOAA Coral Reef Watch Degree Heating Weeks
    // (5 km, via PacIOOS ERDDAP), read as a grey image whose level is the value.
    const W = 1800, H = 900, MAX = 20; // °C-weeks; bleaching is likely from 4, mortality from 8
    const steps = [...months(12, 15), { key: 'latest', time: iso(new Date(Date.now() - 2 * 86400e3)), live: true }];
    await series('coral', steps, async (step) => {
      const url = 'https://pae-paha.pacioos.hawaii.edu/erddap/griddap/dhw_5km.transparentPng?'
        + `CRW_DHW%5B(${step.time}T12:00:00Z)%5D%5B(89.975):4:(-89.975)%5D%5B(-179.975):4:(179.975)%5D`
        + `&.colorBar=BlackWhite%7CC%7CLinear%7C0%7C${MAX}%7C&.draw=surface`;
      const file = join(TMP, `coral_${step.time}.png`);
      writeFileSync(file, await fetchBuffer(url));
      const buf = rgba(file);
      if (buf.length !== W * H * 4) throw new Error(`unexpected size ${buf.length / 4} px`);
      const val = new Float32Array(W * H), w = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) if (buf[i * 4 + 3] > 128) { val[i] = buf[i * 4 + 1] / 255; w[i] = 1; }
      return { val: pushPull(val, w, W, H), conf: blurCoverage(w, W, H, 1), dates: [step.time], time: step.time };
    }, { unit: '°C-settimane', scale: 'linear', min: 0, max: MAX, source: 'NOAA Coral Reef Watch · Degree Heating Week · PacIOOS ERDDAP', layer: 'CRW_DHW' },
    { W, H, minFrames: 10, cadence: 'day' });
  },
  async ozone() {
    // The ozone layer through the year: the hole opens over Antarctica every southern spring.
    // OMPS sees by sunlight, so the polar night has no data (and the map fades there).
    const W = 2048, H = 1024, cmap = await colormap('OMPS_Ozone_Total_Column');
    const lo = 100, hi = 500;
    await daySeries('ozone', 'OMPS_Ozone_Total_Column', cmap, (v) => (v - lo) / (hi - lo), W, H,
      { unit: 'DU', scale: 'linear', min: lo, max: hi, source: 'NASA/NOAA OMPS · ozono totale · GIBS', layer: 'OMPS_Ozone_Total_Column' });
  },
  async no2() {
    // Nitrogen dioxide, the gas of engines and chimneys: one month of Sentinel-5P TROPOMI days
    // per frame (clouds hide most of a single day), the latest frame fuses the last ten days.
    const W = 2048, H = 1024, cmap = await colormap('OMI_Nitrogen_Dioxide_Tropo_Column');
    const lo = 14.5, hi = 16.3; // log10 molecules/cm²
    const norm = (v) => (Math.log10(Math.max(v, 10 ** lo)) - lo) / (hi - lo);
    const layer = 'TROPOMI_L2_Nitrogen_Dioxide_Tropospheric_Column';
    const fuse = (frames) => {
      const { val, w } = composite(frames, cmap, norm, W, H);
      return { val: pushPull(val, w, W, H), conf: blurCoverage(w, W, H, 3).map((c) => Math.min(1, c * 2)) };
    };
    const steps = [...months(12, 15), { key: 'latest', time: iso(new Date()), live: true }];
    await series('no2', steps, async (step) => {
      if (step.live) {
        const { frames, dates } = await availableDays(layer, cmap, 10, W, H, 14, false, true);
        return frames.length >= 5 ? { ...fuse(frames), dates, time: dates[0] } : null;
      }
      const bufs = [];
      for (const day of [3, 8, 13, 18, 23, 28]) {
        const r = await dayNear(layer, cmap, `${step.key}-${pad(day)}`, W, H, false, 2, true);
        if (r) bufs.push(r.buf);
      }
      return bufs.length >= 3 ? fuse(bufs) : null;
    }, { unit: 'molecole/cm²', scale: 'log10', min: lo, max: hi, source: 'ESA/Copernicus Sentinel-5P TROPOMI · NASA GIBS', layer }, { W, H, minFrames: 10 });
  },
  async snow() {
    // Where snow lies, month by month: the most snow seen over eight days of each month
    // (VIIRS sees the ground only between clouds; ground without snow and clouds look alike,
    // so this shows where snow was seen, not where it surely was not).
    const W = 2048, H = 1024, cmap = await colormap('MODIS_NDSI_Snow_Cover');
    const layer = 'VIIRS_NOAA20_NDSI_Snow_Cover';
    const norm = (v) => (v >= 1 && v <= 100 ? v / 100 : NaN);
    const fuse = (frames) => {
      const val = maxComposite(frames, cmap, (v) => (Number.isNaN(norm(v)) ? 0 : norm(v)), W, H);
      return { val, conf: new Float32Array(W * H).fill(1) };
    };
    const steps = [...months(12, 15), { key: 'latest', time: iso(new Date()), live: true }];
    await series('snow', steps, async (step) => {
      if (step.live) {
        const { frames, dates } = await availableDays(layer, cmap, 8, W, H, 12, false, true);
        return frames.length >= 4 ? { ...fuse(frames), dates, time: dates[0] } : null;
      }
      const bufs = [];
      for (const day of [2, 6, 10, 14, 18, 22, 26, 28]) {
        const r = await dayNear(layer, cmap, `${step.key}-${pad(day)}`, W, H, false, 2, true);
        if (r) bufs.push(r.buf);
      }
      return bufs.length >= 4 ? fuse(bufs) : null;
    }, { unit: '%', scale: 'linear', min: 0, max: 100, source: 'NASA VIIRS NOAA-20 · copertura nevosa NDSI · GIBS', layer }, { W, H, minFrames: 10, confScale: 8 });
  },
  async so2() {
    // Sulphur dioxide of the last four days, the breath of volcanoes (and of some smelters).
    const W = 2048, H = 1024, cmap = await colormap('OMI_SO2_Lower_Troposphere');
    const layer = 'TROPOMI_L2_Sulfur_Dioxide_Total_Vertical_Column';
    const { frames, dates } = await availableDays(layer, cmap, 4, W, H, 8, false, true);
    if (frames.length < 2) throw new Error('so2: not enough days');
    const val = maxComposite(frames, cmap, (v) => Math.min(1, Math.max(0, (v - 1) / 15)), W, H);
    writeLayer('so2', val, new Float32Array(W * H).fill(1), W, H, { unit: 'DU', scale: 'linear', min: 1, max: 16, dates, source: 'ESA/Copernicus Sentinel-5P TROPOMI · NASA GIBS', layer });
  },
  async cyclones() {
    // Tropical cyclones of the last ten days, with their tracks (IBTrACS, about two days late).
    const csv = (await fetchBuffer('https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.ACTIVE.list.v04r01.csv')).toString();
    const lines = csv.trim().split('\n');
    const cols = lines[0].split(',');
    const ci = (n) => cols.indexOf(n);
    const [iSid, iName, iBasin, iTime, iLat, iLon, iWind, iUsa] = ['SID', 'NAME', 'BASIN', 'ISO_TIME', 'LAT', 'LON', 'WMO_WIND', 'USA_WIND'].map(ci);
    const storms = new Map();
    for (const l of lines.slice(2)) {
      const c = l.split(',');
      const wind = Number(c[iWind]) || Number(c[iUsa]) || null;
      const s = storms.get(c[iSid]) ?? { name: c[iName], basin: c[iBasin], track: [] };
      s.track.push([c[iTime].replace(' ', 'T') + 'Z', Number(c[iLat]), Number(c[iLon]), wind]);
      storms.set(c[iSid], s);
    }
    const since = Date.now() - 10 * 86400e3;
    const list = [...storms.entries()].filter(([, s]) => Date.parse(s.track.at(-1)[0]) > since)
      .map(([sid, s]) => ({ sid, name: s.name === 'NOT_NAMED' ? null : s.name, basin: s.basin, peak: Math.max(0, ...s.track.map((p) => p[3] ?? 0)), track: s.track }));
    writeAtomic(join(OUT, 'cyclones.json'), JSON.stringify({ id: 'cyclones', count: list.length, fetched: new Date().toISOString(), days: 10, unit: 'kt', source: 'NOAA NCEI IBTrACS v04r01 · ACTIVE', list }));
    console.log(`cyclones: ${list.length} in the last 10 days`);
  },
  async volcanoes() {
    // Eruptions still going on, from the Smithsonian Global Volcanism Program.
    const d = await getJson("https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=GVP-VOTW:E3WebApp_Eruptions1960&outputFormat=application/json&CQL_FILTER=ContinuingEruption%3D%27True%27");
    const list = (d.features ?? []).map((f) => {
      const p = f.properties;
      return { name: p.VolcanoName, number: p.VolcanoNumber, lat: p.LatitudeDecimal, lon: p.LongitudeDecimal, since: p.StartDate, vei: p.ExplosivityIndexMax };
    }).filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lon));
    writePoints('volcanoes', list, { source: 'Smithsonian Institution, Global Volcanism Program · Volcanoes of the World' }, 10);
  },
  async icebergs() {
    // The named Antarctic icebergs tracked by the US National Ice Center, about once a week.
    const csv = (await fetchBuffer('https://usicecenter.gov/File/DownloadCurrent?pId=134')).toString().replace(/^\uFEFF/, '');
    const rows = csv.trim().split('\n').slice(1).map((l) => l.split(','));
    const list = rows.map((c) => ({ name: c[0], lengthNm: Number(c[1]), widthNm: Number(c[2]), lat: Number(c[3]), lon: Number(c[4]), km2: Number(c[7]), updated: c[8]?.trim() }))
      .filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lon));
    writePoints('icebergs', list, { source: 'U.S. National Ice Center · Antarctic icebergs' }, 5);
  },
  async slicks() {
    // Oil slicks found by SkyTruth Cerulean in Sentinel-1 radar images, the last thirty days,
    // only the detections the model is surest about. Machine detections: not reviewed by a
    // person, and SkyTruth does not judge whether a slick is illegal. CC BY-SA 4.0.
    const end = new Date(), start = new Date(Date.now() - 30 * 86400e3);
    const list = [];
    for (let offset = 0; offset < 20000; offset += 1000) {
      checkDeadline('slicks');
      const q = new URLSearchParams({
        limit: '1000', offset: String(offset), datetime: `${start.toISOString().slice(0, 19)}Z/${end.toISOString().slice(0, 19)}Z`,
        filter: 'machine_confidence > 0.95', properties: 'slick_timestamp,area,machine_confidence',
      });
      const page = await getJson(`https://api.cerulean.skytruth.org/collections/public.slick_plus/items?${q}`);
      for (const f of page.features ?? []) {
        let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
        const walk = (c) => { if (typeof c[0] === 'number') { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } else c.forEach(walk); };
        if (!f.geometry) continue;
        walk(f.geometry.coordinates);
        const p = f.properties;
        if (Math.abs((y0 + y1) / 2) > 70) continue; // sea ice fools the radar model
        list.push([+((y0 + y1) / 2).toFixed(3), +((x0 + x1) / 2).toFixed(3), +(Number(p.area) / 1e6).toFixed(2), p.slick_timestamp.slice(0, 10)]);
      }
      if ((page.features?.length ?? 0) < 1000) break;
    }
    writePoints('slicks', list, { days: 30, fields: ['lat', 'lon', 'km2', 'date'], source: 'SkyTruth Cerulean · Sentinel-1 · CC BY-SA 4.0' }, 100);
  },
  async sealevel() {
    // Sea level anomaly, month by month: El Niño, eddies and the bulge of warm water, in metres
    // above or below the 1993-2012 mean (NOAA CoastWatch blended altimetry, 0.25°).
    const W = 1440, H = 720, LO = -0.5, HI = 0.5;
    const steps = [...months(12, 15), { key: 'latest', time: iso(new Date(Date.now() - 2 * 86400e3)), live: true }];
    await series('sealevel', steps, async (step) => {
      for (const day of daysBack(4, new Date(`${step.time}T00:00:00Z`))) {
        try {
          const url = 'https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDsshDaily.transparentPng?'
            + `sla%5B(${day}T00:00:00Z)%5D%5B(89.875):1:(-89.875)%5D%5B(-179.875):1:(179.875)%5D&.colorBar=BlackWhite%7CC%7CLinear%7C${LO}%7C${HI}%7C&.draw=surface`;
          const { val, w } = await erddapGrey(url, join(TMP, `sla_${day}.png`), 1440, 720, [89.875, -89.875], W, H);
          if (coverageOf(w, W, H) < 0.3) continue;
          return { val: pushPull(val, w, W, H), conf: blurCoverage(w, W, H, 1), dates: [day], time: day };
        } catch { /* the day before */ }
      }
      return null;
    }, { unit: 'm', scale: 'linear', min: LO, max: HI, source: 'NOAA CoastWatch · blended sea level anomaly · ERDDAP', layer: 'noaacwBLENDEDsshDaily' },
    { W, H, minFrames: 10, cadence: 'day' });
  },
  async waves() {
    // The waves of the last day, hour by hour: significant wave height from the WaveWatch III
    // model (NOAA, via PacIOOS ERDDAP, 0.5°). A model run, not a measurement.
    const W = 720, H = 360, MAX = 12;
    const end = new Date(); end.setUTCMinutes(0, 0, 0);
    const steps = [];
    for (let k = 23; k >= 0; k -= 1) {
      const t = new Date(end.getTime() - k * 3600e3).toISOString().replace('.000', '');
      steps.push({ key: `h${String(23 - k).padStart(2, '0')}`, time: t, live: true });
    }
    await series('waves', steps, async (step) => {
      const url = 'https://pae-paha.pacioos.hawaii.edu/erddap/griddap/ww3_global.transparentPng?'
        + `Thgt%5B(${step.time})%5D%5B(0.0)%5D%5B(77.5):1:(-77.5)%5D%5B(0.0):1:(359.5)%5D&.colorBar=BlackWhite%7CC%7CLinear%7C0%7C${MAX}%7C&.draw=surface`;
      // The source starts at 0° E: shift by half a turn to start at 180° W like every layer.
      const { val, w } = await erddapGrey(url, join(TMP, `waves_${step.key}.png`), 720, 311, [77.5, -77.5], W, H, 360);
      if (coverageOf(w, W, H) < 0.3) return null;
      return { val, conf: w, dates: [step.time], time: step.time };
    }, { unit: 'm', scale: 'linear', min: 0, max: MAX, source: 'NOAA WaveWatch III · PacIOOS ERDDAP', layer: 'ww3_global Thgt' },
    { W, H, minFrames: 18, confScale: 1, cadence: 'hour' });
  },
  async rain() {
    // Last 24 hours of global rain, one frame per hour, promoted only as a complete set.
    const W = 2048, H = 1024, cmap = await colormap('GPM_Precipitation_Rate');
    const end = new Date(Date.now() - 9 * 3600e3);
    end.setUTCMinutes(0, 0, 0);
    const frames = [];
    // Frames carry the run's stamp, so the old loop stays intact until the new manifest is in place.
    const stamp = end.toISOString().slice(0, 13).replace(/[-T:]/g, '');
    for (let k = 23; k >= 0; k--) {
      const t = new Date(end.getTime() - k * 3600e3).toISOString().replace('.000', '');
      try {
        const buf = rgba(await wmsChecked('IMERG_Precipitation_Rate_30min', t, WORLD, W, H, `rain_${t.replace(/:/g, '')}.png`));
        let filled = 0;
        for (let i = 3; i < buf.length; i += 64) if (buf[i] > 128) filled++;
        if (filled < 200) { rmSync(join(TMP, `rain_${t.replace(/:/g, '')}.png`), { force: true }); throw new Error('empty frame'); }
        const { val, w } = composite([buf], cmap, (v) => Math.min(1, Math.log10(1 + v) / Math.log10(1 + 50)), W, H);
        const name = `rain-${stamp}-${String(frames.length).padStart(2, '0')}`;
        encodeLayer(name, val, w, W, H, { time: t });
        frames.push({ file: `${name}.png`, time: t });
      } catch (err) { console.warn('rain frame missing', t, err.message); }
    }
    if (frames.length < 20) throw new Error(`rain: only ${frames.length}/24 frames; keeping the published loop`);
    for (const f of frames) for (const ext of ['png', 'json']) {
      const name = f.file.replace('.png', `.${ext}`);
      move(join(STAGE, name), join(OUT, name));
    }
    writeAtomic(join(OUT, 'rain.json'), JSON.stringify({ id: 'rain', unit: 'mm/h', scale: 'log10(1+x)/log10(51)', min: 0, max: 50, source: 'NASA GPM IMERG · GIBS', layer: 'IMERG_Precipitation_Rate_30min', frames }, null, 1));
    const keep = new Set(frames.flatMap((f) => [f.file, f.file.replace('.png', '.json')]));
    for (const old of readdirSync(OUT)) if (/^rain-[\d-]+\.(png|json)$/.test(old) && !keep.has(old)) rmSync(join(OUT, old));
    console.log(`rain: ${frames.length} frames, ${frames[0].time} → ${frames.at(-1).time}`);
  },
  async fires() {
    const csv = (await fetchBuffer('https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_7d.csv')).toString();
    const lines = csv.trim().split('\n');
    const cols = lines[0].split(',');
    const ci = (n) => cols.indexOf(n);
    const [iLat, iLon, iFrp, iDate, iConf] = [ci('latitude'), ci('longitude'), ci('frp'), ci('acq_date'), ci('confidence')];
    const cells = new Map();
    let newest = '';
    for (let k = 1; k < lines.length; k++) {
      const c = lines[k].split(',');
      if (c[iConf] === 'l') continue;
      const lat = +c[iLat], lon = +c[iLon], frp = +c[iFrp] || 1, date = c[iDate];
      if (date > newest) newest = date;
      const key = `${Math.round(lat * 20)}_${Math.round(lon * 20)}`; // 0.05° cells
      const cell = cells.get(key) ?? { lat: 0, lon: 0, frp: 0, n: 0, date: '' };
      cell.lat += lat; cell.lon += lon; cell.frp += frp; cell.n++;
      if (date > cell.date) cell.date = date;
      cells.set(key, cell);
    }
    const previous = readMeta(OUT, 'fires');
    if (!newest || cells.size < 1000 || (previous?.count && cells.size < previous.count * 0.3)) {
      throw new Error(`fires: ${cells.size} cells look incomplete; keeping the published file`);
    }
    const out = new Float32Array(cells.size * 4);
    let i = 0;
    for (const c of cells.values()) {
      const age = (Date.parse(newest) - Date.parse(c.date)) / 86400e3;
      out.set([c.lat / c.n, c.lon / c.n, c.frp, age], i); i += 4;
    }
    writeFileSync(join(STAGE, 'fires.bin'), Buffer.from(out.buffer));
    move(join(STAGE, 'fires.bin'), join(OUT, 'fires.bin'));
    writeAtomic(join(OUT, 'fires.json'), JSON.stringify({ id: 'fires', count: cells.size, detections: lines.length - 1, newest, days: 7, source: 'NASA FIRMS · VIIRS NOAA-20' }, null, 1));
    console.log(`fires: ${cells.size} cells from ${lines.length - 1} detections, newest ${newest}`);
  },
  async quakes() {
    // USGS: every earthquake of magnitude 2.5 or more in the last seven days (public domain).
    const feed = JSON.parse((await fetchBuffer('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson')).toString());
    const list = (feed.features ?? [])
      .filter((f) => f.properties?.type === 'earthquake' && Number.isFinite(f.properties.mag) && f.geometry?.coordinates?.length >= 3)
      .map((f) => {
        const [lon, lat, depth] = f.geometry.coordinates;
        return [+lon.toFixed(3), +lat.toFixed(3), Math.round(Math.max(0, depth)), +f.properties.mag.toFixed(1), f.properties.time, f.properties.place ?? ''];
      })
      .sort((x, y) => x[4] - y[4]);
    const previous = readMeta(OUT, 'quakes');
    if (list.length < 100 || (previous?.count && list.length < previous.count * 0.3)) {
      throw new Error(`quakes: ${list.length} events look incomplete; keeping the published file`);
    }
    const newest = new Date(list.at(-1)[4]).toISOString();
    writeAtomic(join(OUT, 'quakes.json'), JSON.stringify({ id: 'quakes', count: list.length, newest, days: 7, minMagnitude: 2.5, source: 'USGS Earthquake Hazards Program', quakes: list }));
    console.log(`quakes: ${list.length} events, newest ${newest}`);
  },
};

const pick = process.argv.slice(2);
for (const [id, job] of Object.entries(layers)) {
  if (pick.length && !pick.includes(id)) continue;
  const t = Date.now();
  try { await job(); } catch (err) { console.error(`${id} failed:`, err.message); process.exitCode = 1; }
  console.log(`  ${id} in ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
