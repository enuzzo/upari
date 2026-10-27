import type { Globe } from '../engine/globe';

// The postcard: the planet as it is on screen, with the title of what it shows, its date and
// its sources, saved as an image. The words are drawn in the page's own fonts.

export interface PostcardInfo { kicker: string; title: string; when: string; source: string }

const $ = (id: string) => document.getElementById(id) as HTMLElement;

/** Lines of text no wider than max. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** What the screen shows now: the date of the data when there is one, otherwise the clock. */
export function screenDate() {
  const dc = $('data-clock');
  return dc.classList.contains('on') ? $('data-time').textContent ?? '' : $('clock').textContent ?? '';
}

/** Draws the postcard and saves it; returns the image, or null when the browser could not encode it. */
export async function savePostcard(globe: Globe, info: PostcardInfo, download = true) {
  const shot = globe.snapshot();
  const W = shot.width, H = shot.height, u = W / 1600;
  const ctx = shot.getContext('2d')!;
  const serif = getComputedStyle(document.querySelector('.title') ?? document.body).fontFamily;
  const sans = getComputedStyle(document.body).fontFamily;
  await document.fonts.ready;

  // A shade under the words, from the bottom left.
  const g = ctx.createLinearGradient(0, H, 0, H * 0.45);
  g.addColorStop(0, 'rgba(3,4,8,0.88)');
  g.addColorStop(1, 'rgba(3,4,8,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const x = 64 * u, max = Math.min(W * 0.62, 900 * u);
  let y = H - 64 * u;
  const spaced = (px: number) => { if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`; };

  // From the bottom up: sources, then date, title and kicker.
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 ${13 * u}px ${sans}`;
  spaced(0);
  ctx.fillStyle = 'rgba(236,232,222,0.62)';
  const src = wrap(ctx, `${info.source}${info.source ? ' · ' : ''}upari.earth`, max).slice(0, 3);
  for (const line of src.reverse()) { ctx.fillText(line, x, y); y -= 19 * u; }

  y -= 14 * u;
  ctx.font = `500 ${15 * u}px ${sans}`;
  spaced(3 * u);
  ctx.fillStyle = '#f2c98a';
  ctx.fillText(info.when.toUpperCase(), x, y);

  y -= 26 * u;
  ctx.font = `400 ${76 * u}px ${serif}`;
  spaced(0);
  ctx.fillStyle = '#f4f1ea';
  const title = wrap(ctx, info.title, max).slice(0, 2);
  for (const line of title.reverse()) { ctx.fillText(line, x, y); y -= 74 * u; }

  y -= 4 * u;
  ctx.font = `500 ${13 * u}px ${sans}`;
  spaced(3 * u);
  ctx.fillStyle = 'rgba(236,232,222,0.75)';
  ctx.fillText(info.kicker.toUpperCase(), x, y);

  const blob = await new Promise<Blob | null>((r) => shot.toBlob(r, 'image/png'));
  if (!blob || !download) return blob;
  const a = document.createElement('a');
  const slug = info.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'upari';
  a.href = URL.createObjectURL(blob);
  a.download = `upari-${slug}-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return blob;
}
