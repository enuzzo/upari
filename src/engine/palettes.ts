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
  // Rain like a weather radar: drizzle a thin blue, downpours warm. No white, so it never reads as cloud.
  rain: [
    [0.0, '#1d4fa6', 0.0],
    [0.05, '#2560c4', 0.38],
    [0.18, '#2c86ec', 0.72],
    [0.34, '#36bff7', 0.92],
    [0.5, '#5fe3c8', 1],
    [0.64, '#f4d35e', 1],
    [0.8, '#ff8a3d', 1],
    [1.0, '#ff3f7f', 1],
  ],
  // Vegetation: bare ground stays dark, green deepens with the leaves.
  ndvi: [
    [0.0, '#2a2216', 0.0],
    [0.18, '#5a4a2c', 0.5],
    [0.32, '#8a8a3a', 0.85],
    [0.5, '#6fae3c', 1],
    [0.7, '#2f9e44', 1],
    [0.88, '#127a3a', 1],
    [1.0, '#0b5a2e', 1],
  ],
  // Aerosols: clear air invisible, dust and smoke as a warm veil.
  aerosol: [
    [0.0, '#e8d5b0', 0.0],
    [0.16, '#e8d5b0', 0.0],
    [0.3, '#f0c27a', 0.42],
    [0.5, '#e8904a', 0.72],
    [0.75, '#c8553a', 0.9],
    [1.0, '#8a2a2a', 1],
  ],
  // Coral heat stress (Degree Heating Weeks): from 4 bleaching is likely, from 8 corals die.
  coral: [
    [0.0, '#20304a', 0.0],
    [0.05, '#3a4f6e', 0.35],
    [0.2, '#f2c46b', 0.9],
    [0.4, '#f07a3a', 1],
    [0.6, '#d8343f', 1],
    [1.0, '#ff4fa8', 1],
  ],
  forest: [[0, '#521210'], [0.5, '#a2321c'], [1, '#ff6a2a']],
  // Ozone (Dobson units, 100–500): the hole a deep violet glow, the normal layer a quiet sea-glass.
  ozone: [
    [0.0, '#2a0a5e', 0.95],
    [0.18, '#5b2ca8', 0.95],
    [0.28, '#a35ee8', 0.9],
    [0.34, '#3f6f9e', 0.7],
    [0.5, '#6aa6b0', 0.55],
    [0.68, '#e7d29a', 0.65],
    [1.0, '#f28c4f', 0.85],
  ],
  // Nitrogen dioxide: clean air invisible, exhaust as embers over cities and roads.
  no2: [
    [0.0, '#3b1f0f', 0.0],
    [0.28, '#6b3a1a', 0.0],
    [0.42, '#b5562a', 0.45],
    [0.6, '#f08a3c', 0.8],
    [0.8, '#ffc46b', 1],
    [1.0, '#fff1c9', 1],
  ],
  snow: [
    [0.0, '#ffffff', 0.0],
    [0.06, '#e3eeff', 0.0],
    [0.15, '#e8f2ff', 0.45],
    [0.5, '#f4f9ff', 0.85],
    [1.0, '#ffffff', 1],
  ],
  // Sulphur dioxide: volcanic breath, sulphur yellow to red.
  so2: [
    [0.0, '#ffe066', 0.0],
    [0.1, '#ffe066', 0.0],
    [0.22, '#f7b32b', 0.6],
    [0.5, '#e8590c', 0.9],
    [1.0, '#c2255c', 1],
  ],
  // Sea level anomaly: lower seas in deep blue, higher seas warm (centre transparent).
  sealevel: [
    [0.0, '#3b6fd6', 1],
    [0.25, '#5b8fe0', 0.85],
    [0.42, '#9cc1f0', 0.4],
    [0.5, '#9aa7b8', 0.18],
    [0.58, '#f5c48a', 0.4],
    [0.75, '#f08a4b', 0.85],
    [1.0, '#e0475b', 1],
  ],
  // Waves: calm seas stay dark, storm seas foam white, the highest turn amber.
  waves: [
    [0.0, '#0b3d5c', 0.0],
    [0.12, '#1d6f8f', 0.0],
    [0.22, '#2f8fae', 0.4],
    [0.35, '#7cc8dc', 0.75],
    [0.5, '#e6f7fb', 0.95],
    [0.75, '#ffffff', 1],
    [1.0, '#ffd27a', 1],
  ],
  // Shipping lanes: gold threads on the dark sea.
  ships: [
    [0.0, '#ffd58a', 0.0],
    [0.3, '#ffd58a', 0.0],
    [0.45, '#ffb35c', 0.35],
    [0.62, '#ffd27a', 0.7],
    [0.8, '#fff0c2', 0.95],
    [1.0, '#ffffff', 1],
  ],
  // Built-up land (square root of the share): villages faint, cities white-hot.
  built: [
    [0.0, '#ffcf7a', 0.0],
    [0.08, '#ffcf7a', 0.0],
    [0.18, '#ff9f4a', 0.45],
    [0.4, '#ffc46b', 0.85],
    [0.7, '#fff0c9', 1],
    [1.0, '#ffffff', 1],
  ],
  // Marine heatwave categories (Hobday et al.): moderate, strong, severe, extreme.
  mhw: [
    [0.0, '#ffd27a', 0.0],
    [0.12, '#ffd27a', 0.0],
    [0.2, '#ffd27a', 0.7],
    [0.375, '#ffd27a', 0.7],
    [0.45, '#ff8a3d', 0.85],
    [0.625, '#ff8a3d', 0.85],
    [0.7, '#ff3d2e', 0.92],
    [0.875, '#ff3d2e', 0.92],
    [0.95, '#d1004f', 1],
    [1.0, '#d1004f', 1],
  ],
  // Surface pH: deep blue where the sea is most basic, amber where it has turned most acidic.
  acid: [
    [0.0, '#ff5a2a', 0.95],
    [0.3, '#ffb347', 0.92],
    [0.5, '#35a9b5', 0.9],
    [0.75, '#2a6fd0', 0.9],
    [1.0, '#1b3a9a', 0.9],
  ],
  // Fossil CO2 per km² (log): a dull ember where little is burnt, white-hot in the cities.
  odiac: [
    [0.0, '#7a1c08', 0.0],
    [0.12, '#7a1c08', 0.0],
    [0.3, '#b3360f', 0.55],
    [0.55, '#ff6a2a', 0.85],
    [0.8, '#ffc46b', 1],
    [1.0, '#fff4dc', 1],
  ],
  // Lightning per km² per year: violet where it is rare, electric white where it never stops.
  lightning: [
    [0.0, '#4a2fb8', 0.0],
    [0.2, '#4a2fb8', 0.0],
    [0.38, '#5a3ccc', 0.28],
    [0.6, '#7c5ee6', 0.45],
    [0.82, '#b7a2ff', 0.62],
    [1.0, '#efe8ff', 0.8],
  ],
  // Snow and sea ice of the northern hemisphere (IMS): classes, ice a glacier blue, snow white.
  ims: [
    [0.0, '#ffffff', 0.0],
    [0.3, '#ffffff', 0.0],
    [0.38, '#9fd8ff', 0.85],
    [0.62, '#9fd8ff', 0.85],
    [0.7, '#ffffff', 0.95],
    [1.0, '#ffffff', 0.95],
  ],
  // Night lights (square root of the brightness): sodium orange, white at the core of cities.
  nightlights: [
    [0.0, '#ffb35c', 0.0],
    [0.22, '#ffb35c', 0.0],
    [0.34, '#ff9a3c', 0.55],
    [0.55, '#ffc46b', 0.9],
    [0.8, '#fff0c9', 1],
    [1.0, '#ffffff', 1],
  ],
  // Mangroves (square root of the share): thin fringes a faint green, dense forests bright.
  mangroves: [
    [0.0, '#5dffa0', 0.0],
    [0.06, '#5dffa0', 0.0],
    [0.15, '#2fd27a', 0.55],
    [0.4, '#5dffa0', 0.9],
    [0.75, '#c8ffd9', 1],
    [1.0, '#ffffff', 1],
  ],
  // Biodiversity intactness: what is left of the original wildlife, ember to deep green.
  bii: [
    [0.0, '#7a2a12', 0.92],
    [0.35, '#c4602a', 0.88],
    [0.55, '#e0a64e', 0.8],
    [0.72, '#c9c46a', 0.55],
    [0.86, '#6fae5a', 0.32],
    [1.0, '#2f8f4a', 0.22],
  ],
  // Aurora: oxygen green, red at the top of the strongest ones.
  // Only a faint green footprint on the ground: the curtains above carry the light.
  aurora: [
    [0.0, '#1aff8c', 0.0],
    [0.25, '#1aff8c', 0.0],
    [0.45, '#2bff9a', 0.03],
    [0.75, '#4dffa0', 0.06],
    [1.0, '#7dffb0', 0.08],
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
