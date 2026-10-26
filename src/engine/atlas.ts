import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, DataTexture, FloatType, LineSegments, NearestFilter, Points,
  RGFormat, RedFormat, ShaderMaterial, Vector3, ClampToEdgeWrapping, type Texture,
} from 'three';
import { lonLatToVec } from './astro';
import { paletteTexture, type Stop } from './palettes';
import { countryAt, loadCountries, type Country } from '../story/geo';

// The people of the planet, from verified snapshots: World Bank WDI (CC BY 4.0, which
// distributes UN WPP, UN IGME and ILO series), UNHCR asylum applications (CC BY 4.0) and
// Natural Earth borders (public domain). Colours move between years; numbers never do:
// a year without a value stays empty.

export type AtlasId = 'population' | 'birth' | 'death' | 'balance' | 'life' | 'under5' | 'electricity' | 'unemployment';

export interface AtlasDef {
  title: string;
  unit: string;
  /** Fixed scale for every year and country, so a colour always means the same value. */
  min: number;
  max: number;
  /** Exponent on the normalised value (0.5 spreads the low end). */
  curve: number;
  palette: Stop[];
  /** Drawn as coloured countries (population is drawn as dust instead). */
  fill: boolean;
  left: string;
  right: string;
  format: (v: number) => string;
  source: string;
  file: 'world' | 'health' | 'electricity';
}

const nf = (d: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: d, minimumFractionDigits: d });
const WDI = 'World Bank, World Development Indicators';

export const ATLAS: Record<AtlasId, AtlasDef> = {
  population: {
    title: 'persone', unit: 'abitanti', min: 0, max: 1, curve: 1, palette: [[0, '#ffd9a0'], [1, '#ffd9a0']], fill: false, left: '', right: '',
    format: (v) => (v >= 1e9 ? `${nf(2).format(v / 1e9)} miliardi` : v >= 1e6 ? `${nf(1).format(v / 1e6)} milioni` : `${nf(0).format(v)} persone`),
    source: `${WDI} · SP.POP.TOTL (ONU, uffici nazionali, Eurostat)`, file: 'world',
  },
  birth: {
    title: 'nascite ogni 1.000 abitanti', unit: 'nascite / 1.000', min: 5, max: 50, curve: 1, fill: true, left: '5', right: '50',
    palette: [[0, '#16213f'], [0.2, '#1f4f7a'], [0.42, '#2f9aa0'], [0.62, '#e8c66a'], [0.82, '#f08a4b'], [1, '#ff5d73']],
    format: (v) => `${nf(1).format(v)} nascite ogni 1.000`, source: `${WDI} · SP.DYN.CBRT.IN`, file: 'world',
  },
  death: {
    title: 'decessi ogni 1.000 abitanti', unit: 'decessi / 1.000', min: 2, max: 30, curve: 0.75, fill: true, left: '2', right: '30',
    palette: [[0, '#14213a'], [0.3, '#3b3f7a'], [0.6, '#9a4f9e'], [0.85, '#ef7aa4'], [1, '#ffd1dc']],
    format: (v) => `${nf(1).format(v)} decessi ogni 1.000`, source: `${WDI} · SP.DYN.CDRT.IN`, file: 'world',
  },
  balance: {
    title: 'nascite meno decessi, ogni 1.000', unit: 'saldo / 1.000', min: -10, max: 40, curve: 1, fill: true, left: '−10', right: '+40',
    palette: [[0, '#5aa8ff'], [0.16, '#2a5c9e'], [0.2, '#1b2233'], [0.24, '#4a3a22'], [0.55, '#d99a3e'], [1, '#ffd27a']],
    format: (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${nf(1).format(Math.abs(v))} ogni 1.000`, source: `${WDI} · natalità meno mortalità (calcolo Upari)`, file: 'world',
  },
  life: {
    title: 'speranza di vita alla nascita', unit: 'anni', min: 35, max: 85, curve: 1, fill: true, left: '35 anni', right: '85',
    palette: [[0, '#5a1a2a'], [0.25, '#b0452f'], [0.5, '#e0a13f'], [0.72, '#8fd17a'], [0.9, '#5fe0d0'], [1, '#e8fff8']],
    format: (v) => `${nf(1).format(v)} anni`, source: `${WDI} · SP.DYN.LE00.IN`, file: 'world',
  },
  under5: {
    title: 'bambini che muoiono prima dei 5 anni, su 1.000', unit: 'su 1.000 nati', min: 0, max: 300, curve: 0.5, fill: true, left: '0', right: '300',
    palette: [[0, '#16283a'], [0.25, '#2f5f6f'], [0.5, '#c79a5a'], [0.75, '#f0704f'], [1, '#ff3d6e']],
    format: (v) => `${nf(0).format(v)} su 1.000 nati vivi`, source: 'UN IGME tramite World Bank WDI · SH.DYN.MORT', file: 'health',
  },
  electricity: {
    title: 'persone con l’elettricità', unit: '%', min: 0, max: 100, curve: 1, fill: true, left: '0%', right: '100%',
    palette: [[0, '#0b0d14'], [0.35, '#3a2a16'], [0.7, '#c98a3a'], [1, '#ffe3a8']],
    format: (v) => `${nf(0).format(v)}% della popolazione`, source: 'World Bank, SDG 7.1.1 · EG.ELC.ACCS.ZS', file: 'electricity',
  },
  unemployment: {
    title: 'disoccupazione, stime modellate ILO', unit: '% forza lavoro', min: 0, max: 30, curve: 0.8, fill: true, left: '0%', right: '30%',
    palette: [[0, '#12202e'], [0.3, '#2c5a6a'], [0.6, '#b98f4a'], [1, '#ff7a5a']],
    format: (v) => `${nf(1).format(v)}% della forza lavoro`, source: 'ILO, stime modellate, tramite World Bank WDI · SL.UEM.TOTL.ZS', file: 'world',
  },
};

/** Asylum applications from three origins (UNHCR), as streams of light. */
export const ORIGINS: Record<string, { name: string; color: [number, number, number] }> = {
  SYR: { name: 'Siria', color: [0.35, 0.95, 0.9] },
  UKR: { name: 'Ucraina', color: [1.0, 0.55, 0.8] },
  AFG: { name: 'Afghanistan', color: [1.0, 0.75, 0.35] },
};

type Series = Record<string, (number | null)[]>;
interface Relation { origin: string; destination: string; values: (number | null)[] }

const W = 4096, H = 2048, SLOTS = 256;
const PEOPLE_PER_DOT = 250000;

export class Atlas {
  years: number[] = [];
  /** Statistic code → name, capital coordinates. */
  places = new Map<string, { name: string; lon: number; lat: number }>();
  countries: Country[] = [];
  /** Border outline slot (1..) for each statistic code. */
  slots = new Map<string, number>();
  idMap: Texture | null = null;
  private series = new Map<AtlasId, Series>();
  private textures = new Map<AtlasId, DataTexture>();
  private palettes = new Map<AtlasId, Texture>();
  relations: Relation[] = [];
  asylumByCountry: Series = {};
  dust: Points | null = null;
  flows: Points | null = null;
  /** The faint arcs the streams follow. */
  arcs: LineSegments | null = null;
  private loading: Promise<void> | null = null;

  load(): Promise<void> {
    this.loading ??= this.build();
    this.loading.catch(() => { this.loading = null; });
    return this.loading;
  }

  get ready() { return !!this.idMap; }

  private async build() {
    const get = async (f: string) => (await fetch(`statistics/${f}`)).json();
    const [world, health, electricity, asylum, countries, dust] = await Promise.all([
      get('world.json'), get('health.json'), get('electricity.json'), get('asylum.json'), loadCountries(),
      fetch('statistics/dust.bin').then((r) => r.arrayBuffer()),
    ]);
    this.years = world.years;
    for (const c of world.countries as { id: string; name: string; longitude: number; latitude: number }[]) {
      this.places.set(c.id, { name: c.name, lon: c.longitude, lat: c.latitude });
    }
    for (const id of ['population', 'birth', 'death', 'balance', 'life', 'unemployment'] as const) this.series.set(id, world.values[id]);
    this.series.set('under5', health.values);
    this.series.set('electricity', electricity.values);
    this.relations = asylum.relations;
    this.asylumByCountry = asylum.values;
    this.countries = countries;
    // Natural Earth names are Italian; prefer them for the places the borders know.
    countries.forEach((c, i) => { if (c.stat) { this.slots.set(c.stat, i + 1); const p = this.places.get(c.stat); if (p) p.name = c.name; } });
    this.idMap = this.drawIdMap();
    this.dust = this.makeDust(dust);
    this.flows = this.makeFlows();
  }

  /** Each country painted with its slot in red; outlines in black mark the borders. */
  private drawIdMap(): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgb(0,255,0)';
    ctx.fillRect(0, 0, W, H);
    const path = (c: Country) => {
      ctx.beginPath();
      for (const poly of c.polygons) for (const ring of poly) {
        ring.forEach(([lon, lat], k) => {
          const x = ((lon + 180) / 360) * W, y = ((90 - lat) / 180) * H;
          if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        });
        ctx.closePath();
      }
    };
    this.countries.forEach((c, i) => { path(c); ctx.fillStyle = `rgb(${i + 1},255,0)`; ctx.fill('evenodd'); });
    ctx.strokeStyle = 'rgb(0,0,0)';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    for (const c of this.countries) { if (c.id === 'ATA') continue; path(c); ctx.stroke(); }
    const tex = new CanvasTexture(canvas);
    tex.magFilter = tex.minFilter = NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
    return tex;
  }

  /** Values per border slot (x) and year (y): red the value, green 1 where there is one. */
  values(id: AtlasId): DataTexture {
    let t = this.textures.get(id);
    if (t) return t;
    const data = new Float32Array(SLOTS * this.years.length * 2);
    const s = this.series.get(id)!;
    for (const [code, slot] of this.slots) {
      const row = s[code];
      if (!row) continue;
      row.forEach((v, y) => { if (v != null) { data[(y * SLOTS + slot) * 2] = v; data[(y * SLOTS + slot) * 2 + 1] = 1; } });
    }
    t = new DataTexture(data, SLOTS, this.years.length, RGFormat, FloatType);
    t.magFilter = t.minFilter = NearestFilter;
    t.needsUpdate = true;
    this.textures.set(id, t);
    return t;
  }

  palette(id: AtlasId): Texture {
    let p = this.palettes.get(id);
    if (!p) { p = paletteTexture(ATLAS[id].palette); this.palettes.set(id, p); }
    return p;
  }

  value(id: AtlasId, code: string, year: number): number | null {
    const y = Math.round(year) - this.years[0];
    return this.series.get(id)?.[code]?.[y] ?? null;
  }

  /** Sum over all territories for a year (population, asylum totals). */
  total(id: AtlasId, year: number): number {
    const y = Math.round(year) - this.years[0];
    let sum = 0;
    for (const row of Object.values(this.series.get(id) ?? {})) sum += row[y] ?? 0;
    return sum;
  }

  /** Country with the highest or lowest value in a year, among those with borders. */
  extreme(id: AtlasId, year: number, highest: boolean): { code: string; name: string; value: number } | null {
    let best: { code: string; name: string; value: number } | null = null;
    for (const code of this.slots.keys()) {
      const v = this.value(id, code, year);
      if (v == null) continue;
      if (!best || (highest ? v > best.value : v < best.value)) best = { code, name: this.places.get(code)?.name ?? code, value: v };
    }
    return best;
  }

  countryAt(lon: number, lat: number): Country | null { return countryAt(this.countries, lon, lat); }

  /** Latest year with values for a statistic. */
  lastYear(id: AtlasId): number {
    const s = this.series.get(id) ?? {};
    for (let y = this.years.length - 1; y >= 0; y--) if (Object.values(s).some((row) => row[y] != null)) return this.years[y];
    return this.years[0];
  }

  /** Mean over countries weighted by their population that year: the value for the world's people. */
  worldMean(id: AtlasId, year: number): number | null {
    const y = Math.round(year) - this.years[0];
    const pop = this.series.get('population')!, s = this.series.get(id)!;
    let sum = 0, w = 0;
    for (const [code, row] of Object.entries(s)) {
      const v = row[y], p = pop[code]?.[y];
      if (v == null || !p) continue;
      sum += v * p; w += p;
    }
    return w ? sum / w : null;
  }

  /** Countries (with borders) whose value that year passes a test. */
  count(id: AtlasId, year: number, test: (v: number) => boolean): number {
    let n = 0;
    for (const code of this.slots.keys()) { const v = this.value(id, code, year); if (v != null && test(v)) n++; }
    return n;
  }

  /** Total asylum applications per origin and year, and the year each origin peaked. */
  asylumPeak(origin: string): { year: number; total: number } {
    let best = { year: this.years[0], total: 0 };
    for (let y = 0; y < this.years.length; y++) {
      const total = this.relations.filter((r) => r.origin === origin).reduce((s, r) => s + (r.values[y] ?? 0), 0);
      if (total > best.total) best = { year: this.years[y], total };
    }
    return best;
  }

  /**
   * One dot for every 250,000 people, placed inside each country where its night lights are
   * (scripts/prepare-atlas.mjs), so the dust gathers where people live. Each dot has a rank:
   * as the population of a year grows past its rank, the dot lights up.
   */
  private makeDust(raw: ArrayBuffer): Points {
    const d = new Int16Array(raw);
    const n = d.length / 4;
    const pos = new Float32Array(n * 3), slot = new Float32Array(n), rank = new Float32Array(n);
    const v = new Vector3();
    for (let i = 0; i < n; i++) {
      lonLatToVec(d[i * 4] / 100, d[i * 4 + 1] / 100, 1.0007, v);
      pos.set([v.x, v.y, v.z], i * 3);
      slot[i] = d[i * 4 + 2] + 1;
      rank[i] = d[i * 4 + 3];
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('slot', new BufferAttribute(slot, 1));
    g.setAttribute('rank', new BufferAttribute(rank, 1));
    const popTex = this.values('population');
    const material = new ShaderMaterial({
      uniforms: { uPop: { value: popTex }, uYear: { value: 0 }, uYears: { value: this.years.length }, uOpacity: { value: 0 }, uScale: { value: PEOPLE_PER_DOT }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
      vertexShader: /* glsl */ `
        attribute float slot, rank;
        uniform sampler2D uPop;
        uniform float uYear, uYears, uScale, uPixelRatio;
        varying float vAlpha;
        void main() {
          int y0 = int(floor(uYear)), y1 = min(y0 + 1, int(uYears) - 1);
          float p = mix(texelFetch(uPop, ivec2(int(slot), y0), 0).r, texelFetch(uPop, ivec2(int(slot), y1), 0).r, fract(uYear));
          vec3 toCam = normalize(cameraPosition - position);
          vAlpha = clamp(p / uScale - rank, 0.0, 1.0) * smoothstep(0.0, 0.25, dot(normalize(position), toCam));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (vAlpha > 0.0 ? clamp(5.5 / -mv.z, 1.6, 4.0) : 0.0) * uPixelRatio;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          gl_FragColor = vec4(vec3(1.0, 0.84, 0.6) * exp(-r * r * 3.5) * 1.5 * vAlpha * uOpacity, 1.0);
        }`,
      blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true,
    });
    const points = new Points(g, material);
    points.frustumCulled = false;
    points.renderOrder = 3;
    points.visible = false;
    return points;
  }

  /** One faint arc per relation, as bright as the year's applications. */
  private makeArcs(countTex: DataTexture): LineSegments {
    const a: number[] = [], b: number[] = [], rel: number[] = [], t: number[] = [], tint: number[] = [];
    const va = new Vector3(), vb = new Vector3();
    const SEG = 32;
    this.relations.forEach((r, i) => {
      const o = this.places.get(r.origin), d = this.places.get(r.destination);
      if (!o || !d || i >= 512) return;
      lonLatToVec(o.lon, o.lat, 1, va);
      lonLatToVec(d.lon, d.lat, 1, vb);
      const c = ORIGINS[r.origin]?.color ?? [1, 1, 1];
      for (let j = 0; j < SEG; j++) for (const k of [j, j + 1]) {
        a.push(va.x, va.y, va.z); b.push(vb.x, vb.y, vb.z); rel.push(i); t.push(k / SEG); tint.push(...c);
      }
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(a), 3));
    g.setAttribute('dest', new BufferAttribute(new Float32Array(b), 3));
    g.setAttribute('rel', new BufferAttribute(new Float32Array(rel), 1));
    g.setAttribute('t', new BufferAttribute(new Float32Array(t), 1));
    g.setAttribute('tint', new BufferAttribute(new Float32Array(tint), 3));
    const material = new ShaderMaterial({
      uniforms: { uCounts: { value: countTex }, uYear: { value: 0 }, uYears: { value: this.years.length }, uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 dest, tint;
        attribute float rel, t;
        uniform sampler2D uCounts;
        uniform float uYear, uYears;
        varying vec3 vTint;
        varying float vAlpha;
        void main() {
          int y0 = int(floor(uYear)), y1 = min(y0 + 1, int(uYears) - 1);
          float n = mix(texelFetch(uCounts, ivec2(int(rel), y0), 0).r, texelFetch(uCounts, ivec2(int(rel), y1), 0).r, fract(uYear));
          float w = acos(clamp(dot(position, dest), -1.0, 1.0));
          vec3 p = (sin((1.0 - t) * w) * position + sin(t * w) * dest) / max(sin(w), 1e-4);
          p *= 1.0 + (0.012 + 0.09 * w / 3.14159) * sin(3.14159 * t);
          vAlpha = min(1.0, n / 25.0) * smoothstep(-0.1, 0.2, dot(normalize(p), normalize(cameraPosition - p)));
          vTint = tint;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying vec3 vTint;
        varying float vAlpha;
        void main() { gl_FragColor = vec4(vTint * 0.35 * vAlpha * uOpacity, 1.0); }`,
      blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true,
    });
    const lines = new LineSegments(g, material);
    lines.frustumCulled = false;
    lines.renderOrder = 3;
    lines.visible = false;
    return lines;
  }

  /**
   * Asylum applications as particles flowing from the origin to the country where they were
   * lodged: one particle stream per relation, as many particles as the square root of the
   * year's applications allows. Schematic arcs between capitals, not observed journeys.
   */
  private makeFlows(): Points {
    const max = Math.max(...this.relations.flatMap((r) => r.values.map((x) => x ?? 0)));
    const perParticle = Math.sqrt(max) / 110;
    const counts = new Float32Array(512 * this.years.length);
    const a: number[] = [], b: number[] = [], rel: number[] = [], k: number[] = [], phase: number[] = [], color: number[] = [];
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const va = new Vector3(), vb = new Vector3();
    this.relations.forEach((r, i) => {
      const o = this.places.get(r.origin), d = this.places.get(r.destination);
      if (!o || !d || i >= 512) return;
      r.values.forEach((v, y) => { counts[y * 512 + i] = v ? Math.max(1, Math.sqrt(v) / perParticle) : 0; });
      const n = Math.ceil(Math.max(...r.values.map((x) => (x ? Math.sqrt(x) / perParticle : 0))));
      lonLatToVec(o.lon, o.lat, 1, va);
      lonLatToVec(d.lon, d.lat, 1, vb);
      const c = ORIGINS[r.origin]?.color ?? [1, 1, 1];
      for (let j = 0; j < n; j++) {
        a.push(va.x, va.y, va.z); b.push(vb.x, vb.y, vb.z);
        rel.push(i); k.push(j); phase.push(rnd()); color.push(...c);
      }
    });
    const countTex = new DataTexture(counts, 512, this.years.length, RedFormat, FloatType);
    countTex.magFilter = countTex.minFilter = NearestFilter;
    countTex.needsUpdate = true;
    this.arcs = this.makeArcs(countTex);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(a), 3));
    g.setAttribute('dest', new BufferAttribute(new Float32Array(b), 3));
    g.setAttribute('rel', new BufferAttribute(new Float32Array(rel), 1));
    g.setAttribute('k', new BufferAttribute(new Float32Array(k), 1));
    g.setAttribute('phase', new BufferAttribute(new Float32Array(phase), 1));
    g.setAttribute('tint', new BufferAttribute(new Float32Array(color), 3));
    const material = new ShaderMaterial({
      uniforms: { uCounts: { value: countTex }, uYear: { value: 0 }, uYears: { value: this.years.length }, uTime: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
      vertexShader: /* glsl */ `
        attribute vec3 dest, tint;
        attribute float rel, k, phase;
        uniform sampler2D uCounts;
        uniform float uYear, uYears, uTime, uPixelRatio;
        varying vec3 vTint;
        varying float vAlpha;
        void main() {
          int y0 = int(floor(uYear)), y1 = min(y0 + 1, int(uYears) - 1);
          float n = mix(texelFetch(uCounts, ivec2(int(rel), y0), 0).r, texelFetch(uCounts, ivec2(int(rel), y1), 0).r, fract(uYear));
          float w = acos(clamp(dot(position, dest), -1.0, 1.0));
          // Same ground speed on every arc; a little lane spread so streams read as bands.
          float t = fract(phase + uTime * 0.03 / max(w, 0.05));
          vec3 p = (sin((1.0 - t) * w) * position + sin(t * w) * dest) / max(sin(w), 1e-4);
          vec3 side = normalize(cross(position, dest) + 1e-5);
          p += side * (fract(phase * 91.7) - 0.5) * 0.02 * sin(3.14159 * t);
          p *= 1.0 + (0.012 + 0.09 * w / 3.14159) * sin(3.14159 * t);
          vec3 toCam = normalize(cameraPosition - p);
          vAlpha = clamp(n - k, 0.0, 1.0) * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.9, 1.0, t))
            * smoothstep(-0.1, 0.2, dot(normalize(p), toCam));
          vTint = tint;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (vAlpha > 0.0 ? clamp(9.0 / -mv.z, 2.4, 6.0) : 0.0) * uPixelRatio;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying vec3 vTint;
        varying float vAlpha;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          gl_FragColor = vec4(vTint * exp(-r * r * 3.0) * 2.4 * vAlpha * uOpacity, 1.0);
        }`,
      blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true,
    });
    const points = new Points(g, material);
    points.frustumCulled = false;
    points.renderOrder = 4;
    points.visible = false;
    return points;
  }
}
