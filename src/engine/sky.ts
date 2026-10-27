import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Group, Mesh, Points, ShaderMaterial, SphereGeometry, Vector3, BackSide,
} from 'three';
import { noiseGLSL } from './glsl';

/** Blackbody approximation, temperature (K) to linear RGB. */
function kelvin(t: number): [number, number, number] {
  t = Math.max(1000, Math.min(40000, t)) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (x: number) => Math.pow(Math.max(0, Math.min(255, x)) / 255, 2.2);
  return [c(r), c(g), c(b)];
}

export async function createSky(): Promise<{ group: Group; setOpacity: (v: number) => void }> {
  const group = new Group();
  const buf = await (await fetch('sky/stars.bin')).arrayBuffer();
  const data = new Float32Array(buf);
  const n = data.length / 4;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
  const R = 300;
  for (let i = 0; i < n; i++) {
    const ra = data[i * 4], dec = data[i * 4 + 1], mag = data[i * 4 + 2], temp = data[i * 4 + 3];
    pos.set([Math.cos(dec) * Math.cos(ra) * R, Math.sin(dec) * R, -Math.cos(dec) * Math.sin(ra) * R], i * 3);
    const [r, g, b] = kelvin(temp);
    // Mildly desaturate: real stars look whiter than pure blackbody colours.
    const l = (r + g + b) / 3;
    const flux = Math.pow(10, -0.4 * (mag - 1.0));
    col.set([(r * 0.6 + l * 0.4) * flux, (g * 0.6 + l * 0.4) * flux, (b * 0.6 + l * 0.4) * flux], i * 3);
    size[i] = Math.max(1.1, 3.4 - mag * 0.42);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('color', new BufferAttribute(col, 3));
  geo.setAttribute('size', new BufferAttribute(size, 1));
  const starMat = new ShaderMaterial({
    uniforms: { uOpacity: { value: 1 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: /* glsl */ `
      attribute vec3 color; attribute float size;
      uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_Position.z = gl_Position.w * 0.99999;
        gl_PointSize = size * uPixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d) * 2.0;
        float core = exp(-r * r * 6.0);
        gl_FragColor = vec4(vColor * core * uOpacity * 1.6, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const stars = new Points(geo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = -2;
  group.add(stars);

  // The Milky Way: a faint band along the galactic plane with dust lanes.
  // Galactic north pole and centre in equatorial coordinates (J2000).
  const eq = (raDeg: number, decDeg: number) => {
    const ra = raDeg * Math.PI / 180, dec = decDeg * Math.PI / 180;
    return new Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra));
  };
  const milky = new ShaderMaterial({
    uniforms: { uPole: { value: eq(192.859, 27.128) }, uCenter: { value: eq(266.405, -28.936) }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      ${noiseGLSL}
      uniform vec3 uPole; uniform vec3 uCenter; uniform float uOpacity;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float b = asin(clamp(dot(d, uPole), -1.0, 1.0));
        float toCenter = dot(normalize(d - uPole * dot(d, uPole)), uCenter);
        float core = 0.55 + 0.45 * smoothstep(-0.2, 1.0, toCenter);
        float band = exp(-pow(b / 0.16, 2.0)) * core;
        float glow = exp(-pow(b / 0.45, 2.0)) * 0.25 * core;
        float n = fbm(d * 7.0);
        float dust = smoothstep(0.42, 0.68, fbm(d * 13.0 + 3.1)) * exp(-pow(b / 0.05, 2.0));
        float clumps = smoothstep(0.35, 0.85, n);
        vec3 tint = mix(vec3(0.55, 0.62, 0.85), vec3(0.95, 0.88, 0.78), smoothstep(0.2, 1.0, toCenter));
        float I = (band * (0.35 + 0.9 * clumps) * (1.0 - dust * 0.85) + glow * 0.3) * 0.03;
        gl_FragColor = vec4(tint * I * uOpacity, 1.0);
      }`,
    side: BackSide, depthWrite: false, blending: AdditiveBlending, transparent: true,
  });
  const dome = new Mesh(new SphereGeometry(320, 64, 32), milky);
  dome.renderOrder = -3;
  dome.frustumCulled = false;
  group.add(dome);

  return {
    group,
    setOpacity(v: number) {
      starMat.uniforms.uOpacity.value = v;
      milky.uniforms.uOpacity.value = v;
    },
  };
}

/**
 * A sun disc with a soft corona, far away in its true direction. The planet hides it by an
 * exact ray test per pixel (not by the depth buffer), so it sets behind the limb as a disc,
 * reddened and dimmed through the atmosphere, never as a clipped square.
 */
export function createSun(): { mesh: Mesh; place: (dir: Vector3, camera?: Vector3) => void } {
  const mat = new ShaderMaterial({
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vWorld;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vWorld;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        // Closest approach of the line of sight to the centre of the Earth, in planet radii.
        vec3 d = normalize(vWorld - cameraPosition);
        float t = -dot(cameraPosition, d);
        float miss = t > 0.0 ? length(cameraPosition + d * t) : length(cameraPosition);
        float clear = smoothstep(1.0, 1.035, miss);
        // Grazing the atmosphere the light reddens before it goes.
        vec3 tint = mix(vec3(1.0, 0.45, 0.18), vec3(1.0, 0.94, 0.84), smoothstep(1.0, 1.05, miss));
        float disc = smoothstep(0.12, 0.10, r) * 14.0;
        float corona = exp(-r * 7.0) * 1.6 + exp(-r * 2.6) * 0.18;
        gl_FragColor = vec4(tint * (disc + corona) * smoothstep(1.0, 0.6, r) * clear, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true,
  });
  // A camera-facing quad.
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  geo.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), 2));
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return {
    mesh,
    /** In its direction from wherever the camera is: the Sun is at infinity. */
    place(dir: Vector3, camera?: Vector3) {
      mesh.position.copy(dir).multiplyScalar(150);
      if (camera) mesh.position.add(camera);
      mesh.scale.setScalar(9);
    },
  };
}
