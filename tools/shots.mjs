// Visual QA: opens Upari in headless Chrome, steps the engine deterministically
// through the chapters and saves full-page screenshots.
// Chrome is closed over DevTools (Browser.close) and its temp profile removed.
// Usage: node tools/shots.mjs <url> <outDir> [chapter indexes...|intro|explore]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [url = 'http://127.0.0.1:4181/', out = 'shots', ...which] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'upari-shots-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--window-size=1600,1000', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--no-first-run'], { stdio: 'ignore' });
let exited = false;
chrome.once('exit', () => { exited = true; });

async function close() {
  try {
    if (!exited) {
      const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      const ws = new WebSocket(ver.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
      ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    }
  } catch { /* fall through to kill */ }
  for (let w = 0; !exited && w < 5000; w += 100) await sleep(100);
  if (!exited) { chrome.kill(); for (let w = 0; !exited && w < 2000; w += 100) await sleep(100); }
  rmSync(profile, { recursive: true, force: true });
}

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch { /* not ready */ }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description ?? ''));
  });
  const send = (method, params = {}) => new Promise((r) => { const k = ++id; pending.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
    return r.result?.result?.value;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
    writeFileSync(join(out, `${name}.jpg`), Buffer.from(r.result.data, 'base64'));
    console.log('saved', name);
  };
  await send('Runtime.enable');
  await send('Page.enable');
  // W and H set another viewport (a phone: W=390 H=844 DPR=3 MOBILE=1).
  await send('Emulation.setDeviceMetricsOverride', { width: Number(process.env.W || 1600), height: Number(process.env.H || 1000), deviceScaleFactor: Number(process.env.DPR || 1), mobile: !!process.env.MOBILE });
  // Frame gaps from the very first frame (read with eval:JSON.stringify(__gaps)).
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__gaps = []; (() => { let last = 0; const f = (t) => { if (last && t - last > 40) __gaps.push([Math.round(last), Math.round(t - last)]); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); })();` });
  await send('Page.navigate', { url });
  for (let i = 0; i < 100; i++) { await sleep(300); if (await evaluate('document.body.classList.contains("ready")')) break; }
  if (!process.env.EARLY) await sleep(1500);
  console.log('gl:', await evaluate(`(() => { const gl = document.createElement('canvas').getContext('webgl2'); const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; })()`));
  const list = which.length ? which : ['intro', ...Array.from({ length: 11 }, (_, i) => String(i))];
  for (const w of list) {
    if (w === 'intro') { await evaluate('window.upari ? upari.advance(4) : 0'); await shot('00-intro'); continue; }
    if (w.startsWith('eval:')) { console.log(await evaluate(w.slice(5))); continue; }
    if (w.startsWith('shot:')) { await shot(w.slice(5)); continue; }
    if (w.startsWith('adv:')) { await evaluate(`upari.advance(${Number(w.slice(4))})`); continue; }
    if (w.startsWith('wait:')) { await sleep(Number(w.slice(5)) * 1000); continue; }
    if (w.startsWith('mouse:')) {
      const [x, y] = w.slice(6).split(',').map(Number);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      continue;
    }
    const i = Number(w);
    await evaluate(`upari.jump(${i})`);
    await sleep(2500);
    await evaluate('upari.advance(9)');
    await sleep(1500);
    await evaluate('upari.advance(0.2)');
    await shot(`${String(i + 1).padStart(2, '0')}-chapter`);
  }
  if (logs.length) console.log('console:\n' + logs.slice(0, 30).join('\n'));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await close();
}
