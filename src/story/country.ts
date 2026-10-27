import type { Globe } from '../engine/globe';
import { ATLAS, atlasText, type AtlasId } from '../engine/atlas';
import { t } from '../i18n';

// The country card: a click on a country, while the people of the planet are on screen,
// opens its curve since 1960 for the indicator shown, and its other numbers, each with the
// year it was measured. Gaps stay gaps: the line breaks where a year has no value.

const OTHERS: AtlasId[] = ['population', 'life', 'under5', 'birth', 'electricity', 'co2'];
const $ = (id: string) => document.getElementById(id) as HTMLElement;
const NS = 'http://www.w3.org/2000/svg';

export function openCountry(globe: Globe, code: string, name: string, shown: AtlasId, year: number, x: number, y: number) {
  const atlas = globe.atlas;
  const card = $('country-card');
  $('cc-name').textContent = name;
  const text = atlasText(shown);
  $('cc-title').textContent = text.title;
  const now = atlas.measured(shown, code, year);
  $('cc-value').textContent = now ? text.format(now.value) : t.probe.noData;
  $('cc-year').textContent = now ? String(now.year) : String(year);

  // The curve, on the fixed scale of the indicator so countries compare.
  const svg = $('cc-curve') as unknown as SVGSVGElement;
  svg.replaceChildren();
  const years = atlas.years, W = 260, H = 70;
  const vals = years.map((yy) => (ATLAS[shown].hold ? null : atlas.value(shown, code, yy)));
  if (ATLAS[shown].hold) years.forEach((yy, i) => { const m = atlas.measured(shown, code, yy); vals[i] = m && m.year === yy ? m.value : null; });
  const known = vals.filter((v): v is number => v != null);
  const lo = shown === 'population' ? 0 : Math.min(ATLAS[shown].min, ...known);
  const hi = shown === 'population' ? Math.max(1, ...known) : Math.max(ATLAS[shown].max, ...known);
  const px = (i: number) => (i / (years.length - 1)) * W, py = (v: number) => H - ((v - lo) / (hi - lo || 1)) * H;
  let d = '', pen = false;
  vals.forEach((v, i) => {
    if (v == null) { pen = false; return; }
    d += `${pen ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`;
    pen = true;
  });
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', 'cc-line');
  const i = years.indexOf(Math.round(year));
  svg.append(path);
  if (i >= 0) {
    const mark = document.createElementNS(NS, 'line');
    mark.setAttribute('x1', String(px(i))); mark.setAttribute('x2', String(px(i)));
    mark.setAttribute('y1', '0'); mark.setAttribute('y2', String(H));
    mark.setAttribute('class', 'cc-mark');
    svg.append(mark);
    if (vals[i] != null) {
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', String(px(i))); dot.setAttribute('cy', String(py(vals[i]!))); dot.setAttribute('r', '3');
      dot.setAttribute('class', 'cc-dot');
      svg.append(dot);
    }
  }
  $('cc-from').textContent = String(years[0]);
  $('cc-to').textContent = String(years.at(-1));

  // The other numbers, the latest measured.
  const list = $('cc-others');
  list.replaceChildren();
  for (const id of OTHERS.filter((o) => o !== shown)) {
    const m = atlas.measured(id, code, atlas.lastYear(id));
    if (!m) continue;
    const li = document.createElement('li');
    const b = document.createElement('b'), s = document.createElement('span');
    b.textContent = atlasText(id).format(m.value);
    s.textContent = `${atlasText(id).title} · ${m.year}`;
    li.append(b, s);
    list.append(li);
  }
  $('cc-source').textContent = text.source;

  // Beside the click, inside the screen.
  card.classList.add('on');
  const r = card.getBoundingClientRect();
  const left = Math.min(innerWidth - r.width - 16, Math.max(16, x + 24));
  const top = Math.min(innerHeight - r.height - 16, Math.max(16, y - r.height / 2));
  card.style.transform = `translate(${left}px, ${top}px)`;
}

export function closeCountry() {
  $('country-card').classList.remove('on');
}
