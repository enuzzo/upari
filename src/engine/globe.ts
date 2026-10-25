import {
  ACESFilmicToneMapping, Clock, HalfFloatType, Raycaster, Scene, Sphere, Texture, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CameraRig } from './camera';
import { createAtmosphere, createEarth, earthUniforms, type EarthUniforms } from './earth';
import { createSky, createSun } from './sky';
import { FlowField, coherenceTexture } from './flow';
import { FLOW_COLORS } from './palettes';
import { createFires, Station } from './markers';
import { DATA, LayerStore, Sampler, loadTexture, type DataId, type LayerMeta } from './layers';
import { gmst, lonLatToVec, moonBrightness, moonDirection, sunDirection, vecToLonLat } from './astro';
import { Tiles } from './tiles';

export type FlowId = 'wind' | 'currents';

export interface Look {
  sun: 'real' | 'studio';
  clouds: number;
  cloudFlow: number;
  night: number;
  dim: number;
  desat: number;
  data: DataId | null;
  flow: FlowId | null;
  fires: number;
  iss: number;
  stars: number;
  atmo: number;
  exposure: number;
  relief: number;
  bloom: number;
  pin: { lon: number; lat: number } | null;
}

export const DEFAULT_LOOK: Look = {
  sun: 'real', clouds: 1, cloudFlow: 1, night: 1, dim: 0, desat: 0, data: null, flow: null,
  fires: 0, iss: 0, stars: 1, atmo: 1, exposure: 1, relief: 1, bloom: 1, pin: null,
};

export interface Probe {
  lon: number;
  lat: number;
  text: string | null;
  sub: string | null;
}

const GrainShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new Vector2(1, 1) }, uVignette: { value: 0.55 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; uniform float uVignette;
    varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 d = vUv - 0.5; d.x *= uRes.x / uRes.y;
      float vig = smoothstep(1.15, 0.2, length(d));
      c *= mix(1.0, vig, uVignette);
      c += (h(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.022;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

const approach = (cur: number, target: number, dt: number, rate = 1.6) => cur + (target - cur) * (1 - Math.exp(-dt * rate));

export class Globe {
  readonly renderer: WebGLRenderer;
  readonly rig: CameraRig;
  readonly scene = new Scene();
  readonly layers = new LayerStore();
  readonly station = new Station();
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grain: ShaderPass;
  u!: EarthUniforms;
  private clock = new Clock();
  private time = 0;
  private look: Look = { ...DEFAULT_LOOK };
  cur = { clouds: 1, cloudFlow: 1, night: 1, dim: 0, desat: 0, fires: 0, iss: 0, stars: 1, atmo: 1, exposure: 1, relief: 1, bloom: 1, dataMix: 0, trail: 0, studio: 0, pin: 0 };
  private flows: Partial<Record<FlowId, FlowField>> = {};
  private flowSamplers: Partial<Record<FlowId, { s: Sampler; scale: number }>> = {};
  private flowShown: FlowId | null = null;
  private dataShown: DataId | null = null;
  private dataMeta: LayerMeta | null = null;
  private dataSamplers: Sampler[] = [];
  private dataFrames: Texture[] = [];
  private dataRetryAt = 0;
  private dataPending: DataId | null = null;
  private frame = 0;
  private fires: ReturnType<typeof createFires> | null = null;
  private fireData: Float32Array | null = null;
  private sky: Awaited<ReturnType<typeof createSky>> | null = null;
  private sun = createSun();
  private tiles: Tiles | null = null;
  private sunVec = new Vector3(1, 0, 0);
  private moonVec = new Vector3(1, 0, 0);
  private studioVec = new Vector3();
  private pinVec = new Vector3();
  private raycaster = new Raycaster();
  private sphere = new Sphere(new Vector3(), 1);
  /** Simulated time. Runs at real speed unless scrubbed. */
  timeOffset = 0;
  /** Master gains, tuned by eye. */
  tune = { atmo: 5, haze: 0.6, limb: 2, sun: 2.2, night: 3.2, relief: 9, bloom: 0.6, moon: 0.06, airglow: 0.05 };
  rainSpeed = 1.8;
  onFrame: (dt: number) => void = () => {};

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.rig = new CameraRig(canvas);
    this.composer = new EffectComposer(this.renderer);
    this.composer.renderTarget1.texture.type = HalfFloatType;
    this.composer.renderTarget2.texture.type = HalfFloatType;
    this.composer.addPass(new RenderPass(this.scene, this.rig.camera));
    this.bloom = new UnrealBloomPass(new Vector2(512, 512), 0.6, 0.55, 1.35);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grain = new ShaderPass(GrainShader);
    this.composer.addPass(this.grain);
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  get now(): Date { return new Date(Date.now() + this.timeOffset); }
  get fireCount() { return this.fires?.count ?? 0; }
  /** True while Sentinel-2 close-up imagery is visible (its licence asks for on-screen credit). */
  get closeUp() { return (this.tiles?.presence ?? 0) > 0.05; }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w, h);
    this.rig.resize(w, h);
    this.grain.uniforms.uRes.value.set(w, h);
  }

  async init(progress: (p: number) => void) {
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    let done = 0;
    const total = 4;
    const tick = <T,>(p: Promise<T>) => p.then((v) => { progress(++done / total); return v; });
    const [day, relief, clouds, night] = await Promise.all([
      tick(loadTexture('earth/day-2k.jpg', { anisotropy: aniso })),
      tick(loadTexture('earth/relief-4k.webp', { anisotropy: 4 })),
      tick(loadTexture('earth/clouds-4k.jpg', { anisotropy: aniso })),
      tick(loadTexture('earth/night-4k.jpg', { anisotropy: aniso })),
    ]);
    this.u = earthUniforms({ day, night, clouds, relief });
    this.scene.add(createEarth(this.u), createAtmosphere(this.u), this.sun.mesh, this.station.group);
    this.tiles = new Tiles(this.u);
    this.scene.add(this.tiles.group);
    // Sharper textures stream in after the first frame.
    void this.upgrade(aniso);
    void createSky().then((s) => { this.sky = s; this.scene.add(s.group); });
    void this.station.load();
    void this.loadFlow('wind');
  }

  private async upgrade(aniso: number) {
    const swap = async (key: 'uDay' | 'uNight' | 'uClouds' | 'uRelief', url: string) => {
      const t = await loadTexture(url, { anisotropy: aniso });
      const old = this.u[key].value;
      this.u[key].value = t;
      old.dispose();
    };
    await swap('uDay', 'earth/day-8k.jpg');
    await swap('uRelief', 'earth/relief-8k.webp');
    this.u.uReliefSize.value.set(8192, 4096);
    await swap('uClouds', 'earth/clouds-8k.webp');
    await swap('uNight', 'earth/night-8k.jpg');
  }

  async loadFlow(id: FlowId): Promise<FlowField> {
    if (this.flows[id]) return this.flows[id]!;
    const meta = await (await fetch(`fields/${id}.json`)).json();
    const tex = await loadTexture(`fields/${id}.png`, { mipmaps: false });
    const style = id === 'wind'
      ? { scale: meta.scale, speed: 22000, vmax: 26, colors: FLOW_COLORS.wind as unknown as [number, number, number][], life: 7, fade: 0.988, intensity: 0.28 }
      : {
        scale: meta.scale, speed: 240000, vmax: 1.2, colors: FLOW_COLORS.currents as unknown as [number, number, number][], life: 9, fade: 0.99, intensity: 0.3, curve: [0.0, 2.0] as [number, number],
        // Eddies (about 1-2° across) cancel out over ±5 texels (±1.7°); steady currents do not.
        weight: coherenceTexture(tex.image as HTMLImageElement, 5),
      };
    const flow = new FlowField(this.renderer, tex, style, id === 'wind' ? 192 : 256, [2048, 1024]);
    this.flows[id] = flow;
    this.flowSamplers[id] = { s: Sampler.fromImage(tex.image as HTMLImageElement, id === 'wind' ? 720 : 1080), scale: meta.scale };
    if (id === 'wind') this.u.uWind.value = tex;
    return flow;
  }

  async loadFires() {
    if (this.fires) return;
    const buf = await (await fetch('layers/fires.bin')).arrayBuffer();
    this.fireData = new Float32Array(buf);
    this.fires = createFires(this.fireData);
    this.scene.add(this.fires.points);
  }

  /** Prefetch everything a look needs, so the transition is seamless. */
  async prepare(look: Partial<Look>) {
    const jobs: Promise<unknown>[] = [];
    if (look.data) jobs.push(this.layers.get(look.data));
    if (look.flow) jobs.push(this.loadFlow(look.flow));
    if (look.fires) jobs.push(this.loadFires());
    await Promise.all(jobs);
  }

  setLook(next: Partial<Look>) {
    this.look = { ...DEFAULT_LOOK, ...next };
    void this.prepare(this.look);
    if (this.look.pin) lonLatToVec(this.look.pin.lon, this.look.pin.lat, 1, this.pinVec);
  }

  get currentLook() { return this.look; }

  start() {
    this.clock.start();
    // Adaptive resolution: if frames get slow, render fewer pixels.
    let acc = 0, frames = 0, ratio = this.renderer.getPixelRatio();
    const loop = () => {
      const raw = this.clock.getDelta();
      this.tick(Math.min(raw, 0.1));
      if (document.visibilityState === 'visible' && raw < 0.5) {
        acc += raw; frames++;
        if (acc > 2.5) {
          const avg = acc / frames;
          if (avg > 1 / 40 && ratio > 1) ratio = Math.max(1, ratio - 0.25);
          else if (avg < 1 / 75 && ratio < Math.min(devicePixelRatio, 2)) ratio = Math.min(Math.min(devicePixelRatio, 2), ratio + 0.25);
          if (ratio !== this.renderer.getPixelRatio()) { this.renderer.setPixelRatio(ratio); this.composer.setPixelRatio(ratio); this.resize(); }
          acc = 0; frames = 0;
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  tick(dt: number) {
    this.update(dt);
    this.onFrame(dt);
    this.composer.render(dt);
  }

  private update(dt: number) {
    this.time += dt;
    const L = this.look, c = this.cur;
    for (const k of ['clouds', 'cloudFlow', 'night', 'dim', 'desat', 'stars', 'atmo', 'exposure', 'relief', 'bloom'] as const) c[k] = approach(c[k], L[k], dt);
    c.fires = approach(c.fires, L.fires, dt, 1.2);
    c.iss = approach(c.iss, L.iss, dt, 2);
    c.studio = approach(c.studio, L.sun === 'studio' ? 1 : 0, dt, 1.4);
    c.pin = approach(c.pin, L.pin ? 1 : 0, dt, 2);

    this.rig.update(dt);
    const cam = this.rig.camera;
    const date = this.now;

    // Sun: real position, or a soft key light over the viewer's shoulder.
    sunDirection(date, this.sunVec);
    const camDir = cam.position.clone().normalize();
    const right = new Vector3().crossVectors(cam.up, camDir).normalize();
    this.studioVec.copy(camDir).addScaledVector(cam.up, 0.55).addScaledVector(right, -0.75).normalize();
    const sun = this.sunVec.clone().lerp(this.studioVec, c.studio).normalize();
    const u = this.u;
    u.uSun.value.copy(sun);
    u.uTime.value = this.time;
    // Near the ground the cloud layer is above us and the haze thins out.
    const alt = cam.position.length() - 1;
    const low = Math.min(1, Math.max(0, (alt - 0.008) / 0.07));
    const lowS = low * low * (3 - 2 * low);
    u.uCloudOpacity.value = c.clouds * lowS;
    u.uCloudFlow.value = c.cloudFlow;
    u.uNightGain.value = this.tune.night * c.night;
    u.uBaseDim.value = c.dim;
    u.uBaseDesat.value = c.desat;
    u.uReliefGain.value = this.tune.relief * c.relief * (0.25 + 0.75 * lowS);
    u.uAtmoPower.value = this.tune.atmo * c.atmo;
    u.uSunPower.value = this.tune.sun;
    u.uHaze.value = this.tune.haze * (0.45 + 0.55 * lowS);
    u.uLimb.value = this.tune.limb;
    u.uGlint.value = 1 - c.studio;
    // Moonlight and airglow are real but faint: exposed like a long night photograph.
    moonDirection(date, this.moonVec);
    const nightK = Math.min(1, c.night) * (1 - c.studio);
    u.uMoon.value.set(this.moonVec.x, this.moonVec.y, this.moonVec.z, this.tune.moon * moonBrightness(this.sunVec, this.moonVec) * nightK);
    u.uAirglow.value = this.tune.airglow * nightK;
    this.renderer.toneMappingExposure = c.exposure;
    this.bloom.strength = this.tune.bloom * c.bloom;
    this.sun.place(this.sunVec);
    this.sun.mesh.quaternion.copy(cam.quaternion);
    this.sun.mesh.visible = c.studio < 0.5;
    this.grain.uniforms.uTime.value = this.time;
    if (this.sky) {
      this.sky.group.rotation.y = -gmst(date);
      this.sky.setOpacity(c.stars);
    }

    // Pin.
    u.uPin.value.set(this.pinVec.x, this.pinVec.y, this.pinVec.z, c.pin);

    // Data layer: fade out, swap, fade in.
    const want = L.data;
    if (want !== this.dataShown) {
      c.dataMix = Math.max(0, c.dataMix - dt * 1.6);
      if (c.dataMix <= 0) {
        this.dataShown = null;
        if (want && this.time >= this.dataRetryAt && this.dataPending !== want) {
          this.dataPending = want;
          const pending = this.layers.get(want);
          void pending.then(({ tex, meta, sampler }) => {
            this.dataPending = null;
            if (this.look.data !== want || this.dataShown === want) return;
            this.dataShown = want;
            this.dataMeta = meta;
            this.dataFrames = tex;
            this.dataSamplers = sampler;
            this.frame = 0;
            u.uData.value = tex[0];
            u.uData2.value = tex[Math.min(1, tex.length - 1)];
            u.uDataSize.value.set(meta.width, meta.height);
            u.uPalette.value = this.layers.palette(want);
            u.uDataStyle.value.set(...DATA[want].style);
            u.uDataFx.value = DATA[want].fx ?? 0;
            u.uDataBlend.value = 0;
          }).catch((err) => {
            this.dataPending = null;
            this.dataRetryAt = this.time + 20;
            console.warn(`layer ${want} unavailable`, err);
          });
        }
      }
    } else if (want) {
      c.dataMix = Math.min(1, c.dataMix + dt * 0.9);
    }
    u.uDataMix.value = c.dataMix * c.dataMix * (3 - 2 * c.dataMix);
    if (this.dataShown && this.dataFrames.length > 1) {
      this.frame = (this.frame + dt * this.rainSpeed) % this.dataFrames.length;
      const i = Math.floor(this.frame), j = (i + 1) % this.dataFrames.length;
      u.uData.value = this.dataFrames[i];
      u.uData2.value = this.dataFrames[j];
      u.uDataBlend.value = Math.max(this.frame - i, 1e-3);
    }

    // Flow trails.
    const wantFlow = L.flow;
    if (wantFlow !== this.flowShown) {
      c.trail = Math.max(0, c.trail - dt * 1.5);
      if (c.trail <= 0) {
        if (this.flowShown) this.flows[this.flowShown]?.clear();
        this.flowShown = wantFlow && this.flows[wantFlow] ? wantFlow : null;
      }
    } else if (wantFlow) {
      c.trail = Math.min(1, c.trail + dt * 0.6);
    }
    const flow = this.flowShown ? this.flows[this.flowShown] : null;
    if (flow && c.trail > 0) {
      flow.step(dt);
      u.uTrail.value = flow.texture;
    }
    u.uTrailGain.value = c.trail * c.trail;

    // Fires and the station.
    if (this.fires) {
      const m = this.fires.material.uniforms;
      m.uTime.value = this.time;
      m.uOpacity.value = c.fires;
      m.uReveal.value = L.fires ? Math.min(1.06, m.uReveal.value + dt * 0.28) : Math.max(0, m.uReveal.value - dt * 0.8);
      m.uHeight.value = innerHeight;
      this.fires.points.visible = c.fires > 0.002;
    }
    this.station.update(date, c.iss, this.time);
    this.tiles?.update(this.rig, this.renderer);
  }

  /** What is under the cursor. */
  probe(clientX: number, clientY: number): Probe | null {
    const ndc = new Vector2((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.rig.camera);
    const hit = this.raycaster.ray.intersectSphere(this.sphere, new Vector3());
    if (!hit) return null;
    const { lon, lat } = vecToLonLat(hit);
    const L = this.look;
    let text: string | null = null, sub: string | null = null;
    if (L.data && this.dataShown === L.data && this.dataMeta) {
      const s = this.dataSamplers[Math.floor(this.frame) % this.dataSamplers.length];
      const [r, g] = s.read(lon, lat);
      const def = DATA[L.data];
      const land = this.isLand(lon, lat);
      if (g > 0.25 && !(def.style[2] === 1 && land)) text = def.format(def.decode(r, this.dataMeta));
    } else if (L.flow && this.flowSamplers[L.flow]) {
      const { s, scale } = this.flowSamplers[L.flow]!;
      const [r, g, b] = s.read(lon, lat);
      if (b > 0.5) {
        const ue = (r - 0.5) * 2 * scale, vn = (g - 0.5) * 2 * scale;
        const speed = Math.hypot(ue, vn);
        if (L.flow === 'wind') {
          const from = (Math.atan2(-ue, -vn) * 180 / Math.PI + 360) % 360;
          const names = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'];
          text = `${Math.round(speed * 3.6)} km/h`;
          sub = `vento da ${names[Math.round(from / 45) % 8]}`;
        } else {
          text = `${(speed * 3.6).toLocaleString('it-IT', { maximumFractionDigits: 1 })} km/h`;
          const to = (Math.atan2(ue, vn) * 180 / Math.PI + 360) % 360;
          const names = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'];
          sub = `l’acqua scorre verso ${names[Math.round(to / 45) % 8]}`;
        }
      }
    } else if (L.fires && this.fireData) {
      const p = lonLatToVec(lon, lat), q = new Vector3();
      let n = 0;
      const d = this.fireData, cosMax = Math.cos(150 / 6371);
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - lat) > 1.5) continue;
        lonLatToVec(d[i + 1], d[i], 1, q);
        if (q.dot(p) > cosMax) n++;
      }
      text = n ? `${n.toLocaleString('it-IT')} ${n === 1 ? 'fuoco' : 'fuochi'}` : 'nessun fuoco';
      sub = 'entro 150 km, ultimi 7 giorni';
    }
    if (!text) {
      // Local solar time: where the Sun is, it is noon.
      const sunLon = vecToLonLat(this.sunVec).lon;
      let h = 12 + (lon - sunLon) / 15;
      h = ((h % 24) + 24) % 24;
      const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
      text = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const day = hit.clone().normalize().dot(this.sunVec);
      sub = day > 0.05 ? 'ora solare · è giorno' : day < -0.05 ? 'ora solare · è notte' : 'ora solare · crepuscolo';
    }
    return { lon, lat, text, sub };
  }

  private landSampler: Sampler | null = null;
  private isLand(lon: number, lat: number): boolean {
    if (!this.landSampler) {
      const img = (this.u.uRelief.value as Texture).image as HTMLImageElement;
      this.landSampler = Sampler.fromImage(img, 1440);
    }
    return this.landSampler.read(lon, lat)[0] > 0.503;
  }

  flowSampler(id: FlowId) { return this.flowSamplers[id] ?? null; }

  /** Time of the rain frame on screen, while the rain layer plays. */
  dataFrameTime(): string | null {
    if (!this.dataMeta?.frames || this.dataShown !== 'rain') return null;
    return this.dataMeta.frames[Math.floor(this.frame) % this.dataMeta.frames.length]?.time ?? null;
  }
  /** How far through the rain loop the frame on screen is, 0..1. */
  dataFrameProgress(): number {
    const n = this.dataFrames.length;
    return n > 1 ? Math.min(1, this.frame / (n - 1)) : 0;
  }
  screenOf(v: Vector3): { x: number; y: number; visible: boolean } {
    const p = v.clone().project(this.rig.camera);
    const toCam = this.rig.camera.position.clone().sub(v);
    const visible = v.clone().normalize().dot(toCam.normalize()) > 0 && p.z < 1;
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, visible };
  }
}
