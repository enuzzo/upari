import { AmbientLight, Box3, DirectionalLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer, type Object3D } from 'three';

// A small window with the spacecraft itself: NASA's 3D model of Voyager, turning slowly, lit
// from one side as by a far Sun. Its own little renderer, drawing only while it is shown.

const $ = (id: string) => document.getElementById(id)!;
let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null, camera: PerspectiveCamera | null = null, model: Object3D | null = null;
let loading: Promise<void> | null = null;
let shown = false, last = 0;

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
  const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/loaders/DRACOLoader.js'),
  ]);
  const draco = new DRACOLoader().setDecoderPath('draco/');
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('models/voyager.glb');
  draco.dispose();
  model = gltf.scene;
  // Centred, a size the camera frames.
  const box = new Box3().setFromObject(model), size = box.getSize(new Vector3()), c = box.getCenter(new Vector3());
  model.position.sub(c);
  const k = 2 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(k);
  model.position.multiplyScalar(k);
  scene.add(model);
  camera.position.set(0, 0.5, 3.7);
  camera.lookAt(0, 0, 0);
}

function frame(now: number) {
  if (!shown || !renderer || !scene || !camera) return;
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  if (model) model.rotation.y += dt * 0.35;
  const canvas = renderer.domElement, w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/** Show the window with the spacecraft, or hide it. */
export function showProbe(on: boolean) {
  const box = $('probe-window');
  if (on === shown) return;
  shown = on;
  box.classList.toggle('on', on);
  if (!on) return;
  loading ??= build().catch(() => { box.classList.remove('on'); });
  void loading.then(() => { last = 0; requestAnimationFrame(frame); });
}
