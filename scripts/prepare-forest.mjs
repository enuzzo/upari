// Tree cover loss 2001–2024 (Hansen et al., University of Maryland / Global Forest Watch,
// CC BY 4.0), from the Global Forest Watch tiles at zoom 3 (about 10 km per pixel), where
// each pixel carries the year of loss (blue) and how much of it there is (red).
// Output: public/layers/forest.png (red: year × 10, green: intensity) and forest.json with the
// share of each year's loss. The data change once a year: run it by hand.
// Usage: node scripts/prepare-forest.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VERSION = 'v1.12';
const URL = (z, x, y) => `https://tiles.globalforestwatch.org/umd_tree_cover_loss/${VERSION}/dynamic/${z}/${x}/${y}.png?implementation=tcd_30`;
const Z = 3, N = 2 ** Z, T = 512, W = 4096, H = 2048;
const tmp = mkdtempSync(join(tmpdir(), 'upari-forest-'));

const mosaic = new Uint8Array(N * T * N * T * 4);
const missing = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** A tile as RGBA pixels, or null when the server has nothing for it. */
async function tile(z, x, y) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(URL(z, x, y), { redirect: 'follow' });
    await sleep(150); // be gentle with the tile server
    if (res.ok) {
      const file = join(tmp, `${z}_${x}_${y}.png`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return execFileSync('magick', [file, '-depth', '8', 'rgba:-'], { maxBuffer: 1 << 24 });
    }
    await sleep(1500);
  }
  return null;
}
const put = (px, tx, ty) => { for (let y = 0; y < T; y++) Buffer.from(mosaic.buffer).set(px.subarray(y * T * 4, (y + 1) * T * 4), ((ty * T + y) * N * T + tx * T) * 4); };
// Rows 6 and 7 at zoom 3 lie south of 66.5° S (Antarctica): no forest, and the tile server
// answers them with an error, so they are skipped.
const SOUTH_LIMIT_ROW = 6;
for (let ty = 0; ty < N; ty++) for (let tx = 0; tx < N; tx++) {
  if (ty >= SOUTH_LIMIT_ROW) continue;
  const px = await tile(Z, tx, ty);
  if (px) { put(px, tx, ty); continue; }
  // Tiles reaching past the data (about 57° S) are refused: build them from their four
  // children, keeping in each 2 × 2 block the pixel with the most loss.
  const half = Buffer.alloc(T * T * 4);
  let any = false;
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const c = await tile(Z + 1, tx * 2 + dx, ty * 2 + dy);
    if (!c) continue;
    any = true;
    for (let y = 0; y < T / 2; y++) for (let x = 0; x < T / 2; x++) {
      let best = -1;
      for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const k = ((y * 2 + sy) * T + x * 2 + sx) * 4;
        if (c[k + 3] && (best < 0 || c[k] > c[best])) best = k;
      }
      if (best >= 0) c.copy(half, ((dy * T / 2 + y) * T + dx * T / 2 + x) * 4, best, best + 4);
    }
  }
  if (any) put(half, tx, ty); else missing.push(`${tx},${ty}`);
}
if (missing.length > 4) throw new Error(`too many missing tiles: ${missing.join(' ')}`);
if (missing.length) console.warn(`empty tiles: ${missing.join(' ')}`);
const MW = N * T;

// Web Mercator mosaic → equirectangular, nearest pixel (years must not be blended).
const out = Buffer.alloc(W * H * 3);
const byYear = new Float64Array(25);
for (let y = 0; y < H; y++) {
  const lat = 90 - ((y + 0.5) / H) * 180;
  if (Math.abs(lat) > 85.05) continue;
  const my = Math.floor(((1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2) * MW);
  const area = Math.cos((lat * Math.PI) / 180);
  for (let x = 0; x < W; x++) {
    const mx = Math.floor(((x + 0.5) / W) * MW);
    const k = (my * MW + mx) * 4;
    if (mosaic[k + 3] === 0) continue;
    const year = mosaic[k + 2], intensity = mosaic[k];
    if (year < 1 || year > 24 || !intensity) continue;
    out[(y * W + x) * 3] = year * 10;
    out[(y * W + x) * 3 + 1] = Math.min(255, Math.round(Math.sqrt(intensity / 255) * 255));
    byYear[year] += intensity * area;
  }
}
const raw = join(tmp, 'forest.rgb');
writeFileSync(raw, out);
execFileSync('magick', ['-size', `${W}x${H}`, '-depth', '8', `rgb:${raw}`, '-define', 'png:compression-level=9', 'public/layers/forest.png']);
const total = byYear.reduce((a, b) => a + b, 0);
const share = Array.from(byYear.slice(1), (v) => Number((v / total).toFixed(4)));
const peak = share.indexOf(Math.max(...share)) + 2001;
writeFileSync('public/layers/forest.json', JSON.stringify({
  id: 'forest', width: W, height: H, unit: 'anno di perdita', first: 2001, last: 2024, peak, share,
  source: 'Hansen et al. 2013 · University of Maryland · Global Forest Watch', version: VERSION, license: 'CC BY 4.0',
}, null, 1));
rmSync(tmp, { recursive: true, force: true });
console.log(`forest: ${W}x${H}, peak year ${peak}, shares ${share.map((s) => (s * 100).toFixed(1)).join(' ')}`);
