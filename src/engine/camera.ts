import { PerspectiveCamera, Vector3, Quaternion, MathUtils } from 'three';
import { DEG, lonLatToVec } from './astro';

/** Where the camera looks: a point on the ground, how far away, how tilted. */
export interface Shot {
  lon: number;
  lat: number;
  /** Distance from the ground target, in planet radii. */
  dist: number;
  /** 0 = straight down, up to ~70° = towards the horizon. */
  tilt?: number;
  /** Degrees clockwise from north. */
  heading?: number;
}

const MIN_DIST = 0.0035;
const MAX_DIST = 9;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export class CameraRig {
  readonly camera: PerspectiveCamera;
  lon = 10;
  lat = 30;
  dist = 2.9;
  tilt = 0;
  heading = 0;
  /** Degrees of longitude per second while idle (cinematic drift). */
  drift = 0;
  /** Horizontal shift of the planet on screen, fraction of the width (positive = right). */
  frameShift = 0;
  private frameShiftTarget = 0;
  private vel = { lon: 0, lat: 0, zoom: 0 };
  private flight: null | { from: Required<Shot>; to: Required<Shot>; t: number; dur: number; arc: number; resolve: () => void } = null;
  /** Following a moving object (the station) instead of a place on the ground. */
  private focus: null | {
    target: () => { pos: Vector3; fwd: Vector3 };
    dist: number; yaw: number; pitch: number;
    from: { dir: Vector3; dist: number; quat: Quaternion };
    t: number; dur: number; resolve: () => void;
  } = null;
  /** After leaving the focus, the view turns smoothly back to the ground. */
  private settle: null | { quat: Quaternion; t: number } = null;
  private dragging = false;
  private tiltLocked = false;
  private last = { x: 0, y: 0 };
  onUserInput: () => void = () => {};
  private width = 1;
  private height = 1;

  constructor(private dom: HTMLElement) {
    this.camera = new PerspectiveCamera(30, 1, 0.0005, 400);
    this.bind();
  }

  get altitudeKm() { return this.dist * 6371; }
  get busy() { return !!this.flight || !!this.focus; }
  get focused() { return !!this.focus; }

  /**
   * Fly to a moving object and stay with it: `dist` in planet radii, seen from behind
   * (yaw, degrees) and above (pitch, degrees), with the horizon in frame.
   */
  focusOn(target: () => { pos: Vector3; fwd: Vector3 }, opts: { dist: number; yaw?: number; pitch?: number }, seconds = 10): Promise<void> {
    this.flight?.resolve();
    this.flight = null;
    this.focus?.resolve();
    const p = target().pos;
    const off = this.camera.position.clone().sub(p);
    return new Promise((resolve) => {
      this.focus = {
        target, dist: opts.dist, yaw: (opts.yaw ?? 0) * DEG, pitch: (opts.pitch ?? 20) * DEG,
        from: { dir: off.clone().normalize(), dist: off.length(), quat: this.camera.quaternion.clone() },
        t: 0, dur: seconds, resolve,
      };
    });
  }

  /** Back to the ground-based camera, from wherever the focus left it. */
  private unfocus() {
    const f = this.focus;
    if (!f) return;
    this.focus = null;
    const cam = this.camera.position;
    const { lon, lat } = { lon: Math.atan2(-cam.z, cam.x) / DEG, lat: Math.asin(MathUtils.clamp(cam.y / cam.length(), -1, 1)) / DEG };
    Object.assign(this, { lon, lat, dist: Math.max(MIN_DIST, cam.length() - 1), tilt: 0, heading: 0 });
    this.tiltLocked = false;
    this.settle = { quat: this.camera.quaternion.clone(), t: 0 };
    f.resolve();
  }

  resize(w: number, h: number) {
    this.width = w; this.height = h;
    this.camera.aspect = w / h;
    this.applyOffset();
  }

  /** `now` places the planet at once instead of sliding it there. */
  setFrameShift(v: number, now = false) {
    this.frameShiftTarget = v;
    if (now) { this.frameShift = v; this.applyOffset(); }
  }

  private applyOffset() {
    const off = -this.frameShift * this.width;
    if (Math.abs(off) < 0.5) this.camera.clearViewOffset();
    else this.camera.setViewOffset(this.width, this.height, off, 0, this.width, this.height);
    this.camera.updateProjectionMatrix();
  }

  current(): Required<Shot> {
    return { lon: this.lon, lat: this.lat, dist: this.dist, tilt: this.tilt, heading: this.heading };
  }

  /** Fly along the great circle, climbing when the journey is long. */
  flyTo(shot: Shot, seconds?: number): Promise<void> {
    this.unfocus();
    this.flight?.resolve();
    const from = this.current();
    this.tiltLocked = shot.tilt !== undefined;
    const to: Required<Shot> = { tilt: 0, heading: 0, ...shot };
    // Shortest way round in longitude and heading.
    while (to.lon - from.lon > 180) to.lon -= 360;
    while (to.lon - from.lon < -180) to.lon += 360;
    while (to.heading - from.heading > 180) to.heading -= 360;
    while (to.heading - from.heading < -180) to.heading += 360;
    const a = lonLatToVec(from.lon, from.lat), b = lonLatToVec(to.lon, to.lat);
    const angle = Math.acos(MathUtils.clamp(a.dot(b), -1, 1));
    const dur = seconds ?? MathUtils.clamp(2.2 + angle * 1.6 + Math.abs(Math.log(to.dist / from.dist)) * 0.5, 2.4, 7);
    const arc = Math.max(0, Math.log(Math.min(MAX_DIST, 1.2 + angle * 1.1) / Math.max(from.dist, to.dist))) * Math.min(1, angle * 1.4);
    this.vel = { lon: 0, lat: 0, zoom: 0 };
    return new Promise((resolve) => { this.flight = { from, to, t: 0, dur, arc, resolve }; });
  }

  cancelFlight() {
    this.unfocus();
    if (!this.flight) return;
    const r = this.flight.resolve;
    this.flight = null;
    r();
  }

  update(dt: number) {
    this.frameShift += (this.frameShiftTarget - this.frameShift) * Math.min(1, dt * 2.2);
    if (this.focus) {
      this.updateFocus(dt);
      this.applyOffset();
      return;
    }
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = ease(f.t);
      const qa = new Quaternion(), va = lonLatToVec(f.from.lon, f.from.lat), vb = lonLatToVec(f.to.lon, f.to.lat);
      // Slerp the ground target on the sphere.
      const axis = new Vector3().crossVectors(va, vb);
      const ang = Math.acos(MathUtils.clamp(va.dot(vb), -1, 1));
      let p = va.clone();
      if (axis.lengthSq() > 1e-10) { qa.setFromAxisAngle(axis.normalize(), ang * e); p = va.clone().applyQuaternion(qa); }
      this.lat = Math.asin(MathUtils.clamp(p.y, -1, 1)) / DEG;
      this.lon = Math.atan2(-p.z, p.x) / DEG;
      const ld = MathUtils.lerp(Math.log(f.from.dist), Math.log(f.to.dist), easeSine(f.t)) + f.arc * Math.sin(Math.PI * f.t);
      this.dist = Math.exp(ld);
      this.tilt = MathUtils.lerp(f.from.tilt, f.to.tilt, e);
      this.heading = MathUtils.lerp(f.from.heading, f.to.heading, e);
      if (f.t >= 1) { this.flight = null; this.lon = f.to.lon; f.resolve(); }
    } else {
      if (!this.dragging) {
        this.lon += this.vel.lon * dt;
        this.lat += this.vel.lat * dt;
        const k = Math.exp(-dt * 3.2);
        this.vel.lon *= k; this.vel.lat *= k;
        this.dist *= Math.exp(this.vel.zoom * dt);
        this.vel.zoom *= Math.exp(-dt * 6);
        this.lon += this.drift * dt;
      }
      this.dist = MathUtils.clamp(this.dist, MIN_DIST, MAX_DIST);
      this.lat = MathUtils.clamp(this.lat, -85, 85);
      // Close to the ground, lean towards the horizon like an aircraft window.
      const autoTilt = MathUtils.clamp(1 - Math.log(this.dist / 0.006) / Math.log(0.35 / 0.006), 0, 1);
      if (!this.tiltLocked) this.tilt += (autoTilt * 62 - this.tilt) * Math.min(1, dt * 2.5);
    }
    this.lon = ((this.lon + 540) % 360) - 180;
    this.place();
    if (this.settle) {
      this.settle.t = Math.min(1, this.settle.t + dt / 0.9);
      this.camera.quaternion.slerpQuaternions(this.settle.quat, this.camera.quaternion.clone(), easeSine(this.settle.t));
      if (this.settle.t >= 1) this.settle = null;
    }
    this.applyOffset();
  }

  private updateFocus(dt: number) {
    const f = this.focus!;
    f.t = Math.min(1, f.t + dt / f.dur);
    const e = ease(f.t);
    const { pos, fwd } = f.target();
    const up = pos.clone().normalize();
    const ahead = fwd.clone().addScaledVector(up, -fwd.dot(up)).normalize();
    const side = new Vector3().crossVectors(up, ahead);
    // Behind and above the object, looking at it: the Earth fills the lower part of the frame.
    const want = ahead.clone().multiplyScalar(-Math.cos(f.pitch) * Math.cos(f.yaw))
      .addScaledVector(side, Math.cos(f.pitch) * Math.sin(f.yaw)).addScaledVector(up, Math.sin(f.pitch)).normalize();
    const dir = f.from.dir.clone();
    const ang = Math.acos(MathUtils.clamp(dir.dot(want), -1, 1));
    if (ang > 1e-5) dir.applyQuaternion(new Quaternion().setFromAxisAngle(new Vector3().crossVectors(dir, want).normalize(), ang * e));
    const dist = Math.exp(MathUtils.lerp(Math.log(f.from.dist), Math.log(f.dist), easeSine(f.t)));
    this.camera.position.copy(pos).addScaledVector(dir, dist);
    this.camera.up.copy(up);
    this.camera.lookAt(pos);
    // Ease out of the previous framing during the first part of the approach.
    const k = MathUtils.smoothstep(f.t, 0, 0.25);
    if (k < 1) this.camera.quaternion.slerpQuaternions(f.from.quat, this.camera.quaternion.clone(), k);
    const near = Math.max(0.0004, Math.min(0.05, (this.camera.position.length() - 1) * 0.3));
    if (Math.abs(near - this.camera.near) / this.camera.near > 0.05) { this.camera.near = near; this.camera.updateProjectionMatrix(); }
    if (f.t >= 1 && f.from.dist !== f.dist) { f.from.dist = f.dist; f.resolve(); }
  }

  private place() {
    const target = lonLatToVec(this.lon, this.lat);
    const up = target.clone().normalize();
    const east = new Vector3(up.z, 0, -up.x).normalize();
    if (east.lengthSq() < 1e-6) east.set(0, 0, -1);
    const north = new Vector3().crossVectors(up, east);
    const h = this.heading * DEG, t = this.tilt * DEG;
    const forward = north.clone().multiplyScalar(Math.cos(h)).addScaledVector(east, Math.sin(h));
    const dir = up.clone().multiplyScalar(Math.cos(t)).addScaledVector(forward, -Math.sin(t));
    this.camera.position.copy(target).addScaledVector(dir, this.dist);
    // Never sink under the clouds.
    const minR = 1.0018;
    if (this.camera.position.length() < minR) this.camera.position.setLength(minR);
    this.camera.up.copy(t > 0.02 ? up : forward);
    // Look slightly above the target when tilted so the horizon sits in frame.
    const look = target.clone().addScaledVector(up, this.dist * Math.sin(t) * 0.18);
    this.camera.lookAt(look);
    const near = Math.max(0.0004, Math.min(0.05, (this.camera.position.length() - 1) * 0.3));
    if (Math.abs(near - this.camera.near) / this.camera.near > 0.05) { this.camera.near = near; this.camera.updateProjectionMatrix(); }
  }

  private bind() {
    const el = this.dom;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.dragging = true;
      this.last = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
      this.cancelFlight();
      this.tiltLocked = false;
      this.vel.lon = this.vel.lat = 0;
      this.onUserInput();
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.last.x, dy = e.clientY - this.last.y;
      this.last = { x: e.clientX, y: e.clientY };
      const k = (this.dist / this.height) * 34 / Math.max(0.3, Math.cos(this.lat * DEG) * 0.5 + 0.5);
      const h = this.heading * DEG;
      const dLon = (-dx * Math.cos(h) - dy * Math.sin(h)) * k / Math.max(0.2, Math.cos(this.lat * DEG));
      const dLat = (dy * Math.cos(h) - dx * Math.sin(h)) * k;
      this.lon += dLon; this.lat += dLat;
      this.vel.lon = dLon * 60; this.vel.lat = dLat * 60;
    });
    const end = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      el.releasePointerCapture?.(e.pointerId);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (this.focus && this.focus.t >= 1) {
        // Close to the station the wheel moves towards it or away, without leaving it.
        this.onUserInput();
        this.focus.dist = this.focus.from.dist = MathUtils.clamp(this.focus.dist * Math.exp(MathUtils.clamp(delta, -120, 120) * 0.004), 2e-6, 0.02);
        return;
      }
      this.cancelFlight();
      this.tiltLocked = false;
      this.onUserInput();
      this.vel.zoom += MathUtils.clamp(delta, -120, 120) * 0.022;
    }, { passive: false });
  }

  zoomBy(factor: number) {
    this.cancelFlight();
    this.vel.zoom += Math.log(factor) * 5;
  }
}
