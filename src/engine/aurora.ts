import { AdditiveBlending, BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector3, DoubleSide } from 'three';
import { lonLatToVec } from './astro';
import { noiseGLSL } from './glsl';

// The aurora as curtains of light standing on the oval that NOAA's OVATION model forecasts for
// the next half hour. Where and how bright come from the data: a quiet day gives a few faint
// curtains, a storm a wide, bright band. The shape and the colours come from the physics:
// several nested ribbons follow the oval, folding sideways and brightening and dimming slowly,
// each standing upright from about 95 km to 300 km (with the atmosphere's 1.6 thickening); along
// the height a thin pink-magenta fringe at the bottom (nitrogen, 90-100 km), the green of oxygen
// at 557.7 nm as the body (100-200 km), and a faint deep red above (oxygen at 630 nm) that fades
// to nothing. Seen edge-on the sheets would add up to hard lines, so their light follows how much
// of their face the camera sees; a soft footprint glows across the band beneath them, and fine
// rays run up each curtain. Only the night side shows them, and the planet hides the far side.
// The ribbon idea (upright tube strips with a vertical fade and seamless noise along the ring)
// comes from the CodePen "[Three.js] Aurora ribbons" (see THIRD_PARTY_NOTICES.md); the code is ours.

const R_EARTH_KM = 6371, THICK = 1.6;
const BOTTOM = 1 + (95 * THICK) / R_EARTH_KM, TOP = 1 + (300 * THICK) / R_EARTH_KM, VEIL = 1 + (108 * THICK) / R_EARTH_KM;
const N = 720;

/** read(lon, lat) → probability 0..1 of seeing an aurora there (the OVATION grid). */
export function createAuroraCurtains(read: (lon: number, lat: number) => number) {
  const pos: number[] = [], attr: number[] = [], nrm: number[] = [], index: number[] = [];
  const veilPos: number[] = [], veilAttr: number[] = [], veilIndex: number[] = [];
  const v = new Vector3(), a = new Vector3(), b = new Vector3(), up = new Vector3(), n = new Vector3();
  for (const north of [true, false]) {
    // Along the oval, for every half degree of longitude: where the aurora is strongest, how
    // likely, and how wide the band is there.
    const ring: { lat: number; p: number; w: number }[] = [];
    for (let i = 0; i < N; i++) {
      const lon = -180 + i * 0.5;
      let best = 0, sumW = 0, sumLat = 0, sumLat2 = 0;
      for (let k = 0; k <= 40; k++) {
        const lat = (north ? 1 : -1) * (48 + k);
        const p = read(lon, lat);
        if (p > best) best = p;
        if (p > 0.08) { sumW += p * p; sumLat += lat * p * p; sumLat2 += lat * lat * p * p; }
      }
      const mean = sumW ? sumLat / sumW : (north ? 67 : -67);
      const spread = sumW ? Math.sqrt(Math.max(0, sumLat2 / sumW - mean * mean)) : 2;
      ring.push({ lat: mean, p: best, w: Math.min(7, Math.max(2, spread * 1.4)) });
    }
    // A low-pass along the oval (about ±8°, twice): the forecast grid is coarse, and its steps
    // would zigzag the curtains.
    const blur = (src: { lat: number; p: number; w: number }[]) => src.map((_, i) => {
      let lat = 0, p = 0, w = 0, m = 0;
      for (let k = -16; k <= 16; k++) { const r = src[(i + k + N) % N], g = Math.exp(-(k * k) / 128); lat += r.lat * g; p += r.p * g; w += r.w * g; m += g; }
      return { lat: lat / m, p: p / m, w: w / m };
    });
    const smooth = blur(blur(ring));
    // Five ribbons across the band, the middle ones brightest. Each folds sideways with a few
    // waves of its own (whole numbers of them around the oval, so there is no seam).
    const RIBBONS: [number, number][] = [[-0.62, 0.45], [-0.3, 0.8], [0, 1], [0.32, 0.75], [0.64, 0.4]];
    RIBBONS.forEach(([offset, weight], ri) => {
      const waves = [[3 + ri, 0.22, ri * 1.7], [7 + ri * 2, 0.12, ri * 0.9 + 2], [17 + ri, 0.05, ri * 2.3 + 1]];
      const lats = smooth.map((r, i) => {
        const t = (i / N) * Math.PI * 2;
        const fold = waves.reduce((s, [k, amp, ph]) => s + Math.sin(t * k + ph) * amp, 0);
        return r.lat + (offset + fold) * r.w * Math.sign(r.lat);
      });
      // Closed loops with a doubled first vertex at the end, so the place along the oval runs
      // 0..1 without jumping back inside a quad (that jump drew a hard cut in the light).
      const base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const j = i % N, lon = -180 + i * 0.5;
        // The sheet's face: across the oval, horizontal (radial × along).
        lonLatToVec(lon - 0.5, lats[(j - 1 + N) % N], 1, a);
        lonLatToVec(lon + 0.5, lats[(j + 1) % N], 1, b);
        lonLatToVec(lon, lats[j], 1, up);
        n.subVectors(b, a).cross(up).normalize();
        for (const [h, top] of [[BOTTOM, 0], [TOP, 1]] as const) {
          lonLatToVec(lon, lats[j], h, v);
          pos.push(v.x, v.y, v.z);
          nrm.push(n.x, n.y, n.z);
          // Which ribbon (whole part) and where along the oval (fraction 0..1).
          attr.push(smooth[j].p * weight, top, ri + (i / N) * 0.999);
        }
      }
      for (let i = 0; i < N; i++) {
        const p = base + i * 2, q = base + (i + 1) * 2;
        index.push(p, q, p + 1, q, q + 1, p + 1);
      }
    });
    // The footprint: a soft glow across the band just above the curtains' lower edge, what
    // makes the aurora read as light and not as lines when seen from above.
    const ACROSS = 9, vbase = veilPos.length / 3;
    for (let i = 0; i <= N; i++) {
      const j = i % N, lon = -180 + i * 0.5, r = smooth[j];
      for (let k = 0; k < ACROSS; k++) {
        const u = (k / (ACROSS - 1)) * 2 - 1;
        lonLatToVec(lon, r.lat + u * r.w * 1.35 * Math.sign(r.lat), VEIL, v);
        veilPos.push(v.x, v.y, v.z);
        veilAttr.push(r.p, u, (i / N) * 0.999);
      }
    }
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < ACROSS - 1; k++) {
        const p = vbase + i * ACROSS + k, q = vbase + (i + 1) * ACROSS + k;
        veilIndex.push(p, q, p + 1, q, q + 1, p + 1);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(nrm), 3));
  geo.setAttribute('aur', new BufferAttribute(new Float32Array(attr), 3));
  geo.setIndex(index);
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uSun: { value: new Vector3(1, 0, 0) } };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aur; // strength, height along the curtain (0 bottom, 1 top), place along the oval
      varying vec3 vAur; varying vec3 vPos; varying float vFace;
      void main() {
        vAur = aur; vPos = position;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec3 view = normalize(cameraPosition - world.xyz);
        vFace = abs(dot(view, normalize(mat3(modelMatrix) * normal)));
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime, uOpacity;
      uniform vec3 uSun;
      varying vec3 vAur; varying vec3 vPos; varying float vFace;
      void main() {
        float strength = smoothstep(0.02, 0.35, vAur.x) * (0.55 + 0.45 * min(1.0, vAur.x * 2.0));
        float h = vAur.y, ribbon = floor(vAur.z), along = fract(vAur.z) * 6.2831853;
        // Noise read on a circle, so it closes on itself around the oval: broad patches of
        // brightness that drift slowly, and fine rays stretched up the curtain.
        vec2 ring = vec2(cos(along + uTime * 0.004), sin(along + uTime * 0.004));
        float patches = fbm(vec3(ring * 3.4, ribbon * 3.1 + uTime * 0.03));
        float rays = fbm(vec3(ring * 160.0, h * 0.35 + ribbon * 1.7 + uTime * 0.05));
        rays = 0.3 + 0.7 * smoothstep(0.25, 0.8, rays);
        float glow = (0.3 + 0.7 * smoothstep(0.2, 0.7, patches)) * rays;
        // Altitude: h 0 = 95 km, 1 = 300 km.
        float km = 95.0 + h * 205.0;
        float fringe = exp(-pow((km - 96.0) / 5.0, 2.0));
        float green = smoothstep(95.0, 108.0, km) * (1.0 - smoothstep(150.0, 205.0, km));
        float red = smoothstep(170.0, 215.0, km) * (1.0 - smoothstep(215.0, 300.0, km)) * 0.32;
        vec3 col = vec3(1.0, 0.3, 0.72) * fringe * 0.8 + vec3(0.22, 1.0, 0.5) * green + vec3(0.72, 0.06, 0.16) * red;
        // A sharp lower edge, a soft top.
        float edge = smoothstep(0.0, 0.03, h) * (1.0 - smoothstep(0.8, 1.0, h));
        // Edge-on, a sheet would draw a hard line: its light follows how much of its face shows.
        float face = mix(0.22, 1.0, smoothstep(0.05, 0.6, vFace));
        float dark = smoothstep(0.08, -0.15, dot(normalize(vPos), uSun));
        float I = strength * glow * edge * face * dark * uOpacity;
        // Each sheet saturates softly, so where several overlap the green stays green, never white.
        gl_FragColor = vec4(col * (1.0 - exp(-I * 2.8)) * 0.5, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true, side: DoubleSide,
  });
  const mesh = new Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;

  const veilGeo = new BufferGeometry();
  veilGeo.setAttribute('position', new BufferAttribute(new Float32Array(veilPos), 3));
  veilGeo.setAttribute('aur', new BufferAttribute(new Float32Array(veilAttr), 3));
  veilGeo.setIndex(veilIndex);
  const veil = new Mesh(veilGeo, new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aur; // strength, across the band (-1 .. 1), place along the oval
      varying vec3 vAur; varying vec3 vPos;
      void main() { vAur = aur; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime, uOpacity;
      uniform vec3 uSun;
      varying vec3 vAur; varying vec3 vPos;
      void main() {
        float strength = smoothstep(0.02, 0.35, vAur.x) * (0.55 + 0.45 * min(1.0, vAur.x * 2.0));
        float along = vAur.z * 6.2831853;
        vec2 ring = vec2(cos(along + uTime * 0.004), sin(along + uTime * 0.004));
        float patches = fbm(vec3(ring * 3.4, vAur.y * 0.8 + uTime * 0.03));
        float across = exp(-vAur.y * vAur.y * 1.6) * smoothstep(1.0, 0.7, abs(vAur.y));
        float dark = smoothstep(0.08, -0.15, dot(normalize(vPos), uSun));
        float I = strength * across * (0.35 + 0.65 * smoothstep(0.25, 0.75, patches)) * dark * uOpacity;
        gl_FragColor = vec4(vec3(0.22, 1.0, 0.5) * (1.0 - exp(-I * 2.2)) * 0.55, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true, side: DoubleSide,
  }));
  veil.frustumCulled = false;
  veil.renderOrder = 4;
  mesh.add(veil);
  mesh.visible = false;
  return { mesh, material };
}
