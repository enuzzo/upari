import { BufferAttribute, BufferGeometry, Points, ShaderMaterial, type IUniform } from 'three';

// The Earth in miniature, for shots where the planet is a speck beside something huge (the Sun
// to scale, the Moon's orbit): a small globe drawn as a point sprite, a constant few dozen pixels
// at any distance, with the real day texture turned as the camera sees it and lit by the Sun
// (the night side keeps its city lights),
// a thin light stroke and a soft shadow so it reads over the Sun's face and over black space.
// The sprite is transparent outside the globe: its alpha follows what is drawn (an alpha of 1
// everywhere painted a black square around the old ring when it crossed the Sun).

export function createEarthRing(earth: { uDay: IUniform; uNight: IUniform; uSun: IUniform }) {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
  const material = new ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio, 2) }, uDay: earth.uDay, uNight: earth.uNight, uSun: earth.uSun },
    vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 48.0 * uPixelRatio; }`,
    fragmentShader: /* glsl */ `
      #define PI 3.141592653589793
      uniform float uOpacity;
      uniform sampler2D uDay, uNight;
      uniform vec3 uSun;
      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        p.y = -p.y;
        float r = length(p);
        const float R = 0.56;
        vec3 col = vec3(0.0);
        float globe = 1.0 - smoothstep(R - 0.04, R, r);
        if (r < R) {
          // The sphere seen by the camera: its normal in view space, back to the world.
          vec2 q = p / R;
          vec3 nv = vec3(q, sqrt(max(0.0, 1.0 - dot(q, q))));
          vec3 n = normalize((vec4(nv, 0.0) * viewMatrix).xyz);
          vec2 uv = vec2(atan(-n.z, n.x) / (2.0 * PI) + 0.5, asin(clamp(n.y, -1.0, 1.0)) / PI + 0.5);
          vec3 albedo = texture2D(uDay, uv).rgb;
          float lit = clamp(dot(n, normalize(uSun)) * 1.2 + 0.1, 0.0, 1.0);
          // Seen from the night side (from behind, against the Sun) the cities still show.
          vec3 lights = texture2D(uNight, uv).rgb * vec3(1.0, 0.82, 0.55) * 1.6 * (1.0 - smoothstep(0.0, 0.25, lit));
          col = albedo * (0.14 + 1.15 * lit) + lights + vec3(0.3, 0.55, 1.0) * pow(1.0 - nv.z, 3.0) * 0.55 * (0.3 + lit);
        }
        // A thin light stroke just outside the globe, and a soft dark shadow below everything.
        float stroke = exp(-pow((r - (R + 0.07)) / 0.028, 2.0)) * 0.9;
        float shadow = (1.0 - smoothstep(R, 1.0, r)) * 0.6;
        vec3 c = col * globe + vec3(0.88, 0.94, 1.0) * stroke;
        float a = max(max(globe, stroke), shadow);
        gl_FragColor = vec4(c / max(a, 0.001), a * uOpacity);
      }`,
    depthTest: false, depthWrite: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  points.visible = false;
  return { points, material };
}
