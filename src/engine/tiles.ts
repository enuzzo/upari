import {
  BufferAttribute, BufferGeometry, Frustum, Group, Matrix4, Mesh, ShaderMaterial, Sphere, Texture, TextureLoader, Vector3, Vector4, WebGLRenderer,
  LinearFilter, LinearMipmapLinearFilter, ClampToEdgeWrapping,
} from 'three';
import { earthFragment, type EarthUniforms } from './earth';
import type { CameraRig } from './camera';
import { lonLatToVec } from './astro';

// Sentinel-2 cloudless 2016 by EOX IT Services GmbH (CC BY 4.0), Web Mercator tiles.
const URL_TEMPLATE = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg';
const MAX_Z = 15;
const MAX_TILES = 130;
/** Tiles out of view are kept only this coarse, so turning the head never shows bare Blue Marble. */
const OFFSCREEN_Z = 5;
/** Sentinel-2 replaces Blue Marble between these altitudes (planet radii, about 1270 → 450 km), before Blue Marble pixels show. */
const MIX_FROM = 0.2, MIX_TO = 0.07;
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
  /** Failed downloads are retried a few times, ten seconds apart. */
  tries: number;
  failedAt: number;
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
  private frustum = new Frustum();
  private viewProj = new Matrix4();
  private probe = new Sphere();

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
    if (t.failed && t.tries < 3 && this.frame - t.failedAt > 600) t.failed = false;
    if (t.loading || t.texture || t.failed || this.inflight >= 24) return;
    t.loading = true;
    t.tries++;
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
        uniforms: { ...this.shared, uTile: { value: tex }, uTileMix: { value: 0 }, uTileAlpha: { value: 0 }, uTileEdge: { value: new Vector4() } },
        vertexShader: tileVertex,
        fragmentShader: earthFragment,
        defines: { TILE: '' },
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -2 - t.z * 2,
      });
      t.mesh = new Mesh(this.geometry(t.z, t.x, t.y), mat);
      t.mesh.renderOrder = 1 + t.z * 0.01;
      this.group.add(t.mesh);
    }, undefined, () => { this.inflight--; t.loading = false; t.failed = true; t.failedAt = this.frame; });
  }

  update(rig: CameraRig, renderer: WebGLRenderer) {
    this.frame++;
    const camera = rig.camera;
    const cam = camera.position;
    const alt = cam.length() - 1;
    const k = Math.min(1, Math.max(0, (MIX_FROM - alt) / (MIX_FROM - MIX_TO)));
    this.mix = k * k * (3 - 2 * k);
    if (this.mix < 0.005) {
      this.group.visible = false;
      if (this.frame % 120 === 0) this.evict(0);
      return;
    }
    this.group.visible = true;
    camera.updateMatrixWorld();
    this.frustum.setFromProjectionMatrix(this.viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const camDir = cam.clone().normalize();
    const horizon = Math.acos(1 / cam.length());
    const fovK = (2 * Math.tan((camera.fov * Math.PI) / 360)) / innerHeight;
    // Refine the nearest tiles in view first, so the budget is spent where the eye is.
    type Cand = { z: number; x: number; y: number; dist: number; px: number; seen: boolean };
    const make = (z: number, x: number, y: number): Cand | null => {
      const n = 2 ** z;
      const lonC = ((x + 0.5) / n) * 360 - 180, latC = mercLat(y + 0.5, n);
      const c = lonLatToVec(lonC, latC);
      const tileAngle = Math.max(((1 / n) * 2 * Math.PI) * Math.cos(latC * Math.PI / 180), (mercLat(y, n) - mercLat(y + 1, n)) * Math.PI / 180);
      const ang = Math.acos(Math.max(-1, Math.min(1, c.dot(camDir))));
      if (ang - tileAngle * 0.75 > horizon) return null;
      this.probe.center.copy(c);
      this.probe.radius = tileAngle * 0.8 + 0.002;
      const seen = this.frustum.intersectsSphere(this.probe);
      if (!seen && z > OFFSCREEN_Z) return null;
      const dist = Math.max(c.distanceTo(cam) - tileAngle * 0.5, 0.0005);
      return { z, x, y, dist, px: (tileAngle / 256) / (dist * fovK), seen };
    };
    const split = (c: Cand, into: Cand[]) => {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const k = make(c.z + 1, c.x * 2 + dx, c.y * 2 + dy); if (k) into.push(k); }
    };
    const queue: Cand[] = [];
    for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) { const c = make(2, x, y); if (c) queue.push(c); }
    let accepted: Cand[] = [];
    while (queue.length) {
      queue.sort((a, b) => a.dist - b.dist);
      const c = queue.shift()!;
      const canSplit = c.seen && c.z < MAX_Z && c.px > 1.25 && accepted.length + queue.length + 4 <= MAX_TILES;
      if (canSplit) split(c, queue);
      else accepted.push(c);
    }
    accepted = this.balance(accepted, split);

    const want: Tile[] = [];
    for (const c of accepted) {
      if (c.z < 3) continue;
      want.push(this.entry(c.z, c.x, c.y));
    }

    // Draw wanted tiles; while one is loading, keep its loaded ancestor visible.
    const show = new Set<Tile>();
    const ancestor = (t: Tile): Tile | null => {
      for (let z = t.z - 1, x = t.x >> 1, y = t.y >> 1; z >= 3; z--, x >>= 1, y >>= 1) {
        const a = this.tiles.get(`${z}/${x}/${y}`);
        if (a?.mesh) return a;
      }
      return null;
    };
    // Coarse first: after a long flight the view is covered by Sentinel-2 in a moment, then sharpens.
    // A missing tile also asks for its grandparent, which arrives sooner and covers its neighbours too.
    const order = [...want];
    for (const t of want) if (!t.mesh && t.z - 2 >= 3) { const a = this.entry(t.z - 2, t.x >> 2, t.y >> 2); a.lastUsed = this.frame; order.push(a); }
    order.sort((a, b) => a.z - b.z);
    for (const t of order) this.load(t, renderer);
    for (const t of want) {
      t.lastUsed = this.frame;
      const s = t.mesh ? t : ancestor(t);
      if (s) { s.lastUsed = this.frame; show.add(s); }
    }
    // A tile fading in sits on its parent; a parent coming back takes over at once from its children.
    const under = new Set<Tile>();
    for (const t of show) {
      if (t.fade < 1) { const a = ancestor(t); if (a && !show.has(a)) { a.lastUsed = this.frame; under.add(a); } }
    }
    for (const t of show) {
      if (t.fade > 0) continue;
      for (const o of this.tiles.values()) {
        if (o.z > t.z && o.fade > 0 && o.x >> (o.z - t.z) === t.x && o.y >> (o.z - t.z) === t.y) { t.fade = 1; break; }
      }
    }
    // Shown tiles' levels, to soften the seams against coarser neighbours.
    const level = new Map<string, number>();
    for (const t of show) level.set(`${t.z}/${t.x}/${t.y}`, t.z);
    const coarser = (t: Tile, dx: number, dy: number) => {
      const n = 2 ** t.z;
      const nx = (t.x + dx + n) % n, ny = t.y + dy;
      if (ny < 0 || ny >= n) return 0;
      for (let z = t.z - 1, x = nx >> 1, y = ny >> 1; z >= 3 && t.z - z <= 3; z--, x >>= 1, y >>= 1) {
        if (level.has(`${z}/${x}/${y}`)) return t.z - z;
      }
      return 0;
    };
    for (const t of this.tiles.values()) {
      if (!t.mesh) continue;
      const visible = show.has(t) || under.has(t);
      t.fade = Math.min(1, Math.max(0, t.fade + (visible ? 0.07 : -0.1)));
      t.mesh.visible = t.fade > 0;
      const u = (t.mesh.material as ShaderMaterial).uniforms;
      u.uTileMix.value = this.mix;
      u.uTileAlpha.value = under.has(t) ? 1 : t.fade * t.fade * (3 - 2 * t.fade);
      if (show.has(t)) u.uTileEdge.value.set(coarser(t, -1, 0), coarser(t, 1, 0), coarser(t, 0, 1), coarser(t, 0, -1));
      else u.uTileEdge.value.set(0, 0, 0, 0);
    }
    if (this.frame % 60 === 0) this.evict(this.frame - 600);
  }

  private entry(z: number, x: number, y: number): Tile {
    const key = `${z}/${x}/${y}`;
    let t = this.tiles.get(key);
    if (!t) { t = { key, z, x, y, mesh: null, texture: null, loading: false, failed: false, tries: 0, failedAt: 0, lastUsed: 0, fade: 0 }; this.tiles.set(key, t); }
    return t;
  }

  /** Split tiles until no two neighbours differ by more than one level. */
  private balance<C extends { z: number; x: number; y: number; seen: boolean }>(tiles: C[], split: (c: C, into: C[]) => void): C[] {
    for (let pass = 0; pass < 6; pass++) {
      const deepest = new Map<string, number>();
      for (const t of tiles) {
        for (let z = t.z, x = t.x, y = t.y; z >= 2; z--, x >>= 1, y >>= 1) {
          const key = `${z}/${x}/${y}`;
          if ((deepest.get(key) ?? -1) >= t.z) break;
          deepest.set(key, t.z);
        }
      }
      const next: C[] = [];
      let changed = false;
      for (const t of tiles) {
        const n = 2 ** t.z;
        const deep = Math.max(...[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => deepest.get(`${t.z}/${(t.x + dx + n) % n}/${t.y + dy}`) ?? 0));
        if (deep >= t.z + 2 && t.seen && t.z < MAX_Z) { split(t, next); changed = true; } else next.push(t);
      }
      tiles = next;
      if (!changed) break;
    }
    return tiles;
  }

  private evict(before: number) {
    // Tiles wanted for a moment during a flight and never fetched cost nothing to forget.
    for (const [key, t] of this.tiles) if (!t.texture && !t.loading && !t.failed && t.lastUsed < this.frame - 60) this.tiles.delete(key);
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
