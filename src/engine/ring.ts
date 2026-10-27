import { BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';

// A thin ring around the Earth, for shots where the planet is a speck beside something huge
// (the Sun to scale, the Moon's orbit): it stays a few dozen pixels wide at any distance.

export function createEarthRing() {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
  const material = new ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 46.0 * uPixelRatio; }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity, uTime;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float ring = exp(-pow((r - 0.78) / 0.05, 2.0));
        float breathe = 0.75 + 0.25 * sin(uTime * 2.0);
        gl_FragColor = vec4(vec3(0.75, 0.88, 1.0) * ring * breathe * uOpacity, 1.0);
      }`,
    depthTest: false, depthWrite: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  points.visible = false;
  return { points, material };
}
