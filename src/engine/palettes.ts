import { DataTexture, LinearFilter, RGBAFormat, ClampToEdgeWrapping } from 'three';

/** A colour stop: position 0..1, sRGB hex, opacity. */
export type Stop = [number, string, number?];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

export function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)];
}

/** CSS gradient for legends, drawn from the same stops as the GPU palette. */
export function cssGradient(stops: Stop[], dir = 'to right'): string {
  return `linear-gradient(${dir}, ${stops.map(([p, hex, a = 1]) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(a, 0.15)}) ${(p * 100).toFixed(1)}%`;
  }).join(', ')})`;
}

export function paletteTexture(stops: Stop[]): DataTexture {
  const W = 256, data = new Uint8Array(W * 4);
  for (let i = 0; i < W; i++) {
    const x = i / (W - 1);
    let k = 0;
    while (k < stops.length - 2 && x > stops[k + 1][0]) k++;
    const [p0, h0, a0 = 1] = stops[k], [p1, h1, a1 = 1] = stops[k + 1];
    const t = Math.max(0, Math.min(1, (x - p0) / Math.max(p1 - p0, 1e-6)));
    const s = t * t * (3 - 2 * t);
    const c0 = hexToLinear(h0), c1 = hexToLinear(h1);
    // Store linear colour with a gentle sqrt encoding to keep precision in darks.
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(Math.sqrt(c0[c] + (c1[c] - c0[c]) * s) * 255);
    data[i * 4 + 3] = Math.round((a0 + (a1 - a0) * s) * 255);
  }
  const tex = new DataTexture(data, W, 1, RGBAFormat);
  tex.magFilter = tex.minFilter = LinearFilter;
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export const PALETTES: Record<string, Stop[]> = {
  // Living ocean: phytoplankton as bioluminescence.
  chlorophyll: [
    [0.0, '#061a3a', 0.0],
    [0.28, '#0a3d6b', 0.35],
    [0.45, '#0f7f8c', 0.85],
    [0.6, '#22c3a0', 1],
    [0.74, '#8ef08a', 1],
    [0.88, '#e8ff9c', 1],
    [1.0, '#fffbe0', 1],
  ],
  // Sea temperature: polar ink to tropical ember.
  sst: [
    [0.0, '#1a1446', 1],
    [0.15, '#22307a', 1],
    [0.32, '#1f6fa8', 1],
    [0.48, '#35b5b0', 1],
    [0.62, '#b9df8e', 1],
    [0.74, '#f6d26b', 1],
    [0.86, '#f2873c', 1],
    [0.95, '#d63a3a', 1],
    [1.0, '#9e1a4f', 1],
  ],
  // Anomaly: only the departures from normal light up.
  anomaly: [
    [0.0, '#9fdcff', 1],
    [0.14, '#4f9bff', 1],
    [0.28, '#2a5fc4', 1],
    [0.4, '#1a2d5e', 1],
    [0.5, '#0b1220', 1],
    [0.6, '#5a2016', 1],
    [0.72, '#b83a26', 1],
    [0.86, '#f0702e', 1],
    [1.0, '#ffd27a', 1],
  ],
  rain: [
    [0.0, '#3a7bd5', 0.0],
    [0.08, '#3a8ee8', 0.45],
    [0.25, '#2fd4ff', 0.9],
    [0.45, '#b9fbff', 1],
    [0.65, '#ffffff', 1],
    [0.82, '#ff9ef0', 1],
    [1.0, '#ff4fd8', 1],
  ],
  ice: [
    [0.0, '#cfe8ff', 0.0],
    [0.15, '#d8eeff', 0.35],
    [0.6, '#eef8ff', 0.85],
    [1.0, '#ffffff', 1],
  ],
};

export const FLOW_COLORS = {
  wind: [hexToLinear('#22406e'), hexToLinear('#4f86c6'), hexToLinear('#bfe0ff'), hexToLinear('#ffe0a0'), hexToLinear('#ff8c52')],
  currents: [hexToLinear('#1f5f7a'), hexToLinear('#4ad1d1'), hexToLinear('#b8fff0'), hexToLinear('#ffffff'), hexToLinear('#fff3c4')],
} as const;
