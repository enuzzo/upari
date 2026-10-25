// Place search with OpenStreetMap Nominatim. Its usage policy asks for at most one
// request per second, no search-as-you-type, cached results and visible attribution:
// we search only on Enter, space requests a second apart and keep answers in memory.
// https://operations.osmfoundation.org/policies/nominatim/

export interface Place {
  name: string;
  context: string;
  lon: number;
  lat: number;
  /** Angular size of the place, radians (0 for a point). */
  span: number;
  kind: string;
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const cache = new Map<string, Place[]>();
let lastRequest = 0;

interface NominatimResult {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
  category?: string;
  type?: string;
}

function toPlace(r: NominatimResult): Place {
  const lat = Number(r.lat), lon = Number(r.lon);
  const parts = r.display_name.split(', ');
  const name = r.name || parts[0];
  const context = parts.slice(1).filter((p) => !/\d/.test(p) && p !== name).slice(-3).join(', ');
  let span = 0;
  if (r.boundingbox) {
    const [s, n, w, e] = r.boundingbox.map(Number);
    span = Math.max(n - s, (e - w) * Math.cos((lat * Math.PI) / 180)) * (Math.PI / 180);
  }
  return { name, context, lon, lat, span, kind: `${r.category ?? ''}/${r.type ?? ''}` };
}

export async function geocode(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim().replace(/\s+/g, ' ');
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;
  const wait = lastRequest + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
  lastRequest = Date.now();
  const url = `${ENDPOINT}?${new URLSearchParams({ q, format: 'jsonv2', limit: '5', 'accept-language': 'it' })}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const places = ((await res.json()) as NominatimResult[]).map(toPlace);
  cache.set(key, places);
  return places;
}

/** Camera distance (planet radii) that frames a place: points get a close, oblique look. */
export function framing(p: Place): { dist: number; tilt: number } {
  const point = p.span < 0.0005;
  const dist = point ? (/peak|volcano|mountain/.test(p.kind) ? 0.018 : 0.03) : Math.min(2.6, Math.max(0.014, p.span * 2.4));
  return { dist, tilt: dist < 0.1 ? 48 : 0 };
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

/** The search field in the top bar. */
export function initSearch(onPick: (p: Place) => void) {
  const box = $('search'), input = $<HTMLInputElement>('search-input'), list = $('search-results'), note = $('search-note');
  let controller: AbortController | null = null;
  let results: Place[] = [];

  const open = () => {
    box.classList.add('on');
    requestAnimationFrame(() => input.focus());
  };
  const close = () => {
    box.classList.remove('on', 'has-results');
    controller?.abort();
    input.blur();
  };
  const render = (current: number) => {
    list.innerHTML = '';
    results.forEach((p, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = i === current ? 'current' : '';
      b.innerHTML = '<b></b><small></small>';
      b.querySelector('b')!.textContent = p.name;
      b.querySelector('small')!.textContent = p.context;
      b.addEventListener('click', () => { render(i); onPick(p); });
      li.appendChild(b);
      list.appendChild(li);
    });
  };

  $('search-btn').addEventListener('click', () => (box.classList.contains('on') ? close() : open()));
  box.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) return;
    controller?.abort();
    controller = new AbortController();
    box.classList.add('busy', 'has-results');
    note.textContent = 'Cerco…';
    list.innerHTML = '';
    try {
      results = await geocode(q, controller.signal);
      note.textContent = results.length ? '' : 'Nessun luogo con questo nome.';
      render(0);
      if (results[0]) onPick(results[0]);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') note.textContent = 'La ricerca non risponde, riprova tra poco.';
    } finally {
      box.classList.remove('busy');
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
  });
  return { open, close, get isOpen() { return box.classList.contains('on'); } };
}
