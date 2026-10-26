import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3, Vector2, Group,
  Scene, DirectionalLight, HemisphereLight, AmbientLight, Matrix4, Mesh, MeshStandardMaterial, DoubleSide, PerspectiveCamera, Box3, type Material,
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

const EARTH_M = 6371000;
/** NASA's model spans 45.4 units across the truss; the real truss is 109 m. */
const MODEL_M = 109 / 45.4;

/** Sunlight at a point above the Earth (planet radii), 0 in the shadow, soft at its edge. */
function sunlit(p: Vector3, sun: Vector3): number {
  const b = p.dot(sun);
  if (b > 0) return 1;
  const axis = Math.sqrt(Math.max(p.lengthSq() - b * b, 0));
  return Math.min(1, Math.max(0, (axis - 0.995) / 0.01));
}

/** The International Space Station, its position now and its orbit. */
export class Station {
  readonly group = new Group();
  /**
   * The station itself, drawn in its own pass in metres around the camera: at 6,800 km from
   * the centre of the Earth a 109 m object would shake in single-precision coordinates.
   */
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera();
  private model: Group | null = null;
  private modelLoading = false;
  private pivot = new Group();
  private sunLight = new DirectionalLight(0xfff4e6, 3);
  private moonLight = new DirectionalLight(0x9db4ff, 0);
  private earthshine = new HemisphereLight(0x000000, 0x3d5a80, 0);
  readonly velocity = new Vector3();
  /** Distance from the camera, planet radii (Infinity when unknown). */
  range = Infinity;
  private satrec: SatRec | null = null;
  private dot: Points;
  private orbit: Mesh;
  /** 241 samples, two vertices each: a ribbon drawn a few pixels wide on screen. */
  private orbitPositions = new Float32Array(3 * 482);
  private orbitPrev = new Float32Array(3 * 482);
  private orbitNext = new Float32Array(3 * 482);
  private orbitMaterial: ShaderMaterial;
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
    og.setAttribute('prev', new BufferAttribute(this.orbitPrev, 3));
    og.setAttribute('next', new BufferAttribute(this.orbitNext, 3));
    og.setAttribute('when', new BufferAttribute(Float32Array.from({ length: 482 }, (_, k) => ((k >> 1) - 120) * 23), 1));
    og.setAttribute('side', new BufferAttribute(Float32Array.from({ length: 482 }, (_, k) => (k & 1 ? 1 : -1)), 1));
    const idx: number[] = [];
    for (let i = 0; i < 240; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    og.setIndex(idx);
    // The orbit as a thread of light: faint behind the station, brighter ahead, with pulses
    // running in the direction of flight.
    this.orbitMaterial = new ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uNow: { value: 0 }, uTime: { value: 0 }, uRes: { value: new Vector2(1, 1) }, uWidth: { value: 3 } },
      vertexShader: /* glsl */ `
        attribute vec3 prev, next;
        attribute float when, side;
        uniform float uNow, uWidth;
        uniform vec2 uRes;
        varying float vRel, vSide;
        void main() {
          mat4 m = projectionMatrix * modelViewMatrix;
          vec4 c = m * vec4(position, 1.0), p = m * vec4(prev, 1.0), n = m * vec4(next, 1.0);
          vec2 dir = normalize((n.xy / n.w - p.xy / p.w) * uRes + 1e-6);
          c.xy += vec2(-dir.y, dir.x) / uRes * uWidth * side * c.w;
          vRel = when - uNow;
          vSide = side;
          gl_Position = c;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity, uTime;
        varying float vRel, vSide;
        void main() {
          float ahead = step(0.0, vRel);
          float base = mix(0.22, 0.75 * (1.0 - smoothstep(600.0, 2760.0, vRel)) + 0.2, ahead);
          float pulse = ahead * pow(1.0 - fract((vRel - uTime * 140.0) / 420.0), 6.0) * (1.0 - smoothstep(1200.0, 2760.0, vRel));
          float edge = 1.0 - smoothstep(0.2, 1.0, abs(vSide));
          gl_FragColor = vec4(vec3(0.62, 0.77, 1.0) * (base + pulse * 1.6) * edge * uOpacity, 1.0);
        }`,
      blending: AdditiveBlending, depthWrite: false, transparent: true, side: DoubleSide,
    });
    this.orbit = new Mesh(og, this.orbitMaterial);
    this.orbit.frustumCulled = false;
    this.orbit.renderOrder = 4;
    this.group.add(this.orbit, this.dot);
    this.scene.add(this.sunLight, this.sunLight.target, this.moonLight, this.moonLight.target, this.earthshine, new AmbientLight(0x8899aa, 0.04), this.pivot);
    this.pivot.visible = false;
  }

  /** NASA's ISS (B) model (public domain), loaded the first time the station is shown. */
  private async loadModel() {
    this.modelLoading = true;
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
    ]);
    const draco = new DRACOLoader().setDecoderPath('draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const gltf = await loader.loadAsync('models/iss.glb');
    draco.dispose();
    const root = gltf.scene;
    // Two stray truss fragments float 40 units away from the station in the source file.
    const junk: Mesh[] = [];
    const panel = new MeshStandardMaterial({ color: 0x5a4024, metalness: 0.45, roughness: 0.38 });
    const radiator = new MeshStandardMaterial({ color: 0xf2f0ea, metalness: 0.0, roughness: 0.55 });
    const hull = new MeshStandardMaterial({ color: 0xd9d6cf, metalness: 0.15, roughness: 0.5 });
    const pick = (m: Material) => (/lambert7/.test(m.name) ? panel : /blinn5SG|bendedtruss_blin\./.test(m.name) ? radiator : hull);
    root.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      if (/^(bendedtru|pCylinder)/.test(mesh.name)) { junk.push(mesh); return; }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(pick) : pick(mesh.material);
    });
    junk.forEach((m) => m.removeFromParent());
    const center = new Box3().setFromObject(root).getCenter(new Vector3());
    root.position.copy(center).multiplyScalar(-1);
    const model = new Group();
    model.add(root);
    model.scale.setScalar(MODEL_M);
    this.pivot.add(model);
    this.model = model;
  }

  /**
   * Places the station's pass around `cam`. The model's x axis points to the zenith, y along
   * the flight, z along the truss, as the station flies (LVLH attitude).
   */
  placeFor(cam: PerspectiveCamera, sun: Vector3, opacity: number, moon?: { dir: Vector3; brightness: number }) {
    this.range = this.position.distanceTo(cam.position);
    const near = opacity > 0.5 && this.altKm > 0 && this.range < 0.05;
    if (near && !this.model && !this.modelLoading) void this.loadModel().catch((err) => { console.warn('ISS model unavailable', err); });
    this.pivot.visible = near && !!this.model;
    if (!this.pivot.visible) return;
    const up = this.position.clone().normalize();
    const fwd = this.velocity.clone().addScaledVector(up, -this.velocity.dot(up)).normalize();
    const side = new Vector3().crossVectors(up, fwd);
    this.pivot.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(up, fwd, side));
    this.pivot.position.copy(this.position).sub(cam.position).multiplyScalar(EARTH_M);
    this.camera.copy(cam, false);
    this.camera.position.set(0, 0, 0);
    this.camera.near = Math.max(0.5, this.range * EARTH_M * 0.05);
    this.camera.far = this.range * EARTH_M + 500;
    this.camera.updateProjectionMatrix();
    // Sunlight, unless the station is in the Earth's shadow; earthshine from the day side below.
    const lit = sunlit(this.position, sun);
    this.sunLight.position.copy(sun);
    // At night the real Moon lights the station, exposed like the planet's night side.
    if (moon) {
      this.moonLight.position.copy(moon.dir);
      this.moonLight.intensity = 0.9 * moon.brightness * (1 - lit) * Math.max(0, Math.sign(this.position.dot(moon.dir) + 0.3));
    }
    this.sunLight.intensity = 3.2 * lit;
    this.earthshine.position.copy(up);
    this.earthshine.intensity = 0.9 * Math.min(1, Math.max(0, (up.dot(sun) + 0.1) / 0.4));
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

  /** Whether the station is in sunlight at a date, and minutes to the next sunrise or sunset on board. */
  daylight(date: Date, sun: (d: Date) => Vector3): { day: boolean; minutes: number } | null {
    const p = new Vector3();
    if (!this.at(date, p)) return null;
    const day = sunlit(p, sun(date)) > 0.5;
    for (let s = 15; s <= 100 * 60; s += 15) {
      const d = new Date(date.getTime() + s * 1000);
      if (this.at(d, p) && (sunlit(p, sun(d)) > 0.5) !== day) return { day, minutes: s / 60 };
    }
    return { day, minutes: Infinity };
  }

  /** Orbits flown since midnight UTC, from the mean motion. */
  orbitsToday(date: Date): number {
    const perMin = this.satrec ? this.satrec.no / (2 * Math.PI) : 1 / 92.9;
    const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return (date.getTime() - midnight) / 60000 * perMin;
  }

  /** Drawing-buffer size, for the orbit's width in pixels. */
  setResolution(w: number, h: number, pixelRatio: number) {
    this.orbitMaterial.uniforms.uRes.value.set(w * pixelRatio, h * pixelRatio);
    this.orbitMaterial.uniforms.uWidth.value = 3.2 * pixelRatio; // full width in device pixels, soft-edged
  }

  update(date: Date, opacity: number, time: number) {
    // The glowing dot gives way to the model as the camera comes close (range in planet radii).
    this.material.uniforms.uOpacity.value = opacity * Math.min(1, Math.max(0, (this.range - 0.0008) / 0.006));
    this.material.uniforms.uTime.value = time;
    // The thread fades as the camera reaches the station: it would run through the lens.
    this.orbitMaterial.uniforms.uOpacity.value = opacity * Math.min(1, Math.max(0, (this.range - 0.004) / 0.03));
    this.orbitMaterial.uniforms.uTime.value = time;
    this.group.visible = opacity > 0.001;
    if (!this.group.visible) return;
    const p = this.at(date, this.position);
    if (p) {
      this.lon = p.lon; this.lat = p.lat; this.altKm = p.alt;
      const ahead = new Vector3();
      if (this.at(new Date(date.getTime() + 1000), ahead)) this.velocity.copy(ahead).sub(this.position);
      (this.dot.geometry.attributes.position as BufferAttribute).set([this.position.x, this.position.y, this.position.z]);
      this.dot.geometry.attributes.position.needsUpdate = true;
    }
    if (Math.abs(date.getTime() - this.lastOrbitAt) > 20000) {
      this.lastOrbitAt = date.getTime();
      const v = new Vector3();
      const pts: Vector3[] = [];
      for (let i = 0; i <= 240; i++) {
        // One full revolution centred on now (≈ 92 minutes).
        this.at(new Date(date.getTime() + (i - 120) * 23000), v);
        pts.push(v.clone());
      }
      for (let i = 0; i <= 240; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[Math.min(240, i + 1)];
        for (const k of [i * 2, i * 2 + 1]) {
          this.orbitPositions.set([b.x, b.y, b.z], k * 3);
          this.orbitPrev.set([a.x, a.y, a.z], k * 3);
          this.orbitNext.set([c.x, c.y, c.z], k * 3);
        }
      }
      for (const name of ['position', 'prev', 'next']) this.orbit.geometry.attributes[name].needsUpdate = true;
    }
    this.orbitMaterial.uniforms.uNow.value = (date.getTime() - this.lastOrbitAt) / 1000;
  }
}
