import {
  BufferAttribute, BufferGeometry, Group, Mesh, ShaderMaterial, Texture, TextureLoader, Vector3, WebGLRenderer,
  LinearFilter, LinearMipmapLinearFilter, ClampToEdgeWrapping,
} from 'three';
import { earthFragment, type EarthUniforms } from './earth';
import type { CameraRig } from './camera';
import { lonLatToVec } from './astro';

// Sentinel-2 cloudless 2016 by EOX IT Services GmbH (CC BY 4.0), Web Mercator tiles.
const URL_TEMPLATE = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg';
const MAX_Z = 15;
const MAX_TILES = 110;
const SEG = 16;

const tileVertex = /* glsl */ `
attribute vec2 tileUv;
varying vec3 vPos;
varying vec2 vUv;
varying vec2 vTileUv;
void main() {
  vUv = uv;
  vTileUv = tileUv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const mercLat = (y: number, n: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;

interface Tile {
  key: string;
  z: number; x: number; y: number;
  mesh: Mesh | null;
  texture: Texture | null;
  loading: boolean;
  failed: boolean;
  lastUsed: number;
  fade: number;
}

export class Tiles {
  readonly group = new Group();
  private tiles = new Map<string, Tile>();
  private loader = new TextureLoader();
  private frame = 0;
  private inflight = 0;
  private mix = 0;

  /** How much of the close-up imagery is on screen, 0..1. */
  get presence() { return this.group.visible ? this.mix : 0; }

  constructor(private shared: EarthUniforms) {
    this.loader.setCrossOrigin('anonymous');
  }

  private geometry(z: number, x: number, y: number): BufferGeometry {
    const n = 2 ** z;
    const lon0 = (x / n) * 360 - 180, lon1 = ((x + 1) / n) * 360 - 180;
    const segAngle = Math.max((lon1 - lon0) / SEG, (mercLat(y, n) - mercLat(y + 1, n)) / SEG) * Math.PI / 180;
    // Lift slightly above the coarse planet mesh so the tile always wins the depth test.
    const r = 1 + (1 - Math.cos(1.2 * Math.PI / 384)) + (1 - Math.cos(segAngle / 2)) * 0.0 + 2e-6;
    const pos = new Float32Array((SEG + 1) ** 2 * 3), uv = new Float32Array((SEG + 1) ** 2 * 2), tuv = new Float32Array((SEG + 1) ** 2 * 2);
    const v = new Vector3();
    for (let j = 0; j <= SEG; j++) {
      const my = y + j / SEG;
      const lat = mercLat(my, n);
      for (let i = 0; i <= SEG; i++) {
        const lon = lon0 + ((lon1 - lon0) * i) / SEG;
        const k = j * (SEG + 1) + i;
        lonLatToVec(lon, lat, r, v);
        pos.set([v.x, v.y, v.z], k * 3);
        uv.set([(lon + 180) / 360, (lat + 90) / 180], k * 2);
        tuv.set([i / SEG, 1 - j / SEG], k * 2);
      }
    }
    const idx: number[] = [];
    for (let j = 0; j < SEG; j++) for (let i = 0; i < SEG; i++) {
      const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2));
    g.setAttribute('tileUv', new BufferAttribute(tuv, 2));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }

  private load(t: Tile, renderer: WebGLRenderer) {
    if (t.loading || t.texture || t.failed || this.inflight > 16) return;
    t.loading = true;
    this.inflight++;
    const url = URL_TEMPLATE.replace('{z}', String(t.z)).replace('{x}', String(t.x)).replace('{y}', String(t.y));
    this.loader.load(url, (tex) => {
      this.inflight--;
      t.loading = false;
      tex.minFilter = LinearMipmapLinearFilter;
      tex.magFilter = LinearFilter;
      tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      t.texture = tex;
      const mat = new ShaderMaterial({
        uniforms: { ...this.shared, uTile: { value: tex }, uTileMix: { value: 0 } },
        vertexShader: tileVertex,
        fragmentShader: earthFragment,
        defines: { TILE: '' },
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -2 - t.z * 2,
      });
      t.mesh = new Mesh(this.geometry(t.z, t.x, t.y), mat);
      t.mesh.renderOrder = 1 + t.z * 0.01;
      this.group.add(t.mesh);
    }, undefined, () => { this.inflight--; t.loading = false; t.failed = true; });
  }

  update(rig: CameraRig, renderer: WebGLRenderer) {
    this.frame++;
    const cam = rig.camera.position;
    const alt = cam.length() - 1;
    this.mix += ((alt < 0.09 ? 1 : 0) - this.mix) * 0.06;
    if (this.mix < 0.005) {
      this.group.visible = false;
      if (this.frame % 120 === 0) this.evict(0);
      return;
    }
    this.group.visible = true;
    const camDir = cam.clone().normalize();
    const horizon = Math.acos(1 / cam.length());
    const fovK = (2 * Math.tan((rig.camera.fov * Math.PI) / 360)) / innerHeight;
    // Refine the nearest tiles first, so the budget is spent where the eye is.
    type Cand = { z: number; x: number; y: number; dist: number; ang: number; px: number };
    const make = (z: number, x: number, y: number): Cand | null => {
      const n = 2 ** z;
      const lonC = ((x + 0.5) / n) * 360 - 180, latC = mercLat(y + 0.5, n);
      const c = lonLatToVec(lonC, latC);
      const tileAngle = Math.max(((1 / n) * 2 * Math.PI) * Math.cos(latC * Math.PI / 180), (mercLat(y, n) - mercLat(y + 1, n)) * Math.PI / 180);
      const ang = Math.acos(Math.max(-1, Math.min(1, c.dot(camDir))));
      if (ang - tileAngle * 0.75 > horizon) return null;
      const dist = Math.max(c.distanceTo(cam) - tileAngle * 0.5, 0.0005);
      return { z, x, y, dist, ang, px: (tileAngle / 256) / (dist * fovK) };
    };
    let queue: Cand[] = [];
    for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) { const c = make(2, x, y); if (c) queue.push(c); }
    const accepted: Cand[] = [];
    while (queue.length) {
      queue.sort((a, b) => a.dist - b.dist);
      const c = queue.shift()!;
      const canSplit = c.z < MAX_Z && c.px > 1.25 && accepted.length + queue.length + 4 <= MAX_TILES;
      if (canSplit) {
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const k = make(c.z + 1, c.x * 2 + dx, c.y * 2 + dy); if (k) queue.push(k); }
      } else accepted.push(c);
    }
    const want: Tile[] = [];
    for (const c of accepted) {
      if (c.z < 3) continue;
      const key = `${c.z}/${c.x}/${c.y}`;
      let t = this.tiles.get(key);
      if (!t) { t = { key, z: c.z, x: c.x, y: c.y, mesh: null, texture: null, loading: false, failed: false, lastUsed: 0, fade: 0 }; this.tiles.set(key, t); }
      want.push(t);
    }
    queue = [];

    // Draw wanted tiles; while one is loading, keep its loaded ancestor visible.
    const show = new Set<Tile>();
    for (const t of want) {
      t.lastUsed = this.frame;
      this.load(t, renderer);
      if (t.mesh) { show.add(t); continue; }
      for (let z = t.z - 1, x = t.x >> 1, y = t.y >> 1; z >= 3; z--, x >>= 1, y >>= 1) {
        const a = this.tiles.get(`${z}/${x}/${y}`);
        if (a?.mesh) { a.lastUsed = this.frame; show.add(a); break; }
        if (a && !a.texture && !a.failed && !a.loading) this.load(a, renderer);
      }
    }
    for (const t of this.tiles.values()) {
      if (!t.mesh) continue;
      const visible = show.has(t);
      t.fade = Math.min(1, Math.max(0, t.fade + (visible ? 0.08 : -1)));
      t.mesh.visible = t.fade > 0;
      (t.mesh.material as ShaderMaterial).uniforms.uTileMix.value = t.fade * this.mix;
    }
    if (this.frame % 60 === 0) this.evict(this.frame - 600);
  }

  private evict(before: number) {
    if (this.tiles.size < 220 && before > 0) return;
    for (const [key, t] of this.tiles) {
      if (t.lastUsed < before && !t.loading) {
        if (t.mesh) { this.group.remove(t.mesh); t.mesh.geometry.dispose(); (t.mesh.material as ShaderMaterial).dispose(); }
        t.texture?.dispose();
        this.tiles.delete(key);
      }
    }
  }
}
