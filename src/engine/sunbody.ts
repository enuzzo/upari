import { AdditiveBlending, Group, Mesh, PlaneGeometry, ShaderMaterial, SphereGeometry, Texture, Vector3 } from 'three';
import { noiseGLSL } from './glsl';
import { loadTexture } from './layers';
import { fresh } from './fresh';

// The Sun as a body, for comparison: 109 times the Earth's radius, placed beside the planet
// in the true direction of the Sun but far nearer than it really is (to scale in size, not in
// distance). The side facing us moves through the last twenty-four hours seen by SDO/AIA at
// 304 Å (the chromosphere, in the red and yellow of its usual colours), darkened where this
// morning's HMI image in visible light shows sunspots; the rest is boiling granulation in the
// same colours. Limb darkening and a corona with prominences complete it.

export const SUN_RADIUS = 109.1; // Earth radii
/** How far the comparison Sun stands from the Earth's centre, in Earth radii. */
export const SUN_DISTANCE = 300;
/** The day at 304 Å: frames in the atlas (sky/sun-304.jpg), and the Sun's radius in a frame. */
const ATLAS = { cols: 8, rows: 4, radius: 0.405 };

export function createSunBody() {
  const group = new Group();
  group.visible = false;
  const uniforms = {
    uTime: { value: 0 }, uOpacity: { value: 0 }, uImage: { value: null as Texture | null }, uHasImage: { value: 0 },
    // The last day at 304 Å: an atlas of COLS × ROWS frames, played in a loop.
    uAtlas: { value: null as Texture | null }, uHasAtlas: { value: 0 }, uFrame: { value: 0 },
    uToEarth: { value: new Vector3(-1, 0, 0) },
  };
  const surface = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vWorld;
      void main() { vN = normalize(position); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime, uOpacity, uHasImage, uHasAtlas, uFrame;
      uniform sampler2D uImage, uAtlas;
      // The colours of the Sun at 304 Å, from the dark of the cool gas to the white of a flare.
      vec3 fire(float L) {
        vec3 c = mix(vec3(0.32, 0.03, 0.0), vec3(0.95, 0.22, 0.02), smoothstep(0.0, 0.38, L));
        c = mix(c, vec3(1.0, 0.55, 0.08), smoothstep(0.32, 0.62, L));
        c = mix(c, vec3(1.0, 0.86, 0.42), smoothstep(0.58, 0.86, L));
        return mix(c, vec3(1.0, 0.98, 0.86), smoothstep(0.86, 1.05, L));
      }
      vec3 tile(float f, vec2 uv) {
        f = mod(f, ${ATLAS.cols * ATLAS.rows}.0);
        float col = mod(f, ${ATLAS.cols}.0), row = floor(f / ${ATLAS.cols}.0);
        return texture2D(uAtlas, vec2((col + uv.x) / ${ATLAS.cols}.0, (${ATLAS.rows - 1}.0 - row + uv.y) / ${ATLAS.rows}.0)).rgb;
      }
      uniform vec3 uToEarth;
      varying vec3 vN; varying vec3 vWorld;
      void main() {
        vec3 view = normalize(cameraPosition - vWorld);
        float mu = clamp(dot(vN, view), 0.0, 1.0);
        // Limb darkening of the photosphere (Eddington-like, warmer at the edge): the volume.
        float limb = 0.22 + 0.78 * pow(mu, 0.55) + 0.12 * pow(mu, 6.0);
        // Where no image reaches: granulation, a thousand kilometres across, and slow swirls
        // of brighter and darker gas, boiling.
        float g = fbm(vN * 160.0 + vec3(0.0, 0.0, uTime * 0.05));
        float cells = 0.85 + 0.3 * smoothstep(0.35, 0.75, g);
        float swirl = fbm(vN * 9.0 + vec3(uTime * 0.03, 0.0, -uTime * 0.02));
        float regions = fbm(vN * 3.5 + vec3(0.0, uTime * 0.01, 0.0));
        float L = (0.5 + 0.24 * swirl + 0.22 * smoothstep(0.62, 0.8, regions)) * cells;
        float spots = 1.0;
        // The face seen from the Earth (solar north up).
        vec3 z = normalize(uToEarth), x = normalize(cross(vec3(0.0, 1.0, 0.0), z)), y = cross(z, x);
        float facing = dot(vN, z);
        vec2 d = vec2(dot(vN, x), dot(vN, y));
        float face = smoothstep(0.15, 0.45, facing);
        if (uHasAtlas > 0.5 && facing > 0.0) {
          // The last day at 304 Å, frame after frame, each fading into the next.
          vec2 uv = d * ${ATLAS.radius} + 0.5;
          float f0 = floor(uFrame);
          vec3 c = mix(tile(f0, uv), tile(f0 + 1.0, uv), fract(uFrame));
          L = mix(L, dot(c, vec3(0.62, 0.5, 0.05)) * 1.15, face);
        }
        if (uHasImage > 0.5 && facing > 0.0) {
          // This morning in visible light: where it is much darker than the disc around it,
          // a sunspot. HMI holds the limb darkening seen from the Earth: divide it out.
          float img = texture2D(uImage, d * 0.47 + 0.5).r;
          float seen = 0.22 + 0.78 * pow(facing, 0.55) + 0.12 * pow(facing, 6.0);
          spots = mix(1.0, 0.12 + 0.88 * smoothstep(0.35, 0.85, img / max(seen, 0.3)), face);
        }
        // A little contrast, so the cool gas goes red and the active regions yellow.
        vec3 col = fire(pow(L * limb * spots, 1.45) * 1.25);
        gl_FragColor = vec4(col * uOpacity, 1.0);
      }`,
    transparent: true,
  });
  const body = new Mesh(new SphereGeometry(SUN_RADIUS, 128, 64), surface);
  body.frustumCulled = false;
  group.add(body);

  // The corona: a camera-facing glow three radii wide.
  const corona = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uOpacity, uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p) * 3.4; // in solar radii
        if (r < 0.98) discard;
        float a = atan(p.y, p.x);
        float streams = 0.75 + 0.25 * fbm(vec3(cos(a) * 3.0, sin(a) * 3.0, r * 0.6 - uTime * 0.02));
        float glow = (exp(-(r - 1.0) * 5.0) * 0.35 + exp(-(r - 1.0) * 1.4) * 0.05) * streams;
        glow *= smoothstep(3.4, 2.4, r); // nothing left at the edge of the quad
        // The chromosphere, a thin red rim, and prominences: tongues and loops of hydrogen
        // rising from the edge, where the noise of the surface field is strongest.
        float rim = exp(-pow((r - 1.004) / 0.012, 2.0)) * 0.8;
        float field = fbm(vec3(cos(a) * 4.0, sin(a) * 4.0, uTime * 0.02));
        float tongues = smoothstep(0.6, 0.78, field) * exp(-(r - 1.0) * 16.0);
        float loops = smoothstep(0.58, 0.85, fbm(vec3(a * 10.0, (r - 1.0) * 22.0 - uTime * 0.04, 2.3)))
          * smoothstep(1.16, 1.02, r) * smoothstep(0.58, 0.74, field);
        vec3 h = vec3(1.0, 0.3, 0.16) * (rim + tongues * 1.5 + loops * 1.2);
        gl_FragColor = vec4((vec3(1.0, 0.68, 0.36) * glow + h) * uOpacity, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const halo = new Mesh(new PlaneGeometry(SUN_RADIUS * 6.8, SUN_RADIUS * 6.8), corona);
  halo.frustumCulled = false;
  group.add(halo);

  let loading: Promise<void> | null = null;
  return {
    group,
    /** This morning's visible-light image, once. */
    load() {
      loading ??= Promise.all([
        loadTexture(fresh('sky/sun-hmi.jpg'), { mipmaps: true, repeat: false })
          .then((t) => { uniforms.uImage.value = t; uniforms.uHasImage.value = 1; }),
        loadTexture(fresh('sky/sun-304.jpg'), { mipmaps: true, repeat: false })
          .then((t) => { uniforms.uAtlas.value = t; uniforms.uHasAtlas.value = 1; }),
      ].map((p) => p.catch(() => {}))).then(() => {});
      return loading;
    },
    update(sunDir: Vector3, camera: { position: Vector3; quaternion: import('three').Quaternion }, opacity: number, time: number) {
      group.visible = opacity > 0.003;
      if (!group.visible) return;
      body.position.copy(sunDir).multiplyScalar(SUN_DISTANCE);
      halo.position.copy(body.position);
      halo.quaternion.copy(camera.quaternion);
      uniforms.uToEarth.value.copy(sunDir).negate();
      uniforms.uOpacity.value = opacity;
      uniforms.uTime.value = time;
      // The day in sixteen seconds, two frames a second.
      uniforms.uFrame.value = (time * 2) % (ATLAS.cols * ATLAS.rows);
    },
  };
}
