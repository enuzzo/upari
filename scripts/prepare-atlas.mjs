// The dust of people for the atlas: one dot for every 250,000 inhabitants (at each country's
// largest population since 1960), scattered inside its Natural Earth outline where the
// NASA Black Marble night lights are, so the dots gather where people live.
// Output: public/statistics/dust.bin, Int16 quadruples (lon×100, lat×100, outline index, rank).
// Usage: node scripts/prepare-atlas.mjs   (needs ImageMagick for the night-lights image)
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const PEOPLE_PER_DOT = 250000;
const LW = 2048, LH = 1024;

const world = JSON.parse(readFileSync('public/statistics/world.json', 'utf8'));
const geo = JSON.parse(readFileSync('public/statistics/countries.geojson', 'utf8'));
const lights = execFileSync('magick', ['public/earth/night-4k.jpg', '-resize', `${LW}x${LH}!`, '-colorspace', 'Gray', '-depth', '8', 'gray:-'], { maxBuffer: 1 << 26 });
const light = (lon, lat) => {
  const x = Math.min(LW - 1, Math.max(0, Math.floor(((lon + 180) / 360) * LW)));
  const y = Math.min(LH - 1, Math.max(0, Math.floor(((90 - lat) / 180) * LH)));
  return Math.max(0, lights[y * LW + x] / 255 - 0.165) / 0.835; // Black Marble keeps a faint land base
};

const inRing = (ring, x, y) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inside = (polys, x, y) => polys.some((p) => inRing(p[0], x, y) && !p.slice(1).some((h) => inRing(h, x, y)));

let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const out = [];
geo.features.forEach((f, index) => {
  const code = f.properties.statCode;
  const row = code && world.values.population[code];
  if (!row) return;
  const n = Math.round(Math.max(...row.map((v) => v ?? 0)) / PEOPLE_PER_DOT);
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  for (const p of polys) for (const [x, y] of p[0]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  // Candidates inside the outline, then drawn by light (a small floor keeps dark countries visible).
  const cands = [];
  for (let t = 0; cands.length < Math.max(n * 6, 60) && t < n * 60 + 4000; t++) {
    const lon = x0 + (x1 - x0) * rnd(), lat = y0 + (y1 - y0) * rnd();
    if (inside(polys, lon, lat)) cands.push([lon, lat, 0.04 + Math.min(1, light(lon, lat) * 2.5)]);
  }
  if (!cands.length) return;
  const total = cands.reduce((s, c) => s + c[2], 0);
  for (let k = 0; k < n; k++) {
    let r = rnd() * total, c = cands[0];
    for (const cand of cands) { r -= cand[2]; if (r <= 0) { c = cand; break; } }
    // A little jitter, so dots drawn from the same candidate do not stack.
    out.push(Math.round((c[0] + (rnd() - 0.5) * 0.12) * 100), Math.round((c[1] + (rnd() - 0.5) * 0.12) * 100), index, k);
  }
});
writeFileSync('public/statistics/dust.bin', Buffer.from(new Int16Array(out).buffer));
console.log(`dust: ${out.length / 4} dots, ${(out.length * 2 / 1024).toFixed(0)} KB`);
