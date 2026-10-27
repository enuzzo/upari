import {
  ACESFilmicToneMapping, Clock, HalfFloatType, Raycaster, Scene, ShaderMaterial, Sphere, Texture, Vector2, Vector3, WebGLRenderer,
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
import { createFires, createQuakes, placeIt, Station, type Quake } from './markers';
import { DATA, LayerStore, Sampler, SplitSampler, loadBitmapTexture, loadTexture, type DataId, type LayerMeta } from './layers';
import { gmst, lonLatToVec, moonBrightness, moonDirection, sunDirection, vecToLonLat } from './astro';
import { Tiles } from './tiles';
import { loadSpots, nearestSpot, type SpotId, type SpotSet } from './spots';
import { loadSatellites } from './satellites';
import { createSunBody } from './sunbody';
import { createAuroraCurtains } from './aurora';
import { createTrajectories, type Launch } from './trajectories';
import { createFlyby } from './flyby';
import { createEarthRing } from './ring';
import { ATLAS, Atlas, atlasText, type AtlasId } from './atlas';
import { t } from '../i18n';
import { num } from '../i18n/format';
import { fresh } from './fresh';

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
  /** A statistic drawn on the countries (the atlas). */
  atlas: AtlasId | null;
  /** Population as dust of light, 0..1. */
  dust: number;
  /** Asylum applications as streams, 0..1. */
  migration: number;
  /** The largest routes of asylum from every origin, coloured by region, 0..1. */
  migrationAll: number;
  /** The year to show; with `years`, the years run from the first to the second. */
  year: number | null;
  years: [number, number] | null;
  yearSeconds: number;
  /** A week of earthquakes, 0..1. */
  quakes: number;
  /** Seconds to replay the week in (0: all at once). */
  quakeReplay: number;
  /** Events in places (cyclones, volcanoes, icebergs, slicks, launches, fireballs). */
  spots: SpotId | null;
  /** Seconds to reveal them in the order of their time (0: all at once). */
  spotReplay: number;
  /** Hours of the planet's clock that pass in each second (0: the clock is now). */
  lapse: number;
  /** Every active satellite, 0..1. */
  satellites: number;
  /** The Sun as a body beside the Earth, to scale in size, 0..1. */
  solar: number;
  /** How far the camera may go for this look, planet radii. */
  reach: number;
  /** The ascents set with showRockets, 0..1. */
  rockets: number;
  /** The next asteroid's pass with the Moon's orbit, 0..1. */
  flyby: number;
}

export const DEFAULT_LOOK: Look = {
  sun: 'real', clouds: 1, cloudFlow: 1, night: 1, dim: 0, desat: 0, data: null, flow: null,
  fires: 0, iss: 0, stars: 1, atmo: 1, exposure: 1, relief: 1, bloom: 1, pin: null,
  atlas: null, dust: 0, migration: 0, migrationAll: 0, year: null, years: null, yearSeconds: 18, quakes: 0, quakeReplay: 0,
  spots: null, spotReplay: 0, lapse: 0, satellites: 0, solar: 0, reach: 26, rockets: 0, flyby: 0,
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
  cur = { clouds: 1, cloudFlow: 1, night: 1, dim: 0, desat: 0, fires: 0, iss: 0, stars: 1, atmo: 1, exposure: 1, relief: 1, bloom: 1, dataMix: 0, trail: 0, studio: 0, pin: 0, atlas: 0, dust: 0, migration: 0, migrationAll: 0, quakes: 0, spots: 0, satellites: 0, solar: 0, rockets: 0, flyby: 0 };
  private flybyScene: ReturnType<typeof createFlyby> | null = null;
  private earthRing = createEarthRing();
  private flybyLoading: Promise<void> | null = null;
  private rocketTrails: ReturnType<typeof createTrajectories> | null = null;
  private sunBody = createSunBody();
  private curtains: ReturnType<typeof createAuroraCurtains> | null = null;
  private curtainsFrom: unknown = null;
  private spotSets: Partial<Record<SpotId, SpotSet>> = {};
  private spotShown: SpotId | null = null;
  private spotT0 = 0;
  private sats: Awaited<ReturnType<typeof loadSatellites>> | null = null;
  /** Before and after: a vertical line (CSS px) with the first year or frame left, the last right. */
  private compare: { x: number; from: number; to: number } | null = null;
  private satsLoading: Promise<void> | null = null;
  private quakes: ReturnType<typeof createQuakes> | null = null;
  private quakesLoading: Promise<void> | null = null;
  private quakeT0 = 0;
  readonly atlas = new Atlas();
  private atlasShown: AtlasId | null = null;
  private atlasAdded = false;
  /** The year on screen, fractional while it runs. */
  year = 2024;
  private yearRun: { from: number; to: number; t0: number; seconds: number } | null = null;
  private hoverSlot = -1;
  private hoverAt = 0;
  private flows: Partial<Record<FlowId, FlowField>> = {};
  private flowSamplers: Partial<Record<FlowId, { s: Sampler; scale: number }>> = {};
  private flowShown: FlowId | null = null;
  private dataShown: DataId | null = null;
  private dataMeta: LayerMeta | null = null;
  private dataSamplers: (Sampler | SplitSampler)[] = [];
  private dataFrames: Texture[] = [];
  private dataConf: Texture[] | null = null;
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
  /** The clock was run ahead by a look, and comes back to now when the look lets go. */
  private lapsing = false;
  /** Master gains, tuned by eye. */
  tune = { atmo: 5, haze: 0.85, limb: 2, sun: 2.2, night: 3.2, relief: 9, bloom: 0.6, moon: 0.06, airglow: 0.05 };
  rainSpeed = 1.8;
  /** Opening light, 0 (black) to 1: the planet comes out of the dark instead of popping in. */
  private dawn = 1;
  private dawnSeconds = 1;
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
    // The station's own pass, on top: near the camera, nothing in the planet's scene can hide it.
    const stationPass = new RenderPass(this.station.scene, this.station.camera);
    stationPass.clear = false;
    stationPass.clearDepth = true;
    this.composer.addPass(stationPass);
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
    this.station.setResolution(w, h, this.renderer.getPixelRatio());
  }

  async init(progress: (p: number) => void) {
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    let done = 0;
    const total = 4;
    const tick = <T,>(p: Promise<T>) => p.then((v) => { progress(++done / total); return v; });
    // The stars too: nothing should pop into the opening shot.
    const [day, relief, clouds, night, sky] = await Promise.all([
      tick(loadTexture('earth/day-2k.jpg', { anisotropy: aniso })),
      tick(loadTexture('earth/relief-4k.webp', { anisotropy: 4 })),
      tick(loadTexture('earth/clouds-4k.jpg', { anisotropy: aniso })),
      tick(loadTexture('earth/night-4k.jpg', { anisotropy: aniso })),
      createSky(),
    ]);
    this.u = earthUniforms({ day, night, clouds, relief });
    this.scene.add(createEarth(this.u), createAtmosphere(this.u), this.sun.mesh, this.station.group, this.sunBody.group, this.earthRing.points);
    this.sky = sky;
    this.scene.add(sky.group);
    this.tiles = new Tiles(this.u);
    this.scene.add(this.tiles.group);
    // Sharper textures stream in while the planet comes out of the dark.
    void this.upgrade(aniso);
    void this.station.load();
    void this.loadFlow('wind');
  }

  private async upgrade(aniso: number) {
    const swap = async (key: 'uDay' | 'uNight' | 'uClouds' | 'uRelief', url: string) => {
      // Decoded off the main thread and uploaded at once: an 8k image decoded on upload stalls a frame.
      const t = await loadBitmapTexture(url, aniso);
      this.renderer.initTexture(t);
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
    const meta = await (await fetch(fresh(`fields/${id}.json`))).json();
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
    const buf = await (await fetch(fresh('layers/fires.bin'))).arrayBuffer();
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
    if (look.atlas || look.dust || look.migration || look.migrationAll) jobs.push(this.loadAtlas());
    if (look.quakes) jobs.push(this.loadQuakes());
    if (look.spots) jobs.push(this.loadSpot(look.spots));
    if (look.satellites) jobs.push(this.loadSats());
    if (look.solar) jobs.push(this.sunBody.load());
    if (look.flyby) jobs.push(this.loadFlyby());
    await Promise.all(jobs);
  }

  /** A set of events, added to the scene once. */
  async loadSpot(id: SpotId): Promise<SpotSet> {
    const set = await loadSpots(id);
    if (!this.spotSets[id]) { this.spotSets[id] = set; this.scene.add(set.points); }
    return set;
  }

  loadSats(): Promise<void> {
    this.satsLoading ??= loadSatellites().then((s) => { this.sats = s; this.scene.add(s.points); });
    this.satsLoading.catch(() => { this.satsLoading = null; });
    return this.satsLoading;
  }

  get satellites() { return this.sats?.meta ?? null; }

  loadFlyby(): Promise<void> {
    this.flybyLoading ??= fetch(fresh('sky/neo.json')).then((r) => r.json()).then((d) => {
      if (!d.path || !d.moon) throw new Error('no path');
      this.flybyScene = createFlyby(d.path, d.moon);
      this.scene.add(this.flybyScene.group);
    });
    this.flybyLoading.catch(() => { this.flybyLoading = null; });
    return this.flybyLoading;
  }

  /** The Moon now and the closest point of the pass, Earth-fixed (for labels). */
  flybyPoints() { return this.flybyScene?.fixed(this.now) ?? null; }

  /** Draw the ascents of these launches (shown while the look asks for rockets). */
  showRockets(list: Launch[]) {
    if (this.rocketTrails) { this.scene.remove(this.rocketTrails.points); this.rocketTrails.points.geometry.dispose(); }
    this.rocketTrails = list.length ? createTrajectories(list) : null;
    if (this.rocketTrails) this.scene.add(this.rocketTrails.points);
  }

  /** Compare two years (atlas) or the first and last frame (series) across a line; null stops. */
  setCompare(c: { x: number; from: number; to: number } | null) { this.compare = c; }

  loadQuakes(): Promise<void> {
    this.quakesLoading ??= (async () => {
      const d = await (await fetch(fresh('layers/quakes.json'))).json();
      this.quakes = createQuakes(d.quakes as Quake[], Date.parse(d.newest));
      this.scene.add(this.quakes.points);
    })();
    this.quakesLoading.catch(() => { this.quakesLoading = null; });
    return this.quakesLoading;
  }

  /** The strongest earthquake of the week, once loaded. */
  get strongestQuake(): Quake | null {
    return this.quakes ? this.quakes.list.reduce((a, b) => (b[3] > a[3] ? b : a)) : null;
  }

  get quakeCount() { return this.quakes?.list.length ?? 0; }

  loadAtlas(): Promise<void> {
    return this.atlas.load().then(() => {
      if (this.atlasAdded) return;
      this.atlasAdded = true;
      this.scene.add(this.atlas.dust!, this.atlas.flows!, this.atlas.arcs!);
      if (this.atlas.flowsAll) this.scene.add(this.atlas.flowsAll, this.atlas.arcsAll!);
    });
  }

  /** Show a year (the atlas); `run` makes the years flow from the current one. */
  setYear(year: number) {
    this.yearRun = null;
    this.year = year;
  }

  get yearRunning() { return this.yearRun; }

  setLook(next: Partial<Look>) {
    this.look = { ...DEFAULT_LOOK, ...next };
    if (this.look.years) {
      this.year = this.look.years[0];
      this.yearRun = { from: this.look.years[0], to: this.look.years[1], t0: this.time, seconds: this.look.yearSeconds };
    } else if (this.look.year != null) this.setYear(this.look.year);
    this.quakeT0 = this.time;
    this.spotT0 = this.time;
    void this.prepare(this.look).catch(() => {});
    if (this.look.pin) lonLatToVec(this.look.pin.lon, this.look.pin.lat, 1, this.pinVec);
  }

  get currentLook() { return this.look; }

  /** Compile every shader and upload the first textures behind the black, before anything moves. */
  async warm() {
    this.dawn = 0;
    this.update(0);
    await this.renderer.compileAsync(this.scene, this.rig.camera);
    this.composer.render(0);
  }

  /** Bring the light up from black, like eyes adjusting to the dark. */
  rise(seconds: number) {
    this.dawn = 0;
    this.dawnSeconds = seconds;
  }

  get risen() { return this.dawn >= 1; }

  start() {
    this.clock.start();
    // Adaptive resolution: if frames get slow, render fewer pixels.
    let acc = 0, frames = 0, ratio = this.renderer.getPixelRatio();
    const loop = () => {
      const raw = this.clock.getDelta();
      this.tick(Math.min(raw, 0.1));
      // Not while the planet comes out of the dark: textures are still arriving.
      if (this.dawn < 1) { acc = 0; frames = 0; } else if (document.visibilityState === 'visible' && raw < 0.5) {
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

  /** The frame as it is now, copied to a 2D canvas (read right after drawing, in the same task). */
  snapshot(): HTMLCanvasElement {
    this.composer.render(0);
    const gl = this.renderer.domElement;
    const c = document.createElement('canvas');
    c.width = gl.width; c.height = gl.height;
    c.getContext('2d')!.drawImage(gl, 0, 0);
    return c;
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

    // A day in a minute: the clock runs ahead while the look asks for it.
    if (L.lapse > 0) { this.timeOffset += dt * L.lapse * 3600e3; this.lapsing = true; }
    else if (this.lapsing) { this.lapsing = false; this.timeOffset = 0; }

    // The station moves 7.7 km every second: place it for this frame before the camera follows it.
    const date = this.now;
    this.station.update(date, c.iss, this.time);
    this.rig.update(dt);
    const cam = this.rig.camera;

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
    // From afar the clouds drift with today's winds as a time-lapse; close up that speed tears
    // the 5 km cloud map apart, so the drift slows down and fine texture takes over.
    const close = Math.min(1, Math.max(0, (0.5 - alt) / 0.42));
    u.uCloudFlow.value = c.cloudFlow * (0.55 - 0.54 * close);
    u.uCloudDetail.value = close * close * (3 - 2 * close);
    u.uNightGain.value = this.tune.night * c.night;
    u.uBaseDim.value = c.dim;
    u.uBaseDesat.value = c.desat;
    u.uReliefGain.value = this.tune.relief * c.relief * (0.25 + 0.75 * lowS);
    u.uAtmoPower.value = this.tune.atmo * c.atmo;
    u.uSunPower.value = this.tune.sun;
    u.uHaze.value = this.tune.haze * (0.45 + 0.55 * lowS);
    u.uLimb.value = this.tune.limb;
    // Close to the ground the glint spreads over the whole sea: dim it and give it waves.
    const near = Math.min(1, Math.max(0, (0.35 - alt) / 0.3));
    u.uGlint.value = (1 - c.studio) * (1 - 0.6 * near);
    // Waves break up the glint at every distance; closer, they take over.
    u.uGlintWaves.value = 0.45 + 0.55 * near;
    // Moonlight and airglow are real but faint: exposed like a long night photograph.
    moonDirection(date, this.moonVec);
    const nightK = Math.min(1, c.night) * (1 - c.studio);
    u.uMoon.value.set(this.moonVec.x, this.moonVec.y, this.moonVec.z, this.tune.moon * moonBrightness(this.sunVec, this.moonVec) * nightK);
    u.uAirglow.value = this.tune.airglow * nightK;
    this.dawn = Math.min(1, this.dawn + dt / this.dawnSeconds);
    // Slow at first, as the eye finds the night side, then the day.
    const d = this.dawn * this.dawn * (3 - 2 * this.dawn);
    this.renderer.toneMappingExposure = c.exposure * d * d;
    this.bloom.strength = this.tune.bloom * c.bloom;
    this.sun.place(this.sunVec, cam.position);
    this.sun.mesh.quaternion.copy(cam.quaternion);
    // The comparison Sun takes the place of the distant one.
    c.solar = approach(c.solar, L.solar, dt, 1.2);
    this.sunBody.update(this.sunVec, cam, c.solar, this.time);
    this.sun.mesh.visible = c.studio < 0.5 && c.solar < 0.3;
    this.rig.reach = L.reach;
    this.grain.uniforms.uTime.value = this.time;
    if (this.sky) {
      this.sky.group.rotation.y = -gmst(date);
      // The stars are at infinity: they travel with the camera, however far it goes.
      this.sky.group.position.copy(cam.position);
      this.sky.setOpacity(c.stars);
    }

    // Pin.
    u.uPin.value.set(this.pinVec.x, this.pinVec.y, this.pinVec.z, c.pin);
    u.uPinScale.value = Math.min(1.2, Math.max(0.004, alt / 2.4));

    // Data layer: fade out, swap, fade in.
    const want = L.data;
    if (want !== this.dataShown) {
      c.dataMix = Math.max(0, c.dataMix - dt * 1.6);
      if (c.dataMix <= 0) {
        this.dataShown = null;
        if (want && this.time >= this.dataRetryAt && this.dataPending !== want) {
          this.dataPending = want;
          const pending = this.layers.get(want);
          void pending.then(({ tex, conf, meta, sampler }) => {
            this.dataPending = null;
            if (this.look.data !== want || this.dataShown === want) return;
            this.dataShown = want;
            this.dataMeta = meta;
            this.dataFrames = tex;
            this.dataConf = conf;
            this.dataSamplers = sampler;
            this.frame = 0;
            u.uData.value = tex[0];
            u.uData2.value = tex[Math.min(1, tex.length - 1)];
            u.uDataSplit.value = conf ? 1 : 0;
            if (conf) { u.uConf.value = conf[0]; u.uConf2.value = conf[Math.min(1, conf.length - 1)]; }
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
    u.uSplit.value = this.compare ? this.compare.x * this.renderer.getPixelRatio() : -1;
    if (this.compare && this.dataShown && this.dataFrames.length > 1) {
      // Before and after: the first frame and the last measured one (projections stay out), still.
      const n = this.lastMeasuredFrame();
      u.uData.value = this.dataFrames[0];
      u.uData2.value = this.dataFrames[n];
      if (this.dataConf) { u.uConf.value = this.dataConf[0]; u.uConf2.value = this.dataConf[n]; }
    } else if (this.dataShown && this.dataFrames.length > 1) {
      // Play the series; rest on the last frame, then fade back to the first.
      const def = DATA[this.dataShown], n = this.dataFrames.length;
      const fps = def.fps ?? this.rainSpeed, hold = (def.hold ?? 0) * fps;
      this.frame = (this.frame + dt * fps) % (n - (hold ? 1 : 0) + hold);
      let i: number, j: number, blend: number;
      if (!hold) { i = Math.floor(this.frame); j = (i + 1) % n; blend = this.frame - i; }
      else if (this.frame < n - 1) { i = Math.floor(this.frame); j = i + 1; blend = this.frame - i; }
      else { i = n - 1; j = 0; const k = (this.frame - (n - 1)) / hold; blend = Math.max(0, (k - 0.75) / 0.25); blend = blend * blend * (3 - 2 * blend); }
      u.uData.value = this.dataFrames[i];
      u.uData2.value = this.dataFrames[j];
      if (this.dataConf) { u.uConf.value = this.dataConf[i]; u.uConf2.value = this.dataConf[j]; }
      u.uDataBlend.value = Math.max(blend, 1e-3);
    }

    // The aurora's curtains stand on the oval of the forecast on screen.
    if (this.dataShown === 'aurora' && this.dataSamplers[0] && this.curtainsFrom !== this.dataSamplers[0]) {
      const s = this.dataSamplers[0];
      if (this.curtains) { this.scene.remove(this.curtains.mesh); this.curtains.mesh.geometry.dispose(); }
      this.curtains = createAuroraCurtains((lon, lat) => s.read(lon, lat)[0]);
      this.curtainsFrom = s;
      this.scene.add(this.curtains.mesh);
    }
    if (this.curtains) {
      const m = this.curtains.material.uniforms;
      const k = this.dataShown === 'aurora' ? u.uDataMix.value as number : 0;
      m.uOpacity.value = k;
      m.uTime.value = this.time;
      m.uSun.value.copy(this.sunVec);
      this.curtains.mesh.visible = k > 0.002;
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

    // The atlas: countries, the dust of people, streams of asylum seekers.
    this.updateAtlas(dt);

    // A week of earthquakes, replayed or all at once.
    c.quakes = approach(c.quakes, L.quakes, dt, 1.4);
    if (this.quakes) {
      const m = this.quakes.material.uniforms;
      const k = L.quakeReplay > 0 ? Math.min(1, (this.time - this.quakeT0) / L.quakeReplay) : 1;
      m.uClock.value = this.quakes.week * k;
      m.uTime.value = this.time;
      m.uOpacity.value = c.quakes;
      this.quakes.points.visible = c.quakes > 0.002;
    }

    // Events in places: fade out the old set, then reveal the new one in the order of time.
    if (L.spots !== this.spotShown) {
      c.spots = Math.max(0, c.spots - dt * 1.6);
      if (c.spots <= 0) {
        if (this.spotShown) this.spotSets[this.spotShown]!.points.visible = false;
        this.spotShown = L.spots && this.spotSets[L.spots] ? L.spots : null;
        this.spotT0 = this.time;
      }
    } else if (L.spots) c.spots = Math.min(1, c.spots + dt * 0.9);
    const spotSet = this.spotShown ? this.spotSets[this.spotShown] : null;
    if (spotSet) {
      const m = spotSet.material.uniforms;
      m.uClock.value = L.spotReplay > 0 ? Math.min(1, (this.time - this.spotT0) / L.spotReplay) : 1;
      m.uTime.value = this.time;
      m.uOpacity.value = c.spots;
      spotSet.points.visible = c.spots > 0.002;
    }

    // An asteroid's pass, replayed in twelve seconds.
    c.flyby = approach(c.flyby, L.flyby, dt, 1.4);
    // Slowly: the whole near part of the pass in twenty seconds.
    this.flybyScene?.update(date, this.sunVec, c.flyby, (this.time % 20) / 20);
    // When the Earth is a speck beside the Sun or inside the Moon's orbit, a ring finds it.
    const far = Math.min(1, Math.max(0, (cam.position.length() - 40) / 60));
    const ring = Math.max(c.solar, c.flyby) * far;
    this.earthRing.material.uniforms.uOpacity.value = ring;
    this.earthRing.material.uniforms.uTime.value = this.time;
    this.earthRing.points.visible = ring > 0.01;

    // Rockets climbing from their pads.
    c.rockets = approach(c.rockets, L.rockets, dt, 1.6);
    if (this.rocketTrails) {
      const m = this.rocketTrails.material.uniforms;
      m.uTime.value = this.time;
      m.uOpacity.value = c.rockets;
      this.rocketTrails.points.visible = c.rockets > 0.002;
    }

    // Satellites: where each one is now.
    c.satellites = approach(c.satellites, L.satellites, dt, 1.2);
    if (this.sats) {
      const m = this.sats.material.uniforms;
      m.uMinutes.value = (date.getTime() - this.sats.base) / 60e3;
      m.uGmst.value = gmst(date);
      m.uSun.value.copy(this.sunVec);
      m.uOpacity.value = c.satellites;
      this.sats.points.visible = c.satellites > 0.002;
    }

    // Fires and the station.
    if (this.fires) {
      const m = this.fires.material.uniforms;
      m.uTime.value = this.time;
      m.uOpacity.value = c.fires;
      m.uReveal.value = L.fires ? Math.min(1.06, m.uReveal.value + dt * 0.28) : Math.max(0, m.uReveal.value - dt * 0.8);
      m.uHeight.value = innerHeight;
      this.fires.points.visible = c.fires > 0.002;
    }
    this.station.placeFor(cam, this.sunVec, c.iss, { dir: this.moonVec, brightness: moonBrightness(this.sunVec, this.moonVec) });
    this.tiles?.update(this.rig, this.renderer);
  }

  private updateAtlas(dt: number) {
    const L = this.look, c = this.cur, u = this.u;
    if (this.yearRun) {
      const r = this.yearRun;
      const k = Math.min(1, Math.max(0, (this.time - r.t0) / r.seconds));
      this.year = r.from + (r.to - r.from) * k;
    }
    u.uLossYear.value = this.year - 2000; // forest loss plays on the same clock as the atlas
    if (!this.atlas.ready) { u.uAtlasMix.value = 0; return; }
    const want = L.atlas;
    if (want !== this.atlasShown) {
      c.atlas = Math.max(0, c.atlas - dt * 1.6);
      if (c.atlas <= 0) {
        this.atlasShown = want;
        if (want) {
          const def = ATLAS[want];
          u.uAtlasId.value = this.atlas.idMap!;
          u.uAtlasValues.value = this.atlas.values(want);
          u.uAtlasPalette.value = this.atlas.palette(want);
          u.uAtlasRange.value.set(def.min, def.max, def.curve);
          u.uAtlasFill.value = def.fill ? 1 : 0;
          u.uAtlasYears.value = this.atlas.years.length;
        }
      }
    } else if (want) c.atlas = Math.min(1, c.atlas + dt * 0.9);
    u.uAtlasMix.value = c.atlas * c.atlas * (3 - 2 * c.atlas);
    const at = (year: number) => Math.min(this.atlas.years.length - 1.001, Math.max(0, year - this.atlas.years[0]));
    const yi = at(this.year);
    u.uAtlasYear.value = this.compare ? at(this.compare.from) : yi;
    u.uAtlasYear2.value = this.compare ? at(this.compare.to) : yi;
    if (this.time - this.hoverAt > 0.2) this.hoverSlot = -1;
    u.uAtlasHover.value = this.hoverSlot;
    c.dust = approach(c.dust, L.dust, dt, 1.4);
    c.migration = approach(c.migration, L.migration, dt, 1.4);
    const dust = this.atlas.dust!, flows = this.atlas.flows!;
    dust.visible = c.dust > 0.002;
    flows.visible = this.atlas.arcs!.visible = c.migration > 0.002;
    const am = this.atlas.arcs!.material as ShaderMaterial;
    am.uniforms.uYear.value = this.year - this.atlas.years[0];
    am.uniforms.uOpacity.value = c.migration;
    const dm = dust.material as ShaderMaterial, fm = flows.material as ShaderMaterial;
    dm.uniforms.uYear.value = yi;
    dm.uniforms.uOpacity.value = c.dust;
    fm.uniforms.uYear.value = yi;
    fm.uniforms.uOpacity.value = c.migration;
    fm.uniforms.uTime.value = this.time;
    c.migrationAll = approach(c.migrationAll, L.migrationAll, dt, 1.4);
    if (this.atlas.flowsAll && this.atlas.arcsAll) {
      const fa = this.atlas.flowsAll.material as ShaderMaterial, aa = this.atlas.arcsAll.material as ShaderMaterial;
      this.atlas.flowsAll.visible = this.atlas.arcsAll.visible = c.migrationAll > 0.002;
      fa.uniforms.uYear.value = yi; fa.uniforms.uOpacity.value = c.migrationAll; fa.uniforms.uTime.value = this.time;
      aa.uniforms.uYear.value = this.year - this.atlas.years[0]; aa.uniforms.uOpacity.value = c.migrationAll;
    }
  }

  /** The country under a point of the screen, while the people of the planet are shown. */
  countryUnder(clientX: number, clientY: number): { code: string; name: string; shown: AtlasId; year: number } | null {
    const L = this.look;
    if (!(L.atlas || L.migration || L.migrationAll) || !this.atlas.ready) return null;
    const ndc = new Vector2((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.rig.camera);
    const hit = this.raycaster.ray.intersectSphere(this.sphere, new Vector3());
    if (!hit) return null;
    const { lon, lat } = vecToLonLat(hit);
    const c = this.atlas.countryAt(lon, lat);
    if (!c?.stat) return null;
    return { code: c.stat, name: c.name, shown: L.atlas ?? 'population', year: Math.round(this.year) };
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
    if ((L.atlas || L.migration) && this.atlas.ready) {
      const country = this.atlas.countryAt(lon, lat);
      if (country) {
        this.hoverSlot = country.stat ? this.atlas.slots.get(country.stat) ?? -1 : -1;
        this.hoverAt = this.time;
        const year = Math.round(this.year);
        const seen = L.atlas && country.stat ? this.atlas.measured(L.atlas, country.stat, year) : null;
        sub = `${country.name} · ${seen && seen.year !== year ? t.probe.measured(seen.year) : year}`;
        if (L.migration && country.stat) {
          const n = this.atlas.asylumByCountry[country.stat]?.[year - this.atlas.years[0]];
          text = n ? t.probe.asylum(num(n)) : t.probe.noAsylum;
        } else if (L.atlas) {
          const v = country.stat ? this.atlas.value(L.atlas, country.stat, year) : null;
          text = v == null ? t.probe.noData : atlasText(L.atlas).format(v);
        }
        return { lon, lat, text, sub };
      }
    }
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
          text = `${num(speed * 3.6)} ${t.units.kmh}`;
          sub = t.probe.windFrom(t.probe.directions[Math.round(from / 45) % 8]);
        } else {
          const kmh = speed * 3.6;
          text = `${num(kmh, kmh < 10 && kmh % 1 > 0.05 ? 1 : 0)} ${t.units.kmh}`;
          const to = (Math.atan2(ue, vn) * 180 / Math.PI + 360) % 360;
          sub = t.probe.waterTo(t.probe.directions[Math.round(to / 45) % 8]);
        }
      }
    } else if (L.spots && this.spotShown === L.spots) {
      const set = this.spotSets[L.spots]!;
      const clock = set.material.uniforms.uClock.value as number;
      const s = nearestSpot(set, lon, lat, L.spots === 'cyclones' ? 220 : L.spots === 'slicks' ? 120 : 300, clock);
      if (s) { text = s.text(); sub = s.sub(); }
    } else if (L.quakes && this.quakes) {
      // The nearest earthquake within about 300 km.
      const p = lonLatToVec(lon, lat), q = new Vector3();
      let best: Quake | null = null, bestDot = Math.cos(300 / 6371);
      for (const e of this.quakes.list) {
        if (Math.abs(e[1] - lat) > 3) continue;
        const d = lonLatToVec(e[0], e[1], 1, q).dot(p);
        if (d > bestDot) { bestDot = d; best = e; }
      }
      if (best) {
        const hours = (Date.now() - best[4]) / 3600e3;
        const ago = hours < 1 ? t.probe.lessThanHour : hours < 48 ? t.probe.hoursAgo(Math.round(hours)) : t.probe.daysAgo(Math.round(hours / 24));
        text = t.probe.magnitude(num(best[3], 1));
        sub = t.probe.quake(placeIt(best[5]), num(best[2]), ago);
      } else { text = t.probe.noQuake; sub = t.probe.noQuakeSub; }
    } else if (L.fires && this.fireData) {
      const p = lonLatToVec(lon, lat), q = new Vector3();
      let n = 0;
      const d = this.fireData, cosMax = Math.cos(150 / 6371);
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - lat) > 1.5) continue;
        lonLatToVec(d[i + 1], d[i], 1, q);
        if (q.dot(p) > cosMax) n++;
      }
      text = n ? t.probe.fires(n, num(n)) : t.probe.noFire;
      sub = t.probe.firesSub;
    }
    if (!text) {
      // Local solar time: where the Sun is, it is noon.
      const sunLon = vecToLonLat(this.sunVec).lon;
      let h = 12 + (lon - sunLon) / 15;
      h = ((h % 24) + 24) % 24;
      const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
      text = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const day = hit.clone().normalize().dot(this.sunVec);
      sub = day > 0.05 ? t.probe.solarDay : day < -0.05 ? t.probe.solarNight : t.probe.solarDusk;
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

  /** Time and cadence of the frame on screen, while a series plays. */
  dataFrameTime(): { time: string; first: string; last: string; cadence: 'hour' | 'day' | 'month' | 'year' } | null {
    const frames = this.dataMeta?.frames;
    if (!frames || frames.length < 2 || !this.dataShown) return null;
    const i = Math.min(frames.length - 1, Math.round(this.frame));
    return { time: frames[i].time, first: frames[0].time, last: frames[frames.length - 1].time, cadence: this.dataMeta!.cadence ?? 'hour' };
  }
  /** The last frame that is a measurement (GHSL projects 2025 and 2030). */
  lastMeasuredFrame(): number {
    const frames = this.dataMeta?.frames ?? [];
    const projected = (this.dataMeta as { projected?: number[] } | null)?.projected ?? [];
    let k = frames.length - 1;
    while (k > 0 && projected.includes(Number(frames[k].time.slice(0, 4)))) k--;
    return Math.max(0, k);
  }

  /** Time of that frame, for labels. */
  lastMeasuredTime(): string | null {
    return this.dataMeta?.frames?.[this.lastMeasuredFrame()]?.time ?? null;
  }

  /** How far through the series the frame on screen is, 0..1. */
  /** How far the replay of the spots on show has gone, 0..1 (null: no replay running). */
  spotProgress(): number | null {
    const set = this.spotShown ? this.spotSets[this.spotShown] : null;
    return set && this.look.spotReplay > 0 && this.cur.spots > 0.05 ? (set.material.uniforms.uClock.value as number) : null;
  }

  dataFrameProgress(): number {
    const n = this.dataFrames.length;
    return n > 1 ? Math.min(1, this.frame / (n - 1)) : 0;
  }
  screenOf(v: Vector3): { x: number; y: number; visible: boolean } {
    const p = v.clone().project(this.rig.camera);
    // Hidden when the line of sight meets the planet before it reaches the point: this holds
    // for places on the ground and for things far out in space alike.
    const cam = this.rig.camera.position;
    const d = v.clone().sub(cam), len = d.length();
    d.divideScalar(len);
    const b = cam.dot(d), disc = b * b - (cam.lengthSq() - 1);
    const occluded = disc > 0 && -b - Math.sqrt(disc) > 0 && -b - Math.sqrt(disc) < len * (1 - 1e-3) - 1e-4;
    const inFront = v.clone().sub(cam).dot(this.rig.camera.getWorldDirection(new Vector3())) > 0;
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, visible: inFront && !occluded && p.z < 1 };
  }
}
