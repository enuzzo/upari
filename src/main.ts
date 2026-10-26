import './styles.css';
import { Globe } from './engine/globe';
import { Director } from './story/director';
import { sunDirection, vecToLonLat } from './engine/astro';
import { framing, initSearch, type Place } from './story/search';
import { Sound, type Ambience } from './engine/audio';
import { Explorer } from './story/explore';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

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
  soundBtn.setAttribute('aria-label', on ? 'Disattiva l’audio' : 'Attiva l’audio');
};
sound.onChange = showSound;
showSound(sound.enabled);
soundBtn.addEventListener('click', () => { sound.start(); sound.toggle(); });

/** The ambience that goes with what the planet shows. */
function ambienceOf(): Ambience | null {
  const L = globe.currentLook;
  if (L.flow === 'wind') return 'wind';
  if (L.flow === 'currents') return 'ocean';
  if (L.data === 'rain') return 'rain';
  if (L.fires > 0) return 'fire';
  return null;
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
  $('explore-btn').setAttribute('disabled', '');
  await globe.init((p) => (bar.style.width = `${Math.round(p * 100)}%`));
  const shot = openingShot();
  Object.assign(globe.rig, { lon: shot.lon, lat: shot.lat, dist: shot.dist });
  globe.rig.drift = 1.1;
  globe.rig.setFrameShift(0.16);
  globe.setLook({ sun: 'real', clouds: 1, night: 1, exposure: 0.95 });
  globe.start();
  $('loader').classList.add('done');
  requestAnimationFrame(() => {
    $('veil').classList.add('clear', 'shown');
    document.body.classList.add('ready');
  });
  setTimeout(() => {
    $('start-btn').removeAttribute('disabled');
    $('people-btn').removeAttribute('disabled');
    $('explore-btn').removeAttribute('disabled');
  }, 900);
  // A shared link opens the explorer on what it showed.
  if (/^#[a-z]+/.test(location.hash)) setTimeout(() => { begin(null); explorer.restore(location.hash); }, 700);
  // Warm the first chapters while the title is on screen.
  void globe.prepare({ flow: 'wind' });
}

function begin(story: string | null) {
  if (started) return;
  started = true;
  sound.start();
  $('veil').classList.add('gone');
  document.body.classList.add('started');
  globe.rig.setFrameShift(0.14);
  if (story) {
    director.setStory(story);
    director.go(0);
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
$('people-btn').addEventListener('click', () => begin('persone'));
$('explore-btn').addEventListener('click', () => begin(null));
$('brand').addEventListener('click', () => { if (started) director.go(0); });
$('zoom-in').addEventListener('click', () => globe.rig.zoomBy(0.5));
$('zoom-out').addEventListener('click', () => globe.rig.zoomBy(2));
$('fs-btn').addEventListener('click', () => toggleFullscreen());
$('credits-btn').addEventListener('click', () => $('credits').classList.add('on'));
$('credits-close').addEventListener('click', () => $('credits').classList.remove('on'));
$('credits').addEventListener('click', (e) => { if (e.target === $('credits')) $('credits').classList.remove('on'); });

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
  if (e.key === 'Escape') { $('credits').classList.remove('on'); director.closeDrawer(); search.close(); explorer.toggle(false); return; }
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
  sound.setAmbience(started ? ambienceOf() : null);
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
    const n = globe.now;
    $('clock').textContent = `${n.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} · ${n.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
  }
};

boot().catch((err) => {
  console.error(err);
  $('loader-bar').style.width = '100%';
  document.querySelector('.intro-line')!.textContent = 'Serve un browser con WebGL 2 per vedere il pianeta.';
  $('veil').classList.add('shown');
});

if (import.meta.env.DEV) Object.assign(window, { upari: { globe, director, sound, probeEl: probe, jump: (i: number, story?: string) => { begin(story ?? director.story.id); if (story) director.setStory(story); void director.go(i); }, advance: async (sec: number) => { for (let t = 0; t < sec; t += 1 / 30) { globe.tick(1 / 30); if (Math.round(t * 30) % 15 === 0) await new Promise((r) => setTimeout(r, 0)); } } } });
