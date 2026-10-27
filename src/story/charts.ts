import { t } from '../i18n';
import { num, dayMonth, dayShort, timeUtc } from '../i18n/format';

// Panels drawn beside the planet when a number needs its history to be understood:
// the temperature of every day since 1940, the carbon dioxide of Mauna Loa, the Sun of
// this morning, how close the next asteroid passes, how far the Voyagers are.
// Lines draw themselves year after year, so the chart is read as time passing.

export type ChartId = 'temperature' | 'co2' | 'sun' | 'neo' | 'voyager';

const SVG = 'http://www.w3.org/2000/svg';
const $ = (id: string) => document.getElementById(id)!;
const cache = new Map<string, Promise<any>>();
const json = (url: string) => {
  let p = cache.get(url);
  if (!p) { p = fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); }); p.catch(() => cache.delete(url)); cache.set(url, p); }
  return p;
};

/** Data for a chart, also used by the stories for their numbers. */
export const climate = {
  temperature: () => json('climate/temperature.json'),
  sst: () => json('climate/sst.json'),
  co2: () => json('climate/co2.json'),
  seaice: () => json('climate/seaice.json'),
  sun: () => json('sky/sun.json'),
  neo: () => json('sky/neo.json'),
  voyager: () => json('sky/voyager.json'),
  launches: () => json('sky/launches.json'),
  fireballs: () => json('sky/fireballs.json'),
};

const el = (name: string, attrs: Record<string, string | number> = {}, parent?: Element) => {
  const e = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
};
const text = (parent: Element, x: number, y: number, s: string, cls = '', anchor = 'start') => {
  const e = el('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
  e.textContent = s;
  return e;
};

/** From cold blue (1940) to ember (the last years): a decade can be told by its colour. */
function yearColor(k: number): string {
  const stops: [number, [number, number, number]][] = [[0, [43, 74, 122]], [0.45, [79, 134, 198]], [0.7, [201, 164, 107]], [0.88, [240, 138, 60]], [1, [255, 84, 60]]];
  let i = 0;
  while (i < stops.length - 2 && k > stops[i + 1][0]) i++;
  const [p0, c0] = stops[i], [p1, c1] = stops[i + 1];
  const f = Math.min(1, Math.max(0, (k - p0) / (p1 - p0)));
  return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * f)).join(',')})`;
}

const monthLabels = () => Array.from({ length: 12 }, (_, m) => new Date(Date.UTC(2026, m, 1)).toLocaleString(t.lang.locale, { month: 'short', timeZone: 'UTC' }));

function frame(svg: SVGElement, W: number, H: number) {
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = '';
}

/** Every day of every year, one line per year; this year on top, in light. */
async function temperature(svg: SVGElement, cap: HTMLElement) {
  const d = await climate.temperature();
  const W = 640, H = 360, L = 44, R = 18, T = 18, B = 30;
  frame(svg, W, H);
  const years = Object.keys(d.years).map(Number).sort((a, b) => a - b);
  let lo = Infinity, hi = -Infinity;
  for (const y of years) for (const v of d.years[y]) if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  lo = Math.floor(lo * 2) / 2; hi = Math.ceil(hi * 2) / 2;
  const X = (i: number) => L + (i / 364) * (W - L - R), Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const grid = el('g', { class: 'ch-grid' }, svg);
  for (let v = Math.ceil(lo); v <= hi; v++) { el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v) }, grid); text(grid, L - 8, Y(v) + 4, `${num(v)}°`, 'ch-tick', 'end'); }
  monthLabels().forEach((m, k) => text(grid, X((k + 0.5) * 30.4), H - 10, m, 'ch-tick', 'middle'));
  const path = (vals: (number | null)[]) => {
    let s = '', pen = false;
    vals.forEach((v, i) => { if (v == null) { pen = false; return; } s += `${pen ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`; pen = true; });
    return s;
  };
  const now = years.at(-1)!;
  const lines = el('g', {}, svg);
  years.forEach((y, k) => {
    if (y === now) return;
    const p = el('path', { d: path(d.years[y]), class: 'ch-year', stroke: yearColor((y - years[0]) / (now - years[0])) }, lines);
    (p as SVGElement).style.animationDelay = `${(k / years.length) * 7}s`;
  });
  el('path', { d: path(d.clim), class: 'ch-clim' }, svg);
  const cur = el('path', { d: path(d.years[now]), class: 'ch-now' }, svg) as SVGElement;
  cur.style.animationDelay = '7.2s';
  const lastI = d.years[now].findLastIndex((v: number | null) => v != null);
  const dot = el('circle', { cx: X(lastI), cy: Y(d.years[now][lastI]), r: 4, class: 'ch-dot' }, svg) as SVGElement;
  dot.style.animationDelay = '8.4s';
  const lab = text(svg, X(lastI) - 8, Y(d.years[now][lastI]) - 12, `${now}`, 'ch-label', 'end') as SVGElement;
  lab.style.animationDelay = '8.4s';
  cap.innerHTML = '';
  cap.append(swatch(years[0], now), t.charts.temperature(dayMonth(d.last.date), `${d.last.anomaly > 0 ? '+' : '−'}${num(Math.abs(d.last.anomaly), 2)}`));
}

/** The sawtooth of Mauna Loa: every spring the northern forests breathe in. */
async function co2(svg: SVGElement, cap: HTMLElement) {
  const d = await climate.co2();
  const W = 640, H = 360, L = 48, R = 18, T = 18, B = 30;
  frame(svg, W, H);
  const pts = d.monthly as [number, number][];
  const x0 = pts[0][0], x1 = pts.at(-1)![0];
  const lo = 310, hi = Math.ceil((Math.max(...pts.map((p) => p[1])) + 5) / 10) * 10;
  const X = (x: number) => L + ((x - x0) / (x1 - x0)) * (W - L - R), Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const grid = el('g', { class: 'ch-grid' }, svg);
  for (let v = lo + 10; v <= hi; v += 20) { el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v) }, grid); text(grid, L - 8, Y(v) + 4, num(v), 'ch-tick', 'end'); }
  for (let y = 1960; y <= x1; y += 10) text(grid, X(y), H - 10, String(y), 'ch-tick', 'middle');
  const p = el('path', { d: pts.map(([x, v], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(v).toFixed(1)}`).join(''), class: 'ch-keeling', pathLength: 1 }, svg) as SVGElement;
  p.style.animationDelay = '0.4s';
  const last = pts.at(-1)!;
  const dot = el('circle', { cx: X(last[0]), cy: Y(last[1]), r: 4, class: 'ch-dot' }, svg) as SVGElement;
  dot.style.animationDelay = '6.6s';
  const a = text(svg, X(pts[0][0]) + 6, Y(pts[0][1]) - 10, `${num(pts[0][1], 0)} ppm · 1958`, 'ch-label') as SVGElement;
  a.style.animationDelay = '0.4s';
  const b = text(svg, X(last[0]) - 8, Y(d.last.ppm) - 12, `${num(d.last.ppm, 1)} ppm`, 'ch-label', 'end') as SVGElement;
  b.style.animationDelay = '6.6s';
  cap.textContent = t.charts.co2(dayMonth(d.last.date));
}

/** The Sun this morning, in the light of a million degrees. */
async function sun(svg: SVGElement, cap: HTMLElement) {
  const d = await climate.sun();
  frame(svg, 400, 400);
  const defs = el('defs', {}, svg);
  const clip = el('clipPath', { id: 'sun-clip' }, defs);
  // The SDO frame is 1024 px with the disc about 0.8 of it; show the disc and a little corona.
  el('circle', { cx: 200, cy: 200, r: 196 }, clip);
  el('circle', { cx: 200, cy: 200, r: 170, class: 'ch-sun-glow' }, svg);
  el('image', { href: `sky/sun.jpg?${encodeURIComponent(d.time)}`, x: -10, y: -10, width: 420, height: 420, 'clip-path': 'url(#sun-clip)', class: 'ch-sun' }, svg);
  cap.textContent = t.charts.sun(dayMonth(d.time), timeUtc(d.time));
}

/** How close the next asteroids pass, on the scale of the Moon. */
async function neo(svg: SVGElement, cap: HTMLElement) {
  const d = await climate.neo();
  const W = 640, H = 360, L = 60, R = 30;
  frame(svg, W, H);
  const list = (d.list as { name: string; time: string; ld: number }[]).slice(0, 8);
  const max = Math.max(2.2, Math.ceil(Math.max(...list.map((o) => o.ld)) + 0.5));
  const X = (ld: number) => L + (ld / max) * (W - L - R);
  const y = 190;
  el('line', { x1: X(0), x2: X(max), y1: y, y2: y, class: 'ch-axis' }, svg);
  for (let k = 1; k <= max; k++) { el('line', { x1: X(k), x2: X(k), y1: y - 4, y2: y + 4, class: 'ch-axis' }, svg); text(svg, X(k), y + 22, `${k}`, 'ch-tick', 'middle'); }
  text(svg, X(max), y + 40, t.charts.lunarDistances, 'ch-tick', 'end');
  el('circle', { cx: X(0), cy: y, r: 12, class: 'ch-earth' }, svg);
  text(svg, X(0), y - 22, t.charts.earth, 'ch-tick', 'middle');
  el('circle', { cx: X(1), cy: y, r: 4, class: 'ch-moon' }, svg);
  text(svg, X(1), y - 14, t.charts.moon, 'ch-tick', 'middle');
  el('line', { x1: X(0.11), x2: X(0.11), y1: y - 8, y2: y + 8, class: 'ch-geo' }, svg);
  list.forEach((o, i) => {
    const up = i % 2 === 0, yy = y + (up ? -60 - (i % 4) * 14 : 60 + (i % 4) * 12);
    const g = el('g', { class: 'ch-neo' }, svg) as SVGElement;
    g.style.animationDelay = `${0.4 + i * 0.5}s`;
    el('line', { x1: X(o.ld), x2: X(o.ld), y1: y, y2: yy, class: i === 0 ? 'ch-stem ch-first' : 'ch-stem' }, g);
    el('circle', { cx: X(o.ld), cy: y, r: i === 0 ? 5 : 3, class: i === 0 ? 'ch-dot' : 'ch-rock' }, g);
    text(g, X(o.ld), yy + (up ? -6 : 14), o.name, i === 0 ? 'ch-label' : 'ch-tick', 'middle');
  });
  const first = list[0];
  cap.textContent = t.charts.neo(first.name, dayShort(first.time), num(first.ld, 2));
}

/** The Solar System on one line, and the Voyagers far out on the right. */
async function voyager(svg: SVGElement, cap: HTMLElement) {
  const d = await climate.voyager();
  const W = 640, H = 360, L = 30, R = 30, y = 200;
  frame(svg, W, H);
  const max = Math.ceil((d.v1.au + 10) / 10) * 10;
  const X = (au: number) => L + (au / max) * (W - L - R);
  el('line', { x1: X(0), x2: X(max), y1: y, y2: y, class: 'ch-axis' }, svg);
  el('circle', { cx: X(0), cy: y, r: 6, class: 'ch-sunpt' }, svg);
  const planets: [string, number][] = [['', 1], ['', 5.2], ['', 9.5], ['', 19.2], [t.charts.neptune, 30.1]];
  for (const [name, au] of planets) {
    el('circle', { cx: X(au), cy: y, r: 2.5, class: 'ch-rock' }, svg);
    if (name) text(svg, X(au), y + 22, name, 'ch-tick', 'middle');
  }
  el('line', { x1: X(121.6), x2: X(121.6), y1: y - 40, y2: y + 40, class: 'ch-helio' }, svg);
  text(svg, X(121.6), y + 58, t.charts.heliopause, 'ch-tick', 'middle');
  for (const [k, v] of [['v2', d.v2], ['v1', d.v1]] as const) {
    const g = el('g', { class: 'ch-neo' }, svg) as SVGElement;
    g.style.animationDelay = k === 'v1' ? '1.2s' : '0.6s';
    el('circle', { cx: X(v.au), cy: y, r: k === 'v1' ? 5 : 4, class: k === 'v1' ? 'ch-dot' : 'ch-rock' }, g);
    el('line', { x1: X(v.au), x2: X(v.au), y1: y, y2: y - (k === 'v1' ? 80 : 46), class: 'ch-stem' }, g);
    text(g, X(v.au), y - (k === 'v1' ? 96 : 56), `Voyager ${k === 'v1' ? 1 : 2}`, k === 'v1' ? 'ch-label' : 'ch-tick', 'middle');
  }
  text(svg, X(max), y + 40, t.charts.au, 'ch-tick', 'end');
  cap.textContent = t.charts.voyager(num(d.v1.au, 1), num(d.v1.lightHours, 2));
}

const DRAW: Record<ChartId, (svg: SVGElement, cap: HTMLElement) => Promise<void>> = { temperature, co2, sun, neo, voyager };
let token = 0;

/** Show a chart beside the planet, or hide it. */
export function showChart(id: ChartId | null) {
  const box = $('chart'), svg = $('chart-svg') as unknown as SVGElement, cap = $('chart-cap');
  const my = ++token;
  if (!id) { box.classList.remove('on'); return; }
  box.classList.remove('on');
  setTimeout(() => {
    if (my !== token) return;
    DRAW[id](svg, cap).then(() => { if (my === token) { box.dataset.chart = id; box.classList.add('on'); } }).catch(() => box.classList.remove('on'));
  }, 400);
}

function swatch(from: number, to: number) {
  const s = document.createElement('span');
  s.className = 'ch-swatch';
  s.innerHTML = `<i>${from}</i><b></b><i>${to}</i>`;
  return s;
}
