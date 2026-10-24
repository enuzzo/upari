// Packs the Yale Bright Star Catalogue (≈9 100 stars to magnitude 6.5) as Float32
// quadruplets: right ascension (rad), declination (rad), visual magnitude, temperature (K).
import { writeFileSync, mkdirSync } from 'node:fs';

const URL_BSC = 'https://raw.githubusercontent.com/brettonw/YaleBrightStarCatalog/master/bsc5-short.json';
const stars = await (await fetch(URL_BSC)).json();
const ra = (s) => { const [h, m, sec] = s.match(/[\d.]+/g).map(Number); return ((h + m / 60 + sec / 3600) / 24) * 2 * Math.PI; };
const dec = (s) => { const [d, m, sec] = s.match(/[\d.]+/g).map(Number); const v = (d + m / 60 + sec / 3600) * Math.PI / 180; return s.trim().startsWith('-') ? -v : v; };
const out = [];
for (const s of stars) {
  if (!s.RA || !s.Dec || !s.V) continue;
  out.push(ra(s.RA), dec(s.Dec), Number(s.V), Number(s.K) || 6000);
}
mkdirSync(new URL('../public/sky/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/sky/stars.bin', import.meta.url), Buffer.from(new Float32Array(out).buffer));
console.log(`${out.length / 4} stars`);
