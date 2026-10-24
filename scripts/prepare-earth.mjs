// Prepares the static planet textures served from public/earth/.
// Sources: NASA GIBS (Blue Marble Next Generation, VIIRS Black Marble),
// NASA Visible Earth (cloud composite), Mapzen/AWS Terrarium (elevation).
// Requires ImageMagick (`magick`). Run: node scripts/prepare-earth.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const OUT = new URL('../public/earth/', import.meta.url).pathname;
const TMP = join(process.env.UPARI_TMP || tmpdir(), 'upari-earth');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const wms = (layer, w, h, fmt = 'image/jpeg') =>
  `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layer}&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=${w}&HEIGHT=${h}&FORMAT=${fmt}&STYLES=`;

async function download(url, file) {
  if (existsSync(file)) return file;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return file;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

const magick = (...args) => execFileSync(process.env.MAGICK_BIN || 'magick', args, { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 30 });

async function day() {
  const src = await download(wms('BlueMarble_NextGeneration', 8192, 4096), join(TMP, 'day.jpg'));
  // Gentle grade: a touch more depth in the oceans, cleaner whites.
  magick(src, '-modulate', '100,108', '-sigmoidal-contrast', '2,45%', '-quality', '90', '-sampling-factor', '4:2:0', join(OUT, 'day-8k.jpg'));
  magick(join(OUT, 'day-8k.jpg'), '-resize', '2048x1024', '-quality', '82', join(OUT, 'day-2k.jpg'));
}

async function night() {
  const src = await download(wms('VIIRS_Black_Marble', 8192, 4096, 'image/png'), join(TMP, 'night.png'));
  magick(src, '-colorspace', 'gray', '-quality', '88', join(OUT, 'night-8k.jpg'));
}

async function clouds() {
  const src = await download('https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_8192.tif', join(TMP, 'clouds.tif'));
  magick(src, '-colorspace', 'gray', '-quality', '86', join(OUT, 'clouds-8k.jpg'));
}

// Terrarium tiles encode elevation as (R*256 + G + B/256) - 32768 metres, in Web Mercator.
async function relief() {
  const Z = 5, N = 1 << Z, T = 256;
  const tiles = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) tiles.push([x, y]);
  let next = 0;
  await Promise.all(Array.from({ length: 16 }, async () => {
    while (next < tiles.length) {
      const [x, y] = tiles[next++];
      await download(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`, join(TMP, `t${Z}_${x}_${y}.png`));
    }
  }));
  const rows = [];
  for (let y = 0; y < N; y++) {
    const row = join(TMP, `row${Z}_${y}.png`);
    if (!existsSync(row)) magick(...Array.from({ length: N }, (_, x) => join(TMP, `t${Z}_${x}_${y}.png`)), '+append', row);
    rows.push(row);
  }
  const W = N * T;
  const raw = magick(...rows, '-append', '-depth', '8', 'rgb:-');
  const elev = (px, py) => {
    const i = (py * W + px) * 3;
    return raw[i] * 256 + raw[i + 1] + raw[i + 2] / 256 - 32768;
  };
  const OW = 8192, OH = 4096;
  const out = Buffer.alloc(OW * OH);
  for (let oy = 0; oy < OH; oy++) {
    const lat = 90 - ((oy + 0.5) / OH) * 180;
    const clamped = Math.max(-85.05, Math.min(85.05, lat)) * Math.PI / 180;
    const my = (1 - Math.log(Math.tan(Math.PI / 4 + clamped / 2)) / Math.PI) / 2 * W;
    const py = Math.min(W - 1, Math.max(0, Math.floor(my)));
    for (let ox = 0; ox < OW; ox++) {
      const px = Math.floor(((ox + 0.5) / OW) * W);
      let h = elev(px, py);
      if (lat < -85) h = Math.max(h, 2500); // Antarctic plateau beyond Mercator
      // Signed sqrt encoding: 128 = sea level, 255 = 8800 m, 0 = -11000 m.
      const v = h >= 0 ? 128 + Math.sqrt(Math.min(h, 8800) / 8800) * 127 : 128 - Math.sqrt(Math.min(-h, 11000) / 11000) * 128;
      out[oy * OW + ox] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  const rawFile = join(TMP, 'relief.gray');
  writeFileSync(rawFile, out);
  magick('-size', `${OW}x${OH}`, '-depth', '8', `gray:${rawFile}`, '-quality', '92', join(OUT, 'relief-8k.webp'));
  magick(join(OUT, 'relief-8k.webp'), '-resize', '4096x2048', '-quality', '92', join(OUT, 'relief-4k.webp'));
}

const jobs = { day, night, clouds, relief };
const pick = process.argv.slice(2);
for (const [name, job] of Object.entries(jobs)) {
  if (pick.length && !pick.includes(name)) continue;
  const t = Date.now();
  await job();
  console.log(`${name} ready in ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
if (process.argv.includes('--clean')) rmSync(TMP, { recursive: true, force: true });
