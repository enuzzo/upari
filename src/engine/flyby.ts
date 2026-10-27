import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, Mesh, Points, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { gmst } from './astro';

// An asteroid passing by, as it really goes: its path around the Earth for three days before
// and after the closest approach, and the Moon's orbit for scale, both from JPL Horizons
// (geocentric, equatorial). They live in the frame of the stars, turned like the sky.

export interface Track { start: string; stepHours: number; xyz: [number, number, number][] }

/** Equatorial (x to the equinox, z north) to the scene's axes (north up). */
const scene = ([x, y, z]: [number, number, number], out = new Vector3()) => out.set(x, z, -y);

function dotted(track: Track, color: [number, number, number], size: number) {
  const n = track.xyz.length;
  const pos = new Float32Array(n * 3), along = new Float32Array(n);
  const v = new Vector3();
  track.xyz.forEach((p, i) => { scene(p, v); pos.set([v.x, v.y, v.z], i * 3); along[i] = i / Math.max(1, n - 1); });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('along', new BufferAttribute(along, 1));
  const material = new ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uHead: { value: -1 }, uColor: { value: new Vector3(...color) }, uSize: { value: size * Math.min(devicePixelRatio, 2) } },
    vertexShader: /* glsl */ `
      attribute float along;
      uniform float uHead, uSize;
      varying float vGlow;
      void main() {
        // A travelling head when uHead is set; otherwise an even dotted line.
        float behind = uHead - along;
        vGlow = uHead < 0.0 ? 0.55 : 0.45 + (behind >= 0.0 ? exp(-behind * 14.0) * 2.2 : 0.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uHead >= 0.0 && behind >= 0.0 && behind < 0.012 ? uSize * 3.0 : uSize;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; uniform vec3 uColor;
      varying float vGlow;
      void main() {
        float q = length(gl_PointCoord - 0.5) * 2.0;
        gl_FragColor = vec4(uColor * exp(-q * q * 3.0) * (1.0 - smoothstep(0.85, 1.0, q)) * vGlow * uOpacity, 1.0);
      }`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const points = new Points(geo, material);
  points.frustumCulled = false;
  return { points, material };
}

/** The part of the pass near the Earth (within ~2 lunar distances), resampled every ten minutes. */
function nearPart(path: Track): Track {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < path.xyz.length - 1; i++) {
    const a = path.xyz[i], b = path.xyz[i + 1];
    for (let k = 0; k < 6; k++) {
      const f = k / 6, p: [number, number, number] = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      if (Math.hypot(...p) < 125) pts.push(p);
    }
  }
  return { start: path.start, stepHours: path.stepHours / 6, xyz: pts.length > 2 ? pts : path.xyz };
}

export function createFlyby(path: Track, moon: Track) {
  const group = new Group();
  group.visible = false;
  const rock = dotted(nearPart(path), [1.0, 0.62, 0.28], 4.5);
  const orbit = dotted(moon, [0.75, 0.82, 0.95], 2);
  group.add(orbit.points, rock.points);
  // The Moon, where it is now, lit by the Sun.
  const moonMat = new ShaderMaterial({
    uniforms: { uSun: { value: new Vector3(1, 0, 0) }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `varying vec3 vN; void main() { vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun; uniform float uOpacity; varying vec3 vN;
      void main() { float l = max(dot(vN, uSun), 0.0); gl_FragColor = vec4(vec3(0.78, 0.76, 0.72) * (0.04 + 1.1 * l) * uOpacity, 1.0); }`,
    transparent: true,
  });
  const moonBall = new Mesh(new SphereGeometry(0.2727, 32, 16), moonMat);
  group.add(moonBall);

  const at = (track: Track, time: number) => {
    const k = (time - Date.parse(track.start)) / (track.stepHours * 3600e3);
    const i = Math.max(0, Math.min(track.xyz.length - 2, Math.floor(k))), f = Math.max(0, Math.min(1, k - i));
    const a = scene(track.xyz[i]), b = scene(track.xyz[i + 1]);
    return a.lerp(b, f);
  };
  /** The point of closest approach, in the frame of the stars. */
  let closest = scene(path.xyz[0]);
  for (const p of path.xyz) { const v = scene(p); if (v.length() < closest.length()) closest = v; }

  return {
    group,
    /** Points in the Earth-fixed frame (for labels): the Moon now, the closest approach. */
    fixed(date: Date) {
      const turn = (v: Vector3) => v.clone().applyAxisAngle(new Vector3(0, 1, 0), -gmst(date));
      return { moon: turn(at(moon, date.getTime())), closest: turn(closest) };
    },
    update(date: Date, sun: Vector3, opacity: number, clock: number) {
      group.visible = opacity > 0.003;
      if (!group.visible) return;
      group.rotation.y = -gmst(date);
      moonBall.position.copy(at(moon, date.getTime()));
      // Normals are taken to the scene's frame in the shader: the Sun as the globe has it.
      moonMat.uniforms.uSun.value.copy(sun);
      moonMat.uniforms.uOpacity.value = opacity;
      orbit.material.uniforms.uOpacity.value = opacity * 0.7;
      rock.material.uniforms.uOpacity.value = opacity;
      // The six days of the pass replayed in a few seconds, then again.
      rock.material.uniforms.uHead.value = clock;
    },
  };
}
