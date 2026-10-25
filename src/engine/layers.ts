import { LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, Texture, TextureLoader, ClampToEdgeWrapping } from 'three';
import { PALETTES, paletteTexture, type Stop } from './palettes';

export type DataId = 'chlorophyll' | 'sst' | 'anomaly' | 'rain' | 'ice';

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
  frames?: { file: string; time: string }[];
}

export interface DataDef {
  palette: Stop[];
  /** x: lit by the sun, y: glow (emissive), z: mask (0 any, 1 ocean, 2 land), w: drawn above clouds. */
  style: [number, number, number, number];
  /** Surface effect: 1 draws rain as falling streaks. */
  fx?: number;
  decode: (v: number, m: LayerMeta) => number;
  format: (x: number) => string;
}

const lin = (v: number, m: LayerMeta) => m.min + v * (m.max - m.min);
const nf = (d: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: d, minimumFractionDigits: d });

export const DATA: Record<DataId, DataDef> = {
  chlorophyll: {
    palette: PALETTES.chlorophyll, style: [0.35, 0.9, 1, 0],
    decode: (v, m) => Math.pow(10, lin(v, m)),
    format: (x) => `${nf(x < 1 ? 2 : 1).format(x)} mg/m³`,
  },
  sst: {
    palette: PALETTES.sst, style: [0.55, 0.12, 1, 0],
    decode: lin, format: (x) => `${nf(1).format(x)} °C`,
  },
  anomaly: {
    palette: PALETTES.anomaly, style: [0.25, 0.6, 1, 0],
    decode: lin, format: (x) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${nf(1).format(Math.abs(x))} °C rispetto al normale`,
  },
  rain: {
    palette: PALETTES.rain, style: [0.0, 0.3, 0, 1], fx: 1,
    decode: (v) => Math.pow(10, v * Math.log10(51)) - 1,
    format: (x) => (x < 0.1 ? 'pioggia appena percettibile' : `${nf(1).format(x)} mm di pioggia all’ora`),
  },
  ice: {
    palette: PALETTES.ice, style: [0.8, 0.05, 1, 0],
    decode: lin, format: (x) => `ghiaccio al ${Math.round(x)}%`,
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

/** CPU copy of a layer at reduced resolution, for the probe under the cursor. */
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
  private cache = new Map<string, Promise<{ tex: Texture[]; meta: LayerMeta; sampler: Sampler[] }>>();
  readonly palettes = new Map<DataId, Texture>();

  palette(id: DataId): Texture {
    let p = this.palettes.get(id);
    if (!p) { p = paletteTexture(DATA[id].palette); this.palettes.set(id, p); }
    return p;
  }

  get(id: DataId) {
    let p = this.cache.get(id);
    if (!p) {
      p = (async () => {
        const meta: LayerMeta = await (await fetch(`layers/${id}.json`)).json();
        const files = meta.frames ? meta.frames.map((f) => f.file) : [`${id}.png`];
        const tex = await Promise.all(files.map((f) => loadTexture(`layers/${f}`)));
        const sampler = tex.map((t) => Sampler.fromImage(t.image as HTMLImageElement, meta.frames ? 720 : 1440));
        if (meta.frames) {
          const first = await (await fetch(`layers/${files[0].replace('.png', '.json')}`)).json().catch(() => null);
          if (first) { meta.width = first.width; meta.height = first.height; }
        }
        return { tex, meta, sampler };
      })();
      // A failed download must not poison the cache: the next request retries.
      p.catch(() => { if (this.cache.get(id) === p) this.cache.delete(id); });
      this.cache.set(id, p);
    }
    return p;
  }
}
