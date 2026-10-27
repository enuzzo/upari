import { AdditiveBlending, Group, Mesh, PlaneGeometry, ShaderMaterial, SphereGeometry, Texture, Vector3 } from 'three';
import { noiseGLSL } from './glsl';
import { loadTexture } from './layers';

// The Sun as a body, for comparison: 109 times the Earth's radius, placed beside the planet
// in the true direction of the Sun but far nearer than it really is (to scale in size, not in
// distance). The side facing us wears this morning's SDO/HMI image in visible light, with its
// real sunspots; the rest is granulation. Limb darkening and a soft corona complete it.

export const SUN_RADIUS = 109.1; // Earth radii
/** How far the comparison Sun stands from the Earth's centre, in Earth radii. */
export const SUN_DISTANCE = 300;

export function createSunBody() {
  const group = new Group();
  group.visible = false;
  const uniforms = {
    uTime: { value: 0 }, uOpacity: { value: 0 }, uImage: { value: null as Texture | null }, uHasImage: { value: 0 },
    uToEarth: { value: new Vector3(-1, 0, 0) },
  };
  const surface = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vWorld;
      void main() { vN = normalize(position); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform float uTime, uOpacity, uHasImage;
      uniform sampler2D uImage;
      uniform vec3 uToEarth;
      varying vec3 vN; varying vec3 vWorld;
      void main() {
        vec3 view = normalize(cameraPosition - vWorld);
        float mu = clamp(dot(vN, view), 0.0, 1.0);
        // Limb darkening of the photosphere (Eddington-like, warmer at the edge).
        float limb = 0.3 + 0.7 * pow(mu, 0.6);
        // Granulation: cells of rising gas, a thousand kilometres across, slowly boiling.
        float g = fbm(vN * 160.0 + vec3(0.0, 0.0, uTime * 0.05));
        float cells = 0.85 + 0.3 * smoothstep(0.35, 0.75, g);
        float I = limb * cells;
        // The face seen from the Earth: this morning's image (solar north up).
        vec3 z = normalize(uToEarth), x = normalize(cross(vec3(0.0, 1.0, 0.0), z)), y = cross(z, x);
        float facing = dot(vN, z);
        if (uHasImage > 0.5 && facing > 0.0) {
          vec2 uv = vec2(dot(vN, x), dot(vN, y)) * 0.47 + 0.5;
          float img = texture2D(uImage, uv).r;
          // HMI already holds the limb darkening; keep its spots, lend it the cells.
          float shown = img * 1.15 * (0.92 + 0.16 * smoothstep(0.35, 0.75, g));
          I = mix(I, shown, smoothstep(0.05, 0.25, facing));
        }
        vec3 white = vec3(1.0, 0.93, 0.78), edge = vec3(1.0, 0.52, 0.22);
        vec3 col = mix(edge, white, smoothstep(0.0, 0.8, mu)) * I * 1.05;
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
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * glow * uOpacity, 1.0);
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
      loading ??= loadTexture('sky/sun-hmi.jpg', { mipmaps: true, repeat: false })
        .then((t) => { uniforms.uImage.value = t; uniforms.uHasImage.value = 1; })
        .catch(() => {});
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
    },
  };
}
