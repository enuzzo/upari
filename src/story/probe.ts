import { AmbientLight, Box3, DirectionalLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer, type Object3D } from 'three';
import { t } from '../i18n';

// The spacecraft themselves, large beside the story: NASA's 3D models of the probes that are
// leaving the Sun behind, turning slowly, lit from one side as by a far Sun. A click shows the
// next one (Voyager 1, Voyager 2, Pioneer 10); a drag turns it. The window takes the free space
// between the caption and the chart when there is enough of it, otherwise the corner above the
// caption. Its own little renderer, drawing only while it is shown.

const $ = (id: string) => document.getElementById(id)!;
const MODELS = [
  { file: 'models/voyager.glb', caption: () => t.voyager.modelV1, probe: 'v1' },
  { file: 'models/voyager-b.glb', caption: () => t.voyager.modelV2, probe: 'v2' },
  { file: 'models/pioneer10.glb', caption: () => t.voyager.modelPioneer, probe: '' },
];
let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null, camera: PerspectiveCamera | null = null, model: Object3D | null = null;
let loading: Promise<void> | null = null;
let shown = false, last = 0, which = 0, spin = 0, drag: { x: number; y: number; moved: boolean } | null = null;
const cache = new Map<string, Promise<Object3D>>();

async function loadModel(file: string): Promise<Object3D> {
  let p = cache.get(file);
  if (!p) {
    p = (async () => {
      const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/loaders/DRACOLoader.js'),
      ]);
      const draco = new DRACOLoader().setDecoderPath('draco/');
      const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(file);
      draco.dispose();
      const m = gltf.scene;
      // Centred, a size the camera frames.
      const box = new Box3().setFromObject(m), size = box.getSize(new Vector3()), c = box.getCenter(new Vector3());
      m.position.sub(c);
      const k = 2 / Math.max(size.x, size.y, size.z);
      m.scale.setScalar(k);
      m.position.multiplyScalar(k);
      return m;
    })();
    cache.set(file, p);
  }
  return p;
}

async function show(i: number) {
  which = i;
  const m = MODELS[i];
  $('probe-caption').textContent = `${m.caption()} · ${t.voyager.modelHint}`;
  document.body.dataset.probe = m.probe;
  const next = await loadModel(m.file).catch(() => null);
  if (!next || !scene || which !== i) return;
  if (model) scene.remove(model);
  model = next;
  model.rotation.set(0.25, spin, 0);
  scene.add(model);
}

async function build() {
  const canvas = $('probe-canvas') as HTMLCanvasElement;
  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new Scene();
  camera = new PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new AmbientLight(0xb8c4d8, 0.5));
  const sun = new DirectionalLight(0xfff1dc, 2.6);
  sun.position.set(-4, 2, 3);
  scene.add(sun);
  camera.position.set(0, 0.4, 3.9);
  camera.lookAt(0, 0, 0);
  // A click shows the next probe; a drag turns this one.
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || !model) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    spin += dx * 0.01;
    model.rotation.x = Math.max(-1, Math.min(1, model.rotation.x + dy * 0.008));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { if (drag && !drag.moved) void show((which + 1) % MODELS.length); drag = null; });
  canvas.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void show((which + 1) % MODELS.length); } });
  await show(0);
}

/** The free space for the window: beside the whole caption, beside the narration under the
 *  title, or (when neither is wide enough) in the corner above the caption. */
function place() {
  const box = $('probe-window'), cap = $('probe-caption');
  const kicker = $('cap-kicker').getBoundingClientRect(), title = $('cap-title').getBoundingClientRect(), line = $('cap-line').getBoundingClientRect();
  const chart = $('chart').getBoundingClientRect();
  const capRight = Math.max(kicker.right, title.right, line.right), capTop = Math.min(kicker.top, title.top, line.top);
  const H = innerHeight, CAPTION = 64;
  const options: { x: number; y: number; w: number }[] = [];
  if (chart.width > 0) {
    // Beside the whole caption, centred on the screen.
    const gapA = chart.left - capRight - 48;
    if (gapA >= 210) { const w = Math.min(gapA, 520, H * 0.62); options.push({ x: capRight + 24 + (gapA - w) / 2, y: H / 2 - (w * 0.78 + CAPTION) / 2, w }); }
    // Beside the narration, under the title.
    const gapB = chart.left - line.right - 48, top = title.bottom + 20, room = H - 120 - top;
    if (gapB >= 210 && room > 200) { const w = Math.min(gapB, 520, (room - CAPTION) / 0.78); options.push({ x: line.right + 24 + (gapB - w) / 2, y: top, w }); }
  }
  const best = options.sort((a, b) => b.w - a.w)[0];
  const corner = !best || best.w < 200;
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 40;
  let { x, y, w } = corner ? { x: gutter, y: 96, w: Math.max(150, Math.min(440, (capTop - 96 - 40) / 0.78, innerWidth * 0.32)) } : best;
  box.style.left = `${Math.round(x)}px`;
  box.style.top = `${Math.round(y)}px`;
  box.style.width = `${Math.round(w)}px`;
  cap.hidden = false;
  // Above the caption, the window and its line must end before the caption begins.
  if (corner) {
    for (let k = 0; k < 6 && box.getBoundingClientRect().bottom > capTop - 18 && w > 150; k++) {
      w = Math.max(150, w - (box.getBoundingClientRect().bottom - (capTop - 18)) / 0.78 - 4);
      box.style.width = `${Math.round(w)}px`;
    }
    cap.hidden = box.getBoundingClientRect().bottom > capTop - 18;
  }
}

function frame(now: number) {
  if (!shown || !renderer || !scene || !camera) return;
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  if (!drag) spin += dt * 0.3;
  if (model) model.rotation.y = spin;
  const canvas = renderer.domElement, w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

addEventListener('resize', () => { if (shown) place(); });

/** Show the window with the spacecraft, or hide it. */
export function showProbe(on: boolean) {
  const box = $('probe-window');
  if (on === shown) return;
  shown = on;
  box.classList.toggle('on', on);
  if (!on) { delete document.body.dataset.probe; return; }
  // After the caption and the chart have taken their places.
  setTimeout(place, 1300);
  setTimeout(place, 3600);
  place();
  loading ??= build().catch(() => { box.classList.remove('on'); });
  void loading.then(() => { last = 0; requestAnimationFrame(frame); });
}
