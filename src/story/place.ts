import type { Globe } from '../engine/globe';
import { DATA } from '../engine/layers';
import { subsolarPoint, sunDirection } from '../engine/astro';
import { t } from '../i18n';
import { dayMonth, num } from '../i18n/format';
import { climate, yearMean } from './charts';
import { countryAt, loadCountries } from './geo';
import type { AtlasId } from '../engine/atlas';

// A searched place, now: its solar time, its sunrise and sunset, the wind and the sea around it,
// the next visible pass of the Space Station; and, when the reader gave the year they were born,
// what changed since then in that country and on the whole planet. Everything comes from data
// Upari already has; nothing is asked about the place elsewhere.

/** The year of birth, typed in the search panel or under the thermometer; on this device only. */
export const BORN_KEY = 'upari.born';
export function bornYear(): number | null {
  try {
    const y = Number(localStorage.getItem(BORN_KEY));
    return y >= 1900 && y < new Date().getFullYear() ? y : null;
  } catch { return null; }
}

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
  // The next time the Space Station can be seen from here, computed on this device (SGP4).
  const pass = g.station.nextPass(lon, lat, g.now, (d) => sunDirection(d));
  if (pass) {
    const local = new Date(pass.start.getTime() + (lon / 15) * 3600e3);
    const solar = 12 + (lon - subsolarPoint(pass.start).lon) / 15;
    lines.push(t.place.iss(dayMonth(local), hhmm(solar), num(pass.minutes), num(Math.round(pass.maxEl))));
  } else lines.push(t.place.issNone);
  const born = bornYear();
  if (born) lines.push(...(await sinceBirth(g, lon, lat, born).catch(() => [])));
  return lines;
}

/** Since the year of birth: the country's life expectancy, people and CO₂ per person (World
 *  Bank, from 1960 or 1970), and the planet's mean temperature (ERA5, from 1940). Country
 *  numbers, not the town's: the text says the country's name. */
async function sinceBirth(g: Globe, lon: number, lat: number, year: number): Promise<string[]> {
  const out: string[] = [];
  const country = countryAt(await loadCountries(), lon, lat);
  if (country?.stat) {
    await g.atlas.load();
    const atlas = g.atlas, code = country.stat;
    const pair = (id: AtlasId) => {
      // The first year with a value, from the year of birth on; and the latest measured.
      let then: { value: number; year: number } | null = null;
      for (let y = Math.max(year, atlas.years[0]); y <= atlas.years.at(-1)! && !then; y++) {
        const m = atlas.measured(id, code, y);
        if (m && m.year >= Math.min(y, year)) then = m;
      }
      const now = atlas.measured(id, code, atlas.lastYear(id));
      return then && now && now.year > then.year ? { then, now } : null;
    };
    const life = pair('life'), people = pair('population'), co2 = pair('co2');
    const first = Math.min(...[life, people, co2].filter((p) => p).map((p) => p!.then.year));
    if (life || people || co2) out.push(t.place.bornHead(year, country.name) + (first > year ? ` ${t.place.bornFirst(first)}` : ''));
    if (life) out.push(t.place.bornLife(num(life.then.value), num(life.now.value)));
    if (people) out.push(t.place.bornPeople(num(people.then.value / 1e6, people.then.value < 1e7 ? 1 : 0), num(people.now.value / 1e6, people.now.value < 1e7 ? 1 : 0)));
    if (co2) out.push(t.place.bornCo2(num(co2.then.value, 1), num(co2.now.value, 1)));
  }
  const d = await climate.temperature();
  const then = yearMean(d, Math.max(1940, year)), last = yearMean(d, 'last');
  if (then != null && last != null) out.push(t.place.bornPlanet(Math.max(1940, year), `${last - then >= 0 ? '+' : '−'}${num(Math.abs(last - then), 1)}`));
  return out;
}
