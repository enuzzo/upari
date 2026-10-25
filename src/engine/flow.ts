import {
  BufferAttribute, BufferGeometry, DataTexture, FloatType, Points, Mesh, NearestFilter, OrthographicCamera,
  PlaneGeometry, RGBAFormat, Scene, ShaderMaterial, Texture, Vector3, WebGLRenderer, WebGLRenderTarget, LinearFilter,
  RepeatWrapping, ClampToEdgeWrapping, AdditiveBlending, NoBlending, UnsignedByteType, Vector2,
} from 'three';

export interface FlowStyle {
  /** Field encoding scale (m/s at full channel). */
  scale: number;
  /** Time-lapse factor applied to the real speed. */
  speed: number;
  /** Speed (m/s) that maps to the top of the palette. */
  vmax: number;
  /** Colours from calm to fast, linear RGB (HDR allowed). */
  colors: [number, number, number][];
  life: number;
  fade: number;
  intensity: number;
  curve?: [number, number];
  /** Per-place brightness, 0..1 (see coherenceTexture). */
  weight?: Texture;
}

/**
 * How organised the flow is around each place: |mean velocity| / mean speed over a
 * box of `radius` texels. A steady current scores near 1; eddies, whose velocities
 * cancel, score low. Used to calm the eddies without hiding them.
 */
export function coherenceTexture(img: CanvasImageSource & { width: number; height: number }, radius: number): DataTexture {
  const W = img.width, H = img.height;
  const c = new OffscreenCanvas(W, H);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, W, H).data;
  const n = W * H;
  const ch = [new Float32Array(n), new Float32Array(n), new Float32Array(n), new Float32Array(n)]; // u, v, speed, valid
  for (let i = 0; i < n; i++) {
    if (px[i * 4 + 2] < 128) continue;
    const u = px[i * 4] / 255 - 0.5, v = px[i * 4 + 1] / 255 - 0.5;
    ch[0][i] = u; ch[1][i] = v; ch[2][i] = Math.hypot(u, v); ch[3][i] = 1;
  }
  // Separable box sums; longitude wraps, latitude clamps.
  const tmp = new Float32Array(n);
  for (const a of ch) {
    for (let y = 0; y < H; y++) {
      let s = 0;
      for (let k = -radius; k <= radius; k++) s += a[y * W + ((k % W) + W) % W];
      for (let x = 0; x < W; x++) {
        tmp[y * W + x] = s;
        s += a[y * W + (x + radius + 1) % W] - a[y * W + ((x - radius) % W + W) % W];
      }
    }
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        let s = 0;
        for (let k = Math.max(0, y - radius); k <= Math.min(H - 1, y + radius); k++) s += tmp[k * W + x];
        a[y * W + x] = s;
      }
    }
  }
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const k = ch[2][i] > 1e-6 ? Math.hypot(ch[0][i], ch[1][i]) / ch[2][i] : 0;
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = Math.round(Math.min(1, k) * 255);
    out[i * 4 + 3] = 255;
  }
  // Rows go south to north in WebGL, like the field texture once flipped.
  const flipped = new Uint8Array(n * 4);
  for (let y = 0; y < H; y++) flipped.set(out.subarray(y * W * 4, (y + 1) * W * 4), (H - 1 - y) * W * 4);
  const t = new DataTexture(flipped, W, H, RGBAFormat);
  t.magFilter = t.minFilter = LinearFilter;
  t.wrapS = RepeatWrapping;
  t.wrapT = ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

const white = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat);
white.needsUpdate = true;

const quadVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const commonGLSL = /* glsl */ `
float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec2 spawn(vec2 seed) {
  float u = rnd(seed);
  float lat = asin(rnd(seed + 7.31) * 2.0 - 1.0);
  return vec2(u, 0.5 + lat / 3.141592653589793);
}
`;

const updateFragment = /* glsl */ `
precision highp float;
uniform sampler2D uState;
uniform sampler2D uField;
uniform float uDt;
uniform float uTime;
uniform float uScale;
uniform float uSpeed;
uniform float uLife;
varying vec2 vUv;
${commonGLSL}
void main() {
  vec4 s = texture2D(uState, vUv);
  vec4 f = texture2D(uField, s.xy);
  vec2 vel = (f.rg - 0.5) * 2.0 * uScale;
  float lat = (s.y - 0.5) * 3.141592653589793;
  vec2 duv = vec2(vel.x / (2.0 * 3.141592653589793 * 6371000.0 * max(cos(lat), 0.05)), vel.y / (3.141592653589793 * 6371000.0)) * uSpeed * uDt;
  vec2 p = s.xy + duv;
  p.x = fract(p.x);
  float age = s.z + uDt;
  float life = uLife * (0.55 + 0.9 * rnd(vUv * 31.7 + s.w));
  bool dead = age > life || f.b < 0.5 || p.y < 0.015 || p.y > 0.985 || rnd(vUv + uTime) < 0.0015;
  if (dead) { p = spawn(vUv * 91.7 + uTime * 0.37 + s.w); age = 0.0; }
  gl_FragColor = vec4(p, age, s.w);
}
`;

const drawVertex = /* glsl */ `
precision highp float;
uniform sampler2D uCurr;
uniform sampler2D uField;
uniform sampler2D uWeight;
uniform float uScale;
uniform float uVmax;
uniform float uSize;
attribute vec2 ref;
varying float vSpeed;
varying float vAge;
varying float vWeight;
void main() {
  vec4 b = texture2D(uCurr, ref);
  vec4 f = texture2D(uField, b.xy);
  vSpeed = clamp(length((f.rg - 0.5) * 2.0 * uScale) / uVmax, 0.0, 1.0);
  vWeight = texture2D(uWeight, b.xy).r;
  vAge = b.z;
  bool skip = f.b < 0.5 || b.z < 0.02;
  gl_Position = skip ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(b.xy * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = skip ? 0.0 : uSize;
}
`;

const drawFragment = /* glsl */ `
precision highp float;
uniform vec3 uColors[5];
uniform float uIntensity;
uniform vec2 uCurve; // x: floor, y: gamma
uniform vec2 uCalm;  // coherence below x is dimmed to y
varying float vSpeed;
varying float vAge;
varying float vWeight;
void main() {
  float x = vSpeed * 4.0;
  int i = int(min(floor(x), 3.0));
  vec3 c = mix(uColors[i], uColors[i + 1], fract(x));
  if (x >= 4.0) c = uColors[4];
  float fadeIn = smoothstep(0.0, 0.8, vAge);
  float calm = mix(uCalm.y, 1.0, smoothstep(uCalm.x * 0.35, uCalm.x, vWeight));
  gl_FragColor = vec4(c * uIntensity * fadeIn * calm * (uCurve.x + 1.1 * pow(vSpeed, uCurve.y)), 1.0);
}
`;

const fadeFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTrail;
uniform float uFade;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uTrail, vUv);
  gl_FragColor = max(c * uFade - vec4(1.2 / 255.0), vec4(0.0));
}
`;

export class FlowField {
  readonly trailSize: [number, number];
  private state: WebGLRenderTarget[];
  private trail: WebGLRenderTarget[];
  private cur = 0;
  private trailCur = 0;
  private scene = new Scene();
  private cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: Mesh;
  private updateMat: ShaderMaterial;
  private fadeMat: ShaderMaterial;
  private drawMat: ShaderMaterial;
  private lines: Points;
  private lineScene = new Scene();
  private initialState: DataTexture;
  private first = true;
  time = 0;

  constructor(private renderer: WebGLRenderer, private field: Texture, private style: FlowStyle, count = 256, trailSize: [number, number] = [4096, 2048]) {
    this.trailSize = trailSize;
    field.magFilter = field.minFilter = LinearFilter;
    field.wrapS = RepeatWrapping;
    field.wrapT = ClampToEdgeWrapping;
    field.generateMipmaps = false;
    field.needsUpdate = true;
    const rt = () => new WebGLRenderTarget(count, count, { type: FloatType, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: false });
    this.state = [rt(), rt()];
    const trt = () => {
      const t = new WebGLRenderTarget(trailSize[0], trailSize[1], { type: UnsignedByteType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
      t.texture.wrapS = RepeatWrapping;
      return t;
    };
    this.trail = [trt(), trt()];

    const init = new Float32Array(count * count * 4);
    for (let i = 0; i < count * count; i++) {
      init[i * 4] = Math.random();
      init[i * 4 + 1] = 0.5 + Math.asin(Math.random() * 2 - 1) / Math.PI;
      init[i * 4 + 2] = Math.random() * style.life;
      init[i * 4 + 3] = Math.random() * 100;
    }
    this.initialState = new DataTexture(init, count, count, RGBAFormat, FloatType);
    this.initialState.needsUpdate = true;

    this.updateMat = new ShaderMaterial({
      uniforms: {
        uState: { value: this.initialState }, uField: { value: field }, uDt: { value: 0 }, uTime: { value: 0 },
        uScale: { value: style.scale }, uSpeed: { value: style.speed }, uLife: { value: style.life },
      },
      vertexShader: quadVertex, fragmentShader: updateFragment, blending: NoBlending, depthTest: false, depthWrite: false,
    });
    this.fadeMat = new ShaderMaterial({
      uniforms: { uTrail: { value: null }, uFade: { value: style.fade } },
      vertexShader: quadVertex, fragmentShader: fadeFragment, blending: NoBlending, depthTest: false, depthWrite: false,
    });
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.updateMat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    const n = count * count;
    const ref = new Float32Array(n * 2), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) ref.set([((i % count) + 0.5) / count, (Math.floor(i / count) + 0.5) / count], i * 2);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('ref', new BufferAttribute(ref, 2));
    const colors = style.colors.map((c) => new Vector3(...c));
    while (colors.length < 5) colors.push(colors[colors.length - 1].clone());
    this.drawMat = new ShaderMaterial({
      uniforms: {
        uCurr: { value: null }, uField: { value: field }, uWeight: { value: style.weight ?? white }, uCalm: { value: new Vector2(0.8, style.weight ? 0.22 : 1) },
        uScale: { value: style.scale }, uSize: { value: 1.6 },
        uVmax: { value: style.vmax }, uColors: { value: colors.slice(0, 5) }, uIntensity: { value: style.intensity }, uCurve: { value: new Vector2(...(style.curve ?? [0.15, 1.3])) },
      },
      vertexShader: drawVertex, fragmentShader: drawFragment, blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
    });
    this.lines = new Points(geo, this.drawMat);
    this.lines.frustumCulled = false;
    this.lineScene.add(this.lines);
  }

  get texture(): Texture { return this.trail[this.trailCur].texture; }

  step(dt: number) {
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const autoClear = r.autoClear;
    r.autoClear = false;
    this.time += dt;
    const steps = dt > 1 / 45 ? 2 : 1;
    for (let k = 0; k < steps; k++) {
      const h = Math.min(dt / steps, 1 / 30);
      const read = this.first ? this.initialState : this.state[this.cur].texture;
      const write = this.state[1 - this.cur];
      this.updateMat.uniforms.uState.value = read;
      this.updateMat.uniforms.uDt.value = h;
      this.updateMat.uniforms.uTime.value = this.time + k * 0.013;
      this.quad.material = this.updateMat;
      r.setRenderTarget(write);
      r.render(this.scene, this.cam);

      // Fade the previous trails, then draw the new segments on top.
      const tRead = this.trail[this.trailCur], tWrite = this.trail[1 - this.trailCur];
      this.fadeMat.uniforms.uTrail.value = tRead.texture;
      this.quad.material = this.fadeMat;
      r.setRenderTarget(tWrite);
      r.render(this.scene, this.cam);
      this.drawMat.uniforms.uCurr.value = write.texture;
      r.render(this.lineScene, this.cam);

      this.cur = 1 - this.cur;
      this.trailCur = 1 - this.trailCur;
      this.first = false;
    }
    r.setRenderTarget(prevTarget);
    r.autoClear = autoClear;
  }

  clear() {
    const r = this.renderer, prev = r.getRenderTarget();
    for (const t of this.trail) { r.setRenderTarget(t); r.clear(); }
    r.setRenderTarget(prev);
  }

  dispose() {
    [...this.state, ...this.trail].forEach((t) => t.dispose());
    this.updateMat.dispose(); this.fadeMat.dispose(); this.drawMat.dispose();
    this.lines.geometry.dispose(); this.initialState.dispose();
  }
}
