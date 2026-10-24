import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Line, Points, ShaderMaterial, Vector3, Group, LineBasicMaterial,
} from 'three';
import { json2satrec, propagate, gstime, eciToGeodetic, type SatRec } from 'satellite.js';
import { lonLatToVec } from './astro';

/** Seven days of active fires as glowing embers. */
export function createFires(data: Float32Array) {
  const n = data.length / 4;
  const pos = new Float32Array(n * 3), attr = new Float32Array(n * 3);
  const v = new Vector3();
  for (let i = 0; i < n; i++) {
    lonLatToVec(data[i * 4 + 1], data[i * 4], 1.0006, v);
    pos.set([v.x, v.y, v.z], i * 3);
    attr.set([data[i * 4 + 2], data[i * 4 + 3], Math.random()], i * 3);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('fire', new BufferAttribute(attr, 3));
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) }, uHeight: { value: 1000 } },
    vertexShader: /* glsl */ `
      attribute vec3 fire; // frp (MW), age (days), random
      uniform float uTime, uReveal, uPixelRatio, uHeight;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = -mv.z;
        float power = log(1.0 + fire.x) / log(1.0 + 4000.0);
        float fresh = 1.0 - fire.y / 7.0;
        float flick = 0.75 + 0.25 * sin(uTime * (5.0 + fire.z * 9.0) + fire.z * 40.0);
        float shown = smoothstep(fire.z, fire.z + 0.06, uReveal);
        vec3 ember = vec3(0.9, 0.12, 0.02);
        vec3 flame = vec3(1.0, 0.38, 0.06);
        vec3 core = vec3(1.0, 0.75, 0.4);
        vColor = mix(ember, mix(flame, core, power * power), fresh) * (0.5 + 2.2 * power) * (0.3 + 0.7 * fresh) * flick;
        vec3 n = normalize(position);
        vec3 toCam = normalize(cameraPosition - position);
        vAlpha = shown * smoothstep(0.02, 0.25, dot(n, toCam));
        float px = (0.0016 + 0.007 * power) / max(dist, 0.002) * uHeight;
        gl_PointSize = clamp(px, 1.0, 22.0) * uPixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float g = exp(-r * r * 4.5);
        gl_FragColor = vec4(vColor * g * vAlpha * uOpacity, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 3;
  return { points, material, count: n };
}

/** The International Space Station, its position now and its orbit. */
export class Station {
  readonly group = new Group();
  private satrec: SatRec | null = null;
  private dot: Points;
  private orbit: Line;
  private orbitPositions = new Float32Array(3 * 241);
  private lastOrbitAt = 0;
  readonly material: ShaderMaterial;
  readonly position = new Vector3();
  lon = 0;
  lat = 0;
  altKm = 0;
  speedKmh = 0;

  constructor() {
    this.material = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
      vertexShader: /* glsl */ `
        uniform float uPixelRatio;
        void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 34.0 * uPixelRatio; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uOpacity;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float core = exp(-r * r * 60.0) * 6.0;
          float halo = exp(-r * r * 6.0) * 0.6;
          float pulse = smoothstep(0.0, 0.2, fract(uTime * 0.6)) * (1.0 - fract(uTime * 0.6));
          float ring = exp(-pow((r - fract(uTime * 0.6)) / 0.05, 2.0)) * (1.0 - fract(uTime * 0.6));
          gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * (core + halo + ring * 1.2) * uOpacity, 1.0);
        }`,
      blending: AdditiveBlending, depthWrite: false, transparent: true,
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
    this.dot = new Points(g, this.material);
    this.dot.frustumCulled = false;
    this.dot.renderOrder = 5;
    const og = new BufferGeometry();
    og.setAttribute('position', new BufferAttribute(this.orbitPositions, 3));
    this.orbit = new Line(og, new LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
    this.orbit.frustumCulled = false;
    this.orbit.renderOrder = 4;
    this.group.add(this.orbit, this.dot);
  }

  /**
   * Orbital elements: the copy refreshed every morning with the site comes first.
   * CelesTrak asks clients not to download the same data more than once per update,
   * so visitors call it only when the local copy is more than two days old.
   */
  async load() {
    const read = async (url: string) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      const [omm] = await r.json();
      return omm as { EPOCH: string };
    };
    let omm = await read('sky/iss.json').catch(() => null);
    const age = omm ? Date.now() - Date.parse(omm.EPOCH + 'Z') : Infinity;
    if (age > 2 * 86400e3) omm = (await read('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=JSON').catch(() => null)) ?? omm;
    if (omm) this.satrec = json2satrec(omm as Parameters<typeof json2satrec>[0]);
  }

  private at(date: Date, out: Vector3): { lon: number; lat: number; alt: number } | null {
    if (!this.satrec) return null;
    const pv = propagate(this.satrec, date);
    if (!pv || typeof pv.position === 'boolean' || !pv.position) return null;
    const geo = eciToGeodetic(pv.position, gstime(date));
    const lon = geo.longitude * 180 / Math.PI, lat = geo.latitude * 180 / Math.PI;
    lonLatToVec(lon, lat, 1 + geo.height / 6371, out);
    if (pv.velocity && typeof pv.velocity !== 'boolean') {
      const v = pv.velocity;
      this.speedKmh = Math.hypot(v.x, v.y, v.z) * 3600;
    }
    return { lon, lat, alt: geo.height };
  }

  update(date: Date, opacity: number, time: number) {
    this.material.uniforms.uOpacity.value = opacity;
    this.material.uniforms.uTime.value = time;
    (this.orbit.material as LineBasicMaterial).opacity = opacity * 0.55;
    this.group.visible = opacity > 0.001;
    if (!this.group.visible) return;
    const p = this.at(date, this.position);
    if (p) {
      this.lon = p.lon; this.lat = p.lat; this.altKm = p.alt;
      (this.dot.geometry.attributes.position as BufferAttribute).set([this.position.x, this.position.y, this.position.z]);
      this.dot.geometry.attributes.position.needsUpdate = true;
    }
    if (Math.abs(date.getTime() - this.lastOrbitAt) > 20000) {
      this.lastOrbitAt = date.getTime();
      const v = new Vector3();
      for (let i = 0; i <= 240; i++) {
        // One full revolution centred on now (≈ 92 minutes).
        this.at(new Date(date.getTime() + (i - 120) * 23000), v);
        this.orbitPositions.set([v.x, v.y, v.z], i * 3);
      }
      this.orbit.geometry.attributes.position.needsUpdate = true;
    }
  }
}
