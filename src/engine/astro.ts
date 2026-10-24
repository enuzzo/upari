import { Vector3 } from 'three';

// Earth-fixed frame shared by every object (matches three's SphereGeometry UVs):
// lon 0 → +X, lon 90°E → −Z, north pole → +Y.
export const DEG = Math.PI / 180;

export function lonLatToVec(lon: number, lat: number, r = 1, out = new Vector3()): Vector3 {
  const la = lat * DEG, lo = lon * DEG;
  return out.set(Math.cos(la) * Math.cos(lo) * r, Math.sin(la) * r, -Math.cos(la) * Math.sin(lo) * r);
}

export function vecToLonLat(v: Vector3): { lon: number; lat: number } {
  const n = v.clone().normalize();
  return { lon: Math.atan2(-n.z, n.x) / DEG, lat: Math.asin(Math.max(-1, Math.min(1, n.y))) / DEG };
}

const J2000 = Date.UTC(2000, 0, 1, 12);

/** Greenwich mean sidereal time, radians. */
export function gmst(date: Date): number {
  const d = (date.getTime() - J2000) / 86400e3;
  return ((((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24) * 15 * DEG;
}

/** Sub-solar point (where the Sun is at the zenith), degrees. */
export function subsolarPoint(date: Date): { lon: number; lat: number } {
  const d = (date.getTime() - J2000) / 86400e3;
  const g = (357.529 + 0.98560028 * d) * DEG;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const e = (23.439 - 0.00000036 * d) * DEG;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  let lon = (ra - gmst(date)) / DEG;
  lon = ((lon + 540) % 360) - 180;
  return { lon, lat: dec / DEG };
}

export function sunDirection(date: Date, out = new Vector3()): Vector3 {
  const s = subsolarPoint(date);
  return lonLatToVec(s.lon, s.lat, 1, out);
}

export function greatCircleKm(a: { lon: number; lat: number }, b: { lon: number; lat: number }): number {
  const va = lonLatToVec(a.lon, a.lat), vb = lonLatToVec(b.lon, b.lat);
  return Math.acos(Math.max(-1, Math.min(1, va.dot(vb)))) * 6371;
}
