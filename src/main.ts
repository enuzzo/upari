import './styles.css';
import { Globe } from './engine/globe';
import { Director } from './story/director';
import { sunDirection, vecToLonLat } from './engine/astro';
import { framing, initSearch, type Place } from './story/search';
import { Sound, type Ambience, type Mood } from './engine/audio';
import { Explorer } from './story/explore';
import { happenings, type Happening } from './story/now';
import { LANGS, NATIVE, detect, lang, onLang, setLang, t, type Lang } from './i18n';
import { dayMonth, timeUtc } from './i18n/format';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// The words first: everything below is built in the language of the page.
await setLang(detect()).catch(() => setLang('en'));

const canvas = $<HTMLCanvasElement>('scene');
const globe = new Globe(canvas);
const director = new Director(globe);
const sound = new Sound();
const explorer = new Explorer(globe, director);
// Back to the story: the panel gives way.
$('play-btn').addEventListener('click', () => { if (director.playing) explorer.toggle(false); });
$('stories').addEventListener('click', () => explorer.toggle(false));
$('next-story').addEventListener('click', () => explorer.toggle(false));
let started = false;

const soundBtn = $('sound-btn');
const showSound = (on: boolean) => {
  soundBtn.classList.toggle('muted', !on);
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.setAttribute('aria-label', on ? t.page.audioOff : t.page.audioOn);
};
sound.onChange = showSound;
showSound(sound.enabled);
soundBtn.addEventListener('click', () => { sound.start(); sound.toggle(); });

/** The ambience and mood of what is on screen: the chapter, or the layer being explored. */
function soundOf(): { ambience: Ambience | null; mood: Mood } {
  const c = explorer.isOpen ? explorer.chapter : director.chapter;
  if (c) return { ambience: c.sound ?? null, mood: c.mood ?? 'calm' };
  // The title and the first chapter only have the score: the wind belongs to Il respiro.
  return { ambience: null, mood: 'calm' };
}

/** Opening shot: from the night side, the Sun about to rise over the limb. */
function openingShot() {
  const s = vecToLonLat(sunDirection(globe.now));
  const anti = { lon: ((s.lon + 360) % 360) - 180, lat: -s.lat };
  return { lon: anti.lon + 22, lat: anti.lat * 0.4 + 12, dist: 3.4 };
}

async function boot() {
  const bar = $('loader-bar');
  $('start-btn').setAttribute('disabled', '');
  $('people-btn').setAttribute('disabled', '');
  $('nature-btn').setAttribute('disabled', '');
  $('explore-btn').setAttribute('disabled', '');
  $('sky-btn').setAttribute('disabled', '');
  await globe.init((p) => (bar.style.width = `${Math.round(p * 100)}%`));
  // The planet is already where it will stay: it does not slide in, it comes out of the dark,
  // while the sharper textures arrive. Shaders are compiled first, behind the black.
  const shot = openingShot();
  Object.assign(globe.rig, { lon: shot.lon, lat: shot.lat, dist: shot.dist });
  globe.rig.drift = 1.1;
  globe.rig.setFrameShift(0.16, true);
  globe.setLook({ sun: 'real', clouds: 1, night: 1, exposure: 0.95 });
  await globe.warm();
  globe.rise(6);
  globe.start();
  $('loader').classList.add('done');
  $('veil').classList.add('clear');
  document.body.classList.add('ready');
  // The words follow the first light.
  setTimeout(() => $('veil').classList.add('shown'), 900);
  setTimeout(() => {
    $('start-btn').removeAttribute('disabled');
    $('people-btn').removeAttribute('disabled');
    $('nature-btn').removeAttribute('disabled');
    $('explore-btn').removeAttribute('disabled');
    $('sky-btn').removeAttribute('disabled');
  }, 900);
  if (kiosk) setTimeout(() => begin('pianeta'), 9000);
  // A shared link opens the explorer on what it showed.
  if (/^#[a-z]+/.test(location.hash)) setTimeout(() => { begin(null); explorer.restore(location.hash); }, 700);
  // Warm the first chapters while the title is on screen.
  void globe.prepare({ flow: 'wind' });
}

function begin(story: string | null, chapter = 0) {
  if (started) return;
  started = true;
  sound.start();
  $('veil').classList.add('gone');
  document.body.classList.add('started');
  globe.rig.setFrameShift(0.14);
  if (story) {
    director.setStory(story);
    director.go(chapter);
  } else {
    director.setPlaying(false);
    globe.rig.drift = 0;
    $('caption').classList.add('hidden');
    globe.rig.flyTo({ lon: 12, lat: 38, dist: 2.6 });
    explorer.toggle(true);
    $('hint').classList.add('on');
    setTimeout(() => $('hint').classList.remove('on'), 6000);
  }
}

$('start-btn').addEventListener('click', () => begin('pianeta'));

// ?kiosk: the four stories one after the other, forever, for a screen in a hall or a classroom.
// ?embed: a quiet frame for other pages, with a link to the full site.
const mode = new URLSearchParams(location.search);
const kiosk = mode.has('kiosk'), embedded = mode.has('embed');
document.body.classList.toggle('kiosk', kiosk);
document.body.classList.toggle('embed', embedded);
if (kiosk) {
  director.onEnd = (next) => setTimeout(() => { if (!director.playing) { director.setStory(next.id); void director.go(0); } }, 9000);
  // The cursor hides when nobody moves it.
  let idle = 0;
  addEventListener('pointermove', () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = window.setTimeout(() => document.body.classList.add('idle'), 3000); });
}

// "Happening now" on the opening title: one line, the strongest event of today, with its chapter.
let news: Happening[] = [];
const showNews = (k = 0) => {
  const el = $('happening');
  if (!news.length) { el.classList.remove('on'); return; }
  const h = news[k % news.length];
  el.querySelector('b')!.textContent = t.now.title;
  el.querySelector('span')!.textContent = h.text();
  el.dataset.k = String(k % news.length);
  el.classList.add('on');
};
void happenings().then((list) => {
  news = list;
  showNews();
  if (news.length > 1) setInterval(() => { if (!started) showNews(Number($('happening').dataset.k ?? 0) + 1); }, 7000);
});
onLang(() => showNews(Number($('happening').dataset.k ?? 0)));
$('happening').addEventListener('click', () => {
  const h = news[Number($('happening').dataset.k ?? 0)];
  if (!h) return;
  const story = director.storyById(h.story);
  begin(h.story, Math.max(0, story?.chapters.findIndex((c) => c.id === h.chapter) ?? 0));
});
$('people-btn').addEventListener('click', () => begin('persone'));
$('nature-btn').addEventListener('click', () => begin('natura'));
$('sky-btn').addEventListener('click', () => begin('cielo'));
$('explore-btn').addEventListener('click', () => begin(null));
$('brand').addEventListener('click', () => { if (started) director.go(0); });
$('zoom-in').addEventListener('click', () => globe.rig.zoomBy(0.5));
$('zoom-out').addEventListener('click', () => globe.rig.zoomBy(2));
$('fs-btn').addEventListener('click', () => toggleFullscreen());
$('credits-btn').addEventListener('click', () => $('credits').classList.add('on'));
$('credits-close').addEventListener('click', () => $('credits').classList.remove('on'));
$('credits').addEventListener('click', (e) => { if (e.target === $('credits')) $('credits').classList.remove('on'); });
$('footer').addEventListener('click', () => { $('about').classList.add('on'); $('about').setAttribute('aria-hidden', 'false'); });
const closeAbout = () => { $('about').classList.remove('on'); $('about').setAttribute('aria-hidden', 'true'); };
$('about-close').addEventListener('click', closeAbout);
// For the classroom: opened from "Why Upari".
const closeClasse = () => { $('classe').classList.remove('on'); $('classe').setAttribute('aria-hidden', 'true'); };
$('classe-open').addEventListener('click', () => { closeAbout(); $('classe').classList.add('on'); $('classe').setAttribute('aria-hidden', 'false'); });
$('classe-close').addEventListener('click', closeClasse);
$('classe').addEventListener('click', (e) => { if (e.target === $('classe')) closeClasse(); });
// A field in a chart (the year you were born) holds the story while it is filled in.
document.addEventListener('upari-hold', () => director.setPlaying(false));
$('about').addEventListener('click', (e) => { if (e.target === $('about')) closeAbout(); });

// The language menu, top right: native names, the choice is remembered.
const langMenu = $('lang'), langList = $('lang-list'), langBtn = $('lang-btn');
const showMenu = (on: boolean) => { langMenu.classList.toggle('open', on); langBtn.setAttribute('aria-expanded', String(on)); };
for (const code of LANGS) {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.dataset.lang = code;
  b.lang = code;
  b.setAttribute('role', 'option');
  b.textContent = NATIVE[code];
  b.addEventListener('click', () => { showMenu(false); if (code !== lang) void setLang(code as Lang, true); });
  li.appendChild(b);
  langList.appendChild(li);
}
// Level with the icons of the top bar, whatever the height of its row.
const levelLang = () => { langMenu.style.top = `${$('fs-btn').getBoundingClientRect().top}px`; };
new ResizeObserver(levelLang).observe(document.querySelector('.top')!);
langBtn.addEventListener('click', (e) => { e.stopPropagation(); showMenu(!langMenu.classList.contains('open')); });
addEventListener('click', (e) => { if (!langMenu.contains(e.target as Node)) showMenu(false); });

const search = initSearch((p: Place) => {
  if (!started) begin(null);
  director.showPlace(p.lon, p.lat, p.name, p.context);
  globe.rig.drift = 0;
  const { dist, tilt } = framing(p);
  void globe.rig.flyTo({ lon: p.lon, lat: p.lat, dist, tilt });
});

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen().catch(() => {});
}

addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'Escape') { $('credits').classList.remove('on'); closeAbout(); closeClasse(); showMenu(false); director.closeDrawer(); search.close(); explorer.toggle(false); return; }
  if (e.key === '/') { e.preventDefault(); search.open(); return; }
  if (!started) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin('pianeta'); } return; }
  if (e.key === ' ') { e.preventDefault(); director.setPlaying(!director.playing); if (director.playing) explorer.toggle(false); }
  else if (e.key === 'ArrowRight') director.next();
  else if (e.key === 'ArrowLeft') director.prev();
  else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  else if (e.key === 'm' || e.key === 'M') { sound.start(); sound.toggle(); }
  else if (e.key === 'l' || e.key === 'L') explorer.toggle();
  else if (e.key === 'i' || e.key === 'I') { if (director.drawerOpen) director.closeDrawer(); else void director.openDrawer(); }
  else if (e.key === '+' || e.key === '=') globe.rig.zoomBy(0.6);
  else if (e.key === '-') globe.rig.zoomBy(1.6);
});

// The probe: what is under the cursor.
const probe = $('probe');
const probeB = probe.querySelector('b')!, probeS = probe.querySelector('small')!;
let pointer: { x: number; y: number } | null = null;
let pressed = false;
canvas.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerleave', () => { pointer = null; });
canvas.addEventListener('pointerdown', () => { pressed = true; });
addEventListener('pointerup', () => { pressed = false; });

let clockT = 0;
globe.onFrame = (dt) => {
  director.tick(dt);
  explorer.tick(dt);
  if (started) {
    const s = soundOf();
    sound.setAmbience(s.ambience);
    sound.setMood(s.mood);
  }
  if (pointer && started && !pressed) {
    const p = globe.probe(pointer.x, pointer.y);
    if (p) {
      probe.style.transform = `translate(${pointer.x}px, ${pointer.y}px)`;
      probeB.textContent = p.text ?? '';
      probeS.textContent = p.sub ?? '';
      probe.classList.add('on');
    } else probe.classList.remove('on');
  } else probe.classList.remove('on');

  clockT += dt;
  if (clockT > 0.25) $('tile-credit').classList.toggle('on', globe.closeUp);
  if (clockT > 1) {
    clockT = 0;
    showClock();
  }
};

function showClock() {
  const n = globe.now;
  $('clock').textContent = t.page.clock(dayMonth(n), timeUtc(n));
}

/** Text blocks that read right to left in Arabic. The legends keep their left-to-right scale. */
const BLOCKS = ['caption', 'drawer', 'explore', 'credits', 'about', 'intro', 'search', 'telemetry', 'hint', 'anchors', 'probe', 'clock', 'data-clock'];

/** Every word of the page in the language of the moment. */
function applyPage() {
  const get = (path: string) => {
    const v = path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], t);
    if (typeof v === 'string') return v;
    if (import.meta.env.DEV) console.warn('i18n: no text for', path);
    return '';
  };
  const each = (attr: string, put: (el: HTMLElement, v: string) => void) =>
    document.querySelectorAll<HTMLElement>(`[data-${attr}]`).forEach((el) => put(el, get(el.getAttribute(`data-${attr}`)!)));
  each('t', (el, v) => { el.textContent = v; });
  each('t-html', (el, v) => { el.innerHTML = v; });
  each('t-aria', (el, v) => el.setAttribute('aria-label', v));
  each('t-title', (el, v) => el.setAttribute('title', v));
  each('t-placeholder', (el, v) => el.setAttribute('placeholder', v));
  document.title = t.page.title;
  document.querySelector('meta[name="description"]')!.setAttribute('content', t.page.description);
  const list = $('credits-list');
  list.innerHTML = '';
  for (const [label, source] of t.credits.items) {
    const li = document.createElement('li');
    li.innerHTML = `<b></b><span>${source}</span>`;
    li.querySelector('b')!.textContent = label;
    list.appendChild(li);
  }
  $('footer').textContent = `© ${new Date().getFullYear()} Netmilk Studio · v${__APP_VERSION__}`;
  $('lang-code').textContent = lang.toUpperCase();
  langList.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    b.classList.toggle('current', b.dataset.lang === lang);
    b.setAttribute('aria-selected', String(b.dataset.lang === lang));
  });
  for (const id of BLOCKS) $(id).dir = t.lang.dir;
  showSound(sound.enabled);
  showClock();
}
applyPage();
onLang(() => {
  applyPage();
  director.relabel();
  explorer.relabel();
});

boot().catch((err) => {
  console.error(err);
  $('loader-bar').style.width = '100%';
  document.querySelector('.intro-line')!.textContent = t.page.noWebgl;
  $('veil').classList.add('shown');
});

if (import.meta.env.DEV) Object.assign(window, { upari: { globe, director, sound, probeEl: probe, jump: (i: number, story?: string) => { begin(story ?? director.story.id); if (story) director.setStory(story); void director.go(i); }, advance: async (sec: number) => { for (let t = 0; t < sec; t += 1 / 30) { globe.tick(1 / 30); if (Math.round(t * 30) % 15 === 0) await new Promise((r) => setTimeout(r, 0)); } } } });
