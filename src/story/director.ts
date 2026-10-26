import type { Globe } from '../engine/globe';
import { lonLatToVec } from '../engine/astro';
import { cssGradient } from '../engine/palettes';
import { CHAPTERS, type Chapter } from './chapters';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

interface Anchor { el: HTMLElement; lon: number; lat: number; alt: number; follow?: 'iss' }

/** Plays the chapters like a documentary: camera, look, narration, timing. */
export class Director {
  index = -1;
  playing = true;
  private elapsed = 0;
  private token = 0;
  private lineReady = false;
  private anchors: Anchor[] = [];
  private following = false;
  /** The viewer left the chapter (a place search): resuming restarts it. */
  private detour = false;
  private chapterEls: HTMLLIElement[] = [];

  constructor(private globe: Globe) {
    this.buildRail();
    $('play-btn').addEventListener('click', () => this.setPlaying(!this.playing));
    $('more-btn').addEventListener('click', () => this.openDrawer());
    $('drawer-close').addEventListener('click', () => this.closeDrawer());
    globe.rig.onUserInput = () => {
      if (this.playing) this.setPlaying(false);
      this.following = false;
      globe.rig.drift = 0;
    };
  }

  get chapter(): Chapter | null { return CHAPTERS[this.index] ?? null; }

  private buildRail() {
    const ol = $('chapters');
    CHAPTERS.forEach((c, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<button aria-label="${c.title}"><span class="bar"><span class="fill"></span></span><span class="label">${c.title}</span></button>`;
      li.querySelector('button')!.addEventListener('click', () => { this.go(i); });
      ol.appendChild(li);
      this.chapterEls.push(li);
    });
  }

  setPlaying(v: boolean) {
    this.playing = v;
    $('play-btn').classList.toggle('paused', !v);
    $('play-btn').setAttribute('aria-label', v ? 'Pausa' : 'Riprendi il racconto');
    if (v && this.chapter) {
      // Resuming: go back to the chapter's framing.
      if (this.detour) this.go(this.index);
      else if (this.elapsed > this.chapter.duration - 4) this.next();
      else void this.frame(this.chapter, this.token);
    }
  }

  next() { this.go((this.index + 1) % CHAPTERS.length); }
  prev() { this.go((this.index - 1 + CHAPTERS.length) % CHAPTERS.length); }

  async go(i: number) {
    const c = CHAPTERS[i];
    const token = ++this.token;
    this.index = i;
    this.detour = false;
    this.elapsed = 0;
    this.lineReady = false;
    this.following = false;
    this.closeDrawer();
    this.chapterEls.forEach((li, k) => {
      li.classList.toggle('current', k === i);
      li.classList.toggle('done', k < i);
      (li.querySelector('.fill') as HTMLElement).style.transform = k < i ? 'scaleX(1)' : 'scaleX(0)';
    });

    // Prefetch, so the planet changes as the words arrive.
    const cap = $('caption');
    cap.classList.add('out');
    this.clearAnchors();
    this.globe.setLook({ ...c.look });
    const ready = this.globe.prepare(c.look);
    this.legend(c);
    await new Promise((r) => setTimeout(r, 650));
    if (token !== this.token) return;

    $('cap-num').textContent = roman[i];
    $('cap-kicker').textContent = c.kicker;
    $('cap-title').textContent = c.title;
    $('cap-line').innerHTML = '';
    cap.classList.remove('out', 'hidden');

    void this.frame(c, token);
    await ready.catch(() => {});
    const text = await c.narrate(this.globe).catch(() => '');
    if (token !== this.token) return;
    this.speak(text);
    this.lineReady = true;
    if (c.follow === 'iss') this.anchorStation();
    void this.pin(c, token);
  }

  /** Camera choreography for a chapter. */
  private async frame(c: Chapter, token: number) {
    const beats = await c.beats(this.globe).catch(() => []);
    if (token !== this.token) return;
    for (const b of beats) {
      this.globe.rig.drift = 0;
      await this.globe.rig.flyTo(b.shot, b.seconds);
      if (token !== this.token || !this.playing) return;
      this.globe.rig.drift = b.drift ?? 0;
    }
    if (c.follow === 'iss') this.following = true;
    if (c.approach === 'iss' && this.globe.station.altKm > 0) {
      const s = this.globe.station;
      // About 350 m behind and above the station, with the Earth rolling by underneath.
      await this.globe.rig.focusOn(() => ({ pos: s.position, fwd: s.velocity }), { dist: 0.000055, yaw: 28, pitch: 22 }, 12);
    }
  }

  private speak(text: string) {
    const el = $('cap-line');
    el.innerHTML = '';
    const words = text.split(/(\s+)/);
    let k = 0;
    for (const w of words) {
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(' ')); continue; }
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      const delay = 120 + k++ * 70;
      setTimeout(() => s.classList.add('on'), delay);
    }
  }

  private legend(c: Chapter) {
    const lg = $('legend');
    if (!c.legend) { lg.classList.remove('on'); return; }
    $('legend-title').textContent = c.legend.title;
    $('legend-bar').style.background = cssGradient(c.legend.stops);
    $('legend-left').textContent = c.legend.left;
    $('legend-right').textContent = c.legend.right;
    lg.classList.add('on');
  }

  private async pin(c: Chapter, token: number) {
    if (!c.pin) return;
    const p = await c.pin(this.globe).catch(() => null);
    if (!p || token !== this.token) return;
    this.globe.setLook({ ...c.look, pin: { lon: p.lon, lat: p.lat } });
    setTimeout(() => {
      if (token !== this.token) return;
      this.addAnchor(p.lon, p.lat, 0, `<b>${p.label}</b><small>${p.sub}</small>`);
    }, 1400);
  }

  /** Leave the story to show a place the viewer looked for. */
  showPlace(lon: number, lat: number, name: string, context: string) {
    this.setPlaying(false);
    this.detour = true;
    this.following = false;
    this.clearAnchors();
    $('legend').classList.remove('on');
    $('caption').classList.add('hidden');
    this.globe.setLook({ sun: 'real', clouds: 1, night: 1, pin: { lon, lat } });
    const el = document.createElement('div');
    const b = document.createElement('b'), small = document.createElement('small');
    b.textContent = name;
    small.textContent = context;
    el.append(b, small);
    setTimeout(() => this.addAnchor(lon, lat, 0, el.innerHTML), 900);
  }

  private anchorStation() {
    const s = this.globe.station;
    this.addAnchor(s.lon, s.lat, s.altKm, '<b>Stazione Spaziale</b><small></small>', 'iss');
  }

  private addAnchor(lon: number, lat: number, alt: number, html: string, follow?: 'iss') {
    const el = document.createElement('div');
    el.className = 'anchor';
    el.innerHTML = `<div class="a-in">${html}</div>`;
    el.style.opacity = '0';
    $('anchors').appendChild(el);
    requestAnimationFrame(() => (el.style.opacity = '1'));
    this.anchors.push({ el, lon, lat, alt, follow });
  }

  private clearAnchors() {
    for (const a of this.anchors) {
      a.el.style.opacity = '0';
      setTimeout(() => a.el.remove(), 900);
    }
    this.anchors = [];
  }

  async openDrawer() {
    const c = this.chapter;
    if (!c) return;
    const d = await c.detail(this.globe).catch(() => null);
    if (!d) return;
    $('drawer-kicker').textContent = `${roman[this.index]} · ${c.kicker}`;
    $('drawer-title').textContent = c.title;
    $('drawer-facts').innerHTML = d.facts.map((f) => `<div class="fact"><b>${f.value}</b><span>${f.label}</span></div>`).join('');
    $('drawer-text').textContent = d.text;
    $('drawer-source').textContent = d.source;
    $('drawer').classList.add('on');
    $('drawer').setAttribute('aria-hidden', 'false');
    document.body.classList.add('reading');
    this.globe.rig.setFrameShift(-0.12);
    if (this.playing) this.setPlaying(false);
  }

  closeDrawer() {
    if (!$('drawer').classList.contains('on')) return;
    $('drawer').classList.remove('on');
    $('drawer').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('reading');
    this.globe.rig.setFrameShift(0.14);
  }

  get drawerOpen() { return $('drawer').classList.contains('on'); }

  tick(dt: number) {
    const c = this.chapter;
    if (c && this.playing && this.lineReady && !this.drawerOpen) {
      this.elapsed += dt;
      const f = this.chapterEls[this.index].querySelector('.fill') as HTMLElement;
      f.style.transform = `scaleX(${Math.min(1, this.elapsed / c.duration)})`;
      if (this.elapsed >= c.duration) {
        if (this.index === CHAPTERS.length - 1) {
          // The end: leave the viewer free to explore.
          this.setPlaying(false);
          document.getElementById('hint')!.classList.add('on');
          setTimeout(() => document.getElementById('hint')!.classList.remove('on'), 7000);
        } else this.next();
      }
    }

    // Follow the station across the sky.
    const s = this.globe.station;
    if (this.following && c?.follow === 'iss' && !this.globe.rig.busy && s.altKm > 0) {
      const rig = this.globe.rig;
      let dLon = s.lon - rig.lon;
      if (dLon > 180) dLon -= 360;
      if (dLon < -180) dLon += 360;
      const k = 1 - Math.exp(-dt * 1.5);
      rig.lon += dLon * k;
      rig.lat += (s.lat - rig.lat) * k;
      rig.drift = 0;
    }

    // Labels pinned to places.
    for (const a of this.anchors) {
      if (a.follow === 'iss') {
        a.lon = s.lon; a.lat = s.lat; a.alt = s.altKm;
        const small = a.el.querySelector('small');
        if (small && s.altKm > 0) small.textContent = `${Math.round(s.altKm)} km · ${Math.round(s.speedKmh).toLocaleString('it-IT')} km/h`;
      }
      const v = lonLatToVec(a.lon, a.lat, 1 + a.alt / 6371);
      const p = this.globe.screenOf(v);
      a.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      // Within about 50 km the station itself is on screen: the label would sit on it.
      const onTop = a.follow === 'iss' && s.range < 0.008;
      a.el.style.visibility = p.visible && !onTop ? 'visible' : 'hidden';
    }

    const t = c?.clock === 'rain' ? this.globe.dataFrameTime() : null;
    const dc = $('data-clock');
    if (t) {
      const d = new Date(t);
      $('data-time').textContent = `${d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' })} · ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
      $('data-dot').style.left = `${(this.globe.dataFrameProgress() * 100).toFixed(2)}%`;
      dc.classList.add('on');
    } else dc.classList.remove('on');
  }
}
