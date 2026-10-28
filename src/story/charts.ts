import { t } from '../i18n';
import { num, dayMonth, dayShort, timeUtc } from '../i18n/format';
import { fresh } from '../engine/fresh';
import { BORN_KEY } from './place';

// Panels drawn beside the planet when a number needs its history to be understood:
// the temperature of every day since 1940, the carbon dioxide of Mauna Loa, the Sun of
// this morning, how close the next asteroid passes, how far the Voyagers are, how many die in
// wars every year.
// Lines draw themselves year after year, so the chart is read as time passing.

export type ChartId = 'temperature' | 'co2' | 'sun' | 'neo' | 'voyager' | 'conflicts';

const SVG = 'http://www.w3.org/2000/svg';
const $ = (id: string) => document.getElementById(id)!;
const cache = new Map<string, Promise<any>>();
const json = (url: string) => {
  let p = cache.get(url);
  if (!p) { p = fetch(fresh(url)).then((r) => { if (!r.ok) throw new Error(url); return r.json(); }); p.catch(() => cache.delete(url)); cache.set(url, p); }
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
  conflicts: () => json('statistics/conflicts.json'),
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
    const p = el('path', { d: path(d.years[y]), class: 'ch-year', stroke: yearColor((y - years[0]) / (now - years[0])), 'data-year': y }, lines);
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
  cap.append(bornField(svg, d, years[0], now));
}

/** Mean of the 365 days of a year, or of the last 365 days measured. */
export function yearMean(d: { years: Record<string, (number | null)[]> }, y: number | 'last') {
  let vals: number[];
  if (y === 'last') {
    const all = Object.keys(d.years).map(Number).sort((a, b) => a - b).flatMap((k) => d.years[k]).filter((v): v is number => v != null);
    vals = all.slice(-365);
  } else vals = (d.years[y] ?? []).filter((v): v is number => v != null);
  return vals.length >= 300 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

/** An optional field: the year you were born, its line lit, its mean against the last twelve months. */
function bornField(svg: SVGElement, d: any, first: number, now: number) {
  const KEY = BORN_KEY;
  const box = document.createElement('span');
  box.className = 'ch-born';
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'number'; input.inputMode = 'numeric'; input.min = String(first); input.max = String(now - 1); input.placeholder = '—';
  label.append(t.charts.born, input);
  const line = document.createElement('span');
  line.className = 'ch-born-line';
  box.append(label, line);
  const show = () => {
    const y = Number(input.value);
    svg.querySelectorAll('.ch-mine').forEach((p) => p.classList.remove('ch-mine'));
    svg.classList.toggle('ch-has-mine', false);
    line.textContent = '';
    if (!(y >= first && y < now)) return;
    try { localStorage.setItem(KEY, String(y)); } catch { /* private mode */ }
    const p = svg.querySelector(`[data-year="${y}"]`);
    p?.classList.add('ch-mine');
    svg.classList.toggle('ch-has-mine', !!p);
    const then = yearMean(d, y), last = yearMean(d, 'last');
    if (then != null && last != null) line.textContent = t.charts.bornLine(y, num(then, 2), num(last, 2), `${last - then >= 0 ? '+' : '−'}${num(Math.abs(last - then), 2)}`);
  };
  input.addEventListener('input', show);
  input.addEventListener('focus', () => document.dispatchEvent(new CustomEvent('upari-hold')));
  try { const saved = localStorage.getItem(KEY); if (saved) { input.value = saved; setTimeout(show, 8000); } } catch { /* private mode */ }
  return box;
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
  // The Earth in miniature, the same as the marker on the globe (scripts/prepare-earth-icon.py).
  el('image', { href: 'sky/earth-mini.png', x: X(0) - 22, y: y - 22, width: 44, height: 44, class: 'ch-earth' }, svg);
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

/** A sentence in lines of at most `width` characters, from (x, y) down. */
function lines(parent: Element, x: number, y: number, s: string, width: number, cls: string, anchor: string) {
  const out: string[] = [];
  for (const w of s.split(' ')) { const l = out.at(-1); if (l && (l + ' ' + w).length <= width) out[out.length - 1] = l + ' ' + w; else out.push(w); }
  out.forEach((l, i) => text(parent, x, y + i * 18, l, cls, anchor));
}

/** When each Voyager met a planet: [year, which planet]. */
const FLYBYS: Record<'v1' | 'v2', [number, 'jupiter' | 'saturn' | 'uranus' | 'neptune'][]> = {
  v1: [[1979.17, 'jupiter'], [1980.86, 'saturn']],
  v2: [[1979.52, 'jupiter'], [1981.65, 'saturn'], [1986.07, 'uranus'], [1989.65, 'neptune']],
};
const ORBITS: ['jupiter' | 'saturn' | 'uranus' | 'neptune' | '', number][] = [['', 1], ['jupiter', 5.2], ['saturn', 9.5], ['uranus', 19.2], ['neptune', 30.1]];

/** A label placed where it overlaps nothing already placed, around (x, y), with a leader line
 *  when it had to move away. Boxes are estimated from the length of the text. */
interface Box { x0: number; y0: number; x1: number; y1: number }
function place(g: Element, taken: Box[], x: number, y: number, s: string, cls: string, size: number, W: number, H: number, color?: string) {
  const w = s.length * size * 0.56, h = size * 1.2;
  const tries: [number, number][] = [[10, -8], [10, 16], [-10, -8], [-10, 16]];
  for (const r of [28, 46, 64]) for (const a of [-60, -120, 60, 120, -30, -150, 30, 150]) tries.push([Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r]);
  for (const [dx, dy] of tries) {
    const left = dx < 0, bx = left ? x + dx - w : x + dx, by = y + dy - size;
    const b = { x0: bx - 3, y0: by - 3, x1: bx + w + 3, y1: by + h + 3 };
    if (b.x0 < 4 || b.x1 > W - 4 || b.y0 < 44 || b.y1 > H - 4) continue;
    if (taken.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)) continue;
    taken.push(b);
    if (Math.hypot(dx, dy) > 20) el('line', { x1: x, y1: y, x2: left ? bx + w : bx, y2: by + size * 0.75, class: 'ch-leader' }, g);
    const e = text(g, left ? bx + w : bx, y + dy, s, cls, left ? 'end' : 'start');
    if (color) e.setAttribute('fill', color);
    return true;
  }
  return false;
}

/** A few lines of text, right-aligned on the panel's edge, at the free height nearest to y. */
function block(g: Element, taken: Box[], s: string, y: number, W: number, H: number) {
  const out: string[] = [];
  const width = W < 700 ? 30 : 40;
  for (const w of s.split(' ')) { const l = out.at(-1); if (l && (l + ' ' + w).length <= width) out[out.length - 1] = l + ' ' + w; else out.push(w); }
  const w = Math.max(...out.map((l) => l.length)) * 13.5 * 0.56, h = out.length * 18;
  // On the right edge first, then further in.
  for (const right of [W - 8, W - 8 - w * 0.5, W - 8 - w]) {
    for (let d = 0; d < H; d += 8) {
      for (const top of [y + d, y - d]) {
        if (top < 44 || top + h > H - 66 || right - w < 20) continue;
        const b = { x0: right - w - 4, y0: top - 4, x1: right + 4, y1: top + h + 2 };
        if (taken.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)) continue;
        taken.push(b);
        out.forEach((l, i) => text(g, right, top + 13 + i * 18, l, 'ch-dest', 'end'));
        return;
      }
    }
  }
}

/**
 * The Voyagers leaving the planets behind: their real paths since 1977 (Horizons), seen from a
 * little above the plane of the planets, the view widening as they go, from Jupiter's orbit to
 * the edge of the Sun's wind and beyond; then the way each one is heading. Each probe has its
 * colour and a line in the legend with its distance today; each meeting with a planet has one
 * label, placed where it overlaps nothing.
 */
async function voyager(svg: SVGElement, cap: HTMLElement) {
  const d = await climate.voyager();
  const mine = token; // showChart counts each chart it shows: a newer one stops this animation
  // Drawn in real pixels (the panel's own width), so the text keeps its size on any screen.
  const W = Math.max(560, Math.round(svg.getBoundingClientRect().width || 760)), H = Math.round(W * 0.63);
  const cx = Math.round(W * 0.2), cy = Math.round(H * 0.52);
  const COL = { v1: '#ffcf8a', v2: '#8fc0ff' } as const;
  cap.textContent = t.charts.voyager(num(d.v1.au, 1), num(d.v1.lightHours, 2));
  frame(svg, W, H);
  const paths = d.paths as Record<'v1' | 'v2', [number, number, number, number][]> | undefined;
  if (!paths) return;
  // Turn the plane so both point to the right; tilt the view 18° above it.
  const end = (k: 'v1' | 'v2') => paths[k].at(-1)!;
  const rot = -Math.atan2(end('v1')[2] + end('v2')[2], end('v1')[1] + end('v2')[1]);
  const cr = Math.cos(rot), sr = Math.sin(rot), tilt = (18 * Math.PI) / 180;
  const project = (x: number, y: number, z: number, s: number) => {
    const u = x * cr - y * sr, v = x * sr + y * cr;
    return [cx + u * s, cy - (z * Math.cos(tilt) + v * Math.sin(tilt)) * s];
  };
  const at = (k: 'v1' | 'v2', year: number) => {
    const p = paths[k];
    let i = p.findIndex((q) => q[0] > year);
    if (i < 0) return p.at(-1)!;
    if (i === 0) return p[0];
    const a = p[i - 1], b = p[i], f = (year - a[0]) / (b[0] - a[0]);
    return [year, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
  };
  // One meeting per planet: the probes that passed it and the years.
  const meetings = (['jupiter', 'saturn', 'uranus', 'neptune'] as const).map((planet) => ({
    planet, who: (['v1', 'v2'] as const).flatMap((k) => FLYBYS[k].filter((f) => f[1] === planet).map((f) => ({ k, when: f[0] }))),
  }));
  const y0 = paths.v1[0][0], y1 = end('v1')[0], SECONDS = 15;
  const t0 = performance.now();
  const draw = (now: number) => {
    if (token !== mine || !svg.isConnected) return;
    const k = Math.min(1, (now - t0) / 1000 / SECONDS);
    // Slow at the planets (to Neptune, 1989, in the first six seconds), faster in the empty years after.
    const split = 0.4, mid = 1990;
    const year = k < split ? y0 + (mid - y0) * (k / split) : mid + (y1 - mid) * ((k - split) / (1 - split));
    const p1 = at('v1', year), p2 = at('v2', year);
    const reach = Math.max(9, Math.hypot(p1[1], p1[2], p1[3]), Math.hypot(p2[1], p2[2], p2[3]));
    const s = (W - cx - 70) / (reach * 1.08);
    svg.innerHTML = '';
    // Everything inside the panel (an inner svg clips): the widest orbits would spill over.
    const g = el('svg', { x: 0, y: 0, width: W, height: H, overflow: 'hidden' }, svg);
    const taken: Box[] = [{ x0: 0, y0: 0, x1: 150, y1: 50 }];
    // The legend, bottom left, where neither path goes: each probe, its colour, its distance today.
    (['v1', 'v2'] as const).forEach((key, i) => {
      const ly = H - 40 + i * 24;
      el('line', { x1: 14, x2: 36, y1: ly - 5, y2: ly - 5, stroke: COL[key], 'stroke-width': 2.4 }, g);
      text(g, 44, ly, t.charts.probeNow(key === 'v1' ? 1 : 2, num(d[key].au, 0), num(d[key].lightHours, 1)), 'ch-legend');
    });
    taken.push({ x0: 0, y0: H - 62, x1: 360, y1: H });
    // The planets' orbits shrink towards the Sun as the view widens; the planets are named by
    // their meetings. First everything drawn, as obstacles; then the words, around them.
    for (const [, r] of ORBITS) {
      if (r * s < 2) continue;
      el('ellipse', { cx, cy, rx: r * s, ry: r * s * Math.sin(tilt), class: 'ch-orbit' }, g);
    }
    const helio = 120 * s < W;
    if (helio) el('ellipse', { cx, cy, rx: 120 * s, ry: 120 * s * Math.sin(tilt), class: 'ch-helio' }, g);
    el('circle', { cx, cy, r: 6, class: 'ch-sunpt' }, g);
    taken.push({ x0: cx - 9, y0: cy - 9, x1: cx + 9, y1: cy + 9 });
    const obstacle = (ax: number, ay: number, bx: number, by: number) => {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 6);
      for (let j = 0; j <= n; j++) { const x = ax + ((bx - ax) * j) / n, y = ay + ((by - ay) * j) / n; taken.push({ x0: x - 4, y0: y - 4, x1: x + 4, y1: y + 4 }); }
    };
    const heads: Record<'v1' | 'v2', [number, number]> = { v1: [0, 0], v2: [0, 0] };
    for (const key of ['v2', 'v1'] as const) {
      const pts = paths[key].filter((q) => q[0] <= year).map((q) => project(q[1], q[2], q[3], s));
      const head = at(key, year), [hx, hy] = project(head[1], head[2], head[3], s);
      heads[key] = [hx, hy];
      pts.push([hx, hy]);
      el('polyline', { points: pts.map((q) => q.join(',')).join(' '), class: `ch-vpath ch-${key}`, stroke: COL[key] }, g);
      for (let i = 1; i < pts.length; i++) obstacle(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      // Where it is heading, once it is here: the line goes on, dashed.
      if (k >= 1) {
        const prev = at(key, year - 3), [px, py] = project(prev[1], prev[2], prev[3], s);
        const dx = hx - px, dy = hy - py, n = Math.hypot(dx, dy) || 1;
        el('line', { x1: hx, y1: hy, x2: hx + (dx / n) * 46, y2: hy + (dy / n) * 46, class: 'ch-heading', stroke: COL[key] }, g);
        obstacle(hx, hy, hx + (dx / n) * 46, hy + (dy / n) * 46);
      }
      el('circle', { cx: hx, cy: hy, r: 5, fill: COL[key], class: `ch-head ch-${key}` }, g);
      taken.push({ x0: hx - 10, y0: hy - 10, x1: hx + 10, y1: hy + 10 });
    }
    // The meetings: a dot where each probe passed each planet.
    const spots: { planet: string; years: string; x: number; y: number }[] = [];
    for (const m of meetings) {
      const seen = m.who.filter((w) => w.when <= year);
      if (!seen.length || s * 5 < 9) continue;
      let mx = 0, my = 0;
      for (const w of seen) {
        const f = at(w.k, w.when), [fx, fy] = project(f[1], f[2], f[3], s);
        el('circle', { cx: fx, cy: fy, r: 3, fill: COL[w.k], class: 'ch-meet' }, g);
        taken.push({ x0: fx - 5, y0: fy - 5, x1: fx + 5, y1: fy + 5 });
        mx += fx / seen.length; my += fy / seen.length;
      }
      spots.push({ planet: t.charts[m.planet], years: [...new Set(seen.map((w) => Math.floor(w.when)))].join(', '), x: mx, y: my });
    }
    // The words, around what is drawn.
    place(g, taken, cx, cy, t.charts.theSun, 'ch-tick ch-sunname', 14, W, H);
    if (helio) place(g, taken, cx + 120 * s * 0.7, cy + 120 * s * Math.sin(tilt) * 0.72, t.charts.heliopause, 'ch-tick', 14, W, H);
    // One label per meeting while they stand apart; once the view has widened and they crowd
    // around the Sun, one label for all of them, with a leader line.
    const crowded = spots.some((a, i) => spots.some((b, j) => j > i && Math.hypot(a.x - b.x, a.y - b.y) < 54));
    if (spots.length && (crowded || s * 5 <= 22)) {
      const gx = spots.reduce((a, p) => a + p.x, 0) / spots.length, gy = spots.reduce((a, p) => a + p.y, 0) / spots.length;
      place(g, taken, gx, gy, spots.map((p) => p.planet).join(' · '), 'ch-tick ch-meetname', 14, W, H);
    } else for (const p of spots) place(g, taken, p.x, p.y, `${p.planet} · ${p.years}`, 'ch-tick ch-meetname', 14, W, H);
    if (k >= 1) {
      // Each destination as a block beside its probe, where it covers no path and no dot.
      block(g, taken, t.charts.heading1, heads.v1[1] + 30, W, H);
      block(g, taken, t.charts.heading2, heads.v2[1] - 90, W, H);
    }
    text(g, 14, 40, String(Math.floor(year)), 'ch-big');
    if (k < 1) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

/** Deaths in organised violence every year since 1989, by kind, rising one year after another.
 *  1994 (the genocide in Rwanda) is four times taller than any other year: its bar is broken
 *  and labelled with its value, so the other years stay readable. */
async function conflicts(svg: SVGElement, cap: HTMLElement) {
  const d = await climate.conflicts();
  const W = 640, H = 360, L = 52, R = 18, T = 26, B = 30;
  frame(svg, W, H);
  const years = Object.keys(d.years).map(Number).sort((a, b) => a - b);
  const top = 350_000;
  const bw = (W - L - R) / years.length;
  const X = (i: number) => L + i * bw, Y = (v: number) => T + (1 - Math.min(v, top) / top) * (H - T - B);
  const grid = el('g', { class: 'ch-grid' }, svg);
  for (let v = 100_000; v <= top; v += 100_000) { el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v) }, grid); text(grid, L - 8, Y(v) + 4, num(v), 'ch-tick', 'end'); }
  for (const y of years) if (y % 5 === 0) text(grid, X(years.indexOf(y)) + bw / 2, H - 10, String(y), 'ch-tick', 'middle');
  const COL = ['#ff9f6b', '#d9b36c', '#ff5d73'];
  years.forEach((y, i) => {
    const g = el('g', { class: 'ch-bar' }, svg) as SVGElement;
    g.style.animationDelay = `${0.3 + (i / years.length) * 6}s`;
    let base = 0;
    (d.years[y].type as number[]).forEach((v, k) => {
      const y0 = Y(base), y1 = Y(base + v);
      if (y0 - y1 > 0.2) el('rect', { x: X(i) + 1, y: y1, width: bw - 2, height: y0 - y1, fill: COL[k] }, g);
      base += v;
    });
    if (base > top) {
      el('rect', { x: X(i) - 2, y: T + 14, width: bw + 4, height: 5, class: 'ch-break' }, g);
      text(g, X(i) + bw / 2 + 4, T - 6, `${y} · ${num(base)}`, 'ch-tick', 'start');
    }
  });
  const last = years.at(-1)!;
  const lab = text(svg, X(years.length - 1) + bw / 2, Y(d.years[last].best) - 10, num(d.years[last].best), 'ch-label', 'end') as SVGElement;
  lab.style.animationDelay = '6.4s';
  cap.innerHTML = '';
  const key = document.createElement('span');
  key.className = 'ch-key';
  t.spots.violence.forEach((name, k) => { const s = document.createElement('span'); s.innerHTML = `<b style="background:${COL[k]}"></b>`; s.append(name); key.append(s); });
  cap.append(key, t.charts.conflicts);
}

const DRAW: Record<ChartId, (svg: SVGElement, cap: HTMLElement) => Promise<void>> = { temperature, co2, sun, neo, voyager, conflicts };
let token = 0;

/** Show a chart beside the planet, or hide it. */
export function showChart(id: ChartId | null) {
  const box = $('chart'), svg = $('chart-svg') as unknown as SVGElement, cap = $('chart-cap');
  const my = ++token;
  if (!id) { box.classList.remove('on'); return; }
  box.classList.remove('on');
  setTimeout(() => {
    if (my !== token) return;
    // The panel takes the size of this chart first: some charts are drawn in real pixels.
    box.dataset.chart = id;
    DRAW[id](svg, cap).then(() => { if (my === token) box.classList.add('on'); }).catch(() => box.classList.remove('on'));
  }, 400);
}

function swatch(from: number, to: number) {
  const s = document.createElement('span');
  s.className = 'ch-swatch';
  s.innerHTML = `<i>${from}</i><b></b><i>${to}</i>`;
  return s;
}
