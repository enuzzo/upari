import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat, RepeatWrapping, Texture, TextureLoader, ClampToEdgeWrapping } from 'three';
import { PALETTES, paletteTexture, type Stop } from './palettes';
import { t } from '../i18n';
import { num } from '../i18n/format';
import { fresh } from './fresh';

export type DataId = 'chlorophyll' | 'sst' | 'anomaly' | 'rain' | 'ice' | 'ndvi' | 'aerosol' | 'coral' | 'forest'
  | 'ozone' | 'no2' | 'snow' | 'so2' | 'aurora' | 'ships' | 'built' | 'sealevel' | 'waves' | 'mangroves' | 'bii' | 'nightlights' | 'ims' | 'lightning' | 'mhw' | 'odiac' | 'acid';

export interface LayerMeta {
  id: string;
  width: number;
  height: number;
  unit: string;
  scale: string;
  min: number;
  max: number;
  dates?: string[];
  source?: string;
  /** A time series: each frame is a value image, with its coverage apart when `conf` is set. */
  frames?: { file: string; time: string; conf?: string; km2?: number }[];
  cadence?: 'hour' | 'day' | 'month' | 'year';
}

export interface DataDef {
  palette: Stop[];
  /** x: lit by the sun, y: glow (emissive), z: mask (0 any, 1 ocean, 2 land), w: drawn above clouds. */
  style: [number, number, number, number];
  /** Surface effect: 1 draws rain as falling streaks, 2 forest loss by year, 3 aurora (only in the dark). */
  fx?: number;
  /** Frames per second of a series, and seconds to rest on the last frame. */
  fps?: number;
  hold?: number;
  decode: (v: number, m: LayerMeta) => number;
  format: (x: number) => string;
}

const lin = (v: number, m: LayerMeta) => m.min + v * (m.max - m.min);

export const DATA: Record<DataId, DataDef> = {
  chlorophyll: {
    palette: PALETTES.chlorophyll, style: [0.35, 0.9, 1, 0], fps: 0.9, hold: 2.5,
    decode: (v, m) => Math.pow(10, lin(v, m)),
    format: (x) => `${num(x, x < 1 ? 2 : 1)} mg/m³`,
  },
  sst: {
    palette: PALETTES.sst, style: [0.55, 0.12, 1, 0], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => `${num(x, 1)} °C`,
  },
  anomaly: {
    palette: PALETTES.anomaly, style: [0.25, 0.6, 1, 0], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => t.data.anomaly(`${x > 0 ? '+' : x < 0 ? '−' : ''}${num(Math.abs(x), 1)}`),
  },
  rain: {
    palette: PALETTES.rain, style: [0.0, 0.3, 0, 1], fx: 1,
    decode: (v) => Math.pow(10, v * Math.log10(51)) - 1,
    format: (x) => (x < 0.1 ? t.data.rainTrace : t.data.rain(num(x, 1))),
  },
  ice: {
    palette: PALETTES.ice, style: [0.8, 0.05, 1, 0], fps: 1.8, hold: 2.5,
    decode: lin, format: (x) => t.data.ice(num(x)),
  },
  ndvi: {
    palette: PALETTES.ndvi, style: [0.6, 0.15, 2, 0], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => (x < 0.15 ? t.data.bare : t.data.ndvi(num(x, 2))),
  },
  coral: {
    palette: PALETTES.coral, style: [0.35, 0.5, 1, 0], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => (x < 1 ? t.data.noStress : t.data.coral(num(x, 1))),
  },
  forest: {
    palette: PALETTES.forest, style: [0.5, 0.35, 2, 0], fx: 2,
    decode: (v) => 2000 + Math.round(v * 25.5), format: (x) => t.data.forest(x),
  },
  aerosol: {
    palette: PALETTES.aerosol, style: [0.2, 0.08, 0, 1], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => t.data.aerosol(num(x, 2)),
  },
  ozone: {
    palette: PALETTES.ozone, style: [0.35, 0.3, 0, 1], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => t.data.ozone(num(x)),
  },
  no2: {
    palette: PALETTES.no2, style: [0.15, 0.9, 0, 1], fps: 0.9, hold: 2.5,
    decode: (v, m) => Math.pow(10, lin(v, m)), format: (x) => t.data.no2(num(x / 1e15, 1)),
  },
  snow: {
    palette: PALETTES.snow, style: [0.95, 0.04, 2, 0], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => (x < 5 ? t.data.noSnow : t.data.snow(num(x))),
  },
  mhw: {
    // Categories of Hobday et al.: 0 none, then 1 moderate ... 4 extreme, as quarters.
    palette: PALETTES.mhw, style: [0.2, 0.6, 1, 0],
    decode: (v) => Math.round(v * 4), format: (x) => t.data.mhw[Math.max(0, Math.min(4, x))],
  },
  odiac: {
    // log10(1 + tonnes of CO2 per km² per year) over log10(1 + max).
    palette: PALETTES.odiac, style: [0.0, 1.0, 2, 0], fps: 0.5, hold: 3,
    decode: (v, m) => Math.pow(1 + m.max, v) - 1, format: (x) => (x < 1 ? t.data.odiacNone : t.data.odiac(num(x, x < 100 ? 1 : 0))),
  },
  lightning: {
    // log10(1 + flashes per km² per year) over log10(151).
    palette: PALETTES.lightning, style: [0.0, 0.45, 0, 0],
    decode: (v) => Math.pow(151, v) - 1, format: (x) => t.data.lightning(num(x, x < 10 ? 1 : 0)),
  },
  ims: {
    // Classes, not amounts: 0 open land or sea, 0.5 sea ice, 1 snow.
    palette: PALETTES.ims, style: [0.6, 0.15, 0, 0],
    decode: lin, format: (x) => (x > 0.75 ? t.data.imsSnow : x > 0.25 ? t.data.imsIce : t.data.imsNone),
  },
  so2: {
    palette: PALETTES.so2, style: [0.1, 1.0, 0, 1],
    decode: lin, format: (x) => t.data.so2(num(x, 1)),
  },
  sealevel: {
    palette: PALETTES.sealevel, style: [0.4, 0.3, 1, 0], fps: 0.9, hold: 2.5,
    decode: lin, format: (x) => t.data.sealevel(`${x > 0 ? '+' : x < 0 ? '−' : ''}${num(Math.abs(x * 100))}`),
  },
  waves: {
    palette: PALETTES.waves, style: [0.5, 0.2, 1, 0], fps: 3, hold: 1.5,
    decode: lin, format: (x) => t.data.waves(num(x, 1)),
  },
  ships: {
    palette: PALETTES.ships, style: [0.0, 0.55, 1, 0],
    // log10 of the AIS positions in a cell over six years: told in words, not as a count.
    decode: lin, format: (x) => (x < 3 ? t.data.shipsLow : x < 5 ? t.data.shipsMid : t.data.shipsHigh),
  },
  built: {
    palette: PALETTES.built, style: [0.0, 1.0, 2, 0], fps: 0.8, hold: 3,
    decode: (v) => v * v * 100, format: (x) => (x < 1 ? t.data.notBuilt : t.data.built(num(x))),
  },
  mangroves: {
    // Square root of the mangrove share of each 0.05° cell, like the built-up land.
    palette: PALETTES.mangroves, style: [0.0, 1.0, 0, 0], fps: 0.7, hold: 3,
    decode: (v) => v * v * 100, format: (x) => (x < 1 ? t.data.noMangroves : t.data.mangroves(num(x))),
  },
  nightlights: {
    // Square root of the brightness (0..63): towns stay visible next to the megacities.
    palette: PALETTES.nightlights, style: [0.0, 1.0, 0, 0], fps: 0.9, hold: 3,
    decode: (v) => v * v * 63, format: (x) => (x < 4 ? t.data.dark : t.data.nightlights(num(x))),
  },
  acid: {
    // Surface pH on the total scale, 7.94..8.18, a yearly mean every four years.
    palette: PALETTES.acid, style: [0.3, 0.5, 1, 0], fps: 0.9, hold: 3,
    decode: (v) => 7.94 + v * 0.24, format: (x) => t.data.acid(num(x, 2)),
  },
  bii: {
    palette: PALETTES.bii, style: [0.35, 0.55, 2, 0], fps: 0.5, hold: 3,
    decode: (v) => v * 100, format: (x) => t.data.bii(num(x)),
  },
  aurora: {
    // The curtains (aurora.ts) carry the light; on the ground only a faint footprint.
    palette: PALETTES.aurora, style: [0.0, 0.25, 0, 1], fx: 3,
    decode: lin, format: (x) => t.data.aurora(num(x)),
  },
};

const loader = new TextureLoader();

export function loadTexture(url: string, opts: { mipmaps?: boolean; repeat?: boolean; anisotropy?: number } = {}): Promise<Texture> {
  return new Promise((resolve, reject) => {
    loader.load(url, (t) => {
      t.wrapS = opts.repeat === false ? ClampToEdgeWrapping : RepeatWrapping;
      t.wrapT = ClampToEdgeWrapping;
      t.generateMipmaps = opts.mipmaps !== false;
      t.minFilter = t.generateMipmaps ? LinearMipmapLinearFilter : LinearFilter;
      t.magFilter = LinearFilter;
      t.anisotropy = opts.anisotropy ?? 1;
      t.needsUpdate = true;
      resolve(t);
    }, undefined, reject);
  });
}

/** A large image decoded off the main thread (flipped here: WebGL ignores flipY for bitmaps). */
export async function loadBitmapTexture(url: string, anisotropy = 1): Promise<Texture> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const bmp = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const t = new Texture(bmp);
  t.flipY = false;
  t.wrapS = RepeatWrapping;
  t.wrapT = ClampToEdgeWrapping;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

/** CPU copy of a layer at reduced resolution, for the probe under the cursor. */
/** A value image and its coverage image read together, like a two-channel layer. */
export class SplitSampler {
  constructor(private value: Sampler, private conf: Sampler) {}
  read(lon: number, lat: number): [number, number, number] {
    return [this.value.read(lon, lat)[0], this.conf.read(lon, lat)[0], 0];
  }
}

export class Sampler {
  constructor(private data: Uint8ClampedArray, private w: number, private h: number) {}

  static fromImage(img: CanvasImageSource & { width: number; height: number }, w = 1440): Sampler {
    const h = Math.round(w / 2);
    const c = new OffscreenCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    return new Sampler(ctx.getImageData(0, 0, w, h).data, w, h);
  }

  /** Bilinear read of channel values (0..1) at a geographic position. */
  read(lon: number, lat: number): [number, number, number] {
    const fx = ((lon + 180) / 360) * this.w - 0.5, fy = ((90 - lat) / 180) * this.h - 0.5;
    const x0 = Math.floor(fx), y0 = Math.max(0, Math.min(this.h - 1, Math.floor(fy)));
    const x1 = x0 + 1, y1 = Math.min(this.h - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
    const px = (x: number, y: number, c: number) => this.data[(y * this.w + ((x % this.w) + this.w) % this.w) * 4 + c] / 255;
    const out: [number, number, number] = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      out[c] = (px(x0, y0, c) * (1 - tx) + px(x1, y0, c) * tx) * (1 - ty) + (px(x0, y1, c) * (1 - tx) + px(x1, y1, c) * tx) * ty;
    }
    return out;
  }
}

export class LayerStore {
  private cache = new Map<string, Promise<{ tex: Texture[]; conf: Texture[] | null; meta: LayerMeta; sampler: (Sampler | SplitSampler)[] }>>();
  readonly palettes = new Map<DataId, Texture>();

  palette(id: DataId): Texture {
    let p = this.palettes.get(id);
    if (!p) { p = paletteTexture(DATA[id].palette); this.palettes.set(id, p); }
    return p;
  }

  get(id: DataId) {
    let p = this.cache.get(id);
    if (!p) {
      p = id === 'aurora' ? this.aurora() : (async () => {
        const meta: LayerMeta = await (await fetch(fresh(`layers/${id}.json`))).json();
        const files = meta.frames ? meta.frames.map((f) => f.file) : [`${id}.png`];
        const split = !!meta.frames?.[0]?.conf;
        const [tex, conf] = await Promise.all([
          Promise.all(files.map((f) => loadTexture(`layers/${f}`))),
          split ? Promise.all(meta.frames!.map((f) => loadTexture(`layers/${f.conf}`, { mipmaps: false }))) : Promise.resolve(null),
        ]);
        const w = meta.frames ? 720 : 1440;
        const sampler = tex.map((t, i) => {
          const s = Sampler.fromImage(t.image as HTMLImageElement, w);
          return conf ? new SplitSampler(s, Sampler.fromImage(conf[i].image as HTMLImageElement, w)) : s;
        });
        if (meta.frames && !meta.width) {
          const first = await (await fetch(`layers/${files[0].replace('.png', '.json')}`)).json().catch(() => null);
          if (first) { meta.width = first.width; meta.height = first.height; }
        }
        return { tex, conf, meta, sampler };
      })();
      // A failed download must not poison the cache: the next request retries.
      p.catch(() => { if (this.cache.get(id) === p) this.cache.delete(id); });
      this.cache.set(id, p);
    }
    return p;
  }

  /**
   * The aurora changes within the hour: ask NOAA for the newest forecast (a public service
   * with no cookies), and fall back to the copy of this morning when it does not answer.
   */
  private async aurora() {
    const meta: LayerMeta & { kp?: { now: number; max24h: number } | null } = await (await fetch(fresh('layers/aurora.json'))).json();
    try {
      const res = await fetch('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json', { signal: AbortSignal.timeout(8000), credentials: 'omit', referrerPolicy: 'no-referrer' });
      const d = await res.json() as { 'Forecast Time': string; coordinates: [number, number, number][] };
      const W = 360, H = 181, c = new OffscreenCanvas(W, H), ctx = c.getContext('2d')!;
      // North up for the probe; south first for the texture (data textures start at the bottom).
      const img = ctx.createImageData(W, H), rows = new Uint8Array(W * H * 4);
      for (const [lon, lat, v] of d.coordinates) {
        const x = (Math.round(lon) + 180) % 360, y = 90 - Math.round(lat);
        if (y < 0 || y >= H) continue;
        const r = Math.round(Math.min(1, v / 50) * 255);
        for (const [buf, k] of [[img.data, (y * W + x) * 4], [rows, ((H - 1 - y) * W + x) * 4]] as const) { buf[k] = r; buf[k + 1] = 255; buf[k + 3] = 255; }
      }
      ctx.putImageData(img, 0, 0);
      const tex = new DataTexture(rows, W, H, RGBAFormat);
      tex.wrapS = RepeatWrapping; tex.wrapT = ClampToEdgeWrapping; tex.minFilter = tex.magFilter = LinearFilter;
      tex.needsUpdate = true;
      const sc = c;
      meta.dates = [d['Forecast Time']];
      return { tex: [tex as Texture], conf: null, meta: { ...meta, width: W, height: H }, sampler: [Sampler.fromImage(sc, W)] };
    } catch {
      const tex = await loadTexture('layers/aurora.png', { mipmaps: false });
      return { tex: [tex], conf: null, meta, sampler: [Sampler.fromImage(tex.image as HTMLImageElement, 360)] };
    }
  }
}
