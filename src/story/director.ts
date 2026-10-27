import type { Globe } from '../engine/globe';
import { lonLatToVec, sunDirection } from '../engine/astro';
import { loadCountries, placeBelow, type Country } from './geo';
import { cssGradient } from '../engine/palettes';
import type { Chapter } from './chapters';
import { STORIES, type Story } from './stories';
import { showChart } from './charts';
import { placeFacts } from './place';
import { t, lang } from '../i18n';
import { dayMonthShort, dayShort, monthYear, num, timeUtc } from '../i18n/format';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
/** Chapter numerals, 0 → I (stories run past twelve chapters). */
const roman = (i: number) => {
  let n = i + 1, out = '';
  for (const [v, r] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']] as [number, string][]) for (; n >= v; n -= v) out += r;
  return out;
};

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
  private countries: Country[] | null = null;
  story: Story = STORIES[0];
  private telemetryAt = 0;
  private chapterEls: HTMLLIElement[] = [];

  constructor(private globe: Globe) {
    this.buildRail();
    this.buildStories();
    $('next-story').addEventListener('click', () => {
      const next = STORIES[(STORIES.indexOf(this.story) + 1) % STORIES.length];
      this.setStory(next.id);
      void this.go(0);
    });
    $('play-btn').addEventListener('click', () => this.setPlaying(!this.playing));
    $('more-btn').addEventListener('click', () => this.openDrawer());
    $('drawer-close').addEventListener('click', () => this.closeDrawer());
    globe.rig.onUserInput = () => {
      if (this.playing) this.setPlaying(false);
      this.following = false;
      globe.rig.drift = 0;
    };
  }

  get chapters(): Chapter[] { return this.story.chapters; }
  get chapter(): Chapter | null { return this.chapters[this.index] ?? null; }

  /** Switch documentary: the rail shows its chapters; call go() to start it. */
  /** Called when the last chapter of a story ends, with the story that would follow. */
  onEnd: (next: Story) => void = () => {};

  storyById(id: string) { return STORIES.find((s) => s.id === id) ?? null; }

  setStory(id: string) {
    const story = STORIES.find((s) => s.id === id);
    if (!story || story === this.story) return;
    this.story = story;
    this.index = -1;
    this.buildRail();
    document.querySelectorAll<HTMLButtonElement>('#stories button').forEach((b) => b.classList.toggle('current', b.dataset.story === id));
  }

  private buildStories() {
    const nav = $('stories');
    nav.innerHTML = '';
    for (const s of STORIES) {
      const b = document.createElement('button');
      b.dataset.story = s.id;
      b.textContent = s.title;
      b.classList.toggle('current', s === this.story);
      b.addEventListener('click', () => { this.setStory(s.id); void this.go(0); });
      nav.appendChild(b);
    }
  }

  private buildRail() {
    const ol = $('chapters');
    ol.innerHTML = '';
    this.chapterEls = [];
    this.chapters.forEach((c, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<button><span class="bar"><span class="fill"></span></span><span class="label"></span></button>';
      li.querySelector('button')!.setAttribute('aria-label', c.title);
      li.querySelector('.label')!.textContent = c.title;
      li.querySelector('button')!.addEventListener('click', () => { this.go(i); });
      ol.appendChild(li);
      this.chapterEls.push(li);
    });
  }

  /** The language changed: the same moment, in the new words. */
  relabel() {
    this.buildStories();
    const index = this.index;
    this.buildRail();
    $('play-btn').setAttribute('aria-label', this.playing ? t.page.pause : t.page.resume);
    const c = this.chapter;
    if (!c || index < 0) return;
    this.chapterEls.forEach((li, k) => {
      li.classList.toggle('current', k === index);
      li.classList.toggle('done', k < index);
      (li.querySelector('.fill') as HTMLElement).style.transform = k < index ? 'scaleX(1)' : k === index ? `scaleX(${Math.min(1, this.elapsed / c.duration)})` : 'scaleX(0)';
    });
    $('cap-kicker').textContent = c.kicker;
    $('cap-kind').textContent = c.kind ? t.kinds[c.kind] : '';
    $('cap-title').textContent = c.title;
    this.legend(c);
    if (!this.detour && c.chart) showChart(c.chart);
    const token = this.token;
    if (this.lineReady) void c.narrate(this.globe).catch(() => '').then((text) => { if (token === this.token && text) this.speak(text); });
    if (!this.detour) {
      this.clearAnchors();
      if (c.follow === 'iss' && this.lineReady) this.anchorStation();
      void this.pin(c, token);
    }
    if (this.drawerOpen) void this.openDrawer();
    const next = $('next-story');
    if (next.classList.contains('on')) next.querySelector('span')!.textContent = t.page.next(STORIES[(STORIES.indexOf(this.story) + 1) % STORIES.length].title);
  }

  setPlaying(v: boolean) {
    this.playing = v;
    $('play-btn').classList.toggle('paused', !v);
    $('play-btn').setAttribute('aria-label', v ? t.page.pause : t.page.resume);
    if (v && this.chapter) {
      // Resuming: go back to the chapter's framing.
      if (this.detour) this.go(this.index);
      else if (this.elapsed > this.chapter.duration - 4) this.next();
      else void this.frame(this.chapter, this.token);
    }
  }

  next() { this.go((this.index + 1) % this.chapters.length); }
  prev() { this.go((this.index - 1 + this.chapters.length) % this.chapters.length); }

  async go(i: number) {
    const c = this.chapters[i];
    $('next-story').classList.remove('on');
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
    showChart(c.chart ?? null);
    await new Promise((r) => setTimeout(r, 650));
    if (token !== this.token) return;

    $('cap-num').textContent = roman(i);
    $('cap-kicker').textContent = c.kicker;
    $('cap-kind').textContent = c.kind ? t.kinds[c.kind] : '';
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
    void this.badges(c, token);
  }

  /** The labels a chapter puts on the globe. */
  private async badges(c: Chapter, token: number) {
    const list = await c.badges?.(this.globe).catch(() => []) ?? [];
    if (token !== this.token) return;
    for (const b of list) {
      const el = document.createElement('div');
      const title = document.createElement('b'), small = document.createElement('small');
      title.textContent = b.title;
      small.textContent = b.sub;
      el.append(title, small);
      this.addAnchor(b.lon, b.lat, b.altKm, el.innerHTML);
    }
  }

  /** Camera choreography for a chapter. */
  private async frame(c: Chapter, token: number) {
    const beats = await c.beats(this.globe).catch(() => []);
    if (token !== this.token) return;
    for (const b of beats) {
      this.globe.rig.drift = 0;
      if (b.look) this.globe.setLook({ ...c.look, ...b.look });
      if (b.clear) this.clearAnchors();
      await this.globe.rig.flyTo(b.shot, b.seconds);
      if (token !== this.token || !this.playing) return;
      this.globe.rig.drift = b.drift ?? 0;
      if (b.hold) {
        this.following = !!b.follow;
        const until = this.elapsed + b.hold;
        while (this.elapsed < until) {
          await new Promise((r) => setTimeout(r, 150));
          if (token !== this.token || !this.playing) return;
        }
        this.following = false;
      }
    }
    if (c.follow === 'iss') this.following = true;
    if (c.approach === 'iss' && this.globe.station.altKm > 0) {
      const s = this.globe.station;
      // About 350 m behind and above the station, with the Earth rolling by underneath.
      await this.globe.rig.focusOn(() => ({ pos: s.position, fwd: s.velocity }), { dist: 0.000055, yaw: 28, pitch: 22 }, 12);
      if (token !== this.token || !this.playing) return;
      const line = await c.arrive?.(this.globe).catch(() => '');
      if (line && token === this.token) this.speak(line);
    }
  }

  private speak(text: string) {
    const el = $('cap-line');
    el.innerHTML = '';
    // Chinese and Japanese have no spaces: the words come from the segmenter.
    const words = /^(zh|ja)$/.test(lang) && 'Segmenter' in Intl
      ? Array.from(new Intl.Segmenter(t.lang.locale, { granularity: 'word' }).segment(text), (s) => s.segment)
      : text.split(/(\s+)/);
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
      const el = document.createElement('div');
      el.innerHTML = '<b></b><small></small>';
      el.querySelector('b')!.textContent = p.label;
      el.querySelector('small')!.textContent = p.sub;
      this.addAnchor(p.lon, p.lat, 0, el.innerHTML);
    }, 1400);
  }

  /** Leave the story where it is, for free exploration; resuming restarts the chapter. */
  leave() {
    if (this.playing) this.setPlaying(false);
    if (!this.chapter) return;
    this.detour = true;
    this.following = false;
    this.clearAnchors();
    $('legend').classList.remove('on');
    $('caption').classList.add('hidden');
    showChart(null);
  }

  /** Leave the story to show a place the viewer looked for. */
  showPlace(lon: number, lat: number, name: string, context: string) {
    this.setPlaying(false);
    this.detour = true;
    this.following = false;
    this.clearAnchors();
    $('legend').classList.remove('on');
    $('caption').classList.add('hidden');
    showChart(null);
    this.globe.setLook({ sun: 'real', clouds: 1, night: 1, pin: { lon, lat } });
    const el = document.createElement('div');
    const b = document.createElement('b'), small = document.createElement('small');
    b.textContent = name;
    small.textContent = context;
    el.append(b, small);
    // The place now: solar time, sunrise and sunset, wind and sea, from the layers at hand.
    const token = this.token;
    const facts = placeFacts(this.globe, lon, lat).catch(() => []);
    setTimeout(async () => {
      for (const line of await facts) {
        const i = document.createElement('i');
        i.className = 'a-fact';
        i.textContent = line;
        el.appendChild(i);
      }
      if (token === this.token && this.detour) this.addAnchor(lon, lat, 0, el.innerHTML);
    }, 900);
  }

  private anchorStation() {
    const s = this.globe.station;
    const el = document.createElement('div');
    el.innerHTML = '<b></b><small></small>';
    el.querySelector('b')!.textContent = t.station.name;
    this.addAnchor(s.lon, s.lat, s.altKm, el.innerHTML, 'iss');
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
    $('drawer-kicker').textContent = `${roman(this.index)} · ${c.kicker}`;
    $('drawer-title').textContent = c.title;
    $('drawer-facts').innerHTML = '';
    for (const f of d.facts) {
      const el = document.createElement('div');
      el.className = 'fact';
      el.innerHTML = '<b></b><span></span>';
      el.querySelector('b')!.textContent = f.value;
      el.querySelector('span')!.textContent = f.label;
      $('drawer-facts').appendChild(el);
    }
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

  /** The station's live numbers, beside the narration. */
  private telemetry(c: Chapter | null, dt: number) {
    const panel = $('telemetry');
    const show = c?.telemetry === 'iss' && this.lineReady && !this.drawerOpen && this.globe.station.altKm > 0;
    panel.classList.toggle('on', show);
    if (!show) return;
    this.telemetryAt -= dt;
    if (this.telemetryAt > 0) return;
    this.telemetryAt = 0.5;
    if (!this.countries) void loadCountries().then((c) => { this.countries = c; }).catch(() => {});
    const s = this.globe.station, now = this.globe.now;
    const light = s.daylight(now, (d) => sunDirection(d));
    const set = (id: string, v: string) => { const el = $(id); if (el.textContent !== v) el.textContent = v; };
    const w = t.station, k = t.compass;
    set('tm-alt', `${num(s.altKm)} ${t.units.km}`);
    set('tm-speed', `${num(s.speedKmh)} ${t.units.kmh}`);
    set('tm-below', placeBelow(this.countries, s.lon, s.lat));
    const min = light && Number.isFinite(light.minutes) ? num(Math.round(light.minutes)) : null;
    set('tm-light', !light ? '' : `${light.day ? w.day : w.night}${min ? ` · ${light.day ? w.sunsetIn(min) : w.sunriseIn(min)}` : ''}`);
    set('tm-pos', `${num(Math.abs(s.lat), 1)}° ${s.lat >= 0 ? k.N : k.S} · ${num(Math.abs(s.lon), 1)}° ${s.lon >= 0 ? k.E : k.W}`);
    set('tm-orbit', w.orbitOfDay(Math.floor(s.orbitsToday(now)) + 1));
  }

  tick(dt: number) {
    const c = this.chapter;
    if (c && this.playing && this.lineReady && !this.drawerOpen) {
      this.elapsed += dt;
      const f = this.chapterEls[this.index].querySelector('.fill') as HTMLElement;
      f.style.transform = `scaleX(${Math.min(1, this.elapsed / c.duration)})`;
      if (this.elapsed >= c.duration) {
        if (this.index === this.chapters.length - 1) {
          // The end: leave the viewer free to explore, and offer the next story.
          this.setPlaying(false);
          const next = STORIES[(STORIES.indexOf(this.story) + 1) % STORIES.length];
          if (next !== this.story) {
            $('next-story').querySelector('span')!.textContent = t.page.next(next.title);
            $('next-story').classList.add('on');
          }
          document.getElementById('hint')!.classList.add('on');
          setTimeout(() => document.getElementById('hint')!.classList.remove('on'), 7000);
          this.onEnd(next);
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
        if (small && s.altKm > 0) small.textContent = `${num(s.altKm)} ${t.units.km} · ${num(s.speedKmh)} ${t.units.kmh}`;
      }
      const v = lonLatToVec(a.lon, a.lat, 1 + a.alt / 6371);
      const p = this.globe.screenOf(v);
      a.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      // Near the right edge the words go on the other side of the point, so they stay on screen.
      a.el.classList.toggle('left', p.x > innerWidth * 0.76);
      // Within about 50 km the station itself is on screen: the label would sit on it.
      const onTop = a.follow === 'iss' && s.range < 0.008;
      a.el.style.visibility = p.visible && !onTop ? 'visible' : 'hidden';
    }

    this.telemetry(c, dt);

    const frame = c?.clock === 'data' ? this.globe.dataFrameTime() : null;
    const dc = $('data-clock');
    const run = c?.clock === 'year' ? this.globe.yearRunning : null;
    const replay = c?.clock === 'replay' && c.replay ? this.globe.spotProgress() : null;
    // Over the planet, wherever the framing puts it.
    dc.style.setProperty('--globe-x', `${((0.5 + this.globe.rig.frameShift) * 100).toFixed(2)}%`);
    if (run) {
      $('data-time').textContent = String(Math.round(this.globe.year));
      $('data-from').textContent = String(run.from);
      $('data-to').textContent = String(run.to);
      $('data-dot').style.left = `${(((this.globe.year - run.from) / Math.max(1, run.to - run.from)) * 100).toFixed(2)}%`;
      dc.classList.add('on');
    } else if (replay != null) {
      const [from, to] = c!.replay!;
      $('data-time').textContent = String(Math.round(from + replay * (to - from)));
      $('data-from').textContent = String(from);
      $('data-to').textContent = String(to);
      $('data-dot').style.left = `${(replay * 100).toFixed(2)}%`;
      dc.classList.add('on');
    } else if (frame) {
      const time = frame.time;
      const fmt = (iso: string) => (frame.cadence === 'hour' ? `${timeUtc(iso)} UTC` : frame.cadence === 'year' ? iso.slice(0, 4) : frame.cadence === 'month' ? monthYear(iso) : dayShort(iso));
      $('data-time').textContent = frame.cadence === 'year' ? time.slice(0, 4) : frame.cadence === 'month' ? monthYear(time)
        : frame.cadence === 'day' ? dayShort(time)
        : `${dayMonthShort(time)} · ${timeUtc(time)} UTC`;
      $('data-from').textContent = fmt(frame.first);
      $('data-to').textContent = fmt(frame.last);
      $('data-dot').style.left = `${(this.globe.dataFrameProgress() * 100).toFixed(2)}%`;
      dc.classList.add('on');
    } else dc.classList.remove('on');
  }
}
