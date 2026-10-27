import type { Globe } from '../engine/globe';
import { DATA } from '../engine/layers';
import { subsolarPoint } from '../engine/astro';
import { t } from '../i18n';
import { num } from '../i18n/format';

// A searched place, now: its solar time, its sunrise and sunset, the wind and the sea around it.
// Everything comes from layers Upari already has; nothing is asked about the place elsewhere.

const DEG = Math.PI / 180;
const hhmm = (h: number) => {
  const x = ((h % 24) + 24) % 24, hh = Math.floor(x), mm = Math.floor((x - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export async function placeFacts(g: Globe, lon: number, lat: number): Promise<string[]> {
  const lines: string[] = [];
  const s = subsolarPoint(g.now);
  // Solar time: where the Sun is overhead it is noon.
  lines.push(t.place.solar(hhmm(12 + (lon - s.lon) / 15)));
  // Sunrise and sunset in solar time, with the usual 0.833° for refraction and the Sun's disc.
  const phi = lat * DEG, dec = s.lat * DEG;
  const cosH = (Math.sin(-0.833 * DEG) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH < -1) lines.push(t.place.polarDay);
  else if (cosH > 1) lines.push(t.place.polarNight);
  else { const h = Math.acos(cosH) / DEG / 15; lines.push(t.place.sun(hhmm(12 - h), hhmm(12 + h))); }

  const wind = await g.loadFlow('wind').then(() => g.flowSampler('wind')).catch(() => null);
  if (wind) {
    const [r, gg, b] = wind.s.read(lon, lat);
    if (b > 0.5) {
      const ue = (r - 0.5) * 2 * wind.scale, vn = (gg - 0.5) * 2 * wind.scale;
      const from = (Math.atan2(-ue, -vn) / DEG + 360) % 360;
      lines.push(t.place.wind(num(Math.hypot(ue, vn) * 3.6), t.probe.directions[Math.round(from / 45) % 8]));
    }
  }
  const sst = await g.layers.get('sst').catch(() => null);
  if (sst) {
    // The nearest sea within about half a degree.
    const last = sst.sampler[sst.sampler.length - 1];
    for (const [dx, dy] of [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) {
      const [v, c] = last.read(lon + dx, lat + dy);
      if (c > 0.6) { lines.push(t.place.sea(num(DATA.sst.decode(v, sst.meta), 1))); break; }
    }
  }
  return lines;
}
