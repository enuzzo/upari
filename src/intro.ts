// The buttons of the opening title, after React Bits (Star Border, Glare Hover, Magnet,
// Click Spark), rewritten without React: a star orbits each pill along its exact outline
// with a trail of light, the pills lean towards the cursor, a click scatters sparks.

const SVG = 'http://www.w3.org/2000/svg';
/** Trail, from the tail to the star: share of the outline, opacity, width. */
const TRAIL: [number, number, number][] = [[0.34, 0.12, 1], [0.2, 0.28, 1.2], [0.1, 0.55, 1.4], [0.035, 1, 2.6]];
const still = matchMedia('(prefers-reduced-motion: reduce)');

/** A star on the outline of a pill (or on a ring `gap` pixels outside it), at a steady pace whatever its size. */
function orbit(btn: HTMLElement, lap: number, gap: number) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.classList.add('orbit');
  svg.setAttribute('aria-hidden', 'true');
  const rects = TRAIL.map(([length, opacity, width]) => {
    const r = document.createElementNS(SVG, 'rect');
    r.setAttribute('pathLength', '1');
    r.style.setProperty('--l', String(length));
    r.style.strokeDasharray = `${length} ${1 - length}`;
    r.style.strokeOpacity = String(opacity);
    r.style.strokeWidth = String(width);
    r.style.animationDuration = `${lap}s`;
    svg.appendChild(r);
    return r;
  });
  btn.appendChild(svg);
  const m = gap + 3;
  // An svg does not stretch between its offsets: size it.
  Object.assign(svg.style, { left: `-${m}px`, top: `-${m}px`, width: `calc(100% + ${2 * m}px)`, height: `calc(100% + ${2 * m}px)` });
  const fit = () => {
    const w = btn.offsetWidth, h = btn.offsetHeight;
    svg.setAttribute('viewBox', `${-m} ${-m} ${w + 2 * m} ${h + 2 * m}`);
    for (const r of rects) {
      r.setAttribute('x', String(-gap));
      r.setAttribute('y', String(-gap));
      r.setAttribute('width', String(w + 2 * gap));
      r.setAttribute('height', String(h + 2 * gap));
      r.setAttribute('rx', String(h / 2 + gap));
    }
  };
  new ResizeObserver(fit).observe(btn);
  fit();
}

/** The pill leans a little towards the cursor, and comes back when it leaves. */
function magnet(btn: HTMLElement) {
  const reach = 40;
  addEventListener('pointermove', (e) => {
    if (still.matches || btn.hasAttribute('disabled')) return;
    const b = btn.getBoundingClientRect();
    const near = e.clientX > b.left - reach && e.clientX < b.right + reach && e.clientY > b.top - reach && e.clientY < b.bottom + reach;
    const dx = near ? (e.clientX - (b.left + b.width / 2)) * 0.12 : 0;
    const dy = near ? (e.clientY - (b.top + b.height / 2)) * 0.22 : 0;
    btn.style.setProperty('--mx', `${dx.toFixed(1)}px`);
    btn.style.setProperty('--my', `${dy.toFixed(1)}px`);
  });
}

/** A handful of sparks where the journey starts. */
function sparks(e: MouseEvent) {
  if (still.matches || !e.detail) return;
  const n = 12;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = 34 + Math.random() * 30;
    s.style.left = `${e.clientX}px`;
    s.style.top = `${e.clientY}px`;
    s.style.setProperty('--x', `${Math.cos(a) * d}px`);
    s.style.setProperty('--y', `${Math.sin(a) * d}px`);
    s.style.setProperty('--r', `${(a * 180) / Math.PI}deg`);
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
}

export function enchant(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.cta').forEach((btn, i) => {
    // The first story always has its star; the others light up when you reach for them.
    orbit(btn, i === 0 ? 6 : 4.5, i === 0 ? 5 : 0);
    const glare = document.createElement('span');
    glare.className = 'glare';
    glare.setAttribute('aria-hidden', 'true');
    btn.prepend(glare);
    magnet(btn);
    btn.addEventListener('click', sparks);
  });
}
