import type { Globe, Look } from '../engine/globe';
import { ATLAS, atlasText, type AtlasId } from '../engine/atlas';
import { PALETTES, cssGradient } from '../engine/palettes';
import { CHAPTERS, legend, type Chapter, type Legend } from './chapters';
import { PEOPLE } from './people';
import { NATURE } from './nature';
import { SKY_CHAPTERS } from './sky';
import type { Director } from './director';
import { t } from '../i18n';
import { dayShort, monthYear, num } from '../i18n/format';

/** Series that can be compared first frame against last. */
const SERIES = new Set(['nightlights', 'sst', 'anomaly', 'chlorophyll', 'ice', 'ndvi', 'aerosol', 'coral', 'ozone', 'no2', 'snow', 'sealevel', 'built', 'mangroves', 'bii']);

// Free exploration: every layer of both stories, the year, the hour, the sky, the station,
// and a link that remembers what is on screen.

type LayerId = keyof typeof t.explore.layers;
interface Layer { id: LayerId; look: () => Partial<Look>; legend?: Legend; people?: boolean }
/** Layers without a chapter carry their own note on how to read them. */
type NoteId = keyof typeof t.notes;
const SEA = { sun: 'studio' as const, clouds: 0, night: 0, atmo: 0.8 };
/** The kind of data of the layers with their own note. */
const OWN_KIND: Record<NoteId, keyof typeof t.kinds> = { livello: 'observed', onde: 'model', vulcani: 'inventory' };

const chapterLook = (id: string) => () => ({ ...CHAPTERS.find((c) => c.id === id)!.look });
const chapterLegend = (id: string) => CHAPTERS.find((c) => c.id === id)?.legend;
const peopleBase = { sun: 'studio' as const, clouds: 0, dim: 0.66, desat: 0.6, night: 0, atmo: 0.8 };
const atlasLayer = (id: LayerId, atlas: AtlasId, extra: Partial<Look> = {}): Layer => ({
  id, people: true, look: () => ({ ...peopleBase, atlas, ...extra }),
  legend: ATLAS[atlas].fill ? {
    stops: ATLAS[atlas].palette,
    get left() { return atlasText(atlas).left; }, get right() { return atlasText(atlas).right; }, get title() { return atlasText(atlas).title; },
  } : undefined,
});

const PLANET: Layer[] = [
  { id: 'adesso', look: chapterLook('pianeta') },
  { id: 'venti', look: chapterLook('respiro'), legend: chapterLegend('respiro') },
  { id: 'tempeste', look: () => ({ ...chapterLook('tempeste')(), spotReplay: 0 }), legend: chapterLegend('tempeste') },
  { id: 'correnti', look: chapterLook('correnti'), legend: chapterLegend('correnti') },
  { id: 'mare', look: chapterLook('calore'), legend: chapterLegend('calore') },
  { id: 'livello', look: () => ({ ...SEA, data: 'sealevel', dim: 0.55, desat: 0.7 }), legend: legend(PALETTES.sealevel, 'sealevel') },
  { id: 'onde', look: () => ({ ...SEA, data: 'waves', dim: 0.6, desat: 0.6 }), legend: legend(PALETTES.waves, 'waves') },
  { id: 'anomalia', look: chapterLook('febbre'), legend: chapterLegend('febbre') },
  { id: 'plancton', look: chapterLook('fioritura'), legend: chapterLegend('fioritura') },
  { id: 'pioggia', look: chapterLook('pioggia'), legend: chapterLegend('pioggia') },
  { id: 'fuochi', look: chapterLook('fuoco') },
  { id: 'terremoti', look: () => ({ ...chapterLook('terremoti')(), quakeReplay: 0 }), legend: chapterLegend('terremoti') },
  { id: 'vulcani', look: () => ({ sun: 'studio', clouds: 0, dim: 0.7, desat: 0.75, night: 0, atmo: 0.7, data: 'so2', spots: 'volcanoes', bloom: 1.2 }) },
  { id: 'ghiaccio', look: chapterLook('ghiaccio'), legend: chapterLegend('ghiaccio') },
  { id: 'luci', look: chapterLook('luci') },
  { id: 'stazione', look: chapterLook('lassu') },
];

const HUMAN: Layer[] = [
  atlasLayer('popolazione', 'population', { dust: 1, dim: 0.76, bloom: 1.2 }),
  atlasLayer('nascite', 'birth'),
  atlasLayer('mortalita', 'death'),
  atlasLayer('saldo', 'balance'),
  atlasLayer('vita', 'life'),
  atlasLayer('bambini', 'under5'),
  atlasLayer('elettricita', 'electricity'),
  atlasLayer('disoccupazione', 'unemployment'),
  atlasLayer('migranti', 'migrants'),
  atlasLayer('co2', 'co2'),
  atlasLayer('rifugiati', 'refugees'),
  { id: 'asilomondo', people: true, look: () => ({ ...peopleBase, dim: 0.74, migrationAll: 1, bloom: 1.3 }) },
  { id: 'nottiluci', look: () => ({ ...PEOPLE.find((c) => c.id === 'accendersi')!.look }), legend: PEOPLE.find((c) => c.id === 'accendersi')!.legend },
  { id: 'citta', look: () => ({ ...PEOPLE.find((c) => c.id === 'citta')!.look }), legend: PEOPLE.find((c) => c.id === 'citta')!.legend },
  { id: 'dighe', look: () => ({ ...PEOPLE.find((c) => c.id === 'dighe')!.look, spotReplay: 0 }) },
  { id: 'rotte', look: () => ({ ...PEOPLE.find((c) => c.id === 'rotte')!.look }), legend: PEOPLE.find((c) => c.id === 'rotte')!.legend },
  {
    id: 'asilo', people: true, look: () => ({ ...peopleBase, dim: 0.72, migration: 1, bloom: 1.3 }),
    legend: PEOPLE.find((c) => c.id === 'fuga')!.legend,
  },
];

const natureLayer = (id: LayerId, chapter = id as string, extra: Partial<Look> = {}): Layer => ({
  id, look: () => ({ ...NATURE.find((c) => c.id === chapter)!.look, ...extra }), legend: NATURE.find((c) => c.id === chapter)!.legend,
});
const skyLayer = (id: LayerId, extra: Partial<Look> = {}): Layer => ({
  id, look: () => ({ ...SKY_CHAPTERS.find((c) => c.id === id)!.look, ...extra }), legend: SKY_CHAPTERS.find((c) => c.id === id)!.legend,
});

const NATURE_LAYERS: Layer[] = [
  { id: 'verde', look: () => ({ ...NATURE.find((c) => c.id === 'verde')!.look }), legend: NATURE.find((c) => c.id === 'verde')!.legend },
  { id: 'foreste', people: true, look: () => ({ ...NATURE.find((c) => c.id === 'foreste')!.look, years: null }), legend: NATURE.find((c) => c.id === 'foreste')!.legend },
  { id: 'aria', look: () => ({ ...NATURE.find((c) => c.id === 'aria')!.look }), legend: NATURE.find((c) => c.id === 'aria')!.legend },
  natureLayer('mangrovie'),
  natureLayer('integrita'),
  natureLayer('neve'),
  natureLayer('smog'),
  natureLayer('ozono'),
  natureLayer('petrolio', 'petrolio', { spotReplay: 0 }),
  { id: 'coralli', look: () => ({ ...NATURE.find((c) => c.id === 'coralli')!.look }), legend: NATURE.find((c) => c.id === 'coralli')!.legend },
];

const SKY_LAYERS: Layer[] = [
  skyLayer('aurora'),
  skyLayer('satelliti'),
  skyLayer('partenze'),
  skyLayer('bolidi', { spotReplay: 0 }),
];

const LAYERS = [...PLANET, ...NATURE_LAYERS, ...HUMAN, ...SKY_LAYERS];
/** Chapter → layer, to open the panel on what the story was showing. */
const FROM_CHAPTER: Record<string, string> = {
  pianeta: 'adesso', respiro: 'venti', correnti: 'correnti', calore: 'mare', febbre: 'anomalia', fioritura: 'plancton', pioggia: 'pioggia',
  fuoco: 'fuochi', terremoti: 'terremoti', ghiaccio: 'ghiaccio', luci: 'luci', lassu: 'stazione', popolazione: 'popolazione', nascite: 'nascite', vita: 'vita',
  bambini: 'bambini', saldo: 'saldo', luce: 'elettricita', fuga: 'asilo', verde: 'verde', foreste: 'foreste', mangrovie: 'mangrovie', integrita: 'integrita', aria: 'aria', coralli: 'coralli',
  citta: 'citta', rotte: 'rotte', impronta: 'co2', esilio: 'rifugiati', rotte_asilo: 'asilomondo', accendersi: 'nottiluci', dighe: 'dighe', tempeste: 'tempeste', neve: 'neve', smog: 'smog', ozono: 'ozono', petrolio: 'petrolio', aurora: 'aurora', satelliti: 'satelliti', partenze: 'partenze', bolidi: 'bolidi',
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export class Explorer {
  layer = LAYERS[0];
  year = 2024;
  hours = 0;
  realLight = false;
  clouds = true;
  spin = false;
  private open = false;
  private hashAt = 0;

  constructor(private globe: Globe, private director: Director) {
    this.build();
    $('layers-btn').addEventListener('click', () => this.toggle());
    $('explore-close').addEventListener('click', () => this.toggle(false));
  }

  get isOpen() { return this.open; }

  /** The chapter whose look this layer borrows, for its sound. */
  get chapter(): Chapter | null {
    const id = Object.entries(FROM_CHAPTER).find(([, l]) => l === this.layer.id)?.[0];
    // Statistics without a chapter of their own sound like the other people layers.
    return [...CHAPTERS, ...NATURE, ...PEOPLE, ...SKY_CHAPTERS].find((c) => c.id === id) ?? (this.layer.people ? PEOPLE[0] : null);
  }

  private build() {
    this.buildLayers();
    const year = $<HTMLInputElement>('ex-year');
    year.addEventListener('input', () => { this.year = Number(year.value); this.globe.setYear(this.year); this.refresh(); });
    $('ex-play').addEventListener('click', () => this.playYears());
    const hours = $<HTMLInputElement>('ex-hours');
    hours.addEventListener('input', () => { this.hours = Number(hours.value); this.applyTime(); });
    $('ex-now').addEventListener('click', () => { this.hours = 0; hours.value = '0'; this.applyTime(); });
    const toggle = (id: string, key: 'realLight' | 'clouds' | 'spin') => {
      const el = $<HTMLInputElement>(id);
      el.checked = this[key];
      el.addEventListener('change', () => { this[key] = el.checked; this.apply(); });
    };
    toggle('ex-real', 'realLight');
    toggle('ex-clouds', 'clouds');
    toggle('ex-spin', 'spin');
    $('ex-iss').addEventListener('click', () => this.reachStation());
    $('ex-compare').addEventListener('click', () => this.setComparing(!this.comparing));
    const handle = $('swipe-handle');
    handle.addEventListener('pointerdown', (e) => {
      handle.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => this.moveSwipe(ev.clientX);
      const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      e.stopPropagation();
    });
    handle.addEventListener('keydown', (e) => {
      const x = parseFloat($('swipe').style.getPropertyValue('--x')) || innerWidth / 2;
      if (e.key === 'ArrowLeft') this.moveSwipe(x - 30);
      if (e.key === 'ArrowRight') this.moveSwipe(x + 30);
    });
  }

  private buildLayers() {
    const group = (title: string, layers: Layer[]) => {
      const box = document.createElement('div');
      box.className = 'ex-group';
      const head = document.createElement('div');
      head.className = 'ex-title';
      head.textContent = title;
      box.appendChild(head);
      for (const l of layers) {
        const b = document.createElement('button');
        b.className = 'ex-layer';
        b.dataset.layer = l.id;
        b.textContent = t.explore.layers[l.id];
        b.addEventListener('click', () => this.select(l.id));
        box.appendChild(b);
      }
      return box;
    };
    const list = $('ex-layers');
    list.innerHTML = '';
    const g = t.explore.groups;
    list.append(group(g.planet, PLANET), group(g.nature, NATURE_LAYERS), group(g.people, HUMAN), group(g.sky, SKY_LAYERS));
  }

  /** The words follow the language. */
  relabel() {
    this.buildLayers();
    this.refresh();
    this.applyTime();
  }

  /** Open or close the panel; opening during a story leaves the story where it is. */
  toggle(v = !this.open) {
    if (v === this.open) return;
    this.open = v;
    if (!v) this.setComparing(false);
    $('explore').classList.toggle('on', v);
    $('explore').setAttribute('aria-hidden', String(!v));
    document.body.classList.toggle('exploring', v);
    this.globe.rig.setFrameShift(v ? -0.1 : 0.14);
    if (v) {
      const ch = this.director.chapter;
      if (this.director.playing || ch) {
        const from = ch ? FROM_CHAPTER[ch.id] : null;
        this.director.leave();
        if (from) this.layer = LAYERS.find((l) => l.id === from) ?? this.layer;
      }
      if (this.layer.people && this.globe.year) this.year = Math.round(this.globe.year);
      this.apply();
    }
  }

  select(id: string) {
    this.setComparing(false);
    this.layer = LAYERS.find((l) => l.id === id) ?? this.layer;
    if (this.layer.people) this.year = Math.min(this.year, this.layer.id === 'asilo' ? 2025 : 2024);
    this.apply();
  }

  /** Compose the look from the layer and the switches. */
  apply() {
    const look: Partial<Look> = { ...this.layer.look(), years: null };
    if (this.layer.people) look.year = this.year;
    if (!this.clouds) look.clouds = 0;
    if (this.realLight) { look.sun = 'real'; look.night = Math.max(look.night ?? 0, 0.9); }
    this.globe.setLook(look);
    this.globe.rig.drift = this.spin ? 1.2 : 0;
    this.applyTime();
    this.refresh();
  }

  private applyTime() {
    this.globe.timeOffset = this.hours * 3600e3;
    $('ex-hours-label').textContent = this.hours === 0 ? t.explore.now : `${this.hours > 0 ? '+' : '−'}${num(Math.abs(this.hours), this.hours % 1 ? 2 : 0)} h`;
  }

  private playYears() {
    const last = this.layer.id === 'asilo' ? 2025 : 2024;
    const from = this.year >= last ? this.firstYear() : this.year;
    const look: Partial<Look> = { ...this.globe.currentLook, year: null, years: [from, last], yearSeconds: Math.max(4, (last - from) * 0.3) };
    this.globe.setLook(look);
    this.year = last;
  }

  private firstYear() {
    const FIRST: Record<string, number> = { asilo: 2000, asilomondo: 2000, foreste: 2001, elettricita: 1990, migranti: 1990, rifugiati: 1990, co2: 1970 };
    return FIRST[this.layer.id] ?? 1960;
  }

  private comparing = false;

  /** Can this layer be split into before and after? */
  private comparable() {
    const look = this.layer.look();
    return (!!this.layer.people && !['foreste', 'asilo', 'asilomondo'].includes(this.layer.id)) || (!!look.data && SERIES.has(look.data));
  }

  /** Before and after, at a line that follows the hand. */
  private setComparing(on: boolean) {
    this.comparing = on;
    $('swipe').classList.toggle('on', on);
    $('ex-compare').classList.toggle('active', on);
    if (!on) { this.globe.setCompare(null); return; }
    this.moveSwipe((0.5 + this.globe.rig.frameShift) * innerWidth);
  }

  private moveSwipe(x: number) {
    x = Math.max(80, Math.min(innerWidth - 80, x));
    $('swipe').style.setProperty('--x', `${x}px`);
    const last = this.layer.id === 'asilo' ? 2025 : 2024;
    this.globe.setCompare({ x, from: this.firstYear(), to: last });
    if (this.layer.people) {
      $('swipe-a').textContent = String(this.firstYear());
      $('swipe-b').textContent = String(last);
    } else {
      const f = this.globe.dataFrameTime();
      const fmt = (iso: string) => (f?.cadence === 'year' ? iso.slice(0, 4) : f?.cadence === 'month' ? monthYear(iso) : dayShort(iso));
      $('swipe-a').textContent = f ? fmt(f.first) : '';
      const last = f ? this.globe.lastMeasuredTime() : null;
      $('swipe-b').textContent = last ? fmt(last) : '';
    }
  }

  private reachStation() {
    if (this.layer.id !== 'stazione') this.select('stazione');
    const s = this.globe.station;
    if (s.altKm <= 0) return;
    void this.globe.rig.focusOn(() => ({ pos: s.position, fwd: s.velocity }), { dist: 0.000055, yaw: 28, pitch: 22 }, 10);
  }

  /** How to read the layer: the words of its chapter, and where the data come from. */
  private async note() {
    const layer = this.layer;
    const id = Object.entries(FROM_CHAPTER).find(([, l]) => l === layer.id)?.[0];
    const c = [...CHAPTERS, ...NATURE, ...PEOPLE, ...SKY_CHAPTERS].find((ch) => ch.id === id);
    const box = $('ex-note');
    const own = (t.notes as Record<string, { text: string; source: string }>)[layer.id as NoteId];
    if (!c && own) {
      $('ex-note-kind').textContent = t.kinds[OWN_KIND[layer.id as NoteId]];
      $('ex-note-text').textContent = own.text;
      $('ex-note-source').textContent = own.source;
      box.classList.add('on');
      return;
    }
    if (!c) { box.classList.remove('on'); return; }
    const d = await c.detail(this.globe).catch(() => null);
    if (!d || layer !== this.layer) return;
    $('ex-note-kind').textContent = c.kind ? t.kinds[c.kind] : '';
    $('ex-note-text').textContent = d.text;
    $('ex-note-source').textContent = d.source;
    box.classList.add('on');
  }

  private refresh() {
    void this.note();
    document.querySelectorAll<HTMLButtonElement>('.ex-layer').forEach((b) => b.classList.toggle('current', b.dataset.layer === this.layer.id));
    $('ex-years').classList.toggle('on', !!this.layer.people);
    $('ex-iss').classList.toggle('on', this.layer.id === 'stazione');
    $('ex-compare').classList.toggle('on', this.comparable());
    if (this.comparing) this.moveSwipe(parseFloat($('swipe').style.getPropertyValue('--x')) || innerWidth / 2);
    $<HTMLInputElement>('ex-year').value = String(this.year);
    const lg = this.layer.legend;
    $('ex-legend').classList.toggle('on', !!lg);
    if (lg) {
      $('ex-legend-title').textContent = lg.title;
      $('ex-legend-bar').style.background = cssGradient(lg.stops);
      $('ex-legend-left').textContent = lg.left;
      $('ex-legend-right').textContent = lg.right;
    }
  }

  /** Called every frame: the running year, and the link of what is on screen. */
  tick(dt: number) {
    if (!this.open) return;
    // The dates of a series are known once its frames arrive.
    if (this.comparing && !$('swipe-a').textContent) this.moveSwipe(parseFloat($('swipe').style.getPropertyValue('--x')) || innerWidth / 2);
    if (this.layer.people) {
      const y = Math.round(this.globe.year);
      $('ex-year-label').textContent = String(y);
      if (this.globe.yearRunning) $<HTMLInputElement>('ex-year').value = String(y);
    }
    this.hashAt -= dt;
    if (this.hashAt > 0) return;
    this.hashAt = 1;
    const r = this.globe.rig;
    const hash = `#${this.layer.id}/${r.lon.toFixed(2)},${r.lat.toFixed(2)},${r.dist.toFixed(3)}${this.layer.people ? `/${Math.round(this.globe.year)}` : ''}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  /** Restore a shared link: #layer/lon,lat,dist[/year]. */
  restore(hash: string): boolean {
    const m = /^#([a-z0-9]+)(?:\/(-?[\d.]+),(-?[\d.]+),([\d.]+))?(?:\/(\d{4}))?$/.exec(hash);
    const layer = m && LAYERS.find((l) => l.id === m[1]);
    if (!m || !layer) return false;
    this.layer = layer;
    if (m[5]) this.year = Number(m[5]);
    if (this.open) this.apply(); else this.toggle(true);
    if (m[2]) void this.globe.rig.flyTo({ lon: Number(m[2]), lat: Number(m[3]), dist: Number(m[4]) }, 3);
    return true;
  }
}
