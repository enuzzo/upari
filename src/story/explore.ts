import type { Globe, Look } from '../engine/globe';
import { ATLAS, type AtlasId } from '../engine/atlas';
import { cssGradient } from '../engine/palettes';
import { CHAPTERS, type Legend } from './chapters';
import { PEOPLE } from './people';
import type { Director } from './director';

// Free exploration: every layer of both stories, the year, the hour, the sky, the station,
// and a link that remembers what is on screen.

interface Layer { id: string; label: string; look: () => Partial<Look>; legend?: Legend; people?: boolean }

const chapterLook = (id: string) => () => ({ ...CHAPTERS.find((c) => c.id === id)!.look });
const chapterLegend = (id: string) => CHAPTERS.find((c) => c.id === id)?.legend;
const peopleBase = { sun: 'studio' as const, clouds: 0, dim: 0.66, desat: 0.6, night: 0, atmo: 0.8 };
const atlasLayer = (id: string, label: string, atlas: AtlasId, extra: Partial<Look> = {}): Layer => ({
  id, label, people: true, look: () => ({ ...peopleBase, atlas, ...extra }),
  legend: ATLAS[atlas].fill ? { stops: ATLAS[atlas].palette, left: ATLAS[atlas].left, right: ATLAS[atlas].right, title: ATLAS[atlas].title } : undefined,
});

const PLANET: Layer[] = [
  { id: 'adesso', label: 'La Terra, adesso', look: chapterLook('pianeta') },
  { id: 'venti', label: 'Venti', look: chapterLook('respiro'), legend: chapterLegend('respiro') },
  { id: 'correnti', label: 'Correnti', look: chapterLook('correnti'), legend: chapterLegend('correnti') },
  { id: 'mare', label: 'Temperatura del mare', look: chapterLook('calore'), legend: chapterLegend('calore') },
  { id: 'anomalia', label: 'Mare più caldo del solito', look: chapterLook('febbre'), legend: chapterLegend('febbre') },
  { id: 'plancton', label: 'Fitoplancton', look: chapterLook('fioritura'), legend: chapterLegend('fioritura') },
  { id: 'pioggia', label: 'Pioggia, ultime 24 ore', look: chapterLook('pioggia'), legend: chapterLegend('pioggia') },
  { id: 'fuochi', label: 'Fuochi, ultimi 7 giorni', look: chapterLook('fuoco') },
  { id: 'terremoti', label: 'Terremoti, ultimi 7 giorni', look: () => ({ ...chapterLook('terremoti')(), quakeReplay: 0 }), legend: chapterLegend('terremoti') },
  { id: 'ghiaccio', label: 'Ghiaccio marino', look: chapterLook('ghiaccio'), legend: chapterLegend('ghiaccio') },
  { id: 'luci', label: 'Le luci della notte', look: chapterLook('luci') },
  { id: 'stazione', label: 'Stazione Spaziale', look: chapterLook('lassu') },
];

const HUMAN: Layer[] = [
  atlasLayer('popolazione', 'Popolazione', 'population', { dust: 1, dim: 0.76, bloom: 1.2 }),
  atlasLayer('nascite', 'Natalità', 'birth'),
  atlasLayer('mortalita', 'Mortalità', 'death'),
  atlasLayer('saldo', 'Saldo naturale', 'balance'),
  atlasLayer('vita', 'Speranza di vita', 'life'),
  atlasLayer('bambini', 'Mortalità sotto i 5 anni', 'under5'),
  atlasLayer('elettricita', 'Accesso all’elettricità', 'electricity'),
  atlasLayer('disoccupazione', 'Disoccupazione (stime ILO)', 'unemployment'),
  {
    id: 'asilo', label: 'Domande di asilo', people: true, look: () => ({ ...peopleBase, dim: 0.72, migration: 1, bloom: 1.3 }),
    legend: PEOPLE.find((c) => c.id === 'fuga')!.legend,
  },
];

const LAYERS = [...PLANET, ...HUMAN];
/** Chapter → layer, to open the panel on what the story was showing. */
const FROM_CHAPTER: Record<string, string> = {
  pianeta: 'adesso', respiro: 'venti', correnti: 'correnti', calore: 'mare', febbre: 'anomalia', fioritura: 'plancton', pioggia: 'pioggia',
  fuoco: 'fuochi', terremoti: 'terremoti', ghiaccio: 'ghiaccio', luci: 'luci', lassu: 'stazione', popolazione: 'popolazione', nascite: 'nascite', vita: 'vita',
  bambini: 'bambini', saldo: 'saldo', luce: 'elettricita', fuga: 'asilo',
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

  private build() {
    const group = (title: string, layers: Layer[]) => {
      const box = document.createElement('div');
      box.className = 'ex-group';
      box.innerHTML = `<div class="ex-title">${title}</div>`;
      for (const l of layers) {
        const b = document.createElement('button');
        b.className = 'ex-layer';
        b.dataset.layer = l.id;
        b.textContent = l.label;
        b.addEventListener('click', () => this.select(l.id));
        box.appendChild(b);
      }
      return box;
    };
    const list = $('ex-layers');
    list.append(group('Il pianeta', PLANET), group('Le persone', HUMAN));
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
  }

  /** Open or close the panel; opening during a story leaves the story where it is. */
  toggle(v = !this.open) {
    if (v === this.open) return;
    this.open = v;
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
    $('ex-hours-label').textContent = this.hours === 0 ? 'adesso' : `${this.hours > 0 ? '+' : '−'}${Math.abs(this.hours)} h`;
  }

  private playYears() {
    const last = this.layer.id === 'asilo' ? 2025 : 2024;
    const from = this.year >= last ? (this.layer.id === 'asilo' ? 2000 : this.layer.id === 'elettricita' ? 1990 : 1960) : this.year;
    const look: Partial<Look> = { ...this.globe.currentLook, year: null, years: [from, last], yearSeconds: Math.max(4, (last - from) * 0.3) };
    this.globe.setLook(look);
    this.year = last;
  }

  private reachStation() {
    if (this.layer.id !== 'stazione') this.select('stazione');
    const s = this.globe.station;
    if (s.altKm <= 0) return;
    void this.globe.rig.focusOn(() => ({ pos: s.position, fwd: s.velocity }), { dist: 0.000055, yaw: 28, pitch: 22 }, 10);
  }

  private refresh() {
    document.querySelectorAll<HTMLButtonElement>('.ex-layer').forEach((b) => b.classList.toggle('current', b.dataset.layer === this.layer.id));
    $('ex-years').classList.toggle('on', !!this.layer.people);
    $('ex-iss').classList.toggle('on', this.layer.id === 'stazione');
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
    const m = /^#([a-z]+)(?:\/(-?[\d.]+),(-?[\d.]+),([\d.]+))?(?:\/(\d{4}))?$/.exec(hash);
    const layer = m && LAYERS.find((l) => l.id === m[1]);
    if (!m || !layer) return false;
    this.layer = layer;
    if (m[5]) this.year = Number(m[5]);
    if (this.open) this.apply(); else this.toggle(true);
    if (m[2]) void this.globe.rig.flyTo({ lon: Number(m[2]), lat: Number(m[3]), dist: Number(m[4]) }, 3);
    return true;
  }
}
